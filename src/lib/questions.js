import { NATO_ALPHABET, NATO_NUMBERS } from '../data/natoData.js';
import { QUIZ_DISTRACTORS } from '../data/quizDistractors.js';

/** Normalize answer equivalence without changing canonical displayed spelling.
 * @param {string} word
 */
export function normalizeAnswerKey(word) {
  const key = word.normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase().replace(/[^a-z0-9]/g, '');
  if (key === 'alpha') return 'alfa';
  if (key === 'juliet') return 'juliett';
  return key;
}

/** Fisher–Yates, with injected draws in [0, 1). Never mutate source content.
 * @template T @param {readonly T[]} values @param {() => number} [random]
 * @returns {T[]}
 */
export function shuffle(values, random = Math.random) {
  const result = [...values];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const other = Math.floor(random() * (index + 1));
    [result[index], result[other]] = [result[other], result[index]];
  }
  return result;
}

/** Draw a single letter question independently of a practice round.
 * @param {() => number} [random] @returns {import('../types').QuizQuestion}
 */
export function createQuestion(random = Math.random) {
  const correctIndex = Math.floor(random() * NATO_ALPHABET.length);
  const correct = NATO_ALPHABET[correctIndex];
  const distractors = generateDistractors(correct, random);
  return { correct, options: shuffle([correct.word, ...distractors], random) };
}

/** Deduplicate before sampling, excluding alternative spellings of the answer.
 * A short/empty pool is filled from the canonical alphabet in stable order.
 * @param {import('../types').LetterEntry | import('../types').DigitEntry} correct @param {readonly string[]} pool
 * @param {() => number} [random] @returns {string[]}
 */
export function selectDistractors(correct, pool, random = Math.random) {
  const seen = new Set([normalizeAnswerKey(correct.word)]);
  /** @type {string[]} */
  const available = [];
  /** @param {string} word */
  const add = word => {
    const key = normalizeAnswerKey(word);
    if (!key || seen.has(key)) return;
    seen.add(key);
    available.push(word.trim());
  };
  for (const word of pool) add(word);
  if (available.length < 3) {
    for (const entry of NATO_ALPHABET) {
      add(entry.word);
      if (available.length >= 3) break;
    }
  }
  return shuffle(available, random).slice(0, 3);
}

/** @param {import('../types').LetterEntry | import('../types').DigitEntry} correct @param {() => number} [random]
 * @returns {string[]}
 */
export function generateDistractors(correct, random = Math.random) {
  return selectDistractors(correct, 'digit' in correct ? NATO_NUMBERS.map(entry => entry.word) : QUIZ_DISTRACTORS[correct.letter] ?? [], random);
}
