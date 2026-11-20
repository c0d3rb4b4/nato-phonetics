"""Restore the initially empty, run-owned API 36 emulator after all consumers exit."""
from pathlib import Path
import hashlib
import json
import re
import shutil
import subprocess
import time

here = Path(__file__).resolve().parent
initial = json.loads((here / "runtime-initial.json").read_text(encoding="utf-8-sig"))
created = json.loads((here / "runtime-emulator.json").read_text(encoding="utf-8-sig"))
serial = created["serial"]
adb = ["adb", "-s", serial]


def call(*args):
    return subprocess.check_output([*adb, *args], text=True, timeout=40).strip()


if (serial != "emulator-5584" or initial["packages"] or not created["createdEmptyAVD"]
        or call("emu", "avd", "name").splitlines()[0] != "NatoRun32"):
    raise RuntimeError("Expected the dedicated initially empty Run32 phone")
for package in ["com.natophonetics.fonttest", "com.natophonetics.app"]:
    if "package:" + package in call("shell", "pm", "list", "packages", package).splitlines():
        call("uninstall", package)
call("shell", "rm", "-f", "/sdcard/nato-window.xml")
if initial["scale"] == "null":
    call("shell", "settings", "delete", "system", "font_scale")
else:
    call("shell", "settings", "put", "system", "font_scale", initial["scale"])
call("shell", "wm", "size", "reset")
call("shell", "wm", "density", "reset")
if call("shell", "settings", "get", "secure", "default_input_method") != initial["ime"]:
    call("shell", "ime", "set", initial["ime"])
observed = {"serial": serial, "packages": call("shell", "pm", "list", "packages", "com.natophonetics").splitlines(),
            "scale": call("shell", "settings", "get", "system", "font_scale"),
            "ime": call("shell", "settings", "get", "secure", "default_input_method"),
            "size": call("shell", "wm", "size"), "density": call("shell", "wm", "density")}
for key in ["packages", "scale", "ime", "size", "density"]:
    if observed[key] != initial[key]:
        raise RuntimeError(f"Restored {key} differs from initial state: {observed[key]}")
observed["emptyBridgeCacheDirectoriesRemoved"] = []
for directory in ["/data/local/tmp/dalvik-cache/x86_64", "/data/local/tmp/dalvik-cache"]:
    present = subprocess.run([*adb, "shell", "test", "-d", directory], timeout=15).returncode == 0
    if present and call("shell", "readlink", "-f", directory) == directory and not call("shell", "ls", "-A", directory):
        call("shell", "rmdir", directory)
        observed["emptyBridgeCacheDirectoriesRemoved"].append(directory)
observed["remainingShellFixtures"] = call("shell", "ls", "-A", "/data/local/tmp").splitlines()
observed["shutdownReply"] = call("emu", "kill")
deadline = time.monotonic() + 50
while serial in subprocess.check_output(["adb", "devices"], text=True):
    if time.monotonic() > deadline: raise TimeoutError("Run32 emulator still attached")
    time.sleep(.5)
observed["emulatorStopped"] = True
# The emulator logs its host LAN addresses and ADB public key. Preserve the
# original locally and retain a transport-independent startup/shutdown record.
log = here / "runtime-emulator.stdout.log"
raw = here.parents[3] / "artifacts/run32/runtime-emulator-original.log"
with log.open("rb") as source, raw.open("xb") as target:
    shutil.copyfileobj(source, target)
observed["rawEmulatorLogSha256"] = hashlib.sha256(raw.read_bytes()).hexdigest()
lines = raw.read_text(errors="replace").splitlines()
redacted = [line for line in lines if not re.search(r"IPv[46]|adb public key|androidboot.qemu.adb.pubkey", line, re.I)]
log.write_text("\n".join(redacted) + "\n", encoding="utf-8")
observed["redactedNetworkOrPublicKeyLines"] = len(lines) - len(redacted)
(here / "runtime-restoration.json").write_text(json.dumps(observed, indent=2) + "\n", encoding="utf-8")
