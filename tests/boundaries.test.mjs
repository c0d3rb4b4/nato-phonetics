import assert from 'node:assert/strict';
import test from 'node:test';
import { convertText } from '../src/lib/conversion.js';
import { createQuestion, generateDistractors } from '../src/lib/questions.js';
import { NATO_ALPHABET } from '../src/data/natoData.js';

test('conversion boundary shares canonical entries and exposes punctuation/Unicode policy', () => {
  assert.deepEqual(convertText(''), []);
  const tokens = convertText('aj 3-\n🛰');
  assert.deepEqual(tokens.map(token => token.type), ['letter', 'letter', 'space', 'number', 'punctuation', 'space', 'unknown']);
  assert.equal(tokens[0].entry.word, 'Alfa');
  assert.equal(tokens[1].entry.word, 'Juliett');
  assert.equal(tokens[3].entry.word, 'Three');
  assert.equal(tokens[4].word, 'dash');
  assert.equal(tokens[6].char, '🛰');
});

test('question boundary makes every canonical letter reachable with injected randomness', () => {
  for (let index = 0; index < NATO_ALPHABET.length; index++) {
    const question = createQuestion(() => (index + 0.5) / NATO_ALPHABET.length);
    assert.equal(question.correct, NATO_ALPHABET[index]);
    assert.equal(question.options.length, 4);
    assert.equal(question.options.filter(word => word === question.correct.word).length, 1);
    assert.equal(generateDistractors(question.correct, () => 0.5).includes(question.correct.word), false);
  }
  // Shuffle, alias equivalence and uniqueness regressions live in questions.test.mjs.
});
