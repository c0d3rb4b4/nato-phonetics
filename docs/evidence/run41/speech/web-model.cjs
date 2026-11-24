const fs = require('node:fs/promises');
const path = require('node:path');
const { chromium } = require('playwright');
const { startServer } = require('../../../../scripts/serve-web.cjs');

async function main() {
  const [webRoot, output] = process.argv.slice(2);
  const profile = await fs.mkdtemp(path.join(output, 'model-profile-'));
  const server = startServer(webRoot, 0);
  await new Promise(resolve => server.once('listening', resolve));
  let context;
  try {
    context = await chromium.launchPersistentContext(profile, {
      executablePath: process.env.BROWSER_EXECUTABLE,
      ignoreDefaultArgs: ['--disable-component-update', '--disable-background-networking'],
      args: ['--component-updater=fast-update'],
    });
    const page = await context.newPage();
    await page.goto('http://127.0.0.1:' + server.address().port + '/letter-quiz');
    const before = await page.evaluate(async () => {
      const api = window.SpeechRecognition || window.webkitSpeechRecognition;
      const options = { langs: ['en-US'], processLocally: true };
      const initial = await api.available(options);
      const button = document.createElement('button');
      button.textContent = 'Install local test pack';
      button.style.cssText = 'position:fixed;inset:0 auto auto 0;z-index:99999';
      button.onclick = async () => {
        window.packResult = { activated: navigator.userActivation.isActive };
        try { window.packResult.installed = await api.install(options); }
        catch (error) { window.packResult.error = error.name; }
      };
      document.body.prepend(button);
      return initial;
    });
    if (before === 'downloadable') await page.getByRole('button', { name: 'Install local test pack' }).click();
    const componentsPage = await context.newPage();
    await componentsPage.goto('chrome://components');
    const samples = [];
    for (let step = 0; step < 7; step++) {
      if (step) await new Promise(resolve => setTimeout(resolve, 10000));
      const model = await page.evaluate(async () => {
        const api = window.SpeechRecognition || window.webkitSpeechRecognition;
        return {
          state: await api.available({ langs: ['en-US'], processLocally: true }),
          ...window.packResult,
        };
      });
      await componentsPage.reload();
      const components = (await componentsPage.locator('body').innerText())
        .split(/(?=\n[^\n]+\s-\sVersion:)/).filter(row => /SODA|speech recognition/i.test(row));
      samples.push({ elapsedSeconds: step * 10, ...model, components });
      if (model.state === 'available' || model.installed === false || model.error) break;
    }
    const result = { browser: context.browser().version(), node: process.version, before, samples };
    await fs.writeFile(path.join(output, 'web-model.json'), JSON.stringify(result, null, 2) + '\n');
    console.log(JSON.stringify(result));
  } finally {
    if (context) await context.close();
    server.close();
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
