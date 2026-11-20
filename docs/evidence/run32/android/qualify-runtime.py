"""Qualify one scope on the identified disposable emulator; retain failed attempts."""
from pathlib import Path
import argparse
import hashlib
import json
import re
import subprocess
import sys

here = Path(__file__).resolve().parent
root = here.parents[3]
sys.path.insert(0, str(root / "scripts"))
from android_runtime_abi import ABIS, check_runtime, installed_abi
from android_test_tools import build_tool

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("scope", choices=["install", "product", "composition", "fixture-full", "fixture-narrow",
                                     "matrix", "windows", "narrow-aligned"])
parser.add_argument("product", type=Path)
parser.add_argument("observer", type=Path)
parser.add_argument("serial")
parser.add_argument("abi", choices=ABIS)
parser.add_argument("attempt", help="New output directory name for this attempt")
parser.add_argument("--fixture", type=Path)
parser.add_argument("--dependency-root", type=Path, default=root,
                    help="Prepared release checkout from which the raster checker resolves sharp")
args = parser.parse_args()
if not re.fullmatch(r"[a-z0-9-]+", args.attempt) or not re.fullmatch(r"emulator-\d+", args.serial):
    parser.error("Expected an emulator serial and a simple new output directory name")
app = args.product.resolve(strict=True)
observer = args.observer.resolve(strict=True)
fixture = args.fixture.resolve(strict=True) if args.fixture else None
if args.scope.startswith("fixture-") and fixture is None:
    parser.error("Provide the separate fixture APK for this scope")
out = here / args.attempt
shots = here.parent / "screenshots/android" / args.attempt
if out.exists() or shots.exists():
    parser.error("This attempt already has evidence")
out.mkdir()
adb = ["adb", "-s", args.serial]
package = "com.natophonetics.app"
target = "com.natophonetics.fonttest"
report = {"scope": args.scope, "serial": args.serial, "requestedAbi": args.abi, "commands": [], "passed": False}


def read(*command):
    return subprocess.check_output([*adb, *command], text=True, timeout=45).strip()


def save(name, value):
    (out / name).write_text(json.dumps(value, indent=2) + "\n", encoding="utf-8")


def run(name, command, cwd=root):
    record = {"argv": list(map(str, command)), "cwd": str(cwd), "log": name + ".log"}
    report["commands"].append(record)
    with (out / record["log"]).open("wb") as log:
        result = subprocess.run(record["argv"], stdout=log, stderr=subprocess.STDOUT, cwd=cwd, timeout=1800)
    record["exit"] = result.returncode
    result.check_returncode()


def identity(name, apk):
    path = read("shell", "pm", "path", name).removeprefix("package:")
    digest = read("shell", "sha256sum", path).split()[0]
    if digest != hashlib.sha256(apk.read_bytes()).hexdigest():
        raise RuntimeError("Wrong installed bytes for " + name)
    result = {"path": path, "sha256": digest}
    if name == package:
        abi = installed_abi(read("shell", "dumpsys", "package", name))
        if abi != args.abi:
            raise RuntimeError(f"PackageManager selected {abi}, expected {args.abi}")
        result["primaryCpuAbi"] = abi
    return result


def install_product(log):
    run(log, [*adb, "install", "--no-incremental", "-r", "--abi", args.abi, app])
    return identity(package, app)


def tile_runtime(captures):
    mappings = json.loads(read("shell", "cat", "/sdcard/Android/data/com.natophonetics.app/files/tile-observer/runtime-libraries.json"))
    save("tile-process-mappings.json", mappings)
    pids = {json.loads(file.read_text())["runtimePid"] for file in captures.glob("*-native-layout.json")}
    if len(pids) != 1:
        raise RuntimeError(f"Expected one observation process, found {pids}")
    installed = identity(package, app)
    verified = check_runtime(app, installed["path"], installed["sha256"], installed["primaryCpuAbi"],
                             args.abi, mappings, pids.pop())
    save("tile-process-abi.json", verified)


try:
    if read("emu", "avd", "name").splitlines()[0] != "NatoRun32":
        raise RuntimeError("Expected the disposable Run32 emulator")
    report["device"] = {key: read("shell", "getprop", prop) for key, prop in
                        [("abi", "ro.product.cpu.abi"), ("abis", "ro.product.cpu.abilist"),
                         ("bridge", "ro.dalvik.vm.native.bridge"), ("api", "ro.build.version.sdk")]}
    report["signers"] = {}
    for name, artifact in [("product", app), ("observer", observer), ("fixture", fixture)]:
        if artifact is None: continue
        run(name + "-signature", [*build_tool("apksigner"), "verify", "--print-certs", artifact])
        log = (out / (name + "-signature.log")).read_text()
        signers = re.findall(r"^Signer #\d+ certificate SHA-256 digest: ([0-9a-f]{64})$", log, re.MULTILINE)
        if signers != ["fac61745dc0903786fb9ede62a962b399f7348f0bb6f899b8332667591033b9c"]:
            raise RuntimeError("Expected only the repository's public engineering signer for " + name)
        report["signers"][name] = {"sha256": hashlib.sha256(artifact.read_bytes()).hexdigest(),
                                   "certificateSha256": signers[0]}
    if args.scope == "install":
        report["installed"] = install_product("install-product")
        run("install-observer", [*adb, "install", "--no-incremental", "-r", observer])
    else:
        report["installed"] = identity(package, app)
    report["observer"] = identity(target, observer)
    runas = subprocess.run([*adb, "shell", "run-as", package, "id"], capture_output=True, text=True)
    if runas.returncode == 0 or "not debuggable" not in runas.stdout + runas.stderr:
        raise RuntimeError("Expected a non-debuggable product")
    report["nonDebuggable"] = True
    if args.scope == "composition":
        run("composition", [sys.executable, "scripts/run-android-font-instrumentation.py", observer,
                            app, shots, args.serial, "--external-evidence", "--abi", args.abi])
    elif args.scope.startswith("fixture-"):
        size = read("shell", "wm", "size")
        scale = read("shell", "settings", "get", "system", "font_scale")
        ime = read("shell", "settings", "get", "secure", "default_input_method")
        match = re.search(r"Override size: (\d+x\d+)", size)
        narrow = args.scope == "fixture-narrow"
        arguments = ["primary", "cold2"] if narrow else []
        data = out / "measurements"
        try:
            if narrow: read("shell", "wm", "size", "560x1000")
            run("fixture-collect", [sys.executable, "scripts/run-android-font-release-fixture.py", observer,
                                    fixture, data, args.serial, *arguments, "--abi", args.abi])
            run("fixture-gate", ["node", "scripts/check-android-font-release-fixture.cjs", data,
                                 *(["--primary-only"] if narrow else [])])
        finally:
            read("shell", "wm", "size", match[1] if match else "reset")
            if scale == "null":
                read("shell", "settings", "delete", "system", "font_scale")
            else:
                read("shell", "settings", "put", "system", "font_scale", scale)
            report["restoredProduct"] = install_product("restore-product")
            actual = (read("shell", "wm", "size"), read("shell", "settings", "get", "system", "font_scale"),
                      read("shell", "settings", "get", "secure", "default_input_method"))
            if actual != (size, scale, ime): raise RuntimeError("Fixture did not restore display, scale and IME")
    elif args.scope != "install":
        data = out / "measurements"
        collection = root / "docs/evidence/run31/android/observe-product.py"
        run("collect", [sys.executable, "-X", "utf8", collection, args.scope, app, observer,
                        args.serial, data, shots])
        if args.scope != "product":
            tile_runtime(data)
            mode = {"matrix": [], "windows": ["--windows"], "narrow-aligned": ["--narrow"]}[args.scope]
            run("native-gate", ["node", "scripts/check-android-release-tiles.cjs", data, *mode])
            if args.scope == "matrix":
                run("ink-gate", ["node", collection.with_name("check-extended-raster.cjs"), data, shots, out / "ink.json"],
                    cwd=args.dependency_root.resolve(strict=True))
    report["passed"] = True
finally:
    save("checkpoint.json", report)
print(json.dumps({"scope": args.scope, "passed": report["passed"], "abi": args.abi, "output": str(out)}))
