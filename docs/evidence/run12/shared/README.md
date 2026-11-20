# Run 12 shared checks

Pinned Node 22.23.0/npm 10.9.4 (`PATH=/tmp/nato-phonetics-toolchain/node_modules/.bin:$PATH`).

| Command | Actual result |
|---|---|
| `npm test` | [103/103 pass](test.log). New recall tests exercise all 36 listening targets/options, canonical/alias/blank/overlong/guide normalization, guarded wrong/correct scores, stale/duplicate/cancelled actions and mode-preserving Retry/restart. |
| `npm run typecheck` | [Pass](typecheck-final.log), active checked JavaScript/types after final help/privacy changes. |
| `npm run lint` | [Pass](lint-final.log), no warnings. |
| `npm run check:dependencies` | [Pass](dependencies.log), Expo-free manifest/793 locked packages/installed graph/maintained consumers. |
| `npm run export:web` | [Pass](build-web-final.log), 12 independent production routes. |

[144 inherited source hashes match](resume-comparison.json); [baseline files](baseline-files.json) and [initial status](initial-status.txt) preserve preexisting work. [Forecast/reforecasts](forecast.md) distinguish remaining native and storage/cache/framework costs. Final [source manifest](../source-identity.json), scoped delta and reconciliation are separate from inherited broad Git changes.

No new dependency, permissions, provider, persistent key, native app/Release rebuild, locked reinstall, fresh audit or hosted CI pass is claimed. Existing security disposition remains in SECURITY_REVIEW; dependency/exposure/expiry/release triggers still apply. Unchanged tile/font/controller/provider results are reused proportionally. M11 physical listening/AT/provider/privacy/signing/release remains unperformed.
