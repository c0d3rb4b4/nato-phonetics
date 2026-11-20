# Run 08 shared verification

17 November 2026. Commands use Node 22.23.0 and the explicit npm 10.9.4 CLI under `/tmp/nato-phonetics-toolchain/node_modules`, with that toolchain's `.bin` directory first in PATH. Initial inherited source/status are recorded in [resume-source.json](resume-source.json), [resume-git-status.txt](resume-git-status.txt) and [resume-head.txt](resume-head.txt).

- `npm test`: [84 passed, zero failed](tests.log), including the nine existing immutable session-engine cases. New actual DOM/session regressions live in the browser suite rather than duplicating the pure model tests.
- `npm run typecheck`: [pass](types.log), active checked application source.
- `npm run lint`: [pass](lint.log), zero warnings/errors.
- `npm run check:dependencies`: [pass](no-expo.log), 793 locked packages and maintained/installed native/web consumers are Expo-free.
- `npm run export:web`: [pass](web-build.log), independent 12-route build, asset `app-ERCH4HBF.js`.

The implementation imports the delivered pure engine into `app/letter-quiz.js`; no timer, flip animation, persistent progress or new provider is added. Rendered action guards plus a synchronous ref commit reject duplicate/stale answer/Next events before React rerenders. The existing `usePlayback` owns blur/unmount/background cancellation; round transitions explicitly stop its owned audio. Retained navigation keeps session/recap state while hidden. Retry uses unique missed symbols; starting a new full round explicitly restores all 26 symbols. The recap stays until the user explicitly starts/retries. The setup and README/PRIVACY describe memory-only results and restart behavior.

No package, lockfile, native application source, font, tile geometry/tolerance, permission or storage schema changed. Run 04 locked install, Run 05 audit and Run 07 native build/full tile-window-raster evidence retain their historical scope; they were not rerun without a relevant change. Metro/image-size remains dispositioned rather than fixed or owner-accepted. Hosted CI is unrun; its workflow now includes the new real-browser session checks and evidence upload.

Final diff review: [scoped source comparison](source-changes.json) confirms 129 resume-inventoried files unchanged, five expected files changed, one new session-browser runner and no removals; the workflow's additional check/upload path is separately hashed in [source identity](../source-identity.json). Reviewed the rendered session handlers, explicit recap-replacement/reset behavior, concealment, read-only/native diagnostic ownership and preserved inherited migration work. [Git whitespace check](diff-check.log) is clean; [workflow YAML parsing](workflow-check.log) passes. [Evidence validation](../verification.json) checks current source/artifact/bundle/screenshot hashes, local report links and all 35 ledger items. No physical, hosted or release acceptance is inferred.
