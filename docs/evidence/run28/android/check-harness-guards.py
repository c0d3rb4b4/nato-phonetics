"""Actual negative controls: reject wrong machine, variant and exported headers."""
from pathlib import Path
import json
import os
import subprocess
import tempfile

ROOT = Path(__file__).resolve().parents[4]
OUT = Path(__file__).resolve().parent
prefab = ROOT / 'node_modules/react-native/ReactAndroid/build/intermediates/prefab_package/release/prefab'
abi = os.environ.get('NATO_TEST_ABI', 'armeabi-v7a')
rows = []

def reject(name, source, arguments, expected):
    result = subprocess.run(['python3', str(ROOT / 'scripts/build-android-font-native.py'), str(source), str(Path(temp) / name), *arguments], capture_output=True, text=True)
    (OUT / f'negative-{name}.log').write_text(result.stdout + result.stderr)
    row = {'name': name, 'exitCode': result.returncode, 'expectedDiagnostic': expected, 'passed': result.returncode != 0 and expected in result.stderr and not (Path(temp) / name / 'compile.json').exists()}
    rows.append(row)
    assert row['passed'], result.stdout + result.stderr

with tempfile.TemporaryDirectory(prefix='nato-run28-guards-') as temp:
    reject('variant', prefab, ['--abi', abi], 'mode must match the library')
    wrong = Path(temp) / 'wrong-machine/modules/reactnative/libs/android.x86_64'
    wrong.mkdir(parents=True)
    (wrong / 'libreactnative.so').symlink_to(prefab / f'modules/reactnative/libs/android.{abi}/libreactnative.so')
    reject('machine', Path(temp) / 'wrong-machine', ['--release', '--abi', 'x86_64'], 'does not match requested ABI')
    minimal = Path(temp) / 'header-drift'
    for module in ['reactnative', 'jsi']:
        target = minimal / f'modules/{module}/libs'
        target.parent.mkdir(parents=True, exist_ok=True)
        target.symlink_to(prefab / f'modules/{module}/libs')
    for header in ['react/renderer/components/view/YogaLayoutableShadowNode.h', 'react/renderer/textlayoutmanager/TextMeasureCache.h', 'react/renderer/core/LayoutContext.h', 'react/fabric/SurfaceHandlerBinding.h']:
        file = minimal / 'modules/reactnative/include' / header
        file.parent.mkdir(parents=True, exist_ok=True)
        file.write_bytes((prefab / 'modules/reactnative/include' / header).read_bytes())
    context = minimal / 'modules/reactnative/include/react/renderer/core/LayoutContext.h'
    context.write_text(context.read_text() + '\n// deliberate negative control\n')
    reject('context-header', minimal, ['--release', '--abi', abi], 'Exported context/surface header/library ABI mismatch')

(OUT / 'harness-negative-controls.json').write_text(json.dumps({'abi': abi, 'passed': all(row['passed'] for row in rows), 'controls': rows}, indent=2) + '\n')
print(json.dumps(rows))
