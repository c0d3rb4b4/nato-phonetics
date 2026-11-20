# Run 13 production browser verification

Actual independent production build, isolated Puppeteer 24.43.1 / Microsoft Edge 157.0.4341.60. Node 22.23.0. Browser speech callbacks and storage failure branches are deliberately controlled; successful persistence/reload uses actual browser storage.

```sh
NODE_PATH=/Users/mac/.npm/_npx/e5f4bcd55d2c7c9f/node_modules BROWSER_EXECUTABLE='/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge' PATH=/tmp/nato-phonetics-toolchain/node_modules/.bin:$PATH node scripts/verify-progress-browser.cjs dist docs/evidence/run13/final-web
```

[Final suite passes](progress-final.log) for desktop/light 1280×900 and narrow/dark 320×568 with actual 200% text enlargement. It checks empty due/focus fallback, exact five guarded answers with double taps, deliberate quota failure/unsaved status/Retry, actual saved aggregate schema, reload persistence, Reset Preferences retention, one-symbol due review, last-miss recovery, fixed/capped review set, confirmed/cancelled/failed deletion/Retry, preference/unrelated-key retention and unsupported-version preservation with no false empty summary. Final controls contain their labels. [Driver](../../../../scripts/verify-progress-browser.cjs).

The first driver queried the question before Start committed; [failure retained](progress-first.log), corrected with explicit rendered-state waits. The first passing screenshots revealed that deletion errors appeared above the long page, away from controls. Product correction places them beside deletion; final full suite/captures rerun afterward. [Prior captures](pre-final-captures/metadata.json) remain separate; primary [final originals](../screenshots/index.md) are byte-preserved copies of `final-web/screenshots/web`.

Affected existing regressions pass: [recall](recall-regression.log) (including exactly 43 saved submissions per viewport, concealed answers and memory-only drafts), [letter sessions](letter-regression.log), [numeric/mixed/example](numeric-regression.log), and [app/direct-route/audio/voice](routes-regression.log) (all 13 routes in six stored/system appearance combinations). Engine/fonts/design/tolerances are unchanged. No broad unchanged native raster sweep is inferred.

[Support capture driver](support-captures.cjs) asserts and captures updated Home, Audio Help, Privacy and About at desktop/mobile widths on the final build; [log](support-captures.log). Those support images use default text; the progress suite supplies 200% states. CI adds progress regression/evidence upload; hosted CI unrun. Offline/hosted routing, other browsers, real provider audio/privacy and physical AT remain unqualified or M11 as appropriate.
