from verify_native import *

def scroll_to(desc=None, rid=None, text=None):
    for i in range(20):
        for n in nodes(dump()):
            if (desc and n.get('content-desc')==desc) or (rid and n.get('resource-id')==rid) or (text and n.get('text')==text):
                b=list(map(int,re.findall(r'\d+',n.get('bounds',''))))
                if len(b)==4 and b[3]-b[1]>25 and b[1]>190 and b[3]<1530:return n
        adb('shell','input','swipe','360','1250','360','850','300');time.sleep(.2)
    raise AssertionError('Unreachable '+str((desc,rid,text)))
def click(desc):
    n=scroll_to(desc=desc);x1,y1,x2,y2=map(int,re.findall(r'\d+',n.get('bounds')))
    adb('shell','input','tap',str((x1+x2)//2),str((y1+y2)//2));time.sleep(.4)
def top():
    for _ in range(6):
        adb('shell','input','swipe','600','450','600','1450','350');time.sleep(.25)
def main():
    route('converter',cold=True);expect(desc='Text to convert',timeout=60);top()
    expect(desc='Text to convert');screenshot('empty-dark','Empty converter with Clear and policy','dark')
    set_text('a3 b-!');top();screenshot('input-dark','Ordinary keyboard input and normalization','dark')
    expected='Alfa Three / Bravo dash [not spoken: "!" U+0021]'
    scroll_to(text=expected);screenshot('plain-dark','Plain text, omission marker and export controls','dark')
    click('Copy conversion');expect(text='Copied conversion.')
    # Read OS clipboard through the shipped RN public API after an actual tap.
    value=runtime_async("__r([...__r.getModules().entries()].find(([id,m])=>m.verboseName==='node_modules/react-native/index.js')[0]).Clipboard.getString()")
    assert value==expected,(value,expected)
    screenshot('copied-dark','Actual native clipboard and status','dark')
    click('Share conversion');time.sleep(1);screenshot('share-sheet','Actual Android system share sheet','system')
    assert 'ChooserActivity' in adb('shell','dumpsys','activity','activities')
    adb('shell','input','keyevent','4');time.sleep(.5)
    top();click('Play Full Phrase');time.sleep(.3);top();click('Clear input');expect(desc='Text to convert')
    assert expect(desc='Text to convert').get('text') in ('','Example: CV34 7AP')
    assert runtime()['playback']['status']=='idle'
    screenshot('cleared-dark','Clear removes output and cancels playback','dark')
    set_text('cv34 7ap');tap(desc='Open menu');expect(desc='Back to App');screenshot('menu-return-before','Menu before returning to converter','dark');click('Back to App');time.sleep(1);top()
    assert expect(desc='Text to convert').get('text').lower()=='cv34 7ap'
    scroll_to(rid='converter-0');screenshot('cards-dark','Shared portrait cards with retained input','dark')
    mark('converter-native',copyExact=True,shareSheet=True,clearStopsAudio=True,menuRetainsInput=True)
if __name__=='__main__':main()
