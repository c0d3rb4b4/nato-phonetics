# Initial iOS baseline diagnosis — 17 November 2026

This is the preserved **pre-repair Debug candidate**, not the final Run 07 implementation. The native simulator app uses the repository's unchanged iOS project and font files. No application diagnostic instrumentation was added. The standard Hermes inspector reads the native `onTextLayout` baseline (`line.y + line.ascender`) already retained by `useTileBaseline`, alongside actual Fabric `measure` frames. Full original line payloads were not retained by the application; the observed sum is an actual event-derived value, not a reconstructed font metric.

The [native artifact](artifact.json), [installed identity](installed-artifact.json), and [executed JavaScript archive](loaded-javascript.json) identify this candidate separately from later source changes. The two actual [default](default-test.log) and [maximum](maximum-test.log) XCTest cases pass on the iPad Pro 11-inch M5, iPadOS 26.2, density 2. Native typing supplies `NUWJ359`; quiz answer concealment/reveal is asserted. Ten screenshot records are classified `diagnostic` in the [shared screenshot metadata](../../../screenshots/ios/metadata.json).

The [362 native baseline observations](native-layout-checks.json) pass the unchanged one-physical-pixel baseline gate. Default baselines differ from the nominal targets only by floating-point noise. At maximum category the actual React Native font scale is **3.571**, observed independently from Dimensions and tile style geometry.

The [maximum J native sample](maximum-alphabet-J-dark-native-layout.json) reveals the omitted rounding term:

| Observation | Actual logical units |
| --- | --- |
| Tile page Y | 346 |
| Outer letter box page Y / local Y | 360.5 / 14.5 |
| Specified outer letter box Y | `4 × 3.571 = 14.284` |
| Native retained line baseline | 131.56992765426634 |
| Existing inner translation | −0.000003654266322 |
| Observed baseline relative to the tile | 146.06992765426634 |
| Specified baseline relative to the tile | 145.853924 |
| Difference at density 2 | **+0.432007309 physical px** |

Header origin 0 plus letter-box origin 14.5 equals its page-frame difference. Body origin 214.5 plus word origin 82 equals the actual 296.5-unit root-relative word position; body plus guide origin 182 equals 396.5. Thus the parent's and outer box's rounded local origins reconcile with the actual page frames. The original baseline correction used the ideal box origin instead.

The [strict screenshot raster gate](raster-summary.json) passes **213/215 observations**. Maximum J fails in both alphabet and converter: **+2.2224004 physical px** at the lower edge using the independently observed exact scale. The legacy rounded-frame scale also fails both observations at +2.080301818 px. Every failure and the unchanged 2 px tolerance are retained; passing the looser baseline rounding gate does not erase the raster failure.

The proposed repair uses actual parent and outer-box layout origins when computing the existing inner text translation. It does not change font identity, glyph size, line height, outer box geometry, tile proportions, or acceptance tolerances. Its final validation belongs in the parent Run 07 report, after new captures and runtime checks.
