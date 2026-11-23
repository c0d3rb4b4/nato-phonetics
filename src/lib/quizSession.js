import { NATO_ALPHABET } from '../data/natoData.js';
import { generateDistractors, normalizeAnswerKey, shuffle } from './questions.js';
import { entrySymbol, PRACTICE_ENTRIES, PRACTICE_ENTRY_BY_SYMBOL } from './practiceSets.js';

export const QUIZ_SESSION_LENGTHS = Object.freeze([5, 10, 26]);
export const DEFAULT_QUIZ_SESSION_LENGTH = 10;
export const MAX_QUIZ_SESSION_LENGTH = 260;
export const MAX_RECALL_ANSWER_LENGTH = 80;
export const QUIZ_MODES = Object.freeze([
  { id: 'choice', label: 'Choose a code word' },
  { id: 'listening', label: 'Listen and choose a symbol' },
  { id: 'typed', label: 'Type a code word' },
  { id: 'spoken', label: 'Speak a code word' },
]);

/** @type {Map<string, import('../types').LetterEntry | import('../types').DigitEntry>} */
const entries = PRACTICE_ENTRY_BY_SYMBOL;
const allSymbols = Object.freeze(NATO_ALPHABET.map(entry => entry.letter));

/**
 * Opaque in-memory identity: compare the object itself, not its fields. Reusing
 * index 0 after restart therefore cannot authorize an old async callback.
 * @typedef {Readonly<{generation: number, index: number, symbol: string}>} QuestionIdentity
 * @typedef {Readonly<{id: QuestionIdentity, correct: Readonly<import('../types').LetterEntry | import('../types').DigitEntry>, options: readonly string[]}>} SessionQuestion
 * @typedef {Readonly<{questionId: QuestionIdentity, symbol: string, expected: string, answer: string, correct: boolean}>} SessionAttempt
 * @typedef {Readonly<{revision: number, questionId: QuestionIdentity}>} ActionGuard
 * @typedef {'choice' | 'listening' | 'typed' | 'spoken'} QuizMode
 * @typedef {Readonly<{
 *   phase: 'question' | 'feedback' | 'complete' | 'cancelled',
 *   generation: number, revision: number, length: number, index: number, mode: QuizMode,
 *   symbols: readonly string[], questions: readonly SessionQuestion[], attempts: readonly SessionAttempt[]
 * }>} QuizSession
 * @typedef {{length?: number, symbols?: readonly string[], mode?: QuizMode, random?: () => number}} SessionOptions
 */

/** @param {QuizMode} mode */
export const isRecallMode = mode => mode === 'typed' || mode === 'spoken';

/** @param {number} length */
function validateLength(length) {
  if (!Number.isInteger(length) || length < 1 || length > MAX_QUIZ_SESSION_LENGTH) {
    throw new RangeError(`Session length must be an integer from 1 to ${MAX_QUIZ_SESSION_LENGTH}.`);
  }
}

/** @param {readonly string[]} symbols */
function validateSymbols(symbols) {
  if (!symbols.length || new Set(symbols).size !== symbols.length || symbols.some(symbol => !entries.has(symbol))) {
    throw new RangeError('Session symbols must be unique canonical letters or digits.');
  }
}

/** @param {() => number} random @returns {() => number} */
function checkedRandom(random) {
  return () => {
    const value = random();
    if (!Number.isFinite(value) || value < 0 || value >= 1) throw new RangeError('Random draws must be finite and in [0, 1).');
    return value;
  };
}

/**
 * Complete each shuffled coverage cycle before repeating a symbol. Refill swaps
 * an equal first/previous symbol with a random later one, preserving coverage
 * while avoiding an immediate boundary repeat whenever at least two exist.
 * The 260 cap bounds memory; the initial UI choices are 5/10/26, not 260.
 * @param {readonly string[]} symbols @param {number} length
 * @param {() => number} [random] @param {string | null} [previousSymbol]
 * @returns {readonly string[]}
 */
export function createCoverageDeck(symbols, length, random = Math.random, previousSymbol = null) {
  validateLength(length);
  validateSymbols(symbols);
  const draw = checkedRandom(random);
  /** @type {string[]} */
  const deck = [];
  let previous = previousSymbol;
  while (deck.length < length) {
    const cycle = shuffle(symbols, draw);
    if (cycle.length > 1 && cycle[0] === previous) {
      const swap = 1 + Math.floor(draw() * (cycle.length - 1));
      [cycle[0], cycle[swap]] = [cycle[swap], cycle[0]];
    }
    for (const symbol of cycle) {
      if (deck.length === length) break;
      deck.push(symbol);
      previous = symbol;
    }
  }
  return Object.freeze(deck);
}

/**
 * @param {SessionOptions} options @param {number} generation
 * @param {number} revision @param {string | null} previousSymbol
 * @returns {QuizSession}
 */
function buildSession(options, generation, revision, previousSymbol) {
  const length = options.length ?? DEFAULT_QUIZ_SESSION_LENGTH;
  const mode = options.mode ?? 'choice';
  if (!QUIZ_MODES.some(item => item.id === mode)) throw new RangeError('Unknown quiz mode.');
  const symbols = Object.freeze([...(options.symbols ?? allSymbols)]);
  const draw = checkedRandom(options.random ?? Math.random);
  const deck = createCoverageDeck(symbols, length, draw, previousSymbol);
  const questions = Object.freeze(deck.map((symbol, index) => {
    // Validation in createCoverageDeck guarantees the canonical entry exists.
    const entry = /** @type {import('../types').LetterEntry | import('../types').DigitEntry} */ (entries.get(symbol));
    const correct = Object.freeze({ ...entry });
    return Object.freeze({
      id: Object.freeze({ generation, index, symbol }),
      correct,
      options: Object.freeze(isRecallMode(mode) ? [] : mode === 'listening'
        ? shuffle([symbol, ...shuffle(PRACTICE_ENTRIES.filter(candidate =>
          ('letter' in candidate) === ('letter' in correct) && entrySymbol(candidate) !== symbol).map(entrySymbol), draw).slice(0, 3)], draw)
        : shuffle([correct.word, ...generateDistractors(correct, draw)], draw)),
    });
  }));
  return Object.freeze({ phase: 'question', generation, revision, length, index: 0, mode, symbols, questions, attempts: Object.freeze([]) });
}

/** Pure session construction; no storage, playback, timer or UI side effects.
 * @param {SessionOptions} [options] @returns {QuizSession}
 */
export function createQuizSession(options = {}) {
  return buildSession(options, 0, 0, null);
}

/** @param {QuizSession} session @returns {SessionQuestion | null} */
export function currentQuizQuestion(session) {
  return session.phase === 'complete' || session.phase === 'cancelled' ? null : session.questions[session.index];
}

/** Capture this before starting a callback. Never reconstruct it from an index.
 * @param {QuizSession} session @returns {ActionGuard | null}
 */
export function quizActionGuard(session) {
  const question = currentQuizQuestion(session);
  return question ? Object.freeze({ revision: session.revision, questionId: question.id }) : null;
}

/** @param {QuizSession} session @param {ActionGuard | null} guard */
function isCurrent(session, guard) {
  return !!guard && guard.revision === session.revision && guard.questionId === currentQuizQuestion(session)?.id;
}

/**
 * Choice/listening accept only offered options; typed recall compares canonical
 * answer keys (including Alfa/Alpha and Juliett/Juliet aliases). Blank/punctuation
 * only or overlong input is ignored, rather than consuming a question. Unknown,
 * duplicate, stale and cancelled events return the same immutable state.
 * @param {QuizSession} session @param {ActionGuard | null} guard @param {string} answer
 * @returns {QuizSession}
 */
export function submitQuizAnswer(session, guard, answer) {
  if (session.phase !== 'question' || !isCurrent(session, guard)) return session;
  const question = session.questions[session.index];
  if (isRecallMode(session.mode)
    ? answer.length > MAX_RECALL_ANSWER_LENGTH || !normalizeAnswerKey(answer)
    : !question.options.includes(answer)) return session;
  const expected = session.mode === 'listening' ? entrySymbol(question.correct) : question.correct.word;
  const attempt = Object.freeze({ questionId: question.id, symbol: entrySymbol(question.correct),
    expected, answer: answer.trim(), correct: isRecallMode(session.mode)
      ? normalizeAnswerKey(answer) === normalizeAnswerKey(expected) : answer === expected });
  return Object.freeze({ ...session, phase: 'feedback', revision: session.revision + 1,
    attempts: Object.freeze([...session.attempts, attempt]) });
}

/** Explicit Next retains feedback until requested, including the last answer.
 * @param {QuizSession} session @param {ActionGuard | null} guard @returns {QuizSession}
 */
export function nextQuizQuestion(session, guard) {
  if (session.phase !== 'feedback' || !isCurrent(session, guard)) return session;
  const complete = session.index + 1 === session.length;
  return Object.freeze({ ...session, phase: complete ? 'complete' : 'question',
    index: complete ? session.index : session.index + 1, revision: session.revision + 1 });
}

/** Cancel retains the partial recap but invalidates every outstanding action.
 * The UI/audio owner must separately stop its owned effects on this transition.
 * @param {QuizSession} session @returns {QuizSession}
 */
export function cancelQuizSession(session) {
  if (session.phase === 'cancelled' || session.phase === 'complete') return session;
  return Object.freeze({ ...session, phase: 'cancelled', revision: session.revision + 1 });
}

/** New immutable generation, with empty attempts and no immediate repeat when
 * the selected set permits it. Previously returned states/results survive.
 * @param {QuizSession} session @param {SessionOptions} [options] @returns {QuizSession}
 */
export function restartQuizSession(session, options = {}) {
  return buildSession({ length: options.length ?? session.length, symbols: options.symbols ?? session.symbols,
    mode: options.mode ?? session.mode, random: options.random },
    session.generation + 1, session.revision + 1, entrySymbol(session.questions[session.index].correct));
}

/** Score denominator is submitted answers; an unanswered/cancelled round has
 * zero accuracy until an answer exists. Repeated misses remain in the recap.
 * @param {QuizSession} session
 */
export function quizSessionResults(session) {
  const missed = Object.freeze(session.attempts.filter(attempt => !attempt.correct));
  const answered = session.attempts.length;
  const correct = answered - missed.length;
  return Object.freeze({ total: session.length, answered, correct, incorrect: missed.length,
    accuracyPercent: answered ? correct / answered * 100 : 0, missed });
}

/** Only a completed round offers retry; one question per unique missed symbol.
 * No misses returns null, allowing the UI to omit an empty Retry button.
 * @param {QuizSession} session @param {() => number} [random] @returns {QuizSession | null}
 */
export function retryQuizMistakes(session, random = Math.random) {
  if (session.phase !== 'complete') return null;
  const symbols = [...new Set(quizSessionResults(session).missed.map(attempt => attempt.symbol))];
  return symbols.length ? restartQuizSession(session, { symbols, length: symbols.length, random }) : null;
}
