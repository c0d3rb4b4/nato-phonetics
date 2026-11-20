import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { NATO_ALPHABET, NATO_NUMBERS } from '../src/data/natoData.js';

const root = new URL('../', import.meta.url);
const manifest = JSON.parse(readFileSync(new URL('assets/fonts/manifest.json', root), 'utf8'));
const read = path => readFileSync(new URL(path, root));

// Read the actual shipped outlines' advance table, rather than trusting a
// second hand-maintained width list. All teaching labels use BMP characters.
function fontMetrics(bytes) {
  const tables = new Map();
  for (let i = 0; i < bytes.readUInt16BE(4); i++) {
    const offset = 12 + i * 16;
    tables.set(bytes.toString('ascii', offset, offset + 4), bytes.readUInt32BE(offset + 8));
  }
  const cmap = tables.get('cmap');
  let mapping;
  for (let i = 0; i < bytes.readUInt16BE(cmap + 2); i++) {
    const record = cmap + 4 + i * 8;
    const start = cmap + bytes.readUInt32BE(record + 4);
    if (bytes.readUInt16BE(start) === 4) { mapping = start; break; }
  }
  assert.ok(mapping, 'A Unicode BMP mapping is packaged');
  const segments = bytes.readUInt16BE(mapping + 6) / 2;
  const end = mapping + 14;
  const start = end + segments * 2 + 2;
  const delta = start + segments * 2;
  const ranges = delta + segments * 2;
  function glyph(code) {
    for (let i = 0; i < segments; i++) {
      if (code < bytes.readUInt16BE(start + i * 2) || code > bytes.readUInt16BE(end + i * 2)) continue;
      const adjustment = bytes.readInt16BE(delta + i * 2);
      const range = bytes.readUInt16BE(ranges + i * 2);
      if (!range) return (code + adjustment) & 0xffff;
      const value = bytes.readUInt16BE(ranges + i * 2 + range + (code - bytes.readUInt16BE(start + i * 2)) * 2);
      return value ? (value + adjustment) & 0xffff : 0;
    }
    return 0;
  }
  const units = bytes.readUInt16BE(tables.get('head') + 18);
  const metricsCount = bytes.readUInt16BE(tables.get('hhea') + 34);
  return {
    units,
    weight: bytes.readUInt16BE(tables.get('OS/2') + 4),
    italic: !!(bytes.readUInt16BE(tables.get('OS/2') + 62) & 1),
    width(text, size) {
      return [...text].reduce((sum, char) => {
        const id = glyph(char.codePointAt(0));
        assert.notEqual(id, 0, `Font contains ${char}`);
        return sum + bytes.readUInt16BE(tables.get('hmtx') + Math.min(id, metricsCount - 1) * 4);
      }, 0) * size / units;
    },
  };
}

test('shipped tile faces have pinned outlines, real weights and a real italic face on Android and iOS', () => {
  const plist = read('ios/NATOPhonetics/Info.plist').toString();
  const project = read('ios/NATOPhonetics.xcodeproj/project.pbxproj').toString();
  assert.equal(manifest.license, 'OFL-1.1');
  for (const face of manifest.faces) {
    const data = read(`assets/fonts/${face.file}`);
    assert.equal(createHash('sha256').update(data).digest('hex'), face.sha256, face.file);
    const metrics = fontMetrics(data);
    assert.equal(metrics.weight, face.weight);
    assert.equal(metrics.italic, face.italic);
    assert.equal(metrics.units, face.unitsPerEm);
    assert.deepEqual(read(`android/app/src/main/assets/fonts/${face.file}`), data, 'Android bundles identical font bytes');
    assert.ok(plist.includes(face.file), 'iOS registers the actual file');
    assert.ok(project.includes(face.file), 'Xcode packages the actual file');
  }
});

test('every canonical symbol, word and guide fits the shared tile at its specified font size', () => {
  const faces = Object.fromEntries(manifest.faces.map(face => [face.weight, fontMetrics(read(`assets/fonts/${face.file}`))]));
  for (const entry of [...NATO_ALPHABET, ...NATO_NUMBERS]) {
    const symbol = 'letter' in entry ? entry.letter : entry.digit;
    assert.ok(faces[800].width(symbol, 36) <= 110, `${symbol}: header width`);
    assert.ok(faces[600].width(entry.word, 16) <= 94, `${entry.word}: 8-unit side padding retained`);
    assert.ok(faces[400].width(entry.pronunciation, 11) <= 94, `${entry.pronunciation}: no wrapping or shrink required`);
  }
});
