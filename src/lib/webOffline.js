/** Production web shell lifecycle. Native entry points never import this module. */
let state = { status: 'preparing', online: true };
/** @type {Set<() => void>} */
const listeners = new Set();
/** @type {ServiceWorkerRegistration | undefined} */
let registration;
let started = false;
let statusRevision = 0;
/** @type {symbol | undefined} */
let currentCheck;
/** @param {string} status */
function publish(status) {
  state = { status, online: navigator.onLine };
  listeners.forEach(listener => listener());
}
export const getOfflineState = () => state;
/** @param {() => void} listener */
export function subscribeOffline(listener) { listeners.add(listener); return () => { listeners.delete(listener); }; }
/** @param {boolean} repair */
async function refresh(repair = false) {
  const revision = ++statusRevision;
  if (registration?.waiting) { publish('waiting'); return; }
  const active = registration?.active;
  if (active?.state !== 'activated') { publish('preparing'); return; }
  const ready = await new Promise(resolve => {
    const channel = new MessageChannel();
    const timeout = setTimeout(() => { channel.port1.close(); resolve(false); }, 10000);
    channel.port1.onmessage = event => { clearTimeout(timeout); channel.port1.close(); resolve(event.data?.ready === true); };
    try { active.postMessage({ type: 'SHELL_STATUS', repair }, [channel.port2]); }
    catch { clearTimeout(timeout); channel.port1.close(); resolve(false); }
  });
  if (revision === statusRevision) publish(registration?.waiting ? 'waiting' : ready ? 'ready' : 'error');
}
/** @param {ServiceWorker} worker */
function observe(worker) {
  const changed = () => {
    if (worker.state === 'activated' || worker.state === 'redundant') worker.removeEventListener('statechange', changed);
    if (worker.state === 'redundant') {
      ++statusRevision;
      if (!registration?.active) registration = undefined;
      publish('error');
    }
    else void refresh();
  };
  worker.addEventListener('statechange', changed);
}
export async function checkOffline() {
  if (currentCheck && state.status !== 'error') return;
  if (!window.isSecureContext || typeof navigator.serviceWorker?.register !== 'function' || process.env.NODE_ENV !== 'production') {
    publish('unavailable'); return;
  }
  const check = currentCheck = Symbol();
  const revision = ++statusRevision;
  publish('preparing');
  try {
    if (!registration) {
      registration = await navigator.serviceWorker.register('/service-worker.js', { scope: '/', updateViaCache: 'none' });
      registration.addEventListener('updatefound', () => { if (registration?.installing) observe(registration.installing); });
      if (registration.installing) observe(registration.installing);
    } else await registration.update();
    // A newer lifecycle event owns the outcome, even if the old active shell
    // subsequently reports a complete cache or its update() call settles late.
    if (revision === statusRevision) await refresh(true);
  } catch { if (revision === statusRevision) publish('error'); }
  finally { if (currentCheck === check) currentCheck = undefined; }
}
export function startOffline() {
  if (started) return;
  started = true;
  const connectivity = () => publish(state.status);
  window.addEventListener('online', connectivity);
  window.addEventListener('offline', connectivity);
  void checkOffline();
}
