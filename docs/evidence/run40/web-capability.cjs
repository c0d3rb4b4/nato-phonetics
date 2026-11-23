const { chromium } = require('playwright');
const { startServer } = require('../../../scripts/serve-web.cjs');

async function main() {
  const server = startServer(process.argv[2], 0);
  await new Promise(resolve => server.once('listening', resolve));
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXECUTABLE });
  try {
    const page = await browser.newPage();
    await page.goto('http://127.0.0.1:' + server.address().port + '/letter-quiz');
    const result = await page.evaluate(async () => {
      const api = window.SpeechRecognition || window.webkitSpeechRecognition;
      const report = { secure: isSecureContext, constructorPresent: !!api,
        localFlag: !!api && 'processLocally' in new api(), check: typeof api?.available,
        install: typeof api?.install };
      if (report.localFlag && report.check === 'function') {
        report.enUS = await api.available({ langs: ['en-US'], processLocally: true });
      }
      return report;
    });
    console.log(JSON.stringify({ browser: browser.version(), ...result }));
  } finally { await browser.close(); server.close(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
