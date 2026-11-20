# Run 04 — P00 completion evidence

**16 November 2026. P00.1–P00.6 are agent-done.** The Android SDK prerequisite is resolved, both native apps were built, installed and exercised, and the independent web gates passed. This is migration implementation completion; P10/M11 release acceptance remains separate.

| Target | Actual outcome | Evidence |
|---|---|---|
| Shared / web | Fresh locked install; lint/types; 65 passing tests; Expo-free graph/consumers; production build and full browser/preference suites; 9 captures | [Shared report](shared/README.md) |
| Android | Direct debug APK; Android 16/API 36 emulator; 32 recorded checkpoints; real Google TTS; native storage migration/reset; 12 captures | [Android report](android/README.md), [artifact identity](android/artifact.json) |
| iOS | Direct unsigned Release simulator build; iPhone 17 Pro/iOS 26.2; final five-test runtime suite plus native migration/reset checks; 16 captures | [iOS report](ios/README.md), [artifact identity](ios/artifact.json) |

The [37-image screenshot index](screenshots/index.md) includes device/theme/state, method, original metadata and limits. [Source manifest](source-sha256.txt) and [verified artifact hashes](artifact-verification.json) identify this uncommitted candidate.

Builds are available locally as [Android debug APK](../../../artifacts/run04/android/NATOPhonetics-1.0.0-debug.apk), [iOS simulator ZIP](../../../artifacts/NATOPhonetics-ios-simulator.zip), and the production web directory `dist/`. The Android APK uses the public development key and Metro; the iOS ZIP contains an unsigned arm64 simulator app, not a device IPA.

Native verification found and repaired iOS scene ownership, malformed provider Boolean bridge arguments, Android Stop readiness/error handling and a missing ignore rule for generated CMake output. The intermittent iOS bulk-XCTest issue was isolated outside app logic using minimal controlled/uncontrolled React Native inputs; normal individual key events, edits and native clipboard Paste pass. The failures remain labelled diagnostics, not rewritten as passes.

The SDK is now at `~/Library/Android/sdk`; `/tmp/nato-android-sdk` remains a compatibility symlink. Android and iOS runtime work was serialized on the 8 GB host after resource-pressure failures. No store publishing, signed distribution, physical listening/accessibility acceptance or iOS 27 runtime pass is claimed. The unchanged dependency audit still contains one reviewed high finding. Next priority is R25/P05.6–P05.8.
