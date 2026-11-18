# Run19 actual screenshots

Captured18November2026 from the running production web app, not mockups. Product shell `d3f42bcf4f3c32153c47729208611163b77789f8c2f11358e0b55b7fb5ace48e` exactly matches Run18. Candidate is the preserved dirty Run18 source plus Run19 browser runners/CI/documentation; [source identity](../source-identity.json), [checks/failures](../README.md), [capture metadata and hashes](metadata.json).

All21 retained images were inspected. Desktop1280×900 uses light appearance; narrow320×568 uses dark. Browser/runtime and capture times/commands/arguments are recorded per image in metadata. Actual OS: macOS 26.6.2. Screenshots show complete visible viewports, with normal scrolling for longer pages.

| Runtime / state | Actual image |
|---|---|
| chromium · Both simultaneous pointer answers saved | [desktop-merged-progress.png](web/chromium/desktop-merged-progress.png) |
| chromium · Same saved totals in the second dark narrow window | [narrow-merged-progress.png](web/chromium/narrow-merged-progress.png) |
| chromium · Real five-second lock timeout retains one unsaved answer | [narrow-lock-timeout.png](web/chromium/narrow-lock-timeout.png) |
| chromium · Direct offline progress route retains saved aggregates | [desktop-offline-progress.png](web/chromium/desktop-offline-progress.png) |
| chromium · Production converter works from cached shell offline | [desktop-offline-converter.png](web/chromium/desktop-offline-converter.png) |
| chromium · New persistent browser session opens saved progress offline | [narrow-cold-offline-progress.png](web/chromium/narrow-cold-offline-progress.png) |
| firefox · Both simultaneous pointer answers saved | [desktop-merged-progress.png](web/firefox/desktop-merged-progress.png) |
| firefox · Same saved totals in the second dark narrow window | [narrow-merged-progress.png](web/firefox/narrow-merged-progress.png) |
| firefox · Real five-second lock timeout retains one unsaved answer | [narrow-lock-timeout.png](web/firefox/narrow-lock-timeout.png) |
| firefox · Direct offline progress route retains saved aggregates | [desktop-offline-progress.png](web/firefox/desktop-offline-progress.png) |
| firefox · Production converter works from cached shell offline | [desktop-offline-converter.png](web/firefox/desktop-offline-converter.png) |
| firefox · New persistent browser session opens saved progress offline | [narrow-cold-offline-progress.png](web/firefox/narrow-cold-offline-progress.png) |
| webkit · Both simultaneous pointer answers saved | [desktop-merged-progress.png](web/webkit/desktop-merged-progress.png) |
| webkit · Same saved totals in the second dark narrow window | [narrow-merged-progress.png](web/webkit/narrow-merged-progress.png) |
| webkit · Real five-second lock timeout retains one unsaved answer | [narrow-lock-timeout.png](web/webkit/narrow-lock-timeout.png) |
| webkit · Direct offline progress route retains saved aggregates | [desktop-offline-progress.png](web/webkit/desktop-offline-progress.png) |
| webkit · Production converter works from cached shell offline | [desktop-offline-converter.png](web/webkit/desktop-offline-converter.png) |
| webkit · New persistent browser session opens saved progress offline | [narrow-cold-offline-progress.png](web/webkit/narrow-cold-offline-progress.png) |
| lifecycle · A genuinely frozen page resumes and shows externally cleared progress | [narrow-resumed-progress.png](web/lifecycle/narrow-resumed-progress.png) |
| lifecycle · Only a newly submitted answer is saved after frozen-page deletion | [desktop-new-answer.png](web/lifecycle/desktop-new-answer.png) |
| lifecycle · Resumed second window agrees on the exact new aggregate | [narrow-new-answer.png](web/lifecycle/narrow-new-answer.png) |

Android/iOS: **not applicable for this batch**. Only browser automation/CI/docs change; native/product/schema/permission/provider inputs remain byte-identical. [Prior Run18 actual native captures](../../run18/screenshots/index.md) retain their original qualification; no new native screenshot or build pass is claimed. No changed-target capture is missing. P10.7 full integrated candidate matrix remains incomplete.

Playwright WebKit is not branded Safari/iOS. Actual Chromium page freezing is not OS process suspension. Images supplement behavioral checks and do not prove audible output, physical AT, provider privacy, signing, hosted routing or release acceptance. Original diagnostic failures remain outside this final21-image set and are retained under their command directories.
