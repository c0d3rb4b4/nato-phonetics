import assert from 'node:assert/strict';
import test, { beforeEach } from 'node:test';
import { setImmediate as tick } from 'node:timers/promises';
import { createPlaybackController } from '../src/lib/playbackController.js';
import { createVoicePreparation, normalizeEnglishVoices } from '../src/lib/audioVoices.js';
import { createBrowserSpeechAdapter, loadBrowserVoices } from '../src/lib/browserSpeech.js';
import { NATO_ALPHABET, NATO_NUMBERS } from '../src/data/natoData.js';

const AB = [{ text: 'Alfa' }, { text: 'Bravo' }];
// Keep promise/provider ordering real while advancing deadlines explicitly.
// Native builds can suspend this process beyond a short wall-clock fixture
// timeout; that is not a playback failure. Each test resets its own clock.
beforeEach(context => context.mock.timers.enable({ apis: ['setTimeout'] }));
const deferred = () => {
  let resolve;
  let reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
};
function fixture(prepare, overrides = {}, config = {}) {
  const spoken = [];
  let stops = 0;
  const controller = createPlaybackController({
    speak(text, callbacks) { spoken.push({ text, callbacks }); },
    stop() { stops += 1; },
    ...overrides,
  }, prepare, config);
  return { controller, spoken, stops: () => stops };
}
function browserFixture() {
  let voices = [];
  const listeners = new Set();
  const utterances = [];
  let stops = 0;
  const synthesis = {
    getVoices: () => voices,
    addEventListener: (_, listener) => listeners.add(listener),
    removeEventListener: (_, listener) => listeners.delete(listener),
    speak: utterance => utterances.push(utterance),
    cancel: () => { stops += 1; },
  };
  class Utterance { constructor(text) { this.text = text; this.voice = null; } }
  return {
    synthesis, Utterance, listeners, utterances, stops: () => stops,
    voices(next) { voices = next; for (const listener of [...listeners]) listener(); },
  };
}

test('all 36 canonical entries have intentional provider text; special digits never send ordinary words', () => {
  assert.deepEqual(NATO_ALPHABET.map(entry => entry.speechText), [
    'Alfa', 'Bravo', 'Charlie', 'Delta', 'Echo', 'Foxtrot', 'Golf', 'Hotel', 'India', 'Juliet',
    'Kilo', 'Lima', 'Mike', 'November', 'Oscar', 'Papa', 'keh beck', 'Romeo', 'Sierra', 'Tango',
    'Uniform', 'Victor', 'Whiskey', 'X-ray', 'Yankee', 'Zulu',
  ]);
  assert.deepEqual(NATO_NUMBERS.map(entry => entry.speechText), ['Zero', 'One', 'Two', 'tree', 'fower', 'fife', 'Six', 'Seven', 'Eight', 'niner']);
  assert.equal(NATO_ALPHABET[9].word, 'Juliett');
  assert.equal(NATO_NUMBERS[3].word, 'Three');
});

test('a rapid AB replacement cancels old remaining words and ignores late duplicate callbacks', async () => {
  const { controller, spoken } = fixture();
  const first = controller.play('converter', AB, { pauseMs: 0 });
  await tick();
  const old = spoken[0];
  const second = controller.play('converter', AB, { pauseMs: 0 });
  assert.deepEqual(await first, { status: 'cancelled' });
  await tick();
  old.callbacks.onDone();
  old.callbacks.onStopped();
  await tick();
  assert.deepEqual(spoken.map(item => item.text), ['Alfa', 'Alfa']);
  spoken[1].callbacks.onDone();
  await tick();
  spoken[2].callbacks.onDone();
  assert.deepEqual(await second, { status: 'completed' });
  assert.deepEqual(spoken.map(item => item.text), ['Alfa', 'Alfa', 'Bravo']);
});

test('latest request wins even when stop and preparation are still pending', async () => {
  const gate = deferred();
  const { controller, spoken } = fixture(async () => { await gate.promise; return {}; });
  const first = controller.play('first', AB);
  await tick();
  const second = controller.play('second', [{ text: 'Charlie' }]);
  assert.equal((await first).status, 'cancelled');
  gate.resolve();
  await tick();
  assert.deepEqual(spoken.map(item => item.text), ['Charlie']);
  spoken[0].callbacks.onDone();
  assert.equal((await second).status, 'completed');
});

test('Stop during preparation prevents any later speech and resolves before preparation', async () => {
  const gate = deferred();
  const { controller, spoken } = fixture(async () => { await gate.promise; return {}; });
  const result = controller.play('screen', AB);
  await tick();
  await controller.stop('screen');
  assert.equal((await result).status, 'cancelled');
  gate.resolve();
  await tick();
  assert.equal(spoken.length, 0);
});

test('Stop cancels a pending inter-word pause and an unrelated owner cannot stop current playback', async context => {
  const { controller, spoken } = fixture();
  const result = controller.play('converter', AB, { pauseMs: 20 });
  await tick();
  await controller.stop('old-screen');
  assert.equal(controller.getSnapshot().status, 'playing');
  spoken[0].callbacks.onDone();
  await tick();
  assert.equal(controller.getSnapshot().status, 'paused');
  await controller.stop('converter');
  assert.equal((await result).status, 'cancelled');
  context.mock.timers.tick(30);
  await tick();
  assert.equal(spoken.length, 1);
});

test('provider stopped, error and synchronous throw produce distinct terminal results', async () => {
  for (const callback of ['onStopped', 'onError']) {
    const { controller, spoken } = fixture();
    const result = controller.play('quiz', AB);
    await tick();
    spoken[0].callbacks[callback](new Error('private entered text is not exposed'));
    const outcome = await result;
    assert.equal(outcome.status, callback === 'onStopped' ? 'cancelled' : 'failed');
    if (outcome.status === 'failed') assert.doesNotMatch(outcome.error.message, /private entered text/);
    spoken[0].callbacks.onDone();
    await tick();
    assert.equal(spoken.length, 1);
  }
  const { controller } = fixture(undefined, { speak() { throw new Error('engine missing'); } });
  assert.equal((await controller.play('quiz', AB)).status, 'failed');
});

test('missing completion times out, settles once and clears provider queue', async context => {
  const { controller, spoken, stops } = fixture(undefined, {}, { utteranceTimeoutMs: 10 });
  const pending = controller.play('quiz', AB);
  await tick();
  context.mock.timers.tick(9);
  await tick();
  assert.equal(controller.getSnapshot().status, 'playing');
  context.mock.timers.tick(1);
  const result = await pending;
  assert.equal(result.status, 'failed');
  assert.match(result.error.message, /completion/);
  spoken[0].callbacks.onDone();
  await tick();
  assert.equal(spoken.length, 1);
  assert.equal(controller.getSnapshot().result, result);
  assert.equal(stops(), 2);
});

test('asynchronous stop is awaited before speech starts', async () => {
  const gate = deferred();
  const { controller, spoken } = fixture(undefined, { stop: () => gate.promise });
  const result = controller.play('screen', [{ text: 'Alfa' }]);
  await tick();
  assert.equal(spoken.length, 0);
  gate.resolve();
  await tick();
  assert.equal(spoken.length, 1);
  spoken[0].callbacks.onDone();
  assert.equal((await result).status, 'completed');
});

test('timed-out raw stop remains a barrier; retry cannot start before its late settlement', async context => {
  const gate = deferred();
  let calls = 0;
  const { controller, spoken } = fixture(undefined, { stop: () => ++calls === 1 ? gate.promise : undefined }, { stopTimeoutMs: 10 });
  const first = controller.play('first', AB);
  await tick();
  context.mock.timers.tick(10);
  assert.equal((await first).status, 'failed');
  const retry = controller.play('retry', AB);
  await tick();
  context.mock.timers.tick(10);
  assert.equal((await retry).status, 'failed');
  assert.equal(calls, 1);
  assert.equal(spoken.length, 0);
  gate.resolve();
  await tick();
  assert.equal(spoken.length, 0);
  const recovered = controller.play('recovered', [{ text: 'Charlie' }]);
  await tick();
  assert.equal(spoken.length, 1);
  spoken[0].callbacks.onDone();
  assert.equal((await recovered).status, 'completed');
});

test('rejected stop fails safely; later successful stop permits recovery', async () => {
  let reject = true;
  const { controller, spoken } = fixture(undefined, { stop: () => reject ? Promise.reject(new Error('stop failed')) : undefined });
  assert.equal((await controller.play('screen', AB)).status, 'failed');
  assert.equal(spoken.length, 0);
  reject = false;
  const recovered = controller.play('screen', [{ text: 'Bravo' }]);
  await tick();
  spoken[0].callbacks.onDone();
  assert.equal((await recovered).status, 'completed');
});

test('preparation failure/timeout permit default speech with visible warning and rate/progress', async context => {
  for (const prepare of [async () => { throw new Error('storage'); }, () => new Promise(() => {})]) {
    const { controller, spoken } = fixture(prepare, {}, { preparationTimeoutMs: 5 });
    const snapshots = [];
    const unsubscribe = controller.subscribe(() => snapshots.push(controller.getSnapshot()));
    const result = controller.play('sound-test', [{ text: 'tree' }], { rate: 0.7 });
    await tick();
    context.mock.timers.tick(5);
    await tick();
    assert.equal(spoken[0].callbacks.voice, undefined);
    assert.equal(spoken[0].callbacks.rate, 0.7);
    assert.equal(controller.getSnapshot().tokenIndex, 0);
    assert.match(controller.getSnapshot().warning, /Default/);
    spoken[0].callbacks.onDone();
    assert.equal((await result).status, 'completed');
    assert.equal(snapshots.at(-1).status, 'idle');
    unsubscribe();
  }
});

test('English normalization retains mixed quality, canonicalizes locales, groups and deduplicates', () => {
  const voices = normalizeEnglishVoices([
    { identifier: 'us', name: 'Z', language: 'EN_us', quality: 'Default' },
    { identifier: 'gb-default', name: 'A', language: 'en_GB', quality: 'Default' },
    { identifier: 'fr', name: 'French', language: 'fr-FR', quality: 'Enhanced' },
    { identifier: 'gb-enhanced', name: 'Z', language: 'EN-gb', quality: 'Enhanced' },
    { identifier: 'gb-default', name: 'duplicate', language: 'en-GB', quality: 'Default' },
    { identifier: 'generic', name: 'English', language: 'en', quality: 'Default' },
    { identifier: 'iso-english', name: 'ISO English', language: 'eng', quality: 'Default' },
    { identifier: 'not-english', name: 'Esperanto', language: 'eo', quality: 'Default' },
  ]);
  assert.deepEqual(voices.map(voice => voice.identifier), ['generic', 'iso-english', 'gb-enhanced', 'gb-default', 'us']);
  assert.deepEqual(voices.map(voice => voice.language), ['en', 'en', 'en-GB', 'en-GB', 'en-US']);
});

test('voice preparation covers saved, removed, failing storage/listing, explicit default and selected preview', async context => {
  const voices = [{ identifier: 'saved', name: 'Voice', language: 'en-US', quality: 'Default' }];
  let reads = 0;
  const prepare = createVoicePreparation({ readSelectedVoice: async () => { reads += 1; return 'saved'; }, loadVoices: async () => voices }, 10);
  assert.equal((await prepare({})).voice, 'saved');
  assert.equal((await prepare({ voice: null })).voice, undefined);
  assert.equal(reads, 1);
  assert.equal((await prepare({ voice: 'saved' })).language, 'en-US');
  assert.match((await prepare({ voice: 'removed' })).warning, /no longer available/);
  for (const read of [async () => { throw new Error('storage'); }, () => new Promise(() => {})]) {
    const fallback = createVoicePreparation({ readSelectedVoice: read, loadVoices: async () => voices }, 5);
    const result = fallback({});
    await tick();
    context.mock.timers.tick(5);
    assert.match((await result).warning, /Default/);
  }
  const failedLookup = createVoicePreparation({ readSelectedVoice: async () => 'saved', loadVoices: async () => { throw new Error('engine'); } });
  assert.match((await failedLookup({})).warning, /could not be checked/);
});

test('browser voice enumeration supports delayed, empty, rejected and overlapping loads with listener cleanup', async context => {
  const browser = browserFixture();
  const first = loadBrowserVoices(browser.synthesis, 20);
  const second = loadBrowserVoices(browser.synthesis, 20);
  assert.equal(browser.listeners.size, 2);
  browser.voices([{ voiceURI: 'voice', name: 'English', lang: 'en_GB', localService: false }]);
  assert.equal((await first)[0].identifier, 'voice');
  assert.equal((await second)[0].localService, false);
  assert.equal(browser.listeners.size, 0);
  browser.voices([]);
  const empty = loadBrowserVoices(browser.synthesis, 5);
  context.mock.timers.tick(5);
  assert.deepEqual(await empty, []);
  assert.equal(browser.listeners.size, 0);
  browser.synthesis.getVoices = () => { throw new Error('not supported'); };
  await assert.rejects(loadBrowserVoices(browser.synthesis, 5), /could not be loaded/);
  assert.equal(browser.listeners.size, 0);
});

test('browser selected voice speech starts synchronously; Stop detaches old callbacks and prevents enumeration resurrection', async () => {
  const browser = browserFixture();
  const adapter = createBrowserSpeechAdapter(browser);
  const prepare = createVoicePreparation({ readSelectedVoice: async () => 'voice', loadVoices: () => loadBrowserVoices(browser.synthesis, 20) });
  const controller = createPlaybackController(adapter, prepare);
  const cancelled = controller.play('preview', [{ text: 'Alfa' }]);
  await tick();
  await controller.stop('preview');
  browser.voices([{ voiceURI: 'voice', name: 'Voice', lang: 'en-GB', localService: true }]);
  assert.equal((await cancelled).status, 'cancelled');
  await tick();
  assert.equal(browser.utterances.length, 0);
  const next = controller.play('preview', [{ text: 'Bravo' }]);
  await tick();
  assert.equal(browser.utterances[0].voice.voiceURI, 'voice');
  assert.equal(browser.utterances[0].text, 'Bravo');
  await controller.stop('preview');
  assert.equal((await next).status, 'cancelled');
  assert.equal(browser.utterances[0].onend, null);
});

test('browser error and interruption map to failed/cancelled without continuing the sequence', async () => {
  for (const [error, expected] of [['network', 'failed'], ['interrupted', 'cancelled']]) {
    const browser = browserFixture();
    const controller = createPlaybackController(createBrowserSpeechAdapter(browser));
    const result = controller.play('browser', AB);
    await tick();
    browser.utterances[0].onerror({ error });
    assert.equal((await result).status, expected);
    await tick();
    assert.equal(browser.utterances.length, 1);
  }
});

test('browser default speech works without enumerated voices, including a failing voice-list API', async () => {
  for (const throws of [false, true]) {
    const browser = browserFixture();
    browser.synthesis.getVoices = () => { if (throws) throw new Error('enumeration denied'); return []; };
    const prepare = createVoicePreparation({
      readSelectedVoice: async () => throws ? 'removed' : null,
      loadVoices: () => loadBrowserVoices(browser.synthesis, 5),
    });
    const controller = createPlaybackController(createBrowserSpeechAdapter(browser), prepare);
    const result = controller.play('default', [{ text: 'Alfa' }]);
    await tick();
    assert.equal(browser.utterances.length, 1);
    assert.equal(browser.utterances[0].voice, null);
    browser.utterances[0].onend();
    assert.equal((await result).status, 'completed');
  }
});

test('a failed explicit Stop reports provider uncertainty without starting further words', async () => {
  let fail = false;
  const { controller, spoken } = fixture(undefined, { stop() { if (fail) throw new Error('provider unavailable'); } });
  const result = controller.play('screen', AB);
  await tick();
  fail = true;
  await controller.stop('screen');
  assert.equal((await result).status, 'cancelled');
  assert.equal(spoken.length, 1);
  assert.equal(controller.getSnapshot().result.status, 'failed');
  assert.match(controller.getSnapshot().result.error.message, /did not confirm Stop/);
});


test('voice browsing intersects search/locale, preserves provider order and leaves saved selection independent', async () => {
  const { filterEnglishVoices } = await import('../src/lib/audioVoices.js');
  const voices = [
    { identifier: 'a', name: 'Sérène', language: 'en-GB', quality: 'Enhanced' },
    { identifier: 'b', name: 'Default American', language: 'en-US', quality: 'Default' },
    { identifier: 'c', name: 'British Compact', language: 'en-GB', quality: 'Default' },
  ];
  const before = JSON.stringify(voices);
  assert.deepEqual(filterEnglishVoices(voices, '  SERENE ', 'en_GB').map(v => v.identifier), ['a']);
  assert.deepEqual(filterEnglishVoices(voices, 'default', '').map(v => v.identifier), ['b', 'c']);
  assert.deepEqual(filterEnglishVoices(voices, 'en-gb', '').map(v => v.identifier), ['a', 'c']);
  assert.deepEqual(filterEnglishVoices(voices, 'American', 'en-GB'), []);
  assert.deepEqual(filterEnglishVoices(voices, '', ''), voices);
  assert.equal(JSON.stringify(voices), before);
});
