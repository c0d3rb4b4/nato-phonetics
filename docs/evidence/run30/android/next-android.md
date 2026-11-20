# Next P1 — ordinary default Android integration

Run30 qualifies the original complete production Release tile context matrix
on unchanged APK5dfa45d2:505 baselines/217 ink observations. Scoped product
resize/state checks add93 baselines, and complete narrow reach adds21.
Reuse Run27 Debug F1/native/composition, Run28 configured ABI builds and Run29
strict exact-payload Release fixture/sweep/edit/resize/narrow scopes while
their inputs stay unchanged. Do not repeat source ABI or raster qualification
as the first action.

## Smallest next checkpoint — E, M–L/high build uncertainty

Integrate the already-tested RN0.81.5 Android source repairs into an **ordinary
clean install/default build**, with pinned version/all-input/all-output hash
guards and Maven Hermes. Relevant files: `package.json` postinstall,
`scripts/prepare-android-source.cjs`, both Android source patch manifests,
`android/settings.gradle`, native/host build scripts and CI. Keep manual signing
separate. Do not hide a Maven fallback, silently ignore drift, change renderer,
upgrade React Native, remount state, cap text scaling or relax assertions.

First prove clean default preparation, complete source/hash validation before
writes, idempotence and wrong-version/drift rejection. Then prove actual Gradle
default dependency selection (without the opt-in flag) and inspect the exact
resulting engine/native/font/JS/ABI payload. Reforecast measured compile/disk
cost at that checkpoint. A configuration-only pass is not runtime acceptance.

Build/install the exact default artifact, then rerun affected native regressions,
strict Release fixture/widget/sweep/edit/resize/narrow gates, real-product
composition/state/context/ink/window checks and inspect actual captures. A
different payload cannot inherit Run30 runtime acceptance merely because source
looks the same. Reconcile iOS/shared source impact before using clean-install
preparation across targets. Preserve old products/evidence and user changes. External commita6f51f9 preserves exactly the initial278 staged Run29 files; this new batch remains unstaged.

Host free space reached~303MiB during emulator work and recovered to~1.3GiB after shutdown, versus3.5GiB initially. [Final measurement](../shared/resources-final.json). The
existing SDK/JDK/Node/APKs remain. Recheck actual resources; serialize heavy work
and forecast any generated-cache reclamation with records. Do not delete
products, evidence, source or user state or impose an invented minimum. A
suitable authorized remote host can enable P10.8, but no registered host/access
is assumed and no new owner cleanup action is required merely to inspect or
prepare the next engineering slice.

Default Maven historical failure remains open; additional-ABI runtime and
broader OS/split-window/AT/physical/provider/support and integrated release
acceptance remain separate unfinished obligations. Every M11 result is
unperformed. No unrelated P2 switch, tolerance change or release exception.

Reusable current-candidate observer reproduction (pinned environment in
NATIVE_BUILDS.md; driver is candidate/path-specific):

```sh
python3 scripts/build-android-font-instrumentation.py artifacts/run30/instrumentation
python3 docs/evidence/run30/android/observe-product.py --matrix
node scripts/check-android-release-tiles.cjs docs/evidence/run30/android
node docs/evidence/run30/android/check-extended-raster.cjs
python3 docs/evidence/run30/android/observe-product.py --windows
node scripts/check-android-release-tiles.cjs docs/evidence/run30/android --windows
```

Original PNGs/command records must not be overwritten during a new execution;
use a new evidence destination/adapt the candidate-specific driver. Native
Layout observation never substitutes synthetic JS hook measurements. Only
complete actual UIAutomator tile rectangles qualify ink observations. Restore
the intended APK/settings/entry, collect/remove owned exports and stop owned
tools after captures.
