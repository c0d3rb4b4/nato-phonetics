"""Serialize actual selected local host verification; retains failed commands."""
from pathlib import Path
import os,time,subprocess,json,datetime
ROOT=Path(__file__).resolve().parents[4]
OUT=Path(__file__).resolve().parent
os.chdir(ROOT)
env=os.environ.copy();env['PATH']='/tmp/nato-phonetics-toolchain/node_modules/.bin:'+env['PATH'];env['JAVA_HOME']='/tmp/nato-run22-jdk/jdk-17.0.13+11/Contents/Home';env['ANDROID_HOME']=str(Path.home()/'Library/Android/sdk');env['DEVELOPER_DIR']='/Applications/Xcode.app/Contents/Developer'
records=[]
def run(name,mode,extra=None,override=None):
 cmd=['node','scripts/host-build.cjs',mode,'--output','artifacts/run22/'+name]+(extra or [])
 start=datetime.datetime.now(datetime.timezone.utc).isoformat()
 with (OUT/(name+'.log')).open('wb') as f:result=subprocess.run(cmd,env={**env,**(override or {})},stdout=f,stderr=subprocess.STDOUT)
 report=json.loads((ROOT/'artifacts/run22'/name/'report.json').read_text())
 records.append({'command':cmd,'startedAt':start,'endedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'exitCode':result.returncode,'report':str(Path('artifacts/run22')/name/'report.json'),'log':name+'.log','sourceId':report.get('sourceId')})
 (OUT/'host-commands.json').write_text(json.dumps(records,indent=2)+'\n')
 print(json.dumps({'mode':mode,'status':report['status'],'error':report.get('error'),'artifacts':report['artifacts']}),flush=True)
 return report
# Existing build was already started by the parent. Wait for its report completion.
file=ROOT/'artifacts/run22/host-ios-simulator/report.json'
while json.loads(file.read_text()).get('status')=='running':time.sleep(1)
first=json.loads(file.read_text());print('first ios outcome: '+first['status']+' '+first.get('error',''),flush=True)
if first['status']=='failed' and 'source changed' in first.get('error',''):
 assert run('host-ios-final','ios-simulator')['status']=='passed'
elif first['status']!='passed':raise RuntimeError(first)
assert run('host-android-debug-final','android-debug')['status']=='passed'
assert run('host-android-release','android-release')['status']=='passed'
checks=run('host-checks','checks')
assert checks['status']=='failed' and [s['name'] for s in checks['steps'] if s['exitCode']!=0]==['audit-review'],checks
failure=run('host-controlled-failure','ios-export',override={'NATO_EXPORT_OPTIONS_PLIST':'/tmp/nato-run22-intentionally-missing-export.plist'})
assert failure['status']=='failed' and not failure['artifacts'] and len(failure['steps'])==1,failure
print('All selected local host command outcomes recorded; audit remains failed.',flush=True)
