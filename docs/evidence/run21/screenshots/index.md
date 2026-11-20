# Run21 actual screenshot index

Captured18 November2026 on macOS26.6.2 (25G83), Caddy2.11.9, Node22.23.0 and isolated Playwright1.65.1.24 final actual screenshots are inspected individually through complete contact sheets;4 diagnostic failure captures are separately inspected. No blank/loading/error overlay or new component clipping observed. Screens are ordinary scrollable viewports; content below the viewport is not asserted visible. The rejected-update capture shows both error guidance and the actual Retry action. No image is generated or substituted for another target.

Product/archive bytes equal Run20. [Candidate](../candidate.json), [source/check scope](../verification.json). Each engine's metadata records exact candidate/archive/shell IDs, capture time, browser/user agent, viewport, actual app background/saved/system appearance and command/arguments. Desktop1280×900 starts Light; actual Settings→Dark is selected before error/wait/rollback scopes. Narrow320×568 is Dark. `tabs` is close-all-app-tabs/1s browser-idle/reopen; cold offline is a new persistent browser process/context after stable rollback, with Caddy stopped. These are scoped host/lifecycle images, not a final integrated P10.7 pass.

| State | Edge157.0.4341.60 | Firefox159.0 | Playwright WebKit27.2 |
|---|---|---|---|
| Actual pointer answer saved through the packaged host | [chromium](web/chromium/desktop-hosted-progress.png) | [firefox](web/firefox/desktop-hosted-progress.png) | [webkit](web/webkit/desktop-hosted-progress.png) |
| Exact converter on the extracted production release | [chromium](web/chromium/desktop-hosted-converter.png) | [firefox](web/firefox/desktop-hosted-converter.png) | [webkit](web/webkit/desktop-hosted-converter.png) |
| Deliberately truncated origin response rejects update; active shell, draft and exact saved data survive | [chromium](web/chromium/desktop-host-update-rejected.png) | [firefox](web/firefox/desktop-host-update-rejected.png) | [webkit](web/webkit/desktop-host-update-rejected.png) |
| Atomic root switch preserves the active shell and waits for every window to close | [chromium](web/chromium/desktop-host-update-waiting.png) | [firefox](web/firefox/desktop-host-update-waiting.png) | [webkit](web/webkit/desktop-host-update-waiting.png) |
| Closing one window and reloading the other keeps the original shell while the new worker waits | [chromium](web/chromium/desktop-host-second-window-pinned.png) | [firefox](web/firefox/desktop-host-second-window-pinned.png) | [webkit](web/webkit/desktop-host-second-window-pinned.png) |
| Original candidate active after rollback with progress retained | [chromium](web/chromium/narrow-host-rollback-ready.png) | [firefox](web/firefox/narrow-host-rollback-ready.png) | [webkit](web/webkit/narrow-host-rollback-ready.png) |
| Actual missing pinned font repaired through Menu; original rollback shell and saved records retained | [chromium](web/chromium/narrow-host-cache-repaired.png) | [firefox](web/firefox/narrow-host-cache-repaired.png) | [webkit](web/webkit/narrow-host-cache-repaired.png) |
| Saved answer accessible offline through the packaged shell after rollback | [chromium](web/chromium/narrow-host-offline-progress.png) | [firefox](web/firefox/narrow-host-offline-progress.png) | [webkit](web/webkit/narrow-host-offline-progress.png) |

Metadata: [chromium](web/chromium/metadata.json), [firefox](web/firefox/metadata.json), [webkit](web/webkit/metadata.json).

Android/iOS screenshots are **inapplicable to this tooling/CI-only delta**: native/app/font/layout/permission/provider bytes are unchanged; Run18/20 captures retain their original scopes. No changed-target capture is missing. Final P10.7 all-target candidate/AT/support matrix remains incomplete; no native test/build/physical acceptance is claimed.

Diagnostic failures stay separate from final results: [initial eviction setup](../diagnostics/chromium-first/failure.png), [wrong HTML identity](../diagnostics/chromium-identity/failure.png), [read-only worker probe](../diagnostics/chromium-worker/failure.png), [WebKit waiting-update process close](../diagnostics/webkit-process-close/failure.png). The first three expose async runner gating, not a product repair. WebKit process-close remains failed/P2/P10; actual progress is visibly retained. [Exact scopes/failures](../README.md).
