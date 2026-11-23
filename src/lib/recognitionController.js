import { MAX_RECALL_ANSWER_LENGTH } from './quizSession.js';

/** @typedef {'idle'|'preparing'|'permission'|'starting'|'recording'|'processing'} CaptureState */
/** @typedef {{state: CaptureState, message: string}} CaptureStatus */
/** @typedef {{available: () => Promise<boolean>, hasPermission: () => Promise<boolean>,
 * requestPermission: () => Promise<string>, silencePlayback: () => Promise<void>,
 * start: (id: string) => Promise<string>, stop: (id: string) => void, cancel: (id: string) => void}} Provider */
const errors = {
  permission: 'Microphone access is off. Enable it in app settings or type your answer.',
  unavailable: 'On-device speech recognition is unavailable. Type your answer instead.',
  language: 'The device needs a US English speech model. Type your answer or install the model in device settings.',
  silence: 'No code word was recognized. Try recording again or type your answer.',
  timeout: 'Recording timed out. Try again or type your answer.',
  busy: 'The microphone is busy. Try again or type your answer.',
  audio: 'Recording failed. Check the microphone, try again or type your answer.',
  interrupted: 'Recording ended. Start again or type your answer.',
};
let sequence = 0;

/** @param {Provider} provider @param {(status: CaptureStatus) => void} publish
 * @param {number} [timeoutMs] */
export function createRecognitionController(provider, publish, timeoutMs = 20000) {
  let id = '';
  /** @type {CaptureState} */
  let state = 'idle';
  /** @type {ReturnType<typeof setTimeout> | undefined} */
  let timer;
  /** @param {CaptureState} next @param {string} message */
  function update(next, message) { state = next; publish({ state, message }); }
  function reset() { clearTimeout(timer); id = ''; }
  function cancel(message = '') {
    const old = id;
    reset();
    if (old) provider.cancel(old);
    update('idle', message);
  }
  return {
    cancel,
    background() {
      // A permission dialog may pause the Activity. Its result never starts capture.
      if (id && state !== 'permission') cancel(errors.interrupted);
    },
    /** @param {string} owner @param {string} event */
    event(owner, event) {
      if (!id || owner !== id) return;
      if (event === 'recording' && state === 'starting') update('recording', 'Recording. Say one code word.');
      if (event === 'processing') update('processing', 'Recording stopped. Waiting for the code word…');
    },
    stop() {
      if (!id || state === 'processing') return;
      if (state !== 'recording') { cancel(); return; }
      update('processing', 'Recording stopped. Waiting for the code word…');
      provider.stop(id);
    },
    /** @param {(value: string) => void} accept */
    async start(accept) {
      if (id) return;
      const owner = id = String(++sequence);
      timer = setTimeout(() => cancel(errors.timeout), timeoutMs);
      update('preparing', 'Checking on-device speech…');
      let message = '';
      try {
        if (!await provider.available()) throw { code: 'unavailable' };
        if (id !== owner) return;
        const granted = await provider.hasPermission();
        if (id !== owner) return;
        if (!granted) {
          update('permission', 'Allow microphone access to enable recording.');
          const permission = await provider.requestPermission();
          if (permission === 'granted') message = 'Microphone enabled. Tap Start recording when ready.';
          else if (permission === 'denied') message = 'Microphone access is off. Try Start recording again or type your answer.';
          else message = errors.permission;
          return;
        }
        await provider.silencePlayback();
        if (id !== owner) return;
        update('starting', 'Starting microphone…');
        const answer = await provider.start(owner);
        if (id !== owner) return;
        if (!answer?.trim()) throw { code: 'silence' };
        if (answer.length > MAX_RECALL_ANSWER_LENGTH) { message = 'Say one code word, or type your answer.'; return; }
        accept(answer);
        message = 'Review the code word, then check your answer.';
      } catch (error) {
        const code = /** @type {{code?: keyof typeof errors}} */ (error)?.code;
        message = code && Object.hasOwn(errors, code) ? errors[code] : errors.audio;
      } finally {
        if (id === owner) { reset(); update('idle', message); }
      }
    },
  };
}
