"""Build the standalone API 33+ recognition probe from the repository root."""

import os
from pathlib import Path
import subprocess
import sys
from zipfile import ZipFile

sys.path.insert(0, "scripts")
from android_test_tools import build_tool, executable

sdk = Path(os.environ["ANDROID_HOME"]) / "platforms/android-36/android.jar"
source = Path(__file__).resolve().parent
output = Path("artifacts/run38/probe")
classes = output / "classes"
classes.mkdir(parents=True, exist_ok=True)
apk = output / "probe.apk"


def run(args):
    subprocess.run(args, check=True, timeout=60)


run(
    [
        executable(Path(os.environ["JAVA_HOME"]) / "bin/javac"),
        "-classpath",
        sdk,
        "-d",
        classes,
        *sorted(source.glob("*.java")),
    ]
)
run(
    [
        *build_tool("d8"),
        "--lib",
        sdk,
        "--min-api",
        "33",
        "--output",
        output,
        *sorted(classes.rglob("*.class")),
    ]
)
run(
    [
        *build_tool("aapt2"),
        "link",
        "-I",
        sdk,
        "--manifest",
        source / "AndroidManifest.xml",
        "-o",
        apk,
    ]
)
with ZipFile(apk, "a") as archive:
    archive.write(output / "classes.dex", "classes.dex")
    archive.write(output / "answer.pcm", "assets/answer.pcm")
run(
    [
        *build_tool("apksigner"),
        "sign",
        "--ks",
        "android/app/debug.keystore",
        "--ks-key-alias",
        "androiddebugkey",
        "--ks-pass",
        "pass:android",
        apk,
    ]
)
