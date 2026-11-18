# Run 06 — native text and window-header follow-up

17 November 2026. **P05.2/.8 remain partial.** The iPad window-header repair and Android configuration/state-retention improvement are delivered. Ordinary Android text still has stale live sizing and clipped quiz feedback; strict native raster failures and enumerated coverage remain open. No whole phase or release is accepted.

## Selection, forecast and reforecast

The resume comparison found all 179 maintained files in the Run 05 manifest unchanged. Existing uncommitted work is preserved over `784bb93c5cfb6edfd318d0dcec2d54d5bb222483`; no applicable `AGENTS.md` exists in the repository or ancestors. [Initial status](shared/initial-status.txt), [resume comparison](shared/resume-comparison.json), [final source identity](source-identity.json).

P05.2 native text/window-header repairs and dependency-ready P05.8 verification were the next unfinished priority. Forecast M–L: native lifecycle/cache invalidation, UIKit window regions and precise font measurements were the main risks. Android/iOS source work and independent review proceeded in parallel; native runtime work was serialized on the 8 GB host. P05.6/.7 and the pure P07.2 model retain prior verified status. Dependent P06/P07 UI was not started before P05's exit gate.

The batch expanded through failed Android configuration/layout candidates and the iOS maximum-text raster matrix. After actual runtime results, remaining capacity was reserved for final checks, direct image inspection and evidence reconciliation. A further exact-version framework reproduction/build cycle is a separate M–L task; no speculative framework patch is claimed. No fixed phase count or owner-input blocker dictated the stop.

## Delivered and verified

| Area | Result and evidence |
|---|---|
| iPad header | Header-local UIKit corner-adapted insets avoid window controls while preserving body width and tile geometry. Small/medium/rotated/restored windows, iPhone navigation, enlarged text and three automatic Menu/Back/Home cycles pass. [iOS report](ios/README.md). |
| Android configuration | Native display metrics and DeviceInfo refresh while the Activity handles live font-scale changes. Alphabet route, exact converter input and submitted quiz answer survive. Stock React Native startup remains; ineffective private-flag experiments were removed. [Android report](android/README.md). |
| Shared checks | **80/80 tests**, types/lint, Expo-free scan of 793 locked packages and production web build pass. A load-sensitive audio fixture failure is retained and repaired with controlled timers; production audio is unchanged. [Shared report](shared/README.md). |
| Production web | Scoped interaction/accessibility/audio-control regression passes. Eight tile states, 113 measurements and 12 same-renderer comparisons pass with no pixels beyond the existing comparison tolerance. [Web report](web/README.md). |
| Android tiles | Five live scale stages pass 120 raster observations. Nine native frame/event samples pass 495 baselines (maximum 0.500554 physical px) and geometry. These passes do not establish ordinary-text correctness. [Measurements](android/native-layout-checks.json). |
| iOS expanded coverage | Six final XCTest cases pass. Maximum-category all-26 alphabet, seven converter symbols, dark default long labels and default/maximum concealed/revealed quiz coverage assertions pass. The strict raster result is **234/238**, with four failed maximum-size J observations. [Raster summary](ios/raster-summary.json). |

Direct Android debug and unsigned iOS Release simulator builds pass. [Android APK/installed/font identity](android/artifact.json) and [actually loaded JavaScript](android/loaded-javascript.json) are separate; [iOS executable/bundle/ZIP identity](ios/artifact.json) identifies the installed simulator build. [Evidence integrity](document-verification.json) verifies files, links and status consistency, not application acceptance.

## Failures, diagnostics and missing coverage

- **P05.2 Android:** live 2× alphabet instruction remains at its 1× glyph size/39.43 dp frame, whereas cold 2× correctly measures 102.29 dp. The final enlarged quiz feedback is internally clipped above Next. Retained state, full alphabet instruction and passing tiles do not close these failures. Earlier diagnostic alphabet clipping and route recreation are archived separately.
- **P05.8 raster:** iOS J's lower edge is +2.080301818 physical px under the frame-inferred scale model, against the unchanged 2 px envelope. Four repeated observations fail; visual legibility and rounded scale estimates do not make them pass. Android's Run 05 digit-3 guide miss (2.012 px versus 2 px) remains unresolved and was not superseded by the alphabet transition pass.
- **P05.8 unrun:** actual Android multi-window resize, the remaining Android dark/enlarged converter/quiz comparison coverage, and independently exposed iOS native baseline events. iOS maximum all-letter/long-label coverage is now performed; it is no longer an unrun gap.
- **Retained diagnosis:** the first iPad restored automatic Menu activation missed; later three-cycle automatic retest passed without an app change. Its cause remains unproven. The initially proposed clean-root framework explanation was withdrawn after exact-source and upstream review; the Android measurement/cache cause remains unresolved. [Investigation and correction](android/upstream-investigation.md), [iOS diagnostic scope](ios/README.md).
- iOS 27, older-runtime header fallback execution, hosted CI, signed upgrades and physical/provider acceptance remain unrun. No dependency graph changed: Run 04 locked-install and Run 05 security audit evidence remain historical. The Metro/image-size high advisory is not fixed or owner-accepted.

## Captures, manual queue and next work

[77 actual inspected application captures](screenshots/index.md): **68 final-candidate captures** (12 web, 13 Android, 43 iOS), plus nine iOS diagnostic captures. Android discarded-candidate archives are linked separately and excluded from this final-platform index. Metadata records hashes, exact candidates, capture commands/settings and direct inspection. No supported target lacks changed-flow captures; future integrated P10 screens/captures remain unfinished. Screenshot and simulator results do not prove physical accessibility or audible correctness.

Human-only tasks remain in M11: physical VoiceOver/TalkBack and layout, audible content/provider/offline review, restricted signing/distribution and release acceptance. No new owner input blocks the current engineering. The ledger remains **7 open, 12 in progress, 12 implemented awaiting M11, 4 resolved, 0 blocked, 0 scope changes**.

Next: reproduce and repair ordinary Android text measurement/state-preserving invalidation, then close strict raster/coverage gaps in P05.8. Reforecast P06 or P07.2/.4 integration after P05 passes; P08–P10 retain their dependencies. Stop reason: the expanded native investigation and verification batch reached a reviewable partial boundary; remaining capacity was used for reliable evidence and handoff. [Execution record](../../DELIVERY_PLAN.md#run-06--17-november-2026), [current review](../../APP_REVIEW.md#current-delivery-status).
