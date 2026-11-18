"""Capture the actual large split pane after dismissing the on-screen keyboard, then restore."""
import importlib.util
from pathlib import Path
spec=importlib.util.spec_from_file_location('tiles',Path(__file__).with_name('tile-scenarios.py'));m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);globals().update({k:v for k,v in vars(m).items()if not k.startswith('_')})

def observe(name,expected_mode):
    adb('shell','input','tap','360','140');time.sleep(.3)
    tree=dump(name);field=find(tree,desc='Text to convert')
    assert field is not None and field.get('text')=='NUWJ359'
    assert find(tree,text='Word Converter') is not None
    activities=adb('shell','dumpsys','activity','activities');(OUT/(name+'-activities.txt')).write_text(activities)
    config=activities.split('packageName=com.natophonetics.app',1)[1].split('CurrentConfiguration=',1)[1].splitlines()[0]
    assert 'mWindowingMode='+expected_mode in config,config
    runtime((OUT/'inspect-text.js').read_text());time.sleep(.5)
    data=runtime('globalThis.__natoTextMeasurements');(OUT/(name+'-text-layout.json')).write_text(json.dumps(data,indent=2)+'\n')
    mark(name+'-state',input=field.get('text'),route='Word Converter',dimensions=data['dimensions'],nativeConfiguration=config)
    geometry(name,1.75)
    screenshot(name,'Actual OS '+expected_mode+' converter; native bounds, input and tile geometry recorded','light')
    return data['dimensions']

dim=observe('window-split-large','multi-window')
assert dim['height']>500,dim
adb('shell','input','swipe','360',str(round(dim['height']*dim['scale'])+9),'360','1595','1200');time.sleep(2)
observe('window-fullscreen-restored','fullscreen')
