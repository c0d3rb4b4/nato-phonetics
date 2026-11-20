// Compare actual instruction pixels: a live text-size change must not leave
// the identical old glyph raster. Cold launch is a separate observation.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const sharp = require('sharp');
(async () => {
  const names = ['ordinary-transition-0-scale1', 'ordinary-transition-1-scale2',
    'ordinary-transition-2-scale1', 'ordinary-transition-3-scale2',
    'ordinary-transition-4-scale1', 'alphabet-cold-scale2'];
  const observations = [];
  for (const name of names) {
    const data = JSON.parse(fs.readFileSync(path.join(__dirname, `${name}-text-layout.json`)));
    const row = data.values.find(r => r.frame?.height > 0 && r.text.startsWith('Tap a card'));
    const frame = row.frame, density = data.dimensions.scale;
    const rasterRegion = { left: Math.round(frame.pageX * density), top: Math.round(frame.pageY * density),
      width: Math.round(frame.width * density), height: Math.round(frame.height * density) };
    const raw = await sharp(path.join(__dirname, '../screenshots/android', `${name}.png`)).extract(rasterRegion).raw().toBuffer();
    observations.push({ name, fontScale: data.dimensions.fontScale, instruction: row.text, frame, rasterRegion,
      rasterSha256: crypto.createHash('sha256').update(raw).digest('hex') });
  }
  const file = path.join(__dirname, 'ordinary-text-result.json');
  const result = { ...JSON.parse(fs.readFileSync(file)), observations,
    liveInstructionRasterMatchesDefault: observations.slice(1, 5).every(r => r.rasterSha256 === observations[0].rasterSha256),
    cold2InstructionHeight: observations[5].frame.height, live2InstructionHeight: observations[1].frame.height };
  result.status = result.liveInstructionRasterMatchesDefault ? 'failed-live-ordinary-text-sizing' : 'requires-review';
  fs.writeFileSync(file, JSON.stringify(result, null, 2) + '\n');
  console.log(JSON.stringify({ status: result.status, liveInstructionRasterMatchesDefault: result.liveInstructionRasterMatchesDefault,
    cold2InstructionHeight: result.cold2InstructionHeight, live2InstructionHeight: result.live2InstructionHeight }));
  process.exitCode = result.liveInstructionRasterMatchesDefault ? 1 : 0;
})().catch(error => { console.error(error); process.exitCode = 1; });
