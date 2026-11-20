from verify_native import *

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

def run():
    adb('reverse','tcp:8081','tcp:8081');adb('shell','settings','put','system','font_scale','1')
    route('letter-quiz',cold=True);expect(desc='Choose a code word',timeout=90);click('Listen and choose a symbol');scroll_to(rid='mode-listening');screenshot('listening-setup','Listening mode selected; default text','dark');click('Digits');click('5 questions');click('Start round')
    seen=[]
    for i in range(5):
        tree=dump();assert all(n.get('resource-id') not in ('quiz-card','quiz-letter','quiz-code-word','quiz-answer') for n in nodes(tree))
        top();click('Play code word');terminal('listening-real-provider-'+str(i))
        if i==0:
            top();screenshot('listening-question','Concealed listening question after actual provider completion','dark');click('Play code word');tap(desc='Open menu');click('Back to App');assert runtime()['playback']['status']=='idle'
        top();click('Show code word as text');word=scroll_to(rid='quiz-code-word').get('text');symbol=next(k for k,v in WORDS.items() if v==word);seen.append(symbol)
        if i==0:screenshot('listening-text-alternative','Code word text alternative without revealed answer tile','dark')
        click('Choose '+symbol);expect(desc='Replay answer')
        if i==0:scroll_to(desc='Next question');screenshot('listening-feedback','Submitted listening response with persistent feedback and Next','dark')
        click('View results' if i==4 else 'Next question')
    assert len(set(seen))==5;scroll_to(rid='quiz-score');expect(contains='5 correct of 5 answered');screenshot('listening-results','Five distinct listening digits, full score','dark');mark('listening-round',symbols=seen,actualProvider=True)
    click('Choose a new round');top();click('Type a code word');click('Letters');click('5 questions');click('Start new round')
    for i in range(5):
        top();symbol=scroll_to(rid='quiz-letter').get('text').strip();assert symbol in WORDS
        if i==0:click('Check answer');expect(contains='Enter a code word before checking.')
        value='wrong' if i==0 else WORDS[symbol].lower();top();type_answer(value)
        if i==0:
            screenshot('typed-keyboard','Exact wrong draft with real Android keyboard','dark');tap(desc='Open menu');click('Back to App');top();assert scroll_to(desc='Your code word').get('text')==value;mark('typed-draft-menu-retained',value=value)
        dismiss();click('Check answer');expect(contains='Your answer: '+value)
        if i==0:scroll_to(desc='Next question');screenshot('typed-feedback','Typed incorrect response retained with feedback and Next','dark')
        click('View results' if i==4 else 'Next question')
    scroll_to(rid='quiz-score');expect(contains='4 correct of 5 answered');screenshot('typed-results','Typed five-answer recap and mistake retry','dark');click('Retry Mistakes');top();symbol=scroll_to(rid='quiz-letter').get('text').strip();type_answer(WORDS[symbol]);dismiss();click('Check answer');click('View results');expect(contains='1 correct of 1 answered');screenshot('typed-retry-results','Typed Retry retains mode and corrects the sole mistake','dark');mark('typed-round-and-retry',score='4/5 then 1/1')
    adb('shell','settings','put','system','font_scale','2');route('letter-quiz',cold=True);expect(desc='Choose a code word',timeout=60);click('Listen and choose a symbol');click('Digits');click('5 questions');click('Start round');top();scroll_to(desc='Play code word');screenshot('listening-cold-scale2','Cold configured 2x listening controls','dark');click('Show code word as text');scroll_to(rid='quiz-code-word');screenshot('listening-cold-scale2-text','Cold 2x text alternative and scrolling','dark')
    adb('shell','settings','put','system','font_scale','1');route('letter-quiz',cold=True);expect(desc='Choose a code word',timeout=60);click('Type a code word');click('Digits');click('5 questions');click('Start round');top();symbol=scroll_to(rid='quiz-letter').get('text').strip();type_answer('three');dismiss();adb('shell','settings','put','system','font_scale','2');time.sleep(2);screenshot('typed-live-scale2','Live 1x to 2x typed draft; inherited P05.2 readability remains open','dark');assert scroll_to(desc='Your code word').get('text')=='three';mark('typed-live-draft-retained',symbol=symbol,value='three',readability='Not passed; inherited live ordinary-text P1')
    adb('shell','settings','put','system','font_scale','1')

if __name__=='__main__':run()
