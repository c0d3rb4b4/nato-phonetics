from verify_native import *

def scroll_to(desc=None, rid=None, text=None):
    for i in range(18):
        tree=dump()
        for n in nodes(tree):
            if (desc and n.get('content-desc')==desc) or (rid and n.get('resource-id')==rid) or (text and n.get('text')==text):
                bounds=list(map(int,re.findall(r'\d+',n.get('bounds',''))))
                if len(bounds)==4 and bounds[3]-bounds[1]>25 and bounds[1]>190 and bounds[3]<1530:return n
        adb('shell','input','swipe','360','1350','360','450','240');time.sleep(.2)
    raise AssertionError('Unreachable '+str((desc,rid,text)))
def tap_node(n):
    x1,y1,x2,y2=map(int,re.findall(r'\d+',n.get('bounds')))
    adb('shell','input','tap',str((x1+x2)//2),str((y1+y2)//2));time.sleep(.25)
def top():adb('shell','input','swipe','350','400','350','1400','180');time.sleep(.25)
def click(desc):tap_node(scroll_to(desc=desc))
def frame_capture(name):
    runtime((OUT/'inspect-text.js').read_text());time.sleep(.5)
    (OUT/(name+'-text-layout.json')).write_text(json.dumps(runtime('globalThis.__natoTextMeasurements'),indent=2)+'\n')
    screenshot(name,name,'dark')
def flow():
    route('settings',cold=True);tap(desc='Dark');route('letter-quiz')
    expect(desc='Start round');screenshot('setup','Round length and memory-only disclosure','dark')
    click('5 questions');click('Start round')
    seen=[]
    for i in range(5):
        top();tree=dump(f'question-{i+1}')
        letter=next(n.get('text') for n in nodes(tree) if n.get('resource-id')=='quiz-letter')
        seen.append(letter)
        assert not any(n.get('resource-id')=='quiz-answer' for n in nodes(tree))
        if i==0:screenshot('question','Concealed answer and progress','dark')
        canonical=runtime("(()=>{const m=[...__r.getModules().values()].find(m=>m.verboseName==='src/data/natoData.js');return m.publicModule.exports.NATO_ALPHABET;})()")
        expected=next(e['word'] for e in canonical if e['letter']==letter)
        # Deliberately wrong so Retry is exercised on native.
        for j in range(4):
            n=scroll_to(rid=f'quiz-choice-{j}')
            if n.get('content-desc')!='Choose '+expected:tap_node(n);break
        nextdesc='View results' if i==4 else 'Next question'
        scroll_to(desc=nextdesc)
        if i==0:
            click('Replay answer');tap(desc='Open menu');expect(desc='Back to App');tap(desc='Back to App')
            assert find(dump(),desc=nextdesc) is not None
            screenshot('feedback','Wrong answer, persistent feedback and explicit controls','dark')
        click(nextdesc)
    assert len(set(seen))==5,seen
    top();expect(text='0 correct of 5 answered · 0% accuracy')
    screenshot('results','Completed round and missed-answer recap','dark')
    click('Retry Mistakes');top();expect(text='Question 1 of 5 · 0 correct')
    screenshot('retry-question','Retry creates a round from missed letters','dark')
    click('End round and review');top();expect(text='Round ended early')
    screenshot('ended-early','Explicit early end preserves partial recap','dark')
    mark('native-session-flow',symbols=seen,answered=5,correct=0,retryLength=5,menuRetained=True)

def bounded_text():
    adb('shell','settings','put','system','font_scale','1');time.sleep(2)
    route('letter-quiz',cold=True);expect(desc='Start round');frame_capture('text-cold-scale1')
    adb('shell','settings','put','system','font_scale','2');time.sleep(3)
    frame_capture('text-live-scale2')
    adb('shell','settings','put','system','font_scale','1');time.sleep(2)
    frame_capture('text-return-scale1')
    adb('shell','settings','put','system','font_scale','2');time.sleep(2)
    route('letter-quiz',cold=True);expect(desc='Start round');frame_capture('text-cold-scale2')
    # This checkpoint compares actual normal-entry app frames, with no root replacement.
    def rows(name):
        d=json.loads((OUT/(name+'-text-layout.json')).read_text())
        return {r['text']:r.get('frame') for r in d['values'] if 'frame' in r}
    a,b=rows('text-live-scale2'),rows('text-cold-scale2')
    keys=['Letter practice','Choose a short round. Each letter appears once before the deck repeats.','Start round']
    comparisons=[{'text':k,'live':a.get(k),'cold':b.get(k),'equal':a.get(k)==b.get(k)} for k in keys]
    (OUT/'text-comparison.json').write_text(json.dumps({'scenario':'Normal application entry, no fixture/root replacement','comparisons':comparisons,'readabilityGate':'OPEN; inspect screenshots, equal frames alone do not prove readable text'},indent=2)+'\n')
    adb('shell','settings','put','system','font_scale','1');time.sleep(2)

if __name__=='__main__':
    flow();bounded_text()
