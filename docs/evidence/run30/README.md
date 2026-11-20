# Run30 — Production Android Release tile qualification — 20 November 2026

P05.2-F2 now has inspector-free evidence for the **original complete tile
context matrix on the unchanged production Release APK**, plus scoped real
product resizing/state/reachability checks. P05.2 and P05–P10 remain active;
ordinary clean/default source integration is next P1. No whole R/F item,
phase, distribution or human acceptance closes. All 35 items remain 17
in-progress / 12 implemented-awaiting-M11 / 6 resolved; all seven M11 tasks
are unperformed.

## Delivered and verified

- Separate SDK-only [native observer](../../../tests/fixtures/android-font-scale/TileLayoutInstrumentation.java)
  traverses the active production view subtree and reads real Android
  `Layout.getLineBaseline`, transformed physical coordinates, text spans,
  resolved font sizes/weights, corner radius and native identities. No
  development inspector, synthetic onTextLayout event, root replacement or
  product source/permission/storage change is used for Release qualification.
- Exact non-debuggable product **5dfa45d22b562ddb03fffcbeb16b16bf0392197d69e92320437d5a1ab22ae129**
  is the preserved Run27 locally development-signed test copy. Native libraries,
  Maven Release Hermes, fonts and embedded production JS are unchanged.
  [Installed binding](android/matrix-identity.json), [payload/assertion hashes](android/assertion-and-payload-provenance.json).
- **15 groups / 505 actual native baselines** pass the original **1 physical
  pixel** geometry/baseline contract. All26 default/light reference tiles;
  NUWJ359 converter light/dark1× and dark2×; concealed/revealed quiz2×.
  Complete parts, canonical content, actual families/weights/style/resolved
  sizes, radius and single-line layouts are required. Maximum baseline delta
  **0.000172px**. [Native report](android/native-layout-checks.json), [command](android/layout-gate.json).
- **217 actual ink observations** pass the byte-identical Run27/07 checker
  and glyph metrics: original **2px** top/bottom envelope and **>8 RGB**
  background rule. Every original symbol/part/context has complete visible
  coverage. Maximum top/bottom deltas **1.369 / 1.282px**.
  [Ink report](android/extended-raster-measurements.json), [passing command](android/raster-gate-visible.json).
- **7 product window stages / 93 baselines** pass through720×1600,
  560×1000 and1600×720 display resizing, with the same Activity/native tiles.
  NUWJ359 survives; submitted quiz X / Question1of5 /0correct survives
  narrowing/restoration, feedback/Next is reachable and explicit Next advances
  once. A further **21 baselines** and complete reachable narrow tile capture
  pass. [Window gate](android/window-layout-checks.json), [actual state checks](android/checks.json),
  [narrow gate](android/narrow-layout-checks.json). These are display-resize
  observations, not every OS split-screen/multi-window or physical-device case.
- **11 scoped tests** and lint pass. Negative controls reject missing parts,
  missing lines, >1px drift, stale font size, wrong family, hidden ancestors,
  wrong environment/radius, exposed answers and invented provenance.
  [Final tests](shared/final-tests.log), [lint](shared/final-lint.log).

## Failed and corrected observation attempts

1. Initial observer runtime fails on Android's missing `Files.readString`.
   Supported `readAllBytes` replaces it. [Original command](android/checkpoint.json),
   [log/source](android/diagnostics/initial-observer/observer-session.log).
2. Two radius-reflection attempts fail on a private getter/field. Final code
   uses actual public `resolve/getType` APIs. Original commands/logs remain
   [here](android/checkpoint-api-corrected.json) and [here](android/checkpoint-radius-corrected.json),
   with source/session snapshots in diagnostics.
3. An added inner Text-height predicate fails40px versus nominal38.5px due
   separately rounded SP constraints. It was absent from the original
   contract. Remove that added predicate only; retain strict outer geometry,
   actual baseline and independent ink checks. [Red command](android/checkpoint-gate.json),
   [original added predicate](android/diagnostics/extra-inner-height-gate.cjs.snapshot).
4. Native traversal initially includes retained display:none navigation
   screens. That collection is deliberately interrupted and archived as
   diagnostic, not accepted. Skip non-visible/zero-sized ancestor subtrees;
   final active rows are unique. [Interrupted command](android/matrix-runtime.json),
   [raw diagnostic records](android/diagnostics/retained-hidden-tree/checks.json).
5. Native `getGlobalVisibleRect` initially overcounts8 tiles occluded by the
   fixed header. Original ink gate fails7 edges. Actual saved UIAutomator
   bounds clip them, exactly as the original collector requires. Preserve
   initial checks/report, then rebind the **same untouched PNGs** to complete
   UIAutomator rectangles. No threshold/pixel change; no missing-symbol
   recapture is needed. [Red command](android/raster-gate.json),
   [original report](android/diagnostics/native-only-visibility/extended-raster-measurements.json),
   [correction](android/visibility-correction.json), [correction source](android/correct-visibility.py).

An initial final verifier also failed on its own not-yet-written JSON report link; the corrected ordering retains every ordinary link/source/status assertion. [Failure and source](shared/verification-first-failure.md), [passing final verification command](shared/final-verification.json).

The 26-root/78-baseline first checkpoint passes separately; it is not added to
the619 final native observations (505 contexts +93 windows +21 narrow).
Earlier observer APKs were rebuilt in the test output directory; original
failure logs/source snapshots/command hashes remain, not every failed tool APK.

## Captures, preservation and limits

[30 actual inspected Android captures](screenshots/index.md): 1 initial native
checkpoint,16 original context/control captures,10 window/state captures,
2 narrow captures and1 restored Debug product. Inspection derivatives are
labelled and not counted as captures. Partial scroll positions/short landscape
viewport are explicit, not full-tile ink evidence. The extra narrow capture
shows the complete reachable November tile.

Initial exact Debug APK **1b045e2d…**, font1.0,720×1600/density280 and Gboard
are restored without data clear; ordinary product entry and fixture absence
are observed, loaded JS archived. Dark matches the last documented Run29
preference; **the pre-run theme was not independently captured**, so exact
initial theme restoration is unverified. Two ordinary quiz answers may append
normal aggregate progress. Owned external observer exports are collected and
removed, owned Metro/emulator stopped. [Restoration](android/restoration.json).

Web/iOS captures are inapplicable to this Android-only test tooling delta.
Product JS/native repair/font/dependency/worker inputs are unchanged; prior
Run27 Debug F1, Run28 ABI builds and Run29 fixture/composition/state evidence
retain their exact scopes. Broad shared/type/web/audit/iOS builds are not newly
run. Default Maven still has the historical P1 defect; non-ARM64 execution,
broader OS/window/physical/AT/provider/support, iOS/WebKit/P3/recognition,
distribution and final P10.5–.7/M11 obligations remain open.

During execution, an external commit moved HEAD80003ca to a6f51f9 and committed exactly the initial278 staged files. Every committed file matches the initial captured bytes. This execution did not commit/stage; the new batch remains unstaged. [Reconciliation](shared/head-reconciliation.json). Final source,
artifact, link/status and command reconciliation: [verification](verification.json).

## Reforecast and stop

[Forecast/checkpoints](shared/forecast.md), [exact next engineering](android/next-android.md),
[human-only handoff](manual-handoff.md). Stop at the qualified original Release
tile/window/state checkpoint, reserving remaining execution capacity for
inspection/restoration/status handoff before M–L default-source integration and
exact-artifact retesting. Free space falls from3.5GiB to a~303MiB low watermark during execution and recovers to~1.3GiB after owned emulator shutdown;
no source build, cache deletion, unrelated process intervention or new arbitrary
disk requirement. No owner input blocks the next local engineering forecast.
