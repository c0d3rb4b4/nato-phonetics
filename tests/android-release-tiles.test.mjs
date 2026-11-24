import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { checkCapture } = require('../scripts/check-android-release-tiles.cjs');
const captured = () => JSON.parse(fs.readFileSync(new URL('./fixtures/android-observations/release-alphabet-layout.json', import.meta.url)));

test('actual production Release native views/spans/Layout satisfy the unchanged tile contract', async () => {
  const result = await checkCapture(captured(), { scale: 1 });
  assert.equal(result.measuredBaselines, 78);
  assert.equal(result.tiles, 26);
});

test('native gate rejects missing parts/lines, wrong font and >1px actual baseline drift', async () => {
  for (const mutate of [
    c => { c.values = c.values.filter(r => r.id !== 'alphabet-A-word-run'); },
    c => { c.values.find(r => r.id === 'alphabet-A-word-run').lines = []; },
    c => { c.values.find(r => r.id === 'alphabet-A-word-run').frame.y += 1.01; },
    c => { c.values.find(r => r.id === 'alphabet-A-word-run').spans.find(s => s.class.endsWith('.CustomStyleSpan')).getFontFamily = 'fallback'; },
    c => { c.values.find(r => r.id === 'alphabet-A-word-run').resolvedTextSizePx -= 3; },
    c => { c.values.find(r => r.id === 'alphabet-A').radius.value = 0; },
    c => { c.values.find(r => r.id === 'alphabet-A-word').frame.width -= 2; },
    c => { c.dimensions.fontScale = 2; },
    c => { c.values.find(r => r.id === 'alphabet-A').ancestors[0].width = 0; },
  ]) {
    const capture = captured(); mutate(capture);
    await assert.rejects(checkCapture(capture, { scale: 1 }));
  }
});

test('native gate rejects exposed concealed answer and synthetic observation provenance', async () => {
  await assert.rejects(checkCapture(captured(), { scale: 1, concealed: true }));
  const capture = captured(); capture.baselineSource = 'Synthetic JS replacement';
  await assert.rejects(checkCapture(capture, { scale: 1 }));
});
