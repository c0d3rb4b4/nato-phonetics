// Follow the actual failed Firefox process profile after the harness has closed Caddy.
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { firefox } = require('playwright');

async function main() {
  const [input, output] = process.argv.slice(2);
  const failed = JSON.parse(await fs.readFile(input, 'utf8'));
  assert.equal(failed.engine, 'firefox');
  assert.equal(failed.transitionMode, 'process');
  assert.equal(failed.failure.state.controlled, false);
  const { url } = failed.failure.state;
  assert.equal(new URL(url).hostname, '127.0.0.1');
  await assert.rejects(fetch(url), /fetch failed/);
  const out = path.resolve(output);
  await fs.mkdir(out, { recursive: true });
  const profile = path.join(out, 'browser-profile');
  await fs.cp(path.join(failed.runtimeDirectory, 'browser-profile'), profile, {
    recursive: true, errorOnExist: true, force: false,
    filter: file => !['lock', '.parentlock'].includes(path.basename(file)),
  });
  const context = await firefox.launchPersistentContext(profile, { viewport: { width: 320, height: 568 }, colorScheme: 'dark' });
  const report = { url, candidate: failed.candidate, originUnreachable: true, browser: context.browser().version() };
  try {
    await context.setOffline(true);
    const page = await context.newPage();
    report.responseStatus = (await page.goto(url))?.status();
    await page.getByTestId('progress-summary').waitFor();
    const actual = await page.evaluate(async () => ({
      controlled: !!navigator.serviceWorker.controller,
      controllerIsActive: navigator.serviceWorker.controller === (await navigator.serviceWorker.getRegistration())?.active,
      stored: JSON.parse(localStorage.getItem('nato.progress.v1')),
      shellCaches: (await caches.keys()).filter(name => name.startsWith('nato-shell-v1-')),
      htmlSha256: Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', await (await fetch('/index.html')).arrayBuffer())),
        byte => byte.toString(16).padStart(2, '0')).join(''),
    }));
    report.observed = actual;
    assert.equal(report.responseStatus, 200);
    assert.equal(actual.controllerIsActive && actual.controlled, true);
    const expected = failed.reopenObservations.at(-1);
    assert.equal(actual.htmlSha256, expected.expectedHtmlSha256);
    assert.deepEqual(actual.shellCaches, ['nato-shell-v1-' + expected.build]);
    assert.equal(Object.values(actual.stored.symbols).reduce((sum, row) => sum + row.attempts, 0), failed.failure.progress.data.total);
    await page.screenshot({ path: path.join(out, 'offline-saved-progress.png') });
  } catch (error) { report.failure = error.message; throw error; }
  finally {
    await fs.writeFile(path.join(out, 'report.json'), JSON.stringify(report, null, 2) + '\n');
    await context.close();
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
