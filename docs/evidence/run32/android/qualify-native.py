"""Build the six-case consumer from the product checkout, then execute its exact APK libraries."""
from pathlib import Path
import argparse
import json
import shutil
import subprocess
import sys

here = Path(__file__).resolve().parent
root = here.parents[3]
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('checkout', type=Path)
parser.add_argument('apk', type=Path)
parser.add_argument('abi')
parser.add_argument('serial')
parser.add_argument('--attempt', default='', help='Suffix to preserve a previous attempt')
args = parser.parse_args()
checkout, apk = args.checkout.resolve(strict=True), args.apk.resolve(strict=True)
identity = json.loads((here / 'product-identity.json').read_text())
expected = {key.split('/')[-1]: row['sha256'] for key, row in identity['libraries'].items()
            if key.startswith(args.abi + '/')}
assert identity['passed'] and len(expected) == 11
work = root / 'artifacts/run32' / ('native-' + args.abi + args.attempt)
out = here / ('native-' + args.abi + args.attempt)
work.mkdir()
out.mkdir()
prefab = checkout / 'node_modules/react-native/ReactAndroid/build/intermediates/prefab_package/release/prefab'
compile_command = [sys.executable, root / 'scripts/build-android-font-native.py', prefab, work,
                   '--project-root', checkout, '--abi', args.abi, '--release']
compiled = subprocess.run(compile_command, cwd=checkout, capture_output=True, timeout=180)
(out / 'compiler.log').write_bytes(compiled.stdout + compiled.stderr)
shutil.copy(work / 'compile.json', out / 'compile.json')
compiled.check_returncode()
run_command = [sys.executable, root / 'scripts/run-android-font-native.py', work / 'font-environment', apk,
               out, args.serial, '--apk-abi', args.abi]
run = subprocess.run(run_command, capture_output=True, timeout=180)
(out / 'command.log').write_bytes(run.stdout + run.stderr)
run.check_returncode()
report = json.loads((out / 'native-result.json').read_text())
compiler = json.loads((out / 'compile.json').read_text())
assert report['passed'] and report['removedOwnedTestDirectory']
assert report['librarySha256'] == expected
assert report['apkSha256'] == identity['artifacts'][apk.name]['sha256']
assert report['binarySha256'] == compiler['executableSha256']
for name, item in compiler['libraries'].items():
    assert item['sha256'] == identity['libraries'][f'{args.abi}/lib{name}.so']['prefabSha256']
summary = {'passed': True, 'abi': args.abi, 'serial': args.serial, 'cases': 6,
           'apkSha256': report['apkSha256'], 'matchingRuntimeLibraries': len(expected),
           'compileCommand': list(map(str, compile_command)), 'runCommand': list(map(str, run_command))}
(out / 'checks.json').write_text(json.dumps(summary, indent=2) + '\n')
print(json.dumps(summary))
