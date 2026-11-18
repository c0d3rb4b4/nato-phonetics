# Run 07 iOS evidence — 17 November 2026

The measured-origin correction fixes the earlier iPad maximum-size J failure and exposes actual native baseline evidence. **P05.8 remains partial:** the final Debug matrix has complete required coverage but three maximum-size DPR 3 SemiBold-word edges exceed the unchanged 2-physical-pixel raster envelope. Exact baseline alignment does not override a failed screenshot gate.

## Candidate identity and scope

The installed simulator applications are separately identified:

- [Debug artifact](debug-artifact.json), [installed iPad identity](installed-artifact.json), [installed phone identity](installed-artifact-phone.json), and the actual executed [iPad](loaded-javascript-ipad.json) / [phone](loaded-javascript.json) JavaScript archives. Both loaded bundles hash to `94dc40780caa0ff43469cc9eee3072c171af99b8743a2628ca9a00c991d8b517`. Debug uses Metro and the standard Hermes inspector; no application diagnostic module was added.
- [Release artifact](artifact.json), [installed Release identity](installed-release-artifact.json), and [build/source comparison](release-build-source.json). Its embedded JavaScript hashes to `5c95e5c1a876c5902897d7bbb9a78c0890ccfff765116da8913ae8686afa858a`. Source and bundled font hashes agree with the corrected Debug candidate. The Release build passes in [release-build.log](release-build.log).

Builds use Xcode 27.2 (27B52). Actual runtime targets are the iPad Pro 11-inch M5, iPadOS 26.2, DPR 2, and iPhone 17 Pro, iOS 26.2, DPR 3. Default and largest supported content-size categories independently report React Native font scales **1 and 3.571** in Debug. Xcode 27 does not imply an iOS 27 runtime pass.

## Diagnosis and correction

The [frozen pre-origin diagnosis](diagnostics/pre-origin/README.md) retains its own candidate, native events, ten diagnostic screenshots and failed gate: 213/215 raster observations pass, with maximum J lower edges at +2.2224004 px using the independently observed scale. The native J baseline was +0.4320073 px below its specified tile-relative target because the outer letter box rounded from nominal 14.284 to actual 14.5 logical units.

The shared hook now subtracts actual native header/body and outer text-box origins from the existing whole-tile baseline target. Geometry and text generations are independent, so replacing a quiz symbol retains a valid unchanged origin; old/unmounted callbacks are rejected. Fonts, sizes, line heights, proportions, design metrics and tolerances remain unchanged. [Shared implementation/tests](../shared/README.md) and the [independent audit](../shared/fidelity-audit.md) explain the source and lifecycle checks.

The Hermes inspector reads `line.y + line.ascender` already retained by the real `onTextLayout` hook, actual Fabric frames, and retained `onLayout` origins. It does not reconstruct a baseline from font tables. Full original line-event objects are not retained, so these observations must be described as the actual event-derived baseline sum. [Inspector](inspect-tiles.js) and [native verifier](verify-layout.cjs) are preserved.

## Final Debug results

Five actual XCTest cases pass: [iPad default](final-default-test.log), [iPad maximum](final-maximum-test.log), [phone default](final-phone-default-test.log), [phone maximum](final-phone-maximum-test.log), and [focused phone maximum](final-phone-maximum-focused-test.log). The first phone maximum scroll stopped with India word/guide visible and only part of J in view; the focused captures add all J parts without overwriting that initial evidence.

The [native layout checks](native-layout-checks.json) pass **32 groups / 1,773 baselines**, with zero missing measurements and maximum absolute baseline error **5.9957301×10⁻⁹ physical px**. Native event origins agree with measured local frames. Parent-plus-box origins agree with page-frame differences within the separate 0.01-physical-pixel float32 comparison epsilon for far-offscreen coordinates. The original 1-pixel baseline/geometry acceptance limit is unchanged.

The [strict raster gate](raster-summary.json), [observations](raster-measurements.json) and [excluded regions](raster-exclusions.json) preserve **453/456 passing observations** with complete required coverage. Coverage checks explicitly require all 26 alphabet letters at default/maximum, all seven maximum converter symbols, default-dark `NUWJ` long labels, concealed/revealed default/maximum quiz parts, a genuinely changed next question, and focused default/maximum J at DPR 2 and 3. The [iPad-only checkpoint](raster-summary-ipad-preview.json) passes all **406 observations**, maximum delta 1.978144 px, while correctly retaining its then-missing phone coverage.

| Remaining Debug failure | Lower-edge delta |
| --- | ---: |
| Initial maximum phone India word | +2.041928153 px |
| Focused maximum phone Juliett word | +2.042446952 px |
| Same Juliett word after horizontal scroll | +2.042446952 px |

The maximum J **letter** now passes. All three remaining failures have nearly exact measured baselines; they are actual ink-support failures. The gate still uses an RGB-channel difference greater than 8 and the original 2-pixel envelope. No failed original is removed because another viewport passes.

The [India fringe analysis](phone-india-fringe.json) and [independent source/numeric analysis](../shared/ios-dpr3-fringe-analysis.json) retain the faint but real boundary pixels. Raw letter/word/guide line baselines are identical at DPR 2/3 and scale by float32(3.571), with negligible residuals. The inspected Fabric custom-font path does not apply the legacy integer font-size rounding. A material font-size mismatch is unsupported; the exact rendering cause is not established. The next discriminating check is actual attributed-font/path state and controlled fractional baseline/layer phases, preserving current production metrics and tolerances.

The maximum quiz test records actual **U→Z** turnover after Next and independently measures the replacement symbol. The focused phone test records horizontal tile movement **X 16→−6.666667→16** with unchanged size/Y. Its paired screenshots expose the previously hidden right corners, verifying reachable overflow when proportional enlarged tiles exceed the phone viewport.

## Release confirmation and retained fixture failure

The installed Release [default](release-phone-default-test.log) and [initial maximum](release-phone-maximum-test.log) XCTest cases pass. Their actual original screenshots are retained; the maximum image primarily shows India word/guide and J's symbol, so that initial image alone cannot establish full maximum J coverage. Release has no Hermes baseline payload. Its pixel comparison uses independently observed Debug scale on the same phone/category and separately verified source/font/installed identity; it is not described as raw Release baseline evidence.

The first focused Release fixture received an invalid content-size argument, ran in the default category and failed its horizontal-overflow assertion. [Failed setup/runtime](release-focused-runtime.log) and [failed test](release-phone-maximum-focused-test.log) remain preserved, with the failed-state screenshot classified diagnostic. The [corrected category/driver rerun](release-phone-maximum-focused-corrected-test.log) passes, bringing the final Release XCTest total to three passing cases. Horizontal movement/restoration again records X 16→−6.666667→16. No product source or acceptance tolerance changed between the failed fixture and its corrected rerun.

The final [Release pixel comparison](release-parity.json) finds **all 11 compared text regions pixel-identical to Debug**, including default J, focused maximum J before/after horizontal scrolling, and the retained initial India word/guide. Its strict envelope still passes only **8/11**: India word is +2.041989188 px and Juliett word is +2.042446952 px in both focused images. Thus the residual maximum-size word failure also reproduces in the installed Release candidate. Pixel parity proves matching output for these regions; it does not convert the failed strict gate into a pass.

## Screenshots and remaining work

[Screenshot index](../screenshots/ios/index.md) and [metadata](../screenshots/ios/metadata.json) record **36 final and 11 diagnostic originals**, with PNG hashes, candidate identities, targets/categories and actual frame data. The [independent per-image review](../shared/independent-screenshot-review.json) records direct inspection of all 36 final iOS originals. Diagnostic images are explicitly separate. Maximum quiz captures verify the visible tile/selected answer; lower feedback/action labels outside a captured viewport are not claimed as visually accepted from that image.

This run does not establish physical-device appearance, VoiceOver, human listening, release acceptance, iOS 27 runtime behavior or older-runtime compatibility. Human-only acceptance remains in M11.4 and the plan's manual queue; runtime compatibility and the DPR 3 word fringe remain engineering follow-ups. Android ordinary-text accessibility failures also keep the broader P05/R06/R07 gates open.
