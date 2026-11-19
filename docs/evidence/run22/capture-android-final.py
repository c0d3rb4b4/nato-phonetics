from pathlib import Path
import subprocess,os,time,json,hashlib,struct
ROOT=Path(__file__).resolve().parents[3];OUT=ROOT/'docs/evidence/run22';os.chdir(ROOT)
env=os.environ.copy();env['PATH']='/tmp/nato-phonetics-toolchain/node_modules/.bin:'+env['PATH'];adb=['adb','-s','emulator-5580'];commands=[];metro=None;emulator=None

def run(args,check=True):
 p=subprocess.run(args,env=env,stdout=subprocess.PIPE,stderr=subprocess.STDOUT);commands.append({'command':args,'exitCode':p.returncode,'output':p.stdout.decode(errors='replace')})
 if check and p.returncode:raise RuntimeError(commands[-1])
 return p.stdout
try:
 with (OUT/'android/emulator-capture-retry.log').open('wb') as log:emulator=subprocess.Popen([str(Path.home()/'Library/Android/sdk/emulator/emulator'),'-avd','nato-p00-api36','-port','5580','-no-window','-no-snapshot','-no-boot-anim','-gpu','host','-memory','2560'],env=env,stdout=log,stderr=subprocess.STDOUT)
 for _ in range(90):
  if run(adb+['shell','getprop','sys.boot_completed'],False).strip()==b'1':break
  time.sleep(2)
 else:raise RuntimeError('boot timeout')
 with (OUT/'android/metro-capture-retry.log').open('wb') as log:metro=subprocess.Popen(['node','node_modules/react-native/cli.js','start','--port','8081','--max-workers','2'],env=env,stdout=log,stderr=subprocess.STDOUT)
 run(adb+['reverse','tcp:8081','tcp:8081']);run(adb+['shell','am','start','-W','-n','com.natophonetics.app/.MainActivity'])
 for _ in range(60):
  run(adb+['shell','uiautomator','dump','/sdcard/nato-run22-home.xml'],False)
  xml=run(adb+['shell','cat','/sdcard/nato-run22-home.xml'],False).decode(errors='replace')
  if 'text="NATO Phonetics"' in xml and 'Loading settings' not in xml:break
  time.sleep(1)
 else:raise RuntimeError('Home not visible')
 (OUT/'android/home-retrieved.xml').write_text(xml)
 apk=ROOT/'artifacts/run22/host-android-debug-final/app-debug.apk';expected=hashlib.sha256(apk.read_bytes()).hexdigest();package=run(adb+['shell','pm','path','com.natophonetics.app']).decode().strip().removeprefix('package:');actual=run(adb+['shell','sha256sum',package]).decode().split()[0];assert expected==actual
 shot=OUT/'screenshots/android/home-retrieved-light.png';shot.write_bytes(run(adb+['exec-out','screencap','-p']))
 records=json.loads((OUT/'screenshots/native-metadata-first.json').read_text());records=[r for r in records if r['platform']!='android'];records.append({'platform':'android','file':'android/home-retrieved-light.png','date':'2026-11-19','command':'adb -s emulator-5580 exec-out screencap -p','device':'nato-p00-api36 emulator-5580','runtime':'Android16/API36 arm64','theme':'light','pixels':struct.unpack('>II',shot.read_bytes()[16:24]),'apkSha256':expected,'installedApkSha256':actual,'fontScale':1,'homeAssertedInActualHierarchy':True})
 (OUT/'screenshots/native-metadata.json').write_text(json.dumps(records,indent=2)+'\n')
finally:
 if emulator:
  run(adb+['shell','am','force-stop','com.natophonetics.app'],False);run(adb+['emu','kill'],False)
  try:emulator.wait(timeout=15)
  except subprocess.TimeoutExpired:emulator.terminate()
 if metro:
  metro.terminate()
  try:metro.wait(timeout=15)
  except subprocess.TimeoutExpired:metro.kill()
 (OUT/'shared/android-capture-retry.json').write_text(json.dumps(commands,indent=2)+'\n')
print('Actual Home asserted and captured; tools shut down.')
