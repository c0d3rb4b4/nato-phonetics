// Explicit installation experiment in a fresh temporary Chromium user profile.
const { chromium } = require('playwright');
const { startServer } = require('../../../scripts/serve-web.cjs');

async function main() {
  const server = startServer(process.argv[2], 0);
  await new Promise(resolve => server.once('listening', resolve));
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXECUTABLE,
    ignoreDefaultArgs: ['--disable-component-update'] });
  try {
    const page = await browser.newPage();
    await page.goto('http://127.0.0.1:' + server.address().port + '/letter-quiz');
    await page.evaluate(() => {
      const button = document.createElement('button');
      button.textContent = 'Install en-US test model';
      document.body.prepend(button);
      button.style.cssText = 'position:fixed;top:0;z-index:99999';
      button.onclick = async () => {
        const api = window.SpeechRecognition || window.webkitSpeechRecognition;
        const options = { langs: ['en-US'], processLocally: true };
        const result = window.modelCheck = { userActivation: navigator.userActivation.isActive };
        try {
          result.install = await api.install(options);
        } catch (e) { result.error = e.name; }
        result.after = await api.available(options);
      };
    });
    await page.getByRole('button', { name: 'Install en-US test model' }).click();
    await page.waitForFunction(() => !!window.modelCheck?.after, { }, { timeout: 45000 })
      .catch(() => {});
    console.log(JSON.stringify({ browser: browser.version(), ...await page.evaluate(() => window.modelCheck) }));
  } finally { await browser.close(); server.close(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
