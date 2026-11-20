"""Measure the ordinary APK on the pre-34 text path and an actual Android split pair."""
import argparse
import hashlib
import importlib.util
import json
import re
import shutil
import sys
import time
from pathlib import Path

here = Path(__file__).resolve().parent
sys.path.insert(0, str(here.parents[3] / 'scripts'))
from android_runtime_abi import check_runtime, installed_abi
spec = importlib.util.spec_from_file_location('product', here.parents[1] / 'run30/android/observe-product.py')
product = importlib.util.module_from_spec(spec)
spec.loader.exec_module(product)
ui = product.m


def configuration(package):
    dump = ui.adb('shell', 'dumpsys', 'activity', 'activities')
    block = dump.split('packageName=' + package, 1)[1]
    line = re.search(r'^\s*CurrentConfiguration=(.*)$', block, re.M)[1]
    mode = re.search(r'mWindowingMode=(\S+)', line)[1]
    rect = re.search(r'mBounds=Rect\((\d+), (\d+) - (\d+), (\d+)\)', line)
    return {'mode': mode, 'bounds': [int(n) for n in rect.groups()], 'configuration': line}


def observe(name, mode, scale):
    app = configuration(ui.APP)
    assert app['mode'] == mode, app
    if mode == 'multi-window':
        settings = configuration('com.android.settings')
        assert settings['mode'] == mode and settings['bounds'][1] > app['bounds'][3], settings
        app['pairedSettings'] = settings
        # UIAutomator observes the focused pane. Touch its static title.
        ui.adb('shell', 'input', 'tap', '300', '100')
    node = ui.expect(desc='Text to convert')
    assert node.get('text') == 'NUWJ359', node.attrib
    assert ui.find(ui.dump(), text='Word Converter') is not None
    product.snapshot(name, 'light', scale)
    layout = json.loads((ui.OUT / (name + '-native-layout.json')).read_text())
    assert sum(row['id'] == 'converter-0' for row in layout['values']) == 1
    app.update(stage=name, fontScale=scale, draft=node.get('text'), activityIdentity=layout['activityIdentity'],
               runtimePid=layout['runtimePid'])
    return app


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('product', type=Path)
    parser.add_argument('observer', type=Path)
    parser.add_argument('serial')
    parser.add_argument('output', type=Path)
    parser.add_argument('screens', type=Path)
    args = parser.parse_args()
    ui.SERIAL, ui.ADB = args.serial, shutil.which('adb')
    assert ui.adb('shell', 'getprop', 'ro.kernel.qemu').strip() == '1'
    assert ui.adb('shell', 'getprop', 'ro.build.version.sdk').strip() == '33'
    assert ui.adb('shell', 'am', 'supports-multiwindow').strip() == 'true'
    product.APK, product.TEST = args.product.resolve(strict=True), args.observer.resolve(strict=True)
    ui.OUT = product.OUT = args.output.resolve()
    ui.SHOTS = args.screens.resolve()
    if ui.OUT.exists() or ui.SHOTS.exists():
        raise ValueError('Choose new evidence and screenshot directories')
    ui.OUT.mkdir(parents=True)
    ui.SHOTS.mkdir(parents=True)
    ui.checks, ui.captures = [], []
    original = ui.adb('shell', 'settings', 'get', 'system', 'font_scale').strip()
    rows = []
    result = {'passed': False, 'observations': rows}
    for package, apk in [(ui.APP, product.APK), ('com.natophonetics.fonttest', product.TEST)]:
        ui.adb('install', '-r', str(apk))
        path = ui.adb('shell', 'pm', 'path', package).strip().removeprefix('package:')
        assert ui.adb('shell', 'sha256sum', path).split()[0] == hashlib.sha256(apk.read_bytes()).hexdigest()
    ui.adb('shell', 'am', 'start', '-W', '-a', 'android.settings.SETTINGS')
    process, log = product.start()
    try:
        package = ui.adb('shell', 'dumpsys', 'package', ui.APP)
        abi = installed_abi(package)
        assert abi == 'x86_64', abi
        result['selectedPackageAbi'] = abi
        ui.tap(desc='Light')
        ui.route('converter')
        ui.set_text('NUWJ359')
        rows.append(observe('before-1', 'fullscreen', 1))
        ui.adb('shell', 'settings', 'put', 'system', 'font_scale', '2')
        time.sleep(1.5)
        rows.append(observe('before-2', 'fullscreen', 2))
        tasks = ui.adb('shell', 'dumpsys', 'activity', 'activities')
        task = re.search(r'\* Task\{\S+ #(\d+) type=standard A=\d+:com.android.settings[.\s]', tasks)[1]
        ui.adb('shell', 'dumpsys', 'activity', 'service', 'SystemUIService', 'WMShell',
               'splitscreen', 'moveToSideStage', task, '1')
        time.sleep(1.5)
        half = observe('split-half-2', 'multi-window', 2)
        rows.append(half)
        def keyboard_visible():
            return 'mInputShown=true' in ui.adb('shell', 'dumpsys', 'input_method')
        result['keyboardVisibleAtHalf'] = keyboard_visible()
        if result['keyboardVisibleAtHalf']:
            ui.adb('shell', 'input', 'keyevent', 'KEYCODE_BACK')
            time.sleep(.6)
            assert not keyboard_visible() and configuration(ui.APP)['mode'] == 'multi-window'
        def move_divider(row, to):
            middle = (row['bounds'][3] + row['pairedSettings']['bounds'][1]) // 2
            ui.adb('shell', 'input', 'swipe', '360', str(middle), '360', str(to), '1300')
            time.sleep(1.2)
        move_divider(half, 1180)
        large = observe('split-large-2', 'multi-window', 2)
        rows.append(large)
        assert large['bounds'][3] > half['bounds'][3] + 100
        # Scroll within the top app pane, keeping the Settings task visible below it.
        for _ in range(16):
            if product.complete(2, 'converter-0'):
                break
            ui.adb('shell', 'input', 'swipe', '14', '880', '14', '680', '550')
            time.sleep(.25)
        assert 'converter-0' in product.snapshot('split-visible-tile-2', 'light', 2)
        for _ in range(8):
            if ui.find(ui.dump(), desc='Text to convert') is not None:
                break
            ui.adb('shell', 'input', 'swipe', '14', '330', '14', '900', '350')
        assert ui.expect(desc='Text to convert').get('text') == 'NUWJ359'
        move_divider(large, 1595)
        rows.append(observe('restored-2', 'fullscreen', 2))
        ui.adb('shell', 'settings', 'put', 'system', 'font_scale', '1')
        time.sleep(1.5)
        rows.append(observe('returned-1', 'fullscreen', 1))
        assert rows[0]['bounds'] == rows[-1]['bounds'] and len({row['activityIdentity'] for row in rows}) == 1
        assert len({row['runtimePid'] for row in rows}) == 1
        loaded = json.loads(ui.adb('exec-out', 'cat', product.REMOTE + '/runtime-libraries.json'))
        (ui.OUT / 'mapped-libraries.json').write_text(json.dumps(loaded, indent=2) + '\n')
        installed = ui.adb('shell', 'pm', 'path', ui.APP).strip().removeprefix('package:')
        sha = ui.adb('shell', 'sha256sum', installed).split()[0]
        result['runtime'] = check_runtime(product.APK, installed, sha, abi, 'x86_64', loaded, rows[0]['runtimePid'])
        result['passed'] = True
    except Exception as failure:
        result['error'] = repr(failure)
        ui.screenshot('split-diagnostic', 'Screen at the failed split-screen check', 'light')
        raise
    finally:
        (ui.OUT / 'result.json').write_text(json.dumps(result, indent=2) + '\n')
        if process.poll() is None:
            product.request('finish', True)
            process.wait(timeout=20)
        log.close()
        if original == 'null':
            ui.adb('shell', 'settings', 'delete', 'system', 'font_scale')
        else:
            ui.adb('shell', 'settings', 'put', 'system', 'font_scale', original)


if __name__ == '__main__':
    main()
