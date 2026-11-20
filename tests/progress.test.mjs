import test from 'node:test';
import assert from 'node:assert/strict';
import { applyProgressAnswer, createProgressStore, decodeProgress, EMPTY_PROGRESS, PROGRESS_KEY, progressSummary, selectProgressSymbols } from '../src/lib/progress.js';
import { createQuizSession, quizActionGuard, submitQuizAnswer } from '../src/lib/quizSession.js';
import { createPreferenceStore, PREFERENCES_KEY } from '../src/lib/preferences.js';

const DAY = 86400000, at = Date.parse('2026-03-28T23:59:59Z');
function memory(initial = {}) {
  const values = new Map(Object.entries(initial));
  return { values, getItem: async key => values.get(key) ?? null,
    setItem: async (key, value) => { values.set(key, value); },
    multiRemove: async keys => { keys.forEach(key => values.delete(key)); } };
}
const deferred = () => { let resolve; const promise = new Promise(r => { resolve = r; }); return { promise, resolve }; };

test('elapsed review intervals survive midnight, DST, leap-day and timezone boundaries', () => {
  for (const time of [at, Date.parse('2028-02-29T23:59:59Z'), Date.parse('2026-10-25T00:59:59Z')]) {
    let data = EMPTY_PROGRESS, t = time;
    for (const days of [1, 3, 7, 14, 30, 30]) {
      data = applyProgressAnswer(data, 'A', true, t);
      assert.equal(data.symbols.A.dueAt, t + days * DAY);
      assert.deepEqual(selectProgressSymbols(data, ['A', 'B'], 'due', data.symbols.A.dueAt - 1), []);
      assert.deepEqual(selectProgressSymbols(data, ['A', 'B'], 'due', data.symbols.A.dueAt), ['A']);
      t = data.symbols.A.dueAt;
    }
    data = applyProgressAnswer(data, 'A', false, t);
    assert.equal(data.symbols.A.dueAt, t); assert.equal(data.symbols.A.streak, 0);
    assert.equal(applyProgressAnswer(data, 'A', true, t).symbols.A.dueAt, t + DAY);
    assert.deepEqual(decodeProgress(JSON.stringify(data)), data);
  }
});

test('due and focused reviews are scoped; unpractised and recovered symbols stay out', () => {
  let data = applyProgressAnswer(EMPTY_PROGRESS, 'A', false, at);
  data = applyProgressAnswer(data, '3', false, at + 1);
  data = applyProgressAnswer(data, 'B', true, at);
  assert.deepEqual(selectProgressSymbols(data, ['B', 'A', 'C', '3'], 'due', at + 1), ['A', '3']);
  assert.deepEqual(selectProgressSymbols(data, ['A', 'B', 'C'], 'mistakes', at + 1), ['A']);
  data = applyProgressAnswer(data, 'A', true, at + 2);
  assert.deepEqual(selectProgressSymbols(data, ['A', 'B'], 'mistakes', at + 3), []);
  assert.deepEqual(selectProgressSymbols(data, ['A', 'B'], 'due', at - DAY), []);
  assert.deepEqual(progressSummary(data, at + 3), { attempts: 4, errors: 2, correct: 2, practised: 3, due: 1, mistakes: 1 });
});

test('first use is read-only; versioned aggregates survive a new store without response text', async () => {
  const storage = memory(), store = createProgressStore(storage, () => at);
  await store.hydrate(); assert.equal(storage.values.size, 0);
  const session = createQuizSession({ symbols: ['J'], length: 1, mode: 'typed' });
  const answered = submitQuizAnswer(session, quizActionGuard(session), 'ju liet');
  const attempt = answered.attempts[0];
  await store.record(attempt.questionId, attempt.symbol, attempt.correct);
  assert.equal(await store.record(attempt.questionId, attempt.symbol, attempt.correct), false);
  const raw = storage.values.get(PROGRESS_KEY);
  assert.equal(raw.includes('ju liet'), false); assert.equal(raw.includes('questionId'), false);
  const reloaded = createProgressStore(storage); await reloaded.hydrate();
  assert.equal(reloaded.getSnapshot().data.symbols.J.attempts, 1);
  assert.equal(reloaded.getSnapshot().data.symbols.J.errors, 0);
});

test('delayed hydration and rapid answers merge with saved totals in order', async () => {
  const initial = applyProgressAnswer(EMPTY_PROGRESS, 'A', false, at - DAY);
  const storage = memory({ [PROGRESS_KEY]: JSON.stringify(initial) }), read = deferred();
  storage.getItem = async () => { await read.promise; return JSON.stringify(initial); };
  const store = createProgressStore(storage, () => at);
  const writes = [store.record({}, 'A', true), store.record({}, 'A', false), store.record({}, '3', true)];
  read.resolve(); await Promise.all(writes);
  assert.equal(store.getSnapshot().data.symbols.A.attempts, 3);
  assert.equal(store.getSnapshot().data.symbols.A.errors, 2);
  assert.equal(store.getSnapshot().data.symbols.A.streak, 0);
  assert.equal(store.getSnapshot().data.symbols['3'].attempts, 1);
});

test('failed writes show saved totals only; Retry saves pending answers exactly once', async () => {
  const storage = memory(), original = storage.setItem;
  storage.setItem = async () => { throw new Error('disk full'); };
  const store = createProgressStore(storage, () => at);
  await store.record({}, 'A', false); await store.record({}, 'B', true);
  assert.equal(store.getSnapshot().pendingCount, 2);
  assert.equal(store.getSnapshot().error.operation, 'save');
  assert.equal(progressSummary(store.getSnapshot().data, at).attempts, 0);
  storage.setItem = original;
  await store.retry(); await store.retry();
  assert.equal(store.getSnapshot().pendingCount, 0); assert.equal(store.getSnapshot().error, null);
  assert.equal(progressSummary(decodeProgress(storage.values.get(PROGRESS_KEY)), at).attempts, 2);
});

test('corrupt/future/extra-field/invalid schema data is preserved until explicit deletion', async () => {
  const valid = applyProgressAnswer(EMPTY_PROGRESS, 'A', true, at);
  for (const raw of ['broken', 'null', '{"version":2,"symbols":{}}', JSON.stringify({ ...valid, extra: true }),
    JSON.stringify({ version: 1, symbols: { A: { ...valid.symbols.A, errors: 9 } } }),
    JSON.stringify({ version: 1, symbols: { A: { ...valid.symbols.A, dueAt: -1 } } }),
    JSON.stringify({ version: 1, symbols: { ZZZ: valid.symbols.A } })]) {
    const storage = memory({ [PROGRESS_KEY]: raw }), store = createProgressStore(storage, () => at);
    assert.equal(await store.record({}, 'B', true), false);
    assert.equal(storage.values.get(PROGRESS_KEY), raw);
    assert.equal(store.getSnapshot().pendingCount, 1); assert.equal(store.getSnapshot().error.operation, 'load');
    await store.retry(); assert.equal(storage.values.get(PROGRESS_KEY), raw);
    await store.clear(); await store.retry();
    assert.equal(storage.values.has(PROGRESS_KEY), false); assert.equal(store.getSnapshot().pendingCount, 0);
    await store.record({}, '3', false); assert.deepEqual(Object.keys(store.getSnapshot().data.symbols), ['3']);
  }
});

test('transient read failure recovers saved data plus pending answers without overwriting it', async () => {
  const initial = applyProgressAnswer(EMPTY_PROGRESS, 'J', true, at);
  const storage = memory({ [PROGRESS_KEY]: JSON.stringify(initial) }), read = storage.getItem;
  storage.getItem = async () => { throw new Error('unavailable'); };
  const store = createProgressStore(storage, () => at);
  await store.record({}, '3', false); assert.equal(store.getSnapshot().error.operation, 'load');
  storage.getItem = read; await store.retry();
  assert.equal(store.getSnapshot().data.symbols.J.attempts, 1);
  assert.equal(store.getSnapshot().data.symbols['3'].errors, 1);
});

test('Clear orders after an in-flight write and before later answers; old retries cannot resurrect it', async () => {
  const storage = memory(), write = storage.setItem, blocked = deferred();
  storage.setItem = async (key, value) => { await blocked.promise; await write(key, value); };
  const store = createProgressStore(storage, () => at), id = {};
  const first = store.record(id, 'A', false), clear = store.clear(), later = store.record({}, 'B', true);
  blocked.resolve(); await Promise.all([first, clear, later]);
  await store.retry(); await store.record(id, 'A', false);
  assert.deepEqual(Object.keys(store.getSnapshot().data.symbols), ['B']);
  assert.deepEqual(decodeProgress(storage.values.get(PROGRESS_KEY)), store.getSnapshot().data);
});

test('failed Clear retains saved and pending data and can be retried separately', async () => {
  const storage = memory(), remove = storage.multiRemove, set = storage.setItem;
  const store = createProgressStore(storage, () => at);
  await store.record({}, 'A', true);
  storage.setItem = async () => { throw new Error('full'); };
  await store.record({}, 'B', false);
  storage.multiRemove = async () => { throw new Error('locked'); };
  assert.equal(await store.clear(), false); assert.equal(store.getSnapshot().pendingCount, 1);
  assert.equal(store.getSnapshot().data.symbols.A.attempts, 1); assert.equal(store.getSnapshot().error.operation, 'clear');
  storage.multiRemove = remove; storage.setItem = set; await store.clear(); await store.retry();
  assert.equal(storage.values.has(PROGRESS_KEY), false); assert.equal(store.getSnapshot().pendingCount, 0);
});

test('Reset Preferences and Clear Progress have separate storage scopes including legacy keys', async () => {
  const storage = memory({ other: 'keep', darkMode: 'true', selectedVoice: 'voice' });
  const prefs = createPreferenceStore(storage), store = createProgressStore(storage, () => at);
  await store.record({}, '3', false); const saved = storage.values.get(PROGRESS_KEY);
  await prefs.hydrate(); await prefs.reset(); assert.equal(storage.values.get(PROGRESS_KEY), saved);
  const settings = storage.values.get(PREFERENCES_KEY); await store.clear();
  assert.equal(storage.values.get(PREFERENCES_KEY), settings); assert.equal(storage.values.get('other'), 'keep');
  assert.equal(storage.values.has(PROGRESS_KEY), false);
});

function coordinated(storage) {
  let queue = Promise.resolve();
  let sequence = 0;
  return {
    run(work) { const next = queue.then(work); queue = next.catch(() => {}); return next; },
    generation: () => decodeProgress(storage.values.get(PROGRESS_KEY) ?? null).generation,
    async clear() {
      const data = { ...EMPTY_PROGRESS, generation: `00000000-0000-4000-8000-${String(++sequence).padStart(12, '0')}` };
      await storage.setItem(PROGRESS_KEY, JSON.stringify(data)); return data;
    },
  };
}

test('coordinated stores merge interleaved and simultaneous submissions from fresh persisted totals', async () => {
  const storage = memory(), coordination = coordinated(storage);
  const a = createProgressStore(storage, () => at, coordination), b = createProgressStore(storage, () => at, coordination);
  await Promise.all([a.hydrate(), b.hydrate()]);
  await Promise.all([a.record({}, 'A', true), b.record({}, 'A', false), a.record({}, '3', true), b.record({}, 'B', true)]);
  await Promise.all([a.refresh(), b.refresh()]);
  assert.deepEqual(a.getSnapshot().data, b.getSnapshot().data);
  assert.equal(progressSummary(a.getSnapshot().data, at).attempts, 4);
  assert.equal(a.getSnapshot().data.symbols.A.errors, 1);
});

test('cross-window deletion invalidates a suspended failed Retry; new answers count without an event', async () => {
  const storage = memory(), coordination = coordinated(storage), set = storage.setItem;
  const a = createProgressStore(storage, () => at, coordination), b = createProgressStore(storage, () => at, coordination);
  await Promise.all([a.hydrate(), b.hydrate()]);
  await b.record({}, 'A', true);
  storage.setItem = async () => { throw new Error('full'); };
  await b.record({}, 'B', false); assert.equal(b.getSnapshot().pendingCount, 1);
  storage.setItem = set;
  await a.clear(); // b receives no storage event, focus or refresh.
  const tombstone = storage.values.get(PROGRESS_KEY);
  await b.retry(); await b.retry();
  assert.equal(storage.values.get(PROGRESS_KEY), tombstone);
  assert.equal(b.getSnapshot().pendingCount, 0);
  assert.equal(progressSummary(b.getSnapshot().data, at).attempts, 0);
  await a.clear(); // Again no refresh in b before a newly submitted answer.
  await b.record({}, '3', true);
  assert.deepEqual(Object.keys(decodeProgress(storage.values.get(PROGRESS_KEY)).symbols), ['3']);
});

test('failed atomic deletion preserves saved and pending answers, generation and preferences', async () => {
  const storage = memory({ other: 'keep' }), coordination = coordinated(storage), set = storage.setItem;
  const a = createProgressStore(storage, () => at, coordination), b = createProgressStore(storage, () => at, coordination);
  await a.record({}, 'A', true); await b.hydrate();
  const saved = storage.values.get(PROGRESS_KEY);
  storage.setItem = async () => { throw new Error('full'); };
  await b.record({}, 'B', false); assert.equal(await a.clear(), false);
  assert.equal(storage.values.get(PROGRESS_KEY), saved);
  storage.setItem = set; await b.retry();
  assert.equal(progressSummary(decodeProgress(storage.values.get(PROGRESS_KEY)), at).attempts, 2);
  assert.equal(storage.values.get('other'), 'keep');
});

test('coordination rejection keeps pending answers and supports Retry without a duplicate', async () => {
  const storage = memory(), coordination = coordinated(storage), run = coordination.run;
  const store = createProgressStore(storage, () => at, coordination);
  await store.hydrate(); coordination.run = async () => { throw new Error('lock timeout'); };
  assert.equal(await store.record({}, 'J', true), false);
  assert.equal(store.getSnapshot().pendingCount, 1); assert.equal(storage.values.size, 0);
  coordination.run = run; await store.retry(); await store.retry();
  assert.equal(decodeProgress(storage.values.get(PROGRESS_KEY)).symbols.J.attempts, 1);
});

test('generation extension reads older records without rewriting and rejects malformed tombstones', () => {
  const old = JSON.stringify(applyProgressAnswer(EMPTY_PROGRESS, 'A', true, at));
  assert.equal(decodeProgress(old).generation, undefined);
  for (const generation of ['', 'garbage', 1, null, '00000000-0000-0000-0000-000000000000']) {
    assert.throws(() => decodeProgress(JSON.stringify({ ...EMPTY_PROGRESS, generation })));
  }
  const data = { ...EMPTY_PROGRESS, generation: '00000000-0000-4000-8000-000000000001' };
  assert.equal(applyProgressAnswer(decodeProgress(JSON.stringify(data)), 'A', true, at).generation, data.generation);
});

test('unreadable generation never silently discards or restores an uncertain pending answer', async () => {
  const storage = memory(), coordination = coordinated(storage), set = storage.setItem;
  const a = createProgressStore(storage, () => at, coordination);
  await a.clear(); await a.record({}, 'A', true);
  const saved = storage.values.get(PROGRESS_KEY), get = storage.getItem, generation = coordination.generation;
  storage.getItem = async () => { throw new Error('storage blocked'); };
  coordination.generation = () => { throw new Error('storage blocked'); };
  const b = createProgressStore(storage, () => at, coordination);
  assert.equal(await b.record({}, 'B', false), false); assert.equal(b.getSnapshot().pendingCount, 1);
  storage.getItem = get; coordination.generation = generation;
  await b.retry(); await b.refresh();
  assert.equal(b.getSnapshot().pendingCount, 1);
  assert.equal(storage.values.get(PROGRESS_KEY), saved);
  assert.match(b.getSnapshot().error.message, /could not be linked/);
  storage.setItem = set; await b.clear(); await b.record({}, '3', true);
  assert.deepEqual(Object.keys(decodeProgress(storage.values.get(PROGRESS_KEY)).symbols), ['3']);
});
