# Run 09 shared checks

Pinned Node 22.23.0/npm10.9.4 via `PATH=/tmp/nato-phonetics-toolchain/node_modules/.bin:$PATH`. No dependency/lock/native/font/tile/storage-schema/permission change. Fresh install/audit/unchanged broad native matrices are not repeated; the unresolved Metro/image-size advisory and historical platform limits remain in their owning tasks.

| Command | Actual result |
|---|---|
| `npm test` | [91/91 pass](tests.log): seven new conversion/export tests, plus updated boundary expectations; no existing tests removed |
| `npm run typecheck` | [Exit 0](typecheck.log), active application JS/JSDoc/types |
| `npm run lint` | [Exit 0](lint.log), no warnings/errors |
| `npm run export:web` | [Exit 0](web-build.log), 12 routes, independent production web |
| `npm run check:dependencies` | [Exit 0](dependencies.log), Expo-free manifest/793 locked packages/installed graph and consumers |
| `git diff --check` | [Result](diff-check.log); final evidence check repeats after document updates |

Initial test mismatch was a fixture expectation: intentional provider input is Juliet, while canonical export remains Juliett. It was corrected without altering content or weakening canonical assertions. First type check caught the shared screen comparing browser `unavailable` against an inferred native-only return union; the native adapter now declares the common capability union. These are resolved initial attempts; the final logs above pass. No framework workaround, native scaling suppression or tolerance change.

[Resume comparison](resume-comparison.json) confirms all 127 Run 08 maintained input hashes match before edits. [Initial status](initial-git-status.txt), [forecast/checkpoints](forecast.md), [scoped source changes](source-changes.json) and [final source identity](../source-identity.json) distinguish the inherited uncommitted tree from this batch. No reset/commit/push/publication or release approval.

Final [source/diff review](final-review.json) verifies all 137 maintained input hashes, the six changes with prior hashes, five added implementation/test files and preserved inherited inputs. [Document/status/link checks](document-checks.json) validate all 35 ledger rows/counts, P06.1 checked/P06.2 open, 43 capture records and no missing local link targets in affected Markdown.
