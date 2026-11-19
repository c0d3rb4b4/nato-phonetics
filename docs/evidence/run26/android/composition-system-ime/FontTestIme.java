package com.natophonetics.fonttest;

import android.inputmethodservice.InputMethodService;
import android.view.View;
import android.view.inputmethod.InputConnection;
import android.widget.TextView;

/** Isolated test IME. Commands use Android's current, system-managed connection. */
public final class FontTestIme extends InputMethodService {
  static FontTestIme active;
  @Override public void onCreate() { super.onCreate(); active = this; }
  @Override public void onDestroy() { active = null; super.onDestroy(); }
  @Override public View onCreateInputView() {
    TextView view = new TextView(this);
    view.setText("Font regression IME — test connection");
    view.setTextSize(16);
    view.setTextColor(0xff111111);
    view.setBackgroundColor(0xffeeeeee);
    view.setPadding(20, 20, 20, 20);
    view.setMinimumHeight(160);
    return view;
  }
  InputConnection connection() { return getCurrentInputConnection(); }
}
