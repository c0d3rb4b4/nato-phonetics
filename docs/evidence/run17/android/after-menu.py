from pathlib import Path
import importlib.util,json,re,hashlib
OUT=Path(__file__).resolve().parent;SHOTS=OUT.parent/'screenshots/android'
spec=importlib.util.spec_from_file_location('driver',OUT.parents[1]/'run13/android/verify_native.py');d=importlib.util.module_from_spec(spec);spec.loader.exec_module(d)
d.OUT=OUT;d.SHOTS=SHOTS;d.captures=json.loads((SHOTS/'metadata.json').read_text());d.checks=json.loads((OUT/'checks.json').read_text())
# Continue from the failed command's exact live post-Menu scroll position.
# UIAutomator does not expose the offscreen input. Restore viewport before
# asserting text; this is a driver comparison, not a production repair.
d.dump('after-menu-before-return-scroll')
for _ in range(12):
 tree=d.dump();n=d.find(tree,desc='Text to convert')
 if n is not None:break
 d.adb('shell','input','swipe','650','420','650','1120','250')
else:raise AssertionError('Input not reached after returning viewport')
assert n.get('text')=='a3 b!',n.attrib
d.mark('converter-copy-menu-state',exactInput=n.get('text'),method='Same live post-Menu state, bounded viewport return; original capture command remains failed')
d.screenshot('converter-retained-input','Actual retained a3 b! after Menu/Back and return to top; earlier UIAutomator snapshot omitted offscreen input')
d.route('alphabet');d.expect(contains='Letter and digit reference');d.screenshot('alphabet','Actual installed reference after compatible Metro-family update')
d.tap(desc='Digits 0–9');d.expect(desc='Play 3, Three');d.screenshot('digits','Actual installed digit reference and bundled fonts');d.mark('reference-and-digits')
installed=d.adb('shell','pm','path',d.APP).strip().split('package:')[-1];raw=d.adb('exec-out','cat',installed,raw=True)
built=d.ROOT/'android/app/build/outputs/apk/debug/app-debug.apk';h=hashlib.sha256(raw).hexdigest();expected=hashlib.sha256(built.read_bytes()).hexdigest();assert h==expected
(OUT/'artifact.json').write_text(json.dumps({'candidate':'Run17 rebuilt Debug APK plus current actually loaded Metro0.83.8 JS','installedPath':installed,'installedSha256':h,'builtApk':str(built.relative_to(d.ROOT)),'builtSha256':expected,'matchesBuild':True,'runtime':'Android16/API36 arm64,720x1600,280dpi,fontScale1','loadedJS':'loaded-javascript.json'},indent=2)+'\n')
