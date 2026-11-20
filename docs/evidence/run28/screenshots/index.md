# Run28 actual screenshots — 20 November 2026

All4 actual originals viewed in full with `view_image`. No blank/loading/error screen or unexpected required-glyph clipping in the recorded samples. Partial lower controls are ordinary scroll-view edges; these samples do not establish full Release raster/reachability/window acceptance. [Inspection](inspection.json), [per-image timestamps/SHA256/commands](android/metadata.json).

Android16/API36, dedicated `nato-p00-api36` / `emulator-5580`, ARM64-only runtime,720×1600 physical pixels, density280/1.75. Retained dark preference. Capture method for every original: `adb -s emulator-5580 exec-out screencap -p`.

| Actual image | Candidate | State |
|---|---|---|
| [Populated converter](android/release-converter-default.png) | Unchanged non-debuggable Run27 Release engineering test copy5dfa45d2 | Default font1, NUWJ359 and plain output |
| [Live enlarged converter](android/release-converter-live2.png) | Same exact Release APK | Same input after live1→2; prompt/input/clear/instructions/play/replay visibly enlarge |
| [Release reference](android/release-reference-default.png) | Same exact Release APK | Return to1, first nine tiles/reference controls |
| [Restored product reference](android/restored-product-reference.png) | Exact initial Debug source APK1b045e2d | Ordinary product Metro, retained dark/default settings, no fixture root |

[Release artifact/installed runtime scope](../android/release-sample-identity.json), [Run27 immutable original/test identities](../../run27/android/release-artifacts.json), [restoration and tooling shutdown](../android/restoration.json), [actual loaded ordinary Debug product JS](../android/loaded-source/loaded-javascript.json). Release captures use embedded production JS, no Metro or root replacement; the separate Debug restoration uses ordinary product Metro. Neither test key nor screenshots establish distribution/physical acceptance.

armeabi-v7a/x86/x86_64 runtime captures: missing/unrun, because the available installed Android runtime reports only `arm64-v8a`, no32-bit ABI. Successful compilation/linking is not runtime evidence. P05.2 owns qualification on a suitable additional runtime/host; no permanent support exception or human acceptance is inferred.

Web/iOS: new captures inapplicable to this Android ABI/harness and explicit bundler-worker-control batch; app UI, native repair, fonts/design, dependency graph and web worker bytes are unchanged. No fresh iOS build or general cross-target runtime pass is inherited. P10.7 final integrated web/Android/iOS matrix and M11 physical/AT/listening/provider/signing/release acceptance remain unfinished.
