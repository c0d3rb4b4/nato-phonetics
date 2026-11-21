export const PREFERENCES_KEY = 'nato.preferences.v1';
const LEGACY_KEYS = ['darkMode', 'selectedVoice'];
export const DEFAULT_CONVERTER_PACING = Object.freeze({ rate: 1, wordPauseMs: 300 });
export const DEFAULT_CONVERTER_DISPLAY = 'bubbles';
export const CONVERTER_RATES = Object.freeze([0.75, 1, 1.25]);
export const CONVERTER_WORD_PAUSES = Object.freeze([0, 300, 700]);

/** @param {unknown} value */
function isConverterPacing(value) {
  if (!value || typeof value !== 'object') return false;
  const pacing = /** @type {Record<string, unknown>} */ (value);
  return CONVERTER_RATES.includes(/** @type {number} */ (pacing.rate)) &&
    CONVERTER_WORD_PAUSES.includes(/** @type {number} */ (pacing.wordPauseMs));
}

/** @type {Readonly<import('../types').Preferences>} */
export const DEFAULT_PREFERENCES = Object.freeze({
  version: 1,
  themeMode: 'system',
  selectedVoice: null,
});

/** @type {import('../types').PreferenceSnapshot} */
export const INITIAL_PREFERENCE_SNAPSHOT = Object.freeze({
  preferences: DEFAULT_PREFERENCES,
  isLoading: true,
  isSaving: false,
  error: null,
});

/** @param {unknown} value @returns {value is import('../types').Preferences} */
function isPreferences(value) {
  if (!value || typeof value !== 'object') return false;
  const record = /** @type {Record<string, unknown>} */ (value);
  return record.version === 1 &&
    ['system', 'light', 'dark'].includes(/** @type {string} */ (record.themeMode)) &&
    (record.selectedVoice === null ||
      (typeof record.selectedVoice === 'string' && record.selectedVoice.trim().length > 0)) &&
    (record.converterPacing === undefined || isConverterPacing(record.converterPacing)) &&
    (record.converterDisplay === undefined || record.converterDisplay === 'bubbles' || record.converterDisplay === 'cards');
}

/**
 * A single serial queue owns reads, migration, changes and resets. Only persisted
 * values become selected; each patch uses the last successful write so a failed
 * change cannot be resurrected by the next unrelated change.
 * @param {import('../types').PreferenceStorage} storage
 */
export function createPreferenceStore(storage) {
  let snapshot = INITIAL_PREFERENCE_SNAPSHOT;
  /** @type {Set<() => void>} */
  const listeners = new Set();
  /** @type {Promise<void>} */
  let queue = Promise.resolve();
  /** @type {Promise<void> | undefined} */
  let hydration;
  let pendingWrites = 0;

  /** @param {Partial<import('../types').PreferenceSnapshot>} patch */
  function publish(patch) {
    snapshot = Object.freeze({ ...snapshot, ...patch });
    for (const listener of listeners) listener();
  }

  /** @template T @param {() => Promise<T>} task @returns {Promise<T>} */
  function enqueue(task) {
    const result = queue.then(task);
    queue = result.then(() => undefined, () => undefined);
    return result;
  }

  async function cleanLegacy() {
    try {
      await storage.multiRemove([...LEGACY_KEYS]);
    } catch {
      publish({ error: {
        operation: 'cleanup',
        message: 'Settings are saved, but old preference keys could not be removed. Reset Preferences to retry cleanup.',
      } });
    }
  }

  async function load() {
    publish({ isLoading: true, error: null });
    try {
      const stored = await storage.getItem(PREFERENCES_KEY);
      if (stored !== null) {
        const parsed = /** @type {unknown} */ (JSON.parse(stored));
        if (!isPreferences(parsed)) throw new Error('Invalid preference record');
        publish({ preferences: Object.freeze({
          version: 1,
          themeMode: parsed.themeMode,
          selectedVoice: parsed.selectedVoice,
          ...(parsed.converterPacing ? { converterPacing: Object.freeze({ ...parsed.converterPacing }) } : {}),
          ...(parsed.converterDisplay ? { converterDisplay: parsed.converterDisplay } : {}),
        }) });
      } else {
        const [darkMode, selectedVoice] = await Promise.all(
          LEGACY_KEYS.map(key => storage.getItem(key)),
        );
        /** @type {import('../types').Preferences} */
        const migrated = {
          version: 1,
          themeMode: darkMode === 'true' ? 'dark' : darkMode === 'false' ? 'light' : 'system',
          selectedVoice: selectedVoice?.trim() ? selectedVoice : null,
        };
        // These values are already persisted in the old keys even if migration fails.
        publish({ preferences: Object.freeze(migrated) });
        if (darkMode !== null || selectedVoice !== null) {
          try {
            await storage.setItem(PREFERENCES_KEY, JSON.stringify(migrated));
            await cleanLegacy();
          } catch {
            publish({ error: {
              operation: 'migration',
              message: 'Your existing settings were loaded, but could not be upgraded in storage. Retry loading or save your settings again.',
            } });
          }
        }
      }
    } catch {
      publish({ error: {
        operation: 'load',
        message: 'Saved settings could not be loaded. Current settings remain in use. Retry loading before changing settings if you want to preserve unread choices.',
      } });
    } finally {
      publish({ isLoading: false });
    }
  }

  function hydrate() {
    hydration ??= enqueue(load);
    return hydration;
  }

  /** @param {(current: import('../types').Preferences) => import('../types').Preferences} nextValue */
  function write(nextValue) {
    // Calling update before hydrate is safe: the write is queued after the read.
    hydrate();
    pendingWrites += 1;
    publish({ isSaving: true });
    return enqueue(async () => {
      try {
        const next = nextValue(snapshot.preferences);
        if (!isPreferences(next)) throw new Error('Invalid preference change');
        await storage.setItem(PREFERENCES_KEY, JSON.stringify(next));
        publish({ preferences: Object.freeze(next), error: null });
        await cleanLegacy();
        return true;
      } catch {
        publish({ error: {
          operation: 'save',
          message: 'Settings could not be saved. Your previous selections remain in use. Try the change again.',
        } });
        return false;
      } finally {
        pendingWrites -= 1;
        publish({ isSaving: pendingWrites > 0 });
      }
    });
  }

  return {
    getSnapshot: () => snapshot,
    getServerSnapshot: () => INITIAL_PREFERENCE_SNAPSHOT,
    /** @param {() => void} listener */
    subscribe(listener) {
      listeners.add(listener);
      return () => { listeners.delete(listener); };
    },
    hydrate,
    retry: () => { hydrate(); return enqueue(load); },
    /** @param {Partial<Omit<import('../types').Preferences, 'version'>>} patch */
    update: (patch) => write(current => ({ ...current, ...patch })),
    reset: () => write(() => ({ ...DEFAULT_PREFERENCES })),
  };
}

/**
 * Resolve on every render, so System follows live appearance events. An explicit
 * choice stays stable when the operating system changes.
 * @param {import('../types').ThemeMode} mode
 * @param {'light' | 'dark' | null | undefined} systemScheme
 */
export function resolveThemeMode(mode, systemScheme) {
  return mode === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : mode;
}
