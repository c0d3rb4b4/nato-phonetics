# Run 16 actual final screenshots

18 November 2026. **24 final actual captures**: 22 web, one Android, one iOS. [Source identity](../source-identity.json), [hash/viewport/state metadata](metadata.json), [browser report](../report.json). Every image is inspected; no generated/mock app images. The exact server directory and rendered shell are separate metadata fields for waiting updates. Fixture B is the same production JS with an HTML root marker and regenerated resource digests, not a second shipped application.

Web: production build, Edge157.0.4341.60/macOS, loopback, desktop1280×900 (two activation/rollback pages use the browser's actual800×600 viewport), narrow320×568 and 200% text at the same narrow width. A=d3f42bcf4f3c32153c47729208611163b77789f8c2f11358e0b55b7fb5ace48e; B=79ad86d526c3c8b3e348b39ce81ec22b36ae9390a9260f03e66363e42154529a. Actual viewport is in each metadata row. `node scripts/verify-offline-browser.cjs dist docs/evidence/run16` captures worker/offline/update states; `node docs/evidence/run16/capture-light.cjs` supplies explicit Light readiness/policy. Speech-provider connectivity is not qualified by these images.

Android: installed Run14 Debug APK/current archived Hermes graph, Android16/API36,720×1600/280dpi/fontScale1/Light; raw ADB screencap after UIAutomator changed-paragraph assertions. [Candidate/logs](../android/README.md).

iOS: final direct unsigned Release simulator build, iPhone17Pro/iOS26.2/402×874pt/DPR3/Large/Light; XCUIScreen screenshot attachment exported unchanged. [Candidate/logs](../ios/README.md). The changed Offline paragraph is fully readable. **The adjacent unchanged Speech paragraph loses its final microphone-access words: this is failed P05.2 readability evidence**, despite successful label/frame assertions. Original/cold/split-candidate images are linked below; no whole-policy pass.

Scroll-boundary crops of neighboring content are expected on these long screens. The two200% frames deliberately cover the full status text and later provider/action region separately; the heading can be above the current scroll viewport. Buttons are reachable/contained. No first-ever-offline app screenshot is possible before resources exist; the actual failed navigation is tested in the report, rather than replaced with a mock.

| Platform / image | Actual state / inspection |
|---|---|
| web / [desktop-offline-ready.png](web/desktop-offline-ready.png) | Dark initial connected setup, ready |
| web / [offline-alphabet-fonts.png](web/offline-alphabet-fonts.png) | Cached reference and bundled fonts offline; lower rows scroll |
| web / [offline-converter.png](web/offline-converter.png) | Exact a3 b! input and complete plain conversion offline; provider playback unclaimed |
| web / [offline-saved-progress.png](web/offline-saved-progress.png) | Actual submitted answer/aggregate restored offline |
| web / [desktop-offline-policy.png](web/desktop-offline-policy.png) | Dark full changed cache/provider/update disclosure |
| web / [desktop-offline-menu.png](web/desktop-offline-menu.png) | Dark disconnected worker navigation, ready plus browser-offline report |
| web / [update-download-failed.png](web/update-download-failed.png) | A retained after deliberate update resource failure; Retry visible |
| web / [desktop-update-waiting.png](web/desktop-update-waiting.png) | Active A while server stages B; waiting guidance, no forced reload |
| web / [update-activated.png](web/update-activated.png) | Modified-HTML fixture B after all A windows close; saved data retained |
| web / [rollback-ready.png](web/rollback-ready.png) | Production A restored through ordinary waiting lifecycle |
| web / [narrow-dark-cold-progress.png](web/narrow-dark-cold-progress.png) | Real persistent-profile browser process restart offline; saved answer retained |
| web / [narrow-dark-cold-offline.png](web/narrow-dark-cold-offline.png) | Offline process restart, honest readiness/provider limitation |
| web / [narrow-dark-offline-policy-top.png](web/narrow-dark-offline-policy-top.png) | Narrow policy top/whole changed paragraph within scrollable document |
| web / [narrow-dark-offline-policy-bottom.png](web/narrow-dark-offline-policy-bottom.png) | Narrow policy bottom; complete changed disclosure |
| web / [narrow-dark-200-offline-status.png](web/narrow-dark-200-offline-status.png) | 200% status text; separate scroll region, no lost body text |
| web / [narrow-dark-200-offline-retry.png](web/narrow-dark-200-offline-retry.png) | 200% provider caveat/action region; update button fits |
| web / [narrow-blocked.png](web/narrow-blocked.png) | Controlled registration/storage denial: error/Retry, no partial cache |
| web / [narrow-unavailable.png](web/narrow-unavailable.png) | Service-worker capability absent: guidance, app usable |
| web / [narrow-corrupt.png](web/narrow-corrupt.png) | Deliberate mismatched resource bytes rejected, error/Retry |
| web / [narrow-first-install-recovered.png](web/narrow-first-install-recovered.png) | First install succeeds after Retry without reload |
| web / [desktop-light-ready.png](web/desktop-light-ready.png) | Light, complete production offline readiness and update control |
| web / [desktop-light-policy.png](web/desktop-light-policy.png) | Light, current public-cache/provider/update policy, complete changed paragraph |
| android / [native-offline-policy.png](android/native-offline-policy.png) | Changed native Offline paragraph readable/reachable; no live-size pass |
| ios / [native-offline-policy.png](ios/native-offline-policy.png) | Changed native Offline paragraph readable; adjacent iOS Speech clipping remains failed |

No missing changed-target capture remains: web availability controls apply only to web, native renders no new controls; both native changed policies are actually captured. This does not complete P10.7's all-flow/final-target matrix. Other engines/runtime/frozen/legacy-hosted checks and physical/provider/AT/signing/hosting acceptance remain unperformed.

Failed/diagnostic evidence is preserved separately: [original iOS clipping](../ios/adjacent-speech-clipping-original.png), [cold iOS clipping](../ios/adjacent-speech-clipping-cold.png), [failed/reverted split candidate](../ios/policy-split-still-clipped.png). Earlier `offline/`, `offline-checkpoint2/`, `concurrency/` and `concurrency-diagnostic/` captures are checkpoint artifacts, not added to this final index or relabelled passing final-candidate images. First Preparing/metadata-driver states and the first injected Retry timeout remain explicit in the execution record.
