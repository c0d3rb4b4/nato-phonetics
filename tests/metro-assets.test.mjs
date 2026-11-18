import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';

const require = createRequire(import.meta.url);
const { getAssetSize } = require('metro/private/Assets');

test('native bundler reads the real release image dimensions and leaves fonts opaque', () => {
  const manifest = JSON.parse(fs.readFileSync(new URL('../assets/images/icon-manifest.json', import.meta.url)));
  for (const [file, { width, height }] of Object.entries(manifest.files)) {
    const content = fs.readFileSync(new URL(`../${file}`, import.meta.url));
    assert.deepEqual(getAssetSize('png', content, file), { width, height }, file);
  }
  const font = fs.readFileSync(new URL('../assets/fonts/NatoTile-SemiBold.ttf', import.meta.url));
  assert.equal(getAssetSize('ttf', font, 'NatoTile-SemiBold.ttf'), null);
});

test('malformed asset bytes fail within a bounded subprocess instead of hanging bundling', () => {
  // Bound the whole worker: a parser loop must not hang the test runner itself.
  const worker = String.raw`
    const assert = require('node:assert/strict');
    const { getAssetSize } = require('metro/private/Assets');
    const types = ['png','jpg','jpeg','bmp','gif','webp','psd','svg','tiff','ktx'];
    const malformed = [
      Buffer.alloc(0), Buffer.alloc(256), Buffer.from('not an image'),
      Buffer.from('ffd8ffe00000','hex'), // JPEG: non-advancing segment
      Buffer.from('49492a0008000000010000010400010000000000000008000000','hex'), // TIFF: cyclic IFD
      Buffer.from('89504e470d0a1a0a0000000043674249','hex'), // PNG: truncated CgBI
      Buffer.from('00000018667479706865696300000000686569636d696631000000006d657461','hex'),
      Buffer.from('69636e73000000100000000000000000','hex'), // ICNS: zero-size chunk
      Buffer.from('0000000c4a584c200d0a870a000000006a786c63','hex'), // JXL: zero-size box
    ];
    for (const type of types) for (const bytes of malformed) {
      assert.throws(() => getAssetSize(type, bytes, 'malformed.' + type), /[Ii]mage/);
    }
    // Deterministic invalid signatures exercise every supported format. This
    // is a bounded regression corpus, not a claim of comprehensive fuzzing.
    let seed = 1337;
    for (let i = 0; i < 128; i++) {
      const bytes = Buffer.alloc(64 + i);
      for (let n = 0; n < bytes.length; n++) {
        seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
        bytes[n] = seed >>> 24;
      }
      for (const type of types) assert.throws(() => getAssetSize(type, bytes, 'invalid.' + type));
    }
    console.log('1360 malformed type/buffer pairs rejected');
  `;
  const result = spawnSync(process.execPath, ['-e', worker], { cwd: new URL('..', import.meta.url), timeout: 5000, encoding: 'utf8' });
  assert.equal(result.error, undefined, result.error?.message);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /1360 malformed type\/buffer pairs rejected/);
});
