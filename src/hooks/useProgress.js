import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import { AppState } from 'react-native';
import { useFocusEffect } from '../navigation';
import { progressStore } from '../lib/progressStore';

export function useProgress() {
  const snapshot = useSyncExternalStore(progressStore.subscribe, progressStore.getSnapshot, progressStore.getServerSnapshot);
  const [now, setNow] = useState(Date.now);
  useEffect(() => { void progressStore.hydrate(); }, []);
  useFocusEffect(useCallback(() => {
    const refresh = () => setNow(Date.now());
    refresh();
    const timer = setInterval(refresh, 60000);
    const listener = AppState.addEventListener('change', state => { if (state === 'active') refresh(); });
    return () => { clearInterval(timer); listener.remove(); };
  }, []));
  return { ...snapshot, now };
}
