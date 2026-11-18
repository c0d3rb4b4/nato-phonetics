"""Retain original XCTest PNGs and link actual native frame observations."""
from pathlib import Path
import datetime,hashlib,json,re,shutil,struct,sys
out=Path(__file__).resolve().parent.parent/'screenshots'/'ios';out.mkdir(parents=True,exist_ok=True)
artifact=json.loads((Path(__file__).resolve().parent/'artifact.json').read_text())
meta=json.loads((out/'metadata.json').read_text()) if (out/'metadata.json').exists() else {'date':'2026-11-17','platform':'ios','captures':[]}
source=Path(sys.argv[1]);prefix=sys.argv[2];log=Path(sys.argv[3]).read_text();device=sys.argv[4];density=float(sys.argv[5]);category=sys.argv[6]
frames={m.group(1):json.loads(m.group(2)) for m in re.finditer(r'^CAPTUREFRAMES (\S+) (.+)$',log,re.M)}
for test in json.loads((source/'manifest.json').read_text()):
 for a in test['attachments']:
  name=a.get('suggestedHumanReadableName','').split('_0_')[0]
  if name not in frames:continue
  p=source/a['exportedFileName']
  if p.suffix.lower()!='.png':continue
  raw=p.read_bytes();w,h=struct.unpack('>II',raw[16:24]);target=out/(prefix+'-'+name+'.png');shutil.copyfile(p,target)
  meta['captures']=[r for r in meta['captures'] if r['file']!=target.name]
  meta['captures'].append({'file':target.name,'sha256':hashlib.sha256(raw).hexdigest(),'capturedAt':datetime.datetime.fromtimestamp(a['timestamp'],datetime.timezone.utc).isoformat(),'pixels':{'width':w,'height':h},'device':device,'os':'iOS/iPadOS26.2','density':density,'contentSizeCategory':category,'theme':'dark' if 'dark' in name else 'light/system','state':name,'actualFrames':frames[name],'candidate':artifact,'captureMethod':'XCUIScreen.main.screenshot() retained XCTest attachment; xcresulttool export attachments; original PNG bytes unchanged','testIdentifier':test['testIdentifier'],'originalAttachment':a,'inspection':'pending'})
(out/'metadata.json').write_text(json.dumps(meta,indent=2)+'\n');print('Retained',len(meta['captures']),'captures')
