"""Inspect a locally built simulator archive and cold-launch its exact app on a fresh iPhone."""
import hashlib
import json
import os
from pathlib import Path
import platform
import plistlib
import re
import subprocess
import sys
import tempfile
import time
import uuid


ROOT = Path(__file__).resolve().parents[1]
BUNDLE = "com.natophonetics.app"
FONTS = ["NatoTile-ExtraBold.ttf", "NatoTile-SemiBold.ttf", "NatoTile-Italic.ttf"]


def run(*args, timeout=120):
    result = subprocess.run(args, capture_output=True, text=True, timeout=timeout)
    if result.returncode:
        raise RuntimeError(f"{args} exited {result.returncode}\n{result.stdout}\n{result.stderr}")
    return result.stdout.strip()


def sim(*args, timeout=120):
    return run("xcrun", "simctl", *args, timeout=timeout)


def require(value, message):
    if not value:
        raise RuntimeError(message)


def sha(file):
    return hashlib.sha256(file.read_bytes()).hexdigest()


def inventory(app):
    return {str(file.relative_to(app)): sha(file) for file in sorted(app.rglob("*")) if file.is_file()}


def version_tuple(value):
    return tuple(int(part) for part in value.split("."))


def select_phone(minimum):
    runtimes = json.loads(sim("list", "runtimes", "-j"))["runtimes"]
    devices = json.loads(sim("list", "devices", "available", "-j"))["devices"]
    compatible = [r for r in runtimes if r["isAvailable"] and ".iOS-" in r["identifier"]
                  and version_tuple(r["version"]) >= version_tuple(minimum)]
    for runtime in sorted(compatible, key=lambda r: version_tuple(r["version"]), reverse=True):
        types = [t["identifier"] for t in runtime.get("supportedDeviceTypes", [])]
        types.extend(d.get("deviceTypeIdentifier", "") for d in devices.get(runtime["identifier"], []))
        phone = next((t for t in types if ".iPhone-" in t), None)
        if phone:
            return runtime["identifier"], phone
    raise RuntimeError(f"No installed iOS simulator runtime and iPhone device type supporting iOS {minimum}+")


def inspect_app(app):
    with (app / "Info.plist").open("rb") as plist:
        info = plistlib.load(plist)
    require(info["CFBundleIdentifier"] == BUNDLE, "Unexpected iOS bundle identifier")
    require(info["CFBundleSupportedPlatforms"] == ["iPhoneSimulator"], "Expected simulator bundle")
    version = info["CFBundleShortVersionString"]
    require(version == json.loads((ROOT / "package.json").read_text())["version"], "Unexpected app version")
    project = (ROOT / "ios/NATOPhonetics.xcodeproj/project.pbxproj").read_text()
    builds = set(re.findall(r"CURRENT_PROJECT_VERSION = ([\d.]+);", project))
    require(builds == {info["CFBundleVersion"]}, "Unexpected iOS build number")
    executable = app / info["CFBundleExecutable"]
    require(executable.name == "NATOPhonetics" and os.access(executable, os.X_OK), "Missing executable permission")
    archs = run("xcrun", "lipo", "-archs", executable).split()
    require(platform.machine() in archs, f"{archs} does not include the host simulator architecture")
    require("IOSSIMULATOR" in run("xcrun", "vtool", "-show-build", executable).upper(), "Wrong Mach-O platform")
    require((app / "main.jsbundle").stat().st_size > 0, "Missing embedded JavaScript")
    for font in FONTS:
        require(font in info["UIAppFonts"] and sha(app / font) == sha(ROOT / "assets/fonts" / font),
                f"Packaged font mismatch: {font}")
    result = subprocess.run(["codesign", "-dv", "--verbose=4", app], capture_output=True, text=True)
    if result.returncode and "not signed at all" in result.stderr:
        signing = "unsigned"
    else:
        require(result.returncode == 0 and "Signature=adhoc" in result.stderr and "Authority=" not in result.stderr,
                f"Expected unsigned or ad-hoc simulator executable\n{result.stderr}")
        signing = "ad-hoc simulator executable"
    return {"platform": "iphonesimulator", "packageId": BUNDLE, "version": version, "build": info["CFBundleVersion"],
            "abis": archs, "signing": signing, "minimumOS": info["MinimumOSVersion"], "files": inventory(app)}


def verify(archive, screenshot):
    with tempfile.TemporaryDirectory(prefix="nato-simulator-") as workspace:
        # The caller supplies the archive it just built from its Xcode .app directory.
        run("tar", "-xzf", archive, "-C", workspace)
        app = Path(workspace) / "NATOPhonetics.app"
        product = inspect_app(app)
        product["archiveSha256"] = sha(archive)
        runtime, device_type = select_phone(product["minimumOS"])
        device = sim("create", f"NATO build {uuid.uuid4()}", device_type, runtime)
        print(f"Created {device_type} {device} with {runtime}", file=sys.stderr, flush=True)
        try:
            sim("boot", device)
            sim("bootstatus", device, "-b", timeout=600)
            sim("ui", device, "appearance", "light")
            sim("install", device, app)
            installed = Path(sim("get_app_container", device, BUNDLE, "app"))
            require(inventory(installed) == product["files"], "Installed app differs from archived app")
            launch = sim("launch", device, BUNDLE)
            match = re.fullmatch(re.escape(BUNDLE) + r": (\d+)", launch)
            require(match, f"Missing launched process ID: {launch}")
            pid = match.group(1)
            time.sleep(8)
            sim("io", device, "screenshot", screenshot)
            # Simulator apps are host processes. Check the original PID and terminate by bundle ID.
            os.kill(int(pid), 0)
            sim("terminate", device, BUNDLE)
            product["simulator"] = {"udid": device, "deviceType": device_type, "runtime": runtime,
                                    "installedMatchesArchive": True, "launchPid": pid, "appearance": "light",
                                    "screenshot": screenshot.name, "screenshotSha256": sha(screenshot)}
        finally:
            # Only the device created by this invocation is deleted.
            try:
                sim("shutdown", device)
            finally:
                sim("delete", device)
        return product


if __name__ == "__main__":
    print(json.dumps(verify(Path(sys.argv[1]).resolve(), Path(sys.argv[2]).resolve()), indent=2))
