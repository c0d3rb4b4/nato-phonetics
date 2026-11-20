"""Export actual retained XCTest images, preserving their original capture metadata."""
import datetime, hashlib, json, shutil, struct, sys
from pathlib import Path
out=Path(__file__).resolve().parent.parent/'screenshots'/'ios'
out.mkdir(parents=True,exist_ok=True)
rows=json.loads((out/'metadata.json').read_text()).get('captures',[]) if (out/'metadata.json').exists() else []
for argument in sys.argv[1:]:
    source=Path(argument)
    for test in json.loads((source/'manifest.json').read_text()):
        for attachment in test['attachments']:
            name=attachment.get('suggestedHumanReadableName','').split('_0_')[0]
            if not name.startswith(('alphabet-','converter-','quiz-')): continue
            original=source/attachment['exportedFileName']
            if original.suffix.lower()!='.png':continue
            data=original.read_bytes()
            width,height=struct.unpack('>II',data[16:24])
            # Different devices/scales retain separate names through attachment dir label.
            target=out/(source.name+'-'+name+'.png')
            shutil.copyfile(original,target)
            rows[:]=[r for r in rows if r['file']!=target.name]
            rows.append({'file':target.name,'pixels':{'width':width,'height':height},'sha256':hashlib.sha256(data).hexdigest(),
                'capturedAt':datetime.datetime.fromtimestamp(attachment['timestamp'],datetime.timezone.utc).isoformat(),
                'testIdentifier':test['testIdentifier'],'originalAttachment':attachment,
                'captureMethod':'XCUIScreen.main.screenshot(), retained XCTest PNG exported with xcresulttool'})
(out/'metadata.json').write_text(json.dumps({'date':'2026-11-17','platform':'ios','captures':rows},indent=2)+'\n')
print('Exported',len(rows),'actual screenshots; require visual inspection.')
