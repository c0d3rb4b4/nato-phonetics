import assert from 'node:assert/strict';
import test from 'node:test';
import { tileWidthForGrid } from '../src/lib/tileDesign.js';

test('a new column fits at the minimum tile width and expands as space allows', () => {
  // Content widths after the screen's horizontal padding.
  assert.equal(tileWidthForGrid(315, 1, 26), 110);
  assert.equal(tileWidthForGrid(316, 1, 26), 100);
  assert.equal(tileWidthForGrid(328, 1, 26), 104);
  assert.equal(tileWidthForGrid(358, 1, 26), 110);
  assert.equal(tileWidthForGrid(424, 1, 26), 100);
  assert.equal(tileWidthForGrid(328, 1, 1), 110);
});

test('enlarged tiles keep their minimum width, including at fractional font scales', () => {
  assert.equal(tileWidthForGrid(328, 2, 26), 220);
  assert.equal(tileWidthForGrid(408, 2, 26), 200);
  assert.equal(tileWidthForGrid(328, 3, 26), 328);
  assert.equal(tileWidthForGrid(288, 3, 26), 330);
  assert.equal(tileWidthForGrid(233, 1.125, 26), 112.5);
});
