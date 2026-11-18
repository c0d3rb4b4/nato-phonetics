#!/usr/bin/env python3
"""Record a real command, its output, timing and status under Run21 evidence."""
import datetime,json,os,pathlib,subprocess,sys,fcntl
ROOT=pathlib.Path(__file__).resolve().parents[4]
OUT=ROOT/'docs/evidence/run21'
name=sys.argv[1];args=sys.argv[2:]
env=os.environ.copy()
env.update(PATH='/tmp/nato-phonetics-toolchain/node_modules/node/bin:/tmp/nato-phonetics-toolchain/node_modules/.bin:'+env['PATH'],NODE_PATH='/tmp/nato-run19-browser/node_modules:/Users/mac/.npm/_npx/e5f4bcd55d2c7c9f/node_modules',BROWSER_EXECUTABLE='/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',DEVELOPER_DIR='/Applications/Xcode.app/Contents/Developer',JAVA_HOME='/Users/mac/dev/AnypointStudio 2.app/Contents/Eclipse/plugins/org.mule.tooling.jdk.macosx.aarch64_1.3.4/Contents/Home',ANDROID_HOME='/Users/mac/Library/Android/sdk',ADB='/Users/mac/Library/Android/sdk/platform-tools/adb',ANDROID_SERIAL='emulator-5580',CADDY_EXECUTABLE='/tmp/nato-run20-caddy/caddy',CI='1')
log=OUT/name;log.parent.mkdir(parents=True,exist_ok=True)
start=datetime.datetime.now(datetime.timezone.utc).isoformat()
with log.open('wb') as f:
 try:
  result=subprocess.run(args,cwd=ROOT,env=env,stdout=f,stderr=subprocess.STDOUT)
  result_code=result.returncode
 except KeyboardInterrupt:
  result_code=130
row={'command':args,'cwd':str(ROOT),'startedAt':start,'endedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'exitCode':result_code,'log':name,'toolchain':{'node':'22.23.0','npm':'10.9.4'}}
# Independent commands may finish together; serialize their evidence updates.
record=OUT/'shared/commands.json'
lock=ROOT/'artifacts/run21/commands.lock';lock.parent.mkdir(parents=True,exist_ok=True)
with lock.open('w') as handle:
 fcntl.flock(handle,fcntl.LOCK_EX)
 rows=json.loads(record.read_text()) if record.exists() else []
 rows.append(row);record.write_text(json.dumps(rows,indent=2)+'\n')
print(json.dumps(row));print('\n'.join(log.read_text(errors='replace').splitlines()[-10:]),flush=True)
sys.exit(result_code)
