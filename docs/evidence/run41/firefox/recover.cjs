// Recover the failed first-offline profile over the original loopback origin.
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { spawn } = require('node:child_process');
const { once } = require('node:events');
const { firefox } = require('playwright');

async function main() {
  const [onlineDirectory, failedOfflineDirectory, out] = process.argv.slice(2);
  const baseline = JSON.parse(await fs.readFile(path.join(onlineDirectory, 'report.json')));
  const offline = JSON.parse(await fs.readFile(path.join(failedOfflineDirectory, 'report.json')));
  assert.match(offline.failure, /NS_ERROR_OFFLINE/);
  const { origin, hostname } = new URL(offline.url);
  assert.equal(hostname, '127.0.0.1');
  await assert.rejects(fetch(origin), /fetch failed/);
  await fs.mkdir(out, { recursive: true });
  const profile = path.join(out, 'browser-profile');
  await fs.cp(path.join(failedOfflineDirectory, 'browser-profile'), profile, {
    recursive: true, errorOnExist: true, force: false,
    filter: file => !['lock', '.parentlock'].includes(path.basename(file)),
  });
  const host = spawn(process.env.CADDY_EXECUTABLE, ['run', '--config', path.join(baseline.runtimeDirectory, 'a/Caddyfile'), '--adapter', 'caddyfile'], {
    env: { ...process.env, NATO_SITE_ADDRESS: origin, NATO_WEB_ROOT: path.join(baseline.runtimeDirectory, 'b/public'),
      XDG_CONFIG_HOME: path.join(out, 'config'), XDG_DATA_HOME: path.join(out, 'data') }, stdio: 'inherit',
  });
  const options = { viewport: { width: 320, height: 568 }, colorScheme: 'dark' };
  const report = { ...offline.candidate, origin, browser: baseline.browser, expectedShell: offline.expectedShell, steps: [] };
  let context;
  async function stopHost() {
    if (host.exitCode !== null || host.signalCode !== null) return;
    const stopped = once(host, 'exit');
    host.kill('SIGTERM');
    await stopped;
  }
  try {
    for (let check = 0; ; check++) {
      try { if ((await fetch(origin)).ok) break; } catch { /* Caddy is starting */ }
      assert.ok(check < 50, 'Caddy must reopen the same origin');
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    context = await firefox.launchPersistentContext(profile, options);
    const page = await context.newPage();
    await page.goto(origin + '/menu');
    await page.getByTestId('web-offline-status').filter({ hasText: 'Offline copy ready' }).waitFor({ timeout: 20000 });
    async function read(target) {
      return target.evaluate(async () => {
        const reg = await navigator.serviceWorker.getRegistration();
        return {
          controlled: !!navigator.serviceWorker.controller && navigator.serviceWorker.controller === reg?.active,
          active: reg?.active?.state, waiting: reg?.waiting?.state,
          shellCaches: (await caches.keys()).filter(key => key.startsWith('nato-shell-v1-')),
          total: Object.values(JSON.parse(localStorage.getItem('nato.progress.v1')).symbols).reduce((n, row) => n + row.attempts, 0),
        };
      });
    }
    report.steps.push({ event: 'reconnect to Menu and wait for ready', ...await read(page) });
    await page.close();
    const reopened = await context.newPage();
    const response = await reopened.goto(offline.url);
    assert.equal(response.status(), 200);
    await reopened.getByTestId('progress-summary').waitFor();
    const connected = await read(reopened);
    report.steps.push({ event: 'reopen saved progress online', ...connected });
    assert.equal(connected.controlled, true);
    assert.equal(connected.total, 1);
    assert.deepEqual(connected.shellCaches, ['nato-shell-v1-' + offline.expectedShell]);
    await context.close();
    context = undefined;
    await stopHost();
    await assert.rejects(fetch(origin), /fetch failed/);
    context = await firefox.launchPersistentContext(profile, options);
    await context.setOffline(true);
    const last = await context.newPage();
    const offlineResponse = await last.goto(offline.url);
    assert.equal(offlineResponse.status(), 200);
    await last.getByTestId('progress-summary').waitFor();
    const recovered = await read(last);
    report.steps.push({ event: 'first launch after verified online recovery with origin stopped', ...recovered, status: offlineResponse.status() });
    assert.equal(recovered.controlled, true);
    assert.equal(recovered.total, 1);
    assert.deepEqual(recovered.shellCaches, ['nato-shell-v1-' + offline.expectedShell]);
    await last.screenshot({ path: path.join(out, 'offline-recovered.png') });
  } catch (error) { report.failure = error.stack; process.exitCode = 1; }
  finally {
    await context?.close();
    await stopHost();
    await fs.writeFile(path.join(out, 'report.json'), JSON.stringify(report, null, 2) + '\n');
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });