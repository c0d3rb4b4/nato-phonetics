// Replay the first offline navigation on a copy of the closed Firefox profile.
const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const fs = require('node:fs/promises');
const path = require('node:path');
const { firefox } = require('playwright');

async function main() {
  const [onlineDirectory, output] = process.argv.slice(2);
  const online = JSON.parse(await fs.readFile(path.join(onlineDirectory, 'report.json')));
  const checkpoint = online.reopenObservations[0];
  const url = new URL(online.failure.state.url);
  assert.equal(url.hostname, '127.0.0.1');
  assert.equal(url.pathname, checkpoint.route);
  assert.equal(online.failure.state.controlled, false);
  await assert.rejects(fetch(url), /fetch failed/);
  await fs.mkdir(output, { recursive: true });
  const profile = path.join(output, 'browser-profile');
  await fs.cp(path.join(onlineDirectory, 'pre-reopen-profile'), profile, {
    recursive: true, errorOnExist: true, force: false,
    filter: file => !['lock', '.parentlock'].includes(path.basename(file)),
  });
  const context = await firefox.launchPersistentContext(profile, {
    viewport: { width: 320, height: 568 }, colorScheme: 'dark',
    env: { ...process.env, MOZ_LOG: 'timestamp,nsHttp:5,WorkerTelemetry:5', MOZ_LOG_FILE: path.join(output, 'gecko.log') },
  });
  const report = { url: url.href, candidate: online.candidate, browser: context.browser().version(),
    originUnreachable: true, expectedShell: checkpoint.build,
    expectedSavedCount: online.firstAnswer.data.total, viewport: { width: 320, height: 568 } };
  try {
    await context.setOffline(true);
    const page = await context.newPage();
    page.setDefaultTimeout(5000);
    try {
      const response = await page.goto(url.href);
      report.navigation = { status: response.status(), bodySha256: createHash('sha256').update(await response.body()).digest('hex') };
      await page.getByTestId('progress-summary').waitFor();
      report.observed = await page.evaluate(async () => ({
        controllerIsActive: !!navigator.serviceWorker.controller && navigator.serviceWorker.controller === (await navigator.serviceWorker.getRegistration())?.active,
        caches: (await caches.keys()).filter(key => key.startsWith('nato-shell-v1-')),
        savedCount: Object.values(JSON.parse(localStorage.getItem('nato.progress.v1')).symbols).reduce((total, row) => total + row.attempts, 0),
      }));
      assert.equal(report.navigation.status, 200);
      assert.equal(report.observed.controllerIsActive, true);
      assert.equal(report.observed.savedCount, report.expectedSavedCount);
      assert.deepEqual(report.observed.caches, ['nato-shell-v1-' + checkpoint.build]);
    } catch (error) {
      report.failure = error.message;
      process.exitCode = 1;
    }
    report.visibleText = await page.locator('body').innerText().catch(() => null);
    await page.screenshot({ path: path.join(output, 'first-offline.png') });
  } finally {
    await context.close();
    await fs.writeFile(path.join(output, 'report.json'), JSON.stringify(report, null, 2) + '\n');
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });