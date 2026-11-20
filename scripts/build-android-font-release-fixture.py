"""Embed only the diagnostic JS in a separate, locally signed Release copy.

Original product APK is never changed. All non-signature entries except the
explicit fixture asset must match it exactly, including manifest/DEX/native libs.
"""
from pathlib import Path
import hashlib, json, os, re, subprocess, sys, zipfile

root = Path(__file__).resolve().parents[1]
original, out = map(lambda p: Path(p).resolve(), sys.argv[1:3])
out.mkdir(parents=True, exist_ok=True)
sdk, jdk = Path(os.environ['ANDROID_HOME']), Path(os.environ['JAVA_HOME'])
tools = sdk/'build-tools/36.0.0'
bundle = out/'fixture.js'
bytecode = out/'fixture.hbc'
commands = []
def run(command):
    commands.append(list(map(str, command)))
    subprocess.run(commands[-1], cwd=root, check=True, timeout=180)
def sha(data): return hashlib.sha256(data).hexdigest()
def signature(name): return bool(re.fullmatch(r'META-INF/(?:MANIFEST\.MF|[^/]+\.(?:SF|RSA|DSA|EC))', name, re.IGNORECASE))

run(['node', root/'node_modules/react-native/cli.js', 'bundle', '--entry-file',
     'tests/fixtures/android-font-scale/index.js', '--platform', 'android', '--dev',
     'false', '--minify', 'true', '--max-workers', '1', '--bundle-output', bundle,
     '--config', root/'metro.config.js'])
run([root/'node_modules/react-native/sdks/hermesc/osx-bin/hermesc', '-O', '-emit-binary', '-out', bytecode, bundle])
unsigned = out/'fixture-unaligned.apk'
fixture = out/'font-release-fixture.apk'
with zipfile.ZipFile(original) as source, zipfile.ZipFile(unsigned, 'w') as target:
    for entry in source.infolist():
        if signature(entry.filename): continue
        data = bytecode.read_bytes() if entry.filename == 'assets/index.android.bundle' else source.read(entry.filename)
        target.writestr(entry, data)
run([tools/'zipalign', '-P', '16', '-f', '4', unsigned, fixture])
run([tools/'apksigner', 'sign', '--ks', root/'android/app/debug.keystore', '--ks-key-alias',
     'androiddebugkey', '--ks-pass', 'pass:android', '--key-pass', 'pass:android', fixture])
run([tools/'apksigner', 'verify', fixture])
run([tools/'zipalign', '-c', '-P', '16', '4', fixture])
with zipfile.ZipFile(original) as source, zipfile.ZipFile(fixture) as target:
    before = {n: sha(source.read(n)) for n in source.namelist() if not signature(n)}
    after = {n: sha(target.read(n)) for n in target.namelist() if not signature(n)}
    changed = [n for n in before if before[n] != after.get(n)]
    assert set(before) == set(after) and changed == ['assets/index.android.bundle'], changed
    report = {'originalApk': str(original), 'originalSha256': sha(original.read_bytes()),
              'fixtureApk': str(fixture), 'fixtureSha256': sha(fixture.read_bytes()),
              'changedPayloadEntries': changed, 'identicalPayloadEntries': len(before)-1,
              'preservedNonSignatureMetadataEntries': [n for n in before if n.startswith('META-INF/')],
              'originalPayload': before, 'fixturePayload': after,
              'fixtureEntry': 'tests/fixtures/android-font-scale/index.js',
              'fixtureSourceSha256': sha((root/'tests/fixtures/android-font-scale/index.js').read_bytes()),
              'fixtureBundleSha256': sha(bundle.read_bytes()), 'fixtureBytecodeSha256': sha(bytecode.read_bytes()),
              'hermesCompilerSha256': sha((root/'node_modules/react-native/sdks/hermesc/osx-bin/hermesc').read_bytes()),
              'commands': commands, 'passed': True,
              'scope': 'Separate test fixture entry; identical Release manifest/DEX/native/Hermes payload. Not production JS acceptance.'}
(out/'identity.json').write_text(json.dumps(report, indent=2)+'\n')
print(json.dumps({k:report[k] for k in ['passed','fixtureSha256','changedPayloadEntries','identicalPayloadEntries']}))
