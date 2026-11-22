// Inject only the unavailable-voice branch in the Run 38 replay.
const { chromium } = require('playwright');
const launch = chromium.launch.bind(chromium);
chromium.launch = async (...args) => {
  const browser = await launch(...args);
  const create = browser.newContext.bind(browser);
  browser.newContext = async (...options) => {
    const context = await create(...options);
    await context.addInitScript(() => {
      Object.defineProperty(window, 'SpeechSynthesisUtterance', { value: class {} });
      Object.defineProperty(window, 'speechSynthesis', { value: {
        getVoices: () => [], addEventListener() {}, removeEventListener() {}, cancel() {},
        speak(utterance) { queueMicrotask(() => utterance.onerror?.({ error: 'voice-unavailable' })); },
      } });
    });
    return context;
  };
  return browser;
};
require('../../../scripts/verify-progress-recovery-browser.cjs');
