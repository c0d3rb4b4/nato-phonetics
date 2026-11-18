from pathlib import Path
import subprocess,json,shutil,hashlib,datetime
OUT=Path(__file__).resolve().parent
TMP=Path('/tmp/nato-ios-run12-capture')
SHOTS=OUT.parent/'screenshots/ios'
rows=[]
for stem,log,category,graph,prefix in [
 ('default-corrected','default-corrected.log','large','practice-loaded-javascript.json','listening-'),
 ('typed','typed.log','large','practice-loaded-javascript.json','typed-'),
 ('maximum','maximum.log','accessibility-extra-extra-extra-large','loaded-javascript.json',''),
]:
 dest=TMP/(stem+'-export')
 if not (dest/'manifest.json').exists():subprocess.run(['xcrun','xcresulttool','export','attachments','--path',str(TMP/(stem+'.xcresult')),'--output-path',str(dest)],check=True)
 manifest=json.loads((dest/'manifest.json').read_text());(OUT/(stem+'-attachments.json')).write_text(json.dumps(manifest,indent=2)+'\n')
 for group in manifest:
  for a in group['attachments']:
   name=a['suggestedHumanReadableName'].split('_0_')[0]
   if not a['exportedFileName'].endswith('.png'):continue
   if stem=='default-corrected' and name=='typed-keyboard':
    shutil.copyfile(dest/a['exportedFileName'],OUT/'bulk-first-keyboard.png')
   if prefix and not name.startswith(prefix):continue
   file=SHOTS/(name+'.png');shutil.copyfile(dest/a['exportedFileName'],file);raw=file.read_bytes()
   rows.append({'file':file.name,'state':name,'width':int.from_bytes(raw[16:20],'big'),'height':int.from_bytes(raw[20:24],'big'),'theme':'dark','contentSizeCategory':category,'device':a['deviceName'],'os':'iOS 26.2','dpr':3,'capturedAt':datetime.datetime.fromtimestamp(a['timestamp'],datetime.timezone.utc).isoformat(),'sha256':hashlib.sha256(raw).hexdigest(),'sourceLog':log,'loadedGraph':graph,'command':'XCUIScreen.main.screenshot(); xcrun xcresulttool export attachments','qualification':'Listening checkpoints pass inside command that subsequently fails bulk typed assertion' if stem=='default-corrected' else 'See complete source command log'})
(SHOTS/'metadata.json').write_text(json.dumps(rows,indent=2)+'\n');print('Copied',len(rows),'original captures')
