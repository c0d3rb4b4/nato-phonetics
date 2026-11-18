"""Continue the actual OS split pair entered via Recents > icon > Split screen > Settings."""
import importlib.util
from pathlib import Path
spec=importlib.util.spec_from_file_location('tiles',Path(__file__).with_name('tile-scenarios.py'));m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);globals().update({k:v for k,v in vars(m).items()if not k.startswith('_')})

def state(name):
    # UIAutomator exposes the focused split pane; focus the inert app title.
    adb('shell','input','tap','360','140');time.sleep(.3)
    tree=dump(name)
    field=find(tree,desc='Text to convert');assert field is not None and field.get('text')=='NUWJ359',ET.tostring(tree).decode()
    assert find(tree,text='Word Converter') is not None
    runtime((OUT/'inspect-text.js').read_text());time.sleep(.5)
    data=runtime('globalThis.__natoTextMeasurements')
    (OUT/(name+'-text-layout.json')).write_text(json.dumps(data,indent=2)+'\n')
    (OUT/(name+'-activities.txt')).write_text(adb('shell','dumpsys','activity','activities'))
    mark(name+'-state',input=field.get('text'),route='Word Converter',dimensions=data['dimensions'])
    return data['dimensions']

state('window-split-half')
adb('shell','input','swipe','360','720','360','300','350');time.sleep(.5)
geometry('window-split-half-tiles',1.75)
screenshot('window-split-half-tiles','Real half-height split-screen converter scrolled to complete tiles; Android Settings below','light')
adb('shell','input','swipe','360','800','360','1100','1000');time.sleep(2)
# Return within the top app to the input without changing the route.
adb('shell','input','swipe','360','300','360','850','350');time.sleep(.5)
dim=state('window-split-large')
geometry('window-split-large',1.75)
screenshot('window-split-large','Actual split divider moved to enlarge converter; input retained','light')
# Drag the real split divider to the display bottom, dismissing the Settings pane.
divider=round(dim['height']*dim['scale'])+9
adb('shell','input','swipe','360',str(divider),'360','1595','1000');time.sleep(2)
state('window-fullscreen-restored')
geometry('window-fullscreen-restored',1.75)
screenshot('window-fullscreen-restored','Converter restored to full screen after actual split resizing; input retained','light')
