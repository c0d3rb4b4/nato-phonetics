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

## Capturing the displayed frame

The composition and Release fixture instrumentation read the system display
with `screencap -p` at each observed stage. The Windows x86_64 run found that
`UiAutomation.takeScreenshot()` could return the previous frame following a
live scale change, even as native values and layout measurements advanced.
The collectors reject byte-identical PNGs across adjacent composition states
with different visible values or sizes, and across the fixture's primary
scale changes. Inspect the resulting images as well. [Original and corrected
captures](../../../docs/evidence/run31/screenshots/index.md).

Each Release fixture screenshot now also checks the displayed static paragraph
against the mounted Android text layout. The observer locates the final
non-space glyph cell of each line and examines dark pixels in the actual
system screenshot. It waits up to five seconds for the line endings to match.
The observation and final PNG are retained on failure. This catches stale app
content when a blinking caret or system navigation indicator changes the PNG
digest. The individual measurements are in each sample's `display.frames`
array. Inspect the input and keyboard separately. [Stale and corrected editing frames](../../../docs/evidence/run32/android/runtime-preflight.md).

## Selecting an ABI from a universal Release APK

Use the same locally test-signed product, matching fixture and SDK-only observer
throughout a run. Explicitly select the ABI when installing the product and
when restoring it after the fixture replaces it. For example, on a guest that
advertises `arm64-v8a`, run the following from the repository root with the
serial and files supplied as shell variables.

```sh
adb -s "$SERIAL" install --no-incremental -r --abi arm64-v8a "$PRODUCT_APK"
python3 scripts/run-android-font-instrumentation.py \
  "$TEST_APK" "$PRODUCT_APK" "$COMPOSITION_OUTPUT" "$SERIAL" --external-evidence --abi arm64-v8a
python3 scripts/run-android-font-release-fixture.py \
  "$TEST_APK" "$FIXTURE_APK" "$FIXTURE_OUTPUT" "$SERIAL" --abi arm64-v8a
node scripts/check-android-font-release-fixture.cjs "$FIXTURE_OUTPUT"
adb -s "$SERIAL" install --no-incremental -r --abi arm64-v8a "$PRODUCT_APK"
```

With `--abi`, both collectors check the installed APK's SHA-256, PackageManager's
`primaryCpuAbi` and the renderer, Hermes and JSI libraries mapped by the
measured process. Each fixture scenario reports its own PID, source APK and
native library directory. For a library loaded directly from the APK, the
host matches the mapped ELF header and an executable segment to the entry in
that exact ZIP. For an extracted library, it also verifies the extracted
file's SHA-256 against the package.
Record the guest CPU ABI and native bridge alongside these results to
distinguish translated execution from native hardware. Preserve the product
and restore it even if a fixture gate fails. The [Run 32 driver](../../../docs/evidence/run32/android/qualify-runtime.py)
shows the restoration and public engineering-signature checks.

Each newly collected display image must match the device file's SHA-256 and pass
PNG chunk, checksum and compressed-stream checks. The collectors restore a
numeric font scale exactly. If the setting was originally absent they remove
the temporary override. The composition collector restores both the selected
keyboard and the test keyboard's previous enabled state. Run
`python3 tests/test_android_evidence.py -v` for the host controls covering these
cases, including segmented ELF files and interrupted transfers.

## Untouched production Release tile observer (Run30)

`TileLayoutInstrumentation` is a separate test-APK entry. It starts the real
product, then responds to owned external `tile-observer/request.json` commands
with actual native view frames/transforms, Android Layout line baselines,
font spans/resolved paint sizes, corner radii and native identities. It skips
non-visible/zero-sized retained screen ancestors. No inspector, synthetic JS
measurement, app root replacement or product source change is used. The
external command name must be a simple filename; timeout/failure is explicit.
Host `adb exec-out screencap -p` supplies actual screenshots without competing
UIAutomation sessions.

The maintained `scripts/check-android-release-tiles.cjs` requires complete
parts/content, actual typography, strict1physical-pixel outer geometry and
transformed baseline measurements. `--windows` additionally requires all7
window stages and the same Activity/native tiles. `--narrow` checks the complete
narrow sample. Full acceptance also needs the unchanged Run07/27 ink checker,
glyph metrics and original context/part coverage. Native getGlobalVisibleRect
alone can include tiles behind the fixed header: qualify raster rectangles
with actual captured UIAutomator clipping, as the original collector does.

Build the test APK with `scripts/build-android-font-instrumentation.py` using
the pinned environment. [Run30 candidate-specific driver/evidence](../../../docs/evidence/run30/README.md)
records505context/93window/21narrow baselines and217ink observations,30actual
inspected captures and retained failed attempts. Adapt its paths/output into a
new run before reuse; never overwrite archived evidence. Collect owned exports,
restore initial product/settings/entry without data clear and stop owned tools.
This does not integrate the repair into ordinary default builds or perform
broader supported-runtime, physical/AT/provider/distribution/M11 acceptance.

### Quiz labels and the system clipboard

The optional quiz observation records the fitted line count, ellipsis, final line end and bottom, available height, effective paint size and identity of mounted Android text views. The session driver submits a real answer before increasing the font size, then checks the same feedback and buttons, score, missed-answer recap and Retry on the installed product. [Round driver](../../../docs/evidence/run32/android/quiz-round.py).

On a disposable device, the converter probe seeds the system clipboard only with the fixed 2,000-character postcode/callsign sample. Subsequent observations return lengths and SHA-256 digests of the active input and clipboard, plus the caret and native field identity. The driver uses Android's Paste key event, ordinary typing, the product Copy and Share buttons and the real system chooser. The instrumentation is built and installed as a separate test APK. [Converter driver](../../../docs/evidence/run32/android/converter-export.py).
