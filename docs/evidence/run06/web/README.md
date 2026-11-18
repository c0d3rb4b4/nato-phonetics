# Run 06 production-web regression

17 November 2026. The shared header now wraps its existing layout in a platform-specific inset component. Web uses the ordinary wrapper. The production bundle is `assets/app-4VJ4YJA7.js`, SHA-256 `ac7a0bae59aa498d0433c49ad7b90aba374faf8f0c38dad8b90cee0717f878b5`. Exact font/build/platform identity is in the [capture metadata](../screenshots/web/metadata.json).

Commands used Node 22.23.0, `NODE_PATH=/Users/mac/.npm/_npx/e5f4bcd55d2c7c9f/node_modules` and `BROWSER_EXECUTABLE='/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge'`. The browser reports `Edg/157.0.4341.60`.

| Check | Actual result |
|---|---|
| `npm run export:web` | [Pass](../shared/web-build.log); independent production build with 12 routes. |
| `node scripts/verify-app-browser.cjs dist --flows-only` | [Pass](app-flows.log); Home/Menu, keyboard, retained converter state, browser history, quiz concealment, narrow/enlarged text, keyboard-sized viewport, contrast and mocked audio lifecycle/error behavior. Full route/theme/reload matrix is deliberately not repeated; Run 05 remains historical evidence. |
| Scoped tile verifier, command below | [Pass](tiles-browser.log); 8 measured states, 113 tile measurements, actual pinned fonts and strict geometry/baseline assertions. Desktop, narrow 200% text, dark converter, hidden/revealed quiz, live viewport resize, held-pointer state and blocked-font recovery. |
| Same-renderer comparison against Run 05 | [12 comparisons](../web-tile-measurements.json), each with zero pixels exceeding the existing 32-channel tolerance; baselines were read, not overwritten. |

[All 12 actual screenshots](../screenshots/web/index.md) were individually viewed. No blank/loading screens, unexpected errors or internal text clipping were observed. Partial rows at the scroll viewport edge are reachable; the blocked-font alert is the intentional negative test. These are browser images, not native evidence. No new dependency install, hosted CI, real-provider listening or physical accessibility result is claimed.

Exact scoped tile command (with the Node/browser environment above):

```sh
TILE_QUIZ_SEED=20261117 \
TILE_CASE_FILTER='^(alphabet-desktop-light|alphabet-narrow-200-dark|converter-narrow-dark|quiz-narrow-light)$' \
TILE_BASELINE_DIR=docs/evidence/run05/screenshots/web \
node scripts/verify-tiles-browser.cjs dist docs/evidence/run06
```
