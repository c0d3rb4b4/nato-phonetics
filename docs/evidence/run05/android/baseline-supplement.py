"""Observe actual onTextLayout state and transformed Fabric frames at1x and2x."""
import importlib.util
from pathlib import Path
spec=importlib.util.spec_from_file_location('tile_scenarios',Path(__file__).with_name('tile-scenarios.py'))
module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
globals().update({k:v for k,v in vars(module).items()if not k.startswith('_')})
try:
    for scale in [1,2]:
        adb('shell','settings','put','system','font_scale',str(scale));time.sleep(2)
        route('alphabet');expect(desc='Play A, Alfa',timeout=45)
        name='alphabet-baseline-scale'+str(scale)
        geometry(name,1.75,scale)
        screenshot(name,'Native onTextLayout event baselines plus transformed Text frame measurements; actual font scale'+str(scale))
    mark('native-baseline-supplement-complete')
finally:
    adb('shell','settings','put','system','font_scale','1.0')
