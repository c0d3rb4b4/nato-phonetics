# Run 05 — portrait tiles and session model

17 November 2026. Uncommitted candidate over `784bb93c5cfb6edfd318d0dcec2d54d5bb222483`; existing user/earlier-run changes are preserved. [Source identity](source-identity.json), [maintained file hashes](source-sha256.txt), [document/evidence audit](document-verification.json), [artifact hash verification](artifact-verification.json). These identify this working tree, not a new commit or release. The final audit verifies evidence identity, links and status consistency; its pass does not override the explicitly failed or unrun application checks below.

## Delivered and remaining

The app now shares one 110×150/11:15 tile composition across alphabet, converter and quiz, with three identical pinned static fonts, explicit text bounds/baselines, preserved answer concealment and proportional accessibility enlargement. Grids reflow and oversized tiles scroll. Native orientation is enabled. Browser baseline rounding, Android nonlinear SP scaling, small-guide contrast and pressed-opacity contrast were found during verification and repaired. [Specification](../../TILE_DESIGN.md), [reference fixture](../../fixtures/tile-reference.html).

**P05.6/.7 are delivered; P05.2/.8 and P05 remain active.** The Android inverse cache was corrected after durable failed-stage probes showed that a repeated reported scale could correspond to different native conversion metrics. The repaired 1×→2×→1×→2×→1× sequence passes 120 glyph observations and 390 event/frame baselines. Initial failed captures and a corrected early probe interpretation remain documented. Ordinary header/instruction text still clips or retains enlarged sizing during those changes; this separate P05.2 defect is not repaired by the tile adapter. Actual iPad window resizing preserves tile geometry/reflow/restoration but the OS controls overlap Home. [Android diagnosis](android/live-font-scale-diagnosis.md), [iPad resize report](ios/window-resize-report.md).

P05.8 retains the raw converter digit-3 guide raster failure (−2.012 physical px against the unchanged 2 px limit): actual baseline/font-size rounding and faint antialias pixels explain it, but no threshold was widened or pass invented. It also retains actual Android multi-window coverage, relevant native dark/enlarged converter/quiz visual cases, iOS maximum-category long N/U/all-26 raster and independently exposed iOS event-baseline checks. Recorded default/all-letter font-outline raster and browser evidence do not stand in for those cases. This is exact scope reporting, not a newly required full Cartesian test matrix. All gaps are engineering work, separate from M11.

An independent P07.2 follow-on delivers a pure immutable session engine and nine deterministic tests for coverage, guarded transitions, scoring, cancellation/restart and unique-mistake retry. [API and test evidence](shared/QUIZ_SESSION.md). It is not consumed by the quiz screen, so selectable sessions/results and audio lifecycle integration remain unfinished. No screenshot applies to that unused pure module.

## Verification

| Area | Evidence and limits |
|---|---|
| Shared | [80 tests, types, lint, Expo-free dependency scan, production build, font reproduction and security review](shared/README.md). No dependency changes; no fresh installation claimed this run. |
| Production web | [19 states / 314 tile measurements, final interaction checks and 15 same-renderer image comparisons](web/README.md). Actual fonts, all letters/digits, contrast, 200%/300% text, densities, themes, resize and blocked-font error. Earlier broad route/preference checks are labelled with their exact source qualification. |
| Installed Android | [Build, runtime, metrics and reproduction](android/README.md); [APK plus actual loaded JavaScript identity](android/artifact.json). Debug APK uses Metro; its APK hash alone does not identify app JavaScript. |
| Installed iOS | [Build, runtime, metrics and reproduction](ios/README.md); [unsigned simulator app/ZIP identity](ios/artifact.json); [actual app-window resize](ios/window-resize-report.md). No signed device IPA is claimed. |
| Images | [83 final actual captures: 32 web / 18 Android / 33 iOS](screenshots/index.md), with metadata, capture commands, inspection and observed gaps. Pre-fix images are diagnostics, excluded from final counts. |

The tile specification permits at most one physical pixel of edge/baseline rounding and an additional one-pixel raster antialias fringe. The original browser gate incorrectly used a CSS pixel; its strict replay failed and the code was corrected without widening the contract. Native font ink checks distinguish antialias support from thresholded solid pixels. A build success or style declaration alone is not font/rendering verification.

## Failures retained and follow-up

- Original browser baseline failures: [strict diagnostic](web/baseline-tolerance-diagnostic.json), [pre-fix captures](diagnostics/web-pre-baseline-fix/). Final browser maximum error is 0.000954 physical pixel.
- Initial guide contrast and opacity failures: [computed review](shared/contrast-review.json), [pre-contrast web captures](diagnostics/web-pre-contrast-fix/). Final all-symbol guide minimum is 5.745:1 and held-pointer geometry/colors pass.
- Native font-size, capture-coverage and host-resource diagnostics are retained in each platform report. Android/iOS runtime work is serialized on the 8 GB host; broad tests are not repeatedly rerun without a changed source or failed gate.
- Actual smaller iPad window: [Home overlap capture](screenshots/ios/ipad-window-small.png). Reopen P05.2; integrate native adaptive window margins, then verify Home/Menu and Menu's body Back control, restore/full-screen behavior and affected tile positions. Do not guess a fixed padding from one image.

## Handoff

All human acceptance remains in the plan's M11 queue. Physical VoiceOver/TalkBack, audible content/provider/offline checks, signed upgrades, distribution and release acceptance were not performed. Hosted CI and an iOS 27 runtime are unverified. The raw audit remains 0 critical / 1 high / 7 moderate / 0 low; its disposition gate passes but the high Metro/image-size advisory is neither fixed nor owner-accepted. P10.7 remains open for the complete integrated candidate and future feature screens.

Next: repair P05.2 ordinary native text/configuration and iPad window-header behavior, then finish P05.8’s exact coverage gaps before tile-based feature UI; then connect the delivered P07.2 model to sessions/results or complete independent P06. The selected M–L tile batch grew through measured baseline, scaling and contrast repairs plus repeated native captures; the pure session model was a bounded independent follow-on. Stop at this partial but reviewable implementation boundary to preserve remaining verification/evidence capacity. No phase count, scope reduction, owner approval, publication or release acceptance is inferred. [Execution record](../../DELIVERY_PLAN.md#run-05--17-november-2026).
