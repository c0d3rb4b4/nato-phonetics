package com.natophonetics.app

import android.os.Bundle
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
