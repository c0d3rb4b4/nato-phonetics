# Native paragraph precision — Run 18

The default iOS Privacy policy lost the final microphone-access words in actual pixels while its accessibility label remained complete. [Run 18 causal comparison](evidence/run18/ios/paragraph-comparison.json) uses identical diagnostic JavaScript on the original and rebuilt native binaries: the paragraph changes from **274.9998779296875pt / 10 lines** to **275pt / 11 lines**, with the missing words visibly restored. Final product JavaScript, policy wording and fonts match Run17. [Actual screenshots](evidence/run18/screenshots/index.md).

## Cause and selected repair

The installed Yoga rounds absolute edges to float before subtracting them. At fractional offsets, subtracting these narrowed values can lose a float step from a measured height. Native TextKit given that smaller height collapses the remaining text onto its last clipped line. The [actual iOS TextKit experiment](evidence/run18/ios/textkit-test.log) reproduces ten lines at274.9998779pt and eleven at275pt. This explains the observed disclosure failure; it does not explain Android live font sizing or every native issue.

Primary upstream [RN issue58970](https://github.com/react/react-native/issues/58970) documents the same chain. [Yoga PR2037](https://github.com/react/yoga/pull/2037), merged14October2026, subtracts double-precision rounded edges before narrowing the resulting dimension. [Captured upstream identity](evidence/run18/shared/upstream-review.json), [original patch series](evidence/run18/ios/upstream-yoga-2037.patch). This backport retains the first commit's explanatory comments; the final upstream cleanup only removed those comments. The separate [RN-side hardening PR58974](https://github.com/react/react-native/pull/58974) was open when reviewed and is not selected.

## Installation and build contract

`npm ci` now applies the reviewed Yoga transform through the renderer preparation script. It validates React Native 0.81.5 and checks the complete original or already-patched hash of `PixelGrid.cpp` with the other 12 reviewed renderer/build files before writing. Repeated preparation retains matching files. Source drift requires review. [Preparation](../scripts/prepare-android-source.cjs), [reviewed Yoga transform](../scripts/patches/react-native-0.81.5-yoga-pixel-grid.json).

CocoaPods builds this local Yoga source. Rebuild and reinstall iOS after a native change. The ordinary Android composite now also builds the reviewed Yoga source. The explicit historical Android Maven control still embeds its original Yoga binary. Web uses its existing JS build. [Native builds](NATIVE_BUILDS.md#android), [Run 31 evidence](evidence/run31/README.md).

`npm run check:yoga` requires a C++20 compiler and compiles the actual installed Yoga implementation with [native regressions](../tests/native/yoga-rounding.cpp). It covers horizontal/vertical dimensions at scale0/1/2/3, fractional offsets around large coordinates, the app paragraph dimensions, public negative/positive rounding/floor/ceil/ties and NaN. **177 checks:21 original failures,0 patched failures.** Installer tests separately cover exact output, repeat application, version/source drift and installed-source identity. CI runs the compiled check; hosted CI has not been executed.

## Qualification limits

A fresh locked install,133 tests,types/lint,Expo-free graph,compiled Yoga checks and direct unsigned iOS Release build pass. All 25 installed iOS files match the built candidate. Default policy OCR reads the repaired words; default core navigation/input/layout and all 26 default/maximum reference tile ratios pass scoped checks. A separate retained maximum-state ending capture/OCR reads the complete final sentence. The full maximum policy command remains failed because OCR omits the isolated, visibly drawn final `y` in the wrapped heading; it is not relabelled as passed. The first core command's stale selector also stays failed, with source/log retained.

These are scoped automated checks. Full current-candidate native baseline/strict raster/runtime/AT matrices remain unrun; older strict P3 failures stay open. Android live ordinary-text sizing, original iOS long-drag/max progress return, other runtimes, physical listening/AT/provider checks and signing/hosting/recognition/integrated release gates remain open. Every M11 result is unperformed. [Full record and exact commands](evidence/run18/README.md).
