from pathlib import Path
import json,gzip,hashlib,shutil
ROOT=Path(__file__).resolve().parents[4];OUT=ROOT/'docs/evidence/run22/host'
OUT.mkdir(exist_ok=True)
records=[]
for source in sorted((ROOT/'artifacts/run22').glob('host-*')):
 if not source.is_dir() or not (source/'report.json').exists():continue
 target=OUT/source.name;target.mkdir(exist_ok=True)
 report=json.loads((source/'report.json').read_text())
 for name in ['report.json','source.json','source.patch','preflight.json']:
  if (source/name).exists():shutil.copyfile(source/name,target/name)
 logs=[]
 for log in sorted((source/'logs').glob('*.log')):
  raw=log.read_bytes();file=target/'logs'/(log.name+'.gz');file.parent.mkdir(exist_ok=True)
  file.write_bytes(gzip.compress(raw,mtime=0));logs.append({'reportLog':str(log.relative_to(source)),'durableLog':str(file.relative_to(target)),'uncompressedSha256':hashlib.sha256(raw).hexdigest(),'bytes':len(raw)})
 (target/'archived-logs.json').write_text(json.dumps(logs,indent=2)+'\n')
 records.append({'job':source.name,'status':report['status'],'sourceId':report.get('sourceId'),'exitCode':report.get('exitCode'),'error':report.get('error'),'artifacts':report['artifacts'],'logs':logs})
(OUT/'index.json').write_text(json.dumps(records,indent=2)+'\n')
print(json.dumps([{'job':r['job'],'status':r['status'],'error':r['error']} for r in records],indent=2))
