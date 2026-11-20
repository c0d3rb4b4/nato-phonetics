# Resume P05.2-F2 — remaining ABIs before default integration

F1's original complete Run07 scope now passes; reuse [Run27 reports](../README.md), not another full raster collection without a new renderer/font/layout input. ARM64 opt-in Release compile/package, six real native cases and five real-product test-IME checkpoints pass. Default Maven path still has the historical live-text defect. No unrelated P2 selection because the next forecast is M–L.

## Next unfinished, unblocked slice

**F2 ABI qualification (M–L, integration/build uncertainty):** start with `armeabi-v7a`, then `x86` and `x86_64`. The new64-bit font-environment generation crosses JNI/layout/cache structures; 32-bit compilation and exported-header/library consistency are explicit risks. Measure actual disk/swap/toolchain first, serialize heavy jobs, preserve logs and exact products. Run27 starts with5.9GiB, completes actual ARM64 Release with2,409,902,080bytes free; no measured disk/build failure or arbitrary minimum/new cleanup prerequisite. Final post-runtime/shutdown resource observation is1,161,388,032bytes available (about1.08GiB), with toolchain/source objects and artifacts preserved; [exact sample](../shared/resources-final.json). Recheck before the next serialized ABI build; this is not a measured failed build or an invented cleanup/owner gate. Toolchain/source caches and originals remain available.

Use the current guarded RN0.81.5 source path (Node22.23.0, JDK17.0.13+11, SDK36/NDK27.1.12297006, source CMake3.30.5; app CMake3.22.1):

```sh
npm run prepare:android:source
cd android
./gradlew :app:assembleRelease :app:bundleRelease -PnatoReactNativeSource=true -PreactNativeArchitectures=armeabi-v7a --max-workers=1 '-Dorg.gradle.jvmargs=-Xmx2048m -XX:MaxMetaspaceSize=512m -XX:ActiveProcessorCount=2'
```

Run from a process environment with the pinned paths in [exact Run27 command](source-release-arm64.json); preserve JAVA_HOME/ANDROID_HOME/PATH without changing machine defaults. Copy/hash each ABI's APK/AAB before another build replaces standard outputs. Verify exact Hermes0.81.5 variant, embedded product JS, ELF machine/build IDs, matching prefab headers and JNI/layout ABI. Current ARM64 unsigned APK/AAB/test-copy identities are in [manifest](release-artifacts.json); the test signature is the public development key, not owner distribution signing. Record unavailable ABI runtime environments honestly, separate from successful compile/link/package.

**Checkpoint:** actual build/identity/native ABI result or concrete compiler/resource failure. A failure selects its exact ABI/header/JNI question, no tolerance/assertion/reset workaround. Add meaningful native/runtime qualification for observed new risk. The native C++ harness is ARM64-only today; use `--release` with Release prefab, default Debug mode with Debug prefab. Wrong variants are rejected before compile; do not force them to link. Release harness checks six explicit predicates unchanged.

## Remaining F and E

ARM64's five Release input checkpoints do not establish the full60-comparison Release fixture, current Release raster/product/window or support matrix. Qualify those affected scopes on the exact intended artifact, without substituting Debug reports. Existing native composition runner can collect Release evidence with `--external-evidence`; see [fixture guide](../../../../tests/fixtures/android-font-scale/README.md).

After required F acceptance, integrate the repair into ordinary clean-install/default-build execution with version/hash guards, no hidden node_modules edits and preserved pinned Hermes. Verify actual default dependency selection, clean install/build and installed artifact, then rerun affected strict frame/widget/state/composition/product/tile gates on that artifact. Do not rename Run26/27 opt-in evidence or close P05.2 prematurely.

Owned Metro/emulator are stopped after product/font/window/IME/initial APK restoration; [observed state](restoration.json). Initial basee591f9 with inherited Run26 was concurrently committed as37abdc5; preserve that commit and any newer user edits. No owner input blocks F2. Physical AT/provider keyboards, listening, private signing/distribution and release approval alone stay M11.
