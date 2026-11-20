"""Run/persist the actual product composition gate; adb's exit alone is insufficient."""
from pathlib import Path
import hashlib, json, re, subprocess, sys
from android_display_evidence import repeated_display_transitions

test_apk, app_apk, out = map(Path, sys.argv[1:4])
serial = sys.argv[4]
external_evidence = '--external-evidence' in sys.argv[5:]
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
evidence_complete = False
stale_captures = []
try:
    call('shell', 'am', 'force-stop', 'com.natophonetics.app')
    command = adb+['shell', 'am', 'instrument', '-w', '-r']
    if external_evidence: command += ['-e', 'externalEvidence', 'true']
    command += ['com.natophonetics.fonttest/com.natophonetics.fonttest.FontScaleInstrumentation']
    result = subprocess.run(command, capture_output=True, timeout=120)
    (out/'command.log').write_bytes(result.stdout+result.stderr)
    if external_evidence:
        match = re.search(r'^INSTRUMENTATION_RESULT: report=(.*)$', result.stdout.decode(), re.MULTILINE)
        if not match: raise RuntimeError('Instrumentation report missing from result bundle')
        report = json.loads(match.group(1))
        directory = report.get('outputDirectory', '')
        if not re.fullmatch(r'/storage/emulated/0/Android/data/com\.natophonetics\.app/files/font-composition', directory):
            raise RuntimeError('Unexpected external evidence directory: '+directory)
    else:
        report = json.loads(call('exec-out', 'run-as', 'com.natophonetics.app', 'cat', 'cache/font-composition/report.json'))
    (out/'report.json').write_text(json.dumps(report, indent=2)+'\n')
    for row in report.get('stages', []):
        name = row['stage']+'.png'
        if not re.fullmatch(r'[a-z0-9-]+\.png', name): raise RuntimeError('Unexpected capture name')
        data = (call('exec-out', 'cat', directory+'/'+name) if external_evidence else
                call('exec-out', 'run-as', 'com.natophonetics.app', 'cat', 'cache/font-composition/'+name))
        if not data.startswith(b'\x89PNG\r\n\x1a\n'): raise RuntimeError('Invalid actual screenshot: '+name)
        (out/name).write_bytes(data)
    expected_stages = {'composition-before', 'composition-live-2', 'composition-live-1', 'composition-continued', 'composition-committed'}
    if len(report.get('stages', [])) == 5 and {row['stage'] for row in report['stages']} == expected_stages:
        stale_captures = repeated_display_transitions(out, (
            (row['stage'], (row['fontScale'], row['value'])) for row in report['stages']))
        evidence_complete = True
finally:
    call('shell', 'settings', 'put', 'system', 'font_scale', original_scale)
    call('shell', 'ime', 'set', original_ime)
    call('shell', 'ime', 'disable', 'com.natophonetics.fonttest/.FontTestIme')
    passed = result is not None and result.returncode == 0 and b'INSTRUMENTATION_CODE: -1' in result.stdout and report.get('passed') is True and evidence_complete and not stale_captures
    (out/'identity.json').write_text(json.dumps({'serial': serial, 'identities': identities, 'originalScale': original_scale, 'originalIme': original_ime, 'externalEvidence': external_evidence, 'evidenceComplete': evidence_complete, 'staleCaptures': stale_captures, 'command': command if result is not None else None, 'adbExitCode': result.returncode if result else None, 'passed': passed}, indent=2)+'\n')
print(json.dumps({'passed': passed, 'stages': len(report.get('stages', [])), 'staleCaptures': stale_captures, 'error': report.get('error')}))
sys.exit(0 if passed else 1)
