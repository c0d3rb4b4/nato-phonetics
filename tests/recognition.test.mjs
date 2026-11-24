import assert from 'node:assert/strict';
import test from 'node:test';
import { createPlaybackController } from '../src/lib/playbackController.js';
import { createRecognitionController } from '../src/lib/recognitionController.js';
import { getSpokenPracticeSupport } from '../src/lib/spokenPracticeSupport.js';
import { createQuizSession, quizActionGuard, submitQuizAnswer } from '../src/lib/quizSession.js';

const tick = () => new Promise(resolve => setImmediate(resolve));

test('spoken practice distinguishes the Android 12 factory from older Android and other platforms', () => {
  for (const Version of [24, 30]) {
    const support = getSpokenPracticeSupport({ OS: 'android', Version });
    assert.equal(support.eligible, false);
    assert.match(support.versionNotice, /Android 12 or later/);
  }
  for (const Version of [31, 36]) {
    assert.deepEqual(getSpokenPracticeSupport({ OS: 'android', Version }), { eligible: true, versionNotice: '' });
  }
  for (const OS of ['ios', 'web']) {
    assert.deepEqual(getSpokenPracticeSupport({ OS, Version: '36' }), { eligible: false, versionNotice: '' });
  }
});

function fixture(overrides = {}, timeout) {
  const final = Promise.withResolvers();
  const starts = [], stops = [], cancels = [], statuses = [], drafts = [];
  const provider = {
    available: async () => true, hasPermission: async () => true,
    requestPermission: async () => { throw Error('unexpected permission prompt'); },
    silencePlayback: async () => {}, start: id => { starts.push(id); return final.promise; },
    stop: id => stops.push(id), cancel: id => cancels.push(id), ...overrides,
  };
  const control = createRecognitionController(provider, update => statuses.push(update), timeout);
  return { control, starts, stops, cancels, statuses, drafts, final, start: () => control.start(value => drafts.push(value)) };
}

test('recording can start without a synthesis engine, but waits for an active utterance to stop', async () => {
  let calls = 0, started = false;
  const ack = Promise.withResolvers();
  const playback = createPlaybackController({
    stop: async () => { if (++calls === 2) await ack.promise; },
    speak: () => { started = true; },
  });
  await playback.stopForRecording();
  assert.equal(calls, 0);
  const playing = playback.play('sample', [{ text: 'sample' }]);
  await tick(); assert.ok(started);
  let silent = false;
  const stopping = playback.stopForRecording().then(() => { silent = true; });
  await tick(); assert.equal(silent, false);
  ack.resolve(); await stopping;
  assert.equal((await playing).status, 'cancelled');
  assert.equal(silent, true);
});

test('permission is requested on use and granting is separate from opening the microphone', async () => {
  let prompts = 0;
  const f = fixture({ hasPermission: async () => false, requestPermission: async () => {
    prompts++; f.control.background(); return prompts === 1 ? 'denied' : 'granted';
  } });
  assert.equal(prompts, 0);
  await f.start();
  assert.match(f.statuses.at(-1).message, /access is off/);
  await f.start();
  assert.match(f.statuses.at(-1).message, /Microphone enabled/);
  assert.equal(prompts, 2);
  assert.deepEqual(f.starts, []);
});

test('missing engines skip permission, playback stop failure prevents capture', async () => {
  for (const [overrides, message] of [[{ available: async () => false }, /unavailable/],
    [{ silencePlayback: async () => { throw Error(); } }, /Recording failed/]]) {
    const f = fixture(overrides); await f.start();
    assert.deepEqual(f.starts, []);
    assert.match(f.statuses.at(-1).message, message);
  }
});

test('only the current ready event can record, Stop waits for the owned editable result', async () => {
  const f = fixture(), pending = f.start(); await tick();
  await f.start();
  assert.equal(f.starts.length, 1);
  f.control.event('old', 'recording');
  assert.equal(f.statuses.at(-1).state, 'starting');
  f.control.event(f.starts[0], 'recording'); f.control.stop(); f.control.stop();
  f.control.event(f.starts[0], 'recording');
  assert.equal(f.statuses.at(-1).state, 'processing');
  assert.deepEqual(f.stops, f.starts);
  f.final.resolve('Alfa'); await pending;
  assert.deepEqual(f.drafts, ['Alfa']);
  assert.equal(f.statuses.at(-1).state, 'idle');
});

test('backgrounding, editing or leaving discards late callbacks and releases an owned capture', async () => {
  for (const action of ['background', 'cancel']) {
    const f = fixture(), pending = f.start(); await tick();
    f.control[action](); f.control.event(f.starts[0], 'recording');
    f.final.resolve('old'); await pending;
    assert.deepEqual(f.cancels, f.starts);
    assert.deepEqual(f.drafts, []);
    assert.equal(f.statuses.at(-1).state, 'idle');
  }
  const access = Promise.withResolvers();
  const f = fixture({ hasPermission: () => access.promise });
  const pending = f.start(); await tick(); f.control.cancel(); access.resolve(true); await pending;
  assert.deepEqual(f.starts, []);
});

test('timeout releases capture and a late result cannot replace a retry', async () => {
  const f = fixture({}, 10), pending = f.start(); await tick();
  await new Promise(r => setTimeout(r, 25));
  assert.match(f.statuses.at(-1).message, /timed out/);
  assert.deepEqual(f.cancels, f.starts);
  f.final.resolve('stale'); await pending;
  assert.deepEqual(f.drafts, []);
});

test('a stale final cannot clear or replace a later live recording', async () => {
  const calls = [], answers = [];
  const f = fixture({ start: id => {
    const completion = Promise.withResolvers();
    calls.push({ id, completion });
    return completion.promise;
  } });
  const first = f.control.start(value => answers.push(value)); await tick();
  f.control.cancel();
  const second = f.control.start(value => answers.push(value)); await tick();
  f.control.event(calls[1].id, 'recording');
  calls[0].completion.resolve('old'); await first;
  assert.equal(f.statuses.at(-1).state, 'recording');
  assert.deepEqual(answers, []);
  calls[1].completion.resolve('new'); await second;
  assert.deepEqual(answers, ['new']);
});

test('model loss, revoked permission, busy, silence and overlong results leave typed fallback', async () => {
  for (const [code, message] of [['language', /model/], ['permission', /permission|access/], ['busy', /busy/],
    ['silence', /No code word/], ['audio', /Recording failed/]]) {
    const f = fixture(), pending = f.start(); await tick();
    f.final.reject({ code }); await pending;
    assert.match(f.statuses.at(-1).message, message);
    assert.deepEqual(f.drafts, []);
  }
  const f = fixture(), pending = f.start(); await tick(); f.final.resolve('a'.repeat(81)); await pending;
  assert.deepEqual(f.drafts, []);
});

test('recognized drafts do not score until explicit edited submission, with normal aliases and guard', async () => {
  const session = createQuizSession({ mode: 'spoken', symbols: ['A'], length: 1 });
  const f = fixture(), pending = f.start(); await tick(); f.final.resolve('wrong'); await pending;
  assert.deepEqual(session.attempts, []);
  assert.deepEqual(session.questions[0].options, []);
  const guard = quizActionGuard(session);
  const submitted = submitQuizAnswer(session, guard, 'Alpha');
  assert.equal(submitted.attempts[0].correct, true);
  assert.equal(submitQuizAnswer(submitted, guard, f.drafts[0]), submitted);
});
