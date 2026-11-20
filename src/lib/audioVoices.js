/** @param {string} locale */
export function normalizeLocale(locale) {
  const value = locale.trim().replaceAll('_', '-');
  try { return Intl.getCanonicalLocales(value)[0] ?? value; }
  catch { return value; }
}

/** Retain every English voice, irrespective of quality; never hide Default voices.
 * @param {import('../types').EnglishVoice[]} voices
 */
export function normalizeEnglishVoices(voices) {
  const seen = new Set();
  return voices.map(voice => ({ ...voice, language: normalizeLocale(voice.language) }))
    .filter(voice => {
      if (!/^en(?:-|$)/i.test(voice.language) || !voice.identifier || seen.has(voice.identifier)) return false;
      seen.add(voice.identifier);
      return true;
    }).sort((a, b) => a.language.localeCompare(b.language, 'en') ||
      Number(b.quality.toLowerCase() === 'enhanced') - Number(a.quality.toLowerCase() === 'enhanced') ||
      a.quality.localeCompare(b.quality, 'en') || a.name.localeCompare(b.name, 'en') ||
      a.identifier.localeCompare(b.identifier, 'en'));
}

/** @param {import('../types').EnglishVoice} voice */
export function getVoiceLabel(voice) {
  return `${voice.name} (${voice.language}, ${voice.quality})`;
}

/** Bound unreliable provider/storage promises without leaking timer handles.
 * @template T @param {Promise<T>} promise @param {number} timeoutMs @param {string} message
 * @returns {Promise<T>}
 */
export function withTimeout(promise, timeoutMs, message) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error(message)), timeoutMs);
    promise.then(value => { clearTimeout(timeout); resolve(value); }, error => {
      clearTimeout(timeout); reject(error);
    });
  });
}

/** Resolving a voice must never make default playback depend on healthy storage.
 * @param {{readSelectedVoice: () => Promise<string | null>, loadVoices: () => Promise<import('../types').EnglishVoice[]>}} sources
 * @param {number} timeoutMs
 */
export function createVoicePreparation(sources, timeoutMs = 3500) {
  /** @param {import('../types').PlaybackOptions} options */
  return async (options) => {
    let voice = options.voice;
    let warning;
    if (voice === undefined) {
      try { voice = await withTimeout(sources.readSelectedVoice(), timeoutMs, 'Settings lookup timed out.'); }
      catch { warning = 'Saved voice could not be loaded. Using System Default.'; }
    }
    if (!voice) return { language: 'en-GB', warning };
    try {
      const voices = await withTimeout(sources.loadVoices(), timeoutMs, 'Voice lookup timed out.');
      const available = voices.find(item => item.identifier === voice);
      if (available) return { voice: available.identifier, language: available.language, warning };
      return { language: 'en-GB', warning: 'Selected voice is no longer available. Using System Default; choose a voice in Settings.' };
    } catch {
      return { language: 'en-GB', warning: 'Available voices could not be checked. Using System Default.' };
    }
  };
}

/** Search installed names, locale codes and quality without mutating saved choice
 * or provider order. Blank query/locale restores the complete English list.
 * @param {import('../types').EnglishVoice[]} voices
 * @param {string} query @param {string} locale
 */
export function filterEnglishVoices(voices, query, locale) {
  /** @param {string} value */
  const key = value => value.normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase();
  const search = key(query.trim());
  const language = locale ? normalizeLocale(locale).toLowerCase() : '';
  return voices.filter(voice => (!language || voice.language.toLowerCase() === language) &&
    (!search || key(`${voice.name} ${voice.language} ${voice.quality}`).includes(search)));
}
