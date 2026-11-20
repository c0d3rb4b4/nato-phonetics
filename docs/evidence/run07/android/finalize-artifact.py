from verify_native import *
import zipfile
artifact=ROOT/'artifacts/run06/android/NATOPhonetics-1.0.0-debug.apk'
installed=adb('shell','pm','path',APP).strip().replace('package:','')
actual=adb('shell','sha256sum',installed).split()[0]
expected=hashlib.sha256(artifact.read_bytes()).hexdigest();assert actual==expected,(actual,expected)
fonts=[]
with zipfile.ZipFile(artifact) as apk:
    for name in ['ExtraBold','SemiBold','Italic']:
        file=f'NatoTile-{name}.ttf';data=apk.read('assets/fonts/'+file)
        packaged=hashlib.sha256(data).hexdigest();source=hashlib.sha256((ROOT/'assets/fonts'/file).read_bytes()).hexdigest();assert packaged==source
        fonts.append({'file':file,'sha256':source})
manifest={'version':'1.0.0','versionCode':1,'package':APP,'apk':str(artifact.relative_to(ROOT)),'sha256':expected,'installedApk':installed,'installedSha256':actual,'fonts':fonts,'loadedJavaScript':'loaded-javascript.json','nativeSource':[],'platform':{'android':adb('shell','getprop','ro.build.version.release').strip(),'api':adb('shell','getprop','ro.build.version.sdk').strip(),'emulator':SERIAL,'avd':adb('emu','avd','name').strip(),'display':adb('shell','wm','size').strip(),'density':adb('shell','wm','density').strip()}}
for file in ['android/app/src/main/AndroidManifest.xml','android/app/src/main/java/com/natophonetics/app/MainActivity.kt','android/app/src/main/java/com/natophonetics/app/MainApplication.kt']:
 manifest['nativeSource'].append({'file':file,'sha256':hashlib.sha256((ROOT/file).read_bytes()).hexdigest()})
previous=json.loads((ROOT/'docs/evidence/run06/android/artifact.json').read_text())
assert manifest['nativeSource']==previous['nativeSource'], 'Reused APK requires unchanged native source'
manifest['reusedNativeBuild']='Run06 APK; Android native sources unchanged; fresh loaded JavaScript identifies Run07'
manifest['javascriptSource']=[{'file':file,'sha256':hashlib.sha256((ROOT/file).read_bytes()).hexdigest()} for file in ['src/components/NatoTile.js','src/hooks/useTileBaseline.js']]
manifest['fontScaleLayoutFeatureFlag']=runtime("[...__r.getModules().values()].find(m=>m.verboseName.endsWith('/ReactNativeFeatureFlags.js')).publicModule.exports.enableFontScaleChangesUpdatingLayout()");assert manifest['fontScaleLayoutFeatureFlag'] is False
(OUT/'artifact.json').write_text(json.dumps(manifest,indent=2)+'\n')
print(json.dumps({'passed':True,'installedSha256':actual,'packagedFonts':len(fonts)}),flush=True)
for capture in captures:
 capture['candidate']='../../android/artifact.json'
 capture.setdefault('inspection','Pending final direct inspection')
(SHOTS/'metadata.json').write_text(json.dumps(captures,indent=2)+'\n')
