from pathlib import Path
import subprocess,re,json
adb=['adb','-s','emulator-5580']
call=lambda *args: subprocess.check_output(adb+list(args),text=True)
original=call('shell','wm','size');m=re.search(r'Override size: (\d+x\d+)',original);override=m[1] if m else 'reset'
try:
 call('shell','wm','size','560x1000')
 subprocess.run(['python3','scripts/run-android-font-release-fixture.py','artifacts/run29/instrumentation/font-composition.apk','artifacts/run29/release-fixture/font-release-fixture.apk','docs/evidence/run29/android/narrow','emulator-5580','primary','cold2'],check=True)
finally:
 call('shell','wm','size',override)
 Path('docs/evidence/run29/android/narrow-restoration.json').write_text(json.dumps({'original':original,'restored':call('shell','wm','size')},indent=2)+'\n')
