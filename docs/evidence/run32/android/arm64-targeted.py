"""Identify the AAB-derived ARM64 package set and check ordinary startup on the bridge."""
from pathlib import Path
import argparse
import hashlib
import json
import re
import subprocess
import sys
import time
import xml.etree.ElementTree as ET
import zipfile

here = Path(__file__).resolve().parent
root = here.parents[3]
sys.path.insert(0, str(root / "scripts"))
from android_runtime_abi import installed_abi
from android_test_tools import build_tool

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("scope", choices=["prepare", "startup"])
args = parser.parse_args()
artifacts = root / "artifacts/run32"
splits = artifacts / "targeted-splits"
target = "com.natophonetics.app"
serial = "emulator-5584"
adb = ["adb", "-s", serial]
sha = lambda data: hashlib.sha256(data).hexdigest()


def save(file, value):
    file.write_text(json.dumps(value, indent=2) + "\n", encoding="utf-8")


def run(*cmd):
    return subprocess.check_output(list(map(str, cmd)), text=True, stderr=subprocess.STDOUT, timeout=150).strip()


def prepare():
    splits.mkdir(exist_ok=False)
    package_hashes, natives, code = {}, {}, {}
    source = artifacts / "universal/app-release.aab"
    with zipfile.ZipFile(artifacts / "api36-arm64-only.apks") as packages, zipfile.ZipFile(source) as aab:
        expected = {name.removeprefix("base/"): sha(aab.read(name)) for name in aab.namelist()
                    if name.startswith("base/lib/arm64-v8a/")}
        expected_code = {name.removeprefix("base/").removeprefix("dex/"): sha(aab.read(name)) for name in aab.namelist()
                         if name.startswith(("base/dex/classes", "base/assets/fonts/")) or name == "base/assets/index.android.bundle"}
        for member in packages.namelist():
            if not member.endswith(".apk"): continue
            path = splits / Path(member).name
            contents = packages.read(member)
            path.write_bytes(contents)
            package_hashes[path.name] = sha(contents)
            sign = run(*build_tool("apksigner"), "verify", "--print-certs", path)
            if re.findall(r"^Signer #\d+ certificate SHA-256 digest: ([0-9a-f]+)$", sign, re.M) != [
                    "fac61745dc0903786fb9ede62a962b399f7348f0bb6f899b8332667591033b9c"]:
                raise ValueError("Wrong split signer: " + path.name)
            with zipfile.ZipFile(path) as apk:
                for name in apk.namelist():
                    if name.startswith("lib/"):
                        if name in natives: raise ValueError("Duplicate native entry: " + name)
                        natives[name] = sha(apk.read(name))
                    if name in expected_code: code[name] = sha(apk.read(name))
    if len(expected) != 11 or natives != expected or code != expected_code or len(package_hashes) != 4:
        raise ValueError("Device-targeted APKs differ from the expected base, code or complete ARM64 ABI payload")
    save(here / "arm64-targeted-identity.json", {"aabSha256": sha(source.read_bytes()), "apkSha256": package_hashes,
         "nativeSha256": natives, "codeAndFontsSha256": code, "onlyAbi": "arm64-v8a", "passed": True})


def startup():
    if run(*adb, "emu", "avd", "name").splitlines()[0] != "NatoRun32":
        raise ValueError("Refusing an unexpected device")
    verified = json.loads((here / "arm64-targeted-identity.json").read_text())
    native_apks = {digest: name for name, digest in verified["apkSha256"].items()}
    out = here / "arm64-targeted-startup"
    shots = here.parent / "screenshots/android/arm64-targeted-startup"
    out.mkdir(exist_ok=False)
    shots.mkdir(parents=True, exist_ok=False)
    clock = run(*adb, "shell", "date", "+%s")
    result = {"serial": serial, "deviceEpochBefore": clock, "passed": False}
    try:
        paths = [splits / name for name in verified["apkSha256"]]
        (out / "install.log").write_text(run(*adb, "install-multiple", "-r", "--abi", "arm64-v8a", *paths))
        installed = {}
        for line in run(*adb, "shell", "pm", "path", target).splitlines():
            path = line.removeprefix("package:")
            digest = run(*adb, "shell", "sha256sum", path).split()[0]
            installed[native_apks[digest]] = path
        if set(installed) != set(native_apks.values()): raise ValueError("Installed split set changed")
        result["installedSplits"] = installed
        result["primaryCpuAbi"] = installed_abi(run(*adb, "shell", "dumpsys", "package", target))
        if result["primaryCpuAbi"] != "arm64-v8a": raise ValueError("Wrong split ABI")
        run(*adb, "shell", "am", "force-stop", target)
        result["launch"] = run(*adb, "shell", "am", "start", "-W", "-a", "android.intent.action.VIEW", "-d",
                               "natophonetics://converter", "-p", target)
        ready = False
        for i in range(5):
            remote = f"/sdcard/nato-run32-split-{clock}-{i}.xml"
            run(*adb, "shell", "uiautomator", "dump", remote)
            try:
                xml = run(*adb, "shell", "cat", remote)
            finally:
                run(*adb, "shell", "rm", "-f", remote)
            (out / f"hierarchy-{i}.xml").write_text(xml, encoding="utf-8")
            ready = any(n.get("content-desc") == "Text to convert" and n.get("package") == target for n in ET.fromstring(xml).iter())
            if ready: break
            time.sleep(.5)
        result["converterInputReached"] = ready
        result["passed"] = ready
    finally:
        result["resumedActivities"] = [line.strip() for line in run(*adb, "shell", "dumpsys", "activity", "activities").splitlines()
                                       if "topResumedActivity" in line or "mResumedActivity" in line]
        result["processIdsAtCapture"] = subprocess.run([*adb, "shell", "pidof", target], capture_output=True,
                                                       text=True, timeout=15).stdout.strip()
        png = subprocess.check_output([*adb, "exec-out", "screencap", "-p"], timeout=25)
        (shots / "ordinary-startup.png").write_bytes(png)
        result["screenshotSha256"] = sha(png)
        log = run(*adb, "shell", "logcat", "-b", "crash", "-d", "-v", "epoch", "-t", "350")
        recent = [s.lstrip() for s in log.splitlines() if s.split() and re.match(r"^\s*\d+\.\d+", s)
                  and float(s.split()[0]) >= int(clock)]
        (out / "crash.log").write_text("\n".join(recent) + "\n", encoding="utf-8")
        save(out / "result.json", result)
    if not result["passed"]: raise RuntimeError("The ARM64-targeted ordinary converter route did not start")


prepare() if args.scope == "prepare" else startup()
