# P05.2: next native investigation

17 November 2026. **Forecast: L, high uncertainty.** This is unfinished engineering work, not an M11 dependency. No native regression or framework repair was built in Run 07. The next batch should establish the first divergent measurement boundary before selecting a backport or dependency update.

## Established facts and limits

- The [retained isolated fixture](diagnostics/README.md) reproduces stale live frames on installed React Native **0.81.5/Fabric**. A nonbinding `maxFontSizeMultiplier = fontScale + 1` changes visible glyph sizing, but live 2× body/feedback/input heights remain **57.714/24/47.429 dp**, versus cold **167.429/72/63.429 dp**. Adding a nonbinding `minHeight` change also fails. Neither variation is application code.
- The complete sweep includes 0.85/1/1.3/2 and repeated returns. Component mount count and input value survive; editable caret/composition retention was **not** verified by this fixture. Its DevTools surface replacement is another variable to remove in a dedicated reproducer.
- Final app screenshots show stale ordinary text after live changes and internal clipping in enlarged quiz headings, instructions, feedback and Next/Replay labels. Reachable controls and passing tile gates do not establish readable labels.
- No exact dirty-subtree, paragraph-cache, Android measurement-cache or mounting cause is demonstrated. The earlier clean-root explanation was [withdrawn after inspecting the complete clone/style path](../../run06/android/upstream-investigation.md). Another root-dirty call is not an evidenced repair. Upstream reports on other versions/platforms remain leads only.

## Exact installed boundaries to instrument

Paths below are relative to `node_modules/react-native/`; [diagnostic source identity](diagnostics/source-identity.json) records the inspected candidate.

| Boundary | Source fact | Evidence still needed |
|---|---|---|
| Android configuration → surface | `ReactAndroid/src/main/java/com/facebook/react/runtime/ReactSurfaceImpl.kt` supplies actual configuration scale only when `enableFontScaleChangesUpdatingLayout` is enabled; otherwise it supplies 1. The installed flag is false. Run 06's enabled-flag experiment did not establish a repair. | Capture configuration, DisplayMetrics, surface constraints and layout-context multiplier together, through the normal Activity callback. |
| Paragraph → Yoga | `ReactCommon/react/renderer/components/text/ParagraphShadowNode.cpp` caches `content_`; its text attributes initially use the layout-context multiplier. Props revisions dirty measurement. `components/view/YogaLayoutableShadowNode.cpp` has separate child-adoption, dirty-state and layout traversal paths. | Measure callback counts, paragraph/child identities, dirty states and resulting Yoga sizes for the same live/cold case. Do not infer causation from one flag or source branch. |
| C++ measurement → Android text | `ReactCommon/react/renderer/textlayoutmanager/platform/android/react/renderer/textlayoutmanager/TextLayoutManager.cpp` caches by attributed string, paragraph attributes and layout constraints. `TextAttributeProps.java` ignores the map-buffer font-size-multiplier entry and resolves font size through Android SP conversion. | Cache hit/miss plus key inputs, JNI measured size, line-event data and final mounted frame. A cache miss or enlarged glyph alone is insufficient. |

## Smallest executable sequence

1. Give the retained ordinary Text/TextInput fixture a normal, dedicated diagnostic entry on the same pinned native build. Remove navigation, theme and tile hooks, and remove DevTools root replacement from the reproduction. Keep persistent refs/mount counter, a controlled input and explicit-line-height feedback. First reproduce the failure at 1→2→1 with identical constraints and a cold 2× reference. Expand to the existing full sweep only after this short gate fails reliably. Archive entry source, loaded bundle, native artifact and screenshots.
2. Instrument only the boundaries above in a separately identified diagnostic native candidate. Find the **first** disagreement between live and cold: configuration/context, paragraph measurement invocation, measured size, Yoga frame or mounted frame. Vary one diagnostic flag/cache behavior at a time, retaining the unmodified control. Include TextInput's separate measure/state path; a Paragraph fix does not prove input correctness.
3. Turn that observed divergence into a failing native regression, then patch it. Existing `components/root/tests/RootShadowNodeTest.cpp` and `components/view/tests/LayoutTest.cpp` are possible renderer starting points; exercise the actual observed tree and same constraints, not merely a root dirty flag. `textlayoutmanager/tests/TextLayoutManagerTest.cpp` is only a TODO placeholder. The installed npm package contains test sources but no confirmed runnable C++ test target; resolve the test harness from an exact 0.81.5 source checkout before claiming a command or result. If failure requires Android SP/JNI behavior, retain an Android runtime regression as well as any host C++ test.

## Reproducible build requirements

The app currently depends on prebuilt `com.facebook.react:react-android` and `hermes-android`; its settings include no React Native source composite. Editing installed C++ therefore cannot change the current APK. React Native's [official source-build guide](https://reactnative.dev/contributing/how-to-build-from-source) documents composite dependency substitution. Installed 0.81.5 `settings.gradle.kts` confirms project paths `:packages:react-native:ReactAndroid` and its `:hermes-engine` child. Use that pinned version in a separate candidate; the guide's optional nightly upgrade is not required.

Preserve a reproducible patch/fork and lockfile identity rather than an undocumented node_modules edit. Verify dependency resolution before compiling, then record the APK and packaged native-library hashes/build IDs and confirm the installed artifact. After configuring substitution, proposed preflight/build commands from `android/` are:

```sh
./gradlew :app:dependencyInsight --dependency react-android --configuration debugRuntimeClasspath
./gradlew :app:assembleDebug -PreactNativeArchitectures=arm64-v8a --max-workers=1
```

These commands were **not run for a source candidate**. Confirm the AVD ABI before restricting the diagnostic build; subsequent release coverage must cover supported ABIs. Preserve the existing JDK 17, Gradle 8.14.3, AGP 8.11.0, Kotlin 2.1.20 and NDK 27.1.12297006 pins. Installed ReactAndroid requests CMake 3.30.5 unless `CMAKE_VERSION` overrides it; inventory that tool/download requirement first. Decide and record Hermes substitution consistently with the pinned build, then confirm its resolved dependency too.

Read-only disk inspection during the final iOS window found **2.8 GiB free**, down from 3.8 GiB during the diagnostic run. That is not established sufficient headroom for a first full framework build. Inventory candidate build/cache needs and reclaim only disposable owned outputs while preserving evidence, or provision another build location. Official guidance warns that the first source build is slow; there is no measured duration or storage requirement for this machine. Forecast tens of minutes or more for compilation **as an unverified planning estimate**, plus potentially substantial test-harness/isolation work; reforecast after configuration and the first build. Serialize native builds/simulators on this 8 GB host.

## Acceptance and stop boundary

Require live/cold equivalence at 0.85/1/1.3/2 with repeated returns, raw events plus actual frames/screenshots, complete ordinary labels/feedback, nested text and explicit line heights, retained editable text/caret and submitted quiz state. Re-run unchanged tile geometry/baseline/raster gates and the actual resized-window flow. A shared renderer/dependency change also requires iOS/web checks. Do not ship remounts, disabled scaling, arbitrary layout values or wider tolerances as a substitute. If the isolated regression cannot establish a candidate repair, keep P05.2 active with the exact failed boundary and measured build constraints; do not attribute failure to a framework component solely from source reading.
