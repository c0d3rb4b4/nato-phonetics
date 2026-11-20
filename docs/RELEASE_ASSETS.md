# Release artwork and regeneration

The speech-bubble, A and waves retain the original artwork in [test.svg](../assets/images/test.svg), which stays as historical source evidence. Production sources are [icon.svg](../assets/images/icon.svg), [icon-foreground.svg](../assets/images/icon-foreground.svg) and the dedicated transparent [icon-monochrome.svg](../assets/images/icon-monochrome.svg). Lettering is outlined from the repository's OFL Nunito faces (fontTools 4.60.2); rendering no longer depends on a machine's system font. Tile font files/specification are unchanged. The full icon retains the NATO PHONETICS labels; adaptive layers use the central mark for readability at launcher sizes.

The manifest hashes the production SVG files byte for byte. Git checks out
these three files with LF endings on Windows and Unix. With the Windows
URL/path correction in the generator test, regeneration reproduced the
shipped source and PNG hashes on both Windows and Linux. [Windows checks](evidence/run31/shared/windows-gate.log) · [Linux checks](evidence/run31/shared/linux-gate.log).

Run with the pinned Node/npm toolchain:

```sh
npm run generate-icons
node --test tests/icons.test.mjs
```

The generator writes 22 verified PNG resources and [icon-manifest.json](../assets/images/icon-manifest.json). It updates web favicon, full icon, splash, separate adaptive layers, all five Android legacy launcher densities/round consumers, Android splash, and Xcode AppIcon/Splash resources. Rebuild/reinstall both native applications after regeneration; Metro refresh cannot update launcher or splash assets. The web build copies the generated favicon into `dist/`.

For review without modifying repository resources:

```sh
node scripts/generate-icons.js --output-dir /absolute/path/to/new-empty-directory
```

Custom directories must be empty or contain the generator's `.nato-icon-output` marker; no cleanup/deletion is performed. A bad source, invalid dimensions/mask, inaccessible destination or failed read-back produces a nonzero exit. The command reports completion and an output inventory only after every asset has been written and verified. A failed write may leave earlier output files; it never qualifies that partial set. Correct the failure and regenerate the complete set before building.

Android layers are 432×432 pixels representing the complete 108×108 dp adaptive canvas at 4×. Every nontransparent foreground/monochrome pixel lies inside the central 66×66 dp safe zone and its radius-33 dp circle. The background is solid `#FFFDF7`; foreground padding is transparent. Monochrome uses black RGB with alpha carrying the outline, A, waves and transparent internal holes; it is not a grayscale opaque full icon. The uniform mark scale is 0.195 from the original 512-unit artwork, centered on the bubble. This follows [Android's layer/safe-zone guidance](https://developer.android.com/develop/ui/compose/system/icon_design_adaptive), checked 18 November 2026. Native adaptive rendering applies its own layer inset, masks and tint.

Full/legacy/splash PNGs are opaque RGB. In particular the 1024×1024 iOS AppIcon has no alpha channel. The manifest records dimensions, alpha counts, painted bounds, source SHA-256 and output SHA-256. Tests regenerate into a temporary directory and compare every shipped consumer, exercise malformed masks and actual blocked output paths, preserve unrelated output, and check repeated generation. `npm test` includes these checks in CI; hosted CI execution is separate evidence.

[Run 14](evidence/run14/README.md) records actual direct builds, package-resource verification, native crop diagnostics, installed launcher/app and production browser captures. Diagnostic crop previews are labelled separately from the production application and launcher. Physical launchers/OEM masks, store branding and distribution acceptance remain in the plan's M11.4/.7 queue; these resources do not establish release readiness. P10.7's final integrated screenshot matrix remains unfinished.
