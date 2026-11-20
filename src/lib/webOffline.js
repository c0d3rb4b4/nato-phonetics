/** Production web shell lifecycle. Native entry points never import this module. */
let state = { status: 'preparing', online: true };
/** @type {Set<() => void>} */
const listeners = new Set();
/** @type {ServiceWorkerRegistration | undefined} */
let registration;
let started = false;
let busy = false;
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
  publish(registration?.waiting ? 'waiting' : ready ? 'ready' : 'error');
}
/** @param {ServiceWorker} worker */
function observe(worker) {
  worker.addEventListener('statechange', () => {
    if (worker.state === 'redundant') {
      if (!registration?.active) registration = undefined;
      publish('error');
    }
    else void refresh();
  });
}
export async function checkOffline() {
  if (busy) return;
  if (!window.isSecureContext || typeof navigator.serviceWorker?.register !== 'function' || process.env.NODE_ENV !== 'production') {
    publish('unavailable'); return;
  }
  busy = true;
  publish('preparing');
  try {
    if (!registration) {
      registration = await navigator.serviceWorker.register('/service-worker.js', { scope: '/', updateViaCache: 'none' });
      registration.addEventListener('updatefound', () => { if (registration?.installing) observe(registration.installing); });
      if (registration.installing) observe(registration.installing);
    } else await registration.update();
    await refresh(true);
  } catch { publish('error'); }
  finally { busy = false; }
}
export function startOffline() {
  if (started) return;
  started = true;
  const connectivity = () => publish(state.status);
  window.addEventListener('online', connectivity);
  window.addEventListener('offline', connectivity);
  void checkOffline();
}
