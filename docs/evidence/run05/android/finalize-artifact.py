"""Identify final debug APK, identical bundled fonts and observed running Metro JS."""
from pathlib import Path
import hashlib,json,shutil,zipfile,subprocess
root=Path(__file__).resolve().parents[4];out=Path(__file__).resolve().parent
h=lambda b:hashlib.sha256(b).hexdigest()
apk=root/'android/app/build/outputs/apk/debug/app-debug.apk';dest=root/'artifacts/run05/android/NATOPhonetics-1.0.0-debug.apk';dest.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(apk,dest)
font_manifest=json.loads((root/'assets/fonts/manifest.json').read_text());fonts=[]
with zipfile.ZipFile(apk)as z:
 for font in font_manifest['faces']:
  sha=h(z.read('assets/fonts/'+font['file']));assert sha==font['sha256'];fonts.append({'file':'assets/fonts/'+font['file'],'sha256':sha})
loaded=json.loads((out/'loaded-javascript.json').read_text())
for script in loaded['scripts']:assert h((root/script['file']).read_bytes())==script['sha256']
adb='/Users/mac/Library/Android/sdk/platform-tools/adb'
installed_path=subprocess.check_output([adb,'-s','emulator-5580','shell','pm','path','com.natophonetics.app'],text=True).strip().removeprefix('package:')
installed_sha=subprocess.check_output([adb,'-s','emulator-5580','shell','sha256sum',installed_path],text=True).split()[0]
assert installed_sha==h(dest.read_bytes()),'InstalledAPK differs from packaged artifact'
result={'date':'2026-11-17','platform':'android','package':'com.natophonetics.app','version':'1.0.0','versionCode':1,'apkPath':str(dest.relative_to(root)),'apkSha256':h(dest.read_bytes()),'apkBytes':dest.stat().st_size,'installedApkPath':installed_path,'installedApkSha256':installed_sha,'fonts':fonts,'runtime':'Android16/API36','emulator':'nato-p00-api36','serial':'emulator-5580','display':'720x1600@280dpi baseline; recorded narrow/landscape/tablet overrides in screenshot metadata','runningJavaScript':loaded,'note':'Debug APK needs Metro. APK and observed loaded JavaScript together identify the executed candidate. This is a development certificate build, not signed distribution.'}
result['findings']=[{'id':'android-live-scale-general-text','status':'open','owner':'P05.2/P05.8/R06/R07 engineering','detail':'During live200percent and returned100percent systemfont changes, non-tile header/instruction clip or retain stale enlarged text; the second instruction clause disappears. Sharedtile geometry/fonts/raster now pass the five-step cycle after inverse-cache removal; overall app text lifecycle remains unfinished. See scale-transition-final.log and screenshot stages2/4.'},{'id':'android-tile-inverse-cache','status':'resolved','owner':'P05.7/R25 engineering','detail':'Prior cachedinverse values drifted from native renderer metrics on return1x. Removal of JS memoization verified by120glyph observations and390nativebaselines through1→2→1→2→1; historical failure retained under diagnostics/live-scale-reset.'}]
result['notExercised']=[{'case':'Actual Android app-window resizing/freeform','reason':'Emulator featurelist does not advertise android.software.freeform_window_management; display wm size overrides are viewport evidence, not an app-window resize.'}]
raster=json.loads((out/'raster-measurements.json').read_text())
failures=[row for row in raster if any(abs(value)>2 for value in row['deltaPixels'].values())]
result['rasterVerification']={'observations':len(raster),'passed':not failures,'nominalEnvelopePhysicalPixels':2,'failures':failures}
if failures:result['findings'].append({'id':'android-digit3-guide-raster-edge','status':'open','owner':'P05.8/R25 engineering','detail':'A nominal glyph-outline edge remains outside the strict2px envelope; inspect rasterVerification failures and digit3-fringe-analysis.json. Independent baseline/alpha explanation does not turn the raw gate into a pass.'})
(out/'artifact.json').write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps({'apk':result['apkSha256'],'fontsVerified':len(fonts),'loadedScripts':len(loaded['scripts'])}))
