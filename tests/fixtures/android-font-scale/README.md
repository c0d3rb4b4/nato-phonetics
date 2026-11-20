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
requires the exact candidate prefab and uses Debug mode by default. Append
`--release` for Release prefab, matching RN's production class layout and O2.
The library's Sealable/debug-string ABI is checked before compilation; a wrong
mode is rejected. The six explicit test predicates remain unchanged, including
old-tree preservation, changed owner/adoption heights and cache callbacks.
Run27 qualifies both compile modes and actual ARM64 Release execution; other
ABIs and full Release application/default-build integration remain open.
