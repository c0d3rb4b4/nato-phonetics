"""Run/persist the actual product composition gate; adb's exit alone is insufficient."""
from pathlib import Path
import argparse
import hashlib, json, re, subprocess, sys
from android_display_evidence import pull_png, repeated_display_transitions
from android_runtime_abi import ABIS, check_runtime, installed_abi
from android_test_tools import TEST_IME, restore_font_scale, restore_ime

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('test_apk', type=Path)
parser.add_argument('app_apk', type=Path)
parser.add_argument('output', type=Path)
parser.add_argument('serial')
parser.add_argument('--external-evidence', action='store_true')
parser.add_argument('--abi', choices=ABIS, help='Verify the selected native ABI of a universal APK')
args = parser.parse_args()
test_apk, app_apk, out = args.test_apk, args.app_apk, args.output
serial, external_evidence = args.serial, args.external_evidence
out.mkdir(parents=True, exist_ok=True)
adb = ['adb', '-s', serial]
def call(*args): return subprocess.check_output(adb+list(args), timeout=150 if args[0]=='install' else 40)
def shell(*args): return call('shell', *args).decode().strip()
identities = {}
original_scale = shell('settings', 'get', 'system', 'font_scale')
original_ime = shell('settings', 'get', 'secure', 'default_input_method')
test_was_enabled = TEST_IME in shell('ime', 'list', '-s').splitlines()
for package, local in [('com.natophonetics.app', app_apk), ('com.natophonetics.fonttest', test_apk)]:
    if package.endswith('fonttest'):
        (out/'install.log').write_bytes(call('install', '--no-incremental', '-r', str(local)))
    installed = shell('pm', 'path', package).removeprefix('package:')
    actual = shell('sha256sum', installed).split()[0]
    expected = hashlib.sha256(local.read_bytes()).hexdigest()
    identities[package] = {'installed': installed, 'sha256': actual, 'expectedSha256': expected}
    if actual != expected: raise RuntimeError('Installed APK drift: '+package)
    if args.abi and package == 'com.natophonetics.app':
        primary_abi = installed_abi(shell('dumpsys', 'package', package))
        identities[package]['primaryCpuAbi'] = primary_abi
        if primary_abi != args.abi: raise RuntimeError(f'PackageManager selected {primary_abi} instead of {args.abi}')
result = None
report = {}
evidence_complete = False
runtime_verified = False
stale_captures = []
try:
    call('shell', 'am', 'force-stop', 'com.natophonetics.app')
    instrument_abi = ['--abi', args.abi] if args.abi else []
    command = adb+['shell', 'am', 'instrument', *instrument_abi, '-w', '-r']
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
        data = (pull_png(call, directory+'/'+name) if external_evidence else
                pull_png(call, 'cache/font-composition/'+name, package='com.natophonetics.app'))
        (out/name).write_bytes(data)
    expected_stages = {'composition-before', 'composition-live-2', 'composition-live-1', 'composition-continued', 'composition-committed'}
    if len(report.get('stages', [])) == 5 and {row['stage'] for row in report['stages']} == expected_stages:
        stale_captures = repeated_display_transitions(out, (
            (row['stage'], (row['fontScale'], row['value'])) for row in report['stages']))
        evidence_complete = True
    if args.abi and report.get('passed') is True:
        raw = (call('exec-out','cat',directory+'/runtime-libraries.json') if external_evidence else
               call('exec-out','run-as','com.natophonetics.app','cat','cache/font-composition/runtime-libraries.json'))
        mappings = json.loads(raw)
        (out/'mappings.json').write_text(json.dumps(mappings, indent=2)+'\n')
        package = identities['com.natophonetics.app']
        runtime = check_runtime(app_apk, package['installed'], package['sha256'], package['primaryCpuAbi'], args.abi, mappings, report.get('runtimePid'))
        (out/'runtime-abi.json').write_text(json.dumps(runtime, indent=2)+'\n')
        runtime_verified = True
finally:
    restore_font_scale(shell, original_scale)
    restore_ime(shell, original_ime, test_was_enabled)
    passed = result is not None and result.returncode == 0 and b'INSTRUMENTATION_CODE: -1' in result.stdout and report.get('passed') is True and evidence_complete and not stale_captures and (not args.abi or runtime_verified)
    identity = {
        'serial': serial, 'identities': identities,
        'originalScale': original_scale, 'originalIme': original_ime,
        'testImeInitiallyEnabled': test_was_enabled, 'externalEvidence': external_evidence,
        'evidenceComplete': evidence_complete, 'deviceScreenshotHashesVerified': evidence_complete,
        'staleCaptures': stale_captures, 'command': command if result is not None else None,
        'adbExitCode': result.returncode if result is not None else None, 'passed': passed,
    }
    (out/'identity.json').write_text(json.dumps(identity, indent=2)+'\n')
print(json.dumps({'passed': passed, 'stages': len(report.get('stages', [])), 'staleCaptures': stale_captures, 'error': report.get('error')}))
sys.exit(0 if passed else 1)
