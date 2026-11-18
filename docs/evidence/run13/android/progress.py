from verify_native import *

capture_native=screenshot
def screenshot(name,state,theme='system'):
    actual=runtime("(() => {const m=[...globalThis.__r.getModules().values()].find(m=>m.verboseName.endsWith('/Utilities/Appearance.js'));return m.publicModule.exports.getColorScheme();})()")
    capture_native(name,state,actual or 'unknown')

WORDS=dict(zip('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',['Alfa','Bravo','Charlie','Delta','Echo','Foxtrot','Golf','Hotel','India','Juliett','Kilo','Lima','Mike','November','Oscar','Papa','Quebec','Romeo','Sierra','Tango','Uniform','Victor','Whiskey','X-ray','Yankee','Zulu','Zero','One','Two','Three','Four','Five','Six','Seven','Eight','Nine']))

def top():
    for _ in range(5):adb('shell','input','swipe','650','450','650','1350','250')

def scroll_to(desc=None,rid=None,text=None):
    for _ in range(35):
        for n in nodes(dump()):
            if (desc is not None and n.get('content-desc')==desc) or (rid is not None and n.get('resource-id')==rid) or (text is not None and n.get('text')==text):
                b=list(map(int,re.findall(r'\d+',n.get('bounds',''))))
                if len(b)==4 and b[3]-b[1]>25 and b[1]>190 and b[3]<1510:return n
        adb('shell','input','swipe','650','1200','650','850','230')
    raise AssertionError('Unreachable '+str((desc,rid,text)))

def click(desc):
    n=scroll_to(desc=desc);x1,y1,x2,y2=map(int,re.findall(r'\d+',n.get('bounds')));adb('shell','input','tap',str((x1+x2)//2),str((y1+y2)//2));time.sleep(.2)

def dismiss():
    if 'mInputShown=true' in adb('shell','dumpsys','input_method'):adb('shell','input','keyevent','4')

def type_answer(value):
    click('Your code word');adb('shell','input','text',value.replace(' ','%s'))
    assert expect(desc='Your code word').get('text')==value

def progress():
    return runtime("(() => { const m=[...globalThis.__r.getModules().values()].find(m=>m.verboseName==='src/lib/progressStore.js');return m.publicModule.exports.progressStore.getSnapshot();})()")

def wait_count(count):
    end=time.monotonic()+15
    while time.monotonic()<end:
        s=progress()
        if sum(r['attempts'] for r in s['data']['symbols'].values())==count and s['pendingCount']==0:return s
        time.sleep(.25)
    raise AssertionError(('saved-count',count,s))

def run():
    adb('reverse','tcp:8081','tcp:8081');adb('shell','settings','put','system','font_scale','1')
    route('progress',cold=True);scroll_to(rid='progress-summary');expect(contains='0 answers saved');screenshot('empty-progress','No saved progress; default text','dark')
    route('letter-quiz',cold=True);expect(desc='Choose a code word',timeout=60);click('Digits');click('Due review');scroll_to(rid='quiz-start');assert find(dump(),desc='Start round').get('enabled')=='false';screenshot('empty-due-review','No due digits; full practice remains available','dark');click('Full symbol set');click('5 questions');click('Start round')
    missed=None
    for i in range(5):
        top();symbol=scroll_to(rid='quiz-letter').get('text').strip()
        if i==0:
            missed=symbol;first=scroll_to(rid='quiz-choice-0').get('content-desc');answer=scroll_to(rid='quiz-choice-1').get('content-desc') if first=='Choose '+WORDS[symbol] else first
        else:answer='Choose '+WORDS[symbol]
        click(answer);wait_count(i+1);click('View results' if i==4 else 'Next question')
    scroll_to(rid='quiz-score');expect(contains='4 correct of 5 answered');mark('five-guarded-answers',missed=missed,snapshot=progress())
    route('progress',cold=True);scroll_to(rid='progress-summary');expect(contains='5 answers saved');expect(contains='1 due now');screenshot('saved-summary-relaunched','Saved aggregate survives force-stop and relaunch','dark');scroll_to(rid='progress-symbol-'+missed);screenshot('saved-symbols','Per-symbol attempts/errors and due status','dark')
    saved=progress()['data'];click('Preferences');click('Reset Preferences');click('Learning progress and deletion');assert progress()['data']==saved;mark('reset-keeps-progress',snapshot=progress())
    route('letter-quiz',cold=True);click('Digits');click('Focus on mistakes');scroll_to(rid='review-availability');expect(contains='1 saved symbols available');click('Due review');screenshot('due-review-setup','Exactly one missed digit is due after preference reset','system');click('Start round');top();assert scroll_to(rid='quiz-letter').get('text').strip()==missed;expect(contains='Question 1 of 1');screenshot('due-review-question','One-symbol review through unchanged shared tile','system');click('Choose '+WORDS[missed]);wait_count(6);click('View results');expect(contains='1 correct of 1 answered');mark('due-review-recovers-miss',snapshot=progress())
    route('progress',cold=True);scroll_to(rid='progress-summary');screenshot('recovered-summary','Six saved answers; no symbols currently due or last missed','system');click('Clear Progress');scroll_to(rid='progress-delete');screenshot('clear-confirmation','Explicit deletion confirmation; preferences retained','system');click('Keep progress');assert sum(r['attempts'] for r in progress()['data']['symbols'].values())==6;mark('cancel-keeps-progress')
    adb('shell','settings','put','system','font_scale','2');route('progress',cold=True);scroll_to(rid='progress-summary');screenshot('cold-scale2-summary','Cold configured 2x progress summary; scrolling viewport','system');scroll_to(rid='progress-symbol-'+missed);screenshot('cold-scale2-symbols','Cold configured 2x per-symbol information','system');click('Clear Progress');scroll_to(rid='progress-delete');screenshot('cold-scale2-clear-confirmation','Cold configured 2x delete and keep controls','system');before=runtime()['preferences']['preferences'];click('Delete saved progress');wait_count(0);assert runtime()['preferences']['preferences']==before;top();scroll_to(rid='progress-summary');screenshot('cold-scale2-cleared-summary','Scoped deletion; saved zero summary at cold 2x','system');mark('delete-keeps-preferences',preferences=before)
    adb('shell','settings','put','system','font_scale','1');route('progress',cold=True);wait_count(0);scroll_to(rid='progress-summary');expect(contains='0 answers saved');screenshot('cleared-summary-relaunched','Deletion remains after native relaunch','system');mark('delete-persists-relaunch')
    adb('shell','settings','put','system','font_scale','2');time.sleep(2);screenshot('live-scale2-summary','Live 1x to 2x ordinary progress labels; inherited P05.2 readability gate remains open','system');assert not progress()['data']['symbols'];mark('live-scale2-retains-cleared-state',readability='Not passed; inherited ordinary-text P1')
    adb('shell','settings','put','system','font_scale','1')

if __name__=='__main__':run()

