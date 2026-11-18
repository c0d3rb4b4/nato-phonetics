import importlib.util
from pathlib import Path
spec=importlib.util.spec_from_file_location('tile_scenarios', Path(__file__).with_name('tile-scenarios.py'))
module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
globals().update({k:v for k,v in vars(module).items() if not k.startswith('_')})

def layout_capture(name, density, scale=1, theme='light',cold=True):
    route('alphabet',cold=cold);expect(desc='Play A, Alfa',timeout=45)
    for attempt in range(4):
        try:
            geometry(name,density,scale);break
        except AssertionError:
            if attempt==3:raise
            scroll_up()
    screenshot(name, 'Actual native viewport/configuration: '+name,theme)
    runtime(Path(OUT/'inspect-tiles.js').read_text());time.sleep(.3)
    (OUT/(name+'-native-layout.json')).write_text(json.dumps(runtime('globalThis.__natoTileMeasurements'),indent=2)+'\n')

try:
    adb('shell','settings','put','system','font_scale','1.0');time.sleep(2)
    route('settings');expect(desc='Light',timeout=45);tap(desc='Light')
    adb('shell','wm','size','640x1136');adb('shell','wm','density','320');time.sleep(2)
    layout_capture('alphabet-narrow-320x568',2)
    adb('shell','settings','put','system','accelerometer_rotation','0')
    adb('shell','settings','put','system','user_rotation','1');time.sleep(2)
    layout_capture('alphabet-landscape-568x320',2,cold=False)
    adb('shell','settings','put','system','user_rotation','0');time.sleep(2)
    adb('shell','wm','size','1600x2560');adb('shell','wm','density','240');time.sleep(2)
    layout_capture('alphabet-tablet-1067x1707',1.5)
    mark('viewport-matrix-complete')
finally:
    adb('shell','settings','put','system','font_scale','1.0')
    adb('shell','settings','put','system','user_rotation','0')
    adb('shell','settings','put','system','accelerometer_rotation','1')
    adb('shell','wm','size','720x1600');adb('shell','wm','density','280')
