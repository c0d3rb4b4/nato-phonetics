"""Retained ordinary-text frames, screenshots and real text-size transitions."""
from verify_native import *
import importlib.util
spec=importlib.util.spec_from_file_location('tiles',OUT/'tile-scenarios.py');tiles=importlib.util.module_from_spec(spec);spec.loader.exec_module(tiles)

def observe(name, theme='light'):
    runtime((OUT/'inspect-text.js').read_text());time.sleep(.4)
    data=runtime('globalThis.__natoTextMeasurements')
    (OUT/(name+'-text-layout.json')).write_text(json.dumps(data,indent=2)+'\n')
    scale=data['dimensions']['fontScale']
    inverse=runtime("(()=>{const m=[...__r.getModules().values()].find(m=>m.verboseName.endsWith('/NativeModules.js'));return [36,16,11].map(v=>({targetDp:v*"+str(scale)+",sp:m.publicModule.exports.default.TileTypography.spForUniformDp(v*"+str(scale)+")}));})()")
    (OUT/(name+'-inverse.json')).write_text(json.dumps(inverse,indent=2)+'\n')
    if name.startswith('ordinary-transition'):
        tiles.geometry(name,data['dimensions']['scale'],data['dimensions']['fontScale'])
    screenshot(name,'Actual ordinary text after native font-scale transition; also native tile sample',theme)
    return data

def main():
    adb('shell','settings','put','system','font_scale','1');time.sleep(2)
    route('alphabet',cold=True);expect(desc='Play A, Alfa',timeout=60)
    route('settings');tap(desc='Light');route('alphabet');expect(desc='Play A, Alfa')
    for i,scale in enumerate([1,2,1,2,1]):
        adb('shell','settings','put','system','font_scale',str(scale));time.sleep(3)
        # No navigation or remount command between observations.
        observe(f'ordinary-transition-{i}-scale{scale}')
    route('converter');set_text('NUWJ359')
    for scale in [2,1]:
        adb('shell','settings','put','system','font_scale',str(scale));time.sleep(3)
        tree=dump(f'converter-retained-scale{scale}')
        field=find(tree,desc='Text to convert')
        assert field is not None and field.get('text')=='NUWJ359',ET.tostring(tree).decode()
        mark(f'converter-input-retained-scale{scale}',text=field.get('text'))
        observe(f'converter-retained-scale{scale}')

if __name__=='__main__':main()
