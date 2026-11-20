# Run 13 shared verification

Node 22.23.0 / npm 10.9.4 through `/private/tmp/nato-phonetics-toolchain/node_modules/.bin`. [Resume comparison](resume-comparison.json): all 146 Run 12 maintained inputs match before editing. [Baseline](baseline-files.json) covers 2,715 inherited files, excluding ignored local build products; source preservation and final identities are reconciled in the run verification report.

- `npm test`: [113/113 pass](tests.log). Ten meaningful progress tests cover elapsed intervals/midnight/DST/leap-day/clock reversal, due/focus scoping/recovery, actual guarded answer identity, versioned restart/no raw-response storage, delayed hydration and rapid writes, failure/Retry/exact counts, corrupt/future schema preservation, transient read recovery, deletion ordering/in-flight writes/late duplicate events, failed deletion and preference/legacy/unrelated-key isolation.
- `npm run typecheck`: [final pass](typecheck-final.log). Initial new-map string typing errors are [retained](typecheck-first.log); canonical string membership validation corrects them without weakening maintained-code checking.
- `npm run lint`: [final pass](lint-final.log).
- `npm run check:dependencies`: [pass](dependencies.log), Expo-free manifest/793 locked packages/installed graph/native-web consumers. Dependencies and native app source are unchanged.
- `npm run export:web`: [final pass](build-web-final.log), 13 independent route pages, including `/progress` and static alias/deep-link resolution. No hosted deployment, offline service worker or P10 integrated-candidate claim.

The first attempted npm PATH pointed directly to package bin folders and failed tool discovery before checks. The established `.bin` toolchain prefix above corrects invocation; Node/npm versions are actual. No fresh locked installation, live audit, native app/Release rebuild or hosted CI is claimed. Existing R08 disposition and P10 requirements remain open. The standalone iOS XCTest runner compiles separately from the app.

[Forecast/checkpoints](forecast.md), [production browser](../web/README.md), installed [iOS](../ios/README.md) / [Android](../android/README.md), [screenshots](../screenshots/index.md). Physical acceptance remains M11.
