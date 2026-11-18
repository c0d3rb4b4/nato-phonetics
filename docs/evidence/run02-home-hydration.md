# Run 02: independent Home hydration diagnosis

Observed 16 November 2026, using isolated Microsoft Edge contexts and the preserved Run 01 P02 export. This investigates Home separately from the quiz's random question initialization. It does not infer a root cause from the absence of errors alone.

## Finding

Home's first hydration failure is an **Ionicons font-state mismatch**. The static P02 Home HTML contains empty icon text nodes. During browser hydration, React expects the Home alphabet card's `book-outline` glyph, U+F1A6 (decimal 61862), but there is no matching next server text node. The diagnostic captured a text fiber (`tag: 6`, text ``), followed by its DOM parent with `fontFamily: ionicons`, `fontSize: 24px`, and color `rgba(139,92,246,1.00)`. The next server hydration node and text are both `null`.

This occurs under **both light and dark OS appearance**, so a system-theme initializer is not the sole explanation. No quiz screen was visited during the reproduction. The Home menu is static; its failure is independent of quiz randomness.

The installed `@expo/vector-icons/build/createIconSet.js` initializes `fontIsLoaded` with `Font.isLoaded(fontName)`. Its render returns an empty `<Text />` until the font is loaded, and a glyph-bearing icon after loading. `expo-font/build/ExpoFontLoader.web.js` derives that state from the current server registration or browser font-face rules. These state-dependent render branches explain the observed missing server glyph and expected client glyph. The diagnostic establishes the mismatch; it does not establish the precise ordering of every earlier font-loading effect.

P03 already introduced the effective repair: `ThemeProvider` exposes a deterministic `clientReady`/preferences-loading state, and `LayoutContent` renders the same neutral loading boundary on the server and initial client render. The icon-bearing navigation/Home tree mounts after hydration. P05 preserves that boundary, separately moves quiz random selection to a post-mount effect, and uses no hydration-warning suppression. The preserved P03 final artifact renders Home without page/hydration errors in fresh light and dark contexts. P05's full route/theme/browser matrix is recorded separately; this historical diagnostic alone is not that acceptance result.

## Method and reproduction

[The diagnostic script](../../scripts/diagnose-home-hydration.cjs) serves the old export without changing any files. Only its in-memory HTTP response for the recorded production JavaScript bundle is instrumented. At React's existing hydration-failure function, it records the next hydration node and up to 15 expected fiber ancestors, then executes **the original error reporting and throw unchanged**. It neither suppresses hydration errors nor changes rendered content. The script fails when the expected historical production function marker is absent.

Run from the repository root with an external Puppeteer installation and the preserved exports:

```sh
NODE_PATH=/path/to/puppeteer/node_modules BROWSER_EXECUTABLE=/path/to/browser node scripts/diagnose-home-hydration.cjs /path/to/p02-export /path/to/p03-final-export
```

The executed command used the existing external Puppeteer24.43.1 install and `/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge`. It visited only `/`, in separate contexts for OS light and dark, with no saved preferences. [Captured JSONL evidence](run02-home-hydration.jsonl) contains browser version, artifact hashes, full captured fiber details and unchanged React #418 errors for the old artifact, followed by zero-error P03 comparison results. The exact temporary export locations in that log identify this run; they are not a promise that those local files exist on another machine.

## Artifact and source identities

The exports were generated during Run 01 from uncommitted work based on `784bb93c5cfb6edfd318d0dcec2d54d5bb222483`; there is no separate P02 commit. Artifact hashes identify the actual bytes used, rather than attributing uncommitted content to that base commit.

| Artifact/source | SHA-256 |
|---|---|
| P02 `index.html` | `dfcc93f1bbf60e4dd8a50e0f46ee113097669088350e8bb5e0944521414ac067` |
| P02 `entry-c186698d0d417b1eb0a2c4bda03a3afc.js` before in-memory instrumentation | `4309322ecd961b2f7b9fe52531bee36180d015f7241277b7faebfd9f7edd6b8d` |
| P03 final `index.html` | `4fc0c81c092c41d8aa3432cf626717c39b01d1e578a1075e4e20ac776c1a3fcc` |
| Installed `@expo/vector-icons/build/createIconSet.js` | `77bdd5ea217007407f99961dd2f6a8004515a0786fc384843611b72a4912f1c4` |
| Installed `expo-font/build/ExpoFontLoader.web.js` | `bfbdd2fd41f07d3860d55261aa220d1c613a801e0002c2e193965a69d3497efd` |
| Diagnostic script | `e9b7f15c13c868f769e38286cf619f5d85e5479cb725b839c268067b66933ee5` |

Original exports were preserved unchanged. This proves the reported browser hydration mismatch and bounded repair comparison, not native assistive-technology behavior, audible pronunciation, provider connectivity, offline web operation, or release acceptance; those checks retain their existing phase/M11 ownership.
