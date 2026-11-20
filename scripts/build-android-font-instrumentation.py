"""Build isolated test APK using pinned existing SDK/JDK; no app/dependency edit."""
from pathlib import Path
import hashlib, json, os, subprocess, sys, zipfile

root = Path(__file__).resolve().parents[1]
out = Path(sys.argv[1]).resolve()
out.mkdir(parents=True, exist_ok=True)
sdk = Path(os.environ['ANDROID_HOME'])
jdk = Path(os.environ['JAVA_HOME'])
build_tools = sdk / 'build-tools/36.0.0'
android = sdk / 'platforms/android-36/android.jar'
fixture = root / 'tests/fixtures/android-font-scale'
classes = out / 'classes'
classes.mkdir(exist_ok=True)
commands = [
    [str(jdk/'bin/javac'), '-source', '17', '-target', '17', '-classpath', str(android), '-d', str(classes), *map(str, sorted(fixture.glob('*.java')))],
]
# Class outputs are discovered after javac, not before it.
subprocess.run(commands[0], check=True, timeout=60)
commands.append([str(build_tools/'d8'), '--lib', str(android), '--min-api', '24', '--output', str(out), *map(str, classes.rglob('*.class'))])
subprocess.run(commands[1], check=True, timeout=60)
apk = out/'font-composition.apk'
resources = [str(build_tools/'aapt2'), 'compile', '--dir', str(fixture/'res'), '-o', str(out/'resources.zip')]
subprocess.run(resources, check=True, timeout=30)
link = [str(build_tools/'aapt2'), 'link', '-I', str(android), '--manifest', str(fixture/'instrumentation-manifest.xml'), '-R', str(out/'resources.zip'), '-o', str(apk)]
subprocess.run(link, check=True, timeout=30)
with zipfile.ZipFile(apk, 'a') as archive:
    archive.write(out/'classes.dex', 'classes.dex')
sign = [str(build_tools/'apksigner'), 'sign', '--ks', str(root/'android/app/debug.keystore'), '--ks-key-alias', 'androiddebugkey', '--ks-pass', 'pass:android', '--key-pass', 'pass:android', str(apk)]
subprocess.run(sign, check=True, timeout=30)
report = {'apk': str(apk), 'apkSha256': hashlib.sha256(apk.read_bytes()).hexdigest(), 'commands': [*commands, resources, link, sign], 'sdk': 'android-36', 'buildTools': '36.0.0', 'javaVersion': subprocess.check_output([str(jdk/'bin/java'), '-version'], stderr=subprocess.STDOUT, text=True)}
(out/'build.json').write_text(json.dumps(report, indent=2)+'\n')
print(report['apkSha256'])
