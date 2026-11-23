import { NativeModules, PermissionsAndroid } from 'react-native';
import { playback } from './speech';

const bridge = NativeModules.SpokenAnswer;
const mic = PermissionsAndroid.PERMISSIONS.RECORD_AUDIO;

/** @type {import('./recognitionController').Provider} */
export const recognitionProvider = {
  available: async () => !!bridge && await bridge.available(),
  hasPermission: () => PermissionsAndroid.check(mic),
  requestPermission: () => PermissionsAndroid.request(mic),
  silencePlayback: playback.stopForRecording,
  start: id => bridge.start(id),
  stop: id => bridge.stop(id),
  cancel: id => bridge?.cancel(id),
};
