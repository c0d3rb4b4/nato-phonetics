// Generate and verify every launcher consumer; no system fonts or network IO.
const sharp = require('sharp');
const fs = require('node:fs/promises');
const path = require('node:path');
const { createHash } = require('node:crypto');

const project = path.resolve(__dirname, '..');
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const layers = ['foreground', 'background', 'monochrome'];

async function inspect(bytes, size, kind) {
  const { data, info } = await sharp(bytes).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  if (info.width !== size || info.height !== size) throw new Error(`Invalid ${kind} dimensions: expected ${size}×${size}`);
  let transparent = 0, opaque = 0, painted = 0;
  const bounds = { left: size, top: size, right: -1, bottom: -1 };
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const i = (y * size + x) * 4, alpha = data[i + 3];
    if (!alpha) transparent++;
    if (alpha === 255) opaque++;
    if (alpha) {
      painted++;
      bounds.left = Math.min(bounds.left, x); bounds.right = Math.max(bounds.right, x);
      bounds.top = Math.min(bounds.top, y); bounds.bottom = Math.max(bounds.bottom, y);
      if (kind === 'monochrome' && (data[i] || data[i + 1] || data[i + 2])) throw new Error('Monochrome mask must use only black RGB and alpha');
      if (kind === 'foreground' || kind === 'monochrome') {
        // Android's central 66 dp safe zone, plus its inscribed circle, at 108 dp.
        const distance = Math.hypot((x + 0.5) / size * 108 - 54, (y + 0.5) / size * 108 - 54);
        if (x / size * 108 < 21 || (x + 1) / size * 108 > 87 || y / size * 108 < 21 || (y + 1) / size * 108 > 87 || distance > 33) {
          throw new Error(`${kind} painted pixel outside the safe zone at ${x},${y}`);
        }
      }
    }
  }
  if (!painted) throw new Error(`${kind} is empty`);
  if (['foreground', 'monochrome'].includes(kind) && (!transparent || !opaque)) throw new Error(`${kind} requires transparent padding and opaque artwork`);
  if (['opaque', 'background'].includes(kind) && opaque !== size * size) throw new Error(`${kind} must be fully opaque`);
  if (kind === 'background') {
    for (let i = 0; i < data.length; i += 4) if (data[i] !== 255 || data[i + 1] !== 253 || data[i + 2] !== 247) throw new Error('Background color drift');
  }
  return { width: size, height: size, transparent, opaque, painted, bounds, sha256: sha(bytes) };
}

async function generate(output = project) {
  output = path.resolve(output);
  if (output !== project) {
    if (project.startsWith(output + path.sep) || output === path.parse(output).root) throw new Error('Use a dedicated output directory');
    const existing = await fs.readdir(output).catch(error => { if (error.code === 'ENOENT') return []; throw error; });
    if (existing.length && !existing.includes('.nato-icon-output')) throw new Error('Custom output must be empty or owned by this generator');
  }
  const sources = {};
  for (const name of ['icon', 'icon-foreground', 'icon-monochrome']) sources[name] = await fs.readFile(path.join(project, `assets/images/${name}.svg`));
  const outputFiles = new Map();
  const raster = (name, size) => {
    const image = sharp(sources[name]).resize(size, size);
    return (name === 'icon' ? image.removeAlpha() : image).png().toBuffer();
  };
  const add = async (name, size, kind, buffer) => {
    const bytes = await buffer;
    outputFiles.set(name, { bytes, size, kind, measurement: await inspect(bytes, size, kind) });
  };
  for (const [name, size] of [['icon', 1024], ['favicon', 48], ['splash-icon', 200]]) {
    await add(`assets/images/${name}.png`, size, 'opaque', raster('icon', size));
  }
  for (const kind of layers) {
    const bytes = kind === 'background'
      ? sharp({ create: { width: 432, height: 432, channels: 4, background: '#FFFDF7' } }).png().toBuffer()
      : raster(`icon-${kind}`, 432);
    await add(`assets/images/android-icon-${kind}.png`, 432, kind, bytes);
    await add(`android/app/src/main/res/drawable-nodpi/ic_launcher_${kind}.png`, 432, kind, outputFiles.get(`assets/images/android-icon-${kind}.png`).bytes);
  }
  for (const [density, size] of [['mdpi', 48], ['hdpi', 72], ['xhdpi', 96], ['xxhdpi', 144], ['xxxhdpi', 192]]) {
    for (const name of ['ic_launcher', 'ic_launcher_round']) {
      await add(`android/app/src/main/res/mipmap-${density}/${name}.png`, size, 'opaque', raster('icon', size));
    }
  }
  await add('android/app/src/main/res/drawable-nodpi/splash_icon.png', 200, 'opaque', outputFiles.get('assets/images/splash-icon.png').bytes);
  await add('ios/NATOPhonetics/Images.xcassets/AppIcon.appiconset/AppIcon.png', 1024, 'opaque', outputFiles.get('assets/images/icon.png').bytes);
  await add('ios/NATOPhonetics/Images.xcassets/Splash.imageset/splash-icon.png', 200, 'opaque', outputFiles.get('assets/images/splash-icon.png').bytes);
  // Report nothing as generated until every written file has been read back and verified.
  for (const [name, entry] of outputFiles) {
    const destination = path.join(output, name);
    await fs.mkdir(path.dirname(destination), { recursive: true });
    await fs.writeFile(destination, entry.bytes);
    if (sha(await fs.readFile(destination)) !== entry.measurement.sha256) throw new Error(`Written asset mismatch: ${name}`);
  }
  const manifest = {
    schemaVersion: 1, sources: Object.fromEntries(Object.entries(sources).map(([name, bytes]) => [`assets/images/${name}.svg`, sha(bytes)])),
    adaptive: { canvasDp: 108, safeZoneDp: 66, maximumPaintedRadiusDp: 33, background: '#FFFDF7' },
    files: Object.fromEntries([...outputFiles].map(([name, entry]) => [name, { kind: entry.kind, ...entry.measurement }])),
  };
  await fs.writeFile(path.join(output, 'assets/images/icon-manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
  if (output !== project) await fs.writeFile(path.join(output, '.nato-icon-output'), 'Generated icon resources; safe to regenerate.\n');
  return manifest;
}

if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.length && (args.length !== 2 || args[0] !== '--output-dir')) {
    console.error('Usage: node scripts/generate-icons.js [--output-dir <empty-or-owned-directory>]');
    process.exitCode = 1;
  } else {
    generate(args[1]).then(manifest => {
      console.log(`Verified ${Object.keys(manifest.files).length} icon resources and assets/images/icon-manifest.json`);
      for (const [name, entry] of Object.entries(manifest.files)) console.log(`${name} ${entry.width}×${entry.height} ${entry.sha256}`);
    }).catch(error => { console.error(`Icon generation failed: ${error.message}`); process.exitCode = 1; });
  }
}

module.exports = { generate, inspect };
