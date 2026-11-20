from pathlib import Path
import os,subprocess,json,datetime
root=Path(__file__).resolve().parents[4]
out=root/'docs/evidence/run16/shared'
env=dict(os.environ,PATH='/tmp/nato-phonetics-toolchain/node_modules/.bin:'+os.environ['PATH'],NODE_PATH='/Users/mac/.npm/_npx/e5f4bcd55d2c7c9f/node_modules',BROWSER_EXECUTABLE='/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge')
rows=[]
for name,args in [
 ('runtime',['node','--version']),('npm',['npm','--version']),('tests',['npm','test']),('types',['npm','run','typecheck']),('lint',['npm','run','lint']),('dependencies',['npm','run','check:dependencies']),('build',['npm','run','export:web']),
 ('app-browser',['node','scripts/verify-app-browser.cjs','dist']),
 ('progress-concurrency',['node','scripts/verify-progress-concurrency-browser.cjs','dist','docs/evidence/run16/concurrency']),
 ('offline',['node','scripts/verify-offline-browser.cjs','dist','docs/evidence/run16']),
]:
 start=datetime.datetime.now(datetime.timezone.utc).isoformat()
 with (out/(name+'.log')).open('w') as log:r=subprocess.run(args,cwd=root,env=env,stdout=log,stderr=subprocess.STDOUT)
 rows.append({'command':args,'exitCode':r.returncode,'startedAt':start,'endedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'log':name+'.log'})
 (out/'commands.json').write_text(json.dumps({'environment':{k:env[k] for k in ['PATH','NODE_PATH','BROWSER_EXECUTABLE']},'commands':rows},indent=2)+'\n')
 print(name,r.returncode,flush=True)
 if r.returncode:raise SystemExit(r.returncode)
