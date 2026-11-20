package com.natophonetics.fonttest;

import android.app.Activity;
import android.content.ClipData;
import android.content.ClipboardManager;
import android.view.View;
import android.view.ViewGroup;
import android.widget.EditText;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import org.json.JSONObject;

/** Foreground test-only OS clipboard seed and digest for a disposable device. */
final class ConverterClipboard {
  static JSONObject observe(Activity activity, boolean seed) throws Exception {
    ClipboardManager clipboard = activity.getSystemService(ClipboardManager.class);
    if (seed) {
      StringBuilder input = new StringBuilder();
      while (input.length() < 2000) input.append("CV34 7AP / G-ABCD\n");
      clipboard.setPrimaryClip(ClipData.newPlainText("Converter fixture", input.substring(0, 2000)));
    }
    ClipData clip = clipboard.getPrimaryClip();
    JSONObject result = new JSONObject();
    if (clip != null && clip.getItemCount() == 1 && clip.getItemAt(0).getText() != null) {
      result.put("clipboard", digest(clip.getItemAt(0).getText()));
    }
    EditText field = field(activity.getWindow().getDecorView());
    if (field == null) throw new IllegalStateException("No active converter input");
    return result.put("input", digest(field.getText())).put("viewIdentity", System.identityHashCode(field))
        .put("editableIdentity", System.identityHashCode(field.getText())).put("selectionEnd", field.getSelectionEnd())
        .put("inputPaintPx", field.getTextSize());
  }

  private static EditText field(View view) {
    if (view.getVisibility() != View.VISIBLE || view.getWidth() == 0 || view.getHeight() == 0) return null;
    if (view instanceof EditText) return (EditText) view;
    if (view instanceof ViewGroup) {
      ViewGroup group = (ViewGroup) view;
      for (int i = 0; i < group.getChildCount(); i++) {
        EditText child = field(group.getChildAt(i));
        if (child != null) return child;
      }
    }
    return null;
  }

  private static JSONObject digest(CharSequence value) throws Exception {
    byte[] bytes = value.toString().getBytes(StandardCharsets.UTF_8);
    StringBuilder hex = new StringBuilder();
    for (byte b : MessageDigest.getInstance("SHA-256").digest(bytes)) hex.append(String.format("%02x", b));
    return new JSONObject().put("chars", value.length()).put("bytes", bytes.length).put("sha256", hex.toString());
  }

  private ConverterClipboard() {}
}
