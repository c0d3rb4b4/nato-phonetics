#!/usr/bin/env python3
"""Drive the real installed Android app on an isolated emulator using adb.

No app-source hooks or speech-provider substitution. Evidence lives beside this
driver; all taps target accessibility names/text from UIAutomator snapshots.
"""
import hashlib
import json
import os
from pathlib import Path
import re
import subprocess
import time
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[4]
OUT = Path(__file__).resolve().parent
SHOTS = OUT.parent / 'screenshots' / 'android'
ADB = os.environ.get('ADB', '/tmp/nato-android-sdk/platform-tools/adb')
SERIAL = os.environ.get('ANDROID_SERIAL', 'emulator-5580')
APP = 'com.natophonetics.app'
checks = json.loads((OUT / "checks.json").read_text()) if (OUT / "checks.json").exists() else []
captures = json.loads((SHOTS / "metadata.json").read_text()) if (SHOTS / "metadata.json").exists() else []


def adb(*args, raw=False, input=None):
    result = subprocess.run([ADB, '-s', SERIAL, *args], input=input,
                            stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=90)
    if result.returncode:
        raise RuntimeError(f'adb {args}: {result.stderr.decode()} {result.stdout.decode(errors="replace")}')
    return result.stdout if raw else result.stdout.decode()


def mark(name, **details):
    row = {'check': name, 'passed': True, 'timestamp': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()), **details}
    checks[:] = [previous for previous in checks if previous["check"] != name]
    checks.append(row)
    print(json.dumps(row), flush=True)
    (OUT / 'checks.json').write_text(json.dumps(checks, indent=2) + '\n')


def dump(name=None):
    for attempt in range(3):
        try:
            adb('shell', 'uiautomator', 'dump', '/sdcard/nato-window.xml');break
        except RuntimeError:
            if attempt==2:raise
            time.sleep(1)
    value = adb('exec-out', 'cat', '/sdcard/nato-window.xml')
    if name:
        (OUT / 'hierarchies').mkdir(exist_ok=True)
        (OUT / 'hierarchies' / f'{name}.xml').write_text(value)
    return ET.fromstring(value)


def nodes(tree):
    return list(tree.iter('node'))


def find(tree, text=None, desc=None, contains=None):
    for node in nodes(tree):
        if text is not None and node.get('text') != text:
            continue
        if desc is not None and node.get('content-desc') != desc:
            continue
        if contains is not None and contains not in (node.get('text', '') + ' ' + node.get('content-desc', '')):
            continue
        return node
    return None


def expect(text=None, desc=None, contains=None, timeout=12, name=None):
    end = time.monotonic() + timeout
    while True:
        tree = dump(name)
        node = find(tree, text, desc, contains)
        if node is not None:
            return node
        if time.monotonic() > end:
            raise AssertionError(f'Missing text={text!r} desc={desc!r} contains={contains!r}: {ET.tostring(tree).decode()}')
        time.sleep(0.4)


def tap(text=None, desc=None, contains=None):
    node = expect(text, desc, contains)
    coords = list(map(int, re.findall(r'\d+', node.get('bounds', ''))))
    assert len(coords) == 4, node.attrib
    adb('shell', 'input', 'tap', str((coords[0] + coords[2]) // 2), str((coords[1] + coords[3]) // 2))


def route(path, cold=False):
    if cold:
        adb('shell', 'am', 'force-stop', APP)
    value = adb('shell', 'am', 'start', '-W', '-a', 'android.intent.action.VIEW',
                '-d', 'natophonetics://' + path.lstrip('/'), '-p', APP)
    time.sleep(1.2 if cold else 0.4)
    return value


def screenshot(name, state, theme='light'):
    SHOTS.mkdir(parents=True, exist_ok=True)
    dump(name)
    data = adb('exec-out', 'screencap', '-p', raw=True)
    file = SHOTS / f'{name}.png'
    file.write_bytes(data)
    width, height = int.from_bytes(data[16:20], 'big'), int.from_bytes(data[20:24], 'big')
    captures[:] = [previous for previous in captures if previous['file'] != file.name]
    captures.append({'file': file.name, 'state': state, 'theme': theme, 'width': width,
                     'height': height, 'sha256': hashlib.sha256(data).hexdigest(),
                     'timestamp': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()),
                     'command': f'adb -s {SERIAL} exec-out screencap -p',
                     'androidVersion': adb('shell','getprop','ro.build.version.release').strip(),
                     'fontScale': adb('shell','settings','get','system','font_scale').strip(),
                     'displaySize': adb('shell','wm','size').strip(), 'displayDensity': adb('shell','wm','density').strip()})
    (SHOTS / 'metadata.json').write_text(json.dumps(captures, indent=2) + '\n')


def set_text(value):
    tap(desc='Text to convert')
    adb('shell', 'input', 'keyevent', 'KEYCODE_MOVE_END')
    adb('shell', 'input', 'keyevent', '--longpress', 'KEYCODE_DEL')
    # Select-all is sent by the emulator's ordinary hardware keyboard path.
    adb('shell', 'input', 'keycombination', '113', '29')
    adb('shell', 'input', 'text', value.replace(' ', '%s'))
    adb('shell', 'input', 'keyevent', '4')
    node = expect(desc='Text to convert')
    assert node.get('text') == value, (node.get('text'), value)


def idle(name):
    tree = dump(name)
    assert find(tree, desc='Stop playback') is None, ET.tostring(tree).decode()
    for error in ['Speech could not be played', 'provider could not start',
                  'No speech completion', 'could not be stopped safely',
                  'did not confirm Stop', 'Device speech failed']:
        assert find(tree, contains=error) is None, ET.tostring(tree).decode()
    mark(name)


def runtime(expression=None):
    command = ['/tmp/nato-phonetics-toolchain/node_modules/.bin/node', str(OUT / 'read-runtime.cjs')]
    if expression is not None:
        command.append(expression)
    result = subprocess.run(command, capture_output=True, text=True, timeout=15, check=True)
    return json.loads(result.stdout)


def runtime_async(expression, timeout=20):
    runtime("globalThis.__natoAsyncResult = {pending:true}; (" + expression + ").then(value => { globalThis.__natoAsyncResult = {value}; }, error => { globalThis.__natoAsyncResult = {error:String(error),code:error.code}; }); 'pending'")
    end = time.monotonic() + timeout
    while time.monotonic() < end:
        result = runtime('globalThis.__natoAsyncResult')
        if not result.get('pending'):
            assert 'error' not in result, result
            return result.get('value')
        time.sleep(0.2)
    raise AssertionError('Asynchronous runtime observation timed out')


def terminal(name, expected='completed', timeout=35):
    end = time.monotonic() + timeout
    while time.monotonic() < end:
        snapshot = runtime()['playback']
        if snapshot['status'] == 'idle':
            assert (snapshot.get('result') or {}).get('status') == expected, snapshot
            mark(name, snapshot=snapshot)
            return snapshot
        time.sleep(0.3)
    raise AssertionError(f'Playback did not reach {expected}: {snapshot}')


