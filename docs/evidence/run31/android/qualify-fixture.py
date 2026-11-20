"""Run the Release fixture gates on the selected emulator and restore its product."""
from pathlib import Path
import argparse
import hashlib
import json
import re
import subprocess
import sys

root = Path(__file__).resolve().parents[4]
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('serial')
parser.add_argument('product', type=Path, help='Exact test-signed ordinary Release product')
parser.add_argument('fixture', type=Path)
parser.add_argument('observer', type=Path)
parser.add_argument('output', type=Path, help='New evidence directory')
repeat = parser.add_mutually_exclusive_group()
repeat.add_argument('--primary-display', action='store_true',
                    help='Repeat only primary and cold2 at the original display size')
repeat.add_argument('--editing-display', action='store_true',
                    help='Repeat only the editing scenario and compare to the retained cold baselines')
args = parser.parse_args()
output = args.output.resolve()
output.mkdir(parents=True, exist_ok=False)
product, fixture, observer = (p.resolve(strict=True) for p in (args.product, args.fixture, args.observer))
adb = ['adb', '-s', args.serial]
package = 'com.natophonetics.app'


def read(*command):
    return subprocess.check_output([*adb, *command], text=True, timeout=40).strip()


def installed_digest():
    path = read('shell', 'pm', 'path', package).removeprefix('package:')
    return read('shell', 'sha256sum', path).split()[0]


def run(name, command):
    with (output / (name + '.log')).open('wb') as log:
        result = subprocess.run(list(map(str, command)), cwd=root, stdout=log, stderr=subprocess.STDOUT, timeout=900)
    report['commands'].append({'argv': list(map(str, command)), 'exit': result.returncode, 'log': name + '.log'})
    result.check_returncode()


expected = hashlib.sha256(product.read_bytes()).hexdigest()
assert installed_digest() == expected, 'Install the exact ordinary product before changing the fixture.'
window = read('shell', 'wm', 'size')
match = re.search(r'Override size: (\d+x\d+)', window)
scale = read('shell', 'settings', 'get', 'system', 'font_scale')
ime = read('shell', 'settings', 'get', 'secure', 'default_input_method')
report = {'serial': args.serial, 'productSha256': expected, 'windowBefore': window,
          'fontScaleBefore': scale, 'imeBefore': ime, 'commands': [], 'passed': False}
try:
    scopes = [('full', []), ('narrow', ['primary', 'cold2'])]
    if args.primary_display:
        scopes = [('primary', ['primary', 'cold2'])]
    if args.editing_display:
        scopes = [('editing', ['editing'])]
    for scope, scenarios in scopes:
        if scope == 'narrow':
            read('shell', 'wm', 'size', '560x1000')
        target = output / scope
        run(scope + '-collect', [sys.executable, 'scripts/run-android-font-release-fixture.py',
                                 observer, fixture, target, args.serial, *scenarios])
        if args.editing_display:
            run('editing-gate', ['node', Path(__file__).with_name('check-edit-display.cjs'), target])
        else:
            check = ['node', 'scripts/check-android-font-release-fixture.cjs', target]
            run(scope + '-gate', check + (['--primary-only'] if scenarios else []))
    report['passed'] = True
finally:
    try:
        read('shell', 'wm', 'size', match.group(1) if match else 'reset')
        read('shell', 'settings', 'put', 'system', 'font_scale', scale)
        read('install', '-r', str(product))
        report['restoredProductSha256'] = installed_digest()
        report['windowAfter'] = read('shell', 'wm', 'size')
        report['fontScaleAfter'] = read('shell', 'settings', 'get', 'system', 'font_scale')
        report['imeAfter'] = read('shell', 'settings', 'get', 'secure', 'default_input_method')
        report['restored'] = (report['restoredProductSha256'] == expected and report['windowAfter'] == window and
                              report['fontScaleAfter'] == scale and report['imeAfter'] == ime)
        assert report['restored'], 'Product identity or settings changed during fixture handoff'
    finally:
        (output / 'summary.json').write_text(json.dumps(report, indent=2) + '\n', encoding='utf-8')
