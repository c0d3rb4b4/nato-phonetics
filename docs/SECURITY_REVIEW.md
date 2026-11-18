# Dependency security review

Reviewed **17 November 2026**, Run 05, against the unchanged package lockfile after adding bundled tile fonts. Next review **16 December 2026**, or earlier after relevant dependency/build changes. This is an engineering disposition, not owner release-risk acceptance; M11.7 remains unperformed.

## Current evidence

Node **22.23.0**, npm **10.9.4**. The [inventory](security-audit-inventory.json) records the exact lockfile SHA-256, advisory fingerprints, package paths, owner, remediation and review dates. [Raw Run 03 audit](evidence/run03-audit.json) is retained. Run 04 rechecked the unchanged lockfile: the [raw audit](evidence/run04/shared/audit.json) still exits 1 with the same counts, and the [disposition gate](evidence/run04/shared/audit-review.log) passes. No advisory is declared fixed by the native verification work.

| Snapshot | Actual audit result |
|---|---|
| Original review | Exit 1; 2 critical / 21 high / 24 moderate / 2 low |
| Run 01–02 Expo baseline | Exit 1; 0 critical / 5 high / 20 moderate / 1 low |
| Run 03 replacement graph | Exit **1**; **0 critical / 1 high / 6 moderate / 3 low**, 10 affected package entries |
| Run 05 unchanged lockfile, live registry | Exit **1**; **0 critical / 1 high / 7 moderate / 0 low**, 8 affected package entries; [raw report](evidence/run05/shared/audit.json), [passing disposition gate](evidence/run05/shared/audit-review.log) |

Counts describe affected packages, not distinct advisory counts. The review gate passes only because the remaining high entry matches its current disposition. It does not make the raw audit pass.

Expo Router's `query-string`/`decode-uri-component` chain and Expo Metro's pinned PostCSS were removed from the lockfile and installed graph. The installed production web build uses esbuild **0.28.2**; native bundling uses React Native **0.81.5**, `@react-native/metro-config` **0.81.5** and Metro **0.83.3**. Retaining Metro also retains its vulnerable image parser. No forced audit fix, incompatible parser override or broad framework upgrade was applied.

## Remaining high finding

| Package | Applicability and evidence | Remediation / owner |
|---|---|---|
| `image-size` **1.2.1**, `node_modules/image-size` | High [JXL/HEIF infinite loops](https://github.com/advisories/GHSA-5p2g-fcmc-qvqq), affected `>=1.2.0 <=2.0.2`; high [ICNS infinite loop](https://github.com/advisories/GHSA-w3rx-r6r6-pgpr), affected `>=0.6.3 <=2.0.2`. `npm explain image-size` identifies Metro0.83.3; `metro/src/Assets.js` passes asset bytes to the parser. No authored image-upload feature exists, but repository/dependency assets still reach this build-time path. | Repository maintainer: compatible upstream Metro/parser update or assessed backport in P00/P10. Metro requests `^1.0.2`; patched2.0.3+ is outside that range. Review before release, by **2026-12-16**. Product/repository owner owns any eventual M11.7 risk acceptance; none recorded. |

The Run 05 registry snapshot reports seven moderate entries; the earlier low/moderate counts remain historical. No npm dependency changed in Run 05, so changed registry classifications/counts are not claimed as remediation. CLI **20.0.2** follows the pinned RN0.81.5 community template. Further compatible upgrades need their own native/build regression evidence.

## Reproducible native speech correction

`react-native-tts` **4.1.1** is newly installed. Inspection found Android used the spoken text's hash as an utterance ID, allowing delayed completion from a repeated word to match a new word. [The version-guarded postinstall patch](../scripts/patch-native-tts.cjs) replaces that identity expression with a UUID and fails on unexpected source/version drift. The lockfile continues to identify the published package; the checked-in patch identifies the local native source change. An installed-source regression verifies it, alongside cancellation/event tests. This is a correctness fix, not an npm advisory suppression or evidence of native compilation/audible acceptance.

Run 04 real iOS playback exposed another bridge defect in the same pinned provider: `stop`, `pause`, `setDucking` and `setDefaultRate` exported Boolean arguments as `BOOL *`. React Native 0.81.5 TurboModule interop accepts scalar `BOOL` but rejects that pointer encoding, preventing Stop from completing safely. The same install patch now fixes those four signatures and their boundary checks, with version/count guards validated before either platform file is written. Fresh installation, repeat application, source/version-drift rejection and installed ABI regressions pass ([evidence](evidence/run04/shared/ios-tts-abi.json), [tests](evidence/run04/shared/native-tts-patch-tests.log)). Native runtime outcomes are recorded in [Run 04](evidence/run04/ios/README.md). This is a compatibility correction, not an advisory fix.

The pinned iOS `fmt 11.0.2` Pod also needs a version/source-guarded compiler compatibility patch under this host's Apple clang 21. [The maintained patch](../ios/scripts/patch_fmt.rb) selects the library's existing checked fallback for affected Apple compiler versions; it does not change the resolved dependency version or suppress npm advisories. Repeated application and source/version drift rejection were tested against the installed header; the actual preprocessor reports `FMT_USE_CONSTEVAL=0`. [Patch evidence](evidence/run03-fmt-patch-checks.txt). The precise compile failure matches [fmt issue 4740](https://github.com/fmtlib/fmt/issues/4740) and [React Native issue 55601](https://github.com/react/react-native/issues/55601); binary build results remain in the execution record.

## Review gate and future checks

`npm run audit:review` invokes registry-backed `npm audit --json --audit-level=low`, prints its raw exit/counts, and compares each high/critical result against the inventory. It fails new or changed fingerprints (severity, ranges, causes, advisory URLs, package paths/versions), expired/missing dispositions, missing/duplicate owners/evidence/remediation and invalid/failed/malformed audit output. A disappearing finding also requires evidence-backed inventory cleanup. Numeric registry source IDs are excluded because they can change independently of advisory identity.

`npm run check:dependencies` separately checks the installed npm graph, lockfile and maintained runtime/native/web build consumers for Expo/EAS. Historical review/evidence prose can still mention the old stack. Passing this source/graph check does not establish native compile, install, launch, speech privacy or release readiness. Native outcomes and blockers remain explicit in [the execution record](DELIVERY_PLAN.md#run-03--16-november-2026); P10 must re-audit the integrated candidate.
