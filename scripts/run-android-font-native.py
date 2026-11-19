"""Execute the compiled real-RN regression with explicitly identified APK libs.

Usage: python3 scripts/run-android-font-native.py BINARY LIBS OUTPUT SERIAL
Both native exit status and remote library hashes are acceptance conditions.
"""
from pathlib import Path
import hashlib,json,subprocess,sys
binary,libs,out=map(Path,sys.argv[1:4]);serial=sys.argv[4]
out.mkdir(parents=True,exist_ok=True)
remote='/data/local/tmp/nato-font-regression'
adb=['adb','-s',serial]
def call(*args):return subprocess.check_output(adb+list(args),text=True,timeout=30)
call('shell','mkdir','-p',remote+'/libs')
call('push',str(binary),remote+'/font-environment')
hashes={}
for file in libs.glob('*.so'):
    call('push',str(file),remote+'/libs/'+file.name)
    expected=hashlib.sha256(file.read_bytes()).hexdigest()
    actual=call('shell','sha256sum',remote+'/libs/'+file.name).split()[0]
    if actual!=expected:raise RuntimeError('Runtime library drift: '+file.name)
    hashes[file.name]=actual
call('shell','chmod','755',remote+'/font-environment')
result=subprocess.run(adb+['shell',f'cd {remote} && LD_LIBRARY_PATH=libs ./font-environment'],capture_output=True,text=True,timeout=20)
report={'serial':serial,'binarySha256':hashlib.sha256(binary.read_bytes()).hexdigest(),'librarySha256':hashes,'exitCode':result.returncode,'stdout':result.stdout,'stderr':result.stderr}
(out/'native-result.json').write_text(json.dumps(report,indent=2)+'\n')
print(result.stdout+result.stderr,end='')
sys.exit(result.returncode)
