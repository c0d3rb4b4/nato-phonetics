package com.natophonetics.app

import android.app.Application
import android.graphics.Typeface
import com.facebook.react.common.assets.ReactFontManager
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackage
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost
import com.facebook.react.defaults.DefaultReactNativeHost

class MainApplication : Application(), ReactApplication {

  override val reactNativeHost: ReactNativeHost =
      object : DefaultReactNativeHost(this) {
        override fun getPackages(): List<ReactPackage> =
            PackageList(this).packages.apply {
              // Packages that cannot be autolinked yet can be added manually here, for example:
              // add(MyReactNativePackage())
              add(TileTypographyPackage())
            }

        override fun getJSMainModuleName(): String = "index"

        override fun getUseDeveloperSupport(): Boolean = BuildConfig.DEBUG

        override val isNewArchEnabled: Boolean = BuildConfig.IS_NEW_ARCHITECTURE_ENABLED
        override val isHermesEnabled: Boolean = BuildConfig.IS_HERMES_ENABLED
      }

  override val reactHost: ReactHost
    get() = getDefaultReactHost(applicationContext, reactNativeHost)

  override fun onCreate() {
    super.onCreate()
    // Load the exact asset into the requested style slot. This avoids Android's
    // filename heuristics and prevents synthetic weight or system fallback.
    listOf(
      "NatoTile-ExtraBold" to Typeface.BOLD,
      "NatoTile-SemiBold" to Typeface.NORMAL,
      "NatoTile-Italic" to Typeface.ITALIC,
    ).forEach { (name, style) ->
      val face = Typeface.createFromAsset(assets, "fonts/$name.ttf")
      ReactFontManager.getInstance().setTypeface(name, style, face)
    }
    loadReactNativeWithFontScaleUpdates(this)
  }
}
