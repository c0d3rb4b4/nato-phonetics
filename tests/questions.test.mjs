import assert from 'node:assert/strict';
import test from 'node:test';
import { NATO_ALPHABET } from '../src/data/natoData.js';
import { QUIZ_DISTRACTORS } from '../src/data/quizDistractors.js';
import { createQuestion, generateDistractors, normalizeAnswerKey, selectDistractors, shuffle } from '../src/lib/questions.js';

function seeded(seed) {
  let state = seed >>> 0;
  return () => {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 2 ** 32;
  };
}

function assertValid(question) {
  const keys = question.options.map(normalizeAnswerKey);
  assert.equal(question.options.length, 4);
  assert.equal(new Set(keys).size, 4, JSON.stringify(question.options));
  assert.equal(keys.filter(key => key === normalizeAnswerKey(question.correct.word)).length, 1);
  assert.equal(question.options.filter(word => word === question.correct.word).length, 1);
}

test('answer keys recognize explicit alternate spellings, accents, case and separators', () => {
  for (const alternatives of [
    ['Alfa', 'Alpha', ' ALPHA ', 'Álfa'],
    ['Juliett', 'Juliet', 'JULIETT'],
    ['Quebec', 'Québec', 'QUEBEC'],
    ['X-ray', 'X ray', 'X.RAY', 'x–ray'],
  ]) {
    assert.equal(new Set(alternatives.map(normalizeAnswerKey)).size, 1);
  }
  assert.notEqual(normalizeAnswerKey('Alpha'), normalizeAnswerKey('Alpine'));
  assert.notEqual(normalizeAnswerKey('Juliett'), normalizeAnswerKey('Jupiter'));
});

test('all canonical letters produce four distinct choices with one correct answer over varied draws', () => {
  for (let index = 0; index < NATO_ALPHABET.length; index += 1) {
    for (let seed = 1; seed <= 100; seed += 1) {
      const random = seeded(seed);
      let first = true;
      const question = createQuestion(() => {
        if (first) { first = false; return (index + 0.5) / NATO_ALPHABET.length; }
        return random();
      });
      assert.equal(question.correct, NATO_ALPHABET[index]);
      assertValid(question);
    }
  }
});

test('real duplicate/ambiguous pools cannot repeat a choice or include a correct-answer alias', () => {
  for (const letter of ['A', 'D', 'F', 'J', 'K', 'P', 'Q', 'R', 'U']) {
    const correct = NATO_ALPHABET.find(entry => entry.letter === letter);
    for (let seed = 1; seed <= 50; seed += 1) {
      const distractors = generateDistractors(correct, seeded(seed));
      assert.equal(new Set(distractors.map(normalizeAnswerKey)).size, 3);
      assert.ok(distractors.every(word => normalizeAnswerKey(word) !== normalizeAnswerKey(correct.word)));
    }
  }
});

test('deficient pools recover with deterministic canonical choices without retaining blanks or duplicates', () => {
  const alfa = NATO_ALPHABET[0];
  assert.deepEqual(selectDistractors(alfa, [], () => 0.999), ['Bravo', 'Charlie', 'Delta']);
  assert.deepEqual(selectDistractors(alfa, ['Alpha', 'ALFA', ' ', '', ' Archer ', 'archer'], () => 0.999), ['Archer', 'Bravo', 'Charlie']);
  for (const correct of NATO_ALPHABET) {
    assertValid({ correct, options: [correct.word, ...selectDistractors(correct, [correct.word], seeded(5))] });
  }
  for (const [symbol, aliases] of [
    ['J', ['Juliet', ' JULIETT ', 'Juliet']],
    ['Q', ['Quebec', 'Québec', 'QUEBEC']],
    ['X', ['X ray', 'X-ray', 'X.RAY']],
  ]) {
    const correct = NATO_ALPHABET.find(entry => entry.letter === symbol);
    const distractors = selectDistractors(correct, aliases, seeded(6));
    assertValid({ correct, options: [correct.word, ...distractors] });
    assert.ok(distractors.every(word => !aliases.includes(word)));
  }
});

test('Fisher–Yates uses each shrinking range once and preserves the input', () => {
  const input = Object.freeze(['A', 'B', 'C', 'D']);
  let draws = 0;
  assert.deepEqual(shuffle(input, () => { draws += 1; return 0; }), ['B', 'C', 'D', 'A']);
  assert.equal(draws, 3);
  assert.deepEqual(shuffle(input, () => 0.999), ['A', 'B', 'C', 'D']);
  assert.deepEqual(input, ['A', 'B', 'C', 'D']);
  assert.deepEqual(shuffle([], () => { throw new Error('empty shuffle should not draw'); }), []);
  assert.deepEqual(shuffle(['only'], () => { throw new Error('single item should not draw'); }), ['only']);
});

test('seeded generation is reproducible, reaches every letter, and leaves content untouched', () => {
  const original = JSON.stringify(QUIZ_DISTRACTORS);
  const first = seeded(3721);
  const second = seeded(3721);
  const reached = new Set();
  for (let index = 0; index < 10000; index += 1) {
    const question = createQuestion(first);
    assert.deepEqual(question, createQuestion(second));
    assertValid(question);
    reached.add(question.correct.letter);
  }
  assert.equal(reached.size, 26);
  assert.equal(JSON.stringify(QUIZ_DISTRACTORS), original);
});
