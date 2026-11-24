"""Build the independent foreground AudioRecord client using the local SDK."""

import os
from pathlib import Path
import subprocess
import sys
from zipfile import ZipFile

sys.path.insert(0, "scripts")
from android_test_tools import build_tool, executable

source = Path(__file__).resolve().parent
output = Path("artifacts/run41/android")
classes = output / "classes"
classes.mkdir(parents=True, exist_ok=True)
sdk = Path(os.environ["ANDROID_HOME"]) / "platforms/android-36/android.jar"
apk = output / "micfixture.apk"


def run(*args):
    subprocess.run(args, check=True, timeout=60)


run(executable(Path(os.environ["JAVA_HOME"]) / "bin/javac"), "-classpath", sdk,
    "-d", classes, source / "Capture.java")
run(*build_tool("d8"), "--lib", sdk, "--min-api", "33", "--output", output,
    *classes.rglob("*.class"))
run(*build_tool("aapt2"), "link", "-I", sdk, "--manifest", source / "AndroidManifest.xml",
    "-o", apk)
with ZipFile(apk, "a") as archive:
    archive.write(output / "classes.dex", "classes.dex")
run(*build_tool("apksigner"), "sign", "--ks", "android/app/debug.keystore",
    "--ks-key-alias", "androiddebugkey", "--ks-pass", "pass:android", apk)
