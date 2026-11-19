# Run23 actual screenshot index

19 November 2026. All eight images were inspected. Production web uses the unchanged packaged build; installed Android Debug/iOS Release products match their recorded artifacts. [Candidate/source/artifacts](../candidate.json), [exact image metadata/hashes](index.json), [native installation/smoke commands](../shared/native-smoke-commands.json).

| Target | Actual view | Image |
|---|---|---|
| web | home desktop light | [web/home-desktop-light.png](web/home-desktop-light.png) |
| web | converter mobile dark | [web/converter-mobile-dark.png](web/converter-mobile-dark.png) |
| ios | alphabet light | [ios/alphabet-light.png](ios/alphabet-light.png) |
| ios | converter typed input | [ios/converter-typed-input.png](ios/converter-typed-input.png) |
| ios | home light | [ios/home-light.png](ios/home-light.png) |
| android | converter typed input | [android/converter-typed-input.png](android/converter-typed-input.png) |
| android | alphabet light | [android/alphabet-light.png](android/alphabet-light.png) |
| android | digits light | [android/digits-light.png](android/digits-light.png) |

Web: Edge157 on macOS, 1280×900/light Home and320×800/dark populated converter. Android: Android16/API36 arm64, nato-p00-api36, 720×1600/280dpi, font scale1/light. iOS: iPhone17Pro/iOS26.2, 402×874pt/DPR3, Large/light; converter screenshot intentionally includes the real keyboard and exact `a3 b!` input. Commands and precise timestamps are in the metadata.

No changed-target capture is missing. These are scoped dependency/build smoke captures. Full final P10.7 candidate/route/theme/orientation/text-scale/strict-fidelity/AT acceptance remains incomplete. The old Android live-size, iOS gesture/max-navigation and P3 raster failures are not newly passed; current captures use default native text sizes. Native apps have no provider substitution or diagnostic root/entry replacement. Browser capture uses actual production UI and no speech mock.

[Web capture driver](../capture-web.cjs), [native driver](../capture-native.py), [actual iOS test](../ios/harness/CaptureUITests.swift).
