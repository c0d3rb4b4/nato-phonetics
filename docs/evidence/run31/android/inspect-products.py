"""Qualify the default x86_64 Release APK/AAB and public-key engineering copy."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import re
import subprocess
import tempfile
import zipfile

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('checkout', type=Path)
parser.add_argument('artifacts', type=Path)
args = parser.parse_args()
root = args.checkout.resolve()
products = args.artifacts.resolve()
out = Path(__file__).resolve().parent
sdk = Path(os.environ['ANDROID_HOME'])
tools = sdk / 'build-tools/36.0.0'
ndk_bins = sdk / 'ndk/27.1.12297006/toolchains/llvm/prebuilt'
readelf = next(ndk_bins.glob('*/bin/llvm-readelf*'))
apk = products / 'app-release-unsigned.apk'
aab = products / 'app-release.aab'
test_copy = products / 'app-release-local-test.apk'


def digest(data):
    return hashlib.sha256(data).hexdigest()


def entries(archive):
    with zipfile.ZipFile(archive) as data:
        return {name: digest(data.read(name)) for name in data.namelist() if not name.endswith('/')}


def build_id(library):
    notes = subprocess.check_output([readelf, '-n', library], text=True)
    return re.search(r'Build ID: ([0-9a-f]+)', notes).group(1)


before, bundle, after = (entries(file) for file in (apk, aab, test_copy))
signature = re.compile(r'META-INF/(MANIFEST\.MF|[^/]+\.(SF|RSA|DSA|EC))', re.I)
assert {k: v for k, v in after.items() if not signature.fullmatch(k)} == before

historical = json.loads((out.parents[1] / 'run28/android/x86_64-artifacts.json').read_text())
baseline = historical['artifacts']['app-release-unsigned.apk']['entries']
report = {
    'sourceMode': 'ordinary Gradle composite default; x86_64 scope selected for this emulator',
    'artifacts': {p.name: {'sha256': digest(p.read_bytes()), 'bytes': p.stat().st_size}
                  for p in [apk, aab, test_copy]},
    'identicalEngineeringCopyPayloadEntries': len(before),
    'differentFromRun28OptIn': sorted(k for k in baseline.keys() | before.keys() if baseline.get(k) != before.get(k)),
}
assets = ['assets/index.android.bundle'] + [
    'assets/fonts/' + p.name for p in sorted((root / 'android/app/src/main/assets/fonts').glob('*.ttf'))]
assert len(assets) == 4
for name in assets:
    assert before[name] == bundle['base/' + name], name
    if name.endswith('.ttf'):
        assert before[name] == digest((root / 'android/app/src/main' / name).read_bytes()), name
report['embeddedAssets'] = {name: before[name] for name in assets}

prefab = root / 'node_modules/react-native/ReactAndroid/build/intermediates/prefab_package/release/prefab'
libraries = sorted(name for name in before if name.startswith('lib/'))
assert set(libraries) == {name for name in baseline if name.startswith('lib/')}, libraries
assert all(name.startswith('lib/x86_64/') for name in libraries)
native = {}
with tempfile.TemporaryDirectory() as temporary, zipfile.ZipFile(apk) as archive:
    for name in libraries:
        data = archive.read(name)
        # ELF64, little endian and EM_X86_64.
        assert data[:6] == b'\x7fELF\x02\x01' and int.from_bytes(data[18:20], 'little') == 62, name
        assert before[name] == bundle['base/' + name], name
        local = Path(temporary) / Path(name).name
        local.write_bytes(data)
        native[name] = {'sha256': before[name], 'buildId': build_id(local)}
        if local.name in ['libreactnative.so', 'libjsi.so']:
            module = local.stem.removeprefix('lib')
            source = prefab / 'modules' / module / 'libs/android.x86_64' / local.name
            assert build_id(source) == native[name]['buildId'], name
            native[name]['sourcePrefabSha256'] = digest(source.read_bytes())
report['nativeLibraries'] = native
hermes = next((Path.home() / '.gradle/caches/modules-2/files-2.1/com.facebook.react/hermes-android/0.81.5')
              .glob('*/hermes-android-0.81.5-release.aar'))
assert digest(hermes.read_bytes()) == 'f8d8af2486ee26d7b8d3da92dcd96ea5df27acfcfe556866ea13c68fec1d2992'
with zipfile.ZipFile(hermes) as archive:
    assert digest(archive.read('jni/x86_64/libhermes.so')) == before['lib/x86_64/libhermes.so']
report['hermesAarSha256'] = digest(hermes.read_bytes())
manifest = subprocess.check_output([tools / 'aapt2', 'dump', 'badging', apk], text=True)
assert "package: name='com.natophonetics.app'" in manifest and 'application-debuggable' not in manifest
assert 'android.permission.RECORD_AUDIO' not in manifest
(out / 'product-manifest.log').write_text(manifest)
report['candidate'] = {'nonDebuggable': True, 'requestedRecordAudio': False, 'abi': 'x86_64'}
report['passed'] = True
(out / 'product-identity.json').write_text(json.dumps(report, indent=2) + '\n')
print(json.dumps(report['artifacts'], indent=2))
