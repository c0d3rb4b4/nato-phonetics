import importlib.util
from pathlib import Path
spec=importlib.util.spec_from_file_location('tile_scenarios',Path(__file__).with_name('tile-scenarios.py'));module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module);globals().update({k:v for k,v in vars(module).items()if not k.startswith('_')})
for index,scale in enumerate([1,2,1,2,1]):
    adb('shell','settings','put','system','font_scale',str(scale));time.sleep(3)
    route('alphabet');expect(desc='Play A, Alfa',timeout=45)
    name=f'alphabet-transition-{index}-scale{scale}'
    geometry(name,1.75,scale);screenshot(name,'Diagnostic actual system font scale transition '+str(scale))
    probe=runtime("(()=>{const m=[...__r.getModules().values()].find(m=>m.verboseName.endsWith('/NativeModules.js'));const t=m.publicModule.exports.default.TileTypography;return [36,16,11,50,22,16].map(v=>({targetDp:v*"+str(scale)+",freshSp:t.spForUniformDp(v*"+str(scale)+")}));})()")
    (OUT/(name+'-fresh-inverse.json')).write_text(json.dumps(probe,indent=2)+'\n');print('FRESH',name,json.dumps(probe),flush=True)
