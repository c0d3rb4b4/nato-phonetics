# Resume P05.2-F2 — full Release affected gates before default integration

Run28 completes the three remaining configured source Release ABI build,
package, identity and unchanged-predicate native consumer-link scopes.
Run27 supplies the retained ARM64 build/native/composition and complete Debug
F1 tile evidence. Do not repeat them without a changed native/font/layout or
other invalidating input. [Actual scope](../README.md), [ABI products](abi-summary.json).
Non-ARM64 execution is unrun; the available Android16 runtime reports only
arm64-v8a and no32-bit ABI. Build/link success does not close those runtime scopes.

## Next unfinished, unblocked slice

**Full Release affected acceptance (M–L, test-observation/integration risk).**
The maintained `verify-android-font-scale.cjs` reads the normal-startup fixture
through Metro's development inspector (`Runtime.evaluate`). Its environment
APK override only checks identity; it does not enable inspection of a
non-debuggable Release. Run27's5 test-IME checkpoints and Run28's3 product
samples are scoped passes, not substitutes for the60-comparison Release
frame/widget gate, sweep/editing or full product/raster/window acceptance.

Smallest discriminating checkpoint:

1. Add a test-only normal-startup Release fixture/observation path. Keep the
   intended product APK non-debuggable, its production entry/permissions/storage
   untouched, and identify any separately embedded fixture entry explicitly.
   Bind fixture execution to the exact intended framework/Hermes native payload
   with hashes/build IDs and matching production headers. Existing isolated
   instrumentation and external-evidence collection are reusable foundations.
2. Collect actual cold1/live2/return1/cold2 stable paragraph, feedback, revised
   paragraph, nested text, input outer frame and native editable-content sizing.
   Retain same mounted state/native view, text and focus/selection checks;
   use the unchanged1-physical-pixel live/cold criterion. Keep the archived
   Run20/22 stale-frame and intermediate stale-widget negative controls red.
3. At that actual observation/gate result, reforecast the repeated0.85/1.3/2/1
   sweep, committed edits/continued input, window resize/narrow scopes and
   actual Release converter/submitted quiz/reference/tile baseline/raster
   acceptance. Apply original context/part completeness and1px baseline/2px
   ink gates; do not rename Debug measurements as Release results.

A failed observation narrows its exact native widget/frame/state or collection
boundary. A passing minimal fixture selects the remaining affected gates; it
does not enable default integration early. Only after required F acceptance,
implement ordinary clean-install/default-source execution with exact version/
hash guards and pinned Maven Hermes, prove actual default dependency selection,
then rerun affected gates on the installed intended artifact. Default Maven
still has the historical failure; no ordinary-build repair ships in Run28.

## Preserved artifacts and resource-aware execution

Exact unsigned Run28 products are under `artifacts/run28/release-<abi>/`;
manifests identify all original APK/AAB/native entries. Exact Run27 ARM64
original APK/AAB and development-signed non-debuggable engineering test copy
remain under `artifacts/run27/release-arm64/`. Run28's explicit test-only prefab
binds guarded current headers to its exact APK libraries:
[binding](arm64-prefab-identity.json). No private distribution signing occurred.

Use the pinned Node22.23.0/JDK17.0.13+11/SDK36/NDK27.1.12297006 environment,
source CMake3.30.5 and app CMake3.22.1. Source/normal-entry bytes remain unchanged.
For a justified fresh source build, reuse this existing path with the intended
ABI and preserve each product before replacement:

```sh
npm run prepare:android:source
cd android
NATO_BUILD_JOBS=1 ./gradlew :app:assembleRelease :app:bundleRelease \
  -PnatoReactNativeSource=true -PreactNativeArchitectures=arm64-v8a \
  --max-workers=1 \
  '-Dorg.gradle.jvmargs=-Xmx2048m -XX:MaxMetaspaceSize=512m -XX:ActiveProcessorCount=2'
```

`NATO_BUILD_JOBS` now also bounds Metro's separate worker pool; Gradle's limit
alone did not. Preserve the original failed x86 command and emulator disk
rejection. The passing retry/resource recovery does not establish a universal
memory requirement. [Failure/limits](x86-setup-failure.md), [checkpoints](../shared/forecast.md).

Generated Debug/Release object/static-link caches were selectively reclaimed
after exact product preservation, including previously qualified ARM64 caches.
Shared libraries/source/headers/configuration/toolchains/products/evidence stay
available, but future native compilation may be cold. Do not assume retained
object files or a cache-hit build duration. Recheck actual disk/swap before a
build/emulator, serialize heavy jobs and record any actual failure. Final
available bytes are in [resource sample](../shared/resources-final.json); no
new arbitrary minimum or owner cleanup prerequisite is imposed.

Initial Debug APK1b045e2d, numeric font1.0,720×1600/density280, Gboard and ordinary
product entry were restored without clearing data. Owned Metro/Gradle/emulator
are stopped. [Restoration](restoration.json), [4 inspected actual images](../screenshots/index.md).
HEAD37abdc5 and staged Run27 work are preserved; no agent commit/staging/reset.
All M11 results remain unperformed. Only physical/AT/provider/listening/private
signing/distribution/release acceptance belongs in [M11](../manual-handoff.md).
Local Release observation/ABI/runtime/resource/capture work stays engineering;
no missing owner input blocks the next step and no unrelated P2 is selected.
