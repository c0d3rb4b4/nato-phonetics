"""Collect the original completed instrumentation output after an interrupted ADB pull."""
from pathlib import Path
import hashlib
import json
import subprocess
import sys

here = Path(__file__).resolve().parent
root = here.parents[3]
sys.path.insert(0, str(root / "scripts"))
from android_display_evidence import repeated_display_transitions
from android_runtime_abi import check_runtime

original = here.parent / "screenshots/android/arm64-composition"
out = original.with_name("arm64-composition-recovery")
out.mkdir(exist_ok=False)
raw_report = (original / "report.json").read_text()
report = json.loads(raw_report)
initial = json.loads((original / "identity.json").read_text())
package = initial["identities"]["com.natophonetics.app"]
apk = root / "artifacts/run32/universal/app-release-local-test.apk"
adb = ["adb", "-s", initial["serial"]]
remote = "/storage/emulated/0/Android/data/com.natophonetics.app/files/font-composition"
expected = ["composition-before", "composition-live-2", "composition-live-1",
            "composition-continued", "composition-committed"]
if (initial["passed"] or initial["adbExitCode"] != 0 or report.get("passed") is not True
        or report.get("outputDirectory") != remote or [row["stage"] for row in report["stages"]] != expected
        or "INSTRUMENTATION_CODE: -1" not in (original / "command.log").read_text()):
    raise ValueError("Expected the incomplete host collection and complete successful device result")


def get(*cmd):
    return subprocess.check_output([*adb, *cmd], timeout=45)


def export(name):
    data = get("exec-out", "cat", remote + "/" + name)
    device_sha = get("shell", "sha256sum", remote + "/" + name).decode().split()[0]
    if hashlib.sha256(data).hexdigest() != device_sha:
        raise ValueError("Remote export digest differs: " + name)
    return data


if json.loads(export("report.json")) != report:
    raise ValueError("The original PID, stage observations or report has changed")
if get("shell", "sha256sum", package["installed"]).decode().split()[0] != package["sha256"]:
    raise ValueError("Measured installed product changed")
(out / "report.json").write_text(raw_report)
captures = []
for name in expected:
    file = name + ".png"
    png = export(file)
    if not png.startswith(b"\x89PNG\r\n\x1a\n"):
        raise ValueError("Invalid raw display capture for " + name)
    first = original / file
    if first.exists() and first.read_bytes() != png:
        raise ValueError("Original partial capture differs: " + name)
    (out / file).write_bytes(png)
    captures.append({"file": file, "sha256": hashlib.sha256(png).hexdigest(), "identicalToFirstPull": first.exists()})
stale = repeated_display_transitions(out, ((row["stage"], (row["fontScale"], row["value"])) for row in report["stages"]))
if stale: raise ValueError(f"Repeated composition frames: {stale}")
mappings = json.loads(export("runtime-libraries.json"))
(out / "mappings.json").write_text(json.dumps(mappings, indent=2) + "\n")
verification = check_runtime(apk, package["installed"], package["sha256"], package["primaryCpuAbi"],
                             "arm64-v8a", mappings, report["runtimePid"])
(out / "runtime-abi.json").write_text(json.dumps(verification, indent=2) + "\n")
(out / "collection.json").write_text(json.dumps({
    "passed": True, "deviceInstrumentationRerun": False, "serial": initial["serial"],
    "originalHostCollectionPassed": False, "sameDeviceReport": True, "installedAtMeasurement": initial["identities"],
    "staleCaptures": stale, "captures": captures,
}, indent=2) + "\n")
print(json.dumps({"passed": True, "recovered": len(captures), "pid": report["runtimePid"]}))
