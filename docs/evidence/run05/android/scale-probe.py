import importlib.util
from pathlib import Path
spec=importlib.util.spec_from_file_location('tile_scenarios',Path(__file__).with_name('tile-scenarios.py'))
module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
globals().update({k:v for k,v in vars(module).items()if not k.startswith('_')})
adb('shell','settings','put','system','font_scale','2.0');time.sleep(3)
route('alphabet');expect(desc='Play A, Alfa',timeout=45)
geometry('alphabet-font-scale2',1.75,2)
screenshot('alphabet-font-scale2','Actual systemfontscale2; whole220x300 tile and compensated glyphmetrics','dark')
for symbol in ['N','U']:
    for _ in range(60):
        tree=dump();node=by_id(tree, 'alphabet-'+symbol)
        if node is not None and abs(bounds(node)['height']-525)<2:break
        visible=[n for n in nodes(tree)if re.fullmatch('alphabet-[A-Z]',n.get('resource-id',''))]
        first=min(n.get('resource-id')[-1]for n in visible)if visible else 'A'
        direction=1 if first>symbol or(node is not None and bounds(node)['y']<250)else-1
        distance=250 if node is not None else 500
        adb('shell','input','swipe','360','850','360',str(850+direction*distance),'650');time.sleep(.5)
    else:raise AssertionError('Full enlarged tile unreachable: '+symbol)
    name='alphabet-font-scale2-'+symbol
    geometry(name,1.75,2)
    screenshot(name,'Long word/guide at actual2x accessibilityscale: '+symbol,'dark')
mark('native-font-scale2-long-labels-reachable')
