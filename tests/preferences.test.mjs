import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createPreferenceStore, DEFAULT_PREFERENCES, INITIAL_PREFERENCE_SNAPSHOT,
  PREFERENCES_KEY, resolveThemeMode,
} from '../src/lib/preferences.js';

function memoryStorage(initial = {}) {
  const data = new Map(Object.entries(initial));
  const writes = [];
  const removals = [];
  return {
    data, writes, removals,
    async getItem(key) { return data.get(key) ?? null; },
    async setItem(key, value) { writes.push([key, value]); data.set(key, value); },
    async multiRemove(keys) { removals.push([...keys]); keys.forEach(key => data.delete(key)); },
  };
}

function deferred() {
  let resolve;
  const promise = new Promise(done => { resolve = done; });
  return { promise, resolve };
}

const record = (patch = {}) => JSON.stringify({ ...DEFAULT_PREFERENCES, ...patch });

async function loaded(initial = {}) {
  const storage = memoryStorage(initial);
  const store = createPreferenceStore(storage);
  await store.hydrate();
  return { storage, store };
}

test('first launch uses typed defaults without writing or clearing any data', async () => {
  const storage = memoryStorage({ progress: 'keep' });
  const store = createPreferenceStore(storage);
  assert.equal(store.getSnapshot(), INITIAL_PREFERENCE_SNAPSHOT);
  await store.hydrate();
  assert.deepEqual(store.getSnapshot(), {
    preferences: DEFAULT_PREFERENCES, isLoading: false, isSaving: false, error: null,
  });
  assert.equal(storage.writes.length, 0);
  assert.equal(storage.removals.length, 0);
  assert.equal(storage.data.get('progress'), 'keep');
});

test('legacy light/dark and voice migrate before their keys are removed', async () => {
  for (const [darkMode, themeMode] of [['true', 'dark'], ['false', 'light']]) {
    const { store, storage } = await loaded({ darkMode, selectedVoice: 'voice-old', progress: 'keep' });
    assert.deepEqual(store.getSnapshot().preferences, { version: 1, themeMode, selectedVoice: 'voice-old' });
    assert.deepEqual(JSON.parse(storage.data.get(PREFERENCES_KEY)), store.getSnapshot().preferences);
    assert.equal(storage.data.has('darkMode'), false);
    assert.equal(storage.data.has('selectedVoice'), false);
    assert.equal(storage.data.get('progress'), 'keep');
  }
});

test('the versioned record wins over stale legacy values on restart', async () => {
  const { store, storage } = await loaded({
    [PREFERENCES_KEY]: record({ themeMode: 'system', selectedVoice: 'new' }),
    darkMode: 'true', selectedVoice: 'old',
  });
  assert.deepEqual(store.getSnapshot().preferences, { version: 1, themeMode: 'system', selectedVoice: 'new' });
  assert.equal(storage.writes.length, 0);
});

test('malformed or unsupported saved records surface an error without overwriting storage', async () => {
  for (const raw of ['{broken', 'null', record({ version: 2 }), record({ themeMode: 'blue' }), record({ selectedVoice: '' })]) {
    const { store, storage } = await loaded({ [PREFERENCES_KEY]: raw });
    assert.equal(store.getSnapshot().isLoading, false);
    assert.equal(store.getSnapshot().error.operation, 'load');
    assert.deepEqual(store.getSnapshot().preferences, DEFAULT_PREFERENCES);
    assert.equal(storage.data.get(PREFERENCES_KEY), raw);
    assert.equal(storage.writes.length, 0);
    storage.data.set(PREFERENCES_KEY, record({ themeMode: 'dark' }));
    await store.retry();
    assert.equal(store.getSnapshot().preferences.themeMode, 'dark');
    assert.equal(store.getSnapshot().error, null);
  }
});

test('early updates wait for delayed hydration and override restored same-field values', async () => {
  const read = deferred();
  const storage = memoryStorage({ [PREFERENCES_KEY]: record({ themeMode: 'light', selectedVoice: 'restored' }) });
  storage.getItem = async () => read.promise;
  const store = createPreferenceStore(storage);
  const change = store.update({ themeMode: 'dark' });
  assert.equal(store.getSnapshot().isLoading, true);
  assert.equal(store.getSnapshot().isSaving, true);
  assert.deepEqual(store.getSnapshot().preferences, DEFAULT_PREFERENCES);
  read.resolve(storage.data.get(PREFERENCES_KEY));
  assert.equal(await change, true);
  assert.deepEqual(store.getSnapshot().preferences, { version: 1, themeMode: 'dark', selectedVoice: 'restored' });
  assert.equal(store.getSnapshot().isSaving, false);
});

test('failed reads leave usable defaults and can recover with Retry', async () => {
  const storage = memoryStorage({ [PREFERENCES_KEY]: record({ selectedVoice: 'recovered' }) });
  const originalRead = storage.getItem;
  storage.getItem = async () => { throw new Error('storage unavailable'); };
  const store = createPreferenceStore(storage);
  await store.hydrate();
  assert.equal(store.getSnapshot().error.operation, 'load');
  assert.equal(store.getSnapshot().isLoading, false);
  assert.equal(store.getSnapshot().preferences.selectedVoice, null);
  storage.getItem = originalRead;
  await store.retry();
  assert.equal(store.getSnapshot().preferences.selectedVoice, 'recovered');
  assert.equal(store.getSnapshot().error, null);
});

test('a pending write does not display an unsaved selected value', async () => {
  const { store, storage } = await loaded();
  const writeStarted = deferred();
  const releaseWrite = deferred();
  const originalWrite = storage.setItem;
  storage.setItem = async (...args) => {
    writeStarted.resolve();
    await releaseWrite.promise;
    await originalWrite(...args);
  };
  const result = store.update({ selectedVoice: 'new-voice' });
  await writeStarted.promise;
  assert.equal(store.getSnapshot().isSaving, true);
  assert.equal(store.getSnapshot().preferences.selectedVoice, null);
  releaseWrite.resolve();
  assert.equal(await result, true);
  assert.equal(store.getSnapshot().preferences.selectedVoice, 'new-voice');
});

test('rapid mixed changes run serially and survive a new store instance', async () => {
  const { store, storage } = await loaded();
  let activeWrites = 0;
  let maxActiveWrites = 0;
  const originalWrite = storage.setItem;
  storage.setItem = async (...args) => {
    activeWrites += 1;
    maxActiveWrites = Math.max(maxActiveWrites, activeWrites);
    await Promise.resolve();
    await originalWrite(...args);
    activeWrites -= 1;
  };
  const outcomes = await Promise.all([
    store.update({ themeMode: 'dark' }),
    store.update({ selectedVoice: 'first' }),
    store.update({ themeMode: 'light' }),
    store.update({ selectedVoice: 'last' }),
    store.update({ themeMode: 'system' }),
  ]);
  assert.deepEqual(outcomes, [true, true, true, true, true]);
  assert.equal(maxActiveWrites, 1);
  const restored = createPreferenceStore(storage);
  await restored.hydrate();
  assert.deepEqual(restored.getSnapshot().preferences, { version: 1, themeMode: 'system', selectedVoice: 'last' });
  assert.deepEqual(store.getSnapshot().preferences, restored.getSnapshot().preferences);
  const records = storage.writes.map(([, value]) => JSON.parse(value));
  assert.deepEqual(records[1], { version: 1, themeMode: 'dark', selectedVoice: 'first' });
  assert.deepEqual(records[3], { version: 1, themeMode: 'light', selectedVoice: 'last' });
});

test('failed writes preserve selected values and do not resurface in later unrelated writes', async () => {
  const { store, storage } = await loaded({ [PREFERENCES_KEY]: record({ selectedVoice: 'saved' }) });
  const originalWrite = storage.setItem;
  storage.setItem = async () => { throw new Error('disk full'); };
  assert.equal(await store.update({ themeMode: 'dark' }), false);
  assert.equal(store.getSnapshot().preferences.themeMode, 'system');
  assert.equal(store.getSnapshot().preferences.selectedVoice, 'saved');
  assert.equal(store.getSnapshot().error.operation, 'save');
  assert.equal(store.getSnapshot().isSaving, false);
  storage.setItem = originalWrite;
  assert.equal(await store.update({ selectedVoice: 'next' }), true);
  assert.deepEqual(JSON.parse(storage.data.get(PREFERENCES_KEY)), { version: 1, themeMode: 'system', selectedVoice: 'next' });
  assert.equal(store.getSnapshot().error, null);
});

test('migration write failure retains legacy preferences and retries without data loss', async () => {
  const storage = memoryStorage({ darkMode: 'true', selectedVoice: 'legacy', progress: 'keep' });
  const originalWrite = storage.setItem;
  storage.setItem = async () => { throw new Error('migration write failed'); };
  const store = createPreferenceStore(storage);
  await store.hydrate();
  assert.equal(store.getSnapshot().error.operation, 'migration');
  assert.equal(store.getSnapshot().preferences.selectedVoice, 'legacy');
  assert.equal(storage.data.get('selectedVoice'), 'legacy');
  assert.equal(storage.data.has(PREFERENCES_KEY), false);
  assert.equal(storage.removals.length, 0);
  storage.setItem = originalWrite;
  await store.retry();
  assert.equal(store.getSnapshot().error, null);
  assert.equal(storage.data.has('selectedVoice'), false);
  assert.equal(storage.data.get('progress'), 'keep');
});

test('cleanup failure is a visible warning after a successful save, and reset retries cleanup', async () => {
  const { store, storage } = await loaded();
  const originalRemove = storage.multiRemove;
  storage.data.set('selectedVoice', 'stale');
  storage.multiRemove = async () => { throw new Error('remove failed'); };
  assert.equal(await store.update({ selectedVoice: 'saved' }), true);
  assert.equal(store.getSnapshot().preferences.selectedVoice, 'saved');
  assert.equal(store.getSnapshot().error.operation, 'cleanup');
  assert.equal(JSON.parse(storage.data.get(PREFERENCES_KEY)).selectedVoice, 'saved');
  const restored = createPreferenceStore(storage);
  await restored.hydrate();
  assert.equal(restored.getSnapshot().preferences.selectedVoice, 'saved');
  storage.multiRemove = originalRemove;
  await store.reset();
  assert.equal(storage.data.has('selectedVoice'), false);
  assert.equal(store.getSnapshot().error, null);
});

test('reset is ordered with changes and removes only legacy settings while persisting defaults', async () => {
  const { store, storage } = await loaded({ progress: '{"correct":7}', draft: 'keep' });
  const changes = [
    store.update({ themeMode: 'dark' }),
    store.update({ selectedVoice: 'voice' }),
    store.reset(),
  ];
  assert.deepEqual(await Promise.all(changes), [true, true, true]);
  assert.deepEqual(store.getSnapshot().preferences, DEFAULT_PREFERENCES);
  assert.deepEqual(JSON.parse(storage.data.get(PREFERENCES_KEY)), DEFAULT_PREFERENCES);
  assert.equal(storage.data.get('progress'), '{"correct":7}');
  assert.equal(storage.data.get('draft'), 'keep');
  assert.ok(storage.removals.every(keys => keys.length === 2 && keys.includes('darkMode') && keys.includes('selectedVoice')));
  const restored = createPreferenceStore(storage);
  await restored.hydrate();
  assert.deepEqual(restored.getSnapshot().preferences, DEFAULT_PREFERENCES);
});

test('failed reset preserves the saved settings and unrelated data', async () => {
  const { store, storage } = await loaded({ [PREFERENCES_KEY]: record({ themeMode: 'dark', selectedVoice: 'saved' }), progress: 'keep' });
  storage.setItem = async () => { throw new Error('disk full'); };
  assert.equal(await store.reset(), false);
  assert.deepEqual(store.getSnapshot().preferences, { version: 1, themeMode: 'dark', selectedVoice: 'saved' });
  assert.equal(storage.data.get('progress'), 'keep');
});

test('server snapshot stays deterministic after client preferences have loaded', async () => {
  const { store } = await loaded({ [PREFERENCES_KEY]: record({ themeMode: 'dark' }) });
  assert.equal(store.getServerSnapshot(), INITIAL_PREFERENCE_SNAPSHOT);
  assert.equal(store.getSnapshot().isLoading, false);
  assert.equal(store.getSnapshot().preferences.themeMode, 'dark');
});

test('System mode follows live schemes, overrides remain stable, and reset restores System', async () => {
  const { store } = await loaded();
  for (const scheme of ['dark', 'light', 'dark']) {
    assert.equal(resolveThemeMode(store.getSnapshot().preferences.themeMode, scheme), scheme);
  }
  await store.update({ themeMode: 'light' });
  assert.equal(resolveThemeMode(store.getSnapshot().preferences.themeMode, 'dark'), 'light');
  await store.update({ themeMode: 'dark' });
  assert.equal(resolveThemeMode(store.getSnapshot().preferences.themeMode, 'light'), 'dark');
  await store.reset();
  assert.equal(resolveThemeMode(store.getSnapshot().preferences.themeMode, 'light'), 'light');
  assert.equal(resolveThemeMode(store.getSnapshot().preferences.themeMode, 'dark'), 'dark');
  assert.equal(resolveThemeMode('system', null), 'light');
});

test('older v1 records retain defaults without rewriting; deliberate converter pace survives unrelated changes and reset', async () => {
  const { store, storage } = await loaded({ [PREFERENCES_KEY]: JSON.stringify({ version: 1, themeMode: 'dark', selectedVoice: 'saved' }), progress: 'keep' });
  assert.equal(store.getSnapshot().preferences.converterPacing, undefined);
  assert.equal(storage.writes.length, 0);
  const pacing = { rate: 0.75, wordPauseMs: 700 };
  assert.equal(await store.update({ converterPacing: pacing }), true);
  assert.equal(await store.update({ themeMode: 'light' }), true);
  const restored = createPreferenceStore(storage); await restored.hydrate();
  assert.deepEqual(restored.getSnapshot().preferences.converterPacing, pacing);
  assert.equal(restored.getSnapshot().preferences.selectedVoice, 'saved');
  const originalWrite = storage.setItem;
  storage.setItem = async () => { throw new Error('full'); };
  assert.equal(await store.update({ converterPacing: { rate: 1.25, wordPauseMs: 0 } }), false);
  assert.deepEqual(store.getSnapshot().preferences.converterPacing, pacing);
  storage.setItem = originalWrite;
  await restored.reset();
  assert.equal(restored.getSnapshot().preferences.converterPacing, undefined);
  assert.equal(storage.data.get('progress'), 'keep');
});

test('invalid converter pace cannot be loaded or persisted', async () => {
  for (const converterPacing of [null, {rate: 0, wordPauseMs: 300}, {rate: 1, wordPauseMs: -1}, {rate: '1', wordPauseMs: 300}]) {
    const {store, storage} = await loaded({[PREFERENCES_KEY]: record({converterPacing})});
    assert.equal(store.getSnapshot().error.operation, 'load');
    assert.equal(await store.update({converterPacing}), false);
    assert.equal(storage.writes.length, 0);
  }
});
