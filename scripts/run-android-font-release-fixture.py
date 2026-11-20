"""Collect actual Release fixture observations; missing evidence always fails."""
from pathlib import Path
import argparse
import hashlib, json, re, subprocess, sys
from android_display_evidence import pull_png, repeated_display_transitions
from android_runtime_abi import ABIS, check_runtime, installed_abi
from android_test_tools import restore_font_scale

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('test_apk', type=Path)
parser.add_argument('fixture_apk', type=Path)
parser.add_argument('output', type=Path)
parser.add_argument('serial')
parser.add_argument('scenarios', nargs='*')
parser.add_argument('--abi', choices=ABIS, help='Install and verify the named ABI of a universal APK')
args = parser.parse_args()
test_apk, fixture_apk, out = (path.resolve() for path in (args.test_apk, args.fixture_apk, args.output))
serial = args.serial
scenarios = args.scenarios or ['primary','cold2','cold085','cold13','sweep','editing']
out.mkdir(parents=True,exist_ok=True)
adb=['adb','-s',serial]
def call(*args):return subprocess.check_output(adb+list(args),timeout=150 if args[0]=='install' else 45)
def shell(*args):return call('shell',*args).decode().strip()
def sha(data):return hashlib.sha256(data).hexdigest()
identities={}
if call('get-state').decode().strip() != 'device': raise RuntimeError('Intended Android target is not ready')
for package,apk in [('com.natophonetics.app',fixture_apk),('com.natophonetics.fonttest',test_apk)]:
    abi_options = ['--abi', args.abi] if args.abi and package == 'com.natophonetics.app' else []
    (out/(package+'.install.log')).write_bytes(call('install','--no-incremental','-r',*abi_options,str(apk)))
    installed=shell('pm','path',package).removeprefix('package:')
    actual=shell('sha256sum',installed).split()[0]
    identities[package]={'local':str(apk),'installed':installed,'sha256':actual,'expectedSha256':sha(apk.read_bytes())}
    if actual!=identities[package]['expectedSha256']:raise RuntimeError('Installed APK mismatch: '+package)
    if abi_options:
        primary_abi = installed_abi(shell('dumpsys','package',package))
        identities[package]['primaryCpuAbi'] = primary_abi
        if primary_abi != args.abi: raise RuntimeError(f'PackageManager selected {primary_abi} instead of {args.abi}')
original_scale=shell('settings','get','system','font_scale')
original_window=shell('wm','size')
original_override=re.search(r'Override size: (\d+x\d+)',original_window)
original_override=original_override[1] if original_override else 'reset'
samples={};captures=[];results=[];passed=False
expected={
    'primary':['cold1','live2','return1'],
    'cold2':['cold2','resize-narrow2','resize-restored2'],
    'cold085':['cold085'],'cold13':['cold13'],
    'sweep':['sweep0-0.85','sweep1-1.3','sweep2-2.0','sweep3-1.0','sweep4-0.85','sweep5-2.0','sweep6-1.3','sweep7-1.0'],
    'editing':['editing-start','editing-before','editing-typed-before','editing-live2','editing-return1','editing-insert']}
try:
    for scenario in scenarios:
        if scenario not in expected:raise ValueError('Unknown scenario: '+scenario)
        call('shell','am','force-stop','com.natophonetics.app')
        instrument_abi = ['--abi', args.abi] if args.abi else []
        command=adb+['shell','am','instrument',*instrument_abi,'-w','-r','-e','scenario',scenario,
                     'com.natophonetics.fonttest/com.natophonetics.fonttest.FontScaleFixtureInstrumentation']
        result=subprocess.run(command,capture_output=True,timeout=150)
        (out/(scenario+'.log')).write_bytes(result.stdout+result.stderr)
        match=re.search(r'^INSTRUMENTATION_RESULT: report=(.*)$',result.stdout.decode(),re.MULTILINE)
        if not match:raise RuntimeError('Missing instrumentation report: '+scenario)
        report=json.loads(match[1]);(out/(scenario+'.json')).write_text(json.dumps(report,indent=2)+'\n')
        directory=report.get('outputDirectory','')
        if directory!='/storage/emulated/0/Android/data/com.natophonetics.app/files/font-fixture-'+scenario:raise RuntimeError('Unexpected evidence directory')
        for stage,row in report.get('samples',{}).items():
            if stage not in expected[scenario] or stage in samples:raise RuntimeError('Unexpected/duplicate sample: '+stage)
            samples[stage]=row
            data=pull_png(call, directory+'/'+stage+'.png')
            (out/'screenshots').mkdir(exist_ok=True)
            (out/'screenshots'/(stage+'.png')).write_bytes(data)
            captures.append({'stage':stage,'file':'screenshots/'+stage+'.png','sha256':sha(data),'deviceSha256Verified':True,
                             'command':row.get('captureCommand', 'Instrumentation UiAutomation.takeScreenshot')+'; adb exec-out cat '+directory+'/'+stage+'.png'})
        complete=set(report.get('samples',{}))==set(expected[scenario])
        matched_display = all(samples[stage].get('display', {}).get('matched') is True
                              for stage in report.get('samples', {}))
        stale = []
        if complete and scenario == 'primary':
            stale = repeated_display_transitions(out / 'screenshots', (
                (stage, samples[stage]['dimensions']['fontScale']) for stage in expected[scenario]))
        ok=result.returncode==0 and b'INSTRUMENTATION_CODE: -1' in result.stdout and report.get('passed') is True and complete and not stale and (not args.abi or matched_display)
        if args.abi and report.get('passed') is True:
            mappings = json.loads(call('exec-out','cat',directory+'/runtime-libraries.json'))
            (out/(scenario+'-mappings.json')).write_text(json.dumps(mappings,indent=2)+'\n')
            package = identities['com.natophonetics.app']
            runtime = check_runtime(fixture_apk, package['installed'], package['sha256'], package['primaryCpuAbi'], args.abi, mappings, report.get('runtimePid'))
            (out/(scenario+'-abi.json')).write_text(json.dumps(runtime,indent=2)+'\n')
        results.append({'scenario':scenario,'command':command,'exitCode':result.returncode,'evidenceComplete':complete,'staleCaptures':stale,'matchedDisplay':matched_display,'passed':ok})
        if stale: raise RuntimeError('Identical display during a visible scale transition: '+str(stale))
        if not ok:raise RuntimeError('Failed fixture scenario: '+scenario+' '+str(report.get('error','')))
    passed=True
finally:
    call('shell','am','force-stop','com.natophonetics.app')
    restore_font_scale(shell,original_scale)
    call('shell','wm','size',original_override)
    (out/'samples.json').write_text(json.dumps(samples,indent=2)+'\n')
    (out/'captures.json').write_text(json.dumps(captures,indent=2)+'\n')
    (out/'identity.json').write_text(json.dumps({'passed':passed,'serial':serial,'identities':identities,
        'runtime':shell('getprop','ro.build.version.release'),'api':shell('getprop','ro.build.version.sdk'),
        'originalFontScale':original_scale,'originalWindowSize':original_window,'results':results,
        'scope':'Separate embedded fixture on identical Release native/Hermes payload; production entry not exercised'},indent=2)+'\n')
print(json.dumps({'passed':passed,'samples':len(samples),'captures':len(captures)}))
