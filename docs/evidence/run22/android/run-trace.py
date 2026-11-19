"""Trace existing APK only. This fixture is not product acceptance."""
import frida,subprocess,time,json,os,hashlib
from pathlib import Path
ROOT=Path(__file__).resolve().parents[4]
OUT=Path(__file__).resolve().parent
SHOTS=OUT/'screenshots';SHOTS.mkdir(exist_ok=True)
ADB=['adb','-s','emulator-5580']
device=frida.get_device('emulator-5580',timeout=10)
trace=[];samples={};captures=[]
def adb(*args):return subprocess.check_output(ADB+list(args))
def runtime(expression):
    env=os.environ.copy();env['NODE_PATH']=str(ROOT/'node_modules')
    return json.loads(subprocess.check_output(['/tmp/nato-phonetics-toolchain/node_modules/node/bin/node',str(ROOT/'docs/evidence/run07/android/read-runtime.cjs'),expression],env=env,text=True))
def start(scale,name):
    adb('shell','am','force-stop','com.natophonetics.app')
    adb('shell','settings','put','system','font_scale',str(scale));time.sleep(1)
    pid=device.spawn(['com.natophonetics.app'])
    session=device.attach(pid)
    script=session.create_script(Path('/tmp/nato-run20-trace/run22-trace-bundle.js').read_text())
    script.on('message',lambda m,d:trace.append(m))
    script.load();script.exports_sync.stage(name);device.resume(pid)
    for _ in range(30):
        try:
            if runtime('Boolean(globalThis.__fontProbe?.dimensions)'):break
        except Exception:pass
        time.sleep(.5)
    else:raise AssertionError('Fixture did not load')
    time.sleep(1)
    return session,script
def sample(name):
    runtime('globalThis.__fontProbe.sample(); true');time.sleep(.2)
    samples[name]=runtime('globalThis.__fontProbe');assert samples[name]['mounts']==1,samples[name]
    image=adb('exec-out','screencap','-p');(SHOTS/(name+'.png')).write_bytes(image)
    captures.append({'file':name+'.png','diagnostic':True,'command':'adb -s emulator-5580 exec-out screencap -p','sha256':hashlib.sha256(image).hexdigest(),'fontScale':samples[name]['dimensions']['fontScale']})
    print(json.dumps({'sample':name,'dimensions':samples[name]['dimensions'],'frames':samples[name]['frames'],'value':samples[name]['value']}),flush=True)
try:
    session,script=start(1,'cold1');sample('cold1')
    for name,scale in [('live2',2),('return1',1)]:
        script.exports_sync.stage(name);adb('shell','settings','put','system','font_scale',str(scale));time.sleep(2);sample(name)
    session.detach()
    session,script=start(2,'cold2');sample('cold2');session.detach()
finally:
    (OUT/'trace.json').write_text(json.dumps(trace,indent=2)+'\n')
    (OUT/'samples.json').write_text(json.dumps(samples,indent=2)+'\n')
    (SHOTS/'metadata.json').write_text(json.dumps(captures,indent=2)+'\n')
    adb('shell','settings','put','system','font_scale','1')
