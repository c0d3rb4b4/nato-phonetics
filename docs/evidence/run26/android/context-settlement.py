"""Bounded timing discriminator; retain the earlier600ms whole-sweep failure."""
from pathlib import Path
import subprocess,json,time
ROOT=Path(__file__).resolve().parents[4];OUT=Path(__file__).with_name('context-settlement');OUT.mkdir(exist_ok=True)
adb=['adb','-s','emulator-5580'];samples=[]
def shell(*args):return subprocess.check_output(adb+['shell',*args],text=True)
def runtime(expression):return json.loads(subprocess.check_output(['/tmp/nato-phonetics-toolchain/node_modules/node/bin/node',str(ROOT/'docs/evidence/run07/android/read-runtime.cjs'),expression],text=True,timeout=15))
cold=json.loads((OUT.parent/'context-runtime/samples.json').read_text())
try:
 shell('am','force-stop','com.natophonetics.app');shell('settings','put','system','font_scale','1');shell('am','start','-n','com.natophonetics.app/.MainActivity')
 for _ in range(30):
  try:
   if runtime('Boolean(globalThis.__fontProbe?.dimensions)'):break
  except Exception:pass
  time.sleep(.3)
 else:raise RuntimeError('No fixture')
 time.sleep(2)
 for index,(scale,reference) in enumerate([(0.85,'cold085'),(1.3,'cold13'),(2,'cold2'),(1,'cold1'),(0.85,'cold085'),(2,'cold2'),(1.3,'cold13'),(1,'cold1')]):
  shell('settings','put','system','font_scale',str(scale));start=time.monotonic()
  for delay in [.6,2,4]:
   remaining=delay-(time.monotonic()-start)
   if remaining>0:time.sleep(remaining)
   runtime('globalThis.__fontProbe.sample();true');time.sleep(.2);s=runtime('globalThis.__fontProbe')
   checks=[]
   for name in ['stable','feedback','input','revision','nested']:
    h=s['frames'][name]['height'];expected=cold[reference]['frames'][name]['height'];checks.append({'name':name,'height':h,'cold':expected,'passed':abs(h-expected)*s['dimensions']['scale']<=1})
   row={'index':index,'requestedScale':scale,'nominalDelaySeconds':delay,'actualElapsedSeconds':time.monotonic()-start,'observedScale':s['dimensions']['fontScale'],'mounts':s['mounts'],'value':s['value'],'comparisons':checks};samples.append(row);print(json.dumps(row),flush=True)
  (OUT/('scale-'+str(index)+'-'+str(scale)+'.png')).write_bytes(subprocess.check_output(adb+['exec-out','screencap','-p']))
finally:
 (OUT/'report.json').write_text(json.dumps(samples,indent=2)+'\n');shell('settings','put','system','font_scale','1');shell('am','force-stop','com.natophonetics.app')
