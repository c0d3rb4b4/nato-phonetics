package com.natophonetics.app

import android.os.Build
import android.util.TypedValue
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.uimanager.DisplayMetricsHolder

// React Native interprets fontSize and lineHeight as SP while allowFontScaling
// stays enabled. Android 14+ scales SP nonlinearly. Invert that exact conversion
// for a target DIP metric so the entire tile can scale by one accessibility factor.
class TileTypographyModule(context: ReactApplicationContext) : ReactContextBaseJavaModule(context) {
  override fun getName() = "TileTypography"

  @ReactMethod(isBlockingSynchronousMethod = true)
  fun spForUniformDp(targetDp: Double): Double {
    require(targetDp.isFinite() && targetDp > 0) { "Tile text size must be positive and finite" }
    val metrics = DisplayMetricsHolder.getWindowDisplayMetrics()
    val pixels = targetDp.toFloat() * metrics.density
    return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
      TypedValue.deriveDimension(TypedValue.COMPLEX_UNIT_SP, pixels, metrics).toDouble()
    } else {
      (pixels / metrics.scaledDensity).toDouble()
    }
  }
}
