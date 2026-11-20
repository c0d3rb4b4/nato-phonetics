"""Install identified Run23 products and exercise the actual native apps."""
from pathlib import Path
import datetime
import hashlib
import importlib.util
import json
import os
import shutil
import stat
import subprocess
import time

ROOT = Path(__file__).resolve().parents[3]
OUT = ROOT / 'docs/evidence/run23'
env = os.environ.copy()
env.update(PATH='/tmp/nato-phonetics-toolchain/node_modules/.bin:' + str(Path.home() / 'Library/Android/sdk/platform-tools') + ':' + env['PATH'], DEVELOPER_DIR='/Applications/Xcode.app/Contents/Developer', ADB=str(Path.home() / 'Library/Android/sdk/platform-tools/adb'))
os.environ.update(env)
commands = []
metadata = []
sha = lambda file: hashlib.sha256(Path(file).read_bytes()).hexdigest()

def run(args, check=True, log=None):
    started = datetime.datetime.now(datetime.timezone.utc).isoformat()
    result = subprocess.run(args, cwd=ROOT, env=env, stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
    text = result.stdout.decode(errors='replace')
    if log: (OUT / log).write_bytes(result.stdout)
    commands.append({'command': args, 'startedAt': started, 'exitCode': result.returncode, 'log': log, **({} if log else {'output': text})})
    (OUT / 'shared/native-smoke-commands.json').write_text(json.dumps(commands, indent=2) + '\n')
    if check and result.returncode: raise RuntimeError(commands[-1])
    return text

def inventory(directory):
    return {str(file.relative_to(directory)): sha(file) for file in sorted(directory.rglob('*')) if file.is_file()}

# iOS first, then stop the simulator before starting Android.
devices = json.loads(run(['xcrun', 'simctl', 'list', 'devices', 'available', '-j']))['devices']
device = next(device for runtime, group in devices.items() if '26-2' in runtime for device in group if device['name'] == 'iPhone 17 Pro')
uid = device['udid']
try:
    report = json.loads((ROOT / 'artifacts/run23/ios-simulator/report.json').read_text())
    assert report['status'] == 'passed'
    archive = ROOT / 'artifacts/run23/ios-simulator/ios-simulator.tar.gz'
    assert sha(archive) == report['artifacts'][0]['sha256']
    retrieved = Path('/tmp/nato-run23-ios'); retrieved.mkdir(exist_ok=False)
    run(['tar', '-xzf', str(archive), '-C', str(retrieved)])
    app = retrieved / 'NATOPhonetics.app'
    assert (app / 'NATOPhonetics').stat().st_mode & stat.S_IXUSR
    if device['state'] != 'Booted': run(['xcrun', 'simctl', 'boot', uid])
    run(['xcrun', 'simctl', 'bootstatus', uid, '-b'], log='ios/boot.log')
    run(['xcrun', 'simctl', 'ui', uid, 'appearance', 'light'])
    run(['xcrun', 'simctl', 'ui', uid, 'content_size', 'large'])
    run(['xcrun', 'simctl', 'install', uid, str(app)])
    installed = Path(run(['xcrun', 'simctl', 'get_app_container', uid, 'com.natophonetics.app', 'app']).strip())
    assert inventory(installed) == inventory(app)
    (OUT / 'ios/installed-artifact.json').write_text(json.dumps({'sourceId': report['sourceId'], 'archiveSha256': sha(archive), 'installedFiles': inventory(app), 'installedMatchesArchive': True, 'runtime': 'iOS26.2', 'device': device}, indent=2) + '\n')
    run(['xcodebuild', 'test', '-project', 'docs/evidence/run23/ios/harness/Capture.xcodeproj', '-scheme', 'Capture', '-configuration', 'Debug', '-destination', 'platform=iOS Simulator,id=' + uid, '-derivedDataPath', 'artifacts/run23/ios-harness', '-resultBundlePath', 'artifacts/run23/ios-smoke.xcresult', '-jobs', '1', 'CODE_SIGNING_ALLOWED=NO', '-parallel-testing-enabled', 'NO', '-only-testing:CaptureUITests/CLISmokeUITests/testCLIRebuiltApp'], log='ios/smoke.log')
    exported = ROOT / 'artifacts/run23/ios-attachments'
    run(['xcrun', 'xcresulttool', 'export', 'attachments', '--path', 'artifacts/run23/ios-smoke.xcresult', '--output-path', str(exported)])
    manifest = json.loads((exported / 'manifest.json').read_text())
    (OUT / 'ios/attachments.json').write_text(json.dumps(manifest, indent=2) + '\n')
    for test in manifest:
        for attachment in test['attachments']:
            suggested = attachment['suggestedHumanReadableName']
            if not attachment['exportedFileName'].endswith('.png') or '_0_' not in suggested: continue
            file = 'ios/' + suggested.split('_0_')[0] + '.png'
            shutil.copyfile(exported / attachment['exportedFileName'], OUT / 'screenshots' / file)
            metadata.append({'file': file, 'date': datetime.datetime.fromtimestamp(attachment['timestamp'], datetime.timezone.utc).isoformat(), 'device': device, 'runtime': 'iOS26.2', 'theme': 'light', 'textSize': 'large', 'viewportPoints': [402, 874], 'dpr': 3, 'archiveSha256': sha(archive), 'command': 'xcrun xcresulttool export attachments --path artifacts/run23/ios-smoke.xcresult --output-path artifacts/run23/ios-attachments'})
finally:
    run(['xcrun', 'simctl', 'terminate', uid, 'com.natophonetics.app'], check=False)
    if device['state'] != 'Booted': run(['xcrun', 'simctl', 'shutdown', uid], check=False)
    (OUT / 'screenshots/native-metadata.json').write_text(json.dumps(metadata, indent=2) + '\n')

emulator = metro = None
sdk = Path.home() / 'Library/Android/sdk'
spec = importlib.util.spec_from_file_location('android_driver', ROOT / 'docs/evidence/run13/android/verify_native.py')
d = importlib.util.module_from_spec(spec); spec.loader.exec_module(d)
d.OUT = OUT / 'android'; d.SHOTS = OUT / 'screenshots/android'; d.checks = []; d.captures = []
try:
    report = json.loads((ROOT / 'artifacts/run23/android-debug/report.json').read_text()); assert report['status'] == 'passed'
    apk = ROOT / 'artifacts/run23/android-debug/app-debug.apk'; assert sha(apk) == report['artifacts'][0]['sha256']
    with (OUT / 'android/emulator.log').open('wb') as log:
        emulator = subprocess.Popen([str(sdk / 'emulator/emulator'), '-avd', 'nato-p00-api36', '-port', '5580', '-no-window', '-no-snapshot', '-no-boot-anim', '-gpu', 'host', '-memory', '2560'], env=env, stdout=log, stderr=subprocess.STDOUT)
    deadline = time.monotonic() + 150
    while time.monotonic() < deadline:
        if run(['adb', '-s', 'emulator-5580', 'shell', 'getprop', 'sys.boot_completed'], check=False).strip() == '1': break
        time.sleep(1)
    else: raise RuntimeError('Android boot timed out')
    with (OUT / 'android/metro.log').open('wb') as log:
        metro = subprocess.Popen(['node', 'node_modules/react-native/cli.js', 'start', '--port', '8081', '--max-workers', '1'], cwd=ROOT, env=env, stdout=log, stderr=subprocess.STDOUT)
    run(['adb', '-s', 'emulator-5580', 'reverse', 'tcp:8081', 'tcp:8081'])
    run(['adb', '-s', 'emulator-5580', 'install', '-r', str(apk)])
    run(['adb', '-s', 'emulator-5580', 'shell', 'settings', 'put', 'system', 'font_scale', '1'])
    d.route('converter', cold=True); d.expect(desc='Text to convert', timeout=90); d.set_text('a3 b!')
    d.mark('exact-typed-input', input=d.expect(desc='Text to convert').get('text'))
    d.screenshot('converter-typed-input', 'Actual installed CLI20.2.0-built app, exact a3 b! input, default scale')
    d.tap(desc='Open menu'); d.tap(desc='Back to App')
    assert d.expect(desc='Text to convert').get('text') == 'a3 b!'
    d.mark('menu-return-keeps-input')
    d.route('alphabet'); d.expect(desc='Play A, Alfa', timeout=20)
    d.screenshot('alphabet-light', 'Actual installed reference, pinned portrait tiles and fonts')
    d.tap(desc='Digits 0–9'); d.expect(desc='Play 3, Three')
    d.screenshot('digits-light', 'Actual installed digit reference')
    d.mark('native-reference-and-digits')
    installed = run(['adb', '-s', 'emulator-5580', 'shell', 'pm', 'path', 'com.natophonetics.app']).strip().removeprefix('package:')
    actual_hash = run(['adb', '-s', 'emulator-5580', 'shell', 'sha256sum', installed]).split()[0]
    assert actual_hash == sha(apk)
    (OUT / 'android/installed-artifact.json').write_text(json.dumps({'apkSha256': sha(apk), 'installedSha256': actual_hash, 'sourceId': report['sourceId'], 'runtime': 'Android16/API36 arm64', 'normalMetroEntry': True}, indent=2) + '\n')
    run(['node', 'docs/evidence/run23/android/capture-loaded-bundles.cjs'], log='android/loaded-javascript.log')
finally:
    if emulator:
        run(['adb', '-s', 'emulator-5580', 'shell', 'am', 'force-stop', 'com.natophonetics.app'], check=False)
        run(['adb', '-s', 'emulator-5580', 'emu', 'kill'], check=False)
        try: emulator.wait(timeout=15)
        except subprocess.TimeoutExpired: emulator.terminate()
    if metro:
        metro.terminate()
        try: metro.wait(timeout=15)
        except subprocess.TimeoutExpired: metro.kill()
print('Actual native installation, scoped input/navigation/reference smoke and captures complete.')
