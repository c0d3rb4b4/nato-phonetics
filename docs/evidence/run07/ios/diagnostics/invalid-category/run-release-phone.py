"""Install the real Release app and capture the matching DPR3 J states."""
from pathlib import Path
import hashlib,json,os,subprocess
ROOT=Path(__file__).resolve().parents[4];OUT=Path(__file__).resolve().parent
os.chdir(ROOT);os.environ['DEVELOPER_DIR']='/Applications/Xcode.app/Contents/Developer'
os.environ['NATO_IOS_ARTIFACT_MANIFEST']='artifact.json'
APP=ROOT/'artifacts/ios-simulator/Build/Products/Release-iphonesimulator/NATOPhonetics.app'
DEVICE='0653F7EC-9237-4AC5-A264-12969E625070';DIRECTORY=Path(os.environ.get('NATO_IOS_DRIVER_DIRECTORY','/tmp/nato-ios-run07-capture'))
FOCUSED=os.environ.get('NATO_IOS_FOCUSED')=='1'
def run(cmd,log):
 print('RUN',log,flush=True)
 with (OUT/log).open('w') as f:
  f.write('Command: '+repr(cmd)+'\n');f.flush();p=subprocess.run(cmd,stdout=f,stderr=subprocess.STDOUT);f.write('\nEXIT '+str(p.returncode)+'\n')
 if p.returncode:raise RuntimeError(log+' failed')
def sim(*args):subprocess.run(['xcrun','simctl',*args],check=True,stdout=subprocess.DEVNULL)
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
archive=ROOT/'artifacts/run07/ios/NATOPhonetics-1.0.0-release-simulator.zip'
if not archive.exists():run(['ditto','-c','-k','--sequesterRsrc','--keepParent',str(APP),str(archive)],'release-package.log')
sourceFiles=['src/components/NatoTile.js','src/hooks/useTileBaseline.js','src/hooks/useTileEnvironment.js','src/lib/tileTextUnits.js','src/lib/tileDesign.js','ios/NATOPhonetics/AppDelegate.swift']
buildSource=json.loads((OUT/'release-build-source.json').read_text())
assert buildSource['sourceFiles']=={p:sha(ROOT/p) for p in sourceFiles},'Source changed after Release build'
assert buildSource['javaScriptBundleSha256']==sha(APP/'main.jsbundle')
artifact={'date':'2026-11-17','platform':'ios','configuration':'Release','bundleIdentifier':'com.natophonetics.app','version':'1.0.0','build':'1','nativeExecutableSha256':sha(APP/'NATOPhonetics'),'javaScriptBundleSha256':sha(APP/'main.jsbundle'),'fonts':[{'file':p.name,'sha256':sha(p)}for p in sorted(APP.glob('NatoTile-*.ttf'))],'sourceFiles':{p:sha(ROOT/p) for p in sourceFiles},'appPath':str(APP.relative_to(ROOT)),'xcode':'27.2 (27B52)','runtime':'iOS/iPadOS26.2','archivePath':str(archive.relative_to(ROOT)),'archiveSha256':sha(archive)}
(OUT/'artifact.json').write_text(json.dumps(artifact,indent=2)+'\n')
sim('boot',DEVICE);sim('bootstatus',DEVICE,'-b');sim('install',DEVICE,str(APP))
try:
 container=Path(subprocess.check_output(['xcrun','simctl','get_app_container',DEVICE,'com.natophonetics.app','app'],text=True).strip())
 assert sha(container/'NATOPhonetics')==artifact['nativeExecutableSha256']
 assert sha(container/'main.jsbundle')==artifact['javaScriptBundleSha256']
 for font in artifact['fonts']:assert sha(container/font['file'])==font['sha256']
 (OUT/'installed-release-artifact.json').write_text(json.dumps({'device':DEVICE,'installed':str(container),'verified':True,'candidate':artifact},indent=2)+'\n')
 cases=[('release-phone-maximum-focused','testPhoneMaximumFocusedNativeBaselines','accessibility-extra-extra-extra-extra-large')] if FOCUSED else [('release-phone-default','testPhoneDefaultNativeBaselines','large'),('release-phone-maximum','testPhoneMaximumNativeBaselines','accessibility-extra-extra-extra-large')]
 for name,method,size in cases:
  sim('ui',DEVICE,'content_size',size)
  result=str(DIRECTORY/(name+'.xcresult'))
  run(['xcodebuild','test-without-building','-project',str(DIRECTORY/'Capture.xcodeproj'),'-scheme','Capture','-configuration','Debug','-destination','platform=iOS Simulator,id='+DEVICE,'-derivedDataPath',str(DIRECTORY/'DerivedData'),'CODE_SIGNING_ALLOWED=NO','-parallel-testing-enabled','NO','-resultBundlePath',result,'-only-testing:CaptureUITests/CaptureUITests/'+method],name+'-test.log')
  export=str(DIRECTORY/(name+'-export'))
  run(['xcrun','xcresulttool','export','attachments','--path',result,'--output-path',export],name+'-export.log')
  run(['python3',str(OUT/'export-screenshots.py'),export,'final-release',str(OUT/(name+'-test.log')),'iPhone17Pro','3',size],name+'-metadata.log')
finally:
 sim('ui',DEVICE,'content_size','large');sim('shutdown',DEVICE)
