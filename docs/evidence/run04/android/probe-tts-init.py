#!/usr/bin/env python3
"""Measure real native stop() immediately after lazy TTS module initialization."""
import importlib.util
import json
from pathlib import Path
import time

s=importlib.util.spec_from_file_location('native',Path(__file__).with_name('verify-native.py'))
n=importlib.util.module_from_spec(s);s.loader.exec_module(n)
n.route('',cold=True)
n.expect(text='NATO Phonetics',timeout=35)
expression="""(() => {
 const entry=[...__r.getModules().entries()].find(([id,m])=>m.verboseName==='node_modules/react-native-tts/index.js');
 const previouslyInitialized=entry[1].isInitialized;
 const tts=__r(entry[0]).default;
 const started=Date.now();
 globalThis.__natoInitProbe={previouslyInitialized,started};
 tts.stop().then(value=>{__natoInitProbe.initialStop={value,elapsedMs:Date.now()-started};},error=>{__natoInitProbe.initialStop={error:String(error),code:error.code,elapsedMs:Date.now()-started};});
 tts.getInitStatus().then(value=>{
   __natoInitProbe.ready={value,elapsedMs:Date.now()-started};
   const second=Date.now();
   tts.stop().then(value=>{__natoInitProbe.readyStop={value,elapsedMs:Date.now()-second};},error=>{__natoInitProbe.readyStop={error:String(error),code:error.code,elapsedMs:Date.now()-second};});
 },error=>{__natoInitProbe.ready={error:String(error),code:error.code,elapsedMs:Date.now()-started};});
 return 'started';
})()"""
n.runtime(expression)
for _ in range(40):
    value=n.runtime('__natoInitProbe')
    if value.get('readyStop') or value.get('ready',{}).get('error'):
        print(json.dumps(value,indent=2),flush=True)
        (n.OUT/'tts-initialization.json').write_text(json.dumps(value,indent=2)+'\n')
        break
    time.sleep(.3)
else:
    raise AssertionError(value)
