from pathlib import Path
import importlib.util,hashlib,json,re,time
OUT=Path(__file__).resolve().parent;SHOTS=OUT.parent/'screenshots/android'
spec=importlib.util.spec_from_file_location('driver',OUT.parents[1]/'run13/android/verify_native.py');d=importlib.util.module_from_spec(spec);spec.loader.exec_module(d)
d.OUT=OUT;d.SHOTS=SHOTS;d.checks=[];d.captures=[]
d.adb('reverse','tcp:8081','tcp:8081');d.adb('shell','settings','put','system','font_scale','1.0')
d.route('privacy',cold=True);d.expect(contains='Privacy policy',timeout=65)
for _ in range(30):
 node=d.find(d.dump(),contains='Speech and connectivity')
 if node is not None:
  box=list(map(int,re.findall(r'\d+',node.get('bounds',''))))
  if len(box)==4 and box[1]>200 and box[3]<1460:break
 d.adb('shell','input','swipe','650','1220','650','900','250')
else:raise AssertionError('Speech paragraph not fully reachable')
assert 'Speech output does not request microphone access.' in node.get('text',''),node.attrib
d.screenshot('policy-complete','Unchanged Android Run17 installed Debug binary/current loaded JS; full Speech disclosure at default fontScale1')
d.mark('policy-reachable-complete-label',bounds=box)
installed=d.adb('shell','pm','path',d.APP).strip().split('package:')[-1];raw=d.adb('exec-out','cat',installed,raw=True)
built=d.ROOT/'android/app/build/outputs/apk/debug/app-debug.apk';expected=json.loads((OUT.parents[1]/'run17/android/artifact.json').read_text())['builtSha256']
h=hashlib.sha256(raw).hexdigest();assert h==expected==hashlib.sha256(built.read_bytes()).hexdigest()
(OUT/'artifact.json').write_text(json.dumps({'candidate':'Reused unchanged Run17 Debug APK; current loaded Metro graph archived separately. Standard Android Gradle uses unchanged Maven React Native/Yoga binary. No Android native rebuild or live-font repair.', 'installedPath':installed,'installedSha256':h,'builtApk':str(built.relative_to(d.ROOT)),'builtSha256':expected,'matchesBuild':True,'runtime':'Android16/API36 arm64,720x1600,280dpi,fontScale1','loadedJS':'loaded-javascript.json'},indent=2)+'\n')
