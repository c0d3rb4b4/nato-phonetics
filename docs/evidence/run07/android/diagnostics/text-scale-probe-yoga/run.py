"""Real RN0.81.5 diagnostic controls; modifies only a debug renderer surface."""
import sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[2]))
import verify_native as v
import json,time

OUT=Path(__file__).resolve().parent
v.SHOTS=OUT/'screenshots'
v.captures=[]

def start(scale):
    v.adb('shell','settings','put','system','font_scale',str(scale));time.sleep(2)
    v.route('alphabet',cold=True);v.expect(desc='Play A, Alfa',timeout=60)
    v.runtime((OUT/'mount-probe.js').read_text());time.sleep(1)

def observe(name):
    v.runtime((v.OUT/'inspect-text.js').read_text());time.sleep(.5)
    result={'probe':v.runtime('__fontProbe'),'layout':v.runtime('__natoTextMeasurements')}
    (OUT/(name+'.json')).write_text(json.dumps(result,indent=2)+'\n')
    v.screenshot(name,'DIAGNOSTIC RN control/candidate paragraphs and inputs, not application UI')
    print(json.dumps({'name':name,'dimensions':result['probe']['dimensions'],'mounts':result['probe']['mounts'],
        'frames':[{k:r.get(k) for k in ['text','testID','frame']} for r in result['layout']['values']]}),flush=True)

start(1)
for index,scale in enumerate([1,2]):
    v.adb('shell','settings','put','system','font_scale',str(scale));time.sleep(2)
    observe(f'live-{index}-scale{scale}')
for scale in [1,2]:
    start(scale);observe(f'cold-scale{scale}')
v.adb('shell','settings','put','system','font_scale','1');time.sleep(1)
v.route('alphabet',cold=True)
