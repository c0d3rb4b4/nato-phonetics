// Focused real-browser replay: Retry while a previous status reply is outstanding.
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const http = require('node:http');
const path = require('node:path');
const { webkit } = require('playwright');
const { staticHandler } = require('../../../scripts/serve-web.cjs');
const { writeOfflineManifest } = require('../../../scripts/offline-manifest.cjs');

async function main() {
  const build = path.resolve(process.argv[2]);
  const out = path.resolve(process.argv[3]);
  await fs.mkdir(out, { recursive: true });
  const next = await fs.mkdtemp(path.join(out, 'fixture-'));
  await fs.cp(build, next, { recursive: true });
  const manifest = JSON.parse(await fs.readFile(path.join(build, 'offline-manifest.json')));
  await fs.appendFile(path.join(next, 'index.html'), '\n<!-- forward test release -->');
  const forward = await writeOfflineManifest(next, manifest.routes, manifest.resources.map(row => row.url));
  let active = staticHandler(build);
  let broken = false;
  const server = http.createServer((req, res) => {
    if (broken && req.url === '/favicon.png') {
      res.writeHead(503);
      res.end();
    } else active(req, res);
  });
  const report = { shell: manifest.buildId, fixture: forward.buildId, engine: 'webkit',
    platform: process.platform, viewport: { width: 320, height: 568 }, theme: 'light' };
  let browser;
  try {
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const url = 'http://127.0.0.1:' + server.address().port + '/menu';
    browser = await webkit.launch();
    report.browser = browser.version();
    const ctx = await browser.newContext({ viewport: report.viewport, colorScheme: report.theme });
    const menu = await ctx.newPage();
    await menu.goto(url);
    const status = menu.getByTestId('web-offline-status');
    await status.filter({ hasText: 'Offline copy ready' }).waitFor();
    const checker = await ctx.newPage();
    await checker.goto(url);
    await checker.getByTestId('web-offline-status').filter({ hasText: 'Offline copy ready' }).waitFor();
    // Forward a genuine worker response to the original port only on release.
    await menu.evaluate(() => {
      const post = ServiceWorker.prototype.postMessage;
      ServiceWorker.prototype.postMessage = function(message, ports) {
        if (message?.type !== 'SHELL_STATUS' || !message.repair) return post.call(this, message, ports);
        ServiceWorker.prototype.postMessage = post;
        const relay = new MessageChannel();
        relay.port1.onmessage = ({ data }) => {
          window.heldReady = data.ready;
          window.releaseReady = () => {
            ports[0].postMessage(data);
            ports[0].close();
            relay.port1.close();
          };
        };
        return post.call(this, message, [relay.port2]);
      };
    });
    await menu.getByRole('button', { name: 'Check for web update' }).click();
    await menu.waitForFunction(() => window.heldReady === true);
    active = staticHandler(next);
    broken = true;
    await checker.getByRole('button', { name: 'Check for web update' }).click();
    await status.filter({ hasText: 'could not finish' }).waitFor();
    report.failedStatus = await status.innerText();
    const retry = menu.getByRole('button', { name: 'Retry offline setup' });
    await retry.scrollIntoViewIfNeeded();
    await menu.screenshot({ path: path.join(out, 'retry-before-reply.png') });
    await menu.evaluate(() => {
      const update = ServiceWorkerRegistration.prototype.update;
      window.retryUpdates = 0;
      ServiceWorkerRegistration.prototype.update = function() {
        ++window.retryUpdates;
        return update.call(this);
      };
    });
    broken = false;
    await retry.click();
    report.retryUpdateCalls = await menu.evaluate(() => window.retryUpdates);
    assert.equal(report.retryUpdateCalls, 1, 'The explicit Retry must reach the registration');
    // Still inside the old query's 10 s timeout. A button that ignored the
    // click cannot install this forward worker.
    await status.filter({ hasText: 'Update ready.' }).waitFor({ timeout: 5000 });
    assert.equal(await menu.evaluate(async () => !!(await navigator.serviceWorker.getRegistration()).waiting), true);
    await menu.bringToFront();
    await menu.evaluate(async () => {
      window.releaseReady();
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    });
    await menu.getByRole('button', { name: 'Check for web update' }).scrollIntoViewIfNeeded();
    await menu.screenshot({ path: path.join(out, 'waiting-after-reply.png') });
    report.finalStatus = await status.innerText();
    assert.match(report.finalStatus, /Update ready/);
  } catch (error) {
    report.failure = error.message;
    throw error;
  } finally {
    await fs.writeFile(path.join(out, 'report.json'), JSON.stringify(report, null, 2) + '\n');
    await browser?.close();
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
