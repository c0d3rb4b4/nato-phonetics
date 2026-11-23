import { useCallback, useState } from 'react';
import { AppState, DeviceEventEmitter } from 'react-native';
import { useFocusEffect } from '../navigation';
import { createRecognitionController } from '../lib/recognitionController';
import { recognitionProvider } from '../lib/recognitionProvider';

export function useSpokenAnswer() {
  const [status, setStatus] = useState(/** @type {import('../lib/recognitionController').CaptureStatus} */ ({ state: 'idle', message: '' }));
  const [control] = useState(() => recognitionProvider && createRecognitionController(recognitionProvider, setStatus));
  useFocusEffect(useCallback(() => {
    if (!control) return;
    const events = DeviceEventEmitter.addListener('spokenAnswerState', event => control.event(event.id, event.state));
    const lifecycle = AppState.addEventListener('change', state => { if (state !== 'active') control.background(); });
    return () => { events.remove(); lifecycle.remove(); control.cancel(); };
  }, [control]));
  return { control, status };
}
