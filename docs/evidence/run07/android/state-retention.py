"""Actual quiz answer retention and native tile samples after live text settings."""
import importlib.util
from pathlib import Path
spec=importlib.util.spec_from_file_location('tiles',Path(__file__).with_name('tile-scenarios.py'));m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);globals().update({k:v for k,v in vars(m).items()if not k.startswith('_')})

def quiz_state():
    return runtime("""(()=>{const h=globalThis.__REACT_DEVTOOLS_GLOBAL_HOOK__,seen=new Set(),r=[];function visit(n){if(!n||seen.has(n))return;seen.add(n);const p=n.memoizedProps;if(n.tag===5&&(p?.testID==='quiz-letter'||/^quiz-choice-/.test(p?.testID??'')))r.push({id:p.testID,text:p.children,selected:p.accessibilityState?.selected,disabled:p.accessibilityState?.disabled,label:p.accessibilityLabel});visit(n.child);visit(n.sibling)}for(const id of h.renderers.keys())for(const rootNode of h.getFiberRoots(id))visit(rootNode.current);return r.map(x=>({...x,text:typeof x.text==='string'?x.text:undefined}));})()""")

route('letter-quiz');expect(contains='Choose ')
tree=dump();choice=next(n for n in nodes(tree)if n.get('resource-id')=='quiz-choice-0');tap(desc=choice.get('content-desc'));expect(desc='Next question');time.sleep(2)
state=quiz_state();assert any(r.get('selected') for r in state),state
(OUT/'quiz-state-before.json').write_text(json.dumps(state,indent=2)+'\n')
for scale in [2,1]:
    adb('shell','settings','put','system','font_scale',str(scale));time.sleep(3)
    actual=quiz_state();assert actual==state,(state,actual)
    mark('quiz-answer-retained-scale'+str(scale),actual=actual)
    geometry('quiz-retained-scale'+str(scale),1.75,scale);screenshot('quiz-retained-scale'+str(scale),'Quiz answer retained across live system text change')
    # Reveal lower feedback at large text by ordinary scrolling, then restore top.
    if scale==2:
        for _ in range(5):
            if find(dump(),desc='Next question') is not None:break
            scroll_up()
        expect(desc='Next question');screenshot('quiz-feedback-controls-scale2','Retained quiz feedback and controls reached by scrolling')
        adb('shell','input','swipe','360','350','360','1450','300');time.sleep(.4)
route('alphabet');expect(desc='Play A, Alfa');geometry('alphabet-final-default',1.75);screenshot('alphabet-final-default','Alphabet at restored default text scale')
route('converter');set_text('NUWJ359');geometry('converter-final-default',1.75);screenshot('converter-final-default','Converter after native lifecycle repair')
