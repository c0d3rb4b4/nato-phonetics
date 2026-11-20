"""Exercise the ordinary four-ABI product on the disposable 32-bit Android 11 guest."""
import argparse
import hashlib
import importlib.util
import json
from pathlib import Path
import shutil
import subprocess
import sys
import time

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parents[3] / 'scripts'))
from android_runtime_abi import check_runtime, installed_abi

spec = importlib.util.spec_from_file_location('product', HERE.parents[1] / 'run30/android/observe-product.py')
product = importlib.util.module_from_spec(spec)
spec.loader.exec_module(product)
ui = product.m


def save(file, data):
    file.write_text(json.dumps(data, indent=2) + '\n', encoding='utf-8')


def start_observer():
    product.REMOTE = '/sdcard/Android/media/com.natophonetics.app/tile-observer'
    for package, file in [(ui.APP, product.APK), ('com.natophonetics.fonttest', product.TEST)]:
        path = ui.adb('shell', 'pm', 'path', package).strip().removeprefix('package:')
        assert ui.adb('shell', 'sha256sum', path).split()[0] == hashlib.sha256(file.read_bytes()).hexdigest()
    ui.adb('shell', 'rm', '-rf', product.REMOTE)
    ui.adb('shell', 'settings', 'put', 'system', 'font_scale', '1')
    log = (ui.OUT / 'observer-session.log').open('w', encoding='utf-8')
    args = [ui.ADB, '-s', ui.SERIAL, 'shell', 'am', 'instrument', '-w', '-e', 'evidenceDirectory', 'media',
            'com.natophonetics.fonttest/com.natophonetics.fonttest.TileLayoutInstrumentation']
    process = subprocess.Popen(args, stdout=log, stderr=subprocess.STDOUT)
    return process, log


def observe(label, scale):
    tree = ui.dump()
    field = ui.find(tree, desc='Text to convert')
    assert field is not None and field.get('text') == 'NUWJ359' and ui.find(tree, text='Word Converter') is not None
    product.snapshot(label, 'light', scale)
    layout = json.loads((ui.OUT / (label + '-native-layout.json')).read_text())
    rows = {row['id']: row for row in layout['values']}
    tile = rows['converter-0']['frame']
    density = layout['dimensions']['density']
    assert abs(tile['height'] - 150 * scale * density) <= 1 and abs(tile['width'] - 110 * scale * density) <= 1
    word = rows['converter-0-word-run']
    assert word['text'] == 'November' and abs(word['resolvedTextSizePx'] - 16 * scale * density) <= 1
    return {'stage': label, 'fontScale': scale, 'draft': field.get('text'), 'tileWidth': tile['width'],
            'tileHeight': tile['height'], 'word': word['text'], 'wordPaintPx': word['resolvedTextSizePx'],
            'activityIdentity': layout['activityIdentity'], 'runtimePid': layout['runtimePid']}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('product', type=Path)
    parser.add_argument('observer', type=Path)
    parser.add_argument('abi', choices=['x86', 'armeabi-v7a'])
    parser.add_argument('output', type=Path)
    parser.add_argument('screens', type=Path)
    args = parser.parse_args()
    ui.SERIAL, ui.ADB = 'emulator-5578', shutil.which('adb')
    assert ui.adb('shell', 'getprop', 'ro.build.version.sdk').strip() == '30'
    assert ui.adb('shell', 'getprop', 'ro.product.cpu.abi').strip() == 'x86'
    assert args.abi in ui.adb('shell', 'getprop', 'ro.product.cpu.abilist').strip().split(',')
    product.APK, product.TEST = args.product.resolve(strict=True), args.observer.resolve(strict=True)
    ui.OUT = product.OUT = args.output.resolve()
    ui.SHOTS = args.screens.resolve()
    assert not ui.OUT.exists() and not ui.SHOTS.exists()
    ui.OUT.mkdir(parents=True)
    ui.SHOTS.mkdir(parents=True)
    ui.checks, ui.captures = [], []
    original = ui.adb('shell', 'settings', 'get', 'system', 'font_scale').strip()
    result = {'passed': False, 'serial': ui.SERIAL, 'requestedAbi': args.abi, 'stages': []}
    theme = 'unobserved'
    process = log = None
    try:
        # The first install uses the ordinary PackageManager choice. The second
        # demonstrates a forced translated ABI on the same disposable guest.
        flags = [] if args.abi == 'x86' else ['--abi', args.abi]
        result['install'] = ui.adb('install', '-r', *flags, str(product.APK)).strip()
        result['installMode'] = 'ordinary default' if not flags else 'explicit --abi ' + args.abi
        primary = installed_abi(ui.adb('shell', 'dumpsys', 'package', ui.APP))
        assert primary == args.abi, primary
        # Android 11 pm path exits nonzero for a missing package. Install the
        # test-only observer before the existing driver's installed-hash check.
        result['observerInstall'] = ui.adb('install', '-r', str(product.TEST)).strip()
        process, log = start_observer()
        product.wait_file('ready.json', 45)
        ui.expect(desc='Light', timeout=45)
        ui.tap(desc='Light')
        theme = 'light'
        ui.route('converter')
        assert ui.expect(desc='Text to convert').get('text', '') in ('', 'Example: CV34 7AP')
        ui.tap(desc='Text to convert')
        ui.adb('shell', 'input', 'text', 'NUWJ359')
        if 'mInputShown=true' in ui.adb('shell', 'dumpsys', 'input_method'):
            ui.adb('shell', 'input', 'keyevent', 'KEYCODE_BACK')
        assert ui.expect(desc='Text to convert').get('text') == 'NUWJ359'
        for label, scale in [('converter-1', 1), ('converter-2', 2), ('converter-returned-1', 1)]:
            if result['stages']:
                ui.adb('shell', 'settings', 'put', 'system', 'font_scale', str(scale))
                time.sleep(1.5)
            result['stages'].append(observe(label, scale))
        assert len({r['activityIdentity'] for r in result['stages']}) == 1
        assert len({r['runtimePid'] for r in result['stages']}) == 1
        assert ui.captures[0]['sha256'] != ui.captures[1]['sha256'] != ui.captures[2]['sha256']
        observation = json.loads(ui.adb('exec-out', 'cat', product.REMOTE + '/runtime-libraries.json'))
        save(ui.OUT / 'mapped-libraries.json', observation)
        path = ui.adb('shell', 'pm', 'path', ui.APP).strip().removeprefix('package:')
        installed = ui.adb('shell', 'sha256sum', path).split()[0]
        result['runtime'] = check_runtime(product.APK, path, installed, primary, args.abi,
                                          observation, result['stages'][0]['runtimePid'])
        result['nativeBridge'] = ui.adb('shell', 'getprop', 'ro.dalvik.vm.native.bridge').strip()
        result['bridgeMapped'] = any('libndk_translation' in row['path'] or 'libhoudini' in row['path']
                                     for row in observation['mappings'])
        result['productSha256'] = hashlib.sha256(product.APK.read_bytes()).hexdigest()
        result['passed'] = True
    except Exception as failure:
        result['error'] = repr(failure)
        ui.screenshot('diagnostic', 'State at the interrupted converter smoke check', theme)
        raise
    finally:
        save(ui.OUT / 'result.json', result)
        if process is not None and process.poll() is None:
            product.request('finish', True)
            process.wait(timeout=20)
        if log is not None:
            log.close()
        if original == 'null':
            ui.adb('shell', 'settings', 'delete', 'system', 'font_scale')
        else:
            ui.adb('shell', 'settings', 'put', 'system', 'font_scale', original)


if __name__ == '__main__':
    main()
