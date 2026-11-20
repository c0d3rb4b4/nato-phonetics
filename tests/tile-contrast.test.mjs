import assert from 'node:assert/strict';
import test from 'node:test';
import { NATO_ALPHABET, NATO_NUMBERS } from '../src/data/natoData.js';
import { TILE_DESIGN } from '../src/lib/tileDesign.js';

function luminance(hex) {
  assert.match(hex, /^#[\da-f]{6}$/i, 'Contrast input is an explicit opaque sRGB color');
  const channels = hex.slice(1).match(/../g).map(value => {
    const channel = parseInt(value, 16) / 255;
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}

function contrast(a, b) {
  const values = [luminance(a), luminance(b)].sort((a, b) => b - a);
  return (values[0] + 0.05) / (values[1] + 0.05);
}

test('small word and italic guide text reach 4.5:1 on every letter and digit palette color', () => {
  for (const entry of [...NATO_ALPHABET, ...NATO_NUMBERS]) {
    for (const [part, foreground] of [['word', TILE_DESIGN.colors.text], ['guide', TILE_DESIGN.colors.guide]]) {
      const ratio = contrast(foreground, entry.color);
      assert.ok(ratio >= 4.5, `${entry.word} ${part}: ${ratio.toFixed(3)}:1 is below 4.5:1`);
    }
  }
});
