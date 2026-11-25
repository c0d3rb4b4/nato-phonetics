# Shared controls and tile design

Reference, Word Converter and Letter Quiz use the same phonetic tile. Pastel colours identify symbols. Navigation, choices and actions use the app theme. Shared controls expose checked states, allow wrapping at large text sizes and draw keyboard focus without moving other content. Play and Stop share a 48 × 48 control beside the content they play. [Shared controls](../src/components/ui.js) · [Playback controls](../src/components/PlaybackControls.js)

## Tile geometry

At default text size, tiles are 100–110 logical units wide and 150 tall. The grid measures its available width and fits as many columns as it can at the 100-unit minimum, with 8 units between columns. It shares the remaining width across those columns up to 110 per tile. A partial final row stays centered with the same tile widths. With the standard 16-unit screen margins, three tiles fit from a screen width of 348 and four from 456. Enlarging text raises the minimum tile width and lets the grid show fewer columns. [Grid sizing](../src/lib/tileDesign.js) · [Tile component](../src/components/NatoTile.js)

The tile has a radius of 12. Its 60-unit header includes a 2-unit divider. The following coordinates are relative to the top left of a 110-unit tile. On narrower tiles the text boxes keep the same side insets, font sizes and baselines. The letter and word use `#1F2933`, and the italic guide uses `#374151`.

| Element | Position (x, y) | Box (width × height) | Face and size | Baseline y |
| --- | --- | --- | --- | ---: |
| Letter | 0, 4 | 110 × 50 | NatoTile-ExtraBold, 36 | 40.844 |
| Word | 8, 83 | 94 × 22 | NatoTile-SemiBold, 16 | 99.264 |
| Pronunciation | 8, 111 | 94 × 16 | NatoTile-Italic, 11 | 122.619 |

The measured text baseline is aligned inside each fixed box. Font size, line height and geometry share one scale factor. Android converts the target sizes through the current system SP metrics so nonlinear accessibility scaling still preserves the whole tile. Web measures the root text size. The grid wraps into fewer columns as tiles grow and allows horizontal scrolling when a single tile exceeds the available width.

## Fonts

The bundled TTFs are static instances of Nunito under the SIL Open Font License. The manifest records upstream and generated hashes, weights, PostScript names and metrics. [Pinned upstream revision](https://github.com/googlefonts/nunito/tree/8c6a9bb9732545b9ed53f29ec5e1ab0ff53c4e6f) · [Font manifest](../assets/fonts/manifest.json) · [License](../assets/fonts/OFL-Nunito.txt)

To regenerate, use fontTools 4.60.2 and the pinned upstream regular and italic variable fonts. Put them in a directory as `Nunito.ttf` and `Nunito-Italic.ttf`, then run `python assets/fonts/generate-static-fonts.py <source-directory>` from the repository root. Review the new hashes, copy the generated faces to `android/app/src/main/assets/fonts/` and rebuild the native apps. iOS and the web build use the shared asset directory.

## Visual checks

Serve the repository root locally, for example with `python -m http.server 8095 --bind 127.0.0.1`. Open `/docs/fixtures/tile-reference.html` to compare all 26 letters at the preferred 110-unit width. Check Reference, converter Full cards and concealed and revealed quiz tiles in both themes, at default and maximum text size. Scroll to the partial final row and both edges of oversized tiles. [Letter reference fixture](fixtures/tile-reference.html)

The layout tolerance is one physical pixel for edges and baselines, with one additional physical pixel for rasterised glyph fringes. Maximum-size India and Juliett on high-density iPhones have previously exceeded the ink tolerance. Check those words when changing fonts or rendering, and use VoiceOver and TalkBack to verify that concealed quiz answers stay hidden.
