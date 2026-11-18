import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import test from 'node:test';
import { transformSync } from 'esbuild';

function load(platform, globals) {
  const { code } = transformSync(readFileSync(new URL(`../src/lib/conversionExport${platform}.js`, import.meta.url), 'utf8'), { format: 'cjs' });
  const module = { exports: {} };
  runInNewContext(code, { module, Error, ...globals });
  return module.exports;
}
test('native copy/share send exact plain text and preserve cancellation and errors', async () => {
  const calls = [];
  let action = 'shared';
  const adapter = load('', { require: () => ({
    Clipboard: { setString(text) { calls.push(text); } },
    Share: { dismissedAction: 'dismissed', async share(content) { calls.push(content.message); return { action }; } },
  }) });
  await adapter.copyConversion('Alfa / Bravo');
  assert.equal(await adapter.shareConversion('Alfa / Bravo'), 'opened');
  action = 'dismissed';
  assert.equal(await adapter.shareConversion('Alfa / Bravo'), 'cancelled');
  assert.deepEqual(calls, Array(3).fill('Alfa / Bravo'));
  const failed = load('', { require: () => { throw new Error('Unavailable'); } });
  await assert.rejects(failed.copyConversion('a'), /Unavailable/);
  await assert.rejects(failed.shareConversion('a'), /Unavailable/);
});
test('browser exports handle unavailable, denied, cancelled and successful capabilities', async () => {
  const nav = {};
  const adapter = load('.web', { navigator: nav });
  await assert.rejects(adapter.copyConversion('Alfa'), /unavailable/);
  assert.equal(await adapter.shareConversion('Alfa'), 'unavailable');
  const writes = [];
  nav.clipboard = { writeText: async text => writes.push(text) };
  await adapter.copyConversion('Alfa');
  nav.share = async content => { assert.equal(content.text, 'Alfa'); };
  assert.equal(await adapter.shareConversion('Alfa'), 'opened');
  nav.share = async () => { throw Object.assign(new Error('Cancelled'), { name: 'AbortError' }); };
  assert.equal(await adapter.shareConversion('Alfa'), 'cancelled');
  nav.share = async () => { throw new Error('Denied'); };
  await assert.rejects(adapter.shareConversion('Alfa'), /Denied/);
  assert.deepEqual(writes, ['Alfa'], 'No implicit clipboard write on share failure/cancel');
});
