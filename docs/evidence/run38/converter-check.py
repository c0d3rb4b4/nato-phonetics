"""Verify a Release converter phrase on the disposable Run 35 API 36 guest."""
import hashlib
import json
from pathlib import Path
import re
import subprocess
import sys
import time
from xml.etree import ElementTree

apk = Path(sys.argv[1])
out = Path(sys.argv[2])
out.mkdir(parents=True, exist_ok=True)
package = 'com.natophonetics.app'


def adb(*args):
    return subprocess.check_output(['adb', '-s', 'emulator-5580', *args], timeout=30)


def shell(*args):
    return adb('shell', *args).decode().strip()


def find(label):
    deadline = time.monotonic() + 20
    while time.monotonic() < deadline:
        shell('uiautomator', 'dump', '/sdcard/run38-converter.xml')
        nodes = ElementTree.fromstring(adb('exec-out', 'cat', '/sdcard/run38-converter.xml'))
        for node in nodes.iter('node'):
            if node.get('package') == package and label in (node.get('content-desc'), node.get('resource-id'), node.get('text')):
                return node.attrib
    raise ValueError(f'Missing {label}')


def tap(node):
    left, top, right, bottom = map(int, re.findall(r'\d+', node['bounds']))
    shell('input', 'tap', str((left + right) // 2), str((top + bottom) // 2))


def capture(name):
    (out / name).write_bytes(adb('exec-out', 'screencap', '-p'))


installed = shell('pm', 'path', package).removeprefix('package:')
digest = shell('sha256sum', installed).split()[0]
assert digest == hashlib.sha256(apk.read_bytes()).hexdigest()
shell('am', 'force-stop', package)
shell('am', 'start', '-W', '-a', 'android.intent.action.VIEW', '-d', 'natophonetics://converter', package)
tap(find('Text to convert'))
shell('input', 'text', '359')
shell('input', 'keyevent', '4')
assert find('Text to convert')['text'] == '359'
play = find('Play Full Phrase')
capture('universal-converter-idle.png')
started = shell('date', '+%m-%d_%H:%M:%S.%3N').replace('_', ' ')
tap(play)
time.sleep(0.22)
capture('universal-converter-active.png')
deadline = time.monotonic() + 25
while time.monotonic() < deadline:
    lines = adb('logcat', '-d', '-T', started, '-v', 'brief', 'GoogleTTSServiceImpl:I', '*:S').decode().splitlines()
    requests = [line for line in lines if 'Synthesis request for locale' in line]
    if len(requests) >= 3:
        break
    time.sleep(0.3)
assert len(requests) == 3, requests
after = find('Play Full Phrase')
assert after['bounds'] == play['bounds']
assert find('Text to convert')['text'] == '359'
print(json.dumps(dict(installedSha256=digest, package=package, device=shell('getprop', 'ro.build.fingerprint'),
                      primaryCpuAbi=re.search(r'primaryCpuAbi=(\S+)', shell('dumpsys', 'package', package))[1],
                      inputAfter='359', playBoundsBeforeAndAfter=play['bounds'], requests=requests), indent=2))
