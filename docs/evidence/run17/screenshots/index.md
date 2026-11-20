# Run 17 actual screenshot index

18 November 2026. **16 original inspected captures**:6 web,5 iOS,5 Android. [Source identity](../source-identity.json), [all metadata/hashes](metadata.json), [reconciliation](../verification.json).

Production web is Edge157 at1280×900/light and320×568/dark, DPR1; current JS/worker/full shell is byte-identical to Run16. iOS is the actually installed rebuilt unsigned Release on iPhone17Pro/iOS26.2,402×874pt/DPR3/default Large/Light. Android is the actually installed rebuilt Debug APK plus archived actually loaded Metro0.83.8 graph, Android16/API36 arm64,720×1600/280dpi/fontScale1/Light. Exact times/commands/viewports/themes/image hashes are in each platform's metadata. Native artifact identities: [iOS](../ios/artifact.json), [Android](../android/artifact.json); [unsigned Release AAB](../android/release-artifact.json) is separately identified and is not the installed Debug product.

Each image was visually inspected for real content, readable visible text, blank/loading/error states and clipping. Native keyboard/scroll-edge crops and retained Android generic Debug warnings are recorded; no warnings are suppressed and no sole-cause claim is made. These default/scoped samples do not close native P1/P3 or P10.7's full final matrix.

| Target/image | Observed state / limits |
|---|---|
| web / [desktop-pointer-progress.png](web/desktop-pointer-progress.png) | Four saved exact pointer submissions; top explanatory text partly outside viewport. |
| web / [desktop-converter.png](web/desktop-converter.png) | Complete plain conversion; scrolled viewport crops top controls and lower tiles. |
| web / [desktop-alphabet.png](web/desktop-alphabet.png) | Production reference/font sample; later rows continue below viewport. |
| web / [narrow-pointer-progress.png](web/narrow-pointer-progress.png) | Same four saved answers in second live page; saved rows continue below viewport. |
| web / [narrow-converter.png](web/narrow-converter.png) | Complete wrapped plain conversion; other controls/tiles continue outside viewport. |
| web / [narrow-alphabet.png](web/narrow-alphabet.png) | 320px dark reference; later rows continue below viewport. |
| ios / [release-digits.png](ios/release-digits.png) | Native Release digits; later rows continue below viewport. |
| ios / [release-alphabet.png](ios/release-alphabet.png) | Native Release reference; later rows continue below viewport. |
| ios / [release-converter-copy.png](ios/release-converter-copy.png) | Complete conversion and Copy assertion with keyboard visible; lower content outside viewport. |
| ios / [release-converter-keyboard.png](ios/release-converter-keyboard.png) | Exact individual-key input a3 b! with keyboard visible. |
| ios / [release-long-phrase-stopped.png](ios/release-long-phrase-stopped.png) | Real long-phrase Play→Stop; complete plain conversion/retained input asserted. |
| android / [converter-playing.png](android/converter-playing.png) | Real provider playing3 of26 before verified Stop; no audible/physical pass. |
| android / [converter-copy.png](android/converter-copy.png) | Complete native plain conversion/Copy confirmation; retained generic Debug warning overlays lower content. |
| android / [converter-retained-input.png](android/converter-retained-input.png) | Exact retained a3 b! after same-live-state viewport return; Debug warning remains. |
| android / [alphabet.png](android/alphabet.png) | Visible native reference rows/fonts; lower viewport edge and Debug warning crop later rows. |
| android / [digits.png](android/digits.png) | Visible native digits/fonts; lower viewport edge and Debug warning crop later rows. |

No changed-target capture is missing: actual web, installed Android and installed iOS are covered. No additional native target is configured. P10.7 still needs the full integrated candidate matrix after remaining implementation/native/security gates; physical devices/AT/listening/provider/other-runtime/signed/hosted acceptance remains unperformed. Original Run16 policy clipping and prior strict fidelity failures are preserved and not requalified by these images.

Failed commands stay separate: [initial iOS no-focus image](../ios/initial-no-input-focus.png), [iOS command/source scope](../ios/README.md), [Android original offscreen lookup and same-live-state follow-up](../android/README.md), [initial web pointer-selector failure](../shared/pointer-check.log). None is relabelled as a whole-command pass.
