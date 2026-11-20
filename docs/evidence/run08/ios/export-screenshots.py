from pathlib import Path
import json,hashlib,shutil,datetime,struct
ROOT=Path(__file__).resolve().parents[4];OUT=Path(__file__).resolve().parent;SHOTS=OUT.parent/'screenshots'/'ios'
rows=[]
for name,category in [('sessions','large'),('large','accessibility-extra-extra-extra-large')]:
 source=Path('/tmp/nato-ios-run08-capture')/(name+'-export')
 for case in json.loads((source/'manifest.json').read_text()):
  for a in case['attachments']:
   filename=a['suggestedHumanReadableName'].split('_0_')[0]+'.png'
   if not a['exportedFileName'].endswith('.png'):continue
   src=source/a['exportedFileName'];raw=src.read_bytes();shutil.copyfile(src,SHOTS/filename)
   w,h=struct.unpack('>II',raw[16:24])
   rows.append({'file':filename,'state':filename[:-4],'theme':'dark','contentSizeCategory':category,'device':'iPhone 17 Pro','os':'iOS26.2','width':w,'height':h,'density':3,'capturedAt':datetime.datetime.fromtimestamp(a['timestamp'],datetime.timezone.utc).isoformat(),'sha256':hashlib.sha256(raw).hexdigest(),'captureMethod':'XCUIScreen.main.screenshot() original XCTest PNG attachment; xcresulttool export attachments','command':f'xcodebuild test(-without-building) -only-testing:CaptureUITests/CaptureUITests/{case["testIdentifier"]}; see {name}-test.log','candidate':'../../ios/artifact.json','loadedJavaScript':'../../ios/loaded-javascript.json','testIdentifier':case['testIdentifier'],'originalAttachment':a})
(SHOTS/'metadata.json').write_text(json.dumps(rows,indent=2)+'\n')
print('Retained',len(rows),'original PNG captures')
