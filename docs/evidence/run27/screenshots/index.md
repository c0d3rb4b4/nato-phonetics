# Run27 actual screenshot evidence — 19 November 2026

F1: installed Run26 opt-in ARM64 Debug source candidate, APK SHA256 `1b045e2dc7b2f1761bd4f8aa708cde29b498f2c43963b3062cc08b8555c28eee`. Android16/API36, `nato-p00-api36` / `emulator-5580`, 720×1600px override, density280/1.75 (411.429×914.286dp). React Native0.81.5 Fabric/Hermes. [Installed identity](../android/identity.json), [actual loaded product JS](../android/loaded-source/loaded-javascript.json).

All19 final originals inspected directly or in the four linked contact sheets: no blank/loading/error screen, lost required glyphs or unexpected clipping in the qualified complete tiles. Partial tiles at viewport edges are normal scroll views and are excluded from the raster samples; every required tile/part is fully visible in another original. Enlarged quiz controls and concealed/revealed states inspected. Contact sheets are labeled thumbnails for inspection, not additional captures.

Capture command: `adb -s emulator-5580 exec-out screencap -p`. Per-image timestamps, settings and SHA256 in [metadata](android/metadata.json). Required pixel assertions and coverage pass in [F1 summary](../android/f1-summary.json), [raster](../android/extended-raster-measurements.json) and [native layouts](../android/native-layout-checks.json).

| Actual original | Theme | Font scale | State |
|---|---|---|---|
| [final-alphabet-light-0.png](android/final-alphabet-light-0.png) | light | 1 | Current source candidate: actual native frames, baseline events and raster |
| [final-alphabet-light-1.png](android/final-alphabet-light-1.png) | light | 1 | Current source candidate: actual native frames, baseline events and raster |
| [final-alphabet-light-2.png](android/final-alphabet-light-2.png) | light | 1 | Current source candidate: actual native frames, baseline events and raster |
| [final-alphabet-light-3.png](android/final-alphabet-light-3.png) | light | 1 | Current source candidate: actual native frames, baseline events and raster |
| [final-alphabet-light-4.png](android/final-alphabet-light-4.png) | light | 1 | Current source candidate: actual native frames, baseline events and raster |
| [final-converter-light-2.png](android/final-converter-light-2.png) | light | 1 | Current source candidate: actual native frames, baseline events and raster |
| [final-converter-light-3.png](android/final-converter-light-3.png) | light | 1 | Current source candidate: actual native frames, baseline events and raster |
| [final-converter-dark-2.png](android/final-converter-dark-2.png) | dark | 1 | Current source candidate: actual native frames, baseline events and raster |
| [final-converter-dark-3.png](android/final-converter-dark-3.png) | dark | 1 | Current source candidate: actual native frames, baseline events and raster |
| [final-converter-dark-scale2-5.png](android/final-converter-dark-scale2-5.png) | dark | 2.0 | Current source candidate: actual native frames, baseline events and raster |
| [final-converter-dark-scale2-6.png](android/final-converter-dark-scale2-6.png) | dark | 2.0 | Current source candidate: actual native frames, baseline events and raster |
| [final-converter-dark-scale2-7.png](android/final-converter-dark-scale2-7.png) | dark | 2.0 | Current source candidate: actual native frames, baseline events and raster |
| [final-converter-dark-scale2-8.png](android/final-converter-dark-scale2-8.png) | dark | 2.0 | Current source candidate: actual native frames, baseline events and raster |
| [final-converter-dark-scale2-9.png](android/final-converter-dark-scale2-9.png) | dark | 2.0 | Current source candidate: actual native frames, baseline events and raster |
| [final-converter-dark-scale2-10.png](android/final-converter-dark-scale2-10.png) | dark | 2.0 | Current source candidate: actual native frames, baseline events and raster |
| [final-converter-dark-scale2-11.png](android/final-converter-dark-scale2-11.png) | dark | 2.0 | Current source candidate: actual native frames, baseline events and raster |
| [final-quiz-question-dark-scale2.png](android/final-quiz-question-dark-scale2.png) | dark | 2.0 | Current source candidate: actual native frames, baseline events and raster |
| [final-quiz-feedback-dark-scale2.png](android/final-quiz-feedback-dark-scale2.png) | dark | 2.0 | Current source candidate: actual native frames, baseline events and raster |
| [final-quiz-controls-dark-scale2.png](android/final-quiz-controls-dark-scale2.png) | dark | 2.0 | Enlarged persistent feedback, Next and Replay |

Inspection contact sheets: [sheet 1](inspection-1.png), [sheet 2](inspection-2.png), [sheet 3](inspection-3.png), [sheet 4](inspection-4.png).

Failed capture commands remain failed: [initial converter alignment](../diagnostics/initial-capture/capture.log), [offscreen Next predicate](../diagnostics/quiz-next-offscreen/capture.log). Same submitted round feedback/Next capture continuation passes; final original-scope layout/raster reports are separate complete gates. Failed images are retained in diagnostics and excluded from the19 final originals.

Web/iOS: no new product, font, worker or non-Android native input changed in this Android-only qualification. New captures inapplicable to this scope; previous target evidence/failures retain their limits. P10.7 complete integrated cross-target capture set stays unfinished. Physical/AT/listening/provider-keyboard acceptance remains M11.


## ARM64 Release composition — five actual captures

The installed APK is the separately development-signed, non-debuggable Release copy `5dfa45d22b562ddb03fffcbeb16b16bf0392197d69e92320437d5a1ab22ae129`, payload-identical to unsigned source APK `1efaab9d3c1b7b956f1c9d6ca85e9539304568504eb239b89cc21cc4da610f86`. Embedded product JS, pinned Maven Release Hermes and exact library/build IDs are verified in [artifact identity](../android/release-artifacts.json). No Metro, fixture-entry substitution, private signing or publication. [Five-check report](../android/release-composition/report.json), [installed identities](../android/release-composition/identity.json), [capture metadata](android/release-composition/metadata.json).

Capture method: actual Android `UiAutomation.takeScreenshot()` at each test-IME checkpoint. All five inspected; text, focus/caret/composition persist across1→2→1 and subsequent compose/commit. This establishes the recorded test-IME scope, not physical/provider keyboards or complete Release raster/navigation assurance.

- [composition-before.png](android/release-composition/composition-before.png) — scale1, text `NUWQJ359`, caret4.
- [composition-live-2.png](android/release-composition/composition-live-2.png) — scale2, text `NUWQJ359`, caret4.
- [composition-live-1.png](android/release-composition/composition-live-1.png) — scale1, text `NUWQJ359`, caret4.
- [composition-continued.png](android/release-composition/composition-continued.png) — scale1, text `NUWQRJ359`, caret5.
- [composition-committed.png](android/release-composition/composition-committed.png) — scale1, text `NUWQRZJ359`, caret6.


[Restored product reference](android/restored-product-reference.png) — exact initial Debug source APK, ordinary product Metro, dark/default font/window/IME. Inspected full original; no blank/error/unexpected clipping.25 final actual originals in total. [Operational restoration/shutdown](../android/restoration.json).
