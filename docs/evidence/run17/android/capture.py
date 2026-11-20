from pathlib import Path
import importlib.util,subprocess,time,json,hashlib,re
OUT=Path(__file__).resolve().parent;SHOTS=OUT.parent/'screenshots/android';SHOTS.mkdir(parents=True,exist_ok=True)
spec=importlib.util.spec_from_file_location('driver',OUT.parents[1]/'run13/android/verify_native.py');d=importlib.util.module_from_spec(spec);spec.loader.exec_module(d)
d.OUT=OUT;d.SHOTS=SHOTS;d.captures=[];d.checks=[]
end=time.monotonic()+100
while time.monotonic()<end:
 if d.adb('shell','getprop','sys.boot_completed').strip()=='1':break
 time.sleep(.5)
else:raise RuntimeError('Emulator did not boot')
d.adb('reverse','tcp:8081','tcp:8081');d.adb('shell','settings','put','system','font_scale','1.0')
def reveal(**query):
 for _ in range(18):
  tree=d.dump();n=d.find(tree,**query)
  if n is not None:
   box=list(map(int,re.findall(r'\d+',n.get('bounds',''))))
   if len(box)==4 and box[1]>185 and box[3]<1510:return n
  d.adb('shell','input','swipe','650','1240','650','880','250')
 raise AssertionError('Unreachable '+str(query))
d.route('converter',cold=True);d.expect(desc='Text to convert',timeout=65)
d.set_text('abcdefghijklmnopqrstuvwxyz')
d.tap(desc='Play Full Phrase');d.expect(desc='Stop playback',timeout=15)
d.screenshot('converter-playing','Actual installed Debug app, Metro0.83.8, real provider playing; no listening acceptance')
d.tap(desc='Stop playback');time.sleep(.4);d.idle('stop-playback')
d.route('converter',cold=True);d.expect(desc='Text to convert',timeout=35);d.set_text('a3 b!')
node=d.expect(desc='Text to convert');assert node.get('text')=='a3 b!',node.attrib
reveal(desc='Copy conversion');d.tap(desc='Copy conversion');d.expect(contains='Copied conversion.')
reveal(contains='Alfa Three / Bravo')
d.screenshot('converter-copy','Exact a3 b! conversion, unsupported-character marker and real native Copy confirmation')
d.tap(desc='Open menu');d.tap(desc='Back to App');node=d.expect(desc='Text to convert');assert node.get('text')=='a3 b!',node.attrib
d.mark('converter-copy-menu-state',exactInput=node.get('text'))
d.route('alphabet');d.expect(contains='Letter and digit reference');d.screenshot('alphabet','Actual installed reference after compatible Metro-family update')
d.tap(desc='Digits 0–9');d.expect(desc='Play 3, Three');d.screenshot('digits','Actual installed digit reference and bundled fonts')
d.mark('reference-and-digits')
installed=d.adb('shell','pm','path',d.APP).strip().split('package:')[-1];raw=d.adb('exec-out','cat',installed,raw=True)
built=d.ROOT/'android/app/build/outputs/apk/debug/app-debug.apk';h=hashlib.sha256(raw).hexdigest()
(OUT/'artifact.json').write_text(json.dumps({'candidate':'Run17 rebuilt Debug APK plus current actually loaded Metro0.83.8 JS','installedPath':installed,'installedSha256':h,'builtApk':str(built.relative_to(d.ROOT)),'builtSha256':hashlib.sha256(built.read_bytes()).hexdigest(),'matchesBuild':h==hashlib.sha256(built.read_bytes()).hexdigest(),'runtime':'Android16/API36 arm64,720x1600,280dpi,fontScale1','loadedJS':'loaded-javascript.json'},indent=2)+'\n')
