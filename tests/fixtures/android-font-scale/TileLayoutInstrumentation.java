package com.natophonetics.fonttest;

import android.app.Activity;
import android.app.Instrumentation;
import android.content.Intent;
import android.graphics.Matrix;
import android.graphics.Rect;
import android.net.Uri;
import android.os.Bundle;
import android.text.Layout;
import android.text.Spanned;
import android.text.TextPaint;
import android.text.style.MetricAffectingSpan;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;
import java.io.File;
import java.io.FileOutputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.util.concurrent.Callable;
import org.json.JSONArray;
import org.json.JSONObject;

/** Read-only native tile observer in a separate test APK; no product/JS hooks. */
public final class TileLayoutInstrumentation extends Instrumentation {
  private Activity activity;
  private File output;
  private int tag;
  private <T> T ui(Callable<T> action) throws Exception {
    Object[] result = new Object[2];
    runOnMainSync(() -> { try { result[0]=action.call(); } catch(Throwable e) { result[1]=e; } });
    if(result[1]!=null)throw new Exception((Throwable)result[1]);
    @SuppressWarnings("unchecked") T value=(T)result[0]; return value;
  }
  private void write(String name,JSONObject row) throws Exception {
    try(FileOutputStream file=new FileOutputStream(new File(output,name))) {
      file.write((row.toString(2)+"\n").getBytes(StandardCharsets.UTF_8));
    }
  }
  private Object getter(Object object,String name) throws Exception {
    return object.getClass().getMethod(name).invoke(object);
  }
  private JSONObject frame(View view) throws Exception {
    // Includes actual ancestor scroll/translation and subpixel Text transform.
    Matrix matrix=new Matrix(); view.transformMatrixToGlobal(matrix);
    float[] origin={0,0}; matrix.mapPoints(origin);
    Rect visible=new Rect(); boolean shown=view.getGlobalVisibleRect(visible);
    return new JSONObject().put("x",origin[0]).put("y",origin[1])
        .put("width",view.getWidth()).put("height",view.getHeight())
        .put("translationY",view.getTranslationY()).put("shown",shown)
        .put("visible",new JSONArray(new int[]{visible.left,visible.top,visible.right,visible.bottom}));
  }
  private void visit(View view,JSONArray rows) throws Exception {
    // Retained navigation entries use display:none. Android may retain their
    // children's old frames; never treat those as the active native subtree.
    if(view.getVisibility()!=View.VISIBLE || view.getWidth()==0 || view.getHeight()==0)return;
    Object testID=view.getTag(tag);
    if(testID instanceof String && ((String)testID).matches("(alphabet-.*|converter-[0-9]+.*|quiz-.*)")) {
      JSONObject row=new JSONObject().put("id",testID).put("class",view.getClass().getName())
          .put("identity",System.identityHashCode(view)).put("frame",frame(view));
      JSONArray ancestors=new JSONArray();android.view.ViewParent ancestor=view.getParent();
      while(ancestor instanceof View) {
        View parent=(View)ancestor;
        ancestors.put(new JSONObject().put("width",parent.getWidth()).put("height",parent.getHeight())
            .put("visibility",parent.getVisibility()).put("alpha",parent.getAlpha()));
        ancestor=parent.getParent();
      }
      row.put("ancestors",ancestors);
      Object background=view.getBackground();
      if(background!=null) {
        row.put("backgroundClass",background.getClass().getName());
        if(background.getClass().getName().endsWith("CompositeBackgroundDrawable")) {
          Object radii=getter(background,"getBorderRadius");
          if(radii!=null) {
            Object radius=getter(radii,"getUniform");
            if(radius!=null)row.put("radius",new JSONObject().put("value",radius.getClass().getMethod("resolve",float.class).invoke(radius,1f))
                .put("unit",getter(radius,"getType").toString()));
          }
        }
      }
      if(view instanceof TextView) {
        TextView text=(TextView)view; Layout layout=text.getLayout();
        row.put("text",text.getText().toString()).put("includeFontPadding",text.getIncludeFontPadding())
            .put("paddingLeft",text.getCompoundPaddingLeft()).put("paddingTop",text.getCompoundPaddingTop())
            .put("totalPaddingTop",text.getTotalPaddingTop()).put("textSizePx",text.getTextSize());
        if(layout!=null) {
          JSONArray lines=new JSONArray();
          for(int i=0;i<layout.getLineCount();i++)lines.put(new JSONObject()
              .put("baseline",layout.getLineBaseline(i)).put("top",layout.getLineTop(i)).put("bottom",layout.getLineBottom(i))
              .put("left",layout.getLineLeft(i)).put("right",layout.getLineRight(i))
              .put("start",layout.getLineStart(i)).put("end",layout.getLineEnd(i)));
          row.put("lines",lines).put("layoutClass",layout.getClass().getName()).put("layoutHeight",layout.getHeight());
          TextPaint paint=new TextPaint(layout.getPaint()); JSONArray spans=new JSONArray();
          if(text.getText() instanceof Spanned) {
            Spanned content=(Spanned)text.getText();
            for(Object span:content.getSpans(0,content.length(),Object.class)) {
              JSONObject item=new JSONObject().put("class",span.getClass().getName())
                  .put("start",content.getSpanStart(span)).put("end",content.getSpanEnd(span));
              if(span instanceof MetricAffectingSpan)((MetricAffectingSpan)span).updateMeasureState(paint);
              if(span.getClass().getSimpleName().equals("CustomStyleSpan")) {
                for(String method:new String[]{"getFontFamily","getStyle","getWeight"}) {
                  try { item.put(method,getter(span,method)); } catch(NoSuchMethodException ignored) { }
                }
              }
              spans.put(item);
            }
          }
          row.put("spans",spans).put("resolvedTextSizePx",paint.getTextSize())
              .put("resolvedTypefaceStyle",paint.getTypeface()==null?-1:paint.getTypeface().getStyle())
              .put("resolvedTypefaceWeight",paint.getTypeface()==null?-1:paint.getTypeface().getWeight())
              .put("resolvedLetterSpacing",paint.getLetterSpacing());
        }
      }
      rows.put(row);
    }
    if(view instanceof ViewGroup) {
      ViewGroup group=(ViewGroup)view;
      for(int i=0;i<group.getChildCount();i++)visit(group.getChildAt(i),rows);
    }
  }
  private JSONObject snapshot() throws Exception {
    return ui(() -> {
      JSONArray rows=new JSONArray();visit(activity.getWindow().getDecorView(),rows);
      android.util.DisplayMetrics metrics=activity.getResources().getDisplayMetrics();
      return new JSONObject().put("values",rows).put("activityIdentity",System.identityHashCode(activity))
          .put("dimensions",new JSONObject().put("density",metrics.density)
              .put("fontScale",activity.getResources().getConfiguration().fontScale))
          .put("baselineSource","Actual Android TextView Layout.getLineBaseline + totalPaddingTop + transformMatrixToGlobal; physical pixels")
          .put("timestampMillis",System.currentTimeMillis());
    });
  }
  @Override public void onCreate(Bundle arguments) { super.onCreate(arguments);start(); }
  @Override public void onStart() {
    Bundle result=new Bundle();int code=Activity.RESULT_CANCELED;
    try {
      output=new File(getTargetContext().getExternalFilesDir(null),"tile-observer");
      if(!output.mkdirs()&&!output.isDirectory())throw new AssertionError("Evidence directory unavailable");
      File request=new File(output,"request.json");request.delete();
      Intent intent=new Intent(Intent.ACTION_VIEW,Uri.parse("natophonetics://settings"));
      intent.setClassName("com.natophonetics.app","com.natophonetics.app.MainActivity");
      intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);activity=startActivitySync(intent);
      tag=getTargetContext().getResources().getIdentifier("react_test_id","id","com.natophonetics.app");
      if(tag==0)throw new AssertionError("Missing testID resource");
      write("ready.json",new JSONObject().put("ready",true).put("activityIdentity",System.identityHashCode(activity)));
      long deadline=System.currentTimeMillis()+30*60*1000;
      while(System.currentTimeMillis()<deadline) {
        if(!request.isFile()) {Thread.sleep(100);continue;}
        JSONObject command=new JSONObject(new String(Files.readAllBytes(request.toPath()),StandardCharsets.UTF_8));request.delete();
        String name=command.getString("name");
        if(!name.matches("[a-zA-Z0-9-]+"))throw new AssertionError("Invalid capture name");
        if(command.optBoolean("finish")) {code=Activity.RESULT_OK;break;}
        JSONObject row=snapshot();write(name+".json",row);
        write(name+"-done.json",new JSONObject().put("passed",true).put("name",name));
      }
      if(code!=Activity.RESULT_OK)throw new AssertionError("Observer timed out");
    } catch(Throwable error) {
      result.putString("error",android.util.Log.getStackTraceString(error));
      try {if(output!=null)write("error.json",new JSONObject().put("error",android.util.Log.getStackTraceString(error)));}catch(Exception ignored) { }
    }
    finish(code,result);
  }
}
