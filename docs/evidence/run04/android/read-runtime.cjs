#!/usr/bin/env node
// Observe the installed debug app through the standard Hermes inspector. This
// neither replaces providers nor changes application source or playback state.
const WebSocket = require('ws');
const expression = process.argv[2] || `(() => {
  const modules = [...globalThis.__r.getModules().values()];
  const speech = modules.find(m => m.verboseName === 'src/lib/speech.js').publicModule.exports;
  const prefs = modules.find(m => m.verboseName === 'src/lib/preferenceStore.js').publicModule.exports;
  const playback = speech.playback?.getSnapshot() ?? null;
  return { playback: playback && {...playback, result: playback.result && {...playback.result,
    ...(playback.result.error ? {error:{message:playback.result.error.message,code:playback.result.error.code}} : {})}},
    preferences: prefs.preferenceStore.getSnapshot() };
})()`;
(async () => {
  const pages = await (await fetch('http://127.0.0.1:8081/json')).json();
  const page = pages.find(p => p.description?.includes('com.natophonetics.app')) || pages.find(p => p.webSocketDebuggerUrl);
  if (!page) throw new Error('No running Hermes target');
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  const timer = setTimeout(() => { console.error('Inspector timed out'); process.exit(1); }, 10000);
  ws.on('open', () => ws.send(JSON.stringify({ id: 1, method: 'Runtime.evaluate', params: { expression, returnByValue: true, awaitPromise: true } })));
  ws.on('message', bytes => {
    const response = JSON.parse(bytes.toString());
    if (response.id !== 1) return;
    clearTimeout(timer);
    if (response.error || response.result.exceptionDetails) {
      console.error(JSON.stringify(response)); process.exitCode = 1;
    } else console.log(JSON.stringify(response.result.result.value));
    ws.close();
  });
  ws.on('error', error => { console.error(error.message); process.exit(1); });
})().catch(error => { console.error(error); process.exit(1); });
