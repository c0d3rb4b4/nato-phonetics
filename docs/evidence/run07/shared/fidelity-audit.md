# Run 07 independent fidelity audit

17 November 2026. Initial read-only assessment of retained Run 05/06 evidence, followed by the event-driven repair below after new native observations corroborated its cause. **This report alone is not a new application or screenshot pass.** No acceptance tolerance, original screenshot, historical result or design metric was changed.

## Findings

- The iOS maximum-size J misses are real failures of the recorded nominal-edge gate: four observations at +2.080301818 physical pixels against the unchanged 2-pixel envelope. Using the RN source-mapped scale 3.571 instead of rounded frame width / 110 increases the error to +2.2224004 pixels. Scale inference alone cannot close the failure. See [retained sensitivity calculation](../../run06/ios/raster-scale-sensitivity.json).
- The maximum iOS main-letter observations show a shared downward shift, not a J-only anomaly. Across the 26 alphabet letters, top-edge deltas are approximately +0.3323 to +1.0172 pixels; bottom-edge deltas +1.1511 to +2.0803 pixels. Word and guide offsets differ. A per-J correction is unjustified. Raw native baselines and outer-box origins are needed before assigning the cause.
- The Android `TREE` guide has a measured baseline error of −0.250013 pixels. Its outer text box is 110.857178 logical units below the tile origin, versus the specified 111. The hook currently corrects the line baseline relative to its outer box but does not account for that box-origin difference. The measured origin discrepancy explains this baseline error without changing font metrics. See [original frames/events](../../run05/android/converter-light-native-layout.json) and [original fringe analysis](../../run05/android/digit3-fringe-analysis.json).
- Android font-size quantization is a separate observation: the nominal 19.25 physical-pixel guide size is converted to an integer 20 by the inspected RN implementation. The original first ink row is faint (alpha approximately 0.067–0.082). These facts do not convert the nominal −2.012-pixel raster miss into a pass.

The source anchor `useTileBaseline(key, (metric.baseline - metric.y) * scale)` in [NatoTile.js](../../../../src/components/NatoTile.js) assumes the outer box begins exactly at `metric.y * scale`. Native Yoga layout can round that origin. On iOS maximum scale, the nominal main-letter box origin alone is `4 × 3.571 × 2 = 28.568` physical pixels; the actual rounded origin must be read rather than assumed. This is a **candidate explanation**, not an observed iOS diagnosis.

## Minimal repair proposal, pending native observations

Keep `TILE_DESIGN`, font sizes, line heights, root/header/body geometry, raster threshold and tolerance unchanged. Correct the inner run toward the existing whole-tile baseline target using the actual outer-box origin:

```text
target baseline within outer box = specified baseline × scale − actual outer box Y relative to tile
inner translation = target baseline within outer box − measured native line baseline
```

The smallest event-driven implementation can read native `onLayout` Y for the header/body parent and the outer text box, then sum these parent-relative values. Native events originate from `LayoutMetrics` (`ShadowTree.cpp` / `BaseViewEventEmitter.cpp`); actual runtime events must confirm they agree with inspected frames. This avoids asynchronous root/child `measureLayout` races. The fallback before the first layout event is the existing nominal target. Store parent/box observations with their geometry key, reject old-key events, and retain the line-baseline measurement independently when only the target changes. Translation affects only the inner Text and cannot change the measured outer layout, so it should not create a layout feedback loop. Use this behavior only for native targets; the existing browser baseline marker remains unchanged.

If runtime layout events do not expose the required snapped coordinates, use actual root-relative `measureLayout` instead, with callback generation checks and measurements triggered only by outer layout/key changes. Do not derive rounded origin from a global pixel-density formula: React Native rounds absolute layout positions, so local rounding can disagree when ancestors have fractional positions.

Meaningful verification includes native event/frame baseline assertions against the original 1-pixel limit, strict screenshot-ink checks against the original 2-pixel envelope, all three text metrics, multiple rows, default and enlarged text, repeated live scale changes, and both concealed/revealed quiz contexts. Explicitly assert that a geometry-key change cannot apply a stale origin/line measurement and that a target-only change updates translation. Existing shared/web geometry checks must remain unchanged. No amount of arithmetic prediction replaces the new installed-native checks.

## Remaining evidence requirements

P05.8 still needs the Android digit-3 gate, actual Android multi-window resizing, Android dark/enlarged converter and quiz context comparisons, and independent iOS baseline events plus remeasurement of maximum-size J. Previously passed all-letter/default viewport evidence should remain historical and need only be rerun where a new shared/native change affects it. iOS 27 and older-runtime fallback execution are distinct compatibility follow-ups. Physical appearance and assistive-technology acceptance remain M11.4.

## Reproducible retained-data assertions

From the app root, this read-only command checks the central Android observation:

```sh
python3 - <<'PY'
import json, math
capture = json.load(open('docs/evidence/run05/android/converter-light-native-layout.json'))
rows = {row['id']: row for row in capture['values']}
tile = rows['converter-4']; box = rows['converter-4-pronunciation']; run = rows['converter-4-pronunciation-run']
density = capture['dimensions']['scale']
origin_error = (box['frame']['pageY'] - tile['frame']['pageY'] - 111) * density
baseline_error = (run['frame']['pageY'] + run['nativeLineMeasurement']['baseline'] - tile['frame']['pageY'] - 122.619) * density
assert math.isclose(origin_error, -0.25, abs_tol=0.001)
assert math.isclose(baseline_error, origin_error, abs_tol=0.001)
print({'outer_box_error_px': origin_error, 'baseline_error_px': baseline_error})
PY
```

This assertion verifies the retained measurements, not the proposed repair.

## Run 07 native observation checkpoint

The first actual iOS Debug [default alphabet capture](../ios/diagnostics/pre-origin/default-alphabet-first-dark-native-layout.json) exposes 78 text boxes (26 letters × 3 parts). An independent assertion checks that header/body `frame.y` plus outer text-box `frame.y` equals the box's measured `pageY` minus the tile's measured `pageY`, within 0.001 logical units, for all 78. J's default line baseline is 36.844 with zero translation and outer-box Y 4, so default placement needs no correction. The native `measure()` implementation returns local `LayoutMetrics.frame.origin` for x/y; the native `onLayout` emitter uses the same layout frame. This supports using parent/box layout events for the correction, but maximum-size events and final screenshots still determine the repair outcome.

The [actual maximum-size capture](../ios/diagnostics/pre-origin/maximum-alphabet-J-dark-native-layout.json) reports font scale 3.571 and density 2. All 78 parent-plus-box origins again equal actual page-frame differences within 0.001 logical units. J's box origin is 14.5 versus nominal 14.284; its actual baseline error is +0.4320073 physical pixels. Word and guide errors are +0.2140032 and +0.2380023 pixels. The same observations reproduce the initial strict raster failure, so the uncorrected native samples and loaded JavaScript are frozen under `ios/diagnostics/pre-origin`.

## Implemented correction, verification still separate

[NatoTile.js](../../../../src/components/NatoTile.js) now observes header/body origins and each outer text-box origin through the native [useTileOrigin hook](../../../../src/hooks/useTileBaseline.js). The baseline target subtracts those actual origins from the unchanged whole-tile baseline. Geometry keys contain scale/box position, independently from text/font event keys: Next Question can replace a symbol without losing a valid box origin when native layout does not rerun. The existing line measurement fields `key` and `baseline` remain available to the native inspector. Separate memoized generation tokens deactivate old/unmounted callbacks, including a repeated 1→2→1 scale sequence. Only the inner Text translation changes, so it cannot feed back into the outer-box measurement.

The [web hook](../../../../src/hooks/useTileBaseline.web.js) returns nominal origins with no native layout listener; its existing inline baseline marker remains unchanged. No font, design token, line height, geometry, threshold or tolerance was adjusted. Active-code typecheck and targeted ESLint pass after the implementation. The [four root-owned hook regressions](tile-baseline-tests.log) execute the actual hooks with controlled state/effects and pass: observed J/TREE offsets, text replacement with retained geometry/target-only updates, stale 1→2→1 callbacks, and unmount. The shared suite passes 84/84 at this checkpoint. Fresh native/web rendering checks still determine final acceptance; neither the retained numeric fixture nor a predicted subpixel shift is a passing screenshot.

The independent follow-up review found no additional concrete lifecycle blocker in the delivered hook. Same-generation layout updates intentionally handle row reflow, window changes and density changes; native `BaseViewEventEmitter::onLayout` coalesces the latest frame and preserves event order. The ownership tests reject retained old callbacks; they do not prove that arbitrary framework payloads or renderer caches are fresh. Actual frame/event and screenshot checks remain separate requirements.

## Independent screenshot checkpoint

[Thirty-three original Android images](independent-screenshot-review.json) were directly inspected after the shared correction. Fully visible tiles remain legible, and converter input/quiz answers survive live scale changes. The four default-light alphabet pages cover all 26 letters and the centered Y/Z final row. Default dark and seven enlarged dark converter pages cover the full `NUWJ359` sample, including complete November/Uniform and `TREE` guides. Edge fragments in scrolled captures are normal viewport boundaries.

Ordinary header/instruction/options remain at their earlier size during live 2× changes. In the subsequently opened enlarged dark quiz, the header title, second heading line, instruction, Next and Replay labels visibly clip internally; merely finding the controls does not prove readable controls. The earlier enlarged feedback capture also clips. These remain **P05.2 failures** and prevent whole-flow accessibility acceptance.

## Android numeric retest

The new [extended raster gate](../android/extended-raster.log) passes **226 observations** at the unchanged 2-pixel envelope, with maximum absolute top/bottom deltas 1.369 / 1.282 pixels. Independent inspection of the underlying result verifies all 26 default alphabet letters and every symbol/part for `NUWJ359` in light, default-dark and enlarged-dark converter contexts. Concealed/revealed enlarged dark quiz parts are present. The previous digit-3 guide miss now measures −1.012 pixels at default scale and −1.024 at 2×, a passing **actual screenshot result**, not the earlier arithmetic prediction. The separate [repeated live-transition gate](../android/raster-transition.log) passes another 120 observations.

This clears the historical Android `TREE` nominal-edge failure for the new recorded candidate and covers the missing dark/enlarged tile contexts. Ordinary-text failures remain open. Native event/frame baseline checks independently establish their own numeric alignment and do not replace these raster checks.

## Actual Android window review

Five inspected app screenshots show fullscreen, a 720×791 upper split pane, a 720×1128 enlarged split pane and restoration to 720×1600. The [retained state checks](../android/checks.json) report the current React Native dimensions/native configuration and preserved `NUWJ359`. Fully visible tiles keep their composition, and ordinary viewport clipping is distinguishable from the separate enlarged-text defect. The half-pane tile capture includes an on-screen keyboard over the companion Settings pane; its presence is recorded rather than claiming a clean keyboard-free state. The first failed UIAutomator assertion sampled the focused Settings window instead of the app; subsequent focused-app evidence and source-identical recovery are distinct from that retained fixture failure.

The actual window evidence fills that prior coverage gap. P05.8 as a whole remains partial while required R06/R07 rechecks fail on ordinary Android text and final iOS acceptance is still being evaluated; a successful tile matrix does not make the entire phase complete.

## iOS retest checkpoint

Five final Debug default iPad originals were individually inspected and added to the independent screenshot record. All 26 alphabet tiles, all seven converter tiles and the concealed/revealed X quiz are complete and readable; feedback, Next and Replay labels are also fully visible.

The fresh [maximum J native sample](../ios/final-maximum-alphabet-J-dark-native-layout.json) independently observes scale 3.571, box origin 14.5 and translation −0.216003654 logical units. Its nominal baseline delta is approximately −0.00000000424 physical pixels, versus the original +0.4320073. This verifies the native event/frame anchor correction; strict raster acceptance still requires the separately captured PNG ink rather than inference from this arithmetic.

All **28 final iPad originals** have now been directly inspected and recorded with hashes in [the independent image review](independent-screenshot-review.json). Maximum-size pages show all 26 alphabet letters, all seven converter symbols and concealed/revealed quiz U followed by a new concealed Z. The target rows have readable symbols, words and guides, with normal vertical viewport fragments in neighboring rows. The maximum feedback image proves the revealed tile and selected answer; the lower feedback/action labels are outside that image and must not be claimed as visually accepted from it.

The frozen [iPad raster preview](../ios/raster-summary-ipad-preview.json) records **406/406 passing observations**, maximum absolute delta **1.978144 physical pixels** under the unchanged 2-pixel envelope. It deliberately remains an incomplete overall gate because the focused DPR 3 phone captures were not yet present. The new iPad J pixels pass; the former nominal-edge J failure is repaired in these recorded DPR 2 contexts.

The first two final DPR 3 phone originals were also inspected. Default J/K/L and nearby rows are complete and readable. At maximum text size, India word/guide are readable while J appears only as a symbol below; its full letter box and word/guide are not all inside this screenshot. Both large tiles extend beyond the phone content viewport at the right edge. The [actual native sample](../ios/final-phone-maximum-alphabet-J-dark-native-layout.json) confirms a 392.666656-logical-unit tile starting at page X 16 on a 402-unit display. Native `TileGrid` provides a horizontal `ScrollView` for this supported overflow; the static capture alone does not prove horizontal gesture reachability and the visible edge crop alone is not a defect.

The current combined raster result preserves a new **India word lower-edge miss of +2.041928153 physical pixels**, despite a native baseline error of approximately −0.00000000218 pixels. This is an actual pixel failure, not a missing-baseline measurement; the unchanged 2-pixel envelope must remain enforced. Maximum DPR 3 J coverage is also still missing at this checkpoint. A corrected native baseline alone therefore cannot close P05.8 or establish every renderer's ink fidelity. Additional phone capture/Release evidence is still being produced; this paragraph records the observed checkpoint rather than a final overall gate.

Two Release phone originals were subsequently inspected as visual spot checks. The default J/K/L and nearby rows are readable; the maximum image contains readable India word/guide and J symbol, with the remaining J text below the viewport. These screenshots establish installed Release appearance only in their visible scope. They contain no independent Hermes baseline-event payload and do not replace the Debug native measurements or a complete DPR 3 J ink gate.

## Bounded diagnosis of the DPR 3 India miss

The [retained read-only analysis](ios-dpr3-fringe-analysis.json) compares the **raw line baseline before the corrective transform** in default and maximum captures. The native values agree exactly between the maximum iPad and phone:

| Text metric | Default line baseline | Maximum native line baseline | Default × observed 3.571 | Residual logical units |
| --- | ---: | ---: | ---: | ---: |
| Letter | 36.844 | 131.56992765426634 | 131.569924 | +0.00000365427 |
| Word | 16.264 | 58.07874561309815 | 58.078744 | +0.00000161310 |
| Guide | 11.619 | 41.49145015239716 | 41.491449 | +0.00000115240 |

All three ratios equal **3.571000099182129**, the float32 representation of the reported scale 3.571. The residual word-scale effect is below 0.000005 physical pixels per em at DPR 3, far below the observed edge discrepancy. This supports proportional native font/line scaling and does not support a material font-size mismatch. The retained hook payload is a baseline sum, however, not a direct observation of `UIFont.pointSize`; it cannot by itself prove the renderer's complete attributed-font state.

The installed Fabric source uses `RCTEffectiveFontSizeMultiplierFromTextAttributes` in `RCTAttributedTextUtils.mm` (lines 97–112), sets font properties at lines 118–136, and sets line height with the same multiplier at lines 224–227. `RCTFontUtils.mm` line 308 multiplies size by its multiplier; custom-font branches at lines 330 and 344 call `UIFont fontWithName:size:` with that effective size and no integer rounding. The legacy `React/Views/RCTFont.mm` round at line 411 is a different path and must not be used to diagnose this Fabric result. `RCTTextLayoutManager.mm` lines 200–215 obtains the actual attributed font and native glyph baseline for line events. Exact installed-source hashes are retained with the analysis.

The final qualifying India row is **1466**, containing 19 pixels with maximum RGB-channel differences from the uniform tile background of **9–21**; row 1465 has 90 qualifying pixels with differences up to 136, and rows 1467–1468 have none. This identifies the failing edge as a faint but real fringe under the unchanged `>8` ink rule. It does **not** establish whether the extra fringe comes from glyph hinting, raster antialiasing, subpixel layer compositing or another renderer detail. No threshold increase, baseline bias, size override or per-glyph correction is justified by these observations.

The next discriminating diagnostic is to capture the actual attributed `UIFont` name/point size, cap/x-height and baseline-offset attribute for India, plus its glyph path bounds, then compare screenshot ink at two controlled fractional baseline phases while leaving production metrics unchanged. That distinguishes an attributed-font/path mismatch from pixel-grid/compositing behavior. The original failed image must remain in the gate even if a later scroll position happens to pass; a favorable phase cannot erase the recorded miss.

The two subsequent focused Debug phone originals independently show all J text and a successful horizontal gesture. The paired [before](../ios/final-phone-maximum-focused-alphabet-J-dark-native-layout.json) / [after](../ios/final-phone-maximum-focused-horizontal-alphabet-J-dark-native-layout.json) native frames move the J tile from page X 16 to −6.666667 with unchanged Y and size; the after image exposes its previously hidden right corners. This verifies the intended reachable horizontal overflow. It does not erase the original India pixel failure or change the strict envelope.

The expanded [Debug strict result](../ios/raster-summary.json) now has **complete required coverage, with 453/456 observations passing**. The three failures are the original India word (+2.041928153 pixels) and the Juliett word in both focused phone images (+2.042446952 pixels each). The main J letter passes. All three failures have the same nearly exact measured baseline and involve the maximum-size DPR 3 SemiBold word, so the remaining observation is broader than an India-specific glyph problem. The [native layout log](../ios/native-layout-checks.log) independently passes 1,773 baseline checks; passing baseline geometry and failing ink support are both retained outcomes. The next controlled-phase experiment should also inspect the fractional text transform and its layer raster/compositing phase; that remains a possible cause, not a diagnosed one.

Final Release focused originals were also directly inspected, completing independent review of **all 36 final iOS screenshots** and all 33 final Android screenshots. Full J text remains readable before/after horizontal scrolling. The [Release comparison](../ios/release-parity.json) proves all 11 matched text regions are pixel-identical to Debug, while only **8/11** satisfy the unchanged strict envelope. India remains +2.041989188 pixels; the two Juliett observations remain +2.042446952. This reproduces the remaining SemiBold-word failure in the installed Release candidate. The [iOS report](../ios/README.md) preserves the separate invalid-category fixture failure and its successful corrected rerun, candidate identities and unrun acceptance scopes. No further source change was made during this independent review.
