"""Preserve and identify one actual source Release ABI before the next build."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import struct
import subprocess
import zipfile

ROOT = Path(__file__).resolve().parents[4]
OUT = Path(__file__).resolve().parent
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('abi', choices=['armeabi-v7a', 'arm64-v8a', 'x86', 'x86_64'])
args = parser.parse_args()
abi = args.abi
artifacts = ROOT / f'artifacts/run28/release-{abi}'
artifacts.mkdir(parents=True, exist_ok=False)
sha = lambda data: hashlib.sha256(data).hexdigest()
readelf = Path(os.environ['ANDROID_HOME']) / 'ndk/27.1.12297006/toolchains/llvm/prebuilt/darwin-x86_64/bin/llvm-readelf'
prefab = ROOT / 'node_modules/react-native/ReactAndroid/build/intermediates/prefab_package/release/prefab'
expected_machine, expected_class = {'armeabi-v7a': (40, 1), 'arm64-v8a': (183, 2), 'x86': (3, 1), 'x86_64': (62, 2)}[abi]
report = {'abi': abi, 'reactNative': '0.81.5', 'sourceMode': 'opt-in; ordinary Maven unchanged', 'artifacts': {}, 'nativeLibraries': {}}
for source, name in [('android/app/build/outputs/apk/release/app-release-unsigned.apk', 'app-release-unsigned.apk'), ('android/app/build/outputs/bundle/release/app-release.aab', 'app-release.aab')]:
    file = artifacts / name
    shutil.copy2(ROOT / source, file)
    with zipfile.ZipFile(file) as archive:
        entries = {n: sha(archive.read(n)) for n in archive.namelist() if not n.endswith('/')}
    report['artifacts'][name] = {'path': str(file.relative_to(ROOT)), 'sha256': sha(file.read_bytes()), 'bytes': file.stat().st_size, 'entries': entries}

apk = report['artifacts']['app-release-unsigned.apk']['entries']
aab = report['artifacts']['app-release.aab']['entries']
assert {n.split('/')[1] for n in apk if n.startswith('lib/')} == {abi}
assert apk['assets/index.android.bundle'] == aab['base/assets/index.android.bundle']
previous = json.loads((ROOT / 'docs/evidence/run27/android/release-artifacts.json').read_text())['embeddedJavascript']['sha256']
assert apk['assets/index.android.bundle'] == previous, 'Product JS changed; invalidate reuse'
report['embeddedJavascript'] = {'sha256': previous, 'matchesRun27AndRun23': True}

hermes = next((Path.home() / '.gradle/caches/modules-2/files-2.1/com.facebook.react/hermes-android/0.81.5').glob('*/hermes-android-0.81.5-release.aar'))
with zipfile.ZipFile(hermes) as archive:
    expected_hermes = sha(archive.read(f'jni/{abi}/libhermes.so'))
assert apk[f'lib/{abi}/libhermes.so'] == expected_hermes
report['hermes'] = {'version': '0.81.5', 'aarSha256': sha(hermes.read_bytes()), 'librarySha256': expected_hermes, 'matchesPinnedMavenRelease': True}

def build_id(file):
    return re.search(r'Build ID: (\w+)', subprocess.check_output([str(readelf), '-n', str(file)], text=True)).group(1)

with zipfile.ZipFile(artifacts / 'app-release-unsigned.apk') as archive:
    for name, digest in apk.items():
        if not name.startswith('lib/') or not name.endswith('.so'):
            continue
        assert aab['base/' + name] == digest, 'APK/AAB native disagreement: ' + name
        data = archive.read(name)
        assert data[:4] == b'\x7fELF' and data[5] == 1
        assert data[4] == expected_class and struct.unpack_from('<H', data, 18)[0] == expected_machine
        file = artifacts / Path(name).name
        file.write_bytes(data)
        row = {'sha256': digest, 'elfClass': expected_class, 'machine': expected_machine, 'buildId': build_id(file)}
        module = file.name.removeprefix('lib').removesuffix('.so')
        if module in ['reactnative', 'jsi']:
            exported = prefab / f'modules/{module}/libs/android.{abi}/{file.name}'
            row['prefabSha256'] = sha(exported.read_bytes())
            row['prefabBuildId'] = build_id(exported)
            assert row['buildId'] == row['prefabBuildId'], 'Consumer/exported library ABI drift'
        report['nativeLibraries'][name] = row

headers = {}
for patch_name in ['react-native-0.81.5-font-environment.json', 'react-native-0.81.5-source-build.json']:
    patch = json.loads((ROOT / 'scripts/patches' / patch_name).read_text())
    for file in patch['files']:
        actual = sha((ROOT / 'node_modules/react-native' / file['path']).read_bytes())
        assert actual == file['patchedSha256'], 'Source guard drift: ' + file['path']
        if file['path'].startswith('ReactCommon/') and file['path'].endswith('.h'):
            exported = prefab / 'modules/reactnative/include' / file['path'].removeprefix('ReactCommon/')
            assert sha(exported.read_bytes()) == actual, 'Exported header drift: ' + str(exported)
            headers[file['path']] = actual
report['exportedPatchedHeaders'] = headers
for name, file in [('apk', artifacts / 'app-release-unsigned.apk'), ('aab', artifacts / 'app-release.aab')]:
    with zipfile.ZipFile(file) as archive:
        assert not any(re.search(r'META-INF/.*\.(RSA|DSA|EC)$', n, re.I) for n in archive.namelist())
tools = Path(os.environ['ANDROID_HOME']) / 'build-tools/36.0.0'
badging = subprocess.check_output([str(tools / 'aapt2'), 'dump', 'badging', str(artifacts / 'app-release-unsigned.apk')], text=True)
assert 'application-debuggable' not in badging
assert 'android.permission.RECORD_AUDIO' not in badging
(OUT / f'{abi}-manifest.log').write_text(badging)
signature = subprocess.run([str(tools / 'apksigner'), 'verify', '--verbose', str(artifacts / 'app-release-unsigned.apk')], capture_output=True, text=True)
(OUT / f'{abi}-signature.log').write_text(signature.stdout + signature.stderr)
assert signature.returncode != 0 and 'DOES NOT VERIFY' in signature.stderr
report['unsigned'] = True
report['releaseIsDebuggable'] = False
report['runtime'] = 'unrun; compile/link/package identity does not establish execution on this ABI'
report['passed'] = True
(OUT / f'{abi}-artifacts.json').write_text(json.dumps(report, indent=2) + '\n')
print(json.dumps({key: report[key] for key in ['passed', 'abi', 'embeddedJavascript', 'unsigned', 'runtime']}))
