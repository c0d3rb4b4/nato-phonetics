"""Run the original Release observation scopes on a fresh, identified emulator candidate.

Use Python's UTF-8 mode on Windows for the historical UIAutomator XML writer.
The output and screenshot directories must both be new for each attempt.
"""
from pathlib import Path
import argparse
import hashlib
import importlib.util
import json
import os
import re
import shutil
import subprocess
import sys
import time


here = Path(__file__).resolve().parent
root = here.parents[3]
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('scope', choices=['product', 'checkpoint', 'matrix', 'windows', 'narrow', 'narrow-aligned'])
parser.add_argument('app', type=Path, help='Locally test-signed, non-debuggable product APK')
parser.add_argument('test', type=Path, help='SDK-built tile observer APK')
parser.add_argument('serial', help='Serial of the dedicated test AVD')
parser.add_argument('output', type=Path)
parser.add_argument('screenshots', type=Path)
options = parser.parse_args()
if os.name == 'nt' and not sys.flags.utf8_mode:
    parser.error('Run python -X utf8 so the captured UIAutomator XML retains all characters.')
if not re.fullmatch(r'emulator-\d+', options.serial):
    parser.error('Use the dedicated emulator serial for this evidence run.')
sdk = os.environ.get('ANDROID_HOME') or os.environ.get('ANDROID_SDK_ROOT')
adb = (Path(sdk) / 'platform-tools' / ('adb.exe' if os.name == 'nt' else 'adb')) if sdk else shutil.which('adb')
if not adb or not Path(adb).is_file():
    parser.error('Set ANDROID_HOME to the installed Android SDK or place adb on PATH.')
if options.output.exists() or options.screenshots.exists():
    parser.error('Select new evidence and screenshot directories. Keep earlier attempts intact.')

def digest(file):
    hasher = hashlib.sha256()
    with Path(file).open('rb') as reader:
        for chunk in iter(lambda: reader.read(1024 * 1024), b''):
            hasher.update(chunk)
    return hasher.hexdigest()


source = root / 'docs/evidence/run30/android/observe-product.py'
spec = importlib.util.spec_from_file_location('run30_product', source)
original = importlib.util.module_from_spec(spec)
spec.loader.exec_module(original)
ui = original.m
original.APK = options.app.resolve(strict=True)
original.TEST = options.test.resolve(strict=True)
original.OUT = ui.OUT = options.output.resolve()
ui.SHOTS = options.screenshots.resolve()
ui.SERIAL = options.serial
ui.ADB = str(adb)
ui.checks, ui.captures = [], []
if ui.adb('shell', 'getprop', 'ro.kernel.qemu').strip() != '1':
    parser.error('Selected device did not report emulator mode.')

identity = {}
targets = [(ui.APP, original.APK)]
if options.scope != 'product':
    targets.append(('com.natophonetics.fonttest', original.TEST))
for package, apk in targets:
    if package != ui.APP and ('package:' + package) not in ui.adb('shell', 'pm', 'list', 'packages', package).splitlines():
        ui.adb('install', '-r', str(apk))
    installed = ui.adb('shell', 'pm', 'path', package).strip().removeprefix('package:')
    expected = digest(apk)
    if not installed or ui.adb('shell', 'sha256sum', installed).split()[0] != expected:
        raise RuntimeError(f'Expected exact installed {package}: {apk}')
    identity[package] = expected

original.OUT.mkdir(parents=True)
ui.SHOTS.mkdir(parents=True)
(ui.OUT / 'command.json').write_text(json.dumps({
    'arguments': sys.argv[1:], 'serial': ui.SERIAL, 'installedApks': identity, 'python': sys.version,
    'run30ObserverSha256': digest(source), 'api': ui.adb('shell','getprop','ro.build.version.sdk').strip(),
    'abi': ui.adb('shell','getprop','ro.product.cpu.abi').strip(),
    'viewport': ui.adb('shell','wm','size').strip(), 'density': ui.adb('shell','wm','density').strip(),
}, indent=2) + '\n', encoding='utf-8')

if options.scope == 'product':
    # Capture real product input before the more expensive tile observer starts.
    scale = ui.adb('shell', 'settings', 'get', 'system', 'font_scale').strip()
    try:
        result = subprocess.run([ui.ADB, '-s', ui.SERIAL, 'shell', 'run-as', ui.APP, 'id'], capture_output=True)
        if result.returncode == 0 or b'not debuggable' not in result.stdout + result.stderr:
            raise RuntimeError('Expected non-debuggable Release product.')
        ui.adb('shell','settings','put','system','font_scale','1')
        ui.route('settings'); ui.tap(desc='Light'); ui.route('converter')
        ui.set_text('NUWJ359')
        for name, current in [('default', '1'), ('enlarged', '2'), ('restored', '1')]:
            ui.adb('shell', 'settings', 'put', 'system', 'font_scale', current)
            time.sleep(1.5)
            value = ui.expect(desc='Text to convert').get('text')
            measured = ui.adb('shell', 'settings', 'get', 'system', 'font_scale').strip()
            if float(measured) != float(current):
                raise RuntimeError(f'Unexpected Android font setting: {measured!r}')
            if value != 'NUWJ359':
                raise RuntimeError(f'Unexpected retained converter value at scale {current}: {value!r}')
            ui.screenshot('product-converter-' + name, f'Populated converter at system font scale {current}', 'light')
            ui.mark('product-converter-' + name, input=value, fontScale=measured)
    except Exception:
        # Preserve the actual failure screen before restoring its system settings.
        try:
            ui.screenshot('product-check-failed', 'Diagnostic screen when converter verification failed', 'observed in PNG')
        except Exception as capture_error:
            print(f'Failure screen unavailable: {capture_error}', file=sys.stderr)
        raise
    finally:
        if scale == 'null':
            ui.adb('shell', 'settings', 'delete', 'system', 'font_scale')
        else:
            ui.adb('shell', 'settings', 'put', 'system', 'font_scale', scale)
else:
    if options.scope == 'narrow-aligned':
        # A fixed swipe skipped converter-0 on this AVD. Change only the gesture:
        # keep the original input, visibility, saved-frame and baseline checks.
        original_scroll = original.scroll
        alignment = []

        def align_first_tile(up=True):
            if not up:
                return original_scroll(False)
            if len(alignment) >= 12:
                raise AssertionError('Twelve native-frame-guided attempts exhausted')
            name = f'align-{len(alignment) + 1}'
            original.request(name)
            capture = json.loads(ui.adb('exec-out', 'cat', original.REMOTE + '/' + name + '.json'))
            tile = next(n for n in capture['values'] if n['id'] == 'converter-0')
            viewport = original.byid(ui.dump(), 'screen-scroll')
            if viewport is None:
                raise AssertionError('Missing actual scroll viewport')
            left, top, right, bottom = original.bounds(viewport)
            frame = tile['frame']
            goal = (top + bottom - frame['height']) / 2
            delta = round(max(-400, min(400, frame['y'] - goal)))
            x, middle = (left + right) // 2, (top + bottom) // 2
            begin = middle + delta // 2
            alignment.append({'nativeY': frame['y'], 'height': frame['height'], 'viewport': [top, bottom],
                              'targetY': goal, 'gesture': [x, begin, x, begin - delta]})
            (ui.OUT / 'alignment.json').write_text(json.dumps(alignment, indent=2) + '\n', encoding='utf-8')
            ui.adb('shell', 'input', 'swipe', str(x), str(begin), str(x), str(begin - delta), '650')
            time.sleep(.3)

        original.scroll = align_first_tile
    sys.argv = [str(source)] + {'checkpoint': [], 'matrix': ['--matrix'],
                                 'windows': ['--windows'], 'narrow': ['--narrow-capture'],
                                 'narrow-aligned': ['--narrow-capture']}[options.scope]
    previous = ui.adb('shell', 'settings', 'get', 'system', 'font_scale').strip()
    try:
        original.main()
    finally:
        if previous == 'null':
            ui.adb('shell', 'settings', 'delete', 'system', 'font_scale')
