# Run 12 production browser checks

Node 22.23.0 / isolated Puppeteer 24.43.1 / Microsoft Edge 157.0.4341.60. Command prefix:

```sh
NODE_PATH=/Users/mac/.npm/_npx/e5f4bcd55d2c7c9f/node_modules BROWSER_EXECUTABLE='/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge' PATH=/tmp/nato-phonetics-toolchain/node_modules/.bin:$PATH
```

- `node scripts/verify-recall-browser.cjs dist docs/evidence/run12/final-web`: [pass](recall-final.log), production desktop light 1280×900 and dark 320×568 with actual 200% text enlargement. Listening: no answer tile/symbol/guide in DOM/AX before submission, four distinct symbol choices, five unique digits, canonical speech inputs, Play/replay/Stop/Menu, deliberate synthesis failure then Play/text recovery, feedback/80% score/unique-mistake Retry. Typed: all 36 symbols, documented Alfa/Juliett/X-ray aliases, blank validation, exact draft retained through Menu, Enter/double-Enter, exact response, 35/36 score and successful Retry. Stale provider callbacks do not resume audio; no new `nato.*` saved key. Controlled browser speech verifies state/input/lifecycle, not real listening or provider privacy.
- Existing `verify-sessions-browser.cjs` and `verify-numeric-browser.cjs`: [letter](letter-regression.log) / [numeric](numeric-regression.log) pass desktop/narrow/200%. Repeated because engine/UI changed, not to broaden unchanged tile raster/runtime work. Supplemental raw images remain under local `artifacts/run12/letter-regression` and `artifacts/run12/numeric-regression`; durable logs plus primary recall captures are retained here.
- `node docs/evidence/run12/web/support-captures.cjs`: actual Home/help/privacy content assertions and desktop/mobile captures on final build. [Final log](support-captures-final.log), [source](support-captures.cjs). The first support captures showed the page top; final capture alignment scrolls the changed copy into view, preserving the earlier images under pre-support-alignment. CI adds recall suite and upload; hosted CI unrun.

[Actual final images/metadata](../screenshots/index.md). Initial pre-help browser captures are preserved in [pre-final-captures](pre-final-captures/metadata.json); final recall originals are copied unchanged from `final-web/screenshots/web` into the primary index. Browser “typed-keyboard” filenames show a focused draft in headless web; they do not depict an OS soft keyboard. Deliberate error frames are labelled; viewport edges show scrolling, not a whole-content image. No blank/loading capture accepted. The final source build differs from the initial build only in discovery/help/privacy copy; recall implementation is unchanged.

Full provider speech, physical keyboard/AT, offline web/real hosting and final integrated P10/M11 acceptance remain unperformed. No new support claim for other browsers/runtimes.
