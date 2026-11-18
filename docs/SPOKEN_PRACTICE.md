# Spoken-answer recognition assessment

Assessed 18 November 2026 for P09.1 against React Native 0.81.5, the owned native projects and independent web build. **Recognition is not implemented.** P09.2–.4, actual microphone/permission/provider tests and M11 acceptance remain unfinished. Listening and typed recall already work; they are alternatives, not evidence of recognition delivery.

## Integration choice and support matrix

Use small repository-owned Android/iOS OS adapters and a browser adapter behind the replaceable contract below. This avoids a framework upgrade or new service/package. The existing native TTS and header/typography bridges demonstrate the repository's integration mechanism; recognition bridging still requires compilation/runtime qualification. The npm registry marks `@react-native-voice/voice` 3.2.4 deprecated, and its [maintainer README](https://github.com/react-native-voice/voice) directs users to an Expo module. An Expo-module dependency conflicts with P00's removal contract. [Registry snapshot](evidence/run14/shared/recognition-package.json). Neither option was installed.

| Planned adapter / app target | Platform behavior and requirements | Offline boundary / actual evidence |
|---|---|---|
| Android `SpeechRecognizer`; app minimum API 24 | `RECORD_AUDIO` runtime permission on explicit Start; recognition-service package query for target API 30+. Main-thread lifecycle; cancel/destroy owned recognizer. Ordinary system service may process audio remotely. | API 31+ offers an explicitly on-device factory with an availability check. Older APIs lack that guarantee; `EXTRA_PREFER_OFFLINE` can be ignored. API presence is insufficient for locale/model support. Emulator API 36 lists two recognition services; on-device factory, language readiness and real capture remain unrun. [Service enumeration](evidence/run14/android/recognition-services.txt). |
| iOS `SFSpeechRecognizer` + audio buffer request/`AVAudioEngine`; app minimum 15.1 | Both Speech authorization and microphone authorization on explicit use. Compile/link Speech/AVFoundation and add usage descriptions when implementing. Locale/availability can change; all capture resources must be released. | Require both `supportsOnDeviceRecognition` and `requiresOnDeviceRecognition = true` for the local path. The standalone iOS 26.2 probe constructs en-GB, reports available/local support, but has authorization raw 1 (denied). It is a separate executable, not the production app's permission state or a working recognition test. [Probe](evidence/run14/recognition/ios-capability.json). |
| Web `SpeechRecognition` / prefixed equivalent; app remains a web target | Feature-detect on the actual browser and secure origin. Start from an explicit gesture; browser owns permission UI. Native API availability differs by browser/version/locale. | Local mode requires actual local capability and a language pack; do not infer it from constructor presence. Edge 157 headless loopback exposes constructor/local/availability/install APIs but en-GB local availability returns `unavailable`. No recognizer was started and no model installed. [Probe](evidence/run14/recognition/browser-capability.json). Real hosted/mobile browsers remain unrun. |

Android API/lifecycle/permission facts: [SpeechRecognizer](https://developer.android.com/reference/android/speech/SpeechRecognizer). The offline hint limitation is explicit in [RecognizerIntent](https://developer.android.com/reference/android/speech/RecognizerIntent#EXTRA_PREFER_OFFLINE). These are prospective requirements; the production manifest remains unchanged.

Apple documents locale/service availability in [SFSpeechRecognizer](https://developer.apple.com/documentation/speech/sfspeechrecognizer). The local requirement is conditional on [device support](https://developer.apple.com/documentation/speech/sfspeechrecognizer/supportsondevicerecognition) and the [request setting](https://developer.apple.com/documentation/speech/sfspeechrecognitionrequest/requiresondevicerecognition). [Speech usage description](https://developer.apple.com/documentation/bundleresources/information-property-list/nsspeechrecognitionusagedescription) is needed even for on-device requests; [microphone usage description](https://developer.apple.com/documentation/bundleresources/information-property-list/nsmicrophoneusagedescription) covers capture. Apple's current [live-audio sample](https://developer.apple.com/documentation/speech/recognizing-speech-in-live-audio) uses newer iOS 26/27 APIs and a physical iOS 27 device; it cannot be copied as a baseline for this app's iOS 15.1 minimum.

The [Web Speech community specification](https://webaudio.github.io/web-speech-api/) defines local processing, availability/download states, errors and explicit user permission. It is a draft, not proof of browser implementation. Default processing may be remote. Secure loopback headless evidence does not qualify deployed HTTPS, interactive permissions or mobile engines.

## Reversible provider contract for P09.2

This is a design contract, not a shipped mock or callable feature. Implement per-platform adapters through the same shared controller; keep provider types out of screens.

```ts
type Capability = {
  available: boolean;
  locale: string;
  processing: 'on-device' | 'provider' | 'unknown';
  permission: 'prompt' | 'granted' | 'denied' | 'restricted' | 'unknown';
  reason?: 'engine-missing' | 'language-unavailable' | 'model-missing' | 'local-unavailable';
};
interface RecognitionProvider {
  inspect(locale: string): Promise<Capability>; // no permission/capture/download
  start(options: { sessionId: string; locale: string; requireLocal: boolean },
        emit: (event: RecognitionEvent) => void): Promise<void>;
  stop(sessionId: string): Promise<void>; // stop capture; permit final owned result
  cancel(sessionId: string): Promise<void>; // stop capture; discard late results
  dispose(): Promise<void>;
}
```

`RecognitionEvent` must carry session ID and one of ready/listening/partial/final/error/ended. Final carries transcript and optional confidence; errors distinguish permission, missing engine/model/language, silence, audio, busy, timeout, provider/network and cancellation. Do not persist, log or attach transcripts/raw audio to evidence. Inject clocks/providers in controller tests; keep deterministic adapters distinct from real-provider qualification.

Use the existing canonical typed-answer normalization (including Alpha/Juliet aliases), guarded session submission and progress recorder. Show the recognized text for correction/explicit submission; interim/final recognition callbacks alone do not score or save answers. Starting capture stops TTS; starting playback cancels capture. Navigation, backgrounding, Retry/new questions and disposal invalidate the generation and release the microphone; stale finals cannot update answers. Handle permissions separately from capability and recheck revoked permission. Bound initialization/capture/terminal waits and make Stop/Retry explicit.

Reversible default: attempt an explicitly local path first. When locality/readiness cannot be established, show an honest unavailable state and keep typed/listening practice. A provider/network path requires visible disclosure and deliberate user choice before capture; no automatic fallback or new app cloud service. This is an implementation default, not a permanent target exception or an owner acceptance of missing recognition. Model installation must be explicit and separate from permission-free inspection.

## Next implementation forecast and qualification

P09.2–.4 are M–L: shared capture controller/session integration, native modules/permissions/audio lifecycle, web capability/gesture handling, accurate help/privacy, direct native builds and actual changed-flow captures. Reserve a full implementation and serial provider-verification cycle; asset builds/probes do not qualify these modules. First discriminating engineering checks: Android on-device factory plus requested English support, iOS application-scoped permission/local task, and interactive secure-origin web local readiness. An unavailable test environment stays an engineering qualification limit; only genuinely restricted access, physical recognition accuracy, provider/privacy acceptance or a proposed support exception goes to M11.1/.2/.6.

Required automated branches: permission grant/deny/revoke, missing/changed engine, unsupported locale/missing pack, silence/timeout, duplicate/late callbacks, Stop/cancel/replace/navigation/background cleanup, TTS exclusion, user correction, exactly-once score/progress and failure recovery. Required real-provider evidence: an actual recognized answer on each declared eligible path, capture stopping, no hidden remote fallback, builds and screenshots. Physical microphone/accuracy/network/offline review remains M11.6. No OS/browser target is removed and F08 remains in progress.

Assessment-only screenshots are inapplicable: no product route, permission prompt, capture flow or support claim changed. Run 14's asset screenshots cover the actual product changes. These probes never request access/start recording, and the app's current no-microphone disclosures remain accurate.
