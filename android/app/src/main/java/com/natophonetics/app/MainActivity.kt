package com.natophonetics.app

import android.os.Bundle
import android.content.res.Configuration
import com.facebook.react.ReactApplication
import com.facebook.react.bridge.LifecycleEventListener
import com.facebook.react.ReactActivity
import com.facebook.react.uimanager.DisplayMetricsHolder
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

class MainActivity : ReactActivity() {

  override fun onCreate(savedInstanceState: Bundle?) {
    // RN 0.81 keeps its display metrics across Activity recreation. Refresh the
    // holder before the new surface measures text with the current resources.
    DisplayMetricsHolder.initDisplayMetrics(this)
    super.onCreate(savedInstanceState)
  }

  override fun onResume() {
    DisplayMetricsHolder.initDisplayMetrics(this)
    super.onResume()
  }

  override fun onConfigurationChanged(newConfig: Configuration) {
    DisplayMetricsHolder.initDisplayMetrics(this)
    super.onConfigurationChanged(newConfig)
    // DeviceInfo normally refreshes its font scale only after Activity resume.
    // Handling fontScale ourselves preserves the current route and input, so
    // notify that module without simulating a whole application lifecycle.
    val context = (application as ReactApplication).reactHost?.currentReactContext
    (context?.getNativeModule("DeviceInfo") as? LifecycleEventListener)?.onHostResume()
    // Ask the existing surface to measure its current window; do not remount
    // React or discard the active screen's form/quiz state.
    reactDelegate?.reactRootView?.requestLayout()
  }

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  override fun getMainComponentName(): String = "NATOPhonetics"

  /**
   * Returns the instance of the [ReactActivityDelegate]. We use [DefaultReactActivityDelegate]
   * which allows you to enable New Architecture with a single boolean flags [fabricEnabled]
   */
  override fun createReactActivityDelegate(): ReactActivityDelegate =
      DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)
}
