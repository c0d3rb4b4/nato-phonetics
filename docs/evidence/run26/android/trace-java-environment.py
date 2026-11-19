"""Reuse Run22 read-only boundary hooks on the new actual source candidate.

Question: does every fractional/live change reach the surface context, or only
JS dimensions? No feature/cache replacement or lifecycle/state intervention.
"""
from pathlib import Path
import frida,subprocess,time,json
ROOT=Path(__file__).resolve().parents[4];OUT=Path(__file__).with_name('java-environment');OUT.mkdir(exist_ok=True)
ADB=['adb','-s','emulator-5580'];device=frida.get_device('emulator-5580',timeout=10);trace=[];samples={}
def adb(*args):return subprocess.check_output(ADB+list(args))
def runtime(expression):return json.loads(subprocess.check_output(['/tmp/nato-phonetics-toolchain/node_modules/node/bin/node',str(ROOT/'docs/evidence/run07/android/read-runtime.cjs'),expression],text=True,timeout=15))
session=None
try:
 adb('shell','am','force-stop','com.natophonetics.app');adb('shell','settings','put','system','font_scale','1')
 pid=device.spawn(['com.natophonetics.app']);session=device.attach(pid);script=session.create_script(Path('/tmp/nato-run20-trace/run26-java-environment-bundle.js').read_text());script.on('message',lambda m,d:trace.append(m));script.load();script.exports_sync.stage('cold1');device.resume(pid)
 for _ in range(30):
  try:
   if runtime('Boolean(globalThis.__fontProbe?.dimensions)'):break
  except Exception:pass
  time.sleep(.3)
 else:raise RuntimeError('No fixture')
 time.sleep(2)
 for stage,scale in [('live085',.85),('live13',1.3),('live2',2),('return1',1)]:
  script.exports_sync.stage(stage);adb('shell','settings','put','system','font_scale',str(scale));time.sleep(2)
  runtime('globalThis.__fontProbe.sample();true');time.sleep(.2);samples[stage]=runtime('globalThis.__fontProbe');(OUT/(stage+'.png')).write_bytes(adb('exec-out','screencap','-p'));print(stage, samples[stage]['dimensions'],flush=True)
finally:
 (OUT/'trace.json').write_text(json.dumps(trace,indent=2)+'\n');(OUT/'samples.json').write_text(json.dumps(samples,indent=2)+'\n')
 if session:session.detach()
 adb('shell','settings','put','system','font_scale','1');adb('shell','am','force-stop','com.natophonetics.app')
