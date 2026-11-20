// Capture only an already built and installed native simulator application.
// DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer node ... <udid> <app>
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');
const device = process.argv[2];
const app = process.argv[3];
const output = path.join(__dirname, 'screenshots/ios');
const wait = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));
const simctl = (...args) => execFileSync('xcrun', ['simctl', ...args], { encoding: 'utf8', env: process.env });
const hash = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');

async function main() {
  if (!device || !app || !fs.existsSync(path.join(app, 'NATOPhonetics'))) throw new Error('Supply simulator UDID and verified Release .app path');
  const installed = simctl('get_app_container', device, 'com.natophonetics.app', 'app').trim();
  if (!installed) throw new Error('Native app is not installed');
  const previousAppearance = simctl('ui', device, 'appearance').trim();
  const states = [
    { file: 'home-light.png', route: '', theme: 'light', state: 'Home with native status area/insets' },
    { file: 'home-dark.png', route: '', theme: 'dark', state: 'Home following live dark system appearance' },
    { file: 'alphabet-light.png', route: 'alphabet', theme: 'light', state: 'Native alphabet reference; scrollable list' },
    { file: 'converter-light.png', route: 'converter', theme: 'light', state: 'Native converter empty state' },
    { file: 'quiz-light.png', route: 'letter-quiz', theme: 'light', state: 'Native unanswered quiz with four choices' },
    { file: 'settings-dark.png', route: 'settings', theme: 'dark', state: 'Native System appearance/voice/reset settings' },
    { file: 'voice-dark.png', route: 'voice-select', theme: 'dark', state: 'Actual installed iOS speech voice enumeration' },
    { file: 'audio-help-light.png', route: 'audio-help', theme: 'light', state: 'Native audio help and provider text' },
    { file: 'menu-cold-light.png', route: 'menu', theme: 'light', state: 'Cold native Menu deep link, Home and Back to App controls visible', cold: true },
  ];
  fs.mkdirSync(output, { recursive: true });
  const captures = [];
  try {
    for (const state of states) {
      simctl('ui', device, 'appearance', state.theme);
      if (state.cold) simctl('terminate', device, 'com.natophonetics.app');
      const url = `natophonetics://${state.route}`;
      simctl('openurl', device, url);
      await wait(state.route === 'voice-select' ? 5000 : 2500);
      const file = path.join(output, state.file);
      simctl('io', device, 'screenshot', file);
      const dimensions = execFileSync('sips', ['-g', 'pixelWidth', '-g', 'pixelHeight', file], { encoding: 'utf8' });
      captures.push({ ...state, url, bytes: fs.statSync(file).size, sha256: hash(file), dimensions });
      console.log(`CAPTURE ${state.file}: ${state.theme}, ${url}`);
    }
    const inventory = JSON.parse(simctl('list', 'devices', '--json'));
    const runtime = Object.entries(inventory.devices).find(([, devices]) => devices.some(entry => entry.udid === device));
    const metadata = { date: '2026-11-16', capturedAt: new Date().toISOString(), platform: 'ios',
      device: runtime?.[1].find(entry => entry.udid === device), runtime: runtime?.[0], app, installed,
      executableSha256: hash(path.join(app, 'NATOPhonetics')),
      bundleSha256: hash(path.join(app, 'main.jsbundle')), captures };
    fs.writeFileSync(path.join(output, 'metadata.json'), JSON.stringify(metadata, null, 2) + '\n');
  } finally {
    if (['light', 'dark'].includes(previousAppearance)) simctl('ui', device, 'appearance', previousAppearance);
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
