from pathlib import Path
import subprocess,json,shutil,hashlib,datetime
OUT=Path(__file__).resolve().parent
TMP=Path('/tmp/nato-ios-run13-capture')
SHOTS=OUT.parent/'screenshots/ios'
SHOTS.mkdir(parents=True,exist_ok=True)
rows=[]
for stem,category,names,qualification in [
 ('serial','large',{'empty-progress','empty-due-review','saved-summary-relaunched','saved-symbols'},'Qualified checkpoints within a subsequently failed whole command; five actual LETTER symbols, not assumed digits'),
 ('due-letters','large',{'due-review-setup','due-review-question','recovered-summary','clear-confirmation'},'Scoped due-letter/recovery/cancel command passes'),
 ('selection','large',{'digit-set-count','letter-set-count'},'Separate rendered 10/26 set-count command passes'),
 ('maximum-edges','accessibility-extra-extra-extra-large',{'maximum-summary','maximum-symbol-top','maximum-symbol-bottom','maximum-clear-confirmation'},'Qualified checkpoints in failed command; text edges and deletion pass, later 30-swipe return-to-summary bound fails'),
 ('deleted-relaunch','accessibility-extra-extra-extra-large',{'maximum-cleared-summary'},'Separate maximum-text deleted-state relaunch command; see deleted-relaunch.log'),
 ('policy-corrected','large',{'privacy-local-progress','privacy-progress-deletion','help-local-progress'},'See policy-corrected.log for changed in-app policy/help assertions'),
]:
 dest=TMP/(stem+'-export')
 if not (dest/'manifest.json').exists():subprocess.run(['xcrun','xcresulttool','export','attachments','--path',str(TMP/(stem+'.xcresult')),'--output-path',str(dest)],check=True)
 manifest=json.loads((dest/'manifest.json').read_text());(OUT/(stem+'-attachments.json')).write_text(json.dumps(manifest,indent=2)+'\n')
 for group in manifest:
  for a in group['attachments']:
   name=a['suggestedHumanReadableName'].split('_0_')[0]
   if name not in names or not a['exportedFileName'].endswith('.png'):continue
   file=SHOTS/(name+'.png');shutil.copyfile(dest/a['exportedFileName'],file);raw=file.read_bytes()
   rows.append({'file':file.name,'state':name,'width':int.from_bytes(raw[16:20],'big'),'height':int.from_bytes(raw[20:24],'big'),'theme':'dark','contentSizeCategory':category,'device':a['deviceName'],'os':'iOS 26.2','dpr':3,'capturedAt':datetime.datetime.fromtimestamp(a['timestamp'],datetime.timezone.utc).isoformat(),'sha256':hashlib.sha256(raw).hexdigest(),'sourceLog':stem+'.log','loadedGraph':'loaded-javascript.json','command':'XCUIScreen.main.screenshot(); xcrun xcresulttool export attachments','qualification':qualification})
(SHOTS/'metadata.json').write_text(json.dumps(rows,indent=2)+'\n');print('Copied',len(rows),'original captures')
