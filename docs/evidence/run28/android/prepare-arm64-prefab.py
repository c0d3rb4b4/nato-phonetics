"""Bind current identical exported headers to exact preserved ARM64 APK libraries.

The per-ABI Gradle prefab export replaces the preceding ABI's library directory.
This explicit test-only prefab retains the Run27 ARM64 Release payload rather
than causing an unnecessary framework rebuild; no production file is edited.
"""
from pathlib import Path
import hashlib
import json

ROOT = Path(__file__).resolve().parents[4]
OUT = Path(__file__).resolve().parent
report = json.loads((ROOT / 'docs/evidence/run27/android/release-artifacts.json').read_text())
source = ROOT / 'node_modules/react-native/ReactAndroid/build/intermediates/prefab_package/release/prefab'
prefab = ROOT / 'artifacts/run28/prefab-arm64'
prefab.mkdir(parents=True, exist_ok=False)
sha = lambda file: hashlib.sha256(file.read_bytes()).hexdigest()
guards = json.loads((ROOT / 'docs/evidence/run27/android/source-preflight.json').read_text())['guards']
headers = {}
for guard in guards:
    file = ROOT / 'node_modules/react-native' / guard['file']
    assert sha(file) == guard['expected'], guard['file']
    if guard['file'].startswith('ReactCommon/') and guard['file'].endswith('.h'):
        exported = source / 'modules/reactnative/include' / guard['file'].removeprefix('ReactCommon/')
        assert sha(exported) == guard['expected'], guard['file']
        headers[guard['file']] = guard['expected']
libraries = {}
for module in ['reactnative', 'jsi']:
    directory = prefab / f'modules/{module}'
    directory.mkdir(parents=True)
    (directory / 'include').symlink_to(source / f'modules/{module}/include', target_is_directory=True)
    libs = directory / 'libs/android.arm64-v8a'
    libs.mkdir(parents=True)
    file = ROOT / f'artifacts/run27/release-libs/lib{module}.so'
    expected = report['nativeLibraries'][f'lib/arm64-v8a/{file.name}']['sha256']
    assert sha(file) == expected
    (libs / file.name).symlink_to(file)
    libraries[file.name] = expected
result = {'prefab': str(prefab.relative_to(ROOT)), 'sourceHeaders': str(source.relative_to(ROOT)),
          'allRun27NativeSourceGuardsMatch': len(guards), 'exportedPatchedHeaders': headers,
          'exactRun27ApkLibrarySha256': libraries, 'productionFilesEdited': False, 'passed': True}
(OUT / 'arm64-prefab-identity.json').write_text(json.dumps(result, indent=2) + '\n')
print(json.dumps(result))
