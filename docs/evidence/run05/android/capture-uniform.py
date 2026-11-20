"""Recover the skipped U capture using bounded, slow bidirectional drags."""
import importlib.util
from pathlib import Path
spec=importlib.util.spec_from_file_location('tile_scenarios',Path(__file__).with_name('tile-scenarios.py'));module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module);globals().update({k:v for k,v in vars(module).items()if not k.startswith('_')})
for attempt in range(20):
    tree=dump();node=by_id(tree,'alphabet-U')
    if node is not None and abs(bounds(node)['height']-525)<2:break
    visible=[n for n in nodes(tree)if re.fullmatch('alphabet-[A-Z]',n.get('resource-id',''))]
    first=min(n.get('resource-id')[-1]for n in visible)
    direction=1 if first>'U' or(node is not None and bounds(node)['y']<250)else-1
    adb('shell','input','swipe','360','850','360',str(850+direction*250),'650');time.sleep(.5)
else:raise AssertionError('U not fully reachable with bounded drags')
geometry('alphabet-font-scale2-U',1.75,2);screenshot('alphabet-font-scale2-U','Actual2x Uniform long word/guide, reached with bounded bidirectional scroll','dark')
mark('native-font-scale2-long-labels-reachable',symbols=['N','U'],recovery='Bounded slowdrags avoid the earlier fling overshoot; original driver failure retained')
