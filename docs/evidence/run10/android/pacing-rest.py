from converter import *

route('converter',cold=True);expect(desc='Text to convert',timeout=60);top();set_text('abcdefghijklmnopqrstuvwxyz 0123456789');top();scroll_to(desc='Next cards');click('Next cards');expect(contains='Card page 2 of 2')
tap(desc='Open menu');expect(desc='Back to App');time.sleep(.7);click('Back to App');time.sleep(.7);top();assert expect(desc='Text to convert').get('text').lower()=='abcdefghijklmnopqrstuvwxyz 0123456789'
route('converter',cold=True);expect(desc='Text to convert',timeout=60);top();assert runtime()['preferences']['preferences']['converterPacing']=={'rate':.75,'wordPauseMs':700}
mark('paging-menu-relaunch-pacing',inputIsMemoryOnly=True)
# Test setup seeds the OS clipboard through the installed public native bridge;
# the input itself uses an ordinary Android Paste key, not React state injection.
long=('CV34 7AP / G-ABCD\n'*118)[:2000]
runtime("(() => { const rn=__r([...__r.getModules().entries()].find(([id,m])=>m.verboseName==='node_modules/react-native/index.js')[0]);rn.Clipboard.setString("+json.dumps(long)+");return 'seeded';})()")
tap(desc='Text to convert');t=time.monotonic();adb('shell','input','keyevent','KEYCODE_PASTE');time.sleep(1)
value=expect(desc='Text to convert').get('text');assert value==long,(len(value),len(long));adb('shell','input','text','j');time.sleep(.3)
value=expect(desc='Text to convert').get('text');assert value==long+'j',(len(value),value[-20:]);elapsed=time.monotonic()-t
screenshot('long-paste-edited','Actual 2000-character OS Paste followed by ordinary j key','dark')
if 'mInputShown=true' in adb('shell','dumpsys','input_method'):adb('shell','input','keyevent','4')
click('Copy conversion')
actual=runtime_async("__r([...__r.getModules().entries()].find(([id,m])=>m.verboseName==='node_modules/react-native/index.js')[0]).Clipboard.getString()")
expected=runtime("(() => {const c=__r([...__r.getModules().entries()].find(([id,m])=>m.verboseName==='src/lib/conversion.js')[0]);return c.conversionOutput(c.convertText("+json.dumps(long+'j')+")).text;})()")
assert actual==expected
screenshot('long-paste-copy','Full long conversion copied; selectable text scrolls independently','dark')
click('Next cards');expect(contains='Card page 2 of 84');scroll_to(rid='converter-24');screenshot('long-paste-page-2','Long phrase card navigation without truncation','dark')
mark('long-os-paste-edit-copy-page',inputCharacters=2001,outputCharacters=len(actual),pasteThroughEditToUIAutomatorSeconds=elapsed,method='driver-inclusive observation; no latency SLA')
route('privacy');expect(contains='About this policy',timeout=30);top();scroll_to(contains='converterPacing');screenshot('privacy-pacing','Storage policy discloses only deliberate pacing settings','dark')
adb('shell','settings','put','system','font_scale','2');route('converter',cold=True);expect(desc='Text to convert',timeout=60);top();set_text('a3 b!');top();click('Change playback pace');scroll_to(desc='Word pause 700 ms');screenshot('pace-cold-scale2','Cold configured 2x pacing labels and controls','dark')
adb('shell','settings','put','system','font_scale','1');route('converter',cold=True);expect(desc='Text to convert',timeout=60);top();set_text('a3 b!');top();click('Change playback pace');scroll_to(desc='Word pause 700 ms');screenshot('pace-before-live-scale2','Existing pacing controls at 1x','dark')
adb('shell','settings','put','system','font_scale','2');time.sleep(2);screenshot('pace-live-scale2','Live 1x to 2x pacing controls: inspect stale ordinary text; no accessibility pass','dark')
top();assert expect(desc='Text to convert').get('text').lower()=='a3 b!';mark('live-scale-input-retained',accessibilityAcceptance='open')
adb('shell','settings','put','system','font_scale','1')
