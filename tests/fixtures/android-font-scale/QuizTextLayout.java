package com.natophonetics.fonttest;

import android.text.Layout;
import android.text.Spanned;
import android.text.TextPaint;
import android.text.style.MetricAffectingSpan;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

/** Measurements for ordinary labels on the active, normally rendered quiz screen. */
final class QuizTextLayout {
  static JSONArray read(View root) throws JSONException {
    JSONArray rows = new JSONArray();
    visit(root, rows);
    return rows;
  }

  private static void visit(View view, JSONArray rows) throws JSONException {
    if (view.getVisibility() != View.VISIBLE || view.getWidth() == 0 || view.getHeight() == 0) return;
    if (view instanceof TextView) {
      TextView label = (TextView) view;
      CharSequence text = label.getText();
      Layout layout = label.getLayout();
      if (text.length() > 0 && layout != null && layout.getLineCount() > 0) {
        TextPaint paint = new TextPaint(label.getPaint());
        if (text instanceof Spanned) {
          for (MetricAffectingSpan span : ((Spanned) text).getSpans(0, 1, MetricAffectingSpan.class)) {
            span.updateMeasureState(paint);
          }
        }
        int ellipsis = 0;
        int last = layout.getLineCount() - 1;
        for (int line = 0; line <= last; line++) ellipsis += layout.getEllipsisCount(line);
        rows.put(new JSONObject()
            .put("text", text.toString()).put("paintPx", paint.getTextSize())
            .put("viewIdentity", System.identityHashCode(view)).put("lines", last + 1)
            .put("viewContentHeight", label.getHeight() - label.getCompoundPaddingTop() - label.getCompoundPaddingBottom())
            .put("lastLineBottom", layout.getLineBottom(last)).put("lastLineEnd", layout.getLineEnd(last))
            .put("ellipsizedCharacters", ellipsis));
      }
    }
    if (view instanceof ViewGroup) {
      ViewGroup group = (ViewGroup) view;
      for (int index = 0; index < group.getChildCount(); index++) visit(group.getChildAt(index), rows);
    }
  }

  private QuizTextLayout() {}
}
