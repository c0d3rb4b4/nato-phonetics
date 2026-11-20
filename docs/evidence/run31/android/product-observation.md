# Observing the default Release product

Use the installed, locally test-signed non-debuggable product and the SDK-built observer on the dedicated AVD. The driver checks the installed product SHA-256 against the supplied APK before recording evidence. It also verifies the installed observer when a native scope uses it. Each invocation requires fresh output and screenshot directories. The surrounding run owns the disposable emulator and its final restoration.

From the repository root, a Windows invocation for the first product checkpoint is

```powershell
$app = 'artifacts/run31/x86_64/app-release-local-test.apk'
$observer = 'artifacts/run31/instrumentation/font-composition.apk'
$serial = 'emulator-5582'
$collector = 'docs/evidence/run31/android/observe-product.py'
python -X utf8 $collector product $app $observer $serial docs/evidence/run31/android/product-01 docs/evidence/run31/screenshots/android/product-01
```

The `product` scope enters `NUWJ359`, checks the retained converter value at system font scales 1→2→1 and captures the actual screen at each stage. The `checkpoint` scope uses the original Run 30 alphabet native observation. Other scopes use that same collector's complete-visible tile selection, quiz concealment, feedback/Next, resize and narrow reachability. [Original collector](../../run30/android/observe-product.py).

| Collector scope | Check after collection |
| --- | --- |
| `checkpoint` | `node scripts/check-android-release-tiles.cjs NEW_OUTPUT --checkpoint` |
| `matrix` | `node scripts/check-android-release-tiles.cjs NEW_OUTPUT` and `node docs/evidence/run31/android/check-extended-raster.cjs NEW_OUTPUT NEW_SCREENSHOTS NEW_REPORT.json` |
| `windows` | `node scripts/check-android-release-tiles.cjs NEW_OUTPUT --windows` |
| `narrow` | `node scripts/check-android-release-tiles.cjs NEW_OUTPUT --narrow` |
| `narrow-aligned` | The same narrow gate, with slow scroll gestures guided by the native tile position and the actual scroll viewport. |

Run the ink checker from a checkout with its locked `sharp` installation. It reads the original glyph metrics and checks complete UIAutomator-visible rectangles with the original 2-pixel ink envelope and greater-than-8 RGB background difference. The independent native baseline and geometry checks keep their 1-pixel tolerance. The port reproduced all 217 decoded observations from archived Run 30 image data. Current product results require new actual images, hierarchy dumps, native observations and candidate hashes. [Portability comparison](raster-portability.json).

## Observed product

The three converter captures show `NUWJ359` before enlargement, at 2× and after returning to 1×. All three display the populated product, and their metadata records the device settings and image hashes. The first native alphabet checkpoint measured 78 baselines across 26 roots. [Converter metadata](../screenshots/android/product-01/metadata.json), [alphabet result](checkpoint-layout.log).

The complete original production matrix passed 505 native baselines in 15 groups and 220 ink observations. Inspection of all 16 captures covered A through Z, the final two-tile row, mixed converter output in both themes, enlarged cards, concealed E, revealed Echo and reachable feedback and Next. Partial tiles at scroll boundaries received ink credit only when fully visible in a separate capture. [Native gate](matrix-native.log), [ink gate](matrix-ink.log), [capture metadata](../screenshots/android/matrix-01/metadata.json).

Seven window stages passed 93 baselines. The converter retained `NUWJ359` through narrow, landscape and restored display sizes. The submitted quiz retained D and one correct answer through narrowing and restoration. Next advanced once to V, question two. The ten captures include a partial converter tile in short landscape, the narrow quiz scroll position and its reachable feedback and Next button. [Window gate](window-native.log), [state checks](windows-01/checks.json), [capture metadata](../screenshots/android/windows-01/metadata.json).

The first separate narrow search failed after 35 fixed upward swipes. Its saved final hierarchy contains tiles 5 and 6 with tile 6 fully visible. The requested tile 0 had already scrolled offscreen. [Failure](narrow-01.log), [final search hierarchy](narrow-01/last-search-hierarchy.xml).

The second search used eight native-frame-guided swipe gestures to move tile 0 from below the viewport to a fully visible rectangle at x 88, y 325, width 385 and height 525. The actual 560×1000 screenshot shows the complete November tile and its pronunciation at 2×. All 21 baselines pass the original narrow gate. Both narrow searches captured the retained input before scrolling, and the failed first search remains recorded separately. [Gesture positions](narrow-02/alignment.json), [narrow gate](narrow-native.log), [complete tile](../screenshots/android/narrow-02/narrow-product-complete2.png).
