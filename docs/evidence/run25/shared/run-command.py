import subprocess,datetime,pathlib,json,os,sys
root=pathlib.Path.cwd(); name=sys.argv[1]; cmd=sys.argv[2:]
env=os.environ.copy(); env['PATH']='/tmp/nato-phonetics-toolchain/node_modules/.bin:'+env['PATH']; env['NODE_PATH']='/tmp/nato-run19-browser/node_modules'; env['BROWSER_EXECUTABLE']='/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge'; env['CADDY_EXECUTABLE']='/tmp/nato-run20-caddy/caddy'
start=datetime.datetime.now(datetime.timezone.utc).isoformat()
log=pathlib.Path('docs/evidence/run25/shared')/(name+'.log')
with log.open('w') as f:
 p=subprocess.Popen(cmd,env=env,stdout=f,stderr=subprocess.STDOUT)
 code=p.wait()
record={'command':cmd,'cwd':str(root),'startedAt':start,'endedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'exitCode':code,'log':'shared/'+log.name,'environment':{k:env[k] for k in ['PATH','NODE_PATH','BROWSER_EXECUTABLE','CADDY_EXECUTABLE']}}
pth=pathlib.Path('docs/evidence/run25/shared/commands.json'); records=json.loads(pth.read_text()) if pth.exists() else [];records.append(record);pth.write_text(json.dumps(records,indent=2)+'\n')
print(json.dumps({'command':name,'exitCode':code,'log':str(log)}));print(log.read_text()[-2200:]);sys.exit(code)
