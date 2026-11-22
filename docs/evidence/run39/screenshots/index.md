# Run 39 screenshots

All six frames were inspected on 22 November 2026. The four Menu frames show the production web UI after the local status repair. The other frames document the separate Firefox offline follow-up and the hosted Chromium storage recovery. [File and candidate hashes](../identity.json).

| Frame | Target and appearance | Visible state and capture |
| --- | --- | --- |
| [Menu after a failed update](web/desktop-update-retry.png) | Windows build 26200, Chromium 159.0.8154.6, 1280×900, dark | The old shell reply has arrived. The error and full Retry control remain visible. |
| [Narrow Menu after the same reply](web/narrow-update-retry.png) | Same browser and build, 320×568, dark | Wrapped explanation and full Retry button above the bottom tabs. |
| [Immediate Retry](web/webkit-retry.png) | Windows build 26200, Playwright WebKit 27.2, 320×568, light | A rejected update offers Retry while the old check is outstanding. |
| [Update waiting after Retry](web/webkit-waiting.png) | Same WebKit viewport and appearance | Close-all-windows instructions and Check for web update are visible. An earlier diagnostic frame clipped the bottom of the control. The final capture scrolls it into view. |
| [Subsequent offline launch](web/firefox-offline.png) | Ubuntu 24.04.3 under WSL, Firefox 159, 320×568, dark | The failed profile's subsequent offline launch shows its saved Alfa answer. The pre-existing “1 answers saved” copy is visible. The online restart failure remains open. |
| [Hosted progress after quota Retry](web/hosted-quota-saved.png) | GitHub-hosted Linux Chromium 159.0.8154.6, 1280×900, light | Learning Progress shows the single Uniform attempt after quota recovery. This frame belongs to committed develop at 8530c821. |

The local Menu captures use shell `dbf727de2cd51f06a903d7a33de271cafe14e1fdf3128c56e9f7f349311a5137`. Chromium used `node scripts/verify-offline-browser.cjs artifacts/run39/final-web artifacts/run39/captures`. WebKit used `node docs/evidence/run39/check-retry.cjs artifacts/run39/final-web artifacts/run39/wk-captures`. [Chromium metadata](../chromium-fixed.json) · [WebKit result](../webkit-fixed.json).

Firefox used `node docs/evidence/run39/reopen-offline.cjs <failed-process-report> <new-output>` on a copy of the final package test profile. Its forward fixture is `eb519f11facbfc6f209f409069b32fa8f3fb8b3f2b2e049645541860e582e304`. Hosted Chromium used `node scripts/verify-progress-recovery-browser.cjs dist artifacts/browser-support/chromium/recovery chromium` against shell `af6b951339690f34f252a3d8073d4813f64f94917f2a2ac0983a82287c115df5`. [Offline profile](../firefox-subsequent-offline.json) · [Hosted recovery](../ci-chromium-recovery.json).

Android and iOS captures are inapplicable to this batch. Their apps use the native offline-status component and do not expose the website's service-worker controls. Installed iOS maximum-text flows and the P10.7 integrated capture set remain engineering work.
