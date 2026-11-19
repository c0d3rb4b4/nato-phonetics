# Run26 actual Android screenshots

**47 final current-candidate raw captures, all inspected.** Date19November2026, APK SHA256 `1b045e2dc7b2f1761bd4f8aa708cde29b498f2c43963b3062cc08b8555c28eee`; [APK/library/source identity](../android/candidate-widget.json). Android16/API36 arm64 emulator-5580, light app/white fixture. Normal display720×1600physical, density1.75,411.429×914.286dp. Narrow/live-resize display560×1000,320×571.429dp. Actual dimensions/font scale, capture commands and raw hashes are in the metadata linked below.

These are installed Android captures, not browser images. adb captures use `adb -s emulator-5580 exec-out screencap -p`; composition uses Android Instrumentation `UiAutomation.takeScreenshot()` saved directly as PNG. Analysis contact sheets live only in artifacts; raw images below are unchanged. Narrow images preserve aspect ratio when inspected.

Representative changed flows: [real converter live2](android/product-final/converter-live-2.png), [submitted quiz feedback/live2](android/product-final/quiz-feedback-live-2.png), [editable caret/live2](android/fixture-final/editing-live2.png), [native composing range/live2](android/composition-final/composition-live-2.png), [actual narrow resize/live2](android/window-final/resize-narrow2.png), [cold2comparison](android/fixture-final/cold2.png), [current reference live2](android/product-final/reference-live-2.png).

Native glyphs now scale in the input as well as its outer frame. Stable/explicit-line-height feedback and nested bold/italic text show the matched cold/live sizes. Real converter retains NUWJ359; quiz retains the submitted R/Rebel answer with Romeo feedback. Composition has underlined Q/QR before commit. No blank/loading/red error image occurs in the final set. At2×/narrow, lower content continues below the viewport in a ScrollView; quiz feedback views are deliberately scrolled to options/Next, with the upper prompt/tile partly above the viewport. These images do not establish full scrolling, hidden-answer, ink/raster or physical/AT acceptance.

Metadata: [main fixture20](fixture-final-metadata.json), [composition5](composition-final-metadata.json), [window6](window-final-metadata.json), [narrow4](narrow-final-metadata.json), [real product8](android/product-final/metadata.json), [native baseline contexts4](android/tile-final/metadata.json). See [check reports](../README.md) for scope and [next F1 raster task](../android/next-android.md) for unrun contexts.

| Group | State / raw capture | Font scale | SHA256 |
|---|---|---|---|
| fixture | [cold1.png](android/fixture-final/cold1.png) | 1 | `37f591b126507e0e8ab2c1c0309ae3981373f2f698dca6f795ae4e8ce3fd7763` |
| fixture | [live2.png](android/fixture-final/live2.png) | 2 | `723de2555fb2a742d2269a37bfb81d610461d6fe624f7f491e644a63689e92f4` |
| fixture | [return1.png](android/fixture-final/return1.png) | 1 | `37f591b126507e0e8ab2c1c0309ae3981373f2f698dca6f795ae4e8ce3fd7763` |
| fixture | [cold2.png](android/fixture-final/cold2.png) | 2 | `723de2555fb2a742d2269a37bfb81d610461d6fe624f7f491e644a63689e92f4` |
| fixture | [cold085.png](android/fixture-final/cold085.png) | 0.85 | `668582894837d435068ccebb51f92768ef275dd4a1141f6f4e0029fe68dd883c` |
| fixture | [cold13.png](android/fixture-final/cold13.png) | 1.3 | `300a73962d53aa757c576fa41c5005206c4dee750610ebe036e3d8808029d7f4` |
| fixture | [sweep0-0.85.png](android/fixture-final/sweep0-0.85.png) | 0.85 | `668582894837d435068ccebb51f92768ef275dd4a1141f6f4e0029fe68dd883c` |
| fixture | [sweep1-1.3.png](android/fixture-final/sweep1-1.3.png) | 1.3 | `300a73962d53aa757c576fa41c5005206c4dee750610ebe036e3d8808029d7f4` |
| fixture | [sweep2-2.png](android/fixture-final/sweep2-2.png) | 2 | `723de2555fb2a742d2269a37bfb81d610461d6fe624f7f491e644a63689e92f4` |
| fixture | [sweep3-1.png](android/fixture-final/sweep3-1.png) | 1 | `37f591b126507e0e8ab2c1c0309ae3981373f2f698dca6f795ae4e8ce3fd7763` |
| fixture | [sweep4-0.85.png](android/fixture-final/sweep4-0.85.png) | 0.85 | `668582894837d435068ccebb51f92768ef275dd4a1141f6f4e0029fe68dd883c` |
| fixture | [sweep5-2.png](android/fixture-final/sweep5-2.png) | 2 | `723de2555fb2a742d2269a37bfb81d610461d6fe624f7f491e644a63689e92f4` |
| fixture | [sweep6-1.3.png](android/fixture-final/sweep6-1.3.png) | 1.3 | `300a73962d53aa757c576fa41c5005206c4dee750610ebe036e3d8808029d7f4` |
| fixture | [sweep7-1.png](android/fixture-final/sweep7-1.png) | 1 | `37f591b126507e0e8ab2c1c0309ae3981373f2f698dca6f795ae4e8ce3fd7763` |
| fixture | [editing-start.png](android/fixture-final/editing-start.png) | 1 | `37f591b126507e0e8ab2c1c0309ae3981373f2f698dca6f795ae4e8ce3fd7763` |
| fixture | [editing-before.png](android/fixture-final/editing-before.png) | 1 | `dd0a28dca14bee0486e33e70a24a8afab5f6a9c2dac93a118ad4b483be7fb25e` |
| fixture | [editing-typed-before.png](android/fixture-final/editing-typed-before.png) | 1 | `21d278d29b0623c7230aac0ddf7b991ab86afe2dca2273fcc199d3c9b23721d1` |
| fixture | [editing-live2.png](android/fixture-final/editing-live2.png) | 2 | `00be5e5c9d12b63d9677dad1318f6f9ee04839b994e70b6ed2e01bee5616b006` |
| fixture | [editing-return1.png](android/fixture-final/editing-return1.png) | 1 | `2999798c128b2f6ad1a5245458d4cf6bf41691e5c6c1bc2d049c8274ce3c4c5e` |
| fixture | [editing-insert.png](android/fixture-final/editing-insert.png) | 1 | `60d995e582eb373d63c5e12da0aa5bc689bdfe4eca1e709d41670d8bf84c4a70` |
| composition | [composition-before.png](android/composition-final/composition-before.png) | 1 | `a8c4f2514bde740e89fb2400350f83e30d03250e4d3b592fa95780471d599fbc` |
| composition | [composition-committed.png](android/composition-final/composition-committed.png) | 1 | `4cf11abde958b8f80757d58aad79fe3e24a33ba7fe1a139d8674bad372f46593` |
| composition | [composition-continued.png](android/composition-final/composition-continued.png) | 1 | `533854f09ca64cd48d90432cf298af9f833e0cc7914bc84b91573cbe5434da51` |
| composition | [composition-live-1.png](android/composition-final/composition-live-1.png) | 1 | `a8c4f2514bde740e89fb2400350f83e30d03250e4d3b592fa95780471d599fbc` |
| composition | [composition-live-2.png](android/composition-final/composition-live-2.png) | 2 | `a032c9540bd7ca9a62997915be31872b2213412f2c1914ff05825ee646696410` |
| window | [cold1.png](android/window-final/cold1.png) | 1 | `37f591b126507e0e8ab2c1c0309ae3981373f2f698dca6f795ae4e8ce3fd7763` |
| window | [live2.png](android/window-final/live2.png) | 2 | `fc780faeed68cf993367737fcdd97ad2e4ec44aee0f3ef00b15decdecdab5593` |
| window | [return1.png](android/window-final/return1.png) | 1 | `a262d718366888d889cd196b527da3db91051fa8edb9a5088d57fab87e7cd108` |
| window | [cold2.png](android/window-final/cold2.png) | 2 | `723de2555fb2a742d2269a37bfb81d610461d6fe624f7f491e644a63689e92f4` |
| window | [resize-narrow2.png](android/window-final/resize-narrow2.png) | 2 | `c906e6024bed398eaa9c1aa626cd99463447960e107e4fbbbe9aed1e2a467b84` |
| window | [resize-restored2.png](android/window-final/resize-restored2.png) | 2 | `723de2555fb2a742d2269a37bfb81d610461d6fe624f7f491e644a63689e92f4` |
| narrow | [cold1.png](android/narrow-final/cold1.png) | 1 | `1faf58dd4d75a21f21445c0f69007276f63a02ad2f4f06a387edbb9bf6132979` |
| narrow | [live2.png](android/narrow-final/live2.png) | 2 | `c906e6024bed398eaa9c1aa626cd99463447960e107e4fbbbe9aed1e2a467b84` |
| narrow | [return1.png](android/narrow-final/return1.png) | 1 | `b13962f6a9c299de94e11b3370d7d780ad93e5b72d2f4acee7322c050cc4699b` |
| narrow | [cold2.png](android/narrow-final/cold2.png) | 2 | `65b88616207e6e9bf928797b1342d41ac271af5ec7e44cc41f0e3dcdf23382ff` |
| product-final | [converter-default.png](android/product-final/converter-default.png) | 1 | `1b00205e1e22f3fdcc664dddd735f5c884ccbb9fa9c6cc4a8fcead21f28e6153` |
| product-final | [converter-live-2.png](android/product-final/converter-live-2.png) | 2.0 | `87c5c2043591a7cb09691cd371a35f02781afaca182dc7685a77c789df6e75dc` |
| product-final | [converter-live-1.png](android/product-final/converter-live-1.png) | 1.0 | `00596543300d19b205d34af5734107d4b4cc95cf815754a9cab766100371c32d` |
| product-final | [quiz-feedback-default.png](android/product-final/quiz-feedback-default.png) | 1.0 | `9406926eed497c04148d6ae288d366cb9a9e0b9a2db8cc6617bddfe847eacf2a` |
| product-final | [quiz-feedback-live-2.png](android/product-final/quiz-feedback-live-2.png) | 2.0 | `333f204673782592bfdec4a2580908714734cda2f5805f931bf68a7c2c4cf154` |
| product-final | [quiz-feedback-live-1.png](android/product-final/quiz-feedback-live-1.png) | 1.0 | `a142a290c167e8bf17321ee7cc9c50689bd1192601c95299040b4c03d59c5d89` |
| product-final | [reference-live-2.png](android/product-final/reference-live-2.png) | 2.0 | `6f39496c8bdb6d8317a61e6d40cae111de6680e06f95f32ee97d19ec1b02af96` |
| product-final | [reference-live-1.png](android/product-final/reference-live-1.png) | 1.0 | `9072a3342afeaaae6f6d7bc388ef7a52bb019cf6cdf9cfc520d656a74328760a` |
| tile-final | [alphabet-2.png](android/tile-final/alphabet-2.png) | 2.0 | `2485bdf84463674cf2e42feb3646b84e17bc0e9b1cbc6f8e823b51a2c5ad2300` |
| tile-final | [alphabet-1.png](android/tile-final/alphabet-1.png) | 1.0 | `8dce504b05169b4c8fee73b3f20503c2ef2d80f1e9600afbc1b3de132ef14e50` |
| tile-final | [converter-2.png](android/tile-final/converter-2.png) | 2.0 | `2463d43efbe26db01687ab0251f0592e48993ee27094c655b3774f8e261dd108` |
| tile-final | [converter-1.png](android/tile-final/converter-1.png) | 1.0 | `15134605dbf5219f053b2ac014678f82590bfa03a520d48fa41023564113852e` |

## Earlier/failed candidates and target limits

Earlier Run26 candidate images remain in `android/` with `fixture-*` and original product names, with [fixture metadata](fixture-metadata.json) and [product metadata](android/metadata.json). Those are the earlier frame-only candidate, not the final candidate. In particular [old edited live2](android/fixture-editing-live2.png) has stale small editable glyphs despite a correct frame. Its [strengthened gate stays failed](../android/widget-before-report.json). Earlier failed runtime/trace screenshots remain in their corresponding `../android/*-runtime/screenshots/` diagnostic directories. The two [composition setup failures](../android/composition-setup-failed/composition-before.png) / [settled setup failure](../android/composition-setup-v2-failed/composition-before.png) precede any font transition and do not establish transition acceptance.

No new web/iOS app captures: web packaging is byte-identical to Run23, and the shared C++ non-Android token comparison is unchanged. A new iOS build/runtime is unrun; unchanged source preprocessing is not that pass. Earlier native/browser failures remain at their original scopes, every human M11 result remains unperformed, and complete P10.7 cross-target/screens/state coverage stays open. Android F1 raster/default integration is engineering, not a missing human input.
