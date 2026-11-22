"""Discriminate Android live font changes from the scoped settings-reset test."""
import argparse
import hashlib
import json
from pathlib import Path
import re
import subprocess
import time
from xml.etree import ElementTree

PACKAGE = 'com.natophonetics.app.dev'
XML = '/data/local/tmp/nato-run34-reset.xml'


def check(serial, apk, output, reset_only):
    output.mkdir(parents=True, exist_ok=False)
    report = {'serial': serial, 'apkSha256': hashlib.sha256(apk.read_bytes()).hexdigest(), 'returns': []}

    def adb(*args):
        return subprocess.check_output(['adb', '-s', serial, *args], timeout=40)

    def shell(*args):
        return adb('shell', *args).decode().strip()

    def observe(name):
        if 'dumped to' not in shell('uiautomator', 'dump', XML):
            raise AssertionError('Could not obtain fresh hierarchy')
        data = adb('exec-out', 'cat', XML)
        (output / (name + '.xml')).write_bytes(data)
        nodes = [node for node in ElementTree.fromstring(data).iter('node') if node.get('package') == PACKAGE]
        return {node.get('content-desc'): node for node in nodes if node.get('content-desc')}

    def shot(name):
        (output / (name + '.png')).write_bytes(adb('exec-out', 'screencap', '-p'))

    def tap(node):
        left, top, right, bottom = map(int, re.findall(r'\d+', node.get('bounds', '')))
        shell('input', 'tap', str((left + right) // 2), str((top + bottom) // 2))

    def cold_settings():
        shell('am', 'force-stop', PACKAGE)
        shell('am', 'start', '-W', '-a', 'android.intent.action.VIEW', '-d', 'natophonetics-dev://settings', PACKAGE)
        time.sleep(2)

    def checked(name, nodes):
        return name in nodes and nodes[name].get('checked') == 'true'

    original = shell('settings', 'get', 'system', 'font_scale')
    try:
        installed = shell('pm', 'path', PACKAGE).removeprefix('package:')
        if shell('sha256sum', installed).split()[0] != report['apkSha256']:
            raise AssertionError('Installed bytes changed')
        for scale in (() if reset_only else ('1.0', '2.0', '1.0')):
            shell('settings', 'put', 'system', 'font_scale', scale)
            if not report['returns']:
                cold_settings()
            time.sleep(2)
            nodes = observe(f'font-step-{len(report["returns"])}')
            report['returns'].append({'scale': scale, 'settingsVisible': 'Full cards' in nodes,
                                      'referenceVisible': 'Letters A–Z' in nodes})
        cold_settings()
        before = observe('reset-prior-choices')
        if not checked('Dark', before) or not checked('Full cards', before):
            raise AssertionError('Expected the saved Dark and Full cards selections')
        shell('input', 'swipe', '540', '1730', '540', '810', '360')
        reset = observe('reset-control')['Reset Preferences']
        shot('settings-reset-controls')
        tap(reset)
        time.sleep(2)
        cold_settings()
        after = observe('reset-restored-choices')
        for label in ['System', 'Phonetic bubbles', 'Rate 1×', 'Word pause 300 ms']:
            if not checked(label, after):
                raise AssertionError('Reset did not restore ' + label)
        shot('settings-reset-restored')
        report['status'] = 'passed'
    except Exception as error:
        report.update(status='failed', error=str(error))
        raise
    finally:
        shell('settings', 'put', 'system', 'font_scale', original)
        shell('rm', '-f', XML)
        (output / 'report.json').write_text(json.dumps(report, indent=2) + '\n', encoding='utf-8')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--serial', required=True)
    parser.add_argument('apk', type=Path)
    parser.add_argument('output', type=Path)
    parser.add_argument('--reset-only', action='store_true')
    args = parser.parse_args()
    check(args.serial, args.apk, args.output, args.reset_only)
