"""Collect actual Release fixture observations; missing evidence always fails."""
from pathlib import Path
import hashlib, json, re, subprocess, sys

test_apk, fixture_apk, out = map(lambda p:Path(p).resolve(),sys.argv[1:4])
serial=sys.argv[4]
scenarios=sys.argv[5:] or ['primary','cold2','cold085','cold13','sweep','editing']
out.mkdir(parents=True,exist_ok=True)
adb=['adb','-s',serial]
def call(*args):return subprocess.check_output(adb+list(args),timeout=45)
def shell(*args):return call('shell',*args).decode().strip()
def sha(data):return hashlib.sha256(data).hexdigest()
identities={}
if call('get-state').decode().strip() != 'device': raise RuntimeError('Intended Android target is not ready')
for package,apk in [('com.natophonetics.app',fixture_apk),('com.natophonetics.fonttest',test_apk)]:
    (out/(package+'.install.log')).write_bytes(call('install','-r',str(apk)))
    installed=shell('pm','path',package).removeprefix('package:')
    actual=shell('sha256sum',installed).split()[0]
    identities[package]={'local':str(apk),'installed':installed,'sha256':actual,'expectedSha256':sha(apk.read_bytes())}
    if actual!=identities[package]['expectedSha256']:raise RuntimeError('Installed APK mismatch: '+package)
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
        command=adb+['shell','am','instrument','-w','-r','-e','scenario',scenario,
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
            data=call('exec-out','cat',directory+'/'+stage+'.png')
            if not data.startswith(b'\x89PNG\r\n\x1a\n'):raise RuntimeError('Invalid screenshot: '+stage)
            (out/'screenshots').mkdir(exist_ok=True)
            (out/'screenshots'/(stage+'.png')).write_bytes(data)
            captures.append({'stage':stage,'file':'screenshots/'+stage+'.png','sha256':sha(data),
                             'command':'Instrumentation UiAutomation.takeScreenshot; adb exec-out cat '+directory+'/'+stage+'.png'})
        complete=set(report.get('samples',{}))==set(expected[scenario])
        ok=result.returncode==0 and b'INSTRUMENTATION_CODE: -1' in result.stdout and report.get('passed') is True and complete
        results.append({'scenario':scenario,'command':command,'exitCode':result.returncode,'evidenceComplete':complete,'passed':ok})
        if not ok:raise RuntimeError('Failed fixture scenario: '+scenario+' '+str(report.get('error','')))
    passed=True
finally:
    call('shell','am','force-stop','com.natophonetics.app')
    call('shell','settings','put','system','font_scale',original_scale)
    call('shell','wm','size',original_override)
    (out/'samples.json').write_text(json.dumps(samples,indent=2)+'\n')
    (out/'captures.json').write_text(json.dumps(captures,indent=2)+'\n')
    (out/'identity.json').write_text(json.dumps({'passed':passed,'serial':serial,'identities':identities,
        'runtime':shell('getprop','ro.build.version.release'),'api':shell('getprop','ro.build.version.sdk'),
        'originalFontScale':original_scale,'originalWindowSize':original_window,'results':results,
        'scope':'Separate embedded fixture on identical Release native/Hermes payload; production entry not exercised'},indent=2)+'\n')
print(json.dumps({'passed':passed,'samples':len(samples),'captures':len(captures)}))
