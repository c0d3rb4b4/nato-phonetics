// Replay the hosted no-voice failure without changing the maintained runner's
// real-provider default. Use the same production app and real pointer actions.
const { chromium } = require('playwright');
const launch = chromium.launchPersistentContext.bind(chromium);

chromium.launchPersistentContext = async (...args) => {
  const context = await launch(...args);
  await context.addInitScript(() => {
    Object.defineProperty(window, 'SpeechSynthesisUtterance', { value: class {} });
    Object.defineProperty(window, 'speechSynthesis', { value: {
      getVoices: () => [],
      addEventListener() {},
      removeEventListener() {},
      cancel() {},
      speak(utterance) { queueMicrotask(() => utterance.onerror?.({ error: 'voice-unavailable' })); },
    } });
  });
  return context;
};

require('../../../../scripts/verify-browser-support.cjs');
