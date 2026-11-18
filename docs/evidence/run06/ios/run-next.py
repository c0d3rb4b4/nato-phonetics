"""Serialize actual iOS runtime checks on the shared low-memory host."""
from pathlib import Path
import os,subprocess,json,hashlib
ROOT=Path(__file__).resolve().parents[4];OUT=Path(__file__).resolve().parent
os.chdir(ROOT);os.environ['DEVELOPER_DIR']='/Applications/Xcode.app/Contents/Developer'
APP=ROOT/'artifacts/ios-simulator/Build/Products/Release-iphonesimulator/NATOPhonetics.app'
def run(cmd,log):
 print('RUN',log,flush=True)
 with (OUT/log).open('w') as f:
  f.write('Command: '+repr(cmd)+'\n');f.flush();p=subprocess.run(cmd,stdout=f,stderr=subprocess.STDOUT);f.write('\nEXIT '+str(p.returncode)+'\n')
 if p.returncode:raise RuntimeError(log+' failed')
def sim(*args):subprocess.run(['xcrun','simctl',*args],check=True,stdout=subprocess.DEVNULL)
def test(device,group,name,method,size,label,density):
 sim('ui',device,'content_size',size)
 directory='/tmp/nato-ios-run06-'+group
 project='WindowResize' if group=='resize' else 'Capture'
 klass=project+'UITests'
 result=directory+'/'+name+'.xcresult'
 failure=None
 try:run(['xcodebuild','test-without-building','-project',directory+'/'+project+'.xcodeproj','-scheme',project,'-configuration','Debug','-destination','platform=iOS Simulator,id='+device,'-derivedDataPath',directory+'/DerivedData','CODE_SIGNING_ALLOWED=NO','-parallel-testing-enabled','NO','-resultBundlePath',result,'-only-testing:'+klass+'/'+klass+'/'+method],name+'-test.log')
 except RuntimeError as error:failure=error
 export=directory+'/'+name+'-export';run(['xcrun','xcresulttool','export','attachments','--path',result,'--output-path',export],name+'-export.log')
 run(['python3',str(OUT/'export-screenshots.py'),export,name,str(OUT/(name+'-test.log')),label,str(density),size],name+'-metadata.log')
 if failure:raise failure

phone='0653F7EC-9237-4AC5-A264-12969E625070';ipad='D6F0ADFF-A6FB-4B1C-B48F-2A77E35D29BB'
installed=[];failures=[]
for device,label,density,cases in [(phone,'iPhone17Pro',3,[('resize','phone','testPhoneHeader','large'),('capture','dark','testDarkContexts','large')]),(ipad,'iPadPro11M5',2,[('resize','restored-auto','testRestoredAutomaticHeader','large'),('resize','enlarged','testLargeTextWindowHeader','extra-extra-extra-large'),('capture','maximum','testMaximumAlphabetAndContexts','accessibility-extra-extra-extra-large')])]:
 sim('boot',device);sim('bootstatus',device,'-b');sim('install',device,str(APP))
 try:
  container=Path(subprocess.check_output(['xcrun','simctl','get_app_container',device,'com.natophonetics.app','app'],text=True).strip())
  installed.append({'device':device,'label':label,'nativeExecutableSha256':hashlib.sha256((container/'NATOPhonetics').read_bytes()).hexdigest(),'javaScriptBundleSha256':hashlib.sha256((container/'main.jsbundle').read_bytes()).hexdigest()})
  (OUT/'installed-artifacts.json').write_text(json.dumps(installed,indent=2)+'\n')
  for group,name,method,size in cases:
   try:test(device,group,name,method,size,label,density)
   except RuntimeError as error:failures.append(str(error));print(error,flush=True)
 finally:
  sim('ui',device,'content_size','large');sim('shutdown',device)

(OUT/"runtime-failures.json").write_text(json.dumps(failures,indent=2)+"\n")
if failures:raise RuntimeError(str(failures))
