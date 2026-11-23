"""Exercise the installed Develop app on the disposable, read-only Run 40 AVD.

Pass the serial and one scenario from the Run 40 README. The synthetic gRPC
experiments additionally take the local discovery INI and Run 38 PCM fixture,
with generated emulator bindings on PYTHONPATH. Keep recognition text in memory.
"""
from pathlib import Path
import hashlib
import re
import subprocess
import sys
import time
import xml.etree.ElementTree as ET

serial, action = sys.argv[1:3]
pkg = 'com.natophonetics.app.dev'
out = Path(__file__).parent / 'screenshots/android'

def adb(*args):
    return subprocess.check_output(['adb', '-s', serial, *args], timeout=25)

def shell(*args):
    return adb('shell', *args).decode().strip()

def rows():
    shell('uiautomator', 'dump', '/sdcard/run40-window.xml')
    try:
        xml = adb('exec-out', 'cat', '/sdcard/run40-window.xml')
        return [n.attrib for n in ET.fromstring(xml).iter('node')]
    finally:
        shell('rm', '/sdcard/run40-window.xml')

def labels(row):
    return (row.get('text', ''), row.get('content-desc', ''), row.get('resource-id', ''))

def find(value, scroll=False):
    for i in range(7):
        nodes = rows()
        for row in nodes:
            x, y, right, bottom = map(int, re.findall(r'-?\d+', row['bounds']))
            if right > x and bottom > y and value in labels(row):
                return row
        if scroll and i < 5:
            shell('input', 'swipe', '530', '1810', '530', '740', '360')
    raise AssertionError('Control missing: ' + value)

def tap(row):
    x, y, right, bottom = map(int, re.findall(r'-?\d+', row['bounds']))
    shell('input', 'tap', str((x + right) // 2), str((y + bottom) // 2))

def click(value, scroll=False):
    tap(find(value, scroll))

def screenshot(name):
    (out / (name + '.png')).write_bytes(adb('exec-out', 'screencap', '-p'))

def route(path):
    shell('am', 'start', '-W', '-a', 'android.intent.action.VIEW', '-d', 'natophonetics-dev://' + path, pkg)

def permission():
    report = shell('dumpsys', 'package', pkg)
    return 'android.permission.RECORD_AUDIO: granted=true' in report

if action == 'setup':
    route('letter-quiz')
    click('Speak a code word')
    assert find('mode-spoken')['checked'] == 'true'
    screenshot('setup')
    click('quiz-start', True)
    find('Start recording', True)
    assert not permission()
    screenshot('question')
    click('Start recording')
    find('While using the app')
    screenshot('permission')

elif action == 'deny':
    click('com.android.permissioncontroller:id/permission_deny_button')
    assert not permission()
    find('Microphone access is off. Try Start recording again or type your answer.')
    screenshot('denied')

elif action == 'grant-current-prompt':
    click('While using the app')
    assert permission()
    find('Start recording', True)

elif action == 'grant':
    click('Start recording')
    click('While using the app')
    assert permission()
    find('Microphone enabled. Tap Start recording when ready.')
    find('Start recording')

elif action == 'capture':
    import grpc
    from emulator_controller_pb2 import AudioPacket, AudioFormat
    from emulator_controller_pb2_grpc import EmulatorControllerStub
    ini = Path(sys.argv[3]).read_text()
    token = re.search(r'^grpc.token=(.*)$', ini, re.M)[1].strip()
    port = re.search(r'^grpc.port=(\d+)', ini, re.M)[1]
    pcm = Path(sys.argv[4]).read_bytes()
    assert hashlib.sha256(pcm).hexdigest() == '136e25b596709a052df742e2bc938b4470475cf8ca491ae48ccb349100cb47cc'
    assert 'Active default network: none' in shell('dumpsys', 'connectivity')
    mic = find('Start recording')
    def packets():
        fmt = AudioFormat(samplingRate=16000, format=AudioFormat.AUD_FMT_S16,
                          channels=AudioFormat.Mono, mode=AudioFormat.MODE_REAL_TIME)
        data = bytes(16000 * 2) + pcm + bytes(32000)
        start = time.monotonic()
        for offset in range(0, len(data), 640):
            time.sleep(max(0, start + offset / 32000 - time.monotonic()))
            yield AudioPacket(format=fmt, audio=data[offset:offset+640])
    with grpc.insecure_channel('127.0.0.1:' + port) as channel:
        tap(mic)
        time.sleep(.4)
        screenshot('recording')
        EmulatorControllerStub(channel).injectAudio(packets(), timeout=12, metadata=[('authorization', 'Bearer ' + token)])
    find('Review the code word, then check your answer.')
    field = find('quiz-typed-answer')
    assert field['text'].lower().strip() == 'bravo', 'Synthetic match failed'
    assert find('quiz-progress')['text'].startswith('Question 1 of ')
    assert not any('Your answer:' in r.get('text','') for r in rows())
    print('offline synthetic match true; first question still unsubmitted')

elif action == 'ready-input':
    import threading
    from concurrent.futures import ThreadPoolExecutor
    import grpc
    from emulator_controller_pb2 import AudioPacket, AudioFormat
    from emulator_controller_pb2_grpc import EmulatorControllerStub
    ini = Path(sys.argv[3]).read_text()
    token = re.search(r'^grpc.token=(.*)$', ini, re.M)[1].strip()
    port = re.search(r'^grpc.port=(\d+)', ini, re.M)[1]
    pcm = Path(sys.argv[4]).read_bytes()
    assert hashlib.sha256(pcm).hexdigest() == '136e25b596709a052df742e2bc938b4470475cf8ca491ae48ccb349100cb47cc'
    assert 'Active default network: none' in shell('dumpsys', 'connectivity')
    ready = threading.Event()
    def packets():
        fmt = AudioFormat(samplingRate=16000, format=AudioFormat.AUD_FMT_S16)
        first = time.monotonic()
        while not ready.is_set() and time.monotonic() < first + 18:
            yield AudioPacket(format=fmt, audio=bytes(640))
            time.sleep(.02)
        data = pcm + bytes(32000)
        for offset in range(0, len(data), 640):
            yield AudioPacket(format=fmt, audio=data[offset:offset+640])
            time.sleep(.02)
    mic = find('Start recording')
    with grpc.insecure_channel('127.0.0.1:' + port) as channel, ThreadPoolExecutor(max_workers=1) as pool:
        send = pool.submit(EmulatorControllerStub(channel).injectAudio, packets(), timeout=25,
                           metadata=[('authorization', 'Bearer ' + token)])
        time.sleep(.25)
        tap(mic)
        find('Recording. Say one code word.')
        screenshot('recording')
        ready.set()
        send.result()
    find('Review the code word, then check your answer.')
    assert find('quiz-typed-answer')['text'].strip().lower() == 'bravo', 'Synthetic match failed'
    assert find('quiz-progress')['text'].startswith('Question 1 of ')
    print('offline synthetic match true; first question still unsubmitted')

elif action == 'capture-wave':
    assert 'Active default network: none' in shell('dumpsys', 'connectivity')
    mic = find('Start recording')
    tap(mic)
    time.sleep(.5)
    # The emulator's only input backend here is a synthetic WAV file.
    assert b'OK' in adb('emu', 'avd', 'rewindaudio')
    time.sleep(.4)
    screenshot('recording')
    find('Review the code word, then check your answer.')
    field = find('quiz-typed-answer')
    assert field['text'].strip().lower() == 'bravo', 'Synthetic match failed'
    assert find('quiz-progress')['text'].startswith('Question 1 of ')
    print('offline synthetic match true; first question still unsubmitted')

elif action == 'silence':
    click('Start recording')
    find('Recording. Say one code word.')
    screenshot('recording')
    find('No code word was recognized. Try recording again or type your answer.')
    screenshot('silence')
    assert find('quiz-progress')['text'].startswith('Question 1 of ')

elif action == 'stop':
    mic = find('Start recording')
    tap(mic)
    active = find('Stop recording')
    assert mic['bounds'] == active['bounds'], 'record control moved'
    tap(active)
    find('Start recording')
    assert 'running' not in shell('cmd', 'appops', 'get', pkg, 'RECORD_AUDIO').lower()
    find('quiz-typed-answer')
    assert find('quiz-progress')['text'].startswith('Question 1 of ')
    screenshot('stop')
    print('Stop returned control to the unsubmitted first question')

elif action == 'interrupt':
    click('Start recording')
    time.sleep(.4)
    shell('input', 'keyevent', 'KEYCODE_HOME')
    time.sleep(.6)
    route('letter-quiz')
    find('Start recording', True)
    assert permission()
    assert 'running' not in shell('cmd', 'appops', 'get', pkg, 'RECORD_AUDIO').lower()
    print('returned to same round with recording idle')

elif action == 'navigate':
    microphone = find('Start recording')
    menu = find('Menu')
    tap(microphone)
    time.sleep(.5)
    tap(menu)
    find('Settings')
    assert 'running' not in shell('cmd', 'appops', 'get', pkg, 'RECORD_AUDIO').lower()
    click('Letter Quiz')
    find('Start recording', True)
    assert find('quiz-progress')['text'].startswith('Question 1 of ')

elif action == 'revoke':
    shell('pm', 'revoke', pkg, 'android.permission.RECORD_AUDIO')
    assert not permission()
    route('letter-quiz')
    click('Speak a code word')
    click('quiz-start', True)
    click('Start recording', True)
    find('While using the app')
    assert not permission()
    print('revocation required a fresh OS prompt')

elif action == 'submit':
    # Use a known typed correction, regardless of the random symbol in this round.
    shell('input', 'swipe', '530', '730', '530', '1860', '330')
    symbol = find('quiz-letter')['text']
    words = dict(re.findall(r'letter: "([A-Z])", word: "([^"]+)"', Path('src/data/natoData.js').read_text()))
    correction = words[symbol].upper()
    field = find('quiz-typed-answer', True)
    tap(field)
    shell('input', 'keycombination', 'KEYCODE_CTRL_LEFT', 'KEYCODE_A')
    shell('input', 'text', correction)
    shell('input', 'keyevent', '4')
    assert find('quiz-typed-answer')['text'] == correction
    screenshot('edited')
    click('Check answer', True)
    find('Your answer: ' + correction, True)
    find('Correct! ' + symbol + ' is ' + words[symbol] + '.', True)
    screenshot('checked')
    click('quiz-next', True)
    assert 'Question 2 of ' in find('quiz-progress', True)['text']
    route('progress')
    assert any(re.search(r'\b1 answers? saved · 1 correct', r.get('text', '')) for r in rows()), 'Expected exactly one saved answer'

elif action == 'full-policy':
    route('privacy')
    find('Spoken answers', True)
    shell('input', 'swipe', '530', '1640', '530', '1150', '300')
    body = find('Start recording asks for microphone access. Spoken practice uses Android’s on-device US English recognizer. You can edit the result before checking. The app keeps the code word in the current round and saves only symbol totals and review times. It does not save recordings or send audio to an app service.')
    bounds = list(map(int, re.findall(r'\d+', body['bounds'])))
    assert bounds[1] > 70 and bounds[3] < 2200
    screenshot('privacy')

elif action == 'large':
    shell('cmd', 'uimode', 'night', 'yes')
    shell('settings', 'put', 'system', 'font_scale', '2.0')
    route('letter-quiz')
    find('Start recording', True)
    screenshot('large-idle')
    click('Start recording', True)
    find('Recording. Say one code word.', True)
    screenshot('large-recording')
    click('Stop recording', True)
    find('Start recording', True)
    print('2x dark recording and explicit stop reachable')

elif action == 'docs':
    route('audio-help')
    help_text = 'In Letter Quiz, choose Speak a code word.'
    for _ in range(9):
        if any(help_text in r.get('text', '') for r in rows()): break
        shell('input', 'swipe', '530', '1810', '530', '1040', '330')
    else: raise AssertionError('Spoken practice help missing')
    screenshot('audio-help')
    route('privacy')
    find('Spoken answers', True)
    screenshot('privacy')
    route('about')
    find('• Spoken answers with on-device US English recognition', True)
    screenshot('about')
    route('_sitemap')
    find('Letter Quiz', True)
    screenshot('site-map')
else:
    raise ValueError(action)
print(action + ' passed')
