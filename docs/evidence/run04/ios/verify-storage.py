"""Seed legacy preferences in a simulator sandbox, test the installed app, restore it.

Only the explicitly selected simulator's prototype app is used. This is a native
storage migration check, not a claim about upgrading a signed store installation.
Usage: python3 verify-storage.py <simulator-udid> <temporary-runner-directory>
"""
import json
import os
from pathlib import Path
import subprocess
import sys

udid, runner = sys.argv[1:]
output = Path(__file__).resolve().parent
env = dict(os.environ, DEVELOPER_DIR='/Applications/Xcode.app/Contents/Developer')
bundle = 'com.natophonetics.app'

def sim(*args, check=True):
    return subprocess.run(['xcrun', 'simctl', *args], env=env, check=check,
                          text=True, stdout=subprocess.PIPE, stderr=subprocess.STDOUT).stdout.strip()

def test(name, result):
    command = ['xcodebuild', 'test', '-project', f'{runner}/Capture.xcodeproj',
               '-scheme', 'Capture', '-destination', f'platform=iOS Simulator,id={udid}',
               '-derivedDataPath', f'{runner}/build', '-resultBundlePath', f'{runner}/{result}.xcresult',
               '-parallel-testing-enabled', 'NO',
               f'-only-testing:CaptureUITests/CaptureUITests/{name}', 'CODE_SIGNING_ALLOWED=NO']
    with (output / f'{result}.log').open('w') as log:
        log.write('Command: ' + repr(command) + '\n')
        log.flush()
        result = subprocess.run(command, env=env, stdout=log, stderr=subprocess.STDOUT)
        log.write(f'\nExit: {result.returncode}\n')
    result.check_returncode()

sim('terminate', udid, bundle, check=False)
container = Path(sim('get_app_container', udid, bundle, 'data'))
manifest = container / 'Library/Application Support' / bundle / 'RCTAsyncLocalStorage_V1/manifest.json'
original = manifest.read_bytes() if manifest.exists() else None
seed = json.loads(original) if original else {}
seed.pop('nato.preferences.v1', None)
seed.update({'darkMode': 'true', 'selectedVoice': 'com.apple.voice.super-compact.en-AU.Karen',
             'p00.unrelated-learning-data': '{"sessions":7}'})
manifest.parent.mkdir(parents=True, exist_ok=True)
observations = {'simulator': udid, 'seededKeys': {
    key: seed[key] for key in ['darkMode', 'selectedVoice', 'p00.unrelated-learning-data']}}
try:
    manifest.write_text(json.dumps(seed))
    test('testLegacySeed', 'storage-migration')
    migrated = json.loads(manifest.read_text())
    expected = {'version': 1, 'themeMode': 'dark', 'selectedVoice': seed['selectedVoice']}
    assert json.loads(migrated['nato.preferences.v1']) == expected, migrated
    assert 'darkMode' not in migrated and 'selectedVoice' not in migrated, migrated
    assert migrated['p00.unrelated-learning-data'] == seed['p00.unrelated-learning-data']
    observations['afterMigration'] = {key: migrated[key] for key in ['nato.preferences.v1', 'p00.unrelated-learning-data']}
    test('testResetPreferences', 'storage-reset')
    reset = json.loads(manifest.read_text())
    assert json.loads(reset['nato.preferences.v1']) == {'version': 1, 'themeMode': 'system', 'selectedVoice': None}
    assert reset['p00.unrelated-learning-data'] == seed['p00.unrelated-learning-data']
    assert 'darkMode' not in reset and 'selectedVoice' not in reset
    observations['afterReset'] = {key: reset[key] for key in ['nato.preferences.v1', 'p00.unrelated-learning-data']}
    observations['result'] = 'pass'
finally:
    sim('terminate', udid, bundle, check=False)
    if original is None:
        manifest.unlink(missing_ok=True)
    else:
        manifest.write_bytes(original)
    observations['originalManifestRestored'] = True
    (output / 'storage-results.json').write_text(json.dumps(observations, indent=2) + '\n')
print('PASS native legacy key migration, cleanup, scoped reset and unrelated data preservation; original manifest restored')
