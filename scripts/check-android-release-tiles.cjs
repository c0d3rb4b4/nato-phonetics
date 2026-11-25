// Actual native Android views/Layout/spans. No synthetic JS/onTextLayout values.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

async function checkCapture(capture, { scale, concealed = false }) {
  const { TILE_DESIGN: D, tileWidthForGrid } = await import('../src/lib/tileDesign.js');
  const { NATO_ALPHABET, NATO_NUMBERS } = await import('../src/data/natoData.js');
  assert.equal(capture.baselineSource, 'Actual Android TextView Layout.getLineBaseline + totalPaddingTop + transformMatrixToGlobal; physical pixels');
  const density = capture.dimensions.density;
  assert(density > 0 && Number.isFinite(density));
  assert(Math.abs(capture.dimensions.fontScale - scale) < 1e-6, 'Wrong observed environment');
  const rows = capture.values;
  const roots = rows.filter(r => /^(alphabet-[A-Z]|digit-\d|converter-\d+|quiz-card)$/.test(r.id));
  assert(roots.length, 'Missing actual tile roots');
  const baselines = [];
  const near = (actual, expected, label) => {
    assert(Number.isFinite(actual), 'Missing numeric observation: ' + label);
    assert(Math.abs(actual - expected) <= 1 + 1e-6, `${label}: ${actual} versus ${expected} (>1 physical pixel)`);
  };
  const ratio = scale * density;
  const required = id => {
    const matches = rows.filter(r => r.id === id);
    assert.equal(matches.length, 1, 'Missing/duplicate actual native part: ' + id);
    return matches[0];
  };
  for (const root of roots) {
    for (const ancestor of root.ancestors ?? []) {
      assert(ancestor.width > 0 && ancestor.height > 0 && ancestor.visibility === 0 && ancestor.alpha > 0, 'Hidden native subtree: ' + root.id);
    }
    // onLayout reports a float in logical units, even at fractional density.
    // The historical alphabet capture contains only cards and fits its viewport.
    const gridWidth = Math.fround((root.gridViewportWidth ?? root.ancestors[0].width) / density);
    const tileWidthPx = tileWidthForGrid(gridWidth, scale, root.siblingCount ?? roots.length) * density;
    near(root.frame.width, tileWidthPx, root.id + ' width');
    near(root.frame.height, D.height * ratio, root.id + ' height');
    assert.equal(root.radius?.unit, 'POINT', 'Missing actual native corner radius');
    near(root.radius.value * density, D.radius * ratio, root.id + ' radius');
    const header = required(root.id + '-header');
    near(header.frame.height, D.headerHeight * ratio, root.id + ' header');
    const symbolRow = required(root.id === 'quiz-card' ? 'quiz-letter' : root.id + '-letter-run');
    const entry = [...NATO_ALPHABET, ...NATO_NUMBERS].find(e => (e.letter ?? e.digit) === symbolRow.text);
    assert(entry, 'Unknown actual symbol');
    if (root.id.startsWith('alphabet-')) assert.equal(root.id, 'alphabet-' + symbolRow.text);
    if (root.id.startsWith('digit-')) assert.equal(root.id, 'digit-' + symbolRow.text);
    for (const [suffix, metric, content] of [
      ['letter', D.letter, symbolRow.text], ['word', D.word, entry.word], ['pronunciation', D.pronunciation, entry.pronunciation],
    ]) {
      if (concealed && suffix !== 'letter') {
        assert(!rows.some(r => r.id.startsWith(root.id + '-' + suffix)), 'Concealed answer present in native tree');
        continue;
      }
      const box = required(root.id + '-' + suffix);
      for (const key of ['x', 'y', 'width', 'height']) {
        const observed = box.frame[key] - (key === 'x' || key === 'y' ? root.frame[key] : 0);
        const expected = key === 'width' ? tileWidthPx - 2 * metric.x * ratio : metric[key] * ratio;
        near(observed, expected, box.id + ' ' + key);
      }
      const run = suffix === 'letter' ? symbolRow : required(box.id + '-run');
      assert.equal(run.text, content, box.id + ' content');
      assert.equal(run.lines?.length, 1, box.id + ' actual single line');
      assert.equal(run.lines[0].start, 0);
      assert.equal(run.lines[0].end, content.length);
      assert.equal(run.includeFontPadding, false);
      const style = run.spans.find(s => s.class.endsWith('.CustomStyleSpan'));
      assert.equal(style?.getFontFamily, metric.family, box.id + ' family');
      assert.equal(style.getWeight, Number(metric.weight), box.id + ' weight');
      assert.equal(style.getStyle, suffix === 'pronunciation' ? 2 : 0, box.id + ' style');
      near(run.resolvedTextSizePx, metric.size * ratio, box.id + ' resolved font size');
      // Android rounds the inner SP-sized Text constraint separately. The
      // original contract measures the outer box and transformed baseline;
      // actual glyph height/clipping is independently checked from PNG ink.
      const observed = run.frame.y - root.frame.y + run.totalPaddingTop + run.lines[0].baseline;
      const expected = metric.baseline * ratio;
      const deltaPhysicalPixels = Math.abs(observed - expected);
      near(observed, expected, box.id + ' actual Layout baseline');
      baselines.push({ id: box.id, observed, expected, deltaPhysicalPixels, passed: true });
    }
  }
  return { passed: true, tiles: roots.length, measuredBaselines: baselines.length, baselines,
    maxBaselineDeltaPhysicalPixels: Math.max(...baselines.map(b => b.deltaPhysicalPixels)),
    baselineTolerancePhysicalPixels: 1, geometryTolerancePhysicalPixels: 1,
    source: capture.baselineSource };
}

async function main(directory, mode = 'final') {
  const files = fs.readdirSync(directory).filter(f => f.endsWith('-native-layout.json') && f.startsWith(mode + '-'));
  assert(files.length, 'No actual native captures');
  const identity = JSON.parse(fs.readFileSync(path.join(directory, 'identity.json')));
  assert.equal(identity.nonDebuggable, true);
  assert.match(identity.candidateSha256, /^[a-f0-9]{64}$/);
  const reports = [];
  const captures = [];
  for (const file of files) {
    const capture = JSON.parse(fs.readFileSync(path.join(directory, file)));
    captures.push({ file, capture });
    assert.equal(capture.candidateSha256, identity.candidateSha256, 'Wrong candidate: ' + file);
    const report = await checkCapture(capture, { scale: capture.dimensions.fontScale, concealed: file.includes('quiz-question') });
    reports.push({ file, ...report });
  }
  if (mode === 'window') {
    assert.equal(captures.length, 7, 'Missing required product window stage');
    assert.equal(new Set(captures.map(r => r.capture.activityIdentity)).size, 1, 'Activity replaced during window changes');
    for (const [prefix, expected] of [['window-converter-', 4], ['window-quiz-', 3]]) {
      const group = captures.filter(r => r.file.startsWith(prefix));
      assert.equal(group.length, expected, 'Missing converter/quiz window stage');
      const initial = group[0].capture.values.filter(r => /^(converter-\d+|quiz-card)$/.test(r.id));
      for (const { capture } of group) for (const root of initial) {
        assert.equal(capture.values.find(r => r.id === root.id)?.identity, root.identity, 'Native tile replaced during resize: ' + root.id);
      }
    }
  }
  fs.writeFileSync(path.join(directory, mode === 'final' ? 'native-layout-checks.json' : mode + '-layout-checks.json'), JSON.stringify(reports, null, 2) + '\n');
  console.log(JSON.stringify({ passed: true, groups: reports.length, measuredBaselines: reports.reduce((n, r) => n + r.measuredBaselines, 0),
    maxBaselineDeltaPhysicalPixels: Math.max(...reports.map(r => r.maxBaselineDeltaPhysicalPixels)) }));
}

module.exports = { checkCapture, main };
if (require.main === module) main(process.argv[2], process.argv.includes('--checkpoint') ? 'checkpoint' : process.argv.includes('--windows') ? 'window' : process.argv.includes('--narrow') ? 'narrow' : 'final').catch(error => { console.error(error); process.exitCode = 1; });
