"""Capture actual iOS baseline events while the separate XCTest driver waits."""
from pathlib import Path
import datetime,hashlib,json,os,re,subprocess,time
ROOT=Path(__file__).resolve().parents[4];OUT=Path(__file__).resolve().parent
os.chdir(ROOT);os.environ['DEVELOPER_DIR']='/Applications/Xcode.app/Contents/Developer'
NODE='/tmp/nato-phonetics-toolchain/node_modules/.bin/node'
APP=ROOT/'artifacts/ios-debug/Build/Products/Debug-iphonesimulator/NATOPhonetics.app'
DEVICE='D6F0ADFF-A6FB-4B1C-B48F-2A77E35D29BB'
DIRECTORY=Path('/tmp/nato-ios-run07-capture')
def run(cmd,log):
 print('RUN',log,flush=True)
 with (OUT/log).open('w') as f:
  f.write('Command: '+repr(cmd)+'\n');f.flush();p=subprocess.run(cmd,stdout=f,stderr=subprocess.STDOUT);f.write('\nEXIT '+str(p.returncode)+'\n')
 if p.returncode:raise RuntimeError(log+' failed')
def sim(*args):subprocess.run(['xcrun','simctl',*args],check=True,stdout=subprocess.DEVNULL)
def runtime(expression):
 return json.loads(subprocess.check_output([NODE,str(OUT/'read-runtime.cjs'),expression],text=True))
def snapshot(name):
 runtime('@'+str(OUT/'inspect-tiles.js'))
 for _ in range(20):
  time.sleep(.1);data=runtime('globalThis.__natoTileMeasurements')
  if not data.get('pending'):break
 if data.get('pending'):raise RuntimeError('Incomplete native layout: '+name)
 data.update(capturedAt=datetime.datetime.now(datetime.timezone.utc).isoformat(),captureMethod='Actual retained native onTextLayout baseline and transformed Fabric measure through Hermes inspector')
 (OUT/(name+'-native-layout.json')).write_text(json.dumps(data,indent=2)+'\n')
 print('NATIVE',name,len(data.get('values',[])),flush=True)
def test(name,method,size):
 sim('ui',DEVICE,'content_size',size)
 result=str(DIRECTORY/(name+'.xcresult'))
 cmd=['xcodebuild','test-without-building','-project',str(DIRECTORY/'Capture.xcodeproj'),'-scheme','Capture','-configuration','Debug','-destination','platform=iOS Simulator,id='+DEVICE,'-derivedDataPath',str(DIRECTORY/'DerivedData'),'CODE_SIGNING_ALLOWED=NO','-parallel-testing-enabled','NO','-resultBundlePath',result,'-only-testing:CaptureUITests/CaptureUITests/'+method]
 with (OUT/(name+'-test.log')).open('w') as f:
  f.write('Command: '+repr(cmd)+'\n');f.flush()
  process=subprocess.Popen(cmd,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,text=True,bufsize=1)
  for line in process.stdout:
   f.write(line);f.flush()
   match=re.match(r'^BASELINE_READY (\S+)',line)
   if match:snapshot(match.group(1))
  code=process.wait();f.write('\nEXIT '+str(code)+'\n')
 export=str(DIRECTORY/(name+'-export'))
 run(['xcrun','xcresulttool','export','attachments','--path',result,'--output-path',export],name+'-export.log')
 run(['python3',str(OUT/'export-screenshots.py'),export,'debug',str(OUT/(name+'-test.log')),'iPadPro11M5',str(2),size],name+'-metadata.log')
 if code:raise RuntimeError(name+' failed')

sim('boot',DEVICE);sim('bootstatus',DEVICE,'-b');sim('install',DEVICE,str(APP))
try:
 container=Path(subprocess.check_output(['xcrun','simctl','get_app_container',DEVICE,'com.natophonetics.app','app'],text=True).strip())
 sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
 fonts=[{'file':p.name,'sha256':sha(p)} for p in sorted(APP.glob('NatoTile-*.ttf'))]
 sourceFiles=['src/components/NatoTile.js','src/hooks/useTileBaseline.js','src/hooks/useTileEnvironment.js','src/lib/tileTextUnits.js','src/lib/tileDesign.js','ios/NATOPhonetics/AppDelegate.swift']
 artifact={'date':'2026-11-17','platform':'ios','configuration':'Debug','bundleIdentifier':'com.natophonetics.app','version':'1.0.0','build':'1','nativeExecutableSha256':sha(APP/'NATOPhonetics'),'debugDylibSha256':sha(APP/'NATOPhonetics.debug.dylib'),'fonts':fonts,'sourceFiles':{p:sha(ROOT/p) for p in sourceFiles},'appPath':str(APP.relative_to(ROOT)),'xcode':'27.2 (27B52)','runtime':'iOS/iPadOS26.2','javaScript':'Metro development bundle, captured separately using Debugger.getScriptSource; no embedded Release JS bundle'}
 (OUT/'artifact.json').write_text(json.dumps(artifact,indent=2)+'\n')
 assert sha(container/'NATOPhonetics')==artifact['nativeExecutableSha256']
 assert sha(container/'NATOPhonetics.debug.dylib')==artifact['debugDylibSha256']
 for font in fonts:assert sha(container/font['file'])==font['sha256']
 (OUT/'installed-artifact.json').write_text(json.dumps({'device':DEVICE,'installed':str(container),'verified':True,'candidate':artifact},indent=2)+'\n')
 test('default','testDefaultNativeBaselines','large')
 test('maximum','testMaximumNativeBaselines','accessibility-extra-extra-extra-large')
 sim('launch',DEVICE,'com.natophonetics.app');time.sleep(3)
 run([NODE,str(OUT/'capture-loaded-bundles.cjs')],'loaded-javascript.log')
finally:
 sim('ui',DEVICE,'content_size','large');sim('shutdown',DEVICE)
