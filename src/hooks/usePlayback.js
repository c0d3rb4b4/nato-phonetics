import { useFocusEffect } from '../navigation';
import { useCallback, useId, useRef, useSyncExternalStore } from 'react';
import { AppState, Platform } from 'react-native';
import { playback } from '../lib/speech';

/** An inactive screen cannot start audio through a delayed callback.
 * @param {string} screen
 */
export function usePlayback(screen) {
  const instance = useId();
  const owner = `${screen}:${instance}`;
  const focused = useRef(false);
  const foreground = useRef(true);
  const snapshot = useSyncExternalStore(playback.subscribe, playback.getSnapshot, playback.getServerSnapshot);
  useFocusEffect(useCallback(() => {
    focused.current = true;
    foreground.current = Platform.OS === 'web' ? !document.hidden : AppState.currentState === 'active';
    const stop = () => { void playback.stop(owner); };
    const subscription = AppState.addEventListener('change', state => {
      foreground.current = state === 'active';
      if (!foreground.current) stop();
    });
    const visibility = () => {
      foreground.current = !document.hidden;
      if (!foreground.current) stop();
    };
    const pagehide = () => { foreground.current = false; stop(); };
    const pageshow = () => { foreground.current = !document.hidden; };
    if (Platform.OS === 'web') {
      document.addEventListener('visibilitychange', visibility);
      window.addEventListener('pagehide', pagehide);
      window.addEventListener('pageshow', pageshow);
    }
    return () => {
      focused.current = false;
      subscription.remove();
      if (Platform.OS === 'web') {
        document.removeEventListener('visibilitychange', visibility);
        window.removeEventListener('pagehide', pagehide);
        window.removeEventListener('pageshow', pageshow);
      }
      stop();
    };
  }, [owner]));

  return {
    snapshot,
    active: snapshot.owner === owner && snapshot.status !== 'idle',
    result: snapshot.owner === owner ? snapshot.result : null,
    warning: snapshot.owner === owner ? snapshot.warning : null,
    /** @param {Parameters<typeof playback.play>[1]} tokens
     * @param {Parameters<typeof playback.play>[2]} [options] */
    play: (tokens, options) => focused.current && foreground.current
      ? playback.play(owner, tokens, options)
      : Promise.resolve(/** @type {import('../types').SpeechResult} */ ({ status: 'cancelled' })),
    stop: () => { void playback.stop(owner); },
  };
}
