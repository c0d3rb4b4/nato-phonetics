from pathlib import Path
import json,shutil,datetime
ROOT=Path(__file__).resolve().parents[4];OUT=ROOT/'docs/evidence/run18';shots=OUT/'screenshots/ios';rows=[]
for group in ['default','core','maximum']:
 folder=ROOT/f'artifacts/run18/export-{group}'
 if not (folder/'manifest.json').exists():continue
 manifest=json.loads((folder/'manifest.json').read_text())
 (OUT/f'ios/attachments-{group}.json').write_text(json.dumps(manifest,indent=2)+'\n')
 for test in manifest:
  for a in test['attachments']:
   filename=a['exportedFileName'];name=a['suggestedHumanReadableName'].split('_0_')[0]
   if not filename.endswith('.png'):continue
   if group=='default' and 'testFinalCoreLayouts' in test['testIdentifier']:
    if a['isAssociatedWithFailure']:
     target=OUT/'ios/diagnostics'/filename;target.parent.mkdir(exist_ok=True);shutil.copyfile(folder/filename,target)
    continue
   if '_0_' not in a['suggestedHumanReadableName']:continue
   file=name+'.png';shutil.copyfile(folder/filename,shots/file)
   rows.append({'file':file,'timestamp':datetime.datetime.fromtimestamp(a['timestamp'],datetime.timezone.utc).isoformat(),'test':test['testIdentifier'],'sourceResult':f'artifacts/run18/final-{group if group!="core" else "core-corrected"}.xcresult','exportedFileName':filename,'candidate':'Run18 direct unsigned iOS Release with Yoga precision backport; final original product JS','device':'iPhone17Pro','os':'iOS26.2','widthPoints':402,'heightPoints':874,'dpr':3,'theme':'light','textCategory':'accessibility-extra-extra-extra-large' if group=='maximum' else 'large','command':f'xcrun xcresulttool export attachments --path artifacts/run18/final-{group if group!="core" else "core-corrected"}.xcresult --output-path artifacts/run18/export-{group}'})
(shots/'metadata.json').write_text(json.dumps(rows,indent=2)+'\n');print([r['file'] for r in rows])
