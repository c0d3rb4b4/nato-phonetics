import assert from 'node:assert/strict';
import test from 'node:test';
import { NATO_ALPHABET } from '../src/data/natoData.js';
import { normalizeAnswerKey } from '../src/lib/questions.js';
import {
  createCoverageDeck, createQuizSession, currentQuizQuestion, quizActionGuard,
  submitQuizAnswer, nextQuizQuestion, cancelQuizSession, restartQuizSession,
  quizSessionResults, retryQuizMistakes, QUIZ_SESSION_LENGTHS, MAX_QUIZ_SESSION_LENGTH,
} from '../src/lib/quizSession.js';

function seeded(seed) {
  let value = seed >>> 0;
  return () => { value = (1664525 * value + 1013904223) >>> 0; return value / 2 ** 32; };
}

function answer(session, correct = true) {
  const question = currentQuizQuestion(session);
  return submitQuizAnswer(session, quizActionGuard(session), correct ? question.correct.word : question.options.find(option => option !== question.correct.word));
}

function finish(session, shouldBeCorrect = () => true) {
  while (session.phase !== 'complete') {
    session = answer(session, shouldBeCorrect(session));
    session = nextQuizQuestion(session, quizActionGuard(session));
  }
  return session;
}

test('coverage decks visit each symbol once per cycle and avoid boundary repeats over varied seeds', () => {
  const symbols = Object.freeze(NATO_ALPHABET.map(entry => entry.letter));
  for (let seed = 1; seed <= 100; seed += 1) {
    const deck = createCoverageDeck(symbols, MAX_QUIZ_SESSION_LENGTH, seeded(seed));
    assert.equal(deck.length, 260);
    for (let offset = 0; offset < deck.length; offset += symbols.length) {
      assert.deepEqual([...deck.slice(offset, offset + symbols.length)].sort(), [...symbols].sort());
    }
    assert.ok(deck.every((symbol, index) => index === 0 || symbol !== deck[index - 1]));
    assert.deepEqual(deck, createCoverageDeck(symbols, 260, seeded(seed)), 'Injected seed is reproducible');
  }
  assert.deepEqual(symbols, NATO_ALPHABET.map(entry => entry.letter));
  assert.throws(() => createCoverageDeck(symbols, 5, seeded(1)).push('A'), TypeError);
});

test('short, two-symbol and single-mistake decks have explicit coverage and repeat behavior', () => {
  const short = createCoverageDeck(NATO_ALPHABET.map(entry => entry.letter), 10, seeded(8));
  assert.equal(new Set(short).size, 10);
  assert.deepEqual(createCoverageDeck(['A', 'B'], 8, () => 0.999, 'A'), ['B', 'A', 'B', 'A', 'B', 'A', 'B', 'A']);
  assert.deepEqual(createCoverageDeck(['J'], 3, () => { throw new Error('One-symbol deck needs no random draw'); }, 'J'), ['J', 'J', 'J']);
});

test('invalid lengths, unknown or duplicate symbols and invalid randomness fail explicitly', () => {
  for (const length of [0, -1, 1.5, Infinity, NaN, MAX_QUIZ_SESSION_LENGTH + 1]) {
    assert.throws(() => createQuizSession({ length }), RangeError);
  }
  for (const symbols of [[], ['A', 'A'], ['a'], ['?'], ['10']]) assert.throws(() => createQuizSession({ symbols }), RangeError);
  for (const draw of [-0.1, 1, Infinity, NaN]) assert.throws(() => createQuizSession({ random: () => draw }), RangeError);
});

test('default and supported short rounds precompute valid canonical immutable questions', () => {
  assert.equal(createQuizSession({ random: seeded(1) }).length, 10);
  const before = JSON.stringify(NATO_ALPHABET);
  for (const length of QUIZ_SESSION_LENGTHS) {
    const session = createQuizSession({ length, random: seeded(length) });
    assert.equal(session.phase, 'question');
    assert.equal(session.questions.length, length);
    assert.equal(new Set(session.questions.map(question => question.correct.letter)).size, length);
    for (const question of session.questions) {
      const keys = question.options.map(normalizeAnswerKey);
      assert.equal(keys.length, 4);
      assert.equal(new Set(keys).size, 4);
      assert.equal(question.options.filter(option => option === question.correct.word).length, 1);
      assert.ok(Object.isFrozen(question) && Object.isFrozen(question.correct) && Object.isFrozen(question.options) && Object.isFrozen(question.id));
    }
    assert.throws(() => { session.index = 4; }, TypeError);
    assert.throws(() => { session.questions[0].correct.word = 'changed'; }, TypeError);
    assert.throws(() => session.questions[0].options.pop(), TypeError);
    assert.deepEqual(session, createQuizSession({ length, random: seeded(length) }));
  }
  assert.equal(JSON.stringify(NATO_ALPHABET), before);
});

test('only a current offered choice can submit; duplicate and stale actions preserve the same state', () => {
  const session = createQuizSession({ length: 5, random: seeded(3) });
  const guard = quizActionGuard(session);
  assert.equal(nextQuizQuestion(session, guard), session, 'Cannot skip unanswered question');
  assert.equal(submitQuizAnswer(session, guard, 'not an offered option'), session);
  assert.equal(submitQuizAnswer(session, { ...guard, questionId: { ...guard.questionId } }, currentQuizQuestion(session).correct.word), session, 'Copied ID fields cannot authorize an action');
  const identicalOtherSession = createQuizSession({ length: 5, random: seeded(3) });
  assert.equal(submitQuizAnswer(session, quizActionGuard(identicalOtherSession), currentQuizQuestion(session).correct.word), session, 'Independent session identity is distinct');
  const feedback = answer(session, false);
  assert.equal(feedback.phase, 'feedback');
  assert.equal(feedback.attempts.length, 1);
  assert.equal(feedback.attempts[0].correct, false);
  assert.equal(submitQuizAnswer(feedback, guard, currentQuizQuestion(feedback).correct.word), feedback);
  assert.equal(nextQuizQuestion(feedback, guard), feedback, 'Pre-submission callback cannot advance feedback');
  const feedbackGuard = quizActionGuard(feedback);
  const next = nextQuizQuestion(feedback, feedbackGuard);
  assert.equal(next.phase, 'question');
  assert.equal(next.index, 1);
  assert.equal(nextQuizQuestion(next, feedbackGuard), next);
  assert.equal(submitQuizAnswer(next, { ...feedbackGuard, revision: next.revision }, currentQuizQuestion(next).correct.word), next, 'Old question cannot be retargeted by copying current revision');
  assert.equal(session.attempts.length, 0, 'Original state remains unchanged');
});

test('final feedback waits for explicit Next, then results retain score, accuracy and missed answers', () => {
  let session = createQuizSession({ length: 5, random: seeded(6) });
  const missed = [];
  for (let index = 0; index < 5; index += 1) {
    const correct = index % 2 === 0;
    if (!correct) missed.push(currentQuizQuestion(session).correct.letter);
    session = answer(session, correct);
    assert.equal(session.phase, 'feedback');
    assert.equal(currentQuizQuestion(session).id.index, index);
    if (index < 4) session = nextQuizQuestion(session, quizActionGuard(session));
  }
  assert.equal(quizSessionResults(session).answered, 5);
  const finalGuard = quizActionGuard(session);
  session = nextQuizQuestion(session, finalGuard);
  assert.equal(session.phase, 'complete');
  assert.equal(currentQuizQuestion(session), null);
  assert.equal(quizActionGuard(session), null);
  const results = quizSessionResults(session);
  assert.deepEqual({ ...results, missed: results.missed.map(attempt => attempt.symbol) }, {
    total: 5, answered: 5, correct: 3, incorrect: 2, accuracyPercent: 60, missed,
  });
  assert.ok(results.missed.every(attempt => attempt.answer !== attempt.expected));
  assert.equal(nextQuizQuestion(session, finalGuard), session);
  assert.equal(submitQuizAnswer(session, finalGuard, 'Alfa'), session);
  assert.equal(cancelQuizSession(session), session, 'A completed recap survives exit');
});

test('cancel invalidates pending callbacks while preserving partial score and restart creates a new generation', () => {
  const initial = createQuizSession({ length: 10, random: seeded(9) });
  const feedback = answer(initial, false);
  const pendingGuard = quizActionGuard(feedback);
  const cancelled = cancelQuizSession(feedback);
  assert.equal(cancelled.phase, 'cancelled');
  assert.equal(currentQuizQuestion(cancelled), null);
  assert.equal(quizSessionResults(cancelled).answered, 1);
  assert.equal(quizSessionResults(cancelled).accuracyPercent, 0);
  assert.equal(nextQuizQuestion(cancelled, pendingGuard), cancelled);
  assert.equal(submitQuizAnswer(cancelled, pendingGuard, 'Alfa'), cancelled);
  assert.equal(cancelQuizSession(cancelled), cancelled);
  assert.equal(retryQuizMistakes(cancelled), null, 'Mistake retry belongs to completed results');
  const restarted = restartQuizSession(cancelled, { random: seeded(9) });
  assert.equal(restarted.phase, 'question');
  assert.equal(restarted.generation, 1);
  assert.equal(restarted.revision, cancelled.revision + 1);
  assert.equal(restarted.attempts.length, 0);
  assert.equal(restarted.length, 10);
  assert.notEqual(currentQuizQuestion(restarted).correct.letter, feedback.questions[feedback.index].correct.letter);
  assert.equal(submitQuizAnswer(restarted, pendingGuard, currentQuizQuestion(restarted).correct.word), restarted);
  assert.equal(quizSessionResults(cancelled).incorrect, 1, 'Old recap survives restart');
  assert.equal(quizSessionResults(initial).answered, 0);
});

test('Retry Mistakes covers unique missed symbols once, with reset scoring and independent identities', () => {
  const initial = createQuizSession({ symbols: ['A', 'B'], length: 6, random: seeded(12) });
  const complete = finish(initial, session => currentQuizQuestion(session).correct.letter === 'B');
  assert.equal(quizSessionResults(complete).missed.length, 3, 'Recap retains every incorrect attempt');
  const retry = retryQuizMistakes(complete, seeded(3));
  assert.equal(retry.length, 1);
  assert.deepEqual(retry.symbols, ['A']);
  assert.equal(currentQuizQuestion(retry).correct.word, 'Alfa');
  assert.equal(retry.attempts.length, 0);
  assert.equal(retry.generation, complete.generation + 1);
  assert.equal(quizSessionResults(finish(retry)).accuracyPercent, 100);
  const perfect = finish(createQuizSession({ length: 5, random: seeded(5) }));
  assert.equal(retryQuizMistakes(perfect), null);
  assert.equal(retryQuizMistakes(initial), null);
});

test('multi-symbol mistake retry and explicit restart lengths are deterministic and do not lose prior results', () => {
  const complete = finish(createQuizSession({ length: 26, random: seeded(88) }), session => !['J', 'N', 'U', 'W'].includes(currentQuizQuestion(session).correct.letter));
  const retry = retryQuizMistakes(complete, seeded(14));
  assert.deepEqual(retry, retryQuizMistakes(complete, seeded(14)));
  assert.equal(retry.length, 4);
  assert.deepEqual([...retry.symbols].sort(), ['J', 'N', 'U', 'W']);
  assert.equal(new Set(retry.questions.map(question => question.correct.letter)).size, 4);
  const restart = restartQuizSession(complete, { length: 5, random: seeded(17) });
  assert.equal(restart.length, 5);
  assert.equal(restart.symbols.length, 26);
  assert.equal(quizSessionResults(complete).answered, 26);
  assert.equal(quizSessionResults(complete).incorrect, 4);
});
