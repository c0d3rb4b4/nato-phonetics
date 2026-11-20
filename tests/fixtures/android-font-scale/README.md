# Android live-font regression

Normal AppRegistry startup, derived from the retained Run20 fixture. This is
separate from the product entry and never replaces a live root. The strict
gate retains the original one-physical-pixel criterion and mount/value checks;
native widget content height, nested text, repeated fractional returns and
edited-input/caret/focus checks extend it. Outer frames alone cannot establish
glyph scaling. The full invocation makes60 frame/widget comparisons and3
committed-edit state checks.

Start Metro with this directory's `metro.config.cjs`, install the intended APK
without clearing app data, reverse8081, then run from the app root:

```sh
ANDROID_SERIAL=emulator-5580 npm run check:android:font-scale -- artifacts/font-scale --sweep --editing
```

The installed APK must equal the local Debug output, or the explicit
`NATO_EXPECTED_APK_SHA256`. Reports and actual screenshots are retained even on
failure. The driver restores the previous system font scale and stops its
fixture process. Stop this Metro afterward, start ordinary `npm start`, and
restart the product before product acceptance/captures.

`--resize 560x1000` additionally changes the actual window at2× and restores
its prior override, requiring unchanged fixed-width paragraph/single-line input
heights, changed/restored window width and mount/value retention. It does not
replace split-screen/device qualification.

Composition uses the real product entry and the isolated test APK in this
directory, built/run with `build-android-font-instrumentation.py` and
`run-android-font-instrumentation.py`. The test IME uses Android's system-managed
InputConnection; five checkpoints require the same view/Editable, focus, text,
caret and composing range across1→2→1, continued composition and commit. Both
IME and font settings restore on failure; no test component enters the product
APK. API36 is the tested runtime; this does not qualify physical/provider IMEs.

For a non-debuggable Release app, supply `--external-evidence` to the Python
composition runner. It passes an opt-in instrumentation argument and collects
the same five checkpoints/screenshots from the app's external files directory
instead of requiring `run-as`. The separate test APK must share the installed
app's development signature for local instrumentation; preserve/hash the
original unsigned artifact separately. This does not provide distribution
signing. Reports identify both APK hashes and the actual collection command.
A missing report, checkpoint or PNG cannot count as a successful gate. The
external `font-composition` directory contains only this test's sample text and
captures and may be removed after collection. No production permission,
storage path or code is added by the test export option.

`--samples docs/evidence/run20/android/samples.json` exercises the historical
red control without an emulator. Native source/build commands, ABI guards and
the separate C++ renderer/cache executable are in [NATIVE_BUILDS.md](../../../docs/NATIVE_BUILDS.md).


The C++ renderer/cache harness is separate: `build-android-font-native.py`
requires the exact candidate prefab and uses Debug mode and `arm64-v8a` by
default. Append `--release` for Release prefab, matching RN's production class
layout and O2. Select `--abi armeabi-v7a`, `--abi x86` or `--abi x86_64` to
compile/link against that ABI's exported libraries and fbjni. The helper checks
ELF class/machine, Sealable/debug-string mode and exported patched headers
before compilation. Font-generation detection handles both 32-bit and 64-bit
`uint64_t` encodings; a wrong architecture, mode or header is rejected.

```sh
ANDROID_HOME=... python3 scripts/build-android-font-native.py \
  EXACT_PREFAB OUTPUT --release --abi armeabi-v7a
```

The six explicit test predicates remain unchanged, including old-tree
preservation, changed owner/adoption heights and cache callbacks. Compile/link
success does not establish that those predicates executed. Run27 qualifies
both compile modes and actual ARM64 Release execution; full Release application
and default-build integration remain open. Use the current plan/evidence for
each ABI's actual qualification status.

## Inspector-free Release fixture (Run29)

For a non-debuggable Release framework candidate, build a **separate diagnostic
APK** with this fixture as embedded production Hermes bytecode. The original
APK stays untouched. The builder requires exact entry-set/hash equality for
all non-signature entries except `assets/index.android.bundle`, including
META-INF dependency/ServiceLoader metadata, manifest, DEX, native libraries,
engine and fonts. Local signing uses the checked-in public development key;
this is not distribution signing or production-JS acceptance.

```sh
python3 scripts/build-android-font-release-fixture.py ORIGINAL_RELEASE_APK FIXTURE_OUTPUT
python3 scripts/build-android-font-instrumentation.py TEST_OUTPUT
python3 scripts/run-android-font-release-fixture.py TEST_APK FIXTURE_APK EVIDENCE SERIAL
node scripts/check-android-font-release-fixture.cjs EVIDENCE
```

Use the pinned Node22/JDK17/SDK36 environment from NATIVE_BUILDS.md. No Metro or
inspector is used during execution. The fixture automatically exports complete
read-only frame snapshots through a zero-sized test view's native content
description, without React state updates. A separate SDK-only instrumentation
class reads them and records native Activity/View/Editable identity, paint and
layout size, focus, text and selection. All six scenarios cold/live/sweep/edit/
resize run as normal AppRegistry startup; no live root replacement. The driver
requires every expected report/stage/PNG, binds installed APK hashes, restores
font/window on failure and stops its fixture process. The gate applies the
unchanged1physical-pixel comparisons plus native-state checks. Android
float32 environment values use the existing1e-6 readiness epsilon; pixel gates
are unchanged.

The collector's optional final positional scenario names are `primary cold2
cold085 cold13 sweep editing`. `--primary-only` on the **gate** is for a scoped
primary/narrow run; it does not establish the extended matrix. Cold2 also
records actual resize/restoration; native/physical IME composition remains a
separate real-product test. Original Run20/22 stale frames and Run26 stale
widget negative controls remain rejected.

Final Run29 fixturef56ea0f3 passes60frame/widget comparisons,12resize/12narrow
and3edit checks; original487 other payload entries match. The metadata-deficient
initial fixture remains diagnostic only. See [actual evidence](../../../docs/evidence/run29/README.md)
and [exact next Release production fidelity work](../../../docs/evidence/run29/android/next-android.md).
After collecting evidence, restore the intended product APK without data clear,
remove only the collected owned external `font-fixture-*` exports, and restore
ordinary Metro for an initial Debug product. This tooling does not close full
Release tile baseline/raster/application/window or default-build integration.
