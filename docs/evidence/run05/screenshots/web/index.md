# Run 05 web screenshots

Actual production browser captures from 17 November 2026 after baseline and contrast/pressed-feedback repairs. All 32 were visually inspected. [Edg/157.0.4341.60 metadata](metadata.json) records OS, dimensions, device pixel ratio, theme, text scale and hashes. These are web evidence only. See [web verification report](../../web/README.md).

| Capture | Viewport / pixel ratio | Theme / text scale |
|---|---|---|
| [alphabet-desktop-light-first.png](alphabet-desktop-light-first.png) | 1280×1100 / 1 | light / 1× |
| [alphabet-desktop-light-last.png](alphabet-desktop-light-last.png) | 1280×1100 / 1 | light / 1× |
| [alphabet-live-window-resize-last.png](alphabet-live-window-resize-last.png) | 568×320 / 1 | light / 1× |
| [alphabet-desktop-light-pressed.png](alphabet-desktop-light-pressed.png) | 1280×1100 / 1 | light / 1× |
| [alphabet-tablet-dark-first.png](alphabet-tablet-dark-first.png) | 768×1024 / 2 | dark / 1× |
| [alphabet-tablet-dark-last.png](alphabet-tablet-dark-last.png) | 768×1024 / 2 | dark / 1× |
| [alphabet-narrow-light-first.png](alphabet-narrow-light-first.png) | 320×568 / 2 | light / 1× |
| [alphabet-narrow-light-last.png](alphabet-narrow-light-last.png) | 320×568 / 2 | light / 1× |
| [alphabet-phone-dark-first.png](alphabet-phone-dark-first.png) | 430×932 / 3 | dark / 1× |
| [alphabet-phone-dark-last.png](alphabet-phone-dark-last.png) | 430×932 / 3 | dark / 1× |
| [alphabet-landscape-light-first.png](alphabet-landscape-light-first.png) | 932×430 / 3 | light / 1× |
| [alphabet-landscape-light-last.png](alphabet-landscape-light-last.png) | 932×430 / 3 | light / 1× |
| [alphabet-narrow-200-dark-first.png](alphabet-narrow-200-dark-first.png) | 320×568 / 2 | dark / 2× |
| [alphabet-narrow-200-dark-last.png](alphabet-narrow-200-dark-last.png) | 320×568 / 2 | dark / 2× |
| [alphabet-narrow-300-overflow-light-first.png](alphabet-narrow-300-overflow-light-first.png) | 320×568 / 2 | light / 3× |
| [alphabet-narrow-300-overflow-light-last-right-edge.png](alphabet-narrow-300-overflow-light-last-right-edge.png) | 320×568 / 2 | light / 3× |
| [alphabet-narrow-300-overflow-light-last-left-edge.png](alphabet-narrow-300-overflow-light-last-left-edge.png) | 320×568 / 2 | light / 3× |
| [alphabet-tablet-200-light-first.png](alphabet-tablet-200-light-first.png) | 1024×768 / 2 | light / 2× |
| [alphabet-tablet-200-light-last.png](alphabet-tablet-200-light-last.png) | 1024×768 / 2 | light / 2× |
| [converter-all-desktop-light-first.png](converter-all-desktop-light-first.png) | 1280×1200 / 1 | light / 1× |
| [converter-all-desktop-light-last.png](converter-all-desktop-light-last.png) | 1280×1200 / 1 | light / 1× |
| [converter-narrow-dark-first.png](converter-narrow-dark-first.png) | 320×568 / 2 | dark / 1× |
| [converter-narrow-dark-last.png](converter-narrow-dark-last.png) | 320×568 / 2 | dark / 1× |
| [converter-narrow-200-light-first.png](converter-narrow-200-light-first.png) | 320×568 / 2 | light / 2× |
| [converter-narrow-200-light-last.png](converter-narrow-200-light-last.png) | 320×568 / 2 | light / 2× |
| [quiz-narrow-light-first.png](quiz-narrow-light-first.png) | 320×568 / 2 | light / 1× |
| [quiz-narrow-light-revealed.png](quiz-narrow-light-revealed.png) | 320×568 / 2 | light / 1× |
| [quiz-narrow-light-feedback.png](quiz-narrow-light-feedback.png) | 320×568 / 2 | light / 1× |
| [quiz-narrow-200-dark-first.png](quiz-narrow-200-dark-first.png) | 320×568 / 2 | dark / 2× |
| [quiz-narrow-200-dark-revealed.png](quiz-narrow-200-dark-revealed.png) | 320×568 / 2 | dark / 2× |
| [quiz-narrow-200-dark-feedback.png](quiz-narrow-200-dark-feedback.png) | 320×568 / 2 | dark / 2× |
| [alphabet-font-load-error.png](alphabet-font-load-error.png) | 390×844 / 2 | system / 1× |

The 300% narrow captures deliberately show separate reachable left/right edges of a 330-unit tile in a 288-unit content viewport. The pressed capture holds the actual pointer on Charlie, retaining full opacity and geometry. Quiz randomness uses test-driver seed 20261117 for reproducible hidden/revealed/feedback comparisons; the production app and speech provider remain unchanged. Fifteen matched raster comparisons all pass; numerical and AX checks are separate.
