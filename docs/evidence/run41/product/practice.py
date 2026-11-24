"""Check practice discovery on a disposable guest with the indicated installed APK."""
import hashlib
import json
from pathlib import Path
import re
import subprocess
import sys
import xml.etree.ElementTree as ET


HERE = Path(__file__).resolve().parent
serial, apk_name, scenario = sys.argv[1:]
assert scenario in ('baseline', 'legacy', 'eligible', 'missing-model', 'large')
PACKAGE = 'com.natophonetics.app.dev' if scenario == 'baseline' else 'com.natophonetics.app'
images = {}
checks = []


def adb(*args):
    return subprocess.check_output(['adb', '-s', serial, *args], timeout=30)


def shell(*args):
    return adb('shell', *args).decode().strip()


def rows():
    path = '/sdcard/run41-legacy-window.xml'
    shell('uiautomator', 'dump', path)
    return [node.attrib for node in ET.fromstring(adb('exec-out', 'cat', path)).iter('node')]


def find(label, scroll=False, contains=False):
    for _ in range(12 if scroll else 4):
        for row in rows():
            bounds = tuple(map(int, re.findall(r'-?\d+', row['bounds'])))
            labels = (row['text'], row['resource-id'], row['content-desc'])
            matches = any(label in item for item in labels) if contains else label in labels
            if matches and bounds[0] < bounds[2] and bounds[1] < bounds[3]:
                return row, bounds
        if scroll:
            shell('input', 'swipe', str(width // 2), str(height * 4 // 5),
                  str(width // 2), str(height * 2 // 5), '360')
    raise ValueError('Visible control missing: ' + label)


def tap(label, scroll=False):
    _, (x, y, right, bottom) = find(label, scroll)
    shell('input', 'tap', str((x + right) // 2), str((y + bottom) // 2))


def capture(name):
    path = HERE.parent / 'screenshots/android' / (name + '.png')
    path.write_bytes(adb('exec-out', 'screencap', '-p'))
    images[name] = hashlib.sha256(path.read_bytes()).hexdigest()


def route(name):
    scheme = 'natophonetics-dev' if scenario == 'baseline' else 'natophonetics'
    shell('am', 'start', '-W', '-a', 'android.intent.action.VIEW', '-d', scheme + '://' + name, PACKAGE)


def permission_granted():
    return 'android.permission.RECORD_AUDIO: granted=true' in shell('dumpsys', 'package', PACKAGE)


api = int(shell('getprop', 'ro.build.version.sdk'))
assert api == (36 if scenario in ('eligible', 'missing-model') else 30)
width, height = map(int, re.findall(r'(\d+)x(\d+)', shell('wm', 'size'))[-1])
installed_path = shell('pm', 'path', PACKAGE).removeprefix('package:')
expected = hashlib.sha256(Path(apk_name).read_bytes()).hexdigest()
assert shell('sha256sum', installed_path).split()[0] == expected
assert not permission_granted()
route('letter-quiz')
notice = 'Spoken answers require Android 12 or later.'
if scenario in ('legacy', 'large'):
    find(notice, True)
    assert all(row['resource-id'] != 'mode-spoken' for row in rows())
    capture('api30-' + scenario + '-setup')
    checks.append('Android version guidance on quiz setup')
    if scenario == 'legacy':
        for name in ('mode-choice', 'mode-listening', 'mode-typed'):
            find(name)
        tap('mode-typed')
elif scenario in ('eligible', 'missing-model'):
    tap('mode-spoken')
    assert find('mode-spoken')[0]['checked'] == 'true'
    capture('api36-spoken-setup')
    tap('quiz-start', True)
    find('Start recording', True)
    assert not permission_granted()
    capture('api36-start')
    tap('Start recording', True)
    if scenario == 'eligible':
        find('While using the app')
        capture('api36-prompt')
        tap('While using the app')
        find('Microphone enabled. Tap Start recording when ready.')
        assert permission_granted()
        checks.append('Android 16 spoken mode available, prompt on Start, idle after grant')
    else:
        find('The device needs a US English speech model. Type your answer or install the model in device settings.', True)
        capture('api36-missing-model')
        checks.append('Missing en-US model reported before requesting permission')
else:
    tap('mode-spoken')
    assert find('mode-spoken')[0]['checked'] == 'true'

if scenario in ('legacy', 'baseline', 'missing-model'):
    if scenario != 'missing-model':
        tap('quiz-start', True)
    symbol = find('quiz-letter')[0]['text']
    words = dict(re.findall(r'letter: "([A-Z])", word: "([^"]+)"', Path('src/data/natoData.js').read_text()))
    if scenario == 'baseline':
        tap('Start recording', True)
        find('On-device speech recognition is unavailable. Type your answer instead.', True)
        capture('legacy-unavailable')
    tap('quiz-typed-answer', True)
    shell('input', 'text', words[symbol])
    shell('input', 'keyevent', '4')
    assert find('quiz-typed-answer')[0]['text'] == words[symbol]
    tap('Check answer', True)
    find('Correct! ' + symbol + ' is ' + words[symbol] + '.', True)
    checked_image = {'baseline': 'legacy-checked', 'legacy': 'api30-typed-checked',
                     'missing-model': 'api36-typed-checked'}
    capture(checked_image[scenario])
    tap('quiz-next', True)
    assert find('quiz-progress')[0]['text'].startswith('Question 2 of ')
    route('progress')
    summary = find('progress-summary')[0]['text']
    assert re.fullmatch(r'1 answers? saved · 1 correct · 0 errors', summary)
    checks.append(summary)
if scenario == 'legacy':
    for screen, label in [
        ('audio-help', notice),
        ('privacy', notice + ' The app does not request microphone access on this Android version.'),
        ('about', 'Letter/digit choice, listening and typed recall'),
        ('_sitemap', 'Practice with choices, listening or typed answers.'),
    ]:
        route(screen)
        find(label, True, contains=True)
        assert not any('Spoken answers with on-device' in row['text'] for row in rows())
        capture('api30-' + screen.lstrip('_'))
        checks.append(screen + ' matched')
assert permission_granted() == (scenario == 'eligible')
print(json.dumps({
    'package': PACKAGE, 'installedSha256': expected, 'api': api,
    'android': shell('getprop', 'ro.build.version.release'), 'size': shell('wm', 'size'),
    'density': shell('wm', 'density'), 'fontScale': shell('settings', 'get', 'system', 'font_scale'),
    'appPrimaryAbi': re.search(r'primaryCpuAbi=(\S+)', shell('dumpsys', 'package', PACKAGE))[1],
    'recordingPermissionGranted': permission_granted(), 'checks': checks, 'screenshotsSha256': images,
}, indent=2))
