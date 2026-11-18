# Run 15 actual screenshot index

Captured 18 November 2026 from the production web build in isolated headless Edge 157.0.4341.60, DPR 1. Twelve final originals below were individually inspected. [Source identity](../source-identity.json), [exact served build](../web-build-manifest.json), [archived JS](../web-app.js.gz), [inspection hashes](inspection.json). Final app bundle SHA-256: `872d0c9e624373bd1c59b0e5504b8f088b4f912b0c248d862613f37ecbd3ceb9`.

[Concurrency metadata/commands](web/concurrency-metadata.json), [policy metadata/command](web/policy-metadata.json). All are real browser screenshots. Concurrency uses actual same-origin storage/locks and production DOM-handler clicks; speech/failure branches are explicitly controlled. No native or audible-provider evidence is inferred.

| Original | Viewport / theme | State |
|---|---|---|
| [desktop-merged-summary.png](web/desktop-merged-summary.png) | 1280×900 / light | Two simultaneous answers retained in both windows |
| [narrow-merged-summary.png](web/narrow-merged-summary.png) | 320×568 / dark | Same saved totals update in narrow second window |
| [desktop-cleared-summary.png](web/desktop-cleared-summary.png) | 1280×900 / light | Zero saved aggregates after cross-window deletion |
| [narrow-stale-retry-cleared.png](web/narrow-stale-retry-cleared.png) | 320×568 / dark | Retry cannot resurrect an answer with delayed storage events |
| [narrow-lock-timeout.png](web/narrow-lock-timeout.png) | 320×568 / dark | Bounded lock wait retains one unsaved answer and exposes Retry |
| [narrow-retry-merged.png](web/narrow-retry-merged.png) | 320×568 / dark | Retry merges new saved totals without restoring deleted answers |
| [narrow-coordination-unavailable.png](web/narrow-coordination-unavailable.png) | 320×568 / dark | Missing Web Locks leaves practice available and avoids unsafe persistence |
| [narrow-uncertain-storage-recovery.png](web/narrow-uncertain-storage-recovery.png) | 320×568 / dark | Unknown deletion generation preserves pending answer and explains safe recovery |
| [1280-clear-progress-policy.png](web/1280-clear-progress-policy.png) | 1280×900 / light | Clear Progress policy |
| [1280-browser-progress-policy.png](web/1280-browser-progress-policy.png) | 1280×900 / light | Browser progress policy |
| [320-clear-progress-policy.png](web/320-clear-progress-policy.png) | 320×568 / dark | Clear Progress policy |
| [320-browser-progress-policy.png](web/320-browser-progress-policy.png) | 320×568 / dark | Browser progress policy |

## Checkpoint regression captures

The [22 original single-window progress captures](../progress/screenshots/web/metadata.json) were individually inspected: light desktop 1280×900 and dark 320×568 with 200% text, empty review, write/clear errors, summaries, due/focus and unsupported schema. Their capture metadata is retained, but their exact served-bundle hash was not archived before the later unreadable-generation guard. They support the earlier checkpoint; they are not final-candidate image claims. Final scoped concurrency and full app browser checks run after that guard. [Regression log](../shared/progress-browser.log).

## Native targets and coverage limits

Android/iOS changed-flow screenshots are **inapplicable** for this web-only coordination/policy batch: the native persistence adapter and rendered policy sections exactly match baseline; native projects/fonts/dependencies are unchanged. Shared parser/coordinator regression tests pass, but no new native runtime/build evidence is claimed. [Preservation](../shared/native-preservation.json). Previous actual [native captures](../../run14/screenshots/index.md) remain historical, including their existing open gates. P10.7 full final web/Android/iOS candidate capture matrix remains incomplete.

Other browser engines, physical AT/touch, real OS frozen/restored processes and hosted legacy upgrades/rollback are unrun. Deliberately blocked storage events are a controlled case, not proof of OS lifecycle behavior. The interrupted pointer recapture and first below-viewport error original remain [diagnostics](../diagnostics/pointer-driver-status.json); they are not substituted for a final passing flow.
