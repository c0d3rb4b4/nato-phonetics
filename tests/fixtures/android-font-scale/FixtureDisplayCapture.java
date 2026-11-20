package com.natophonetics.fonttest;

import android.app.Instrumentation;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.os.SystemClock;
import android.text.Layout;
import android.widget.TextView;
import java.io.File;
import org.json.JSONArray;
import org.json.JSONObject;

/** Observe actual display pixels for the fixture's fixed, black-on-white LTR paragraph. */
final class FixtureDisplayCapture {
  private final int[][] lines;
  private final int rightEdge;

  FixtureDisplayCapture(TextView paragraph) {
    int[] origin = new int[2];
    paragraph.getLocationOnScreen(origin);
    int x = origin[0] + paragraph.getTotalPaddingLeft();
    int y = origin[1] + paragraph.getTotalPaddingTop();
    rightEdge = origin[0] + paragraph.getWidth() - paragraph.getTotalPaddingRight();
    Layout layout = paragraph.getLayout();
    lines = new int[layout.getLineCount()][];
    for (int i = 0; i < lines.length; i++) {
      int start = layout.getLineStart(i);
      int end = layout.getLineEnd(i);
      while (end > start && Character.isWhitespace(layout.getText().charAt(end - 1))) end--;
      if (end <= start) throw new IllegalStateException("Unexpected empty fixture line");
      // The last non-space glyph must contribute dark ink inside its real
      // advance cell. Everything beyond the shaped line should be background.
      lines[i] = new int[] {y + layout.getLineTop(i), y + layout.getLineBottom(i),
          x + (int)Math.floor(layout.getPrimaryHorizontal(end - 1)),
          x + (int)Math.ceil(layout.getLineRight(i))};
    }
  }

  private JSONObject inspect(Bitmap display) throws Exception {
    JSONArray extents = new JSONArray();
    boolean matches = lines.length > 0;
    for (int[] line : lines) {
      int last = -1;
      if (line[0] >= 0 && line[1] <= display.getHeight() && line[2] >= 0 && rightEdge <= display.getWidth()) {
        for (int y = line[0]; y < line[1]; y++) {
          for (int x = Math.max(line[2], last + 1); x < rightEdge; x++) {
            int rgb = display.getPixel(x, y);
            if (((rgb >> 16) & 255) < 96 && ((rgb >> 8) & 255) < 96 && (rgb & 255) < 96) last = x;
          }
        }
      }
      boolean ok = last >= line[2] && last <= line[3] + 1;
      extents.put(new JSONObject().put("top", line[0]).put("bottom", line[1])
          .put("lastGlyphStart", line[2]).put("lineRight", line[3]).put("rightmostDarkPixel", last).put("matched",ok));
      matches &= ok;
    }
    return new JSONObject().put("matched", matches).put("lines", extents);
  }

  JSONObject capture(Instrumentation test, File destination) throws Exception {
    JSONArray frames = new JSONArray();
    long deadline = SystemClock.elapsedRealtime() + 5000;
    do {
      DisplayCapture.write(test, destination);
      Bitmap display = BitmapFactory.decodeFile(destination.getAbsolutePath());
      if (display == null) throw new IllegalStateException("Cannot decode the system display");
      JSONObject current;
      try { current = inspect(display); } finally { display.recycle(); }
      frames.put(current);
      if (current.getBoolean("matched")) return new JSONObject().put("matched", true).put("frames", frames);
      SystemClock.sleep(180);
    } while (SystemClock.elapsedRealtime() < deadline);
    return new JSONObject().put("matched", false).put("frames", frames);
  }
}
