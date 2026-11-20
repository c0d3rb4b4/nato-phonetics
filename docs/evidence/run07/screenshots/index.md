# Run 07 actual screenshot evidence

17 November 2026. **92 inspected captures: 81 final app captures and 11 iOS diagnostic captures.** Original PNGs retain their byte hashes. No image is a mockup or a responsive-browser substitute for a native target.

| Target | Final / diagnostic captures | Evidence |
|---|---:|---|
| Production web / Edge 157 | 12 / 0 | [Index and images](web/index.md), [metadata](web/metadata.json), [checks](../web/README.md) |
| Installed Android 16 / API 36 | 33 / 0 | [Index and images](android/index.md), [metadata](android/metadata.json), [checks](../android/README.md) |
| Installed iOS/iPadOS 26.2, Debug and Release | 36 / 11 | [Index and images](ios/index.md), [metadata](ios/metadata.json), [checks](../ios/README.md) |

The 11 iOS diagnostics are ten pre-correction captures plus one incorrect-category fixture capture. [15 isolated Android control screenshots](../android/diagnostics/README.md) are separate from the indexed app counts. Passing visual inspection does not turn the retained strict raster misses or ordinary Android clipping into passes.

Representative original images:

- [Web desktop alphabet](web/alphabet-desktop-light-first.png) and [narrow dark converter](web/converter-narrow-dark-last.png).
- [Android corrected TREE guide](android/final-converter-dark-scale2-4.png), [actual resized window](android/window-split-large.png), and [retained ordinary-text failure](android/final-quiz-controls-dark-scale2.png).
- [iPad maximum I/J](ios/final-debug-maximum-alphabet-J-dark.png), [Release iPhone maximum J](ios/final-release-phone-maximum-focused-alphabet-J-dark.png) and [its reachable right edge](ios/final-release-phone-maximum-focused-horizontal-alphabet-J-dark.png).

Candidate identities: [maintained source](../source-identity.json), [Android APK plus loaded JavaScript](../android/artifact.json), [iOS Release](../ios/artifact.json), [iOS Debug library plus loaded JavaScript](../ios/debug-artifact.json). Per-target metadata records platform/runtime, viewport/density/text size, theme, screen/state, command, time and inspection.

No supported target lacks a capture for this batch's changed tile flows. No separate UI screenshot applies to hook-only lifecycle unit tests. Unimplemented session/results/new-practice screens and final integrated release screenshots remain P10.7; physical accessibility, listening and release acceptance remain M11.
