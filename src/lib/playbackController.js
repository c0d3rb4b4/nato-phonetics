import { withTimeout } from './audioVoices.js';

/** @typedef {import('../types').SpeechResult} SpeechResult */
/** @typedef {{ voice?: string, language?: string, warning?: string }} PreparedVoice */
/** @typedef {{ voice?: string, language?: string, rate: number, onDone: () => void, onStopped: () => void, onError: (error: unknown) => void }} UtteranceOptions */
/** @typedef {{ speak: (text: string, options: UtteranceOptions) => void | Promise<void>, stop: () => void | Promise<void> }} SpeechAdapter */
/** @typedef {{ owner: string, resolve: (result: SpeechResult) => void, cancelWait: Set<() => void>, settled: boolean }} PlaybackRun */

/** @type {import('../types').PlaybackSnapshot} */
export const INITIAL_PLAYBACK_SNAPSHOT = Object.freeze({
  owner: null, status: 'idle', tokenIndex: -1, tokenCount: 0, result: null, warning: null,
});

/** One global owner. Each new play replaces all pending words and pauses.
 * @param {SpeechAdapter} adapter
 * @param {(options: import('../types').PlaybackOptions) => Promise<PreparedVoice>} prepare
 * @param {{utteranceTimeoutMs?: number, stopTimeoutMs?: number, preparationTimeoutMs?: number}} config
 */
export function createPlaybackController(adapter, prepare = async () => ({}), config = {}) {
  let snapshot = INITIAL_PLAYBACK_SNAPSHOT;
  /** @type {PlaybackRun | null} */
  let active = null;
  /** @type {Set<() => void>} */
  const listeners = new Set();
  let providerStops = Promise.resolve();
  let speechMayBePlaying = false;

  /** @param {Partial<import('../types').PlaybackSnapshot>} patch */
  function publish(patch) {
    snapshot = Object.freeze({ ...snapshot, ...patch });
    for (const listener of listeners) listener();
  }
  /** @param {PlaybackRun} run @param {SpeechResult} result */
  function settle(run, result) {
    if (run.settled) return;
    run.settled = true;
    for (const cancel of [...run.cancelWait]) cancel();
    if (active === run) {
      active = null;
      publish({ status: 'idle', result });
    }
    run.resolve(result);
  }
  function stopProvider() {
    // Serialize native async stop calls: a late stop must not cancel a new word.
    // A timeout does not release this queue: a later native completion could
    // otherwise stop new audio. Retries remain bounded until it actually settles.
    providerStops = providerStops.catch(() => {}).then(async () => {
      await adapter.stop();
      speechMayBePlaying = false;
    });
    const stopBarrier = withTimeout(
      providerStops, config.stopTimeoutMs ?? 2500,
      'Audio could not be stopped. Try again or restart the app.',
    );
    // stop() is safe to call without awaiting; play() still observes failures.
    void stopBarrier.catch(() => {});
    return stopBarrier;
  }
  /** @param {PlaybackRun} run @param {number} milliseconds */
  function pause(run, milliseconds) {
    return new Promise(resolve => {
      const complete = () => { clearTimeout(timer); run.cancelWait.delete(complete); resolve(undefined); };
      const timer = setTimeout(complete, milliseconds);
      run.cancelWait.add(complete);
    });
  }
  /** @template T @param {PlaybackRun} run @param {Promise<T>} promise @returns {Promise<T | null>} */
  function cancellable(run, promise) {
    return new Promise((resolve, reject) => {
      const cancel = () => { run.cancelWait.delete(cancel); resolve(null); };
      run.cancelWait.add(cancel);
      promise.then(value => { run.cancelWait.delete(cancel); resolve(value); }, error => {
        run.cancelWait.delete(cancel); reject(error);
      });
    });
  }
  /** @param {PlaybackRun} run @param {string} text @param {PreparedVoice} prepared @param {number} rate */
  function utter(run, text, prepared, rate) {
    /** @type {Promise<SpeechResult>} */
    const result = new Promise(resolve => {
      let finished = false;
      /** @param {SpeechResult} outcome */
      const finish = (outcome) => {
        if (finished) return;
        finished = true;
        clearTimeout(timer);
        run.cancelWait.delete(cancel);
        resolve(outcome);
      };
      const cancel = () => finish({ status: 'cancelled' });
      const timer = setTimeout(() => finish({
        status: 'failed', error: new Error('No speech completion was received. Check volume and your speech provider, then retry.'),
      }), config.utteranceTimeoutMs ?? Math.min(60000, Math.max(15000, text.length * 250 / rate)));
      run.cancelWait.add(cancel);
      try {
        speechMayBePlaying = true;
        const pending = adapter.speak(text, {
          voice: prepared.voice, language: prepared.language ?? 'en-GB', rate,
          onDone: () => {
            if (!finished) speechMayBePlaying = false;
            finish({ status: 'completed' });
          },
          onStopped: cancel,
          onError: () => finish({ status: 'failed', error: new Error('Speech could not be played. Try System Default or another voice in Settings.') }),
        });
        if (pending) void pending.catch(() => finish({ status: 'failed', error: new Error('Speech provider could not start playback.') }));
      } catch {
        finish({ status: 'failed', error: new Error('Speech provider is unavailable. Try another voice or check device speech settings.') });
      }
    });
    return result;
  }
  /** @param {PlaybackRun} run @param {import('../types').SpeechToken[]} tokens @param {import('../types').PlaybackOptions} options @param {Promise<void>} stopped */
  async function execute(run, tokens, options, stopped) {
    try {
      await cancellable(run, stopped);
      if (run.settled) return;
      let prepared;
      try {
        prepared = await cancellable(run, withTimeout(prepare(options), config.preparationTimeoutMs ?? 8000, 'Audio preparation timed out.'));
      } catch {
        prepared = { language: 'en-GB', warning: 'Voice settings could not be prepared. Using System Default.' };
      }
      if (run.settled || !prepared) return;
      publish({ warning: prepared.warning ?? null });
      const rate = Number.isFinite(options.rate) ? Math.max(0.5, Math.min(1.5, options.rate ?? 1)) : 1;
      for (let index = 0; index < tokens.length; index += 1) {
        if (run.settled) return;
        const token = tokens[index];
        publish({ status: 'playing', tokenIndex: index });
        const outcome = await utter(run, token.text, prepared, rate);
        if (run.settled) return;
        if (outcome.status !== 'completed') {
          settle(run, outcome);
          void stopProvider();
          return;
        }
        const milliseconds = token.pauseAfterMs ?? options.pauseMs ?? 120;
        if (index < tokens.length - 1 && milliseconds > 0) {
          publish({ status: 'paused' });
          await pause(run, Math.min(5000, milliseconds));
        }
      }
      if (!run.settled) settle(run, { status: 'completed' });
    } catch {
      if (!run.settled) settle(run, { status: 'failed', error: new Error('Audio could not be stopped safely. Retry playback or restart the app.') });
    }
  }

  return {
    getSnapshot: () => snapshot,
    getServerSnapshot: () => INITIAL_PLAYBACK_SNAPSHOT,
    /** @param {() => void} listener */
    subscribe(listener) { listeners.add(listener); return () => { listeners.delete(listener); }; },
    /** @param {string} owner @param {import('../types').SpeechToken[]} tokens @param {import('../types').PlaybackOptions} options */
    play(owner, tokens, options = {}) {
      if (active) settle(active, { status: 'cancelled' });
      const stopped = stopProvider();
      const sequence = tokens.filter(token => token.text.trim()).map(token => ({ ...token }));
      /** @type {Promise<SpeechResult>} */
      const result = new Promise(resolve => {
        const run = { owner, resolve, settled: false, cancelWait: new Set() };
        active = run;
        publish({ owner, status: 'preparing', tokenIndex: -1, tokenCount: sequence.length, result: null, warning: null });
        void execute(run, sequence, { ...options }, stopped);
      });
      return result;
    },
    async stopForRecording() {
      if (active) settle(active, { status: 'cancelled' });
      if (speechMayBePlaying) await stopProvider();
    },
    /** @param {string} [owner] */
    stop(owner) {
      if (owner && active?.owner !== owner) return Promise.resolve();
      if (active) settle(active, { status: 'cancelled' });
      const stoppedSnapshot = snapshot;
      return stopProvider().catch(() => {
        if (snapshot === stoppedSnapshot) publish({
          result: { status: 'failed', error: new Error('The speech provider did not confirm Stop. Check device audio or restart the app before retrying.') },
        });
      });
    },
  };
}
