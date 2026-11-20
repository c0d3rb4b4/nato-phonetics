import Java from '/tmp/nato-run20-trace-js/node_modules/frida-java-bridge/index.js';
let stage='boot';
rpc.exports={stage(value){stage=value;}};
function report(kind,details){send({stage,kind,time:Date.now(),thread:Process.getCurrentThreadId(),...details});}
Process.attachModuleObserver({onAdded(rn){
if(rn.name!=='libreactnative.so')return;
const exports=rn.enumerateExports();
for(const e of exports.filter(e=>/ParagraphShadowNode.*measureContent|TextLayoutManager.*measureER/.test(e.name))){
  Interceptor.attach(e.address,{
    onEnter(args){this.measure=e.name.includes('TextLayoutManager');this.output=this.context.x8;
      report(this.measure?'cpp-measure-enter':'paragraph-enter',{symbol:e.name,node:args[0].toString()});},
    onLeave(){let size;
      if(this.measure)try{size={width:this.output.readFloat(),height:this.output.add(4).readFloat()};}catch(error){size={error:String(error)};}
      report(this.measure?'cpp-measure-leave':'paragraph-leave',{size});},
  });
  report('hook',{symbol:e.name});
}
}});
Java.perform(()=>{
  const Fabric=Java.use('com.facebook.react.fabric.FabricUIManager');
  const method=Fabric.measureText.overloads[0];
  method.implementation=function(...args){
    const result=method.call(this,...args);
    report('jni-measure',{surface:args[0],text:args[1].contains(1)?args[1].getString(1):'(input cache)',constraints:args.slice(3,7),result:String(result)});
    return result;
  };
  const Manager=Java.use('com.facebook.react.views.text.TextLayoutManager');
  const create=Manager.createLayoutForMeasurement.overloads[0];
  create.implementation=function(...args){
    const layout=create.call(this,...args);
    report('java-layout',{fontScale:args[0].getResources().getConfiguration().fontScale.value,
      text:String(layout.getText()),height:layout.getHeight(),width:layout.getWidth(),lines:layout.getLineCount(),paintSize:layout.getPaint().getTextSize()});
    return layout;
  };
  report('java-ready',{});
});
