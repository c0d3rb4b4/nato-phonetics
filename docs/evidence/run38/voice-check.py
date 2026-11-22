import hashlib
import json
import re
import subprocess
import sys
import time
import xml.etree.ElementTree as ET
from pathlib import Path

root = Path(sys.argv[2]) if len(sys.argv) > 2 else Path("artifacts/run38/replay")
(root / "screenshots/android").mkdir(parents=True, exist_ok=True)
pkg = "com.natophonetics.app"


def adb(*args):
    return subprocess.check_output(["adb", "-s", "emulator-5580", *args], timeout=30)


def shell(*args):
    return adb("shell", *args).decode().strip()


def tree():
    shell("uiautomator", "dump", "/sdcard/run38.xml")
    return [
        n.attrib
        for n in ET.fromstring(adb("exec-out", "cat", "/sdcard/run38.xml")).iter("node")
        if n.get("package") == pkg
    ]


def find(label, checked=None):
    deadline = time.monotonic() + 24
    while time.monotonic() < deadline:
        rows = tree()
        for row in rows:
            if label in (row["text"], row["content-desc"]) and (
                checked is None or row["checked"] == checked
            ):
                return row
    raise ValueError((label, [r["text"] or r["content-desc"] for r in rows]))


def tap(row):
    left, top, right, bottom = map(int, re.findall(r"\d+", row["bounds"]))
    shell("input", "tap", str((left + right) // 2), str((top + bottom) // 2))


def capture(name):
    (root / "screenshots/android" / name).write_bytes(
        adb("exec-out", "screencap", "-p")
    )


path = shell("pm", "path", pkg).removeprefix("package:")
digest = shell("sha256sum", path).split()[0]
product = Path(sys.argv[1])
assert digest == hashlib.sha256(product.read_bytes()).hexdigest()
shell("am", "force-stop", pkg)
shell(
    "am",
    "start",
    "-W",
    "-a",
    "android.intent.action.VIEW",
    "-d",
    "natophonetics://voice-select",
    pkg,
)
find("Showing 17 of 17 English voices.")
find("System Default", "true")
capture("release-voices.png")
tap(find("Search English voices"))
shell("input", "text", "iog-local")
shell("input", "keyevent", "4")
find("Showing 1 of 17 English voices.")
voice = "en-us-x-iog-local, en-US"
find(voice, "false")
tap(find("Preview en-us-x-iog-local"))
time.sleep(0.22)
capture("release-preview.png")
find("System Default", "true")
tap(find(voice, "false"))
find(voice, "true")
shell("am", "force-stop", pkg)
shell(
    "am",
    "start",
    "-W",
    "-a",
    "android.intent.action.VIEW",
    "-d",
    "natophonetics://voice-select",
    pkg,
)
find("Showing 17 of 17 English voices.")
find("System Default", "false")
tap(find("Search English voices"))
shell("input", "text", "iog-local")
shell("input", "keyevent", "4")
find(voice, "true")
capture("release-persisted.png")
print(
    json.dumps(
        dict(
            package=pkg,
            installedSha256=digest,
            api=shell("getprop", "ro.build.version.sdk"),
            screen=shell("wm", "size"),
            fontScale=shell("settings", "get", "system", "font_scale"),
            night=shell("cmd", "uimode", "night"),
            voices=17,
            filtered=1,
            previewPreservedDefault=True,
            selectionAfterColdLaunch=voice,
        ),
        indent=2,
    )
)
