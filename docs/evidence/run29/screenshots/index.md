# Run29 actual screenshot index — 20 November 2026

**40 actual Android captures inspected:**28final diagnostic fixture,11unchanged production Release,1restored exact initial Debug. Android16/API36 ARM64 emulator-5580, density280/1.75; normal720×1600 and narrow560×1000 windows. Fixture is white; product/restored captures are dark. Per-image date/state/dimensions/font-scale/hash/commands are in [inspection/metadata](inspection.json).

Final fixture **f56ea0f3…** binds487 identical other non-signature entries to unsigned original **1efaab9d…**. Production images use unchanged non-debuggable **5dfa45d2…** with embedded product Hermes JS; restored Debug **1b045e2d…** uses ordinary Metro with archived loaded source. [Payload identity](../android/fixture-payload-identity-final.json), [product identity](../android/product/identity.json), [restoration](../android/restoration.json).

Actual fixture PNGs use SDK `UiAutomation.takeScreenshot` and are collected by `adb exec-out cat`; product/restored PNGs use `adb -s emulator-5580 exec-out screencap -p`. No synthetic app images. Derived labelled contact sheets support visual inspection and are not counted.

Representative product images: [converter live2](android/product/release-converter-live2.png), [same submitted quiz live2](android/product/release-quiz-submitted-live2.png), [reachable enlarged feedback/Next](android/product/release-quiz-submitted-live2-controls.png), [restored reference](android/restored-product.png).

| Actual image | Scope/state | Font scale |
|---|---|---|
| [android/fixture/cold1.png](android/fixture/cold1.png) | fixture / Normal-startup separate diagnostic fixture: cold1 | 1 |
| [android/fixture/live2.png](android/fixture/live2.png) | fixture / Normal-startup separate diagnostic fixture: live2 | 2 |
| [android/fixture/return1.png](android/fixture/return1.png) | fixture / Normal-startup separate diagnostic fixture: return1 | 1 |
| [android/fixture/cold2.png](android/fixture/cold2.png) | fixture / Normal-startup separate diagnostic fixture: cold2 | 2 |
| [android/fixture/resize-narrow2.png](android/fixture/resize-narrow2.png) | fixture / Normal-startup separate diagnostic fixture: resize-narrow2 | 2 |
| [android/fixture/resize-restored2.png](android/fixture/resize-restored2.png) | fixture / Normal-startup separate diagnostic fixture: resize-restored2 | 2 |
| [android/fixture/cold085.png](android/fixture/cold085.png) | fixture / Normal-startup separate diagnostic fixture: cold085 | 0.8500000238418579 |
| [android/fixture/cold13.png](android/fixture/cold13.png) | fixture / Normal-startup separate diagnostic fixture: cold13 | 1.2999999523162842 |
| [android/fixture/sweep0-0.85.png](android/fixture/sweep0-0.85.png) | fixture / Normal-startup separate diagnostic fixture: sweep0-0.85 | 0.8500000238418579 |
| [android/fixture/sweep1-1.3.png](android/fixture/sweep1-1.3.png) | fixture / Normal-startup separate diagnostic fixture: sweep1-1.3 | 1.2999999523162842 |
| [android/fixture/sweep2-2.0.png](android/fixture/sweep2-2.0.png) | fixture / Normal-startup separate diagnostic fixture: sweep2-2.0 | 2 |
| [android/fixture/sweep3-1.0.png](android/fixture/sweep3-1.0.png) | fixture / Normal-startup separate diagnostic fixture: sweep3-1.0 | 1 |
| [android/fixture/sweep4-0.85.png](android/fixture/sweep4-0.85.png) | fixture / Normal-startup separate diagnostic fixture: sweep4-0.85 | 0.8500000238418579 |
| [android/fixture/sweep5-2.0.png](android/fixture/sweep5-2.0.png) | fixture / Normal-startup separate diagnostic fixture: sweep5-2.0 | 2 |
| [android/fixture/sweep6-1.3.png](android/fixture/sweep6-1.3.png) | fixture / Normal-startup separate diagnostic fixture: sweep6-1.3 | 1.2999999523162842 |
| [android/fixture/sweep7-1.0.png](android/fixture/sweep7-1.0.png) | fixture / Normal-startup separate diagnostic fixture: sweep7-1.0 | 1 |
| [android/fixture/editing-start.png](android/fixture/editing-start.png) | fixture / Normal-startup separate diagnostic fixture: editing-start | 1 |
| [android/fixture/editing-before.png](android/fixture/editing-before.png) | fixture / Normal-startup separate diagnostic fixture: editing-before | 1 |
| [android/fixture/editing-typed-before.png](android/fixture/editing-typed-before.png) | fixture / Normal-startup separate diagnostic fixture: editing-typed-before | 1 |
| [android/fixture/editing-live2.png](android/fixture/editing-live2.png) | fixture / Normal-startup separate diagnostic fixture: editing-live2 | 2 |
| [android/fixture/editing-return1.png](android/fixture/editing-return1.png) | fixture / Normal-startup separate diagnostic fixture: editing-return1 | 1 |
| [android/fixture/editing-insert.png](android/fixture/editing-insert.png) | fixture / Normal-startup separate diagnostic fixture: editing-insert | 1 |
| [android/narrow/cold1.png](android/narrow/cold1.png) | narrow / Normal-startup separate diagnostic fixture: cold1 | 1 |
| [android/narrow/live2.png](android/narrow/live2.png) | narrow / Normal-startup separate diagnostic fixture: live2 | 2 |
| [android/narrow/return1.png](android/narrow/return1.png) | narrow / Normal-startup separate diagnostic fixture: return1 | 1 |
| [android/narrow/cold2.png](android/narrow/cold2.png) | narrow / Normal-startup separate diagnostic fixture: cold2 | 2 |
| [android/narrow/resize-narrow2.png](android/narrow/resize-narrow2.png) | narrow / Normal-startup separate diagnostic fixture: resize-narrow2 | 2 |
| [android/narrow/resize-restored2.png](android/narrow/resize-restored2.png) | narrow / Normal-startup separate diagnostic fixture: resize-restored2 | 2 |
| [android/product/release-converter-default.png](android/product/release-converter-default.png) | product / Same production converter; retained input through1→2→1 | 1 |
| [android/product/release-converter-live2.png](android/product/release-converter-live2.png) | product / Same production converter; retained input through1→2→1 | 2.0 |
| [android/product/release-converter-return1.png](android/product/release-converter-return1.png) | product / Same production converter; retained input through1→2→1 | 1.0 |
| [android/product/release-quiz-question-default.png](android/product/release-quiz-question-default.png) | product / Unrevealed production question; answer absent in UIAutomator | 1.0 |
| [android/product/release-quiz-submitted-default.png](android/product/release-quiz-submitted-default.png) | product / Production submitted question retained before live scaling | 1.0 |
| [android/product/release-quiz-submitted-live2.png](android/product/release-quiz-submitted-live2.png) | product / Same submitted question and score through live scale transition | 2.0 |
| [android/product/release-quiz-submitted-live2-controls.png](android/product/release-quiz-submitted-live2-controls.png) | product / Reachable feedback and Next question; actual short gutter swipes | 2.0 |
| [android/product/release-quiz-submitted-return1.png](android/product/release-quiz-submitted-return1.png) | product / Same submitted question and score through live scale transition | 1.0 |
| [android/product/release-quiz-submitted-return1-controls.png](android/product/release-quiz-submitted-return1-controls.png) | product / Reachable feedback and Next question; actual short gutter swipes | 1.0 |
| [android/product/release-quiz-next-default.png](android/product/release-quiz-next-default.png) | product / Explicit Next advances once after retained feedback | 1.0 |
| [android/product/release-reference-default.png](android/product/release-reference-default.png) | product / Ordinary production reference after return to default font scale | 1.0 |
| [android/restored-product.png](android/restored-product.png) | restored / Exact initial Debug APK restored, ordinary Metro product reference | 1.0 |

All visible frames inspected: no blank/splash/error capture. Fixed-width nested text lies below the unscrolled narrow fixture viewport; its frame is measured but this is not product usability/reachability acceptance. Product controls are deliberately captured after scrolling. No full Release tile baseline/ink/context or physical AT/listening claim.

**Earlier diagnostic candidates:** initial metadata-deficient fixture images/reports remain under `../android/minimal-corrected`, `../android/extended` and `../android/narrow`; their candidate **dd782f53…** is not the corrected exact-payload qualification. Do not mix them into the40final captures.

**Missing/inapplicable:** new web/iOS captures are inapplicable to Android-only test packaging/instrumentation/observer changes; product JS/native/font/dependency/worker bytes remain unchanged. Full production Release tile baseline/raster/window capture set is missing/unrun pending P05.2-F2 native observation; non-ARM64 runtime captures unrun on the available ARM64-only image. Final integrated cross-target P10.7 remains open. These are engineering follow-ups, no new human prerequisite. [Next task](../android/next-android.md).
