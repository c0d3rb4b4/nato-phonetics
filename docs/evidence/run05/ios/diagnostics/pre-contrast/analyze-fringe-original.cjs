// Diagnose antialiasing separately from baseline/layout: retain the original
// solid-ink observations, then locate faint pixels on the same PNG/line boxes.
const fs = require('node:fs');
const path = require('node:path');
const sharp = require('sharp');
const root = path.resolve(__dirname, '../../../..');
(async () => {
  const { NATO_ALPHABET } = await import(path.join(root, 'src/data/natoData.js'));
  const observations = JSON.parse(fs.readFileSync(path.join(__dirname, 'tablet-raster-measurements.json')));
  const frames = {};
  for (const line of fs.readFileSync(path.join(__dirname, 'tablet-test.log'), 'utf8').split('\n')) {
    const match = line.match(/^CAPTUREFRAMES (\S+) (.+)$/);
    if (match) frames[`tablet-${match[1]}.png`] = JSON.parse(match[2]);
  }
  const cached = new Map();
  const results = [];
  for (const original of observations) {
    if (!cached.has(original.capture)) cached.set(original.capture,
      await sharp(path.join(__dirname, '../screenshots/ios', original.capture)).autoOrient().removeAlpha().raw().toBuffer({ resolveWithObject: true }));
    const { data, info } = cached.get(original.capture);
    const frame = frames[original.capture][`alphabet-${original.symbol}`];
    const entry = NATO_ALPHABET.find(entry => entry.letter === original.symbol);
    const part = {
      letter: { x: 20, y: 4, w: 70, h: 50, color: [31, 41, 51] },
      word: { x: 8, y: 83, w: 94, h: 22, color: [31, 41, 51] },
      guide: { x: 8, y: 111, w: 94, h: 16, color: [74, 85, 104] },
    }[original.part];
    const ratio = original.density * original.scale;
    const x0 = Math.round(frame.x * original.density + part.x * ratio);
    const y0 = Math.round(frame.y * original.density + part.y * ratio);
    const x1 = Math.round(x0 + part.w * ratio);
    const y1 = Math.round(y0 + part.h * ratio);
    const background = entry.color.match(/\w\w/g).map(hex => parseInt(hex, 16));
    const direction = background.map((value, i) => value - part.color[i]);
    const norm = direction.reduce((sum, value) => sum + value * value, 0);
    const rows = new Map();
    const solid = { top: Infinity, bottom: -Infinity, count: 0 };
    const thresholds = [0.05, 0.1].map(alpha => ({ alpha, top: Infinity, bottom: -Infinity, count: 0 }));
    for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
      const i = (y * info.width + x) * info.channels;
      const pixel = [data[i], data[i + 1], data[i + 2]];
      if (part.color.every((value, channel) => Math.abs(pixel[channel] - value) < 38)) {
        solid.top = Math.min(solid.top, y); solid.bottom = Math.max(solid.bottom, y); solid.count++;
      }
      const alpha = direction.reduce((sum, value, channel) => sum + value * (background[channel] - pixel[channel]), 0) / norm;
      const residual = Math.max(...pixel.map((value, channel) => Math.abs(value - (background[channel] - alpha * direction[channel]))));
      // A true foreground/background blend stays on their RGB line. Ignore any
      // pixel from unrelated UI or another color; 4 RGB steps cover quantization.
      if (residual > 4 || alpha < 0 || alpha > 1.03) continue;
      rows.set(y, Math.max(rows.get(y) || 0, alpha));
      for (const threshold of thresholds) if (alpha >= threshold.alpha) {
        threshold.top = Math.min(threshold.top, y);
        threshold.bottom = Math.max(threshold.bottom, y);
        threshold.count++;
      }
    }
    results.push({ capture: original.capture, symbol: original.symbol, part: original.part,
      background, foreground: part.color, expectedInk: original.expectedInk,
      solidThreshold38: { ...solid, delta: { top: solid.top - original.expectedInk.top, bottom: solid.bottom + 1 - original.expectedInk.bottom } },
      faintEdges: thresholds.map(value => ({ ...value, delta: {
        top: value.top - original.expectedInk.top, bottom: value.bottom + 1 - original.expectedInk.bottom,
      } })),
      topRows: [...rows.entries()].filter(([y]) => y >= Math.floor(original.expectedInk.top) - 1 && y <= solid.top + 1)
        .map(([y, maxAlpha]) => ({ y, maxAlpha })),
    });
  }
  const summary = { observations: results.length, solidInkMax: Math.max(...results.flatMap(row => [Math.abs(row.solidThreshold38.delta.top), Math.abs(row.solidThreshold38.delta.bottom)])),
    thresholds: [0.05, 0.1].map(alpha => ({ alpha,
      maxTopDelta: Math.max(...results.map(row => Math.abs(row.faintEdges.find(edge => edge.alpha === alpha).delta.top))),
      maxBottomDelta: Math.max(...results.map(row => Math.abs(row.faintEdges.find(edge => edge.alpha === alpha).delta.bottom))),
      outsideOnePixel: results.filter(row => {
        const edge = row.faintEdges.find(edge => edge.alpha === alpha);
        return Math.abs(edge.delta.top) > 1 || Math.abs(edge.delta.bottom) > 1;
      }).map(row => ({ capture: row.capture, symbol: row.symbol, part: row.part, edge: row.faintEdges.find(edge => edge.alpha === alpha) })),
    })),
    interpretation: 'Threshold38 observes near-solid foreground, not first raster ink or a measured text baseline. Alpha is inferred from RGB foreground/background blends; this diagnostic does not replace native line-baseline measurement or change its <=1 physical pixel contract.' };
  fs.writeFileSync(path.join(__dirname, 'tablet-antialias-analysis.json'), JSON.stringify({ summary, results }, null, 2) + '\n');
  console.log(JSON.stringify({ ...summary, thresholds: summary.thresholds.map(({outsideOnePixel,...rest}) => ({...rest, outsideOnePixelCount: outsideOnePixel.length, examples: outsideOnePixel.slice(0, 3)})) }, null, 2));
})().catch(error => { console.error(error); process.exit(1); });
