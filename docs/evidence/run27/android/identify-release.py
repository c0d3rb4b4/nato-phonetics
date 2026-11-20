"""Identify actual unsigned Release outputs and the separate local test copy."""
from pathlib import Path
import hashlib
import json
import os
import re
import subprocess
import zipfile

ROOT = Path(__file__).resolve().parents[4]
OUT = Path(__file__).resolve().parent
ARTIFACTS = ROOT / 'artifacts/run27/release-arm64'
LIBS = ROOT / 'artifacts/run27/release-libs'
SDK = Path(os.environ['ANDROID_HOME'])
READELF = SDK / 'ndk/27.1.12297006/toolchains/llvm/prebuilt/darwin-x86_64/bin/llvm-readelf'
TOOLS = SDK / 'build-tools/36.0.0'
sha = lambda data: hashlib.sha256(data).hexdigest()
report = {'abi': 'arm64-v8a', 'reactNative': '0.81.5', 'sourceMode': 'opt-in; default Maven path unchanged/failing', 'artifacts': {}}


def command(name, args):
    result = subprocess.run(list(map(str, args)), capture_output=True, text=True)
    (OUT / (name + '.log')).write_text(result.stdout + result.stderr)
    return result


def build_id(file):
    value = subprocess.check_output([str(READELF), '-n', str(file)], text=True)
    return re.search(r'Build ID: (\w+)', value).group(1)


for name in ['app-release-unsigned.apk', 'app-release.aab', 'app-release-local-test.apk']:
    file = ARTIFACTS / name
    with zipfile.ZipFile(file) as archive:
        entries = {n: sha(archive.read(n)) for n in archive.namelist() if not n.endswith('/')}
    report['artifacts'][name] = {'path': str(file.relative_to(ROOT)), 'sha256': sha(file.read_bytes()), 'bytes': file.stat().st_size, 'entries': entries}

unsigned = report['artifacts']['app-release-unsigned.apk']['entries']
bundle = report['artifacts']['app-release.aab']['entries']
local = report['artifacts']['app-release-local-test.apk']['entries']
assert all(local.get(n) == digest for n, digest in unsigned.items()), 'Local signing changed an original payload entry'
assert {n.split('/')[1] for n in unsigned if n.startswith('lib/')} == {'arm64-v8a'}
assert unsigned['assets/index.android.bundle'] == bundle['base/assets/index.android.bundle']
previous = json.loads((ROOT / 'docs/evidence/run23/android/artifacts.json').read_text())['android-release']['embeddedFiles']['base/assets/index.android.bundle']
report['embeddedJavascript'] = {'sha256': unsigned['assets/index.android.bundle'], 'matchesRun23': unsigned['assets/index.android.bundle'] == previous}
assert report['embeddedJavascript']['matchesRun23'], 'Release product JS changed; reconcile before reuse'

aar = next((Path.home() / '.gradle/caches/modules-2/files-2.1/com.facebook.react/hermes-android/0.81.5').glob('*/hermes-android-0.81.5-release.aar'))
with zipfile.ZipFile(aar) as engine:
    expected_hermes = sha(engine.read('jni/arm64-v8a/libhermes.so'))
assert unsigned['lib/arm64-v8a/libhermes.so'] == expected_hermes
report['hermes'] = {'version': '0.81.5', 'releaseAar': str(aar), 'aarSha256': sha(aar.read_bytes()), 'libSha256': expected_hermes, 'matchesPinnedMavenRelease': True}
report['nativeLibraries'] = {}
with zipfile.ZipFile(ARTIFACTS / 'app-release-unsigned.apk') as archive:
    for name in unsigned:
        if not name.startswith('lib/') or not name.endswith('.so'):
            continue
        assert bundle['base/' + name] == unsigned[name], 'APK/AAB native mismatch: ' + name
        file = LIBS / Path(name).name
        file.write_bytes(archive.read(name))
        header = subprocess.check_output([str(READELF), '-h', str(file)], text=True)
        assert 'AArch64' in header, name
        row = {'sha256': unsigned[name], 'buildId': build_id(file), 'machine': 'AArch64'}
        if file.name in ['libreactnative.so', 'libjsi.so']:
            module = file.name.removeprefix('lib').removesuffix('.so')
            prefab = ROOT / f'node_modules/react-native/ReactAndroid/build/intermediates/prefab_package/release/prefab/modules/{module}/libs/android.arm64-v8a/{file.name}'
            row['prefabSha256'] = sha(prefab.read_bytes())
            row['prefabBuildId'] = build_id(prefab)
            assert row['buildId'] == row['prefabBuildId'], 'Header/link/runtime library drift'
        report['nativeLibraries'][name] = row

original_signature = command('release-unsigned-signature', [TOOLS / 'apksigner', 'verify', '--verbose', ARTIFACTS / 'app-release-unsigned.apk'])
test_signature = command('release-local-test-signature', [TOOLS / 'apksigner', 'verify', '--verbose', '--print-certs', ARTIFACTS / 'app-release-local-test.apk'])
bundle_signature = command('release-bundle-signature', [Path(os.environ['JAVA_HOME']) / 'bin/jarsigner', '-verify', ARTIFACTS / 'app-release.aab'])
badging = command('release-manifest', [TOOLS / 'aapt2', 'dump', 'badging', ARTIFACTS / 'app-release-unsigned.apk'])
assert original_signature.returncode != 0 and 'DOES NOT VERIFY' in original_signature.stderr
assert test_signature.returncode == 0 and 'Android Debug' in test_signature.stdout
assert 'jar is unsigned' in bundle_signature.stdout
assert not any(re.search(r'META-INF/.*\.(RSA|DSA|EC)$', name, re.I) for name in bundle)
assert badging.returncode == 0 and 'application-debuggable' not in badging.stdout
assert 'android.permission.RECORD_AUDIO' not in badging.stdout
report['signatures'] = {'originalApkUnsigned': True, 'aabUnsigned': True, 'localTestCopyDevelopmentKeyOnly': True, 'allOriginalPayloadEntriesPreserved': True, 'releaseIsDebuggable': False}
report['passed'] = True
(OUT / 'release-artifacts.json').write_text(json.dumps(report, indent=2) + '\n')
print(json.dumps({key: report[key] for key in ['passed', 'abi', 'embeddedJavascript', 'signatures']}))
