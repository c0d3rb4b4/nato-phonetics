package com.natophonetics.fonttest;

import android.app.Activity;
import android.app.Instrumentation;
import android.content.Intent;
import android.graphics.Rect;
import android.os.Bundle;
import android.os.ParcelFileDescriptor;
import android.text.Editable;
import android.view.View;
import android.view.ViewGroup;
import android.widget.EditText;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.Callable;
import org.json.JSONArray;
import org.json.JSONObject;

/** Separate test APK; observes the embedded normal-startup Release fixture. */
public final class FontScaleFixtureInstrumentation extends Instrumentation {
  private Activity activity;
  private EditText input;
  private Editable editable;
  private File output;
  private String scenario;
  private String narrow;
  private final JSONObject samples = new JSONObject();
  private long sequence;
  private int tag;

  @Override public void onCreate(Bundle args) {
    scenario = args.getString("scenario", "primary");
    narrow = args.getString("narrow", "560x1000");
    super.onCreate(args); start();
  }
  private void require(boolean yes, String message) { if (!yes) throw new AssertionError(message); }
  private <T> T ui(Callable<T> action) throws Exception {
    Object[] result = new Object[2];
    runOnMainSync(() -> { try { result[0] = action.call(); } catch (Throwable e) { result[1] = e; } });
    if (result[1] != null) throw new Exception((Throwable) result[1]);
    @SuppressWarnings("unchecked") T value = (T) result[0]; return value;
  }
  private String shell(String command) throws Exception {
    try (ParcelFileDescriptor fd = getUiAutomation().executeShellCommand(command);
         FileInputStream stream = new FileInputStream(fd.getFileDescriptor())) {
      return new String(stream.readAllBytes(), StandardCharsets.UTF_8).trim();
    }
  }
  private View find(View view, String name) {
    if (name.equals(view.getTag(tag))) return view;
    if (view instanceof ViewGroup) {
      ViewGroup group = (ViewGroup) view;
      for (int i=0; i<group.getChildCount(); i++) {
        View result = find(group.getChildAt(i), name); if (result != null) return result;
      }
    }
    return null;
  }
  private View find(String name) { return find(activity.getWindow().getDecorView(), name); }
  private JSONObject observation() throws Exception {
    return ui(() -> {
      View view = find("probe-observation");
      CharSequence label = view == null ? null : view.getContentDescription();
      return label == null ? null : new JSONObject(label.toString());
    });
  }
  private void await(float scale) throws Exception {
    long deadline = System.currentTimeMillis()+15000;
    while (System.currentTimeMillis()<deadline) {
      JSONObject row = observation();
      if (row != null && row.optLong("sequence")>sequence && row.optJSONObject("frames") != null
          && row.getJSONObject("frames").length()==5
          && Math.abs(row.getJSONObject("dimensions").getDouble("fontScale")-scale)<0.000001
          && Math.abs(ui(() -> activity.getResources().getConfiguration().fontScale)-scale)<0.000001) {
        Thread.sleep(650); return;
      }
      Thread.sleep(100);
    }
    throw new AssertionError("No fresh complete fixture observation at scale "+scale);
  }
  private void scale(float value) throws Exception { shell("settings put system font_scale "+value); await(value); }
  private void snapshot(String stage) throws Exception {
    JSONObject row = observation();
    require(row != null && row.getLong("sequence")>sequence, "Stale/missing observation");
    sequence = row.getLong("sequence");
    row.put("native", ui(() -> {
      EditText current = (EditText)find("probe-input");
      if (input == null) { input=current; editable=input.getText(); }
      Rect bounds = new Rect(); current.getGlobalVisibleRect(bounds);
      return new JSONObject().put("sameView",current==input).put("sameEditable",current.getText()==editable)
          .put("viewIdentity",System.identityHashCode(current)).put("editableIdentity",System.identityHashCode(current.getText()))
          .put("activityIdentity",System.identityHashCode(activity)).put("value",current.getText().toString())
          .put("focused",current.isFocused()).put("selectionStart",current.getSelectionStart()).put("selectionEnd",current.getSelectionEnd())
          .put("textSizePx",current.getTextSize()).put("layoutHeightPx",current.getLayout()==null?-1:current.getLayout().getHeight())
          .put("heightPx",current.getHeight()).put("bounds",bounds.toShortString());
    }));
    samples.put(stage,row); // Preserve a failing observation before checking it.
    row.put("captureCommand", DisplayCapture.COMMAND);
    DisplayCapture.write(this, new File(output, stage + ".png"));
    JSONObject nativeRow=row.getJSONObject("native");
    require(row.getInt("mounts")==1 && nativeRow.getBoolean("sameView") && nativeRow.getBoolean("sameEditable"),"Root/input/Editable replaced: "+row);
    require(row.getString("value").equals(nativeRow.getString("value")),"JS/native value mismatch");
  }
  private void captureScale(String name,float value) throws Exception { scale(value); snapshot(name); }
  private void editing() throws Exception {
    snapshot("editing-start");
    ui(() -> {
      input.getClass().getMethod("requestFocusFromJS").invoke(input);
      input.setSelection(3); return null;
    });
    Thread.sleep(600); snapshot("editing-before");
    shell("input text Q"); Thread.sleep(600); snapshot("editing-typed-before");
    captureScale("editing-live2",2); captureScale("editing-return1",1);
    shell("input text Z"); Thread.sleep(600); snapshot("editing-insert");
  }
  @Override public void onStart() {
    Bundle result = new Bundle(); JSONObject report = new JSONObject();
    String originalScale="1", originalSize="reset"; int code=Activity.RESULT_CANCELED;
    try {
      require(scenario.matches("primary|cold2|cold085|cold13|sweep|editing"),"Unknown scenario");
      require(narrow.matches("[0-9]+x[0-9]+"),"Invalid narrow window");
      output=new File(getTargetContext().getExternalFilesDir(null),"font-fixture-"+scenario);
      require(output.mkdirs()||output.isDirectory(),"Evidence directory unavailable");
      originalScale=shell("settings get system font_scale");
      String window=shell("wm size");
      java.util.regex.Matcher match=java.util.regex.Pattern.compile("Override size: ([0-9]+x[0-9]+)").matcher(window);
      if(match.find())originalSize=match.group(1);
      float initial=scenario.equals("cold2")?2:scenario.equals("cold085")?.85f:scenario.equals("cold13")?1.3f:1;
      shell("settings put system font_scale "+initial);
      Intent intent=new Intent(); intent.setClassName("com.natophonetics.app","com.natophonetics.app.MainActivity");
      intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK); activity=startActivitySync(intent);
      tag=getTargetContext().getResources().getIdentifier("react_test_id","id","com.natophonetics.app");
      require(tag!=0,"Missing testID resource"); await(initial);
      if(scenario.equals("primary")) {
        snapshot("cold1"); captureScale("live2",2); captureScale("return1",1);
      } else if(scenario.equals("cold2")) {
        snapshot("cold2"); shell("wm size "+narrow); Thread.sleep(1200); snapshot("resize-narrow2");
        shell("wm size "+originalSize); Thread.sleep(1200); snapshot("resize-restored2");
      } else if(scenario.equals("sweep")) {
        float[] values={.85f,1.3f,2,1,.85f,2,1.3f,1};
        for(int i=0;i<values.length;i++)captureScale("sweep"+i+"-"+Float.toString(values[i]),values[i]);
      } else if(scenario.equals("editing")) { editing(); }
      else { snapshot(scenario); }
      report.put("passed",true); code=Activity.RESULT_OK;
    } catch(Throwable error) {
      try {report.put("passed",false).put("error",android.util.Log.getStackTraceString(error));}catch(Exception ignored) { }
    } finally {
      try {
        shell("settings put system font_scale "+originalScale); shell("wm size "+originalSize);
        report.put("samples",samples).put("scenario",scenario).put("outputDirectory",output==null?"":output.getAbsolutePath())
            .put("originalScale",originalScale).put("originalWindowOverride",originalSize)
            .put("scope","Separate Release fixture, normal AppRegistry startup, native observer; no inspector or root replacement");
        if(output!=null)try(FileOutputStream file=new FileOutputStream(new File(output,"report.json"))) { file.write(report.toString(2).getBytes(StandardCharsets.UTF_8)); }
      } catch(Exception error) { code=Activity.RESULT_CANCELED; result.putString("cleanupError",error.toString()); }
      result.putString("report",report.toString()); finish(code,result);
    }
  }
}
