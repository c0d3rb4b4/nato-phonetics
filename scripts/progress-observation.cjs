// Test-only boundary observations. Install before application code. Never write
// storage, acquire a diagnostic lock, or retry an application operation here.
function observeProgress() {
  const key = 'nato.progress.v1', events = [];
  let sequence = 0;
  const errorInfo = error => ({ name: error?.name, message: error?.message });
  const record = (type, details = {}) => {
    events.push({ sequence: ++sequence, type, ms: performance.now(), visibility: document.visibilityState, ...details });
    if (events.length > 200) events.shift();
  };
  const summarize = raw => {
    if (raw === null) return { present: false, total: 0, generation: null };
    try {
      const data = JSON.parse(raw);
      return { present: true, version: data?.version, generation: data?.generation ?? null,
        total: Object.values(data?.symbols || {}).reduce((sum, row) => sum + (Number.isSafeInteger(row?.attempts) ? row.attempts : 0), 0) };
    } catch { return { present: true, invalidJson: true }; }
  };
  const get = Storage.prototype.getItem, set = Storage.prototype.setItem;
  Storage.prototype.getItem = function (name) {
    try {
      const value = get.call(this, name);
      if (name === key) record('storage-read', summarize(value));
      return value;
    } catch (error) { if (name === key) record('storage-read-rejected', errorInfo(error)); throw error; }
  };
  Storage.prototype.setItem = function (name, value) {
    try {
      const result = set.call(this, name, value);
      if (name === key) record('storage-write', summarize(value));
      return result;
    } catch (error) { if (name === key) record('storage-write-rejected', errorInfo(error)); throw error; }
  };
  record('observer-installed', { locksAvailable: !!navigator.locks, secureContext: isSecureContext });
  if (typeof LockManager !== 'undefined') {
    // Observe every LockManager wrapper; an expando on the object returned
    // during document initialization is not retained by WebKit in our probe.
    const request = LockManager.prototype.request;
    LockManager.prototype.request = function (name, options, callback) {
      if (name !== key) return arguments.length === 2 ? request.call(this, name, options) : request.call(this, name, options, callback);
      // Preserve both Web Locks overloads and their receiver/return values.
      if (typeof options === 'function') { callback = options; options = {}; }
      const operation = sequence + 1, started = performance.now();
      record('lock-request', { operation, aborted: options?.signal?.aborted ?? false });
      return request.call(this, name, options, lock => {
        record('lock-acquired', { operation, mode: lock?.mode });
        return callback(lock);
      }).then(value => { record('lock-completed', { operation }); return value; }, error => {
        record('lock-rejected', { operation, elapsedMs: performance.now() - started,
          aborted: options?.signal?.aborted ?? false, reason: errorInfo(options?.signal?.reason), ...errorInfo(error) });
        throw error;
      });
    };
  }
  window.__progressObservation = { events, mark: record, summarize };
}

// Read-only snapshot; the raw progress fixture is retained by the recovery
// runner separately for exact record assertions. No arbitrary stored text here.
async function progressSnapshot(page) {
  return page.evaluate(async () => {
    const probe = window.__progressObservation;
    const events = probe?.events.slice() ?? [];
    let data, storageError;
    try { data = probe?.summarize(localStorage.getItem('nato.progress.v1')); }
    catch (error) { storageError = { name: error.name, message: error.message }; }
    const locks = await navigator.locks?.query().catch(error => ({ error: { name: error.name, message: error.message } }));
    return { events, data, storageError, locks, visibility: document.visibilityState, url: location.href,
      visibleText: document.body.innerText, controlled: !!navigator.serviceWorker?.controller };
  });
}

module.exports = { observeProgress, progressSnapshot };
