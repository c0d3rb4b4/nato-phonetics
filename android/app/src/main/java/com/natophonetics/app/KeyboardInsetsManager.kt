package com.natophonetics.app

import android.graphics.Rect
import android.os.Build
import android.view.View
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import com.facebook.react.bridge.Arguments
import com.facebook.react.uimanager.PointerEvents
import com.facebook.react.uimanager.ReactPointerEventsView
import com.facebook.react.uimanager.SimpleViewManager
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.UIManagerHelper
import com.facebook.react.uimanager.events.Event

private const val EVENT_NAME = "topKeyboardInsetsChange"

class KeyboardInsetsManager : SimpleViewManager<View>() {
  override fun getName() = "NatoKeyboardInsets"
  override fun createViewInstance(context: ThemedReactContext): View = KeyboardInsetsView(context)
  override fun getExportedCustomDirectEventTypeConstants() =
    mutableMapOf(EVENT_NAME to mutableMapOf("registrationName" to "onKeyboardInsetsChange"))
}

private class KeyboardInsetsView(private val reactContext: ThemedReactContext) :
  View(reactContext), ReactPointerEventsView {
  override val pointerEvents = PointerEvents.NONE
  private val location = IntArray(2)
  private val visibleFrame = Rect()
  private var lastBottom = Float.NaN
  private var lastDocked = false

  init {
    importantForAccessibility = IMPORTANT_FOR_ACCESSIBILITY_NO
    ViewCompat.setOnApplyWindowInsetsListener(this) { _, insets ->
      report(insets)
      insets
    }
    addOnLayoutChangeListener { _, _, _, _, _, _, _, _, _ ->
      ViewCompat.getRootWindowInsets(this)?.let(::report)
    }
  }

  override fun onAttachedToWindow() {
    super.onAttachedToWindow()
    lastBottom = Float.NaN
    ViewCompat.requestApplyInsets(this)
  }

  private fun report(insets: WindowInsetsCompat) {
    if (id == NO_ID || height == 0) return
    val ime = WindowInsetsCompat.Type.ime()
    val imeBottom = insets.getInsets(ime).bottom
    val docked = insets.isVisible(ime) && imeBottom > insets.getInsets(WindowInsetsCompat.Type.navigationBars()).bottom
    val overlap = if (docked) overlapAtBottom(imeBottom) else 0
    val bottom = overlap / resources.displayMetrics.density
    if (bottom == lastBottom && docked == lastDocked) return
    val dispatcher = UIManagerHelper.getEventDispatcherForReactTag(reactContext, id) ?: return
    dispatcher.dispatchEvent(KeyboardInsetsEvent(UIManagerHelper.getSurfaceId(this), id, bottom, docked))
    lastBottom = bottom
    lastDocked = docked
  }

  private fun overlapAtBottom(imeBottom: Int): Int {
    // A window already shortened by adjustResize may have no remaining overlap.
    val overlap = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
      getLocationInWindow(location)
      val windowHeight = reactContext.currentActivity?.windowManager?.currentWindowMetrics?.bounds?.height()
        ?: rootView.height
      location[1] + height - (windowHeight - imeBottom)
    } else {
      // With adjustResize, the legacy visible display frame ends at the IME.
      getWindowVisibleDisplayFrame(visibleFrame)
      getLocationOnScreen(location)
      location[1] + height - visibleFrame.bottom
    }
    return overlap.coerceIn(0, height)
  }
}

private class KeyboardInsetsEvent(surfaceId: Int, tag: Int, private val bottom: Float, private val docked: Boolean) :
  Event<KeyboardInsetsEvent>(surfaceId, tag) {
  override fun getEventName() = EVENT_NAME
  override fun getEventData() = Arguments.createMap().apply {
    putDouble("bottom", bottom.toDouble())
    putBoolean("docked", docked)
  }
}
