"""Verify the Run 35 installed development APK on a disposable emulator."""
import hashlib
import json
from pathlib import Path
import re
import socket
import subprocess
import sys
import time
from xml.etree import ElementTree


PACKAGE = 'com.natophonetics.app.dev'
XML = '/data/local/tmp/nato-run35-layout.xml'
DIGITS = dict(zip('0123456789', ('zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine')))


def check(serial, apk, output):
    output.mkdir(parents=True, exist_ok=False)
    report = {'serial': serial, 'apkSha256': hashlib.sha256(apk.read_bytes()).hexdigest(), 'frames': [], 'checks': []}

    def adb(*args, binary=False):
        result = subprocess.check_output(['adb', '-s', serial, *args], timeout=50)
        return result if binary else result.decode(errors='replace').strip()

    def shell(*args):
        return adb('shell', *args)

    def hierarchy():
        if 'dumped to' not in shell('uiautomator', 'dump', XML):
            return b'', []
        raw = adb('exec-out', 'cat', XML, binary=True)
        nodes = [node for node in ElementTree.fromstring(raw).iter('node') if node.get('package') == PACKAGE]
        return raw, nodes

    def matches(node, label):
        left, top, right, bottom = bounds(node)
        return right > left and bottom > top and any(
            label == node.get(attribute) for attribute in ('text', 'content-desc', 'resource-id'))

    def bounds(node):
        return tuple(map(int, re.findall(r'\d+', node.get('bounds', ''))))

    def find(label, attempts=4):
        for _ in range(attempts):
            raw, nodes = hierarchy()
            for node in nodes:
                if matches(node, label):
                    return raw, node
        raise AssertionError(f'{label!r} is not visible')

    def tap_node(node):
        left, top, right, bottom = bounds(node)
        assert right > left and bottom > top, node.attrib
        shell('input', 'tap', str((left + right) // 2), str((top + bottom) // 2))

    def swipe(up=True):
        start, end = (height * 4 // 5, height // 3) if up else (height // 3, height * 4 // 5)
        shell('input', 'swipe', str(width // 2), str(start), str(width // 2), str(end), '450')

    def seek(label, up=True, limit=9):
        for step in range(limit + 1):
            raw, nodes = hierarchy()
            for node in nodes:
                if matches(node, label):
                    return raw, node
            if step < limit:
                swipe(up)
        raise AssertionError(f'{label!r} is not reachable after {limit} scrolls')

    def tap(label, scroll=False):
        tap_node((seek if scroll else find)(label)[1])

    def tap_above(label):
        tap_node(seek(label, up=False)[1])

    def open_page(route):
        shell('am', 'start', '-W', '-a', 'android.intent.action.VIEW', '-d', 'natophonetics-dev://' + route, PACKAGE)

    def capture(name, label, locate=find):
        raw, node = locate(label)
        (output / f'{name}.xml').write_bytes(raw)
        pixels = adb('exec-out', 'screencap', '-p', binary=True)
        assert pixels.startswith(b'\x89PNG\r\n\x1a\n'), 'unexpected Android screenshot format'
        (output / f'{name}.png').write_bytes(pixels)
        report['frames'].append({'name': name, 'visibleLabel': label, 'bounds': node.get('bounds'),
                                 'fontScale': shell('settings', 'get', 'system', 'font_scale'),
                                 'appearance': shell('cmd', 'uimode', 'night'),
                                 'sha256': hashlib.sha256(pixels).hexdigest()})

    def record(name):
        report['checks'].append(name)
        print(f'PASS {name}', flush=True)

    def absent(*labels):
        _, nodes = hierarchy()
        assert not [node.attrib for node in nodes for label in labels if matches(node, label)], labels

    original_scale = shell('settings', 'get', 'system', 'font_scale')
    original_night = shell('cmd', 'uimode', 'night').split(': ', 1)[-1]
    try:
        assert shell('getprop', 'ro.kernel.qemu') == '1' and 'tcp:8081' not in adb('reverse', '--list')
        with socket.socket() as probe:
            probe.settimeout(1)
            assert probe.connect_ex(('127.0.0.1', 8081)) != 0, 'Metro listener is active'
        viewport = shell('wm', 'size')
        width, height = map(int, viewport.splitlines()[-1].split()[-1].split('x'))
        report.update(api=shell('getprop', 'ro.build.version.sdk'), image=shell('getprop', 'ro.build.fingerprint'),
                      abi=shell('getprop', 'ro.product.cpu.abi'), viewport=viewport, density=shell('wm', 'density'),
                      install=adb('install', '-r', str(apk)))
        installed = shell('pm', 'path', PACKAGE).removeprefix('package:')
        assert shell('sha256sum', installed).split()[0] == report['apkSha256']
        report['installedPath'] = installed
        shell('settings', 'put', 'system', 'font_scale', '1.0')
        shell('cmd', 'uimode', 'night', 'no')
        shell('am', 'force-stop', PACKAGE)
        shell('am', 'start', '-W', '-n', PACKAGE + '/com.natophonetics.app.MainActivity')
        find('alphabet-A')
        record('exact development APK cold-launches Reference without Metro')

        tap('Letter Quiz')
        capture('quiz-setup-light', 'Answer mode')
        tap('Listen and choose a symbol')
        assert find('Listen and choose a symbol')[1].get('checked') == 'true'
        tap('Digits', scroll=True)
        tap('Start round', scroll=True)
        seek('Play code word', up=False)
        absent('quiz-answer', 'quiz-letter', 'quiz-code-word')
        capture('listening-concealed-light', 'Play code word')
        tap('Show code word as text')
        capture('listening-text-light', 'quiz-code-word')
        tap('End round and review', scroll=True)
        tap_above('Choose a new round')
        tap('Type a code word', scroll=True)
        tap('Start new round', scroll=True)
        record('quiz setup checked state and explicit listening text alternative')

        shell('cmd', 'uimode', 'night', 'yes')
        shell('settings', 'put', 'system', 'font_scale', '2.0')
        time.sleep(1)
        _, letter = seek('quiz-letter', up=False)
        symbol = (letter.get('text') or letter.get('content-desc', '')).split()[-1]
        assert symbol in DIGITS, letter.attrib
        tap('quiz-typed-answer', scroll=True)
        shell('input', 'text', DIGITS[symbol])
        capture('typed-keyboard-dark-2x', 'quiz-typed-answer')
        shell('input', 'keyevent', 'KEYCODE_BACK')
        tap('Menu')
        tap('Letter Quiz')
        assert seek('quiz-typed-answer')[1].get('text') == DIGITS[symbol]
        tap('Check answer', scroll=True)
        find('quiz-submitted-answer')
        _, nodes = hierarchy()
        if any(matches(node, 'Dismiss') for node in nodes):
            capture('audio-notice-dark-2x', 'Dismiss')
            tap('Dismiss')
            absent('Dismiss')
            record('audio provider notice dismisses without losing submitted answer')
        capture('typed-feedback-dark-2x', 'quiz-next', seek)
        find('Next question')
        tap('End round and review', scroll=True)
        capture('round-review-dark-2x', 'quiz-score', lambda label: seek(label, up=False))
        assert '1 correct of 1 answered' in find('quiz-score')[1].get('text', '')
        record('2× dark typed input, retained draft across tabs, correct answer and early recap')

        open_page('progress')
        capture('progress-summary-dark-2x', 'progress-summary')
        assert '1 answers saved' in find('progress-summary')[1].get('text', '')
        capture('progress-symbol-dark-2x', f'progress-symbol-{symbol}', seek)
        tap('progress-clear', scroll=True)
        capture('progress-confirm-dark-2x', 'progress-delete', seek)
        tap('Keep progress', scroll=True)
        open_page('progress')
        assert '1 answers saved' in seek('progress-summary', up=False)[1].get('text', '')
        tap('progress-clear', scroll=True)
        tap('progress-delete', scroll=True)
        capture('progress-cleared-dark-2x', 'Progress cleared. Preferences were kept.', seek)
        shell('am', 'force-stop', PACKAGE)
        open_page('progress')
        assert '0 answers saved' in find('progress-summary')[1].get('text', '')
        record('saved symbol, deletion cancellation, confirmed deletion and zero totals after restart')

        open_page('about')
        capture('about-dark-2x', 'Read privacy policy', seek)
        tap('Read privacy policy')
        find('Privacy policy')
        capture('privacy-speech-dark-2x', 'Speech and connectivity', seek)
        _, nodes = hierarchy()
        if not any('Speech output does not request microphone access.' in node.get('text', '') for node in nodes):
            swipe()
        capture('privacy-speech-ending-dark-2x', 'Offline availability', seek)
        shell('input', 'keyevent', 'KEYCODE_BACK')
        seek('Read privacy policy')
        open_page('missing-route')
        capture('not-found-dark-2x', 'Open site map')
        tap('Open site map')
        find('Site map')
        tap('Reference')
        find('alphabet-A')
        record('About to Privacy and Android Back, unknown-route recovery and Reference')
        report['status'] = 'passed'
    except Exception as error:
        report.update(status='failed', error=str(error))
        (output / 'failure.xml').write_bytes(hierarchy()[0])
        (output / 'failure.png').write_bytes(adb('exec-out', 'screencap', '-p', binary=True))
        raise
    finally:
        shell('settings', 'put', 'system', 'font_scale', original_scale)
        shell('cmd', 'uimode', 'night', original_night)
        shell('rm', '-f', XML)
        (output / 'metadata.json').write_text(json.dumps(report, indent=2) + '\n', encoding='utf-8')


if __name__ == '__main__':
    check(sys.argv[1], Path(sys.argv[2]), Path(sys.argv[3]))
