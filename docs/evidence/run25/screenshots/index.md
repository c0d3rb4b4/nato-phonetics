# Run25 actual web screenshot index

19 November 2026. **30 inspected final original browser captures**, from the unchanged production archive SHA256 `fe911a9691812e3989e048429e034e1fef5f7ff1e7960d7e4a1c196d7e0e8f96`, shell `d3f42bcf4f3c32153c47729208611163b77789f8c2f11358e0b55b7fb5ace48e`. macOS26.6.2/25G83 arm64, Playwright1.65.1. Each linked metadata file records exact capture time, browser, viewport, theme, candidate, state and command arguments. Capture uses real `page.screenshot`, after font readiness.

Inspection: all30 checked in per-engine contact sheets, with original desktop quota, narrow lock and saved samples opened separately. No blank/loading or unexpected application-error images. Pending screenshots scroll to the visible error/Retry; upper content outside the viewport and lower content beyond the saved-summary viewport are normal scroll positions, not whole-page fidelity evidence. No audible/physical/AT acceptance.

| Engine / browser | Scenario | Viewport / theme | Actual capture |
|---|---|---|---|
| chromium / 157.0.4341.60 | ordinary | 1280×900 / light | [ordinary-1280-saved.png](web/chromium/ordinary-1280-saved.png) |
| chromium / 157.0.4341.60 | ordinary | 320×568 / dark | [ordinary-320-saved.png](web/chromium/ordinary-320-saved.png) |
| chromium / 157.0.4341.60 | quota | 1280×900 / light | [quota-1280-pending.png](web/chromium/quota-1280-pending.png) |
| chromium / 157.0.4341.60 | quota | 1280×900 / light | [quota-1280-saved.png](web/chromium/quota-1280-saved.png) |
| chromium / 157.0.4341.60 | quota | 320×568 / dark | [quota-320-pending.png](web/chromium/quota-320-pending.png) |
| chromium / 157.0.4341.60 | quota | 320×568 / dark | [quota-320-saved.png](web/chromium/quota-320-saved.png) |
| chromium / 157.0.4341.60 | lock | 1280×900 / light | [lock-1280-pending.png](web/chromium/lock-1280-pending.png) |
| chromium / 157.0.4341.60 | lock | 1280×900 / light | [lock-1280-saved.png](web/chromium/lock-1280-saved.png) |
| chromium / 157.0.4341.60 | lock | 320×568 / dark | [lock-320-pending.png](web/chromium/lock-320-pending.png) |
| chromium / 157.0.4341.60 | lock | 320×568 / dark | [lock-320-saved.png](web/chromium/lock-320-saved.png) |
| firefox / 159.0 | ordinary | 1280×900 / light | [ordinary-1280-saved.png](web/firefox/ordinary-1280-saved.png) |
| firefox / 159.0 | ordinary | 320×568 / dark | [ordinary-320-saved.png](web/firefox/ordinary-320-saved.png) |
| firefox / 159.0 | quota | 1280×900 / light | [quota-1280-pending.png](web/firefox/quota-1280-pending.png) |
| firefox / 159.0 | quota | 1280×900 / light | [quota-1280-saved.png](web/firefox/quota-1280-saved.png) |
| firefox / 159.0 | quota | 320×568 / dark | [quota-320-pending.png](web/firefox/quota-320-pending.png) |
| firefox / 159.0 | quota | 320×568 / dark | [quota-320-saved.png](web/firefox/quota-320-saved.png) |
| firefox / 159.0 | lock | 1280×900 / light | [lock-1280-pending.png](web/firefox/lock-1280-pending.png) |
| firefox / 159.0 | lock | 1280×900 / light | [lock-1280-saved.png](web/firefox/lock-1280-saved.png) |
| firefox / 159.0 | lock | 320×568 / dark | [lock-320-pending.png](web/firefox/lock-320-pending.png) |
| firefox / 159.0 | lock | 320×568 / dark | [lock-320-saved.png](web/firefox/lock-320-saved.png) |
| webkit / 27.2 | ordinary | 1280×900 / light | [ordinary-1280-saved.png](web/webkit/ordinary-1280-saved.png) |
| webkit / 27.2 | ordinary | 320×568 / dark | [ordinary-320-saved.png](web/webkit/ordinary-320-saved.png) |
| webkit / 27.2 | quota | 1280×900 / light | [quota-1280-pending.png](web/webkit/quota-1280-pending.png) |
| webkit / 27.2 | quota | 1280×900 / light | [quota-1280-saved.png](web/webkit/quota-1280-saved.png) |
| webkit / 27.2 | quota | 320×568 / dark | [quota-320-pending.png](web/webkit/quota-320-pending.png) |
| webkit / 27.2 | quota | 320×568 / dark | [quota-320-saved.png](web/webkit/quota-320-saved.png) |
| webkit / 27.2 | lock | 1280×900 / light | [lock-1280-pending.png](web/webkit/lock-1280-pending.png) |
| webkit / 27.2 | lock | 1280×900 / light | [lock-1280-saved.png](web/webkit/lock-1280-saved.png) |
| webkit / 27.2 | lock | 320×568 / dark | [lock-320-pending.png](web/webkit/lock-320-pending.png) |
| webkit / 27.2 | lock | 320×568 / dark | [lock-320-saved.png](web/webkit/lock-320-saved.png) |

[Full capture metadata/digests](metadata.json). [Engine reports](../summary.json).

[Separate diagnostic inspection index](../diagnostics/index.md). Separate failed scopes: [initial observer diagnostic images](../diagnostics/first-observer/screenshots/web/metadata.json) (2 ordinary captures and1 actual failure); [failed host partial-scope images](../diagnostics/host-webkit-tabs/screenshots/web/metadata.json) (2 earlier captures), plus [actual rejected-update UI failure](../diagnostics/host-webkit-tabs/failure/failure.png). These6 images remain diagnostic, excluded from the30 final recovery captures.

**Android/iOS:** captures inapplicable to test-only browser/CI changes; app/native/worker/dependency bytes unchanged. Existing [Run23 native captures](../../run23/screenshots/index.md) and [Run24 iOS export captures](../../run24/screenshots/index.md) retain their scopes. No new native, physical/AT, maximum Share-sheet, branded Safari/iOS, hosted Linux, public HTTPS or final integrated P10.7 capture/pass. Missing maximum native Share and other integrated images remain with P06.2/P10.7; no support exception.
