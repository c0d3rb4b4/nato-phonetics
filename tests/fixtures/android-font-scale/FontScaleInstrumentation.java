package com.natophonetics.fonttest;

import android.app.Activity;
import android.app.Instrumentation;
import android.content.Intent;
import android.graphics.Bitmap;
import android.net.Uri;
import android.os.Bundle;
import android.os.ParcelFileDescriptor;
import android.text.Editable;
import android.util.TypedValue;
import android.view.View;
import android.view.ViewGroup;
import android.view.inputmethod.BaseInputConnection;
import android.widget.EditText;
import java.io.File;
import java.io.FileOutputStream;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.Callable;
import org.json.JSONArray;
import org.json.JSONObject;

/** Test APK only. Exercises the real product input without a JS/root replacement. */
public final class FontScaleInstrumentation extends Instrumentation {
  private Activity activity;
  private EditText input;
  private Editable editable;
  private final JSONArray stages = new JSONArray();
  private File output;
  private boolean externalEvidence;

  @Override public void onCreate(Bundle arguments) {
    externalEvidence = arguments != null && "true".equals(arguments.getString("externalEvidence"));
    super.onCreate(arguments); start();
  }

  private <T> T ui(Callable<T> action) throws Exception {
    Object[] result = new Object[2];
    runOnMainSync(() -> { try { result[0] = action.call(); } catch (Throwable e) { result[1] = e; } });
    if (result[1] != null) throw new Exception((Throwable) result[1]);
    @SuppressWarnings("unchecked") T value = (T) result[0];
    return value;
  }

  private String shell(String command) throws Exception {
    try (ParcelFileDescriptor fd = getUiAutomation().executeShellCommand(command);
         java.io.FileInputStream stream = new java.io.FileInputStream(fd.getFileDescriptor())) {
      return new String(stream.readAllBytes(), StandardCharsets.UTF_8).trim();
    }
  }

  private EditText findInput(View view, int tag) {
    if (view instanceof EditText && "converter-input".equals(view.getTag(tag))) return (EditText) view;
    if (view instanceof ViewGroup) {
      ViewGroup group = (ViewGroup) view;
      for (int i = 0; i < group.getChildCount(); i++) {
        EditText result = findInput(group.getChildAt(i), tag);
        if (result != null) return result;
      }
    }
    return null;
  }

  private EditText currentInput() {
    int tag = getTargetContext().getResources().getIdentifier("react_test_id", "id", "com.natophonetics.app");
    if (tag == 0) throw new AssertionError("Missing native testID resource");
    return findInput(activity.getWindow().getDecorView(), tag);
  }

  private void require(boolean condition, String message) { if (!condition) throw new AssertionError(message); }

  private boolean ime(String arguments) throws Exception {
    return shell("am broadcast -n com.natophonetics.fonttest/.FontTestImeCommand " + arguments).contains("result=-1");
  }

  private void awaitIme() throws Exception {
    long deadline = System.currentTimeMillis() + 10000;
    while (System.currentTimeMillis() < deadline) {
      if (ime("--es op ready")) return;
      Thread.sleep(100);
    }
    throw new AssertionError("System-managed test IME connection unavailable");
  }

  private void awaitScale(float scale) throws Exception {
    long deadline = System.currentTimeMillis() + 10000;
    while (System.currentTimeMillis() < deadline) {
      if (ui(() -> {
        EditText current = currentInput();
        float actual = activity.getResources().getConfiguration().fontScale;
        float expectedPx = (float) Math.ceil(TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_SP, 18, activity.getResources().getDisplayMetrics()));
        return current != null && Math.abs(actual-scale) < 0.000001 && Math.abs(current.getTextSize()-expectedPx) < 0.001;
      })) { Thread.sleep(600); return; }
      Thread.sleep(100);
    }
    throw new AssertionError("Input/resources did not reach scale " + scale);
  }

  private void snapshot(String stage, String value, int caret, int composingEnd) throws Exception {
    JSONObject row = ui(() -> {
      JSONObject data = new JSONObject();
      data.put("stage", stage).put("value", input.getText().toString())
          .put("selectionStart", input.getSelectionStart()).put("selectionEnd", input.getSelectionEnd())
          .put("composingStart", BaseInputConnection.getComposingSpanStart(input.getText()))
          .put("composingEnd", BaseInputConnection.getComposingSpanEnd(input.getText()))
          .put("focused", input.isFocused()).put("textSizePx", input.getTextSize())
          .put("heightPx", input.getHeight()).put("fontScale", activity.getResources().getConfiguration().fontScale)
          .put("sameView", currentInput() == input).put("sameEditable", input.getText() == editable)
          .put("activityIdentity", System.identityHashCode(activity));
      return data;
    });
    stages.put(row); // Preserve the actual failing sample before assertions.
    try (FileOutputStream file = new FileOutputStream(new File(output, stage + ".png"))) {
      Bitmap bitmap = getUiAutomation().takeScreenshot();
      require(bitmap != null, "Screenshot unavailable");
      require(bitmap.compress(Bitmap.CompressFormat.PNG, 100, file), "Screenshot compression failed");
      bitmap.recycle();
    }
    require(row.getBoolean("sameView") && row.getBoolean("sameEditable"), "Input or editable replaced: " + row);
    require(row.getBoolean("focused") && row.getString("value").equals(value), "Focus/value changed: " + row);
    require(row.getInt("selectionStart") == caret && row.getInt("selectionEnd") == caret, "Caret changed: " + row);
    require(row.getInt("composingStart") == (composingEnd < 0 ? -1 : 3) && row.getInt("composingEnd") == composingEnd, "Composition changed: " + row);
  }

  @Override public void onStart() {
    int code = Activity.RESULT_CANCELED;
    Bundle result = new Bundle();
    String original = "1";
    String originalIme = "";
    JSONObject report = new JSONObject();
    try {
      File evidenceParent = externalEvidence ? getTargetContext().getExternalFilesDir(null) : getTargetContext().getCacheDir();
      require(evidenceParent != null, "Evidence storage unavailable");
      output = new File(evidenceParent, "font-composition");
      require(output.mkdirs() || output.isDirectory(), "Cannot create evidence directory");
      original = shell("settings get system font_scale");
      originalIme = shell("settings get secure default_input_method");
      require(originalIme.matches("[A-Za-z0-9_.$/]+"), "Cannot restore original IME: " + originalIme);
      shell("ime enable com.natophonetics.fonttest/.FontTestIme");
      shell("ime set com.natophonetics.fonttest/.FontTestIme");
      shell("settings put system font_scale 1");
      Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse("natophonetics://converter"));
      intent.setClassName("com.natophonetics.app", "com.natophonetics.app.MainActivity");
      intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
      activity = startActivitySync(intent);
      awaitScale(1);
      ui(() -> {
        input = currentInput();
        input.getClass().getMethod("requestFocusFromJS").invoke(input);
        return null;
      });
      awaitIme();
      int length = ui(() -> input.length());
      require(ime("--es op select --ei start 0 --ei end " + length) && ime("--es op commit --es value NUWJ359"), "Seed commit failed");
      Thread.sleep(600);
      require(ime("--es op select --ei start 3 --ei end 3") && ime("--es op compose --es value Q"), "Composition setup failed");
      ui(() -> {
        editable = input.getText();
        return null;
      });
      Thread.sleep(600);
      snapshot("composition-before", "NUWQJ359", 4, 4);
      for (int scale : new int[]{2, 1}) {
        shell("settings put system font_scale " + scale);
        awaitScale(scale);
        snapshot("composition-live-" + scale, "NUWQJ359", 4, 4);
      }
      require(ime("--es op compose --es value QR"), "Composition continuation failed");
      Thread.sleep(400);
      snapshot("composition-continued", "NUWQRJ359", 5, 5);
      require(ime("--es op finish") && ime("--es op commit --es value Z"), "Commit after transition failed");
      Thread.sleep(400);
      snapshot("composition-committed", "NUWQRZJ359", 6, -1);
      report.put("passed", true);
      code = Activity.RESULT_OK;
    } catch (Throwable error) {
      try { report.put("passed", false).put("error", android.util.Log.getStackTraceString(error)); } catch (Exception ignored) { }
    } finally {
      try {
        shell("settings put system font_scale " + original);
        if (!originalIme.isEmpty() && !originalIme.equals("null")) {
          shell("ime set '" + originalIme + "'");
          shell("ime disable com.natophonetics.fonttest/.FontTestIme");
        }
        report.put("stages", stages).put("originalScale", original).put("originalIme", originalIme).put("scope", "Real product/system-managed test IME InputConnection composition; no physical/provider IME or AT claim");
        if (output != null) report.put("outputDirectory", output.getAbsolutePath());
        if (output != null) try (FileOutputStream file = new FileOutputStream(new File(output, "report.json"))) { file.write(report.toString(2).getBytes(StandardCharsets.UTF_8)); }
      } catch (Exception error) { code = Activity.RESULT_CANCELED; result.putString("cleanupError", error.toString()); }
      result.putString("report", report.toString());
      finish(code, result);
    }
  }
}
