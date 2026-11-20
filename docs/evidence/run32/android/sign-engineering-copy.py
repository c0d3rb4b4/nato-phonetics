"""Sign a separate copy of the preserved unsigned Release APK with the repository development key."""
import argparse
import hashlib
import json
from pathlib import Path
import subprocess
import sys
import tempfile


HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parents[3] / 'scripts'))
from android_test_tools import build_tool


parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('checkout', type=Path)
parser.add_argument('products', type=Path)
args = parser.parse_args()
source = args.products / 'app-release-unsigned.apk'
target = args.products / 'app-release-local-test.apk'
key = args.checkout / 'android/app/debug.keystore'
if hashlib.sha256(key.read_bytes()).hexdigest() != '221e0a3106aa4c3ccc154e0a418b55020b3f9ea6e84f92e8749cd9e2f39f5e58':
    raise ValueError('Expected repository development key')
if target.exists():
    raise FileExistsError(target)

signer = build_tool('apksigner')
with tempfile.TemporaryDirectory(dir=args.products) as temp:
    copy = Path(temp) / target.name
    subprocess.run([*signer, 'sign', '--v4-signing-enabled', 'false', '--ks', key, '--ks-key-alias', 'androiddebugkey',
                    '--ks-pass', 'pass:android', '--key-pass', 'pass:android', '--out', copy, source], check=True)
    subprocess.run([*signer, 'verify', '--verbose', '--print-certs', copy], check=True)
    copy.rename(target)

print(json.dumps({path.name: hashlib.sha256(path.read_bytes()).hexdigest() for path in (source, target)}, indent=2))
