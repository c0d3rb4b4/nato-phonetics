# Run 07 production-web regression

17 November 2026. The native measured-origin correction preserves the existing web baseline-marker path. Actual production browser checks and all 12 inspected images pass; no pixels exceed the existing comparison tolerance against Run 06.

| Check | Actual result |
|---|---|
| `npm run export:web` | [Pass](../shared/web-build.log), 12 routes; `app-QTHOULXG.js`. |
| `node scripts/verify-app-browser.cjs dist --flows-only` | [Pass](app-flows.log), scoped routing/keyboard/input, answer concealment/feedback, narrow/enlarged layout, contrast and mocked audio lifecycle/error regression. |
| Scoped tile verifier | [Pass](tiles-browser.log), 8 measured states / 113 tile measurements, real loaded fonts and strict geometry/baseline checks. |
| Run 06 same-renderer comparison | [12 comparisons](../web-tile-measurements.json), all zero changed pixels beyond the unchanged 32-channel tolerance. Prior images were read, never overwritten. |

Commands used Node 22.23.0, `NODE_PATH=/Users/mac/.npm/_npx/e5f4bcd55d2c7c9f/node_modules`, and `BROWSER_EXECUTABLE='/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge'`. The running browser reports Edge 157.0.4341.60.

```sh
TILE_QUIZ_SEED=20261117 \
TILE_CASE_FILTER='^(alphabet-desktop-light|alphabet-narrow-200-dark|converter-narrow-dark|quiz-narrow-light)$' \
TILE_BASELINE_DIR=docs/evidence/run06/screenshots/web \
node scripts/verify-tiles-browser.cjs dist docs/evidence/run07
```

[All 12 original screenshots](../screenshots/web/index.md) were viewed individually. No unexpected errors, internal tile clipping or blank/loading captures were observed. Partial tiles at scroll boundaries are reachable; the blocked-font alert is intentional. [Metadata](../screenshots/web/metadata.json) records assets/hashes, viewport/DPR, theme, browser and capture command. This is web evidence, not a native or listening pass. Full prior route matrices, locked installation and audit were not repeated without a relevant dependency change.
