# Run 09 actual screenshot evidence

17 November 2026. **43 inspected actual PNG captures**: 21 web, 14 android, 8 ios. No mockups or AI images. Native runtimes serialized.

[Source identity](../source-identity.json), [all per-image metadata/hashes](all-metadata.json), [web artifacts](../web/artifact.json), [Android APK + loaded JS](../android/artifact.json), [iOS executable/dylib + loaded JS](../ios/artifact.json). Native binaries are unchanged and reverified; current loaded JavaScript is separately archived. Earlier measured converter tile web captures retain their original asset identity in [tiles metadata](web/tiles-metadata.json).

**Inspection:** default web/native converter, clipboard/share, cards, empty/Clear and policy frames contain actual readable app content; ordinary viewport scrolling and keyboard occlusion are labelled. Android copied frames retain OS clipboard preview/Debug warning overlays. Cold Android 2× output/export controls are readable; live 1×→2× frames explicitly fail sizing (ordinary labels stay small while tiles enlarge). iOS default Copy/Paste/Share/Menu/Clear/policy passes. Its maximum-size keyboard/input frame is a failed capture scenario; the corrected driver subsequently crashes with a native touch registry assertion. No maximum-size iOS plain-text/control pass is claimed. The alphabet font-error web image is intentional.

**Missing captures:** no supported target lacks actual changed-flow images. Successful maximum-size iOS plain text/Copy/Share captures are missing because keyboard-visible reachability failed and the corrected native drag hit RCTSurfaceTouchHandler/SIGABRT. Engineering owners P05.2/P06.2/P10.7; next ordinary-gesture reproduction in the [iOS report](../ios/README.md). Full integrated future-flow release screenshots remain P10.7.

| Target | Image / state | Settings and inspection |
|---|---|---|
| web | [alphabet-font-load-error.png](web/alphabet-font-load-error.png) — alphabet-font-load-error | system, 780×1688; intentional error |
| web | [converter-all-desktop-light-first.png](web/converter-all-desktop-light-first.png) — converter-all-desktop-light | light, 1280×1200 |
| web | [converter-all-desktop-light-last.png](web/converter-all-desktop-light-last.png) — converter-all-desktop-light | light, 1280×1200 |
| web | [converter-narrow-200-light-first.png](web/converter-narrow-200-light-first.png) — converter-narrow-200-light | light, 640×1136 |
| web | [converter-narrow-200-light-last.png](web/converter-narrow-200-light-last.png) — converter-narrow-200-light | light, 640×1136 |
| web | [converter-narrow-dark-first.png](web/converter-narrow-dark-first.png) — converter-narrow-dark | dark, 640×1136 |
| web | [converter-narrow-dark-last.png](web/converter-narrow-dark-last.png) — converter-narrow-dark | dark, 640×1136 |
| web | [dark-320-cards.png](web/dark-320-cards.png) — cards | dark, 320×568 |
| web | [dark-320-controls-200-percent.png](web/dark-320-controls-200-percent.png) — controls-200-percent | dark, 320×568 |
| web | [dark-320-copied.png](web/dark-320-copied.png) — copied | dark, 320×568 |
| web | [dark-320-copy-denied.png](web/dark-320-copy-denied.png) — copy-denied | dark, 320×568 |
| web | [dark-320-empty.png](web/dark-320-empty.png) — empty | dark, 320×568 |
| web | [dark-320-plain-200-percent.png](web/dark-320-plain-200-percent.png) — plain-200-percent | dark, 320×568 |
| web | [dark-320-share-fallback.png](web/dark-320-share-fallback.png) — share-fallback | dark, 320×568 |
| web | [light-1280-cards.png](web/light-1280-cards.png) — cards | light, 1280×900 |
| web | [light-1280-copied.png](web/light-1280-copied.png) — copied | light, 1280×900 |
| web | [light-1280-copy-denied.png](web/light-1280-copy-denied.png) — copy-denied | light, 1280×900 |
| web | [light-1280-empty.png](web/light-1280-empty.png) — empty | light, 1280×900 |
| web | [light-1280-privacy.png](web/light-1280-privacy.png) — Clipboard and Share policy | light, 1280×900 |
| web | [light-1280-share-fallback.png](web/light-1280-share-fallback.png) — share-fallback | light, 1280×900 |
| web | [light-320-privacy.png](web/light-320-privacy.png) — Clipboard and Share policy | light, 320×900 |
| android | [cards-dark.png](android/cards-dark.png) — Shared portrait cards with retained input | dark, 720×1600, font 1.0 |
| android | [cleared-dark.png](android/cleared-dark.png) — Clear removes output and cancels playback | dark, 720×1600, font 1.0 |
| android | [controls-cold-scale2.png](android/controls-cold-scale2.png) — Cold 2x copy/share controls | dark, 720×1600, font 2 |
| android | [controls-live-scale2.png](android/controls-live-scale2.png) — Existing export controls after live 1x to 2x; readability observation | dark, 720×1600, font 2.0; FAILED live size invalidation |
| android | [copied-dark.png](android/copied-dark.png) — Actual native clipboard and status | dark, 720×1600, font 1.0 |
| android | [empty-dark.png](android/empty-dark.png) — Empty converter with Clear and policy | dark, 720×1600, font 1.0 |
| android | [input-dark.png](android/input-dark.png) — Ordinary keyboard input and normalization | dark, 720×1600, font 1.0 |
| android | [menu-return-before.png](android/menu-return-before.png) — Menu before returning to converter | dark, 720×1600, font 1.0 |
| android | [plain-before-live-scale2.png](android/plain-before-live-scale2.png) — Existing plain text at 1x before live transition | dark, 720×1600, font 1.0; FAILED live size invalidation |
| android | [plain-cold-scale2.png](android/plain-cold-scale2.png) — Cold 2x plain text and omission disclosure | dark, 720×1600, font 2 |
| android | [plain-dark.png](android/plain-dark.png) — Plain text, omission marker and export controls | dark, 720×1600, font 1.0 |
| android | [plain-live-scale2.png](android/plain-live-scale2.png) — Existing plain text after live 1x to 2x; readability observation | dark, 720×1600, font 2.0; FAILED live size invalidation |
| android | [privacy-copy-share.png](android/privacy-copy-share.png) — Clipboard/share privacy disclosure | dark, 720×1600, font 1.0 |
| android | [share-sheet.png](android/share-sheet.png) — Actual Android system share sheet | system, 720×1600, font 1.0 |
| ios | [cards-dark.png](ios/cards-dark.png) — cards-dark | dark, 1206×2622, large |
| ios | [cleared-dark.png](ios/cleared-dark.png) — cleared-dark | dark, 1206×2622, large |
| ios | [clipboard-paste-dark.png](ios/clipboard-paste-dark.png) — clipboard-paste-dark | dark, 1206×2622, large; keyboard visible |
| ios | [copied-dark.png](ios/copied-dark.png) — copied-dark | dark, 1206×2622, large; keyboard visible |
| ios | [empty-dark.png](ios/empty-dark.png) — empty-dark | dark, 1206×2622, large |
| ios | [maximum-keyboard-unreachable.png](ios/maximum-keyboard-unreachable.png) — FAILED maximum accessibility-size keyboard/input; Copy/output/control acceptance unverified | dark, 1206×2622, accessibility-extra-extra-extra-large; FAILED / controls unverified |
| ios | [privacy-copy-share-dark.png](ios/privacy-copy-share-dark.png) — privacy-copy-share-dark | dark, 1206×2622, large |
| ios | [share-sheet-dark.png](ios/share-sheet-dark.png) — share-sheet-dark | dark, 1206×2622, large |
