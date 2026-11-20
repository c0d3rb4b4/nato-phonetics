# Run 05 actual screenshot index

17 November 2026. **83 actual captures: 32 web, 18 Android, 33 iOS.** Images come from the running production web build and installed native apps. They include observed failures where labelled; a capture or tile-only assertion is not a whole-screen acceptance pass. Prior baseline/color/scaling candidates are retained under diagnostic directories and excluded from these counts.

Candidate: [maintained source identity](../source-identity.json), [web bundle/font identity](web/metadata.json), [Android APK and actually loaded Metro JavaScript](../android/artifact.json), [unsigned iOS executable/JavaScript/fonts/ZIP](../ios/artifact.json). The Android-only inverse-cache repair leaves the web and iOS code/artifacts unchanged. [Independent hash and image-membership verification](../artifact-verification.json).

| Target | Actual environment and capture method | Coverage / inspection |
|---|---|---|
| Web | macOS Edge 157.0.4341.60; production `dist/`; Puppeteer actual page screenshots | 320px through desktop/tablet/landscape, both themes, 1/2/3 density, 200%/300% text, live window resize, all letters/digits, converter/quiz, font-error and held-pointer state. [Every image and command](web/index.md), [metadata](web/metadata.json), [report](../web/README.md). |
| Android | Android 16/API 36 installed debug app on `nato-p00-api36`; `adb -s emulator-5580 exec-out screencap -p` | Default/enlarged text, actual live font-size transitions, all letters/converter/quiz, themes and display/orientation/density cases. [Metadata](android/metadata.json), [commands/results and exact remaining gaps](../android/README.md). |
| iOS | iPhone 17 Pro, iPhone 16e and iPad Pro 11 M5, iOS/iPadOS 26.2; actual `XCUIScreen.main.screenshot()` PNG attachments exported with `xcresulttool` | 3×/2× density, all letters/context comparisons, hidden/revealed quiz, light/dark, phone/tablet/orientations, maximum accessibility text/overflow and actual iPad window resize. [Metadata](ios/metadata.json), [commands/results](../ios/README.md). Landscape PNGs retain EXIF orientation; metadata distinguishes encoded from displayed dimensions. |

Every image was inspected by the platform/evidence reviewers; metadata records findings and the platform reports state the limits of automated assertions. Root additionally inspected representative final web, iOS portrait/window and Android returned-default captures. Partial tiles at scroll boundaries are ordinary viewport clipping only where later captures/scroll checks demonstrate complete reachability.

## Observed gaps and capture applicability

- **Android ordinary text:** actual font-size transitions preserve repaired tiles, but the full instruction loses its second sentence at 200% and after returning to 100%; the returned-default header also remains oversized. This is open P05.2/P05.8/R06/R07 engineering. [Repaired tiles with remaining text defect](android/alphabet-transition-2-scale1.png), [diagnosis and strict transition results](../android/live-font-scale-diagnosis.md).
- **Android converter numerical fidelity:** digit 3’s TREE guide top edge is −2.012 physical px from the nominal outline versus the unchanged 2 px raster/antialias envelope. Independent baseline/rounded-size/faint-alpha analysis explains the tiny support edge, but the raw gate remains a P05.8 failure. Visual inspection does not override it. [Exact result and diagnostic](../android/README.md).
- **iPad window header:** [the actual smaller app window](ios/ipad-window-small.png) shows OS controls over Home. Tile size/reflow/restoration pass; navigation appearance does not. [Exact window test/scope](../ios/window-resize-report.md). P05.2/P05.8 remain open.
- **Android app-window resize:** display overrides and rotations do not establish actual freeform/split-screen resizing. Required real multi-window coverage remains P05.8 engineering. [Investigation and next commands](../native-window-resize-investigation.md).
- **iOS maximum-category coverage:** enlarged A/B, quiz reachability and oversize scrolling were exercised; maximum-category long November/Uniform and all-26 raster captures remain unrun. Default all-26/long labels are covered. iOS Release baseline events were not separately exposed; recorded font-outline raster/frame comparisons are not a claim of an event-baseline gate. These precise gaps stay in P05.8.
- No supported platform lacks captures for the changed tile flows. Physical devices/assistive technology, audible/provider/offline behavior and release acceptance remain M11. iOS 27 runtime and hosted CI remain unverified. P10.7's integrated-candidate Home/settings/voice/new-mode/result set is still unfinished; this batch does not claim it.
- The pure P07.2 session module has no UI consumer, so screenshots are not applicable. The HTML tile reference is a design fixture, never screenshot evidence.

## Android capture inventory

Pixel sizes below describe actual screenshots; DPI, system text settings, timestamps and hashes remain in metadata. The platform report distinguishes cold-state proofs, passing tile transition checks and the remaining ordinary-text failure.

| Actual image / state | Pixels | System text scale | Theme / finding |
|---|---|---:|---|
| [Final candidate scale sequence, stage 0: 1× (cold start)](android/alphabet-transition-0-scale1.png) | 720×1600 | 1 | light |
| [Final candidate scale sequence, stage 1: 2× (live transition)](android/alphabet-transition-1-scale2.png) | 720×1600 | 2.0 | light; **open:** Shared tiles retain their composition. Non-tile title/instruction enlarges or clips during live text-scale changes; the second instruction clause is absent in initial/returned views. Normal scroll-edge tile fragments are not internal clipping. |
| [Final candidate scale sequence, stage 2: 1× (live transition)](android/alphabet-transition-2-scale1.png) | 720×1600 | 1.0 | light; **open:** Shared tiles retain their composition. Non-tile title/instruction enlarges or clips during live text-scale changes; the second instruction clause is absent in initial/returned views. Normal scroll-edge tile fragments are not internal clipping. |
| [Final candidate scale sequence, stage 3: 2× (live transition)](android/alphabet-transition-3-scale2.png) | 720×1600 | 2.0 | light; **open:** Shared tiles retain their composition. Non-tile title/instruction enlarges or clips during live text-scale changes; the second instruction clause is absent in initial/returned views. Normal scroll-edge tile fragments are not internal clipping. |
| [Final candidate scale sequence, stage 4: 1× (live transition)](android/alphabet-transition-4-scale1.png) | 720×1600 | 1.0 | light; **open:** Shared tiles retain their composition. Non-tile title/instruction enlarges or clips during live text-scale changes; the second instruction clause is absent in initial/returned views. Normal scroll-edge tile fragments are not internal clipping. |
| [Alphabet page 0; real native tile rectangles measured](android/alphabet-light-0.png) | 720×1600 | 1.0 | light |
| [Alphabet page 1; real native tile rectangles measured](android/alphabet-light-1.png) | 720×1600 | 1.0 | light |
| [Alphabet page 2; real native tile rectangles measured](android/alphabet-light-2.png) | 720×1600 | 1.0 | light |
| [Populated converter NUWJ359, same tile composition](android/converter-light.png) | 720×1600 | 1.0 | light; **open:** Raw nominal font-outline support gate observes TREE guide top−2.012 physical px against strict2px envelope. Actual baseline passes; faint alpha and integer font rounding analyzed separately. Visual inspection does not override this numerical failure. |
| [Quiz unrevealed answer, portrait shared tile](android/quiz-question-light.png) | 720×1600 | 1.0 | light |
| [Quiz revealed answer and persistent feedback](android/quiz-feedback-light.png) | 720×1600 | 1.0 | light |
| [Alphabet in dark app theme](android/alphabet-dark.png) | 720×1600 | 1.0 | dark |
| [Actual systemfontscale2; whole220x300 tile and compensated glyphmetrics](android/alphabet-font-scale2.png) | 720×1600 | 2.0 | dark; **open:** Shared tiles retain their composition. Non-tile title/instruction enlarges or clips during live text-scale changes; the second instruction clause is absent in initial/returned views. Normal scroll-edge tile fragments are not internal clipping. |
| [Long word/guide at actual2x accessibilityscale: N](android/alphabet-font-scale2-N.png) | 720×1600 | 2.0 | dark; **open:** Shared tiles retain their composition. Non-tile title/instruction enlarges or clips during live text-scale changes; the second instruction clause is absent in initial/returned views. Normal scroll-edge tile fragments are not internal clipping. |
| [Actual2x Uniform long word/guide, reached with bounded bidirectional scroll](android/alphabet-font-scale2-U.png) | 720×1600 | 2.0 | dark; **open:** Shared tiles retain their composition. Non-tile title/instruction enlarges or clips during live text-scale changes; the second instruction clause is absent in initial/returned views. Normal scroll-edge tile fragments are not internal clipping. |
| [Actual native viewport/configuration: alphabet-narrow-320x568](android/alphabet-narrow-320x568.png) | 640×1136 | 1.0 | light |
| [Actual native viewport/configuration: alphabet-landscape-568x320](android/alphabet-landscape-568x320.png) | 1136×640 | 1.0 | light |
| [Actual native viewport/configuration: alphabet-tablet-1067x1707](android/alphabet-tablet-1067x1707.png) | 1600×2560 | 1.0 | light |

## iOS capture inventory

Viewport sizes are logical points; ordinary simulator screenshots retain the device display, while actual window-resize images show the OS window on the iPad display. The separate resize metadata records exact app-window coordinates and dimensions.

| Actual image / state | Device / viewport | Text scale | Theme / finding |
|---|---|---:|---|
| [phone alphabet landscape dark](ios/phone-alphabet-landscape-dark.png) | iPhone17Pro, 874×402 | 1 | dark |
| [phone alphabet dark](ios/phone-alphabet-dark.png) | iPhone17Pro, 402×874 | 1 | dark |
| [phone quiz feedback light](ios/phone-quiz-feedback-light.png) | iPhone17Pro, 402×874 | 1 | light |
| [phone quiz question light](ios/phone-quiz-question-light.png) | iPhone17Pro, 402×874 | 1 | light |
| [phone converter light](ios/phone-converter-light.png) | iPhone17Pro, 402×874 | 1 | light |
| [phone alphabet last light](ios/phone-alphabet-last-light.png) | iPhone17Pro, 402×874 | 1 | light |
| [phone alphabet page 2 light](ios/phone-alphabet-page-2-light.png) | iPhone17Pro, 402×874 | 1 | light |
| [phone alphabet page 1 light](ios/phone-alphabet-page-1-light.png) | iPhone17Pro, 402×874 | 1 | light |
| [phone alphabet page 0 light](ios/phone-alphabet-page-0-light.png) | iPhone17Pro, 402×874 | 1 | light |
| [phone alphabet first light](ios/phone-alphabet-first-light.png) | iPhone17Pro, 402×874 | 1 | light |
| [accessibility max quiz accessibility feedback reachable](ios/accessibility-max-quiz-accessibility-feedback-reachable.png) | iPhone17Pro, 402×874 | 3.571 | light |
| [accessibility max quiz accessibility question](ios/accessibility-max-quiz-accessibility-question.png) | iPhone17Pro, 402×874 | 3.571 | light |
| [accessibility max alphabet accessibility scroll](ios/accessibility-max-alphabet-accessibility-scroll.png) | iPhone17Pro, 402×874 | 3.571 | light |
| [accessibility max alphabet accessibility first](ios/accessibility-max-alphabet-accessibility-first.png) | iPhone17Pro, 402×874 | 3.571 | light |
| [tablet alphabet viewport landscape](ios/tablet-alphabet-viewport-landscape.png) | iPad Pro11-inch(M5), 1210×834 | 1 | light |
| [tablet alphabet viewport last](ios/tablet-alphabet-viewport-last.png) | iPad Pro11-inch(M5), 834×1210 | 1 | light |
| [tablet alphabet viewport portrait](ios/tablet-alphabet-viewport-portrait.png) | iPad Pro11-inch(M5), 834×1210 | 1 | light |
| [narrow alphabet viewport landscape](ios/narrow-alphabet-viewport-landscape.png) | iPhone16e, 844×390 | 1 | light |
| [narrow alphabet viewport last](ios/narrow-alphabet-viewport-last.png) | iPhone16e, 390×844 | 1 | light |
| [narrow alphabet viewport page 2](ios/narrow-alphabet-viewport-page-2.png) | iPhone16e, 390×844 | 1 | light |
| [narrow alphabet viewport page 1](ios/narrow-alphabet-viewport-page-1.png) | iPhone16e, 390×844 | 1 | light |
| [narrow alphabet viewport page 0](ios/narrow-alphabet-viewport-page-0.png) | iPhone16e, 390×844 | 1 | light |
| [narrow alphabet viewport portrait](ios/narrow-alphabet-viewport-portrait.png) | iPhone16e, 390×844 | 1 | light |
| [overflow alphabet accessibility overflow scrolled](ios/overflow-alphabet-accessibility-overflow-scrolled.png) | iPhone16e, 390×844 | 3.571 | light |
| [overflow alphabet accessibility overflow right](ios/overflow-alphabet-accessibility-overflow-right.png) | iPhone16e, 390×844 | 3.571 | light |
| [references alphabet reference 4 light](ios/references-alphabet-reference-4-light.png) | iPhone17Pro, 402×874 | 1 | light |
| [references alphabet reference 3 light](ios/references-alphabet-reference-3-light.png) | iPhone17Pro, 402×874 | 1 | light |
| [references alphabet reference 2 light](ios/references-alphabet-reference-2-light.png) | iPhone17Pro, 402×874 | 1 | light |
| [references alphabet reference 1 light](ios/references-alphabet-reference-1-light.png) | iPhone17Pro, 402×874 | 1 | light |
| [references alphabet reference 0 light](ios/references-alphabet-reference-0-light.png) | iPhone17Pro, 402×874 | 1 | light |
| [ipad window restored](ios/ipad-window-restored.png) | iPad Pro11-inch (M5), —×— | 1 | light (observed) |
| [ipad window small](ios/ipad-window-small.png) | iPad Pro11-inch (M5), —×— | 1 | light (observed); **open:** iPadOS traffic-light window controls overlap Home icon; tile geometry assertions do not verify navigation reachability. |
| [ipad window before](ios/ipad-window-before.png) | iPad Pro11-inch (M5), —×— | 1 | light (observed) |
