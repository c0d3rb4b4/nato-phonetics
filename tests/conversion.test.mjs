import assert from 'node:assert/strict';
import test from 'node:test';
import { conversionOutput, convertText } from '../src/lib/conversion.js';

const output = text => conversionOutput(convertText(text));
test('conversion preserves canonical copy text and intentional speech representation', () => {
  assert.deepEqual(output(''), { text: '', speech: [], omitted: 0 });
  assert.equal(output('aj 359').text, 'Alfa Juliett / Three Five Nine');
  assert.deepEqual(output('aj 359').speech.map(t => t.text), ['Alfa', 'Juliet', 'tree', 'fife', 'niner']);
  assert.equal(output('aj 359').speech[1].pauseAfterMs, 300);
});
test('whitespace runs collapse to a single boundary without leading/trailing pauses', () => {
  for (const gap of [' ', '   ', '\t\n', '\r\n\u00A0']) {
    assert.deepEqual(output(` ${gap}a${gap}b${gap}`), output('a b'));
  }
  assert.deepEqual(output('\n\t '), { text: '', speech: [], omitted: 0 });
  assert.equal(conversionOutput(convertText('a b'), 800).speech[0].pauseAfterMs, 800);
});
test('useful punctuation is explicit literal speech, distinct from word boundaries', () => {
  const result = output('a-./@+b');
  assert.equal(result.text, 'Alfa dash dot slash at plus Bravo');
  assert.deepEqual(result.speech.map(t => t.text), ['Alfa', 'dash', 'dot', 'slash', 'at', 'plus', 'Bravo']);
  assert.equal(result.omitted, 0);
});
test('Unicode never silently expands, strips accents or vanishes from exports', () => {
  for (const value of ['é', 'ß', 'İ', 'Ａ', '🛰', '\u0301', '\u200D', '!']) {
    const result = output(value);
    assert.equal(result.omitted, 1);
    assert.equal(result.speech.length, 0);
    assert.match(result.text, /\[not spoken: .+ U\+[A-F0-9]+\]/u);
    assert.equal(convertText(value)[0].char, value);
  }
  assert.equal(output('aéßb').text, 'Alfa [not spoken: "é" U+00E9] [not spoken: "ß" U+00DF] Bravo');
  assert.equal(output('a 🛰 b').speech[0].pauseAfterMs, 300);
  assert.equal(output('a 🛰b').speech[0].pauseAfterMs, 300);
  assert.equal(output('a🛰b').speech[0].pauseAfterMs, undefined);
});
test('display/export/speech agree for mixed input without mutating tokens', () => {
  const parts = convertText('cv34\t7ap!');
  const before = structuredClone(parts);
  const result = conversionOutput(parts);
  assert.equal(result.text, 'Charlie Victor Three Four / Seven Alfa Papa [not spoken: "!" U+0021]');
  assert.equal(result.speech.length, 7);
  assert.deepEqual(parts, before);
});

test('playback indices track displayed tokens across boundaries, Unicode omissions and repeats', async () => {
  const { spokenPartIndices } = await import('../src/lib/conversion.js');
  const parts = convertText('a 🛰a-\n3!');
  const indices = spokenPartIndices(parts);
  assert.deepEqual(indices, [0, 3, 4, 6]);
  assert.equal(indices.length, conversionOutput(parts).speech.length);
  assert.deepEqual(spokenPartIndices(convertText('🛰 \t!')), []);
});
