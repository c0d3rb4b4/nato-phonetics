# Run 14 production browser

[Build](../shared/build-web.log) uses the unchanged app/font bundle with the regenerated favicon. Complete existing `scripts/verify-app-browser.cjs dist` [passes](routes.log): all 13 direct/reload routes across stored/system themes and its navigation/control-flow/error checks. Browser speech branches are mocks, not provider/recognition/audio acceptance.

[Capture driver](capture.cjs) serves the production `dist/` via the repository handler, fetches the declared favicon as an actual HTTP response and checks its bytes against the generated resource. [Result](capture.log): two actual Home screenshots, 1280×900 light and 320×568 dark, no page errors. The favicon SHA is in [metadata](../screenshots/web/metadata.json); browser chrome is outside page screenshots, so those images do not pretend to show the tab icon.

Commands use Node22 and external Puppeteer:

```sh
NODE_PATH=/Users/mac/.npm/_npx/e5f4bcd55d2c7c9f/node_modules BROWSER_EXECUTABLE='/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge' node scripts/verify-app-browser.cjs dist
NODE_PATH=/Users/mac/.npm/_npx/e5f4bcd55d2c7c9f/node_modules BROWSER_EXECUTABLE='/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge' node docs/evidence/run14/web/capture.cjs
```

Edge 157.0.4341.60, isolated headless contexts, DPR1. [Actual originals/index](../screenshots/index.md). Narrow Home continues scrolling below the viewport; no app layout change is inferred. No unchanged all-tile/practice/storage matrix is repeated. Offline/service worker/hosted routing and concurrent-window storage remain unqualified P10/P08 work. [Recognition capability probe](../recognition/browser-capability.json) checks feature/local availability only; it never starts capture, requests a permission or installs a model.
