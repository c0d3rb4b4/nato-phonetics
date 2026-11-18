/** Isolate native event/initialization races from the shared playback owner.
 * The published library types incorrectly declare speak synchronous and listener
 * registration void; the native bridge returns promises and subscriptions.
 * @typedef {{getInitStatus: () => Promise<unknown>, voices: () => Promise<Array<{id: string, name: string, language: string, quality: number, networkConnectionRequired?: boolean, notInstalled?: boolean}>>, setDefaultLanguage: (language: string) => Promise<unknown>, setDefaultVoice: (voice: string) => Promise<unknown>, setDefaultRate: (rate: number, skipTransform?: boolean) => Promise<unknown>, speak: (text: string) => unknown, stop: () => Promise<unknown>, addListener: (event: string, callback: (event: {utteranceId: string | number}) => void) => {remove: () => void}}} NativeTts
 */

/** @param {NativeTts} provider @param {'ios' | 'android'} platform */
export function createNativeTtsAdapter(provider, platform) {
  let generation = 0;
  let operations = Promise.resolve();
  /** @type {null | (() => void)} */
  let cancelActive = null;
  /** @param {() => Promise<void>} operation */
  const enqueue = (operation) => {
    operations = operations.catch(() => {}).then(operation);
    return operations;
  };

  return {
    async voices() {
      await provider.getInitStatus();
      return (await provider.voices()).filter(voice => !voice.notInstalled).map(voice => ({
        identifier: voice.id, name: voice.name, language: voice.language,
        // The bridge exports iOS quality as 300/500 (not AVSpeech's 1/2).
        // Android QUALITY_NORMAL is 300, HIGH is 400 and VERY_HIGH is 500.
        quality: voice.quality >= (platform === 'ios' ? 500 : 400) ? 'Enhanced' : 'Default',
        // Unknown provider connectivity remains unknown, rather than local-only.
        ...(typeof voice.networkConnectionRequired === 'boolean' ? { localService: !voice.networkConnectionRequired } : {}),
      }));
    },
    /** @param {string} text @param {import('./playbackController').UtteranceOptions} options */
    speak(text, options) {
      const token = ++generation;
      return enqueue(async () => {
        await provider.getInitStatus();
        if (token !== generation) return;
        // Setting language resets the prior chosen voice on both platforms, so
        // returning to System Default cannot accidentally retain a custom voice.
        await provider.setDefaultLanguage(options.language ?? 'en-GB');
        if (token !== generation) return;
        if (options.voice) await provider.setDefaultVoice(options.voice);
        if (token !== generation) return;
        // iOS uses AVSpeech's 0..1 scale; Android accepts the original multiplier.
        await provider.setDefaultRate(platform === 'ios' ? Math.min(0.99, options.rate * 0.5) : options.rate, true);
        if (token !== generation) return;
        /** @type {string | null} */
        let utteranceId = null;
        let finished = false;
        /** @type {Array<{id: string, kind: string}>} */
        const early = [];
        /** @type {Array<{remove: () => void}>} */
        const subscriptions = [];
        /** @param {string} kind */
        const finish = (kind) => {
          if (finished) return;
          finished = true;
          subscriptions.forEach(subscription => subscription.remove());
          if (cancelActive === cancel) cancelActive = null;
          if (kind === 'tts-finish') options.onDone();
          else if (kind === 'tts-cancel') options.onStopped();
          else options.onError(new Error('Device speech failed. Check your installed speech engine and retry.'));
        };
        const cancel = () => finish('tts-cancel');
        cancelActive = cancel;
        // iOS's emitter does not declare tts-error; initialization/speak promise
        // failures and the controller timeout cover its failure paths.
        const events = platform === 'ios' ? ['tts-finish', 'tts-cancel'] : ['tts-finish', 'tts-cancel', 'tts-error'];
        for (const kind of events) {
          subscriptions.push(provider.addListener(kind, event => {
            if (token !== generation || finished) return;
            const id = String(event.utteranceId);
            if (utteranceId === null) { if (early.length < 32) early.push({ id, kind }); }
            else if (id === utteranceId) finish(kind);
          }));
        }
        try {
          utteranceId = String(await provider.speak(text));
          if (token !== generation) { cancel(); return; }
          const terminal = early.find(event => event.id === utteranceId);
          if (terminal) finish(terminal.kind);
        } catch (error) {
          finish('tts-error');
          throw error;
        }
      });
    },
    stop() {
      ++generation;
      cancelActive?.();
      return enqueue(async () => {
        // The controller stops before its first Play. Android rejects stop()
        // with not_ready until OnInit, so wait for the same engine readiness
        // used by speak/voices while cancellation remains immediate above.
        await provider.getInitStatus();
        const stopped = await provider.stop();
        // Android returns false for TextToSpeech.ERROR. iOS returns false when
        // there was simply no active utterance, which is safe before first Play.
        if (platform === 'android' && stopped === false) {
          throw new Error('Device speech could not be stopped.');
        }
      });
    },
  };
}
