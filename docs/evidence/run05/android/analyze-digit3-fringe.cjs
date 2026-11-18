// Decompose the strict converter digit-3 guide failure without changing its gate.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const sharp = require('sharp');

(async () => {
  const capture = path.join(__dirname, '../screenshots/android/converter-light.png');
  const layoutPath = path.join(__dirname, 'converter-light-native-layout.json');
  const glyphPath = path.join(__dirname, '../native-glyph-metrics.json');
  const layout = JSON.parse(fs.readFileSync(layoutPath));
  const glyphs = JSON.parse(fs.readFileSync(glyphPath));
  const { TILE_DESIGN: D } = await import(path.resolve(__dirname, '../../../../src/lib/tileDesign.js'));
  const rows = layout.values.filter(r => r.frame?.width > 0);
  const symbolRun = rows.find(r => r.id.endsWith('-letter-run') && r.text === '3');
  if (!symbolRun) throw Error('No actual rendered digit 3');
  const id = symbolRun.id.replace(/-letter-run$/, '');
  const tile = rows.find(r => r.id === id);
  const run = rows.find(r => r.id === `${id}-pronunciation-run`);
  const density = layout.dimensions.scale;
  const scale = tile.style.width / D.width;
  const ratio = density * scale;
  const nominalFontPixels = D.pronunciation.size * ratio;
  const inferredRoundedFontPixels = Math.ceil(nominalFontPixels);
  const actualBaselinePixels = (run.frame.pageY + run.nativeLineMeasurement.baseline) * density;
  const nominalBaselinePixels = tile.frame.pageY * density + D.pronunciation.baseline * ratio;
  const yMax = Math.max(...[...run.text].map(c => glyphs.Italic.glyphs[c][3]));
  const nominalOutlineTop = nominalBaselinePixels - yMax / 1000 * nominalFontPixels;
  const roundedOutlineTop = actualBaselinePixels - yMax / 1000 * inferredRoundedFontPixels;
  const { data, info } = await sharp(capture).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const background = [0, 1, 2].map(i => parseInt(tile.style.backgroundColor.slice(1 + i * 2, 3 + i * 2), 16));
  const foreground = [55, 65, 81];
  const vector = foreground.map((c, i) => c - background[i]);
  const denominator = vector.reduce((sum, v) => sum + v * v, 0);
  const x0 = Math.round(tile.frame.pageX * density + D.pronunciation.x * ratio);
  const y0 = Math.round(tile.frame.pageY * density + D.pronunciation.y * ratio);
  const x1 = Math.round(x0 + D.pronunciation.width * ratio);
  const y1 = Math.round(y0 + D.pronunciation.height * ratio);
  const pixels = [];
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
    const start = (y * info.width + x) * info.channels;
    const rgb = [...data.slice(start, start + 3)];
    const alpha = rgb.reduce((sum, c, i) => sum + (c - background[i]) * vector[i], 0) / denominator;
    const residual = Math.max(...rgb.map((c, i) => Math.abs(c - (background[i] + alpha * vector[i]))));
    if (residual <= 2 && rgb.some((c, i) => Math.abs(c - background[i]) > 8)) pixels.push({ x, y, rgb, alpha });
  }
  const firstRow = Math.min(...pixels.map(p => p.y));
  const firstRowPixels = pixels.filter(p => p.y === firstRow);
  const hash = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
  const result = {
    status: 'Rounding/antialias decomposition only; strict nominal raster gate remains failed',
    testID: id, text: run.text, density, scale,
    sourceHashes: { screenshot: hash(capture), nativeLayout: hash(layoutPath), glyphMetrics: hash(glyphPath), diagnostic: hash(__filename) },
    fontSize: { nominalPixels: nominalFontPixels, inferredRoundedPixels: inferredRoundedFontPixels,
      inference: 'RN TextAttributeProps.setFontSize applies ceil to PixelUtil SP conversion; this is source-derived, not a separate native TextPaint probe' },
    baseline: { observedFromTransformedFrameAndLineEvent: actualBaselinePixels, nominal: nominalBaselinePixels,
      deltaPhysicalPixels: actualBaselinePixels - nominalBaselinePixels },
    outline: { yMaxFontUnits: yMax, nominalTop: nominalOutlineTop, roundedFontAndMeasuredBaselineTop: roundedOutlineTop },
    firstSupportRow: { y: firstRow, pixels: firstRowPixels.length,
      alphaMin: Math.min(...firstRowPixels.map(p => p.alpha)), alphaMax: Math.max(...firstRowPixels.map(p => p.alpha)) },
    alphaThresholds: [0.05, 0.1, 0.25, 0.5, 0.9].map(alpha => {
      const selected = pixels.filter(p => p.alpha >= alpha); const top = Math.min(...selected.map(p => p.y));
      return { alpha, top, deltaFromNominal: top - nominalOutlineTop, deltaFromRoundedOutline: top - roundedOutlineTop };
    }),
    rawNominalGate: { tolerancePhysicalPixels: 2, topErrorPhysicalPixels: Math.abs(firstRow - nominalOutlineTop), passed: Math.abs(firstRow - nominalOutlineTop) <= 2 },
    conclusion: 'Faint first-row ink and independent font-size/baseline rounding explain the borderline result. No tolerance, pixel-edge convention or app source was changed; retain this nominal-gate miss under P05.8.'
  };
  fs.writeFileSync(path.join(__dirname, 'digit3-fringe-analysis.json'), JSON.stringify(result, null, 2) + '\n');
  console.log(JSON.stringify({ status: result.status, firstSupportRow: result.firstSupportRow, rawNominalGate: result.rawNominalGate }));
})().catch(error => { console.error(error); process.exit(1); });
