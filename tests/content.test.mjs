import assert from 'node:assert/strict';
import test from 'node:test';
import { NATO_ALPHABET, NATO_NUMBERS, LETTER_TO_ENTRY, DIGIT_TO_ENTRY } from '../src/data/natoData.js';

// Independent reference fixture: NATO's alphabet and ICAO Annex 10 explanation.
// Source links and pronunciation checks are in docs/AUDIO_VALIDATION.md.
const words = 'Alfa Bravo Charlie Delta Echo Foxtrot Golf Hotel India Juliett Kilo Lima Mike November Oscar Papa Quebec Romeo Sierra Tango Uniform Victor Whiskey X-ray Yankee Zulu'.split(' ');
const numbers = 'Zero One Two Three Four Five Six Seven Eight Nine'.split(' ');

test('all 26 letters have a unique, canonical mapping and matching lookup', () => {
  assert.equal(NATO_ALPHABET.length, 26);
  assert.equal(new Set(NATO_ALPHABET.map(entry => entry.letter)).size, 26);
  assert.deepEqual(NATO_ALPHABET.map(entry => entry.word), words);
  assert.deepEqual(NATO_ALPHABET.map(entry => entry.letter), [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ']);
  for (const entry of NATO_ALPHABET) {
    assert.equal(LETTER_TO_ENTRY[entry.letter], entry);
    assert.ok(entry.pronunciation.trim());
    assert.match(entry.color, /^#[\da-f]{6}$/i);
  }
});

test('all ten digits have a unique canonical mapping and radio pronunciation guides', () => {
  assert.equal(NATO_NUMBERS.length, 10);
  assert.equal(new Set(NATO_NUMBERS.map(entry => entry.digit)).size, 10);
  assert.deepEqual(NATO_NUMBERS.map(entry => entry.digit), [...'0123456789']);
  assert.deepEqual(NATO_NUMBERS.map(entry => entry.word), numbers);
  for (const entry of NATO_NUMBERS) {
    assert.equal(DIGIT_TO_ENTRY[entry.digit], entry);
    assert.ok(entry.pronunciation.trim());
    assert.match(entry.color, /^#[\da-f]{6}$/i);
  }
  assert.equal(DIGIT_TO_ENTRY['3'].pronunciation, 'TREE');
  assert.equal(DIGIT_TO_ENTRY['5'].pronunciation, 'FIFE');
  assert.equal(DIGIT_TO_ENTRY['9'].pronunciation, 'NIN-er');
});
