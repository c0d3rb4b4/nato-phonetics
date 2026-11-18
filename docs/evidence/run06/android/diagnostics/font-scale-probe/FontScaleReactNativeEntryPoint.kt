@file:Suppress("INVISIBLE_MEMBER", "INVISIBLE_REFERENCE")

package com.natophonetics.app

import android.app.Application
import com.facebook.react.ReactNativeApplicationEntryPoint.loadReactNative
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlagsOverrides_RNOSS_Stable_Android
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlagsProvider
import com.facebook.react.modules.systeminfo.ReactNativeVersion
import com.facebook.react.soloader.OpenSourceMergedSoMapping
import com.facebook.react.views.view.setEdgeToEdgeFeatureFlagOn
import com.facebook.soloader.SoLoader

/**
 * RN 0.81.5 compatibility: keep the stable defaults, changing only live text
 * layout invalidation. The framework's stock entry point unconditionally
 * installs its defaults, so install our provider through its pinned internal
 * bootstrap before any flag is read. Do not force-reset live feature flags.
 * Revalidate/remove this compatibility entry point when upgrading React Native.
 */
internal fun loadReactNativeWithFontScaleUpdates(application: Application) {
  if (!BuildConfig.IS_NEW_ARCHITECTURE_ENABLED) {
    loadReactNative(application)
    return
  }
  check(ReactNativeVersion.VERSION == mapOf("major" to 0, "minor" to 81, "patch" to 5, "prerelease" to null)) {
    "Review the Android font-scale compatibility bootstrap before upgrading React Native 0.81.5"
  }
  SoLoader.init(application, OpenSourceMergedSoMapping)
  val stable = ReactNativeFeatureFlagsOverrides_RNOSS_Stable_Android(true, true, true)
  val fontScaleUpdates = object : ReactNativeFeatureFlagsProvider by stable {
    override fun enableFontScaleChangesUpdatingLayout(): Boolean = true
  }
  DefaultNewArchitectureEntryPoint.loadWithFeatureFlags(fontScaleUpdates)
  if (BuildConfig.IS_EDGE_TO_EDGE_ENABLED) setEdgeToEdgeFeatureFlagOn()
}
