import Java from '/tmp/nato-run20-trace-js/node_modules/frida-java-bridge/index.js';
let stage='boot';rpc.exports={stage(value){stage=value;}};
function report(kind,details){send({stage,kind,time:Date.now(),...details});}
Java.perform(()=>{
  const Pixel=Java.use('com.facebook.react.uimanager.PixelUtil');
  const Holder=Java.use('com.facebook.react.uimanager.DisplayMetricsHolder');
  const Typed=Java.use('android.util.TypedValue');
  const App=Java.use('android.app.ActivityThread');
  function environment(){
    const app=App.currentApplication();const metrics=app.getResources().getDisplayMetrics();
    return {applicationFontScale:app.getResources().getConfiguration().fontScale.value,holderSP16:Pixel.toPixelFromSP.overload('float').call(Pixel,16),resourceSP16:Typed.applyDimension(2,16,metrics),holderScaledDensity:Holder.getWindowDisplayMetrics().scaledDensity.value};
  }
  const Surface=Java.use('com.facebook.react.fabric.SurfaceHandlerBinding');const constraints=Surface.setLayoutConstraints.overloads[0];
  constraints.implementation=function(...args){report('surface-constraints',{values:args,...environment()});return constraints.call(this,...args);};
  const Manager=Java.use('com.facebook.react.views.text.TextLayoutManager');const create=Manager.createLayoutForMeasurement.overloads[0];
  create.implementation=function(...args){const before=environment();const layout=create.call(this,...args);report('java-layout',{...before,contextFontScale:args[0].getResources().getConfiguration().fontScale.value,text:String(layout.getText()),height:layout.getHeight(),lines:layout.getLineCount()});return layout;};
  report('java-ready',{});
});
