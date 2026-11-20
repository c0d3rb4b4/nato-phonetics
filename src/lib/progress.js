import { PRACTICE_ENTRY_BY_SYMBOL } from './practiceSets.js';

export const PROGRESS_KEY = 'nato.progress.v1';
export const REVIEW_DAYS = Object.freeze([1, 3, 7, 14, 30]);
const DAY = 86400000;
const MAX_TIME = 8640000000000000 - 30 * DAY;
const MAX_COUNT = Number.MAX_SAFE_INTEGER - 1;
const canonicalSymbols = new Set(/** @type {string[]} */ ([...PRACTICE_ENTRY_BY_SYMBOL.keys()]));
/** @typedef {Readonly<{attempts: number, errors: number, streak: number, lastReviewedAt: number, dueAt: number}>} SymbolProgress */
/** @typedef {Readonly<{version: 1, symbols: Readonly<Record<string, SymbolProgress>>, generation?: string}>} ProgressData */
/** @typedef {{operation: 'load' | 'save' | 'clear', message: string}} ProgressError */
/** @typedef {Readonly<{data: ProgressData, isLoading: boolean, isSaving: boolean, pendingCount: number, error: ProgressError | null}>} ProgressSnapshot */
/** @type {ProgressData} */
export const EMPTY_PROGRESS = Object.freeze({ version: 1, symbols: Object.freeze({}) });
/** @type {ProgressSnapshot} */
const INITIAL = Object.freeze({ data: EMPTY_PROGRESS, isLoading: true, isSaving: false, pendingCount: 0, error: null });

/** @param {unknown} n */
const timestamp = n => typeof n === 'number' && Number.isSafeInteger(n) && n >= 0 && n <= 8640000000000000;
/** @param {unknown} n */
const count = n => typeof n === 'number' && Number.isSafeInteger(n) && n >= 0 && n <= MAX_COUNT;

/** Fail closed on corrupt/future records. There was no earlier progress key;
 * absent data starts v1. Never reinterpret preferences or rewrite on read.
 * @param {string | null} raw @returns {ProgressData} */
export function decodeProgress(raw) {
  if (raw === null) return EMPTY_PROGRESS;
  const value = JSON.parse(raw);
  if (!value || value.version !== 1 || !value.symbols || typeof value.symbols !== 'object' || Array.isArray(value.symbols)
    || Object.keys(value).some(key => !['version', 'symbols', 'generation'].includes(key))) throw new Error('Unsupported progress record');
  if (value.generation !== undefined && (typeof value.generation !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value.generation))) throw new Error('Invalid progress generation');
  /** @type {Record<string, SymbolProgress>} */
  const symbols = {};
  for (const [symbol, row] of Object.entries(value.symbols)) {
    const r = /** @type {SymbolProgress} */ (row);
    if (!canonicalSymbols.has(symbol) || !r || Object.keys(r).sort().join() !== 'attempts,dueAt,errors,lastReviewedAt,streak'
      || !count(r.attempts) || r.attempts < 1 || !count(r.errors) || r.errors > r.attempts
      || !Number.isInteger(r.streak) || r.streak < 0 || r.streak > REVIEW_DAYS.length || r.streak > r.attempts - r.errors
      || (!r.streak && !r.errors) || !timestamp(r.lastReviewedAt) || r.lastReviewedAt > MAX_TIME || !timestamp(r.dueAt)
      || r.dueAt !== r.lastReviewedAt + (r.streak ? REVIEW_DAYS[r.streak - 1] * DAY : 0)) throw new Error('Invalid progress data');
    symbols[symbol] = Object.freeze({ ...r });
  }
  return Object.freeze({ version: 1, symbols: Object.freeze(symbols), ...(value.generation ? { generation: value.generation } : {}) });
}

/** Scheduling is elapsed time, independent of midnight, DST and locale. Every
 * accepted answer in any mode counts; text alternatives are not a mastery claim.
 * @param {ProgressData} data @param {string} symbol @param {boolean} correct @param {number} at
 * @returns {ProgressData} */
export function applyProgressAnswer(data, symbol, correct, at) {
  if (!canonicalSymbols.has(symbol) || !timestamp(at) || at > MAX_TIME || typeof correct !== 'boolean') throw new Error('Invalid progress answer');
  const previous = data.symbols[symbol];
  if (previous && previous.attempts >= MAX_COUNT) throw new Error('Progress counter limit reached');
  const streak = correct ? Math.min(REVIEW_DAYS.length, (previous?.streak ?? 0) + 1) : 0;
  const row = Object.freeze({ attempts: (previous?.attempts ?? 0) + 1, errors: (previous?.errors ?? 0) + (correct ? 0 : 1),
    streak, lastReviewedAt: at, dueAt: at + (streak ? REVIEW_DAYS[streak - 1] * DAY : 0) });
  return Object.freeze({ ...data, symbols: Object.freeze({ ...data.symbols, [symbol]: row }) });
}

/** Stable order: oldest due first, then canonical input order. Unpractised
 * symbols stay in full practice, never masquerading as overdue saved work.
 * @param {ProgressData} data @param {readonly string[]} symbols @param {'all'|'due'|'mistakes'} scope @param {number} now */
export function selectProgressSymbols(data, symbols, scope, now) {
  if (scope === 'all') return [...symbols];
  return symbols.filter(symbol => {
    const row = data.symbols[symbol];
    return row && (scope === 'mistakes' ? row.streak === 0 : row.dueAt <= now);
  }).sort((a, b) => data.symbols[a].dueAt - data.symbols[b].dueAt);
}

/** @param {ProgressData} data @param {number} now */
export function progressSummary(data, now) {
  const rows = Object.values(data.symbols);
  const attempts = rows.reduce((n, row) => n + row.attempts, 0);
  const errors = rows.reduce((n, row) => n + row.errors, 0);
  return { attempts, errors, correct: attempts - errors, practised: rows.length,
    due: rows.filter(row => row.dueAt <= now).length, mistakes: rows.filter(row => row.streak === 0).length };
}

/** Serialized persistence. Commit summaries only after successful writes. A
 * failed/unreadable record is preserved, with answers held in memory for Retry.
 * Clear is an ordered barrier: it discards earlier pending answers on success;
 * answers submitted after it are new progress. No recap is ever re-imported.
 * Web coordination re-reads committed data under an exclusive cross-window lock.
 * A persisted deletion generation invalidates earlier pending answers, including
 * those in suspended windows that have not received a storage event.
 * @typedef {{run: <T>(work: () => Promise<T>) => Promise<T>, clear: () => Promise<ProgressData>, generation: () => string | undefined, unavailableMessage?: string}} ProgressCoordination
 * @param {import('../types').PreferenceStorage} storage @param {() => number} [clock]
 * @param {ProgressCoordination} [coordination] */
export function createProgressStore(storage, clock = Date.now, coordination) {
  let snapshot = INITIAL;
  let readable = false;
  let queue = Promise.resolve();
  /** @type {Promise<void> | null} */ let hydration = null;
  /** @type {{symbol: string, correct: boolean, at: number, generation?: string, uncertain?: boolean}[]} */ let pending = [];
  const seen = new WeakSet();
  const listeners = new Set();
  /** @param {Partial<ProgressSnapshot>} patch */
  function publish(patch) { snapshot = Object.freeze({ ...snapshot, ...patch, pendingCount: pending.length }); listeners.forEach(listener => listener()); }
  /** @template T @param {() => Promise<T>} work @returns {Promise<T>} */
  function enqueue(work) { const result = queue.then(work); queue = result.then(() => {}, () => {}); return result; }
  /** @template T @param {() => Promise<T>} work */
  const transact = work => coordination ? coordination.run(work) : work();
  /** @param {ProgressData} data */
  function discardDeleted(data) {
    if (coordination) pending = pending.filter(answer => answer.uncertain || answer.generation === data.generation);
  }
  async function load() {
    publish({ isLoading: true });
    try {
      const data = decodeProgress(await storage.getItem(PROGRESS_KEY));
      discardDeleted(data);
      readable = true; publish({ data, error: pending.length ? snapshot.error : null });
    } catch {
      readable = false;
      publish({ error: { operation: 'load', message: 'Saved progress could not be read or has an unsupported format. It has been kept unchanged. Retry loading, or use Clear Progress to delete it. New answers are held only until the app closes.' } });
    } finally { publish({ isLoading: false }); }
  }
  function hydrate() { hydration ??= enqueue(load); return hydration; }
  async function flush() {
    if (!readable) return false;
    if (!pending.length) return true;
    publish({ isSaving: true });
    try {
      return await transact(async () => {
        let data = coordination ? decodeProgress(await storage.getItem(PROGRESS_KEY)) : snapshot.data;
        discardDeleted(data);
        if (pending.some(answer => answer.uncertain)) {
          publish({ data, error: { operation: 'save', message: 'Some unsaved answers could not be linked to saved progress while storage was unavailable. They remain in memory and cannot be safely retried across a possible deletion. Clear Progress discards saved and pending answers; new submissions can then be saved.' } });
          return false;
        }
        if (pending.length) {
          for (const answer of pending) data = applyProgressAnswer(data, answer.symbol, answer.correct, answer.at);
          await storage.setItem(PROGRESS_KEY, JSON.stringify(data));
        }
        pending = []; publish({ data, error: null }); return true;
      });
    } catch {
      publish({ error: { operation: 'save', message: coordination?.unavailableMessage ?? 'Progress could not be saved. The summary shows saved answers only. Unsaved answers can be retried while this app remains open.' } }); return false;
    } finally { publish({ isSaving: false }); }
  }
  return {
    getSnapshot: () => snapshot, getServerSnapshot: () => INITIAL,
    /** @param {() => void} listener */
    subscribe(listener) { listeners.add(listener); return () => { listeners.delete(listener); }; },
    hydrate,
    /** Opaque guarded question identity deduplicates rapid/replayed events.
     * @param {object} identity @param {string} symbol @param {boolean} correct */
    record(identity, symbol, correct) {
      if (seen.has(identity)) return Promise.resolve(false);
      const at = clock();
      if (!timestamp(at) || at > MAX_TIME || !canonicalSymbols.has(symbol)) return Promise.resolve(false);
      const loading = snapshot.isLoading;
      let generation = snapshot.data.generation, uncertain = false;
      try { if (coordination) generation = coordination.generation(); } catch { uncertain = true; }
      seen.add(identity); hydrate();
      return enqueue(async () => { pending.push({ symbol, correct, at, uncertain, generation: loading && !coordination ? snapshot.data.generation : generation }); publish({}); return flush(); });
    },
    refresh() { hydrate(); return enqueue(load); },
    retry() { hydrate(); return enqueue(async () => { if (!readable) await load(); return flush(); }); },
    clear() {
      hydrate(); return enqueue(async () => {
        publish({ isSaving: true });
        try {
          return await transact(async () => {
            let data = EMPTY_PROGRESS;
            if (coordination) data = await coordination.clear();
            else await storage.multiRemove([PROGRESS_KEY]);
            pending = []; readable = true; publish({ data, error: null }); return true;
          });
        } catch {
          publish({ error: { operation: 'clear', message: coordination?.unavailableMessage ?? 'Progress could not be cleared. Saved and pending answers have been kept. Try Clear Progress again.' } }); return false;
        } finally { publish({ isSaving: false }); }
      });
    },
  };
}
