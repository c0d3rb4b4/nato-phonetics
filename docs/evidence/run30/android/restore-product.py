"""Restore exact initial APK/numeric settings and normal Debug product entry."""
from pathlib import Path
import importlib.util,json,subprocess,time
ROOT=Path(__file__).resolve().parents[4];OUT=Path(__file__).resolve().parent
spec=importlib.util.spec_from_file_location('native',ROOT/'docs/evidence/run08/android/verify_native.py')
m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
m.OUT=OUT;m.SHOTS=OUT.parent/'screenshots/android';m.ADB='/Users/mac/Library/Android/sdk/platform-tools/adb'
m.checks=json.loads((OUT/'checks.json').read_text());m.captures=json.loads((m.SHOTS/'metadata.json').read_text())
before=json.loads((OUT/'device-before.json').read_text())
(OUT/'restoration-install.log').write_text(m.adb('install','-r',str(ROOT/'artifacts/run30/initial.apk')))
m.adb('shell','settings','put','system','font_scale',before['fontScale'])
def override(value):return value.split('Override size: ')[-1] if 'Override size: ' in value else value.split('Override density: ')[-1] if 'Override density: ' in value else 'reset'
m.adb('shell','wm','size',override(before['window']));m.adb('shell','wm','density',override(before['density']))
m.adb('shell','ime','set',before['ime']);m.adb('reverse','tcp:8081','tcp:8081')
m.route('settings',cold=True);m.expect(desc='Dark',timeout=90);m.tap(desc='Dark')
m.route('alphabet');m.expect(desc='Play A, Alfa',timeout=45)
m.screenshot('restored-product','Exact initial Debug APK; ordinary product reference; documented Dark restored','dark')
installed=m.adb('shell','pm','path',m.APP).strip().removeprefix('package:')
actual={'apkSha256':m.adb('shell','sha256sum',installed).split()[0],
    'fontScale':m.adb('shell','settings','get','system','font_scale').strip(),
    'window':m.adb('shell','wm','size').strip(),'density':m.adb('shell','wm','density').strip(),
    'ime':m.adb('shell','settings','get','secure','default_input_method').strip()}
assert all(actual[k]==before[k] for k in actual)
report={'passed':True,'settingsAndApk':actual,'matchesInitialNumericSettingsAndApk':True,
    'ordinaryProductReferenceVerified':True,'appDataCleared':False,
    'theme':'Dark, matching last documented Run29 preference; pre-run theme not independently captured, exact initial preference restoration unverified',
    'progress':'Two normal quiz answers may append their ordinary aggregate records; no records/preferences cleared or reset'}
(OUT/'restoration.json').write_text(json.dumps(report,indent=2)+'\n')
