from pathlib import Path
import json,shutil,hashlib,datetime
out=Path('docs/evidence/run10');rows=[]
for group,category,source in [('long','large','long-paste-final.log'),('maximum','accessibility-extra-extra-extra-large','short-maximum-retry.log'),('replay','large','replay-observed.log'),('feature','large','features.log'),('pages-final','large','pages-storage-final.log')]:
 folder=Path('/tmp/nato-ios-run10-capture')/(group+'-export')
 manifest=json.loads((folder/'manifest.json').read_text())
 for test in manifest:
  for a in test['attachments']:
   raw=folder/a['exportedFileName'];name=a.get('suggestedHumanReadableName','')
   if raw.suffix!='.png' or '_0_' not in name:continue
   name=name.split('_0_')[0]+'.png'
   dest=out/'screenshots/ios'/name;shutil.copyfile(raw,dest)
   rows.append({'file':name,'theme':'dark','platform':'ios','contentSizeCategory':category,'state':name[:-4],'sourceLog':source,'test':test.get('testName',test.get('testIdentifier')),'timestamp':datetime.datetime.fromtimestamp(a['timestamp'],datetime.timezone.utc).isoformat(),'command':'XCTest XCUIScreen.main.screenshot(); xcrun xcresulttool export attachments --path /tmp/nato-ios-run10-capture/'+{'long':'long-paste-final','maximum':'short-maximum-retry','replay':'replay-observed','feature':'features','pages-final':'pages-storage-final'}[group]+'.xcresult --output-path '+str(folder)+'; original PNG copied byte-for-byte','sha256':hashlib.sha256(dest.read_bytes()).hexdigest(),'note':'Captured checkpoint in failed combined test; no whole-command pass' if group=='feature' else 'Passed scoped XCTest; no physical/listening/Release claim'})
(out/'screenshots/ios/metadata.json').write_text(json.dumps(rows,indent=2)+'\n')
print(len(rows),'actual original PNG attachments copied')
