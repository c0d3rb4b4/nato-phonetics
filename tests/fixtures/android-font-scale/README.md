# Android font and layout tests

Run commands from the repository root. The [native build guide](../../../docs/NATIVE_BUILDS.md) lists the toolchain and Android build commands.

## Regression samples

The Node suite uses recorded Android observations to exercise the measurement checks without a device. Its regression samples capture stale outer text frames and stale editable glyphs inside a correctly sized frame. The Release samples cover font-scale transitions and native alphabet tile layout. [Fixture data](../android-observations/)

```sh
node --test tests/android-font-scale.test.mjs tests/android-release-fixture.test.mjs tests/android-release-tiles.test.mjs
```

## Debug device check

Install the intended Debug APK on a test device or emulator. Set `ANDROID_SERIAL` to its adb serial. Start Metro with the fixture entry in one terminal and run the checks from another.

```sh
npm start -- --config tests/fixtures/android-font-scale/metro.config.cjs
```

```sh
adb -s "$ANDROID_SERIAL" reverse tcp:8081 tcp:8081
npm run check:android:font-scale -- artifacts/font-scale --sweep --editing --resize 560x1000
```

The driver verifies the installed APK against the local Debug build or an explicit `NATO_EXPECTED_APK_SHA256`. It compares cold and live text measurements within one physical pixel, checks the mounted input, selection and edits, and writes samples and screenshots to the output directory. Afterward, stop the fixture Metro and restart ordinary `npm start` before testing the app.

## Release device check

The Release fixture builder takes an unsigned candidate APK, embeds the test entry as Hermes bytecode and verifies the other non-signature entries against the original. It signs the fixture with the repository's development key. Use a locally test-signed product APK with the same key for composition testing and for restoring the installed app.

```sh
python3 scripts/build-android-font-release-fixture.py "$UNSIGNED_APK" artifacts/font-fixture
python3 scripts/build-android-font-instrumentation.py artifacts/font-observer
python3 scripts/run-android-font-release-fixture.py \
  artifacts/font-observer/font-composition.apk artifacts/font-fixture/font-release-fixture.apk \
  artifacts/font-samples "$ANDROID_SERIAL"
node scripts/check-android-font-release-fixture.cjs artifacts/font-samples
```

Reinstall the intended product on the device after the fixture run, including when a check fails. Run the composition test against that installed product.

```sh
adb -s "$ANDROID_SERIAL" install --no-incremental -r "$PRODUCT_APK"
python3 scripts/run-android-font-instrumentation.py \
  artifacts/font-observer/font-composition.apk "$PRODUCT_APK" artifacts/font-composition \
  "$ANDROID_SERIAL" --external-evidence
```

To target a specific ABI on a universal APK, pass `--abi` with the same ABI to the fixture runner, the product install and the composition runner. The collectors verify the APK hash, selected ABI and mapped renderer, Hermes and JSI libraries. Record whether the target uses native hardware or translation.

The fixture checks the displayed paragraph against the mounted text layout after font and window changes. The composition test uses a test keyboard to check focus, text, caret and composing range through scale changes. It restores the previous keyboard and font settings. The host-side display, settings and ELF checks run with `python3 tests/test_android_evidence.py -v`.

## Renderer and tile checks

For the native renderer and cache tests, supply the candidate's exact prefab and choose the same build mode and ABI as the installed APK.

```sh
python3 scripts/build-android-font-native.py "$PREFAB" "$OUTPUT" --release --abi arm64-v8a
python3 scripts/run-android-font-native.py "$BINARY" "$PRODUCT_APK" "$RESULTS" "$ANDROID_SERIAL" --apk-abi arm64-v8a
```

The test APK also contains `TileLayoutInstrumentation`, which reads mounted view frames, line baselines, font spans, resolved paint sizes and corner radii from the installed product. The tile checker reads the capture directory's `identity.json` and matching native layout files. Use `--windows` for the seven window stages or `--narrow` for narrow layouts.

```sh
node scripts/check-android-release-tiles.cjs "$TILE_CAPTURES"
```
