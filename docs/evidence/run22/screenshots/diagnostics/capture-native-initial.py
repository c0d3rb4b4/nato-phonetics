"""Install only identified successful local host products, then capture real apps."""
from pathlib import Path
import subprocess,os,json,time,hashlib,tarfile,plistlib,stat,struct
ROOT=Path(__file__).resolve().parents[3];OUT=ROOT/'docs/evidence/run22';os.chdir(ROOT)
env=os.environ.copy();env['PATH']='/tmp/nato-phonetics-toolchain/node_modules/.bin:'+env['PATH'];env['DEVELOPER_DIR']='/Applications/Xcode.app/Contents/Developer'
records=[];commands=[]
def run(args,check=True):
 p=subprocess.run(args,env=env,stdout=subprocess.PIPE,stderr=subprocess.STDOUT);commands.append({'command':args,'exitCode':p.returncode,'output':p.stdout.decode(errors='replace')});
 if check and p.returncode:raise RuntimeError(commands[-1])
 return p.stdout
sha=lambda p:hashlib.sha256(Path(p).read_bytes()).hexdigest()
def inventory(root):return {str(f.relative_to(root)):sha(f) for f in sorted(root.rglob('*')) if f.is_file()}
try:
 report=json.loads((ROOT/'artifacts/run22/host-ios-final/report.json').read_text());assert report['status']=='passed'
 archive=ROOT/'artifacts/run22/host-ios-final/ios-simulator.tar.gz';assert sha(archive)==report['artifacts'][0]['sha256']
 retrieved=Path('/tmp/nato-run22-retrieved-ios');retrieved.mkdir(exist_ok=True)
 run(['tar','-xzf',str(archive),'-C',str(retrieved)])
 app=retrieved/'NATOPhonetics.app';built=ROOT/'artifacts/ios-simulator/Build/Products/Release-iphonesimulator/NATOPhonetics.app'
 assert inventory(app)==inventory(built);assert (app/'NATOPhonetics').stat().st_mode & stat.S_IXUSR
 devices=json.loads(run(['xcrun','simctl','list','devices','available','-j']))['devices'];device=next(d for runtime,ds in devices.items() if '26-2' in runtime for d in ds if d['name']=='iPhone 17 Pro')
 uid=device['udid'];run(['xcrun','simctl','boot',uid]);run(['xcrun','simctl','bootstatus',uid,'-b'])
 run(['xcrun','simctl','install',uid,str(app)]);run(['xcrun','simctl','launch',uid,'com.natophonetics.app']);time.sleep(3)
 (OUT/'screenshots/ios').mkdir(exist_ok=True)
 shot=OUT/'screenshots/ios/home-retrieved-light.png';run(['xcrun','simctl','io',uid,'screenshot',str(shot)])
 installed=Path(run(['xcrun','simctl','get_app_container',uid,'com.natophonetics.app','app']).decode().strip());assert inventory(installed)==inventory(app)
 run(['xcrun','simctl','shutdown',uid])
 records.append({'platform':'ios','archiveSha256':sha(archive),'file':'ios/home-retrieved-light.png','command':'xcrun simctl io '+uid+' screenshot <path>','device':device,'runtime':'iOS26.2','sdk':'27.2','retrievedAndInstalledFiles':inventory(app),'executablePermissionPreserved':True,'theme':'light','pixels':struct.unpack('>II',shot.read_bytes()[16:24])})
 report=json.loads((ROOT/'artifacts/run22/host-android-debug-final/report.json').read_text());assert report['status']=='passed'
 apk=ROOT/'artifacts/run22/host-android-debug-final/app-debug.apk';assert sha(apk)==report['artifacts'][0]['sha256']
 sdk=Path.home()/'Library/Android/sdk'
 with (OUT/'android/emulator-final.log').open('wb') as log:
  emulator=subprocess.Popen([str(sdk/'emulator/emulator'),'-avd','nato-p00-api36','-port','5580','-no-window','-no-snapshot','-no-boot-anim','-gpu','host','-memory','2560'],env=env,stdout=log,stderr=subprocess.STDOUT)
 adb=['adb','-s','emulator-5580']
 for _ in range(90):
  if run(adb+['shell','getprop','sys.boot_completed'],False).strip()==b'1':break
  time.sleep(2)
 else:raise RuntimeError('Android boot timeout')
 with (OUT/'android/metro-final.log').open('wb') as log:metro=subprocess.Popen(['node','node_modules/react-native/cli.js','start','--port','8081','--max-workers','2'],env=env,stdout=log,stderr=subprocess.STDOUT)
 run(adb+['reverse','tcp:8081','tcp:8081']);run(adb+['install','-r',str(apk)]);run(adb+['shell','settings','put','system','font_scale','1']);run(adb+['shell','am','force-stop','com.natophonetics.app']);run(adb+['shell','am','start','-W','-n','com.natophonetics.app/.MainActivity'])
 for _ in range(60):
  p=subprocess.run(['node','docs/evidence/run07/android/read-runtime.cjs','typeof globalThis.__fontProbe === "undefined"'],env=env,stdout=subprocess.PIPE,stderr=subprocess.DEVNULL)
  if p.returncode==0 and json.loads(p.stdout)==True:break
  time.sleep(1)
 else:raise RuntimeError('Normal Hermes target missing')
 shot=OUT/'screenshots/android/home-retrieved-light.png';shot.write_bytes(run(adb+['exec-out','screencap','-p']))
 package=run(adb+['shell','pm','path','com.natophonetics.app']).decode().strip().removeprefix('package:');installed_hash=run(adb+['shell','sha256sum',package]).decode().split()[0];assert installed_hash==sha(apk)
 records.append({'platform':'android','file':'android/home-retrieved-light.png','command':'adb -s emulator-5580 exec-out screencap -p','device':'nato-p00-api36 / emulator-5580','runtime':'Android16/API36 arm64','theme':'light','pixels':struct.unpack('>II',shot.read_bytes()[16:24]),'apkSha256':sha(apk),'installedApkSha256':installed_hash,'fontScale':1,'normalProductEntry':True})
 run(adb+['shell','am','force-stop','com.natophonetics.app']);run(adb+['emu','kill']);metro.terminate();metro.wait(timeout=15);emulator.wait(timeout=15)
finally:
 (OUT/'screenshots/native-metadata.json').write_text(json.dumps(records,indent=2)+'\n');(OUT/'shared/native-install-captures.json').write_text(json.dumps(commands,indent=2)+'\n')
print('Matching local native products installed, captured and shut down.')
