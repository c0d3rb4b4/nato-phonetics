"""Capture the P05.9 flows on an isolated, Metro-free Android emulator."""
import argparse
import hashlib
import json
from pathlib import Path
import re
import socket
import subprocess
import time
from xml.etree import ElementTree


PACKAGE = 'com.natophonetics.app.dev'
XML = '/data/local/tmp/nato-run34-layout.xml'


def check(apk, output, serial):
    output.mkdir(parents=True, exist_ok=False)
    report = {'serial': serial, 'apkSha256': hashlib.sha256(apk.read_bytes()).hexdigest(), 'frames': []}

    def adb(*arguments, binary=False):
        data = subprocess.check_output(['adb', '-s', serial, *arguments], timeout=60)
        return data if binary else data.decode(errors='replace').strip()

    def shell(*arguments):
        return adb('shell', *arguments)

    def tree():
        if 'dumped to' not in shell('uiautomator', 'dump', XML):
            return b'', []
        raw = adb('exec-out', 'cat', XML, binary=True)
        nodes = [node for node in ElementTree.fromstring(raw).iter('node') if node.get('package') == PACKAGE]
        return raw, nodes

    def find(*labels):
        for _ in range(8):
            raw, nodes = tree()
            for node in nodes:
                if any(label in (node.get('text'), node.get('content-desc'), node.get('resource-id')) for label in labels):
                    return raw, node
            time.sleep(0.3)
        raise AssertionError('Not visible: ' + ', '.join(labels))

    def tap(label):
        _, node = find(label)
        left, top, right, bottom = map(int, re.findall(r'\d+', node.get('bounds', '')))
        shell('input', 'tap', str((left + right) // 2), str((top + bottom) // 2))

    def open_page(route):
        shell('am', 'start', '-W', '-a', 'android.intent.action.VIEW', '-d', 'natophonetics-dev://' + route, PACKAGE)

    def scroll(toward_end):
        size = shell('wm', 'size').splitlines()[-1].split()[-1]
        width, height = map(int, size.split('x'))
        x, low, high = str(width // 2), str(height * 4 // 5), str(height // 4)
        start, end = (low, high) if toward_end else (high, low)
        shell('input', 'swipe', x, start, x, end, '400')

    def capture(name, label):
        raw, node = find(label)
        (output / f'{name}.xml').write_bytes(raw)
        pixels = adb('exec-out', 'screencap', '-p', binary=True)
        if not pixels.startswith(b'\x89PNG\r\n\x1a\n'):
            raise AssertionError('Unexpected Android screenshot format')
        (output / f'{name}.png').write_bytes(pixels)
        report['frames'].append({'name': name, 'visibleLabel': label, 'bounds': node.get('bounds'),
                                 'fontScale': shell('settings', 'get', 'system', 'font_scale'),
                                 'sha256': hashlib.sha256(pixels).hexdigest()})

    def checked(label):
        _, node = find(label)
        if node.get('checked') != 'true':
            raise AssertionError(f'{label} reported {node.get("class")} checked={node.get("checked")}')

    original_scale = shell('settings', 'get', 'system', 'font_scale')
    try:
        if shell('getprop', 'ro.kernel.qemu') != '1' or 'tcp:8081' in adb('reverse', '--list'):
            raise AssertionError('Isolated Android emulator with Metro disconnected required')
        with socket.socket() as probe:
            probe.settimeout(1)
            if probe.connect_ex(('127.0.0.1', 8081)) == 0:
                raise AssertionError('Metro listener detected')
        report.update(api=shell('getprop', 'ro.build.version.sdk'),
                      image=shell('getprop', 'ro.build.fingerprint'),
                      abi=shell('getprop', 'ro.product.cpu.abi'), viewport=shell('wm', 'size'),
                      density=shell('wm', 'density'), systemAppearance=shell('cmd', 'uimode', 'night'),
                      install=adb('install', '-r', str(apk)))
        installed = shell('pm', 'path', PACKAGE).removeprefix('package:')
        if shell('sha256sum', installed).split()[0] != report['apkSha256']:
            raise AssertionError('Installed bytes differ from captured candidate')
        report['installedPath'] = installed
        shell('settings', 'put', 'system', 'font_scale', '1.0')
        shell('am', 'force-stop', PACKAGE)
        shell('am', 'start', '-W', '-n', PACKAGE + '/com.natophonetics.app.MainActivity')
        capture('reference-letters', 'alphabet-A')
        tap('Digits 0–9')
        capture('reference-digits', 'digit-0')
        checked('Digits 0–9')
        open_page('menu')
        capture('menu-default', 'Settings')
        tap('Settings')
        capture('settings-default', 'Full cards')
        shell('input', 'keyevent', 'KEYCODE_BACK')
        find('Settings')
        tap('Settings')
        tap('Full cards')
        checked('Full cards')
        tap('Dark')
        checked('Dark')
        capture('settings-dark', 'Full cards')
        shell('am', 'force-stop', PACKAGE)
        open_page('settings')
        checked('Dark')
        checked('Full cards')
        open_page('converter')
        tap('Text to convert')
        shell('input', 'text', 'NUWJ359')
        capture('converter-keyboard', 'converter-0')
        shell('input', 'keyevent', 'KEYCODE_BACK')
        capture('converter-cards', 'converter-0')
        open_page('voice-select')
        find('Refresh voice list', 'Retry voice list')
        capture('voice-select', 'Preview System Default')
        open_page('audio-help')
        capture('audio-help', 'Play audio test')
        open_page('_sitemap')
        capture('sitemap', 'Learning progress')
        open_page('menu')
        shell('settings', 'put', 'system', 'font_scale', '2.0')
        time.sleep(1)
        capture('menu-dark-enlarged', 'Settings')
        tap('Settings')
        capture('settings-dark-enlarged', 'Full cards')
        checked('Full cards')
        frames = {frame['name']: frame for frame in report['frames']}
        def height(frame):
            _, top, _, bottom = map(int, re.findall(r'\d+', frame['bounds']))
            return bottom - top
        before = frames['settings-dark']
        enlarged = frames['settings-dark-enlarged']
        if float(enlarged['fontScale']) != 2 or height(enlarged) <= height(before):
            raise AssertionError('Expected the selected radio to grow at 2×')
        shell('settings', 'put', 'system', 'font_scale', '1.0')
        scroll(toward_end=True)
        tap('Reset Preferences')
        scroll(toward_end=False)
        checked('System')
        pid = shell('pidof', PACKAGE)
        if not pid.isdigit():
            raise AssertionError('No running app process')
        report.update(status='passed', pid=pid)
    except Exception as error:
        report.update(status='failed', error=str(error))
        (output / 'failure.png').write_bytes(adb('exec-out', 'screencap', '-p', binary=True))
        raise
    finally:
        if original_scale == 'null':
            shell('settings', 'delete', 'system', 'font_scale')
        else:
            shell('settings', 'put', 'system', 'font_scale', original_scale)
        shell('rm', '-f', XML)
        (output / 'report.json').write_text(json.dumps(report, indent=2) + '\n', encoding='utf-8')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('apk', type=Path)
    parser.add_argument('output', type=Path)
    parser.add_argument('--serial', required=True)
    args = parser.parse_args()
    check(args.apk, args.output, args.serial)
