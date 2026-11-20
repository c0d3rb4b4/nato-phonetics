import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtemp, readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const require = createRequire(import.meta.url);
const sharp = require('sharp');
const { inspect } = require('../scripts/generate-icons.js');
const root = new URL('../', import.meta.url);
const script = new URL('../scripts/generate-icons.js', import.meta.url);
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const cli = output => spawnSync(process.execPath, [fileURLToPath(script), '--output-dir', output], { encoding: 'utf8' });

test('regeneration verifies all shipped resources, native copies and deterministic output', async () => {
  const temporary = await mkdtemp(path.join(tmpdir(), 'nato-icons-'));
  try {
    const first = cli(temporary);
    assert.equal(first.status, 0, first.stderr);
    assert.match(first.stdout, /^Verified 22 icon resources/);
    const manifest = JSON.parse(await readFile(new URL('assets/images/icon-manifest.json', root)));
    assert.deepEqual(JSON.parse(await readFile(path.join(temporary, 'assets/images/icon-manifest.json'))), manifest);
    for (const [name, entry] of Object.entries(manifest.files)) {
      const shipped = await readFile(new URL(name, root));
      assert.equal(digest(shipped), entry.sha256, `Consumer ${name} matches the verified manifest`);
      assert.deepEqual(await readFile(path.join(temporary, name)), shipped, `Reproducible ${name}`);
      assert.deepEqual(await inspect(shipped, entry.width, entry.kind), (({ kind: _kind, ...measurement }) => measurement)(entry));
    }
    assert.equal(cli(temporary).status, 0, 'An owned output can be regenerated');
    assert.deepEqual(JSON.parse(await readFile(path.join(temporary, 'assets/images/icon-manifest.json'))), manifest);
    assert.equal((await sharp(await readFile(new URL('ios/NATOPhonetics/Images.xcassets/AppIcon.appiconset/AppIcon.png', root))).metadata()).hasAlpha, false, 'iOS icon has no alpha channel');
    for (const name of Object.keys(manifest.sources)) assert.doesNotMatch(await readFile(new URL(name, root), 'utf8'), /<text\b|font-family|https?:\/\/(?!www\.w3\.org)/, 'Outlined local vector source');
    const xml = await readFile(new URL('android/app/src/main/res/mipmap-anydpi-v26/ic_launcher.xml', root), 'utf8');
    for (const kind of ['background', 'foreground', 'monochrome']) assert.ok(xml.includes(`@drawable/ic_launcher_${kind}`));
    assert.equal(await readFile(new URL('android/app/src/main/res/mipmap-anydpi-v26/ic_launcher_round.xml', root), 'utf8'), xml);
  } finally { await rm(temporary, { recursive: true, force: true }); }
});

test('mask guard rejects opaque, blank, incorrectly sized, colored and out-of-safe-zone layers', async () => {
  const svg = content => sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="108" height="108">${content}</svg>`)).png().toBuffer();
  await assert.rejects(inspect(await svg('<rect width="108" height="108"/>'), 108, 'monochrome'), /safe zone/);
  await assert.rejects(inspect(await svg(''), 108, 'foreground'), /empty/);
  await assert.rejects(inspect(await svg(''), 432, 'foreground'), /dimensions/);
  await assert.rejects(inspect(await svg('<circle cx="54" cy="54" r="10" fill="red"/>'), 108, 'monochrome'), /black RGB/);
  await assert.rejects(inspect(await svg('<circle cx="22" cy="22" r="5"/>'), 108, 'foreground'), /safe zone/);
  const mono = await readFile(new URL('assets/images/android-icon-monochrome.png', root));
  const { data } = await sharp(mono).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  assert.equal(data[(216 * 432 + 216) * 4 + 3], 0, 'Bubble interior remains transparent for themed tinting');
  assert.ok(data.filter((_, index) => index % 4 === 3 && data[index] > 0).length > 1000, 'Mask carries actual artwork');
});

test('invalid and unwritable outputs fail nonzero without claiming generated resources', async () => {
  const temporary = await mkdtemp(path.join(tmpdir(), 'nato-icon-fail-'));
  try {
    const blocker = path.join(temporary, 'file');
    await writeFile(blocker, 'keep me');
    for (const output of [blocker, path.join(blocker, 'child')]) {
      const result = cli(output);
      assert.notEqual(result.status, 0);
      assert.match(result.stderr, /Icon generation failed:/);
      assert.equal(result.stdout, '', 'No success/output inventory on failure');
    }
    const partial = path.join(temporary, 'partial');
    await mkdir(partial);
    await writeFile(path.join(partial, '.nato-icon-output'), 'owned');
    await writeFile(path.join(partial, 'assets'), 'blocks actual output creation');
    const result = cli(partial);
    assert.notEqual(result.status, 0);
    assert.equal(result.stdout, '');
    assert.match(result.stderr, /Icon generation failed:/);
    assert.equal(await readFile(blocker, 'utf8'), 'keep me');
    const unowned = cli(temporary);
    assert.notEqual(unowned.status, 0);
    assert.match(unowned.stderr, /empty or owned/);
    assert.equal(unowned.stdout, '');
  } finally { await rm(temporary, { recursive: true, force: true }); }
});
