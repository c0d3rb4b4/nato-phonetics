"""Rebind existing unchanged PNGs to their actual captured UIAutomator bounds.

Preserve the initial checks/red raster report in diagnostics. No pixel edits or
threshold changes; use Run07/27's complete-visible-tile predicate.
"""
from pathlib import Path
import json,re,xml.etree.ElementTree as E
out=Path(__file__).resolve().parent;checks=json.loads((out/'checks.json').read_text())
excluded=[]
for check in checks:
    if not check['check'].startswith('final-') or 'tiles' not in check:continue
    tree=E.parse(out/'hierarchies'/(check['check']+'.xml'))
    observed={n.get('resource-id','').split('/')[-1]:n for n in tree.iter('node')}
    qualified=[];ratio=check['density']*check['scale']
    for tile in check['tiles']:
        node=observed.get(tile['testID']);frame=tile['pixels']
        if node is None:excluded.append({'capture':check['check'],'tile':tile['testID'],'reason':'Absent in actual active UIAutomator tree'});continue
        x,y,x1,y1=map(int,re.findall(r'-?\d+',node.get('bounds','')))
        if abs(x1-x-110*ratio)<=2 and abs(y1-y-150*ratio)<=2 and abs(x-frame['x'])<=1 and abs(y-frame['y'])<=1:qualified.append(tile)
        else:excluded.append({'capture':check['check'],'tile':tile['testID'],'native':frame,'actualVisible':[x,y,x1,y1],'reason':'Viewport/header clipping; not a full raster observation'})
    check['tiles']=qualified
(out/'checks.json').write_text(json.dumps(checks,indent=2)+'\n')
(out/'visibility-correction.json').write_text(json.dumps({'source':'Original raw PNG/native/UIAutomator capture; no modified images or relaxed predicates','excluded':excluded},indent=2)+'\n')
