#!/usr/bin/env python3
import hashlib,importlib.util,json
from pathlib import Path
s=importlib.util.spec_from_file_location('scenario',Path(__file__).with_name('scenarios.py'));m=importlib.util.module_from_spec(s);s.loader.exec_module(m);n=m.n
n.checks=json.loads((n.OUT/'checks.json').read_text());n.captures=json.loads((n.SHOTS/'metadata.json').read_text())
old=next((c for c in n.captures if c['file']=='voice-light.png'),None)
if old and (n.SHOTS/'voice-empty-light.png').exists() and old['sha256']==hashlib.sha256((n.SHOTS/'voice-empty-light.png').read_bytes()).hexdigest():
 old['file']='voice-empty-light.png';old['state']='Actual initial empty English voice list before engine enumeration settled; Retry available'
n.route('voice-select');n.expect(text='Select Voice');n.tap(desc='Retry voice list')
voices=n.runtime_async(m.SPEECH+'.loadEnglishVoices()')
(n.OUT/'voices-after-retry.json').write_text(json.dumps(voices,indent=2)+'\n')
tree=n.dump('voice-visible-rows')
visible=[x for x in tree.iter('node') if x.get('class')=='android.widget.RadioButton' and x.get('content-desc')!='System Default']
assert visible
assert any(x.get('content-desc')==v['name']+', '+v['language'] for v in voices for x in visible)
n.screenshot('voice-light','Real Google TTS English voice enumeration after Retry; visible rows checked against current provider list')
n.mark('voice-list-retry-renders-enumerated-voice',count=len(voices),visible=[x.get('content-desc') for x in visible])
events=json.loads((n.OUT/'speech-default-completion.json').read_text())
starts=[e['id'] for e in events['events'] if e['kind']=='tts-start'];finishes=[e['id'] for e in events['events'] if e['kind']=='tts-finish']
assert len(starts)==len(finishes)==3 and len(set(starts))==3 and set(starts)==set(finishes)
n.mark('native-start-finish-id-pairs-match')
n.route('converter');n.expect(desc='Text to convert');n.set_text('AAAA');m.observe();m.clear_observed()
n.tap(desc='Play Full Phrase');n.terminal('repeated-identical-words-complete')
events=m.save_observed('speech-repeated-words')
starts=[e['id'] for e in events['events'] if e['kind']=='tts-start'];finishes=[e['id'] for e in events['events'] if e['kind']=='tts-finish']
assert len(starts)==len(finishes)==4 and len(set(starts))==4 and set(starts)==set(finishes)
n.mark('four-identical-words-have-distinct-native-ids')
n.set_text('AB CD EF GH IJ KL MN OP QR ST UV WX YZ');m.clear_observed()
n.tap(desc='Play Full Phrase');m.active();n.tap(desc='Open menu');n.expect(text='Menu')
n.terminal('menu-navigation-cancels-supplement',expected='cancelled')
n.adb('shell','input','keyevent','4');n.expect(desc='Text to convert')
n.terminal('menu-back-does-not-resume',expected='cancelled')
m.save_observed('speech-menu-back-stop')
n.route('');n.expect(text='NATO Phonetics');n.mark('supplement-complete',checks=len(n.checks)+1,captures=len(n.captures))
