import AsyncStorage from '@react-native-async-storage/async-storage';
import { createProgressStore, decodeProgress, EMPTY_PROGRESS, PROGRESS_KEY } from './progress';

// Native uses the unchanged process-local adapter. Web mutations share one
// origin-scoped lock, and read the latest record only after acquiring it.
const available = typeof navigator !== 'undefined' && !!navigator.locks;
export const progressStore = createProgressStore(AsyncStorage, Date.now, {
  unavailableMessage: available ? undefined : 'This browser cannot safely save or clear progress across windows. Use HTTPS and a browser with Web Locks support. Practice still works; unsaved answers remain only while this page is open.',
  async run(work) {
    if (!available) throw new Error('Progress coordination unavailable');
    // Bound a suspended/blocked writer without stealing its lock. Retry retains
    // pending answers; a closed/crashed holder releases its lock in the browser.
    return navigator.locks.request(PROGRESS_KEY, { signal: AbortSignal.timeout(5000) }, work);
  },
  generation: () => decodeProgress(window.localStorage.getItem(PROGRESS_KEY)).generation,
  async clear() {
    // One atomic replacement deletes every aggregate and changes the generation.
    // Keeping just this random marker prevents an old window's Retry from
    // restoring pre-deletion answers, even when storage events were suspended.
    const data = Object.freeze({ ...EMPTY_PROGRESS, generation: crypto.randomUUID() });
    await AsyncStorage.setItem(PROGRESS_KEY, JSON.stringify(data));
    return data;
  },
});

if (typeof window !== 'undefined') {
  window.addEventListener('storage', event => {
    if (event.storageArea === window.localStorage && (event.key === PROGRESS_KEY || event.key === null)) void progressStore.refresh();
  });
  window.addEventListener('pageshow', () => { void progressStore.refresh(); });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') void progressStore.refresh();
  });
}
