"""Scoped unchanged production Release state/navigation/captures; no inspector."""
from pathlib import Path
import hashlib, importlib.util, json, re, subprocess, time

ROOT=Path(__file__).resolve().parents[4]
OUT=Path(__file__).resolve().parent
spec=importlib.util.spec_from_file_location('native',ROOT/'docs/evidence/run08/android/verify_native.py')
m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
m.OUT=OUT/'product';m.OUT.mkdir(exist_ok=True)
m.SHOTS=OUT.parent/'screenshots/android/product'
m.ADB='/Users/mac/Library/Android/sdk/platform-tools/adb'
m.checks=[];m.captures=[]
apk=ROOT/'artifacts/run27/release-arm64/app-release-local-test.apk'
expected=hashlib.sha256(apk.read_bytes()).hexdigest()
(m.OUT/'install.log').write_text(m.adb('install','-r',str(apk)))
installed=m.adb('shell','pm','path',m.APP).strip().removeprefix('package:')
assert m.adb('shell','sha256sum',installed).split()[0]==expected
runas=subprocess.run([m.ADB,'-s',m.SERIAL,'shell','run-as',m.APP,'id'],capture_output=True,text=True)
assert runas.returncode!=0 and 'not debuggable' in runas.stderr+runas.stdout
original=m.adb('shell','settings','get','system','font_scale').strip()
checks=[]
def byid(tree,name):return next((n for n in m.nodes(tree) if n.get('resource-id','').split('/')[-1]==name),None)
def text(node):return node.get('text') or node.get('content-desc')
def bounds(node):return list(map(int,re.findall(r'-?\d+',node.get('bounds',''))))
def scroll(up=True):
    png=m.adb('exec-out','screencap','-p',raw=True);height=int.from_bytes(png[20:24],'big')
    m.adb('shell','input','swipe','12',str(int(height*(.72 if up else .35))),'12',str(int(height*(.47 if up else .85))),'250');time.sleep(.25)
def top():
    for _ in range(7):scroll(False)
def seek(name=None,desc=None):
    for _ in range(35):
        tree=m.dump();node=byid(tree,name) if name else m.find(tree,desc=desc)
        if node is not None:
            x1,y1,x2,y2=bounds(node)
            if y2-y1>=38 and x2>x1:return node
        scroll()
    raise AssertionError('Control not reachable: '+str(name or desc))
def click(name):
    x1,y1,x2,y2=bounds(seek(name));m.adb('shell','input','tap',str((x1+x2)//2),str((y1+y2)//2));time.sleep(.6)
def quiz_state(name):
    top();tree=m.dump(name)
    progress=byid(tree,'quiz-progress');letter=byid(tree,'quiz-letter')
    assert progress is not None and letter is not None
    return {'progress':text(progress),'letter':text(letter)}
try:
    m.adb('shell','am','force-stop',m.APP);m.adb('shell','settings','put','system','font_scale','1')
    m.route('converter',cold=True);m.set_text('NUWJ359')
    for name,scale in [('release-converter-default',1),('release-converter-live2',2),('release-converter-return1',1)]:
        m.adb('shell','settings','put','system','font_scale',str(scale));time.sleep(1)
        assert m.expect(desc='Text to convert').get('text')=='NUWJ359'
        checks.append({'stage':name,'retainedInput':'NUWJ359','passed':True})
        m.screenshot(name,'Same production converter; retained input through1→2→1','retained dark preference')
    m.route('letter-quiz');seek(desc='5 questions');m.tap(desc='5 questions');click('quiz-start')
    question=quiz_state('question-before');assert 'Question 1 of 5' in question['progress']
    assert byid(m.dump(),'quiz-card-word') is None
    m.screenshot('release-quiz-question-default','Unrevealed production question; answer absent in UIAutomator','retained dark preference')
    click('quiz-choice-0')
    submitted=quiz_state('feedback-before');assert submitted['letter']==question['letter']
    m.screenshot('release-quiz-submitted-default','Production submitted question retained before live scaling','retained dark preference')
    for name,scale in [('release-quiz-submitted-live2',2),('release-quiz-submitted-return1',1)]:
        m.adb('shell','settings','put','system','font_scale',str(scale));time.sleep(1)
        actual=quiz_state(name);assert actual==submitted,(actual,submitted)
        checks.append({'stage':name,'state':actual,'passed':True})
        m.screenshot(name,'Same submitted question and score through live scale transition','retained dark preference')
        seek('quiz-next');tree=m.dump(name+'-controls')
        feedback=next((text(n) for n in m.nodes(tree) if text(n) and ('Correct!' in text(n) or 'Not quite.' in text(n))),None)
        assert feedback is not None
        m.screenshot(name+'-controls','Reachable feedback and Next question; actual short gutter swipes','retained dark preference')
    click('quiz-next');top();m.expect(contains='Question 2 of 5')
    checks.append({'stage':'explicit-next','passed':True,'state':'Question2of5 after retained submitted answer'})
    m.screenshot('release-quiz-next-default','Explicit Next advances once after retained feedback','retained dark preference')
    m.route('alphabet');m.expect(desc='Play A, Alfa')
    m.screenshot('release-reference-default','Ordinary production reference after return to default font scale','retained dark preference')
except Exception:
    m.screenshot('product-failure','Failed production command; no whole-flow acceptance','retained dark preference')
    raise
finally:
    m.adb('shell','settings','put','system','font_scale',original)
    (m.OUT/'identity.json').write_text(json.dumps({'candidateSha256':expected,'nonDebuggable':True,
        'runAs':{'exitCode':runas.returncode,'stdout':runas.stdout,'stderr':runas.stderr},'originalScale':original,
        'checks':checks,'appDataCleared':False,'metro':'not used; exact embedded production Hermes JS',
        'scope':'Scoped converter/submitted quiz/state/Next/navigation and actual pixels; not complete Release tile baseline/raster/window matrix'},indent=2)+'\n')
