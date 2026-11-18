import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync, spawnSync } from 'node:child_process';
import { packageWeb } from '../scripts/package-web.cjs';
import { writeOfflineManifest } from '../scripts/offline-manifest.cjs';
import { ROUTE_TITLES } from '../src/navigation/routes.js';

const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const routes = Object.fromEntries(Object.keys(ROUTE_TITLES).map(route => [route, route === '/' ? '/index.html' : route + '.html']));
async function fixture(t) {
  const base = await fs.mkdtemp(path.join(os.tmpdir(), 'nato-web-package-'));
  t.after(() => fs.rm(base, { recursive: true, force: true }));
  const build = async (name, asset = 'app-AAAAAAAA.js', contents = 'console.log("sample")') => {
    const directory = path.join(base, name);
    await fs.mkdir(path.join(directory, 'assets'), { recursive: true });
    for (const page of Object.values(routes)) await fs.writeFile(path.join(directory, page.slice(1)), '<!doctype html>sample');
    await fs.writeFile(path.join(directory, 'assets', asset), contents);
    await fs.writeFile(path.join(directory, 'NatoTile-Italic-AAAAAAAA.ttf'), 'sample font');
    await writeOfflineManifest(directory, routes, [...Object.values(routes), '/assets/' + asset, '/NatoTile-Italic-AAAAAAAA.ttf']);
    return directory;
  };
  return { base, build, output: path.join(base, 'release.tar.gz') };
}
function extract(archive, directory) { execFileSync('tar', ['-xzf', archive, '-C', directory]); }

test('static release is deterministic, extractable and inventories exact bytes', async t => {
  const { base, build, output } = await fixture(t), directory = await build('current');
  const first = await packageWeb({ directory, output });
  await fs.utimes(path.join(directory, 'index.html'), new Date(), new Date());
  const second = await packageWeb({ directory, output: path.join(base, 'second.tar.gz') });
  assert.equal(first.sha256, second.sha256);
  const unpacked = path.join(base, 'unpacked'); await fs.mkdir(unpacked); extract(output, unpacked);
  const release = JSON.parse(await fs.readFile(path.join(unpacked, 'release.json')));
  for (const [name, record] of Object.entries(release.files)) {
    const bytes = await fs.readFile(path.join(unpacked, name));
    assert.equal(hash(bytes), record.sha256); assert.equal(bytes.length, record.bytes);
  }
  assert.equal(release.contentId, hash(JSON.stringify(release.files)));
  assert.equal((await fs.stat(path.join(unpacked, 'public/index.html'))).mode & 0o777, 0o644);
});

test('release retains immutable URLs transitively for forward and rollback switches', async t => {
  const { base, build, output } = await fixture(t);
  const old = await build('old'), current = await build('current', 'app-BBBBBBBB.js', 'new bytes');
  await fs.writeFile(path.join(old, 'credentials.txt'), 'must never be packaged');
  const result = await packageWeb({ directory: current, output, retain: [old] });
  assert.deepEqual(result.retainedAssets, ['/assets/app-AAAAAAAA.js']);
  const unpacked = path.join(base, 'unpacked'); await fs.mkdir(unpacked); extract(output, unpacked);
  const rollback = await packageWeb({ directory: old, output: path.join(base, 'rollback.tar.gz'), retain: [path.join(unpacked, 'public')] });
  assert.deepEqual(rollback.retainedAssets, ['/assets/app-BBBBBBBB.js']);
  assert(!Object.keys(result.files).some(name => name.includes('credentials')));
  await fs.writeFile(path.join(unpacked, 'public/assets/app-AAAAAAAA.js'), 'damaged older asset');
  await assert.rejects(packageWeb({ directory: old, output: path.join(base, 'damaged.tar.gz'), retain: [path.join(unpacked, 'public')] }), /Retained asset digest mismatch/);
  await fs.writeFile(path.join(old, 'assets/app-CCCCCCCC.js'), 'uninventoried asset');
  await assert.rejects(packageWeb({ directory: current, output: path.join(base, 'unknown.tar.gz'), retain: [old] }), /Uninventoried retained asset/);
});

test('immutable same-URL content collision rejects the release before writing', async t => {
  const { build, output } = await fixture(t);
  const old = await build('old'), directory = await build('current', 'app-AAAAAAAA.js', 'different bytes');
  await assert.rejects(packageWeb({ directory, output, retain: [old] }), /Immutable URL collision/);
  await assert.rejects(fs.stat(output), { code: 'ENOENT' });
});

test('mixed or partial build, worker drift and missing routes fail closed', async t => {
  const { base, build } = await fixture(t);
  for (const variant of ['corrupt', 'missing', 'worker', 'route']) {
    const directory = await build(variant), output = path.join(base, variant + '.tar.gz');
    if (variant === 'corrupt') await fs.writeFile(path.join(directory, 'index.html'), 'wrong release');
    if (variant === 'missing') await fs.rm(path.join(directory, 'index.html'));
    if (variant === 'worker') await fs.appendFile(path.join(directory, 'service-worker.js'), '// wrong worker');
    if (variant === 'route') await writeOfflineManifest(directory, { '/': '/index.html' }, ['/index.html']);
    await assert.rejects(packageWeb({ directory, output }));
    await assert.rejects(fs.stat(output), { code: 'ENOENT' });
  }
});

test('unsafe resource paths and symlink files/parents are rejected', async t => {
  const { base, build } = await fixture(t);
  for (const variant of ['path', 'file', 'parent', 'root']) {
    let directory = await build(variant), output = path.join(base, variant + '.tar.gz');
    if (variant === 'path') {
      const manifest = JSON.parse(await fs.readFile(path.join(directory, 'offline-manifest.json')));
      manifest.resources[0].url = '/../outside';
      await fs.writeFile(path.join(directory, 'offline-manifest.json'), JSON.stringify(manifest));
    } else if (variant === 'file') {
      await fs.rename(path.join(directory, 'index.html'), path.join(base, 'outside'));
      await fs.symlink(path.join(base, 'outside'), path.join(directory, 'index.html'));
    } else if (variant === 'parent') {
      await fs.rename(path.join(directory, 'assets'), path.join(base, 'outside-assets'));
      await fs.symlink(path.join(base, 'outside-assets'), path.join(directory, 'assets'));
    } else {
      await fs.symlink(directory, path.join(base, 'linked')); directory = path.join(base, 'linked');
    }
    await assert.rejects(packageWeb({ directory, output }));
    await assert.rejects(fs.stat(output), { code: 'ENOENT' });
  }
});

test('packaging preserves existing output and CLI failure never claims success', async t => {
  const { build, output } = await fixture(t), directory = await build('current');
  await fs.writeFile(output, 'user file');
  await assert.rejects(packageWeb({ directory, output }), { code: 'EEXIST' });
  assert.equal(await fs.readFile(output, 'utf8'), 'user file');
  const failed = spawnSync(process.execPath, ['scripts/package-web.cjs', directory, output], { encoding: 'utf8' });
  assert.equal(failed.status, 1); assert.equal(failed.stdout, ''); assert.match(failed.stderr, /EEXIST/);
  await assert.rejects(packageWeb({ directory, output: path.join(directory, 'inside.tar.gz') }), /outside/);
});
