from pathlib import Path
import json,hashlib,subprocess,plistlib,os
os.environ['DEVELOPER_DIR']='/Applications/Xcode.app/Contents/Developer'
out=Path(__file__).resolve().parent;root=out.parents[3]
app=root/'artifacts/ios-simulator/Build/Products/Release-iphonesimulator/NATOPhonetics.app'
plist=plistlib.loads((app/'Info.plist').read_bytes());files={str(p.relative_to(app)):hashlib.sha256(p.read_bytes()).hexdigest() for p in app.rglob('*') if p.is_file()}
installed=subprocess.check_output(['xcrun','simctl','get_app_container','0653F7EC-9237-4AC5-A264-12969E625070','com.natophonetics.app','app'],text=True).strip();actual=Path(installed)
assert all((actual/n).exists() and hashlib.sha256((actual/n).read_bytes()).hexdigest()==h for n,h in files.items())
(out/'artifact.json').write_text(json.dumps({'candidate':'Run14 rebuilt unsigned Release simulator app; current bundled JS','bundleIdentifier':plist['CFBundleIdentifier'],'version':plist['CFBundleShortVersionString'],'build':plist['CFBundleVersion'],'appPath':str(app.relative_to(root)),'installedPath':installed,'allInstalledFilesMatch':True,'files':files},indent=2)+'\n')
print('Installed Release app matches build:',len(files),'files; compiled Assets.car and bundled main.jsbundle identified')
