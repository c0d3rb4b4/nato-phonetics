import { createBrowserSpeechAdapter, loadBrowserVoices } from './browserSpeech';

/** @type {ReturnType<typeof createBrowserSpeechAdapter> | undefined} */
let adapter;
function getAdapter() {
  if (typeof window === 'undefined' || !window.speechSynthesis || !window.SpeechSynthesisUtterance) {
    throw new Error('Speech playback is unavailable in this browser.');
  }
  adapter ??= createBrowserSpeechAdapter({ synthesis: window.speechSynthesis, Utterance: window.SpeechSynthesisUtterance });
  return adapter;
}

export const platformSpeech = {
  async voices() {
    if (typeof window === 'undefined' || !window.speechSynthesis) throw new Error('This browser does not provide speech voices.');
    return loadBrowserVoices(window.speechSynthesis);
  },
  /** @param {string} text @param {import('./playbackController').UtteranceOptions} options */
  speak(text, options) { getAdapter().speak(text, options); },
  stop() { if (typeof window !== 'undefined' && window.speechSynthesis) getAdapter().stop(); },
};
