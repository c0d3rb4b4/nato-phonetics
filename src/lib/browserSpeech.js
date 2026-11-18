/** Keep enumeration out of speak so voiceschanged cannot start sound after Stop.
 * @param {{synthesis: SpeechSynthesis, Utterance: typeof SpeechSynthesisUtterance}} browser
 */
export function createBrowserSpeechAdapter(browser) {
  /** @type {SpeechSynthesisUtterance | null} */
  let utterance = null;
  return {
    /** @param {string} text @param {import('./playbackController').UtteranceOptions} options */
    speak(text, options) {
      const current = new browser.Utterance(text);
      utterance = current;
      current.lang = options.language ?? 'en-GB';
      current.rate = options.rate;
      if (options.voice) current.voice = browser.synthesis.getVoices().find(voice => voice.voiceURI === options.voice) ?? null;
      const clean = () => {
        current.onend = null;
        current.onerror = null;
        if (utterance === current) utterance = null;
      };
      current.onend = () => { clean(); options.onDone(); };
      current.onerror = (event) => {
        clean();
        if (event.error === 'canceled' || event.error === 'interrupted') options.onStopped();
        else options.onError(new Error('Browser speech failed.'));
      };
      browser.synthesis.speak(current);
    },
    stop() {
      if (utterance) {
        utterance.onend = null;
        utterance.onerror = null;
        utterance = null;
      }
      browser.synthesis.cancel();
    },
  };
}

/** Empty enumeration is a supported state, not an unbounded wait.
 * @param {SpeechSynthesis} synthesis @param {number} timeoutMs
 * @returns {Promise<import('../types').EnglishVoice[]>}
 */
export function loadBrowserVoices(synthesis, timeoutMs = 3000) {
  return new Promise((resolve, reject) => {
    let settled = false;
    /** @type {ReturnType<typeof setTimeout> | undefined} */
    let timeout;
    /** @param {boolean} final */
    const read = (final = false) => {
      if (settled) return;
      try {
        const voices = synthesis.getVoices();
        if (!voices.length && !final) return;
        settled = true;
        clearTimeout(timeout);
        synthesis.removeEventListener('voiceschanged', changed);
        resolve(voices.map(voice => ({
          identifier: voice.voiceURI, name: voice.name, language: voice.lang,
          quality: 'Default', localService: voice.localService,
        })));
      } catch {
        settled = true;
        clearTimeout(timeout);
        synthesis.removeEventListener('voiceschanged', changed);
        reject(new Error('Available voices could not be loaded. Retry or check device speech settings.'));
      }
    };
    const changed = () => read();
    synthesis.addEventListener('voiceschanged', changed);
    read();
    if (!settled) timeout = setTimeout(() => read(true), timeoutMs);
  });
}
