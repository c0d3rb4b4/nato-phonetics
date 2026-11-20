from pathlib import Path
import importlib.util,subprocess,os,time,json,hashlib,re
OUT=Path(__file__).resolve().parent;SHOTS=OUT.parent/'screenshots/android';SHOTS.mkdir(parents=True,exist_ok=True)
spec=importlib.util.spec_from_file_location('driver',OUT.parents[1]/'run13/android/verify_native.py');d=importlib.util.module_from_spec(spec);spec.loader.exec_module(d)
d.OUT=OUT;d.SHOTS=SHOTS;d.captures=[];d.checks=[]
end=time.monotonic()+90
while time.monotonic()<end:
 if d.adb('shell','getprop','sys.boot_completed').strip()=='1':break
 time.sleep(.5)
else:raise RuntimeError('Emulator did not boot')
d.adb('reverse','tcp:8081','tcp:8081');d.adb('shell','settings','put','system','font_scale','1.0')
d.route('privacy',cold=True)
d.expect(contains='Privacy policy',timeout=65)
needle='Reference and conversion logic run locally once loaded. Audio in airplane mode has not been verified across supported devices.'
for _ in range(35):
 tree=d.dump();node=d.find(tree,contains=needle)
 if node is not None:
  box=list(map(int,re.findall(r'\d+',node.get('bounds',''))))
  if box[1]>195 and box[3]<1515:break
 d.adb('shell','input','swipe','650','1200','650','850','230')
else:raise AssertionError('Changed policy paragraph not fully reached')
tree=d.dump('native-offline-policy');assert 'Web installation and offline caching have not yet been implemented' not in str(tree)
# Raw app screenshot; theme observed separately from live native preferences.
theme='light'
d.screenshot('native-offline-policy','Changed native Offline availability policy; obsolete web-unimplemented sentence removed',theme=theme)
d.mark('native-policy-reachable',exactParagraph=needle)
installed=d.adb('shell','pm','path',d.APP).strip().split('package:')[-1];raw=d.adb('exec-out','cat',installed,raw=True)
built=d.ROOT/'android/app/build/outputs/apk/debug/app-debug.apk';h=hashlib.sha256(raw).hexdigest()
(OUT/'artifact.json').write_text(json.dumps({'candidate':'Existing Run14 Debug APK plus current actually loaded Metro JS','installedPath':installed,'installedSha256':h,'builtApk':str(built.relative_to(d.ROOT)),'builtSha256':hashlib.sha256(built.read_bytes()).hexdigest(),'matchesBuild':h==hashlib.sha256(built.read_bytes()).hexdigest(),'runtime':'Android16/API36 arm64, 720x1600,280dpi,fontScale1','loadedJS':'loaded-javascript.json'},indent=2)+'\n')
