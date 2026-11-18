# Run 07 Android verification

17 November 2026. The shared tile baseline correction passes the scoped native regression: **495 measured baselines** and **120 repeated-scale raster observations**. **P05.2 remains failed:** ordinary text keeps stale live sizing and enlarged quiz feedback clips. Two isolated text-layout experiments were falsified; no workaround from them was integrated.

## Installed candidate

[Artifact identity](artifact.json) verifies the already-installed Run 06 debug APK SHA-256 `0ecf22d08d00d964d61d77cfc8c14607607627020733c5397e839e70db9cadda` against its packaged file and confirms all three bundled font hashes. The native Android sources are unchanged, so this JS-only batch reused that native build; it does not claim a new Gradle build. The app remains version 1.0.0/code 1, package `com.natophonetics.app`, on Android 16/API 36 AVD `nato-p00-api36`, emulator-5580, 720×1600 at 280 dpi (1.75 density).

The actual [loaded Run 07 Metro JavaScript](loaded-javascript.json) was archived through Hermes `Debugger.getScriptSource`: one 5,155,403-byte source, SHA-256 `5e7ffef7192bb7c21b5d258ed39a6d49ebce321a60bdb891e81858867955e3bb`. APK plus loaded JS identify this debug candidate. The artifact manifest also records `NatoTile.js`/`useTileBaseline.js` hashes and the unchanged standard RN font-layout feature flag. [Artifact check log](artifact-verification.log), [JS capture log](loaded-javascript.log).

## Repeated-scale and state checks

Commands ran with Node 22.23.0 and the existing installed native toolchain:

| Command | Actual outcome |
|---|---|
| `python3 docs/evidence/run07/android/ordinary-text-probe.py` | Passed its state/frame assertions through live 1→2→1→2→1. No navigation/remount commands between alphabet stages; converter `NUWJ359` survives live 2× and restored 1×. [Log](ordinary-final.log), [checkpoints](checks.json). Ordinary text remains visibly the old size at 2×; these assertions do not certify its accessibility behavior. |
| `node docs/evidence/run07/android/check-transition-raster.cjs` | Passed all **120** actual visible glyph observations, unchanged 2 px ink/antialias envelope. Maximum absolute top/bottom deviation 1.369/1.2435 physical px. [Log](raster-transition.log), [measurements](scale-transition-raster-measurements.json). |
| `python3 docs/evidence/run07/android/state-retention.py` | Passed submitted quiz letter/options/selection/disabled-state retention at 2× and 1×. Next remains reachable; enlarged ordinary feedback still clips. Default alphabet/converter tile frames captured. [Log](state-final.log), [initial state](quiz-state-before.json). |
| `node docs/evidence/run07/android/verify-layout.cjs` | Initial scoped set passed **9 layout groups / 495 actual native line-event and transformed-frame baselines**; maximum error **0.000605969 physical px**, against the unchanged 1 px tolerance. Includes all 26 alphabet event samples and default converter/revealed-quiz samples; this is not a new all-26 raster matrix. [Report](native-layout-checks.json), [log](native-layout-checks.log). Later extended captures may expand this report. |

The baseline correction uses the actual rounded parent and text-box origins. It leaves declared portrait geometry, typography and raster tolerances unchanged. Repeated scale returns now also exercise the generation guards, with valid native event measurements at all five stages.

The initial scoped runtime produced **12 actual app screenshots**, all directly inspected and recorded in [metadata](../screenshots/android/metadata.json). Representative captures: [live 2× alphabet](../screenshots/android/ordinary-transition-1-scale2.png), [retained populated converter](../screenshots/android/converter-retained-scale2.png), [clipped live 2× quiz feedback](../screenshots/android/quiz-feedback-controls-scale2.png), [restored 1× quiz](../screenshots/android/quiz-retained-scale1.png). Scrolling boundaries may cut off the next tile; the quiz feedback failure is internal clipping above the visible Next button. Additional root-owned context coverage is separate from these initial counts.

## Unrepaired ordinary text and next work

[Diagnostic report](diagnostics/README.md) contains two executable minimal native controls with cold references, raw events, measured frames and **15 directly inspected diagnostic PNGs**. A dynamic nonbinding font ceiling changes glyph sizing but fails to update measured frames; an added nonbinding Yoga minimum-height variation also fails. These images are deliberately separate from final application captures. One interrupted overlapping harness attempt is retained and excluded from acceptance. No app adapter, private feature flag, remount, disabled text scaling or layout mutation from those probes is shipped.

P05.2 needs a reproducible native framework repair or compatible dependency change. The remaining cause is not established by source inspection or these failed variations. A real C++ backport requires building ReactAndroid from source, additional disk headroom, artifact identity and this cold/live failure gate; editing node_modules C++ while consuming a prebuilt artifact is insufficient. The [next investigation](next-investigation.md) identifies exact 0.81.5 boundaries, the smallest executable regression, reproducible build requirements and the L/high-uncertainty forecast. No owner input blocks this engineering work.

The initial scoped pass does not establish the historical digit-3 converter raster gate or full dark/enlarged contexts; those belong to the subsequent Run 07 context pass. The subsequent [actual split-screen pass](window-report.md) now verifies half-height, divider-enlarged and restored fullscreen converter states, input retention and 63 window baselines, with five inspected images. Physical TalkBack, listening, provider/offline, signing and release acceptance remain in M11. No release acceptance is claimed.


## Root extended context verification

After the platform handoff, `python3 docs/evidence/run07/android/extended-contexts.py` [passed its capture/reachability assertions](extended-contexts.log) against the same installed APK and loaded source. The actual default light alphabet covers all 26 symbols. Light/default-dark/enlarged-dark `NUWJ359` converter captures cover all seven symbols, and enlarged dark quiz captures cover concealed/revealed tiles and reachable controls.

`node docs/evidence/run07/android/check-extended-raster.cjs` [passes 226 observations](extended-raster.log) with the original 2-pixel envelope and ink-support threshold. Maximum top/bottom error is 1.369/1.282 physical pixels. The formerly failing `TREE` guide now has a −1.012 px top edge at default size (light and dark) and −1.024 px at 2×, within the unchanged gate. [Measured observations](extended-raster-measurements.json). The extended native-layout check passes 24 groups / 1,000 baselines, maximum 0.000606 physical px; later window coverage may add groups to the same [report](native-layout-checks.json).

**These tile passes do not establish readable ordinary controls.** Direct inspection of the new dark 2× quiz shows internal clipping of the header, prompt/instruction and Next/Replay labels. [Question failure](../screenshots/android/final-quiz-question-dark-scale2.png), [control-label failure](../screenshots/android/final-quiz-controls-dark-scale2.png). The capture driver's `Next` presence assertion proves reachability only. P05.2 remains failed, broader than the previously captured feedback line. No successful tile result or accessible control name overrides the visible clipping.
