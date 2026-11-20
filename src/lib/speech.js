import { platformSpeech } from './platformSpeech';
import { preferenceStore } from './preferenceStore';
import { createPlaybackController } from './playbackController';
import { createVoicePreparation, normalizeEnglishVoices, withTimeout } from './audioVoices';

export { getVoiceLabel } from './audioVoices';

/** @returns {Promise<import('../types').EnglishVoice[]>} */
export async function loadEnglishVoices() {
  return normalizeEnglishVoices(await withTimeout(platformSpeech.voices(), 3000, 'Voice loading timed out. Retry or check device speech settings.'));
}

const prepareVoice = createVoicePreparation({
  async readSelectedVoice() {
    await preferenceStore.hydrate();
    if (preferenceStore.getSnapshot().error?.operation === 'load') throw new Error('Saved settings could not be loaded.');
    return preferenceStore.getSnapshot().preferences.selectedVoice;
  },
  loadVoices: loadEnglishVoices,
});

export const playback = createPlaybackController(platformSpeech, prepareVoice);
