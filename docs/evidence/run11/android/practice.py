from converter import *

def get_symbol():
    top()
    n=scroll_to(rid='quiz-letter')
    return n.get('text').strip()

def run():
    adb('reverse','tcp:8081','tcp:8081');adb('shell','settings','put','system','font_scale','1')
    route('alphabet',cold=True);expect(desc='Letters A–Z',timeout=90);click('Digits 0–9');scroll_to(rid='digit-0');screenshot('digit-reference','New ten-digit reference with canonical word and pronunciation guide','dark')
    click('Play 3, Three');terminal('digit-three-native-completes')
    click('Letters A–Z');assert find(dump(),desc='Play 3, Three') is None
    route('letter-quiz');expect(desc='Digits',timeout=30);click('Digits');scroll_to(desc='Digits');screenshot('numeric-setup','Digits selected before starting new numeric round','dark');click('5 questions');click('Start round')
    symbols=[]
    for i in range(5):
        symbol=get_symbol();assert symbol in '0123456789' and len(symbol)==1,symbol;symbols.append(symbol)
        assert not any(n.get('resource-id')=='quiz-answer' for n in nodes(dump()))
        if i==0:screenshot('numeric-question','Concealed numeric question; four choices below in scroll area','dark')
        click(scroll_to(rid='quiz-choice-0').get('content-desc'))
        if i==0:
            scroll_to(desc='Replay answer');screenshot('numeric-feedback','Submitted numeric answer with explicit Next and Replay','dark');click('Replay answer');tap(desc='Open menu');expect(desc='Back to App');click('Back to App');scroll_to(desc='Next question')
        click('View results' if i==4 else 'Next question')
    assert len(set(symbols))==5,symbols
    scroll_to(rid='quiz-score');screenshot('numeric-results','Five answered numeric round; misses and retry available','dark');expect(contains='of 5 answered')
    mark('numeric-native-round',symbols=symbols,duplicateSymbols=False,menuRetainsFeedback=True)
    click('Choose a new round');click('Letters and digits');click('5 questions');click('Start new round');get_symbol();screenshot('mixed-question','Mixed symbol set uses the existing guarded session and shared tile','dark');click('End round and review')
    for label,example in [('Postcode symbols','SW1A 1AA'),('Callsign symbols','N359AB')]:
        click('Choose a new round');click(label);scroll_to(rid='practice-example-text');screenshot('postcode-example' if label=='Postcode symbols' else 'callsign-example',label+' with full canonical example text','dark')
        click('Hear example');terminal('native-example-'+label.split()[0].lower(),timeout=35)
        click('Start new round');click('End round and review');expect(contains='0 correct of 0 answered')
    mark('mixed-and-example-native',exampleAudio='real provider completion; no human listening pass')
    route('voice-select');expect(desc='Search English voices',timeout=30);scroll_to(desc='Search English voices');tap(desc='Search English voices');adb('shell','input','text','zzzz-no-match')
    if 'mInputShown=true' in adb('shell','dumpsys','input_method'):adb('shell','input','keyevent','4')
    scroll_to(desc='Reset voice filters');screenshot('voice-no-match','Actual installed voice search no-match; saved voice unchanged','dark');click('Reset voice filters');top();scroll_to(desc='Search English voices');screenshot('voice-reset','Reset voice filters restores all English voices','dark');mark('native-voice-search-reset',storageUnchanged=True)
    # New changed flow: cold enlarged and retained live sizing remain separate.
    adb('shell','settings','put','system','font_scale','2');route('letter-quiz',cold=True);expect(desc='Digits',timeout=60);click('Digits');scroll_to(desc='Digits');screenshot('numeric-cold-scale2-setup','Cold 2x new numeric setup; inspect ordinary labels','dark');click('5 questions');click('Start round');get_symbol();screenshot('numeric-cold-scale2-question','Cold 2x numeric tile/prompt; inspect reachable scrolling','dark')
    # No pass is assigned to inherited live-scale readability.
    adb('shell','settings','put','system','font_scale','1');route('letter-quiz',cold=True);expect(desc='Digits',timeout=60);click('Digits');click('5 questions');click('Start round');symbol=get_symbol()
    adb('shell','settings','put','system','font_scale','2');time.sleep(2);screenshot('numeric-live-scale2-question','Live 1x to 2x; inherited ordinary-text sizing remains under P05.2','dark');assert get_symbol()==symbol
    mark('numeric-live-state-retained',symbol=symbol,readabilityAcceptance='FAILED inherited P05.2; inspect frame, no repair shipped')
    adb('shell','settings','put','system','font_scale','1')

if __name__=='__main__':run()
