# Run22 actual screenshot evidence

19 November2026. Ten actual captures:5 product/installation views,4 failing Android font diagnostics,1 rejected loading capture. Every image inspected; no AI/mock images. Candidate1.0.0(1), [artifact/source scope](../candidate.json), [metadata/hashes](index.json).

| Image | Platform/settings/state | Scope |
|---|---|---|
| [android/cold1.png](android/cold1.png) | Android16/API36 arm64; light; cold1 | Failing diagnostic; no repair |
| [android/cold2.png](android/cold2.png) | Android16/API36 arm64; light; cold2 | Failing diagnostic; no repair |
| [android/live2.png](android/live2.png) | Android16/API36 arm64; light; live2 | Failing diagnostic; no repair |
| [android/product-restored.png](android/product-restored.png) | Android16/API36 arm64; light; product-restored | Actual product; scoped capture |
| [android/return1.png](android/return1.png) | Android16/API36 arm64; light; return1 | Failing diagnostic; no repair |
| [web/home-desktop-light.png](web/home-desktop-light.png) | 157.0.4341.60; light; / | Actual product; scoped capture |
| [web/converter-mobile-dark.png](web/converter-mobile-dark.png) | 157.0.4341.60; dark; /converter | Actual product; scoped capture |
| [ios/home-retrieved-light.png](ios/home-retrieved-light.png) | iOS26.2; light; Home | Actual product; scoped capture |
| [android/home-retrieved-light.png](android/home-retrieved-light.png) | Android16/API36 arm64; light; Home | Actual product; scoped capture |
| [diagnostics/android-loading-first.png](diagnostics/android-loading-first.png) | web; light; Home | Rejected loading capture |

Web: Edge157 actual extracted standard host archive,1280×900/light Home and320×800/dark populated converter; no page errors. Android: API36/16 arm64,720×1600/280dpi, font1→2→1 and separate cold2 diagnostic on old Run17 APK, plus restored Home; final matching new APK Home is asserted in actual UIAutomator hierarchy. iOS: iPhone17Pro/iOS26.2/SDK27.2, matching tar extracted/installed25-file identity and preserved executable permission; actual light Home. Commands are in metadata, [native install/capture log](../shared/native-install-captures.json), [Android readiness retry](../shared/android-capture-retry.json) and [web driver](../capture-web.cjs).

Original live2/return1 clipped labels are retained as failed P05.2 evidence. The first new Android capture showed Loading settings and is rejected; Home retry passes image inspection. Final Android Debug captures identify native APK, current unchanged product source/normal Metro entry and actual Home hierarchy; no new final-process inspector JavaScript archive/full-flow pass is claimed. Earlier restored-product inspector archive remains a separate recorded scope.

No changed-flow target capture is missing. No renderer/font/behavior/schema/provider change warrants a new full tile/OS/AT matrix; prior qualification retains its limits. Full integrated P10.7 remains unfinished, including all candidate states/support/runtime/strict-fidelity/provider/physical acceptance.
