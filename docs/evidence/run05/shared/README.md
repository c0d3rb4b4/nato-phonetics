# Run 05 shared verification

17 November 2026, Node 22.23.0 / npm 10.9.4. Existing uncommitted work is preserved over base `784bb93c5cfb6edfd318d0dcec2d54d5bb222483`; see [initial status](initial-status.txt). This batch changes no npm/Pod dependency or preference schema. Run 04's locked-install result remains historical; a new installation was not required or claimed for these source/font changes.

| Command or check | Actual result |
|---|---|
| `npm test` | [80 passed, 0 failed](tests.log), including two actual-font checks, an all-symbol contrast check, nine pure-session regressions and three Android inverse-conversion regressions. |
| `npm run typecheck` | [Pass](types.log), checked application JS/JSDoc and new modules. |
| `npm run lint` | [Pass](lint.log), zero warnings. |
| `npm run check:dependencies` | [Pass](no-expo.log), installed graph and maintained native/web consumers. |
| `npm run export:web` | [Pass](web-build.log), independent production build with local font assets. |
| `npm run audit:review` | [Disposition gate passes](audit-review.log); raw audit exits 1, with 0 critical / 1 high / 7 moderate / 0 low. [Raw registry result](audit.json). The package lockfile is unchanged; changed registry counts are not remediation. |
| Reproduce bundled font assets | [Three identical TTF outputs](font-reproduction.json) from pinned upstream bytes and fontTools 4.60.2. |

The [contrast review](contrast-review.json) found the initial guide color below 4.5:1 on C/H/R/2 and also exposed the pressed-opacity loss. The darker guide and internal press/focus border repair these without changing tile geometry or background colors. The final computed guide minimum is 5.745:1; browser checks also inspect the held-pointer state.

The font tests read the shipped TTF Unicode mapping, advance-width table and weight/italic metadata. All 26 letter and ten digit labels fit at the specified sizes, Android copies match byte-for-byte, and Xcode resource/registration references exist. Actual rendered metrics and packaged native artifacts are verified separately; unit font widths alone do not prove cross-platform fidelity.

The [pure quiz-session engine](QUIZ_SESSION.md) is a bounded independent P07.2 follow-on, with no screen import or user-facing session feature. Its API and tests are delivered; UI/audio lifecycle integration and P07.4 results remain open. No screenshot applies to this unused data module.

Source review checked the three route consumers, shared geometry/font/baseline hooks, native font registration and Android SP conversion against the installed React Native renderer, plus the session transitions/tests. Tile changes retain existing playback ownership and conditional quiz disclosure. There is no new backend, microphone permission, stored data or external font service. Native text retains `allowFontScaling`; proportional sizing is normalized rather than disabled. The final Android-only cache removal is covered by three tests executing the adapter against observed changing native inverses; native repeated-transition raster evidence is required separately. Shared tests/typecheck/lint were repeated after this source repair; web/iOS source and their artifacts were unaffected. The session module has no application consumer yet, and cancelling its data state does not itself stop audio. Earlier uncommitted changes were preserved. This is a review of this batch, not P10's final integrated-candidate review.

[Browser evidence](../web/README.md) records the production route/accessibility/audio suite, preferences, exact tile metrics and visual comparisons. Native checks and screenshots belong to their platform reports. Mocked browser speech checks do not establish audible pronunciation, provider privacy or offline availability. All M11 acceptance remains unperformed.
