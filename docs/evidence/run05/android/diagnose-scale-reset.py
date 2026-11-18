import importlib.util
from pathlib import Path
spec=importlib.util.spec_from_file_location('tile_scenarios',Path(__file__).with_name('tile-scenarios.py'));module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module);globals().update({k:v for k,v in vars(module).items()if not k.startswith('_')})
adb('shell','settings','put','system','font_scale','1.0');time.sleep(3)
route('alphabet');expect(desc='Play A, Alfa',timeout=45);geometry('alphabet-scale-reset-live1',1.75);screenshot('alphabet-scale-reset-live1','Diagnostic: live2to1 glyph size/clipping mismatch')
route('alphabet',cold=True);expect(desc='Play A, Alfa',timeout=45);geometry('alphabet-scale-reset-cold1',1.75);screenshot('alphabet-scale-reset-cold1','Diagnostic: cold launch at1x after live2to1 mismatch')
