#!/usr/bin/env python3
"""P00 Android checks on the dedicated nato-p00-api36 emulator.

Interaction uses adb input/UIAutomator. Hermes is used to observe the original
controller, native provider events and real AsyncStorage; the only fixture
writes are legacy preference keys and an unrelated sentinel in this disposable
app installation. No application source or provider is replaced.
"""
import importlib.util
import json
import os
from pathlib import Path
import time

spec = importlib.util.spec_from_file_location('native', Path(__file__).with_name('verify-native.py'))
n = importlib.util.module_from_spec(spec)
spec.loader.exec_module(n)

MODULES = '[...globalThis.__r.getModules().values()]'
STORAGE = MODULES + ".find(m=>m.verboseName==='node_modules/@react-native-async-storage/async-storage/src/index.ts').publicModule.exports.default"
SPEECH = MODULES + ".find(m=>m.verboseName==='src/lib/speech.js').publicModule.exports"


def observe():
    n.runtime("""(() => {
      const modules = [...__r.getModules().values()];
      const tts = modules.find(m => m.verboseName === 'node_modules/react-native-tts/index.js').publicModule.exports.default;
      const playback = modules.find(m => m.verboseName === 'src/lib/speech.js').publicModule.exports.playback;
      globalThis.__natoObserved?.subscriptions.forEach(s=>s.remove());
      globalThis.__natoObserved?.unsubscribe();
      const data = {events:[],states:[],subscriptions:[]};
      ['tts-start','tts-finish','tts-cancel','tts-error'].forEach(kind => {
        data.subscriptions.push(tts.addListener(kind, event => data.events.push({kind,id:String(event.utteranceId),time:Date.now()})));
      });
      data.unsubscribe = playback.subscribe(() => {
        const s=playback.getSnapshot();
        data.states.push({status:s.status,result:s.result?.status,error:s.result?.error?.message,tokenIndex:s.tokenIndex,tokenCount:s.tokenCount,time:Date.now()});
      });
      globalThis.__natoObserved=data;
      return true;
    })()""")


def clear_observed():
    n.runtime('globalThis.__natoObserved.events.length=0; globalThis.__natoObserved.states.length=0; true')


def save_observed(name):
    value = n.runtime('({events:__natoObserved.events,states:__natoObserved.states})')
    (n.OUT / f'{name}.json').write_text(json.dumps(value, indent=2) + '\n')
    assert not any(e['kind'] == 'tts-error' for e in value['events']), value
    return value


def active(timeout=8):
    end = time.monotonic() + timeout
    while time.monotonic() < end:
        data = n.runtime('({snapshot:' + SPEECH + '.playback.getSnapshot(),events:__natoObserved.events})')
        if data['snapshot']['status'] in ['playing','paused'] and any(e['kind']=='tts-start' for e in data['events']):
            return data
        if (data['snapshot'].get('result') or {}).get('status') == 'failed':
            raise AssertionError(data)
        time.sleep(0.2)
    raise AssertionError(f'No actual native speech start: {data}')


def scroll_down():
    n.adb('shell','input','swipe','360','1400','360','450','350')


def scenario():
    if os.environ.get('NATO_RESUME_AUDIO'):
        n.checks=json.loads((n.OUT/'checks.json').read_text())
        n.captures=json.loads((n.SHOTS/'metadata.json').read_text())
        voices=json.loads((n.OUT/'voices.json').read_text())
        n.route('voice-select');n.expect(text='Select Voice')
    else:
        n.route('settings', cold=True)
        n.expect(text='Appearance', timeout=90)
        n.tap(desc='Light')
        n.route('', cold=True)
        n.expect(text='NATO Phonetics', timeout=90)
        n.mark('cold-home-rendered')
        n.screenshot('home-light','Actual installed native Home; light theme')

        n.tap(desc='Word Converter')
        n.expect(desc='Text to convert')
        n.screenshot('converter-empty-light','Empty converter; Play Full Phrase disabled')
        assert n.find(n.dump(),desc='Play Full Phrase').get('enabled')=='false'
        n.set_text('CV34 7AP')
        tree=n.dump('converter-exact-input')
        for word in ['Charlie','Victor','Three','Four','Seven','Alfa','Papa']:
            assert n.find(tree,desc='Play '+word) is not None, word
        n.mark('bulk-input-and-seven-output-cards',input='CV34 7AP')
        n.screenshot('converter-populated-light','Exact bulk input CV34 7AP and all seven letter/digit cards asserted')
        n.tap(desc='Open menu');n.expect(text='Menu');n.tap(desc='Back to App')
        assert n.expect(desc='Text to convert').get('text')=='CV34 7AP'
        n.mark('menu-back-retains-converter')
        n.tap(desc='Open menu');n.adb('shell','input','keyevent','4')
        assert n.expect(desc='Text to convert').get('text')=='CV34 7AP'
        n.mark('hardware-back-retains-converter')
        n.set_text('CV34 7AZ')
        tree=n.dump('converter-edited')
        assert n.find(tree,desc='Play Zulu') is not None
        assert n.find(tree,desc='Play Papa') is None
        n.mark('bulk-edit-replaces-output',input='CV34 7AZ')

        n.route('voice-select');n.expect(text='Select Voice')
        voices=n.runtime_async(SPEECH+'.loadEnglishVoices()')
        assert voices and all(v['language'].lower().startswith('en') for v in voices)
        (n.OUT/'voices.json').write_text(json.dumps(voices,indent=2)+'\n')
        n.mark('real-google-tts-voices-enumerated',count=len(voices))
        n.tap(desc='Retry voice list')
        n.expect(contains=', en-')
        current_voices=n.runtime_async(SPEECH+'.loadEnglishVoices()')
        visible=[x for x in n.dump().iter('node') if x.get('class')=='android.widget.RadioButton' and x.get('content-desc')!='System Default']
        assert any(x.get('content-desc')==v['name']+', '+v['language'] for v in current_voices for x in visible)
        n.screenshot('voice-light','Real Google TTS English voice enumeration after Retry; visible rows checked against current provider list')
    observe();clear_observed()
    n.tap(desc='Preview System Default')
    n.terminal('system-default-preview-completes')
    events=save_observed('speech-default-completion')
    assert len([e for e in events['events'] if e['kind']=='tts-finish'])==3
    starts=[e['id'] for e in events['events'] if e['kind']=='tts-start']
    finishes=[e['id'] for e in events['events'] if e['kind']=='tts-finish']
    assert len(starts)==3 and len(set(starts))==3 and set(starts)==set(finishes)
    n.mark('three-distinct-native-utterances-completed')

    # Long real phrase leaves time to interact using ordinary native controls.
    n.route('converter');n.expect(desc='Text to convert')
    n.set_text('AB CD EF GH IJ KL MN OP QR ST UV WX YZ')
    observe();clear_observed()
    n.tap(desc='Play Full Phrase');active()
    n.tap(desc='Stop playback')
    n.terminal('explicit-stop-cancels',expected='cancelled')
    time.sleep(0.5)
    events=save_observed('speech-explicit-stop')
    assert any(e['kind']=='tts-cancel' for e in events['events']),events

    clear_observed();n.tap(desc='Play Full Phrase');active()
    n.tap(desc='Open menu');n.expect(text='Menu')
    n.terminal('navigation-cancels',expected='cancelled')
    time.sleep(0.5);save_observed('speech-navigation-stop')
    n.adb('shell','input','keyevent','4');n.expect(desc='Text to convert')
    n.terminal('menu-back-does-not-resume',expected='cancelled')

    clear_observed();n.tap(desc='Play Full Phrase');active()
    n.adb('shell','input','keyevent','3')
    n.terminal('background-cancels',expected='cancelled')
    time.sleep(0.5);save_observed('speech-background-stop')
    n.adb('shell','am','start','-W','-n',n.APP+'/.MainActivity')
    n.expect(desc='Text to convert')
    n.terminal('foreground-does-not-resume',expected='cancelled')

    n.set_text('AB CD EF GH IJ KL MN OP QR ST UV WX YZ')
    clear_observed();n.tap(desc='Play Full Phrase');active()
    n.tap(desc='Play Alfa')
    n.terminal('replacement-completes')
    events=save_observed('speech-replacement')
    assert any(s.get('result')=='cancelled' for s in events['states'])
    assert any(s.get('result')=='completed' for s in events['states'])

    n.route('alphabet');n.expect(desc='Play A, Alfa')
    n.screenshot('alphabet-light','Native alphabet reference and playback controls')
    n.route('letter-quiz');n.expect(text='Letter Quiz')
    n.screenshot('quiz-question-light','Unanswered native quiz with four choices')
    tree=n.dump('quiz-question-tree')
    choices=[x for x in tree.iter('node') if x.get('content-desc','').startswith('Choose ')]
    assert len(choices)==4,[x.attrib for x in choices]
    n.tap(desc=choices[0].get('content-desc'))
    n.expect(desc='Next question')
    n.screenshot('quiz-feedback-light','Quiz answer feedback; Next and Replay available')
    n.mark('quiz-four-choices-and-feedback')

    for path,title in [('settings','Settings'),('about','About'),('privacy','Privacy Policy'),('audio-help','Audio Help'),('_sitemap','Site Map'),('not-a-route','Page Not Found')]:
        n.route(path);n.expect(text=title);n.mark('warm-link-'+path)
        if path=='audio-help':n.screenshot('audio-help-light','Native Audio Help and sound test')
    n.route('menu',cold=True);n.expect(text='Menu',timeout=90)
    n.screenshot('menu-cold-light','Cold native natophonetics://menu link')
    n.tap(desc='Back to App');n.expect(text='NATO Phonetics')
    n.mark('cold-menu-home-fallback')

    n.route('settings');n.tap(desc='Dark')
    assert n.runtime()['preferences']['preferences']['themeMode']=='dark'
    n.screenshot('settings-dark','Dark chosen through native Settings',theme='dark')
    n.route('',cold=True);n.expect(text='NATO Phonetics',timeout=90)
    assert n.runtime()['preferences']['preferences']['themeMode']=='dark'
    n.screenshot('home-dark-restarted','Dark appearance persists through process restart',theme='dark')
    n.mark('saved-theme-survives-process-restart')

    # Exercise legacy migration through the real installed AsyncStorage module.
    voice=next(v['identifier'] for v in voices if v.get('localService') is True)
    legacy=[['darkMode','true'],['selectedVoice',voice],['nato.progress.p00-fixture','keep']]
    n.runtime_async(STORAGE+'.multiSet('+json.dumps(legacy)+').then(()=>'+STORAGE+'.removeItem("nato.preferences.v1"))')
    n.route('settings',cold=True);n.expect(text='Appearance',timeout=90)
    prefs=n.runtime()['preferences']['preferences']
    assert prefs=={'version':1,'themeMode':'dark','selectedVoice':voice},prefs
    stored=n.runtime_async(STORAGE+'.multiGet(["nato.preferences.v1","darkMode","selectedVoice","nato.progress.p00-fixture"])')
    assert dict(stored)['darkMode'] is None and dict(stored)['selectedVoice'] is None
    assert dict(stored)['nato.progress.p00-fixture']=='keep'
    n.mark('native-legacy-theme-and-voice-migration',preferences=prefs,storage=stored)
    scroll_down();n.tap(desc='Reset Preferences')
    time.sleep(0.5)
    assert n.runtime()['preferences']['preferences']=={'version':1,'themeMode':'system','selectedVoice':None}
    stored=n.runtime_async(STORAGE+'.multiGet(["nato.preferences.v1","nato.progress.p00-fixture"])')
    assert dict(stored)['nato.progress.p00-fixture']=='keep'
    n.mark('native-reset-preserves-unrelated-data',storage=stored)
    n.runtime_async(STORAGE+'.removeItem("nato.progress.p00-fixture")')
    n.route('settings');n.tap(desc='Light');n.route('')
    n.expect(text='NATO Phonetics')
    n.mark('suite-complete',checks=len(n.checks)+1,captures=len(n.captures))


if __name__=='__main__':
    scenario()
