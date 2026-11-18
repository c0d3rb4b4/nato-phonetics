import { DIGIT_TO_ENTRY, LETTER_TO_ENTRY } from '../data/natoData.js';

const PUNCTUATION = Object.freeze({ '-': 'dash', '.': 'dot', '/': 'slash', '@': 'at', '+': 'plus' });
export const CONVERSION_PAGE_SIZE = 24;

/** Speech indices never include omitted characters or whitespace.
 * @param {import('../types').ConversionToken[]} parts */
export function spokenPartIndices(parts) {
  return parts.flatMap((part, index) => part.type === 'space' || part.type === 'unknown' ? [] : [index]);
}

/** ASCII case folding only; Unicode such as ß must not silently become SS.
 * Whitespace runs form one word boundary. Other Unicode is visibly retained.
 * @param {string} input
 * @returns {import('../types').ConversionToken[]}
 */
export function convertText(input) {
  /** @type {import('../types').ConversionToken[]} */
  const parts = [];
  for (const char of input || '') {
    const ch = /^[a-z]$/.test(char) ? char.toUpperCase() : char;
    const letter = LETTER_TO_ENTRY[ch];
    const number = DIGIT_TO_ENTRY[ch];
    if (/\s/u.test(char)) {
      if (parts.at(-1)?.type !== 'space') parts.push({ type: 'space' });
    } else if (letter) {
      parts.push({ type: 'letter', entry: letter });
    } else if (number) {
      parts.push({ type: 'number', entry: number });
    } else if (Object.hasOwn(PUNCTUATION, char)) {
      parts.push({ type: 'punctuation', char, word: PUNCTUATION[/** @type {keyof typeof PUNCTUATION} */ (char)] });
    } else {
      parts.push({ type: 'unknown', char });
    }
  }

  return parts;
}

/** Include code points so invisible/combining characters cannot disappear.
 * @param {string} char */
export function describeUnknown(char) {
  return `${JSON.stringify(char)} U+${char.codePointAt(0)?.toString(16).toUpperCase().padStart(4, '0')}`;
}

/** Export markers disclose omissions but are never sent to speech. Boundaries
 * add one extra pause, including through omitted characters.
 * @param {import('../types').ConversionToken[]} parts
 * @param {number} [wordPauseMs]
 */
export function conversionOutput(parts, wordPauseMs = 300) {
  /** @type {import('../types').SpeechToken[]} */
  const speech = [];
  /** @type {string[]} */
  const words = [];
  let boundary = false;
  let speechBoundary = false;
  let omitted = 0;
  for (const part of parts) {
    if (part.type === 'space') { boundary = true; speechBoundary = true; continue; }
    if (boundary && words.length) words.push('/');
    boundary = false;
    if (part.type === 'unknown') {
      words.push(`[not spoken: ${describeUnknown(part.char)}]`);
      omitted++;
    } else {
      if (speechBoundary && speech.length) speech[speech.length - 1].pauseAfterMs = wordPauseMs;
      speechBoundary = false;
      words.push(part.type === 'punctuation' ? part.word : part.entry.word);
      speech.push({ text: part.type === 'punctuation' ? part.word : part.entry.speechText });
    }
  }
  return { text: words.join(' '), speech, omitted };
}
