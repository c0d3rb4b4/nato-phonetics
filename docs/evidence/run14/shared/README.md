# Run 14 shared verification

Pinned Node 22.23.0 / npm 10.9.4 via the existing isolated toolchain. No dependency or lockfile change, fresh install or new audit. All [154 previous source inputs match at resume](resume-comparison.json); [baseline files](baseline-files.json) and [initial working tree](git-status-before.txt) preserve inherited work.

- `npm test`: [116/116 pass](tests.log). Three meaningful icon tests add repeated real regeneration/consumer comparison, malformed-mask guards and actual invalid/blocked-output failure behavior. They run through the existing CI test gate; hosted CI is unrun.
- `npm run lint`, `npm run typecheck`, `npm run check:dependencies`: [lint](lint.log), [types](typecheck.log), [793-package Expo-free graph](dependencies.log) pass.
- `npm run generate-icons`: [22 verified resources](generate-icons.log), [manifest](../../../../assets/images/icon-manifest.json). [Actual negative CLI commands](generator-failures.json) exit 1 with empty stdout and explicit failure; tests additionally fail during actual output creation and preserve unowned paths.
- `npm run export:web`: [production 13-route build passes](build-web.log); the app JS/font hashes are unchanged by artwork generation.
- [Unused assets](unused-assets.json): four starter React PNGs removed after consumer scan and baseline hash checks; no unused dependency identified. Historical source artwork remains linked.

[First safe-circle attempt](generate-icons-first.log) fails at uniform scale 0.205. Final adaptive sources use 0.195 and pass the unchanged circle/66-dp guard. Full/legacy/splash sources use outlined repository Nunito glyphs; no tile font file or design/tolerance changes. The [recognition assessment](../../../SPOKEN_PRACTICE.md) is a documented contract, not a mock implementation; [59 production files remain unchanged](../recognition/source-preservation.json).

Native rebuilt/installed identities and actual captures are in the platform reports. [Source review](source-review.md), [final reconciliation](../verification.json), [forecast/reforecast](forecast.md). Existing native/concurrency/security/offline/manual gates remain open; this is not the final integrated P10.5 matrix.
