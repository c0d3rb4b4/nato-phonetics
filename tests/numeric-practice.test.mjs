import assert from 'node:assert/strict';
import test from 'node:test';
import { NATO_ALPHABET, NATO_NUMBERS } from '../src/data/natoData.js';
import { PRACTICE_SETS, entrySymbol, practiceExampleOutput, practiceLengths } from '../src/lib/practiceSets.js';
import { normalizeAnswerKey } from '../src/lib/questions.js';
import { createQuizSession, currentQuizQuestion, quizActionGuard, submitQuizAnswer, nextQuizQuestion,
  quizSessionResults, retryQuizMistakes, restartQuizSession } from '../src/lib/quizSession.js';
const set = id => PRACTICE_SETS.find(value => value.id === id);
function random(seed) { return () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32); }
function finish(session, choose) {
  while (session.phase !== 'complete') {
    const q = currentQuizQuestion(session);
    session = submitQuizAnswer(session, quizActionGuard(session), choose(q));
    session = nextQuizQuestion(session, quizActionGuard(session));
  }
  return session;
}

test('numeric and mixed coverage preserves every canonical symbol and unique answer over varied seeds', () => {
  const before = JSON.stringify([NATO_ALPHABET, NATO_NUMBERS]);
  for (const id of ['digits', 'mixed', 'postcode', 'callsign']) for (let seed = 1; seed <= 30; seed++) {
    const symbols = set(id).symbols;
    const session = createQuizSession({ symbols, length: symbols.length * 2, random: random(seed) });
    for (let start = 0; start < symbols.length * 2; start += symbols.length) {
      assert.deepEqual(session.questions.slice(start, start + symbols.length).map(q => entrySymbol(q.correct)).sort(), [...symbols].sort());
    }
    for (const q of session.questions) {
      assert.equal(new Set(q.options.map(normalizeAnswerKey)).size, 4);
      assert.equal(q.options.filter(word => word === q.correct.word).length, 1);
      if ('digit' in q.correct) assert.ok(q.options.every(word => NATO_NUMBERS.some(e => e.word === word)), 'Digit distractors are other canonical digits');
    }
  }
  assert.equal(JSON.stringify([NATO_ALPHABET, NATO_NUMBERS]), before);
});

test('all ten digits score correctly and mistakes retry only missed symbols including special pronunciations', () => {
  let session = createQuizSession({ symbols: set('digits').symbols, length: 10, random: random(9) });
  const missed = ['3', '5', '9'];
  session = finish(session, q => missed.includes(entrySymbol(q.correct)) ? q.options.find(word => word !== q.correct.word) : q.correct.word);
  const results = quizSessionResults(session);
  assert.equal(results.correct, 7); assert.equal(results.accuracyPercent, 70);
  assert.deepEqual(results.missed.map(a => a.symbol).sort(), missed);
  const retry = retryQuizMistakes(session, random(10));
  assert.deepEqual(retry.symbols.slice().sort(), missed);
  assert.deepEqual(retry.questions.map(q => q.correct.speechText).sort(), ['tree', 'fife', 'niner'].sort());
  assert.equal(quizSessionResults(finish(retry, q => q.correct.word)).correct, 3);
});

test('mixed full round scores all 36 and switching sets rejects outstanding letter and digit actions', () => {
  const letters = createQuizSession({ length: 5, random: random(1) });
  const oldGuard = quizActionGuard(letters);
  const digits = restartQuizSession(letters, { symbols: set('digits').symbols, length: 10, random: random(2) });
  assert.equal(submitQuizAnswer(digits, oldGuard, digits.questions[0].correct.word), digits);
  const digitGuard = quizActionGuard(digits);
  const mixed = restartQuizSession(digits, { symbols: set('mixed').symbols, length: 36, random: random(3) });
  assert.equal(submitQuizAnswer(mixed, digitGuard, mixed.questions[0].correct.word), mixed);
  const result = quizSessionResults(finish(mixed, q => q.correct.word));
  assert.deepEqual([result.total, result.correct, result.accuracyPercent], [36, 36, 100]);
});

test('postcode and callsign audio retain complete source order and canonical speech rather than shuffled practice order', () => {
  const postcode = practiceExampleOutput(set('postcode'));
  assert.equal(postcode.text, 'Sierra Whiskey One Alfa / One Alfa Alfa');
  assert.deepEqual(postcode.speech.map(token => token.text), ['Sierra', 'Whiskey', 'One', 'Alfa', 'One', 'Alfa', 'Alfa']);
  assert.equal(postcode.speech[3].pauseAfterMs, 300);
  const callsign = practiceExampleOutput(set('callsign'));
  assert.equal(callsign.text, 'November Three Five Nine Alfa Bravo');
  assert.deepEqual(callsign.speech.map(token => token.text), ['November', 'tree', 'fife', 'niner', 'Alfa', 'Bravo']);
  assert.deepEqual(set('postcode').symbols, ['S', 'W', '1', 'A']);
  assert.deepEqual(set('callsign').symbols, ['N', '3', '5', '9', 'A', 'B']);
});

test('round choices offer a full coverage cycle without duplicates for every practice set', () => {
  for (const practice of PRACTICE_SETS) {
    const lengths = practiceLengths(practice);
    assert.equal(new Set(lengths).size, lengths.length);
    assert.ok(lengths.includes(practice.symbols.length));
    assert.ok(lengths.includes(5) && lengths.includes(10));
  }
  assert.deepEqual(practiceLengths(set('mixed')), [5, 10, 36]);
});
