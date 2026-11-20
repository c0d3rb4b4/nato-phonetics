"""Actual unchanged ARM64 Release product samples; no Metro or root replacement."""
from pathlib import Path
import datetime
import hashlib
import json
import os
import re
import subprocess
import time
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[4]
OUT = Path(__file__).resolve().parent
SHOTS = OUT.parent / 'screenshots/android'
ADB = [str(Path(os.environ['ANDROID_HOME']) / 'platform-tools/adb'), '-s', 'emulator-5580']
APP = 'com.natophonetics.app'
metadata = []

def adb(*args, raw=False):
    value = subprocess.check_output(ADB + list(args), timeout=40)
    return value if raw else value.decode().strip()

def dump(name):
    adb('shell', 'uiautomator', 'dump', '/sdcard/nato-run28.xml')
    xml = adb('exec-out', 'cat', '/sdcard/nato-run28.xml')
    (OUT / 'hierarchies').mkdir(exist_ok=True)
    (OUT / 'hierarchies' / (name + '.xml')).write_text(xml)
    return list(ET.fromstring(xml).iter('node'))

def input_node(name):
    nodes = dump(name)
    return next(node for node in nodes if node.get('resource-id', '').split('/')[-1] == 'converter-input')

def capture(name, state, scale):
    image = adb('exec-out', 'screencap', '-p', raw=True)
    assert image[:8] == b'\x89PNG\r\n\x1a\n'
    (SHOTS / (name + '.png')).write_bytes(image)
    metadata.append({'file': name + '.png', 'state': state, 'fontScale': scale, 'theme': 'retained dark preference; inspected in actual capture',
                     'timestamp': datetime.datetime.now(datetime.timezone.utc).isoformat(),
                     'sha256': hashlib.sha256(image).hexdigest(), 'command': 'adb -s emulator-5580 exec-out screencap -p',
                     'candidate': 'unchanged Run27 non-debuggable ARM64 Release engineering test copy'})

expected = json.loads((ROOT / 'docs/evidence/run27/android/release-artifacts.json').read_text())['artifacts']['app-release-local-test.apk']['sha256']
installed = adb('shell', 'pm', 'path', APP).removeprefix('package:')
actual = adb('shell', 'sha256sum', installed).split()[0]
assert actual == expected, 'Wrong installed Release artifact'
original_scale = adb('shell', 'settings', 'get', 'system', 'font_scale')
identity = {'installedApkSha256': actual, 'expectedApkSha256': expected,
            'runtime': adb('shell', 'getprop', 'ro.build.version.release'), 'api': adb('shell', 'getprop', 'ro.build.version.sdk'),
            'cpuAbiList': adb('shell', 'getprop', 'ro.product.cpu.abilist'), 'cpuAbiList32': adb('shell', 'getprop', 'ro.product.cpu.abilist32'),
            'size': adb('shell', 'wm', 'size'), 'density': adb('shell', 'wm', 'density'),
            'originalFontScale': original_scale, 'metro': 'not used; embedded product JS', 'appDataCleared': False,
            'scope': 'sample input retention/pixels and native-harness compatibility; not full Release fixture/raster/window acceptance'}
try:
    adb('shell', 'am', 'force-stop', APP)
    adb('shell', 'settings', 'put', 'system', 'font_scale', '1')
    adb('shell', 'am', 'start', '-W', '-a', 'android.intent.action.VIEW', '-d', 'natophonetics://converter', APP)
    time.sleep(2)
    node = input_node('converter-before')
    assert node.get('text', '') in ['', 'Example: CV34 7AP'], node.attrib
    box = list(map(int, re.findall(r'-?\d+', node.attrib['bounds'])))
    adb('shell', 'input', 'tap', str((box[0]+box[2])//2), str((box[1]+box[3])//2))
    adb('shell', 'input', 'text', 'NUWJ359')
    adb('shell', 'input', 'keyevent', '4')
    time.sleep(.5)
    assert input_node('release-converter-default').get('text') == 'NUWJ359'
    capture('release-converter-default', 'Populated converter at default scale', 1)
    adb('shell', 'settings', 'put', 'system', 'font_scale', '2')
    time.sleep(1)
    assert input_node('release-converter-live2').get('text') == 'NUWJ359'
    capture('release-converter-live2', 'Same converter after live system-font change to2; sample input retained', 2)
    adb('shell', 'settings', 'put', 'system', 'font_scale', '1')
    adb('shell', 'am', 'start', '-W', '-a', 'android.intent.action.VIEW', '-d', 'natophonetics://alphabet', APP)
    time.sleep(1)
    dump('release-reference-default')
    capture('release-reference-default', 'Reference after return to default scale', 1)
    identity['passed'] = True
finally:
    adb('shell', 'settings', 'put', 'system', 'font_scale', original_scale)
    (SHOTS / 'metadata.json').write_text(json.dumps(metadata, indent=2) + '\n')
    (OUT / 'release-sample-identity.json').write_text(json.dumps(identity, indent=2) + '\n')
print(json.dumps(identity))
