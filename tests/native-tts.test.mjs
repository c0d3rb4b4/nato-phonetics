import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { createNativeTtsAdapter } from '../src/lib/nativeTtsAdapter.js';
import { createPlaybackController } from '../src/lib/playbackController.js';

function fixture(platform = 'android') {
  const listeners = new Map();
  const calls = [];
  const emit = (kind, utteranceId) => { for (const callback of listeners.get(kind) ?? []) callback({ utteranceId }); };
  const provider = {
    getInitStatus: async () => {}, voices: async () => [],
    setDefaultLanguage: async value => { calls.push(['language', value]); },
    setDefaultVoice: async value => { calls.push(['voice', value]); },
    setDefaultRate: async (...value) => { calls.push(['rate', ...value]); },
    speak: async text => { calls.push(['speak', text]); return 7; },
    stop: async () => { calls.push(['stop']); },
    addListener(kind, callback) {
      if (!listeners.has(kind)) listeners.set(kind, new Set());
      listeners.get(kind).add(callback);
      return { remove: () => listeners.get(kind).delete(callback) };
    },
  };
  const outcomes = [];
  const options = { rate: 1, onDone: () => outcomes.push('done'), onStopped: () => outcomes.push('stopped'), onError: () => outcomes.push('error') };
  return { provider, calls, emit, listeners, outcomes, options, adapter: createNativeTtsAdapter(provider, platform) };
}

test('native completion correlates utterance IDs and removes listeners exactly once', async () => {
  const f = fixture();
  await f.adapter.speak('Alfa', f.options);
  f.emit('tts-finish', 'old');
  assert.deepEqual(f.outcomes, []);
  f.emit('tts-finish', '7');
  f.emit('tts-error', 7);
  assert.deepEqual(f.outcomes, ['done']);
  assert.ok([...f.listeners.values()].every(set => set.size === 0));
});

test('native terminal event before speak promise resolves is retained', async () => {
  const f = fixture();
  f.provider.speak = async () => { f.emit('tts-finish', 7); return 7; };
  await f.adapter.speak('Alfa', f.options);
  assert.deepEqual(f.outcomes, ['done']);
});

test('Stop during native initialization prevents late utterance and serializes provider stop', async () => {
  const f = fixture();
  let ready;
  const initialized = new Promise(resolve => { ready = resolve; });
  f.provider.getInitStatus = () => initialized;
  const speaking = f.adapter.speak('Alfa', f.options);
  await new Promise(resolve => setImmediate(resolve));
  const stopped = f.adapter.stop();
  ready();
  await Promise.all([speaking, stopped]);
  assert.deepEqual(f.calls, [['stop']]);
});

test('first playback waits for native initialization before its stop barrier and then completes', async () => {
  const f = fixture();
  let ready;
  let initialized = false;
  const initialization = new Promise(resolve => { ready = resolve; });
  f.provider.getInitStatus = () => initialization;
  f.provider.stop = async () => {
    f.calls.push(['stop']);
    assert.equal(initialized, true, 'Android rejects Stop before OnInit');
  };
  f.provider.speak = async text => {
    f.calls.push(['speak', text]);
    queueMicrotask(() => f.emit('tts-finish', 7));
    return 7;
  };
  const playback = createPlaybackController(f.adapter, async () => ({ language: 'en-GB' }));
  const result = playback.play('cold-start', [{ text: 'Alfa' }]);
  await new Promise(resolve => setImmediate(resolve));
  assert.deepEqual(f.calls, [], 'No native Stop or utterance before readiness');
  initialized = true;
  ready();
  assert.equal((await result).status, 'completed');
  assert.deepEqual(f.calls.filter(call => ['stop', 'speak'].includes(call[0])), [['stop'], ['speak', 'Alfa']]);
});

test('Android Stop failure rejects while an idle iOS Stop remains safe', async () => {
  const android = fixture('android');
  android.provider.stop = async () => false;
  await assert.rejects(android.adapter.stop(), /Device speech could not be stopped/);
  android.provider.stop = async () => true;
  await android.adapter.stop();
  const ios = fixture('ios');
  ios.provider.stop = async () => false;
  await ios.adapter.stop();
});

test('Stop removes subscriptions; stale native events cannot finish next utterance', async () => {
  const f = fixture();
  await f.adapter.speak('Alfa', f.options);
  await f.adapter.stop();
  f.emit('tts-finish', 7);
  assert.deepEqual(f.outcomes, ['stopped']);
  f.provider.speak = async () => 8;
  await f.adapter.speak('Bravo', f.options);
  f.emit('tts-finish', 7);
  assert.deepEqual(f.outcomes, ['stopped']);
  f.emit('tts-finish', 8);
  assert.deepEqual(f.outcomes, ['stopped', 'done']);
});

test('System Default resets chosen voice and rate maps intentionally per platform', async () => {
  for (const platform of ['ios', 'android']) {
    const f = fixture(platform);
    await f.adapter.speak('Alfa', { ...f.options, voice: 'custom' });
    if (platform === 'ios') assert.equal(f.listeners.has('tts-error'), false, 'iOS supports no tts-error event');
    f.emit('tts-finish', 7);
    await f.adapter.speak('Bravo', f.options);
    assert.deepEqual(f.calls.filter(call => call[0] === 'language'), [['language', 'en-GB'], ['language', 'en-GB']]);
    assert.equal(f.calls.filter(call => call[0] === 'voice').length, 1);
    assert.deepEqual(f.calls.find(call => call[0] === 'rate'), ['rate', platform === 'ios' ? 0.5 : 1, true]);
    await f.adapter.stop();
  }
});

test('installed Android provider assigns unique IDs even when identical text is replayed', () => {
  const require = createRequire(import.meta.url);
  const source = fs.readFileSync(require.resolve('react-native-tts/android/src/main/java/net/no_mad/tts/TextToSpeechModule.java'), 'utf8');
  assert.match(source, /String utteranceId = java\.util\.UUID\.randomUUID\(\)\.toString\(\);/);
  assert.doesNotMatch(source, /utterance\.hashCode\(\)/, 'Same-word replays must not reuse native event IDs');
});

test('installed iOS provider uses scalar Boolean arguments supported by native interop', () => {
  const require = createRequire(import.meta.url);
  const source = fs.readFileSync(require.resolve('react-native-tts/ios/TextToSpeech/TextToSpeech.m'), 'utf8');
  // BOOL* is encoded as ^B; TurboModule interop accepts BOOL but not BOOL*.
  // That native ABI defect made Stop fail before any utterance could start.
  assert.doesNotMatch(source, /\(BOOL\s*\*\)/);
  for (const selector of ['stop', 'pause', 'setDucking', 'skipTransform']) {
    assert.ok(source.includes(`${selector}:(BOOL)`), `${selector} must cross the bridge as a Boolean value`);
  }
});

test('native install patch is repeatable and rejects source/version drift before writing either platform', () => {
  const require = createRequire(import.meta.url);
  const { patchNativeTts } = require('../scripts/patch-native-tts.cjs');
  const installed = path.dirname(require.resolve('react-native-tts/package.json'));
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'nato-tts-patch-'));
  const android = 'android/src/main/java/net/no_mad/tts/TextToSpeechModule.java';
  const ios = 'ios/TextToSpeech/TextToSpeech.m';
  try {
    for (const relative of ['package.json', android, ios]) {
      fs.mkdirSync(path.dirname(path.join(root, relative)), { recursive: true });
      fs.copyFileSync(path.join(installed, relative), path.join(root, relative));
    }
    const packageFile = path.join(root, 'package.json');
    const before = [android, ios].map(file => fs.readFileSync(path.join(root, file), 'utf8'));
    patchNativeTts(packageFile);
    patchNativeTts(packageFile);
    assert.deepEqual([android, ios].map(file => fs.readFileSync(path.join(root, file), 'utf8')), before);
    const originalAndroid = before[0].replace('java.util.UUID.randomUUID().toString()', 'Integer.toString(utterance.hashCode())');
    fs.writeFileSync(path.join(root, android), originalAndroid);
    fs.writeFileSync(path.join(root, ios), before[1].replace('stop:(BOOL)', 'stop:(NSInteger)'));
    assert.throws(() => patchNativeTts(packageFile), /Native speech source changed/);
    assert.equal(fs.readFileSync(path.join(root, android), 'utf8'), originalAndroid, 'Failed validation must not partially patch Android');
    fs.writeFileSync(packageFile, JSON.stringify({ version: '4.1.2' }));
    assert.throws(() => patchNativeTts(packageFile), /Re-review native speech patch/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('voice enumeration excludes uninstalled voices and preserves unknown connectivity', async () => {
  const f = fixture('ios');
  f.provider.voices = async () => [
    { id: 'a', name: 'A', language: 'en-GB', quality: 500 },
    { id: 'b', name: 'B', language: 'en-US', quality: 300, networkConnectionRequired: true },
    { id: 'c', name: 'C', language: 'en-GB', quality: 300, notInstalled: true },
  ];
  assert.deepEqual(await f.adapter.voices(), [
    { identifier: 'a', name: 'A', language: 'en-GB', quality: 'Enhanced' },
    { identifier: 'b', name: 'B', language: 'en-US', quality: 'Default', localService: false },
  ]);
  const android = fixture('android');
  android.provider.voices = async () => [
    { id: 'normal', name: 'Normal', language: 'en-GB', quality: 300 },
    { id: 'high', name: 'High', language: 'en-GB', quality: 400 },
  ];
  assert.deepEqual((await android.adapter.voices()).map(voice => voice.quality), ['Default', 'Enhanced']);
});

test('native failure cleans listeners and a subsequent call can recover', async () => {
  const f = fixture();
  f.provider.speak = async () => { throw new Error('No engine'); };
  await assert.rejects(f.adapter.speak('Alfa', f.options), /No engine/);
  assert.deepEqual(f.outcomes, ['error']);
  assert.ok([...f.listeners.values()].every(set => set.size === 0));
  f.provider.speak = async () => 8;
  await f.adapter.speak('Bravo', f.options);
  f.emit('tts-finish', 8);
  assert.deepEqual(f.outcomes, ['error', 'done']);
});
