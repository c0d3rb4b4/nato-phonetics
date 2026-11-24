import { NativeModules, PermissionsAndroid, Platform } from 'react-native';
import { playback } from './speech';
import { getSpokenPracticeSupport } from './spokenPracticeSupport';

const bridge = NativeModules.SpokenAnswer;
const mic = PermissionsAndroid.PERMISSIONS.RECORD_AUDIO;

/** @type {import('./recognitionController').Provider | null} */
export const recognitionProvider = getSpokenPracticeSupport(Platform).eligible ? {
  available: async () => !!bridge && await bridge.available(),
  hasPermission: () => PermissionsAndroid.check(mic),
  requestPermission: () => PermissionsAndroid.request(mic),
  silencePlayback: playback.stopForRecording,
  start: id => bridge.start(id),
  stop: id => bridge.stop(id),
  cancel: id => bridge?.cancel(id),
} : null;
