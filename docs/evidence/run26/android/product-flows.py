"""Affected actual product flows. Reuses Run08 adb driver; no root/state replacement."""
from pathlib import Path
import importlib.util,json,subprocess,time,re,os

ROOT=Path(__file__).resolve().parents[4]
OUT=Path(__file__).with_name('product-widget');OUT.mkdir(exist_ok=True)
spec=importlib.util.spec_from_file_location('run08_driver',ROOT/'docs/evidence/run08/android/verify_native.py')
m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
m.OUT=OUT;m.SHOTS=ROOT/'docs/evidence/run26/screenshots/android/product-final';m.SHOTS.mkdir(exist_ok=True);m.ADB='/opt/homebrew/bin/adb';m.checks=[];m.captures=[]
def runtime(expression):
 return json.loads(subprocess.check_output(['/tmp/nato-phonetics-toolchain/node_modules/node/bin/node',str(ROOT/'docs/evidence/run07/android/read-runtime.cjs'),expression],text=True,timeout=15))
m.runtime=runtime
def by_id(tree,testid):
 return next((n for n in m.nodes(tree) if n.get('resource-id','').split('/')[-1]==testid),None)
def visible(desc=None,testid=None):
 for _ in range(20):
  tree=m.dump();node=by_id(tree,testid) if testid else m.find(tree,desc=desc)
  if node is not None:
   b=list(map(int,re.findall(r'-?\d+',node.get('bounds',''))))
   if len(b)==4 and b[2]>b[0] and b[3]>b[1] and b[1]>=55 and b[3]<=1540:return node
  m.adb('shell','input','swipe','360','1280','360','450','300');time.sleep(.2)
 raise AssertionError(f'Control not visible within20short swipes: {desc or testid}')
def click(desc=None,testid=None):
 node=visible(desc,testid);b=list(map(int,re.findall(r'-?\d+',node.get('bounds',''))));m.adb('shell','input','tap',str((b[0]+b[2])//2),str((b[1]+b[3])//2))
def quiz_state():
 return runtime("""(()=>{const h=globalThis.__REACT_DEVTOOLS_GLOBAL_HOOK__,seen=new Set(),r=[];function text(v){if(typeof v==='string'||typeof v==='number')return String(v);if(Array.isArray(v))return v.map(text).join('');return v?.props?text(v.props.children):'';}function visit(n){if(!n||seen.has(n))return;seen.add(n);const p=n.memoizedProps;if(n.tag===5&&(p?.testID==='quiz-letter'||p?.testID==='quiz-progress'||p?.testID==='quiz-feedback'||/^quiz-choice-/.test(p?.testID??'')))r.push({id:p.testID,text:text(p.children),selected:p.accessibilityState?.selected??false,disabled:p.accessibilityState?.disabled??false,label:p.accessibilityLabel??null});visit(n.child);visit(n.sibling)}for(const id of h.renderers.keys())for(const root of h.getFiberRoots(id))visit(root.current);return r;})()""")
def text_frames(name):
 runtime((ROOT/'docs/evidence/run07/android/inspect-text.js').read_text());time.sleep(.35)
 (OUT/(name+'-frames.json')).write_text(json.dumps(runtime('globalThis.__natoTextMeasurements'),indent=2)+'\n')

original=m.adb('shell','settings','get','system','font_scale').strip()
try:
 m.adb('shell','settings','put','system','font_scale','1')
 m.route('converter',cold=True);m.expect(desc='Text to convert',timeout=45)
 assert runtime('typeof globalThis.__fontProbe')=='undefined','Fixture entry remains active'
 m.set_text('NUWJ359');m.screenshot('converter-default','Populated real converter before live font change');text_frames('converter-default')
 pid=m.adb('shell','pidof',m.APP).strip()
 for scale in [2,1]:
  m.adb('shell','settings','put','system','font_scale',str(scale));time.sleep(1.5)
  assert m.expect(desc='Text to convert').get('text')=='NUWJ359'
  assert m.adb('shell','pidof',m.APP).strip()==pid
  m.mark('converter-input-and-process-retained-'+str(scale),value='NUWJ359',pid=pid)
  text_frames('converter-live-'+str(scale));m.screenshot('converter-live-'+str(scale),'Real converter after live scale '+str(scale))
 m.route('letter-quiz');click(desc='5 questions');click(testid='quiz-start');m.expect(contains='Question 1 of 5')
 click(testid='quiz-choice-0');m.expect(desc='Next question');before=quiz_state();assert any(row['selected'] for row in before),before
 (OUT/'quiz-state-before.json').write_text(json.dumps(before,indent=2)+'\n')
 visible(desc='Next question');m.screenshot('quiz-feedback-default','Submitted quiz before live font change')
 for scale in [2,1]:
  m.adb('shell','settings','put','system','font_scale',str(scale));time.sleep(1.5)
  actual=quiz_state();assert actual==before,(before,actual)
  assert m.adb('shell','pidof',m.APP).strip()==pid
  m.mark('submitted-quiz-retained-'+str(scale),state=actual,pid=pid)
  visible(desc='Next question');text_frames('quiz-live-'+str(scale));m.screenshot('quiz-feedback-live-'+str(scale),'Real submitted feedback/Next after live scale '+str(scale))
 m.route('alphabet');m.expect(desc='Play A, Alfa')
 for scale in [1,2,1]:
  m.adb('shell','settings','put','system','font_scale',str(scale));time.sleep(1.5)
  tree=m.dump();tiles=[]
  for n in m.nodes(tree):
   if re.fullmatch('alphabet-[A-Z]',n.get('resource-id','').split('/')[-1]):
    b=list(map(int,re.findall(r'-?\d+',n.get('bounds',''))))
    if len(b)==4 and abs((b[2]-b[0])-110*1.75*scale)<=2 and abs((b[3]-b[1])-150*1.75*scale)<=2:tiles.append(n.attrib)
  assert tiles,'No complete reference tile at scale '+str(scale)
  m.mark('reference-geometry-'+str(scale),tiles=tiles)
  m.screenshot('reference-live-'+str(scale),'Actual reference after live scale '+str(scale))
 m.mark('scope-complete',limits='Scoped actual converter/submitted quiz/reference; no full raster/window/composition/AT acceptance')
except Exception:
 m.screenshot('product-failure','Failed real product driver checkpoint; inspect retained hierarchy/log')
 raise
finally:
 m.adb('shell','settings','put','system','font_scale',original)
