"""Run/persist the actual product composition gate; adb's exit alone is insufficient."""
from pathlib import Path
import hashlib, json, re, subprocess, sys

test_apk, app_apk, out = map(Path, sys.argv[1:4])
serial = sys.argv[4]
out.mkdir(parents=True, exist_ok=True)
adb = ['adb', '-s', serial]
def call(*args): return subprocess.check_output(adb+list(args), timeout=40)
def shell(*args): return call('shell', *args).decode().strip()
identities = {}
for package, local in [('com.natophonetics.app', app_apk), ('com.natophonetics.fonttest', test_apk)]:
    if package.endswith('fonttest'):
        (out/'install.log').write_bytes(call('install', '-r', str(local)))
    installed = shell('pm', 'path', package).removeprefix('package:')
    actual = shell('sha256sum', installed).split()[0]
    expected = hashlib.sha256(local.read_bytes()).hexdigest()
    identities[package] = {'installed': installed, 'sha256': actual, 'expectedSha256': expected}
    if actual != expected: raise RuntimeError('Installed APK drift: '+package)
original_scale = shell('settings', 'get', 'system', 'font_scale')
original_ime = shell('settings', 'get', 'secure', 'default_input_method')
result = None
report = {}
try:
    call('shell', 'am', 'force-stop', 'com.natophonetics.app')
    command = adb+['shell', 'am', 'instrument', '-w', '-r', 'com.natophonetics.fonttest/com.natophonetics.fonttest.FontScaleInstrumentation']
    result = subprocess.run(command, capture_output=True, timeout=120)
    (out/'command.log').write_bytes(result.stdout+result.stderr)
    report = json.loads(call('exec-out', 'run-as', 'com.natophonetics.app', 'cat', 'cache/font-composition/report.json'))
    (out/'report.json').write_text(json.dumps(report, indent=2)+'\n')
    for row in report.get('stages', []):
        name = row['stage']+'.png'
        if not re.fullmatch(r'[a-z0-9-]+\.png', name): raise RuntimeError('Unexpected capture name')
        (out/name).write_bytes(call('exec-out', 'run-as', 'com.natophonetics.app', 'cat', 'cache/font-composition/'+name))
finally:
    call('shell', 'settings', 'put', 'system', 'font_scale', original_scale)
    call('shell', 'ime', 'set', original_ime)
    call('shell', 'ime', 'disable', 'com.natophonetics.fonttest/.FontTestIme')
    passed = result is not None and result.returncode == 0 and b'INSTRUMENTATION_CODE: -1' in result.stdout and report.get('passed') is True
    (out/'identity.json').write_text(json.dumps({'serial': serial, 'identities': identities, 'originalScale': original_scale, 'originalIme': original_ime, 'adbExitCode': result.returncode if result else None, 'passed': passed}, indent=2)+'\n')
print(json.dumps({'passed': passed, 'stages': len(report.get('stages', [])), 'error': report.get('error')}))
sys.exit(0 if passed else 1)
