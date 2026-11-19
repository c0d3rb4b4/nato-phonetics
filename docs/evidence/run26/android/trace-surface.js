import Java from '/tmp/nato-run20-trace-js/node_modules/frida-java-bridge/index.js';
let stage='boot';
rpc.exports={stage(value){stage=value;}};
function report(kind,details){send({stage,kind,time:Date.now(),thread:Process.getCurrentThreadId(),...details});}
Process.attachModuleObserver({onAdded(rn){
if(rn.name!=='libreactnative.so')return;
const exports=rn.enumerateExports();
report('boundary-symbols',{symbols:exports.filter(e=>/RootShadowNode.*clone|RootShadowNode.*layoutIfNeeded|SurfaceHandler.*constraintLayout|YogaLayoutableShadowNode.*(configureYogaTree|layoutTree|getIsLayoutClean|dirtyLayout)/.test(e.name)).map(e=>e.name)});
const cleanSymbol=exports.find(e=>/YogaLayoutableShadowNode.*getIsLayoutClean/.test(e.name));
const clean=cleanSymbol?new NativeFunction(cleanSymbol.address,'bool',['pointer']):null;
function context(ptr){try{return {pointScaleFactor:ptr.readFloat(),fontSizeMultiplier:ptr.add(20).readFloat(),pointer:ptr.toString()};}catch(error){return {error:String(error)};}}
for(const e of exports.filter(e=>/RootShadowNode.*clone|RootShadowNode.*layoutIfNeeded|SurfaceHandler.*constraintLayout|YogaLayoutableShadowNode.*(configureYogaTree|layoutTree)/.test(e.name))){
  Interceptor.attach(e.address,{
    onEnter(args){
      this.node=args[0];this.symbol=e.name;
      const details={symbol:e.name,node:this.node.toString()};
      if(e.name.includes('constraintLayout'))details.context=context(args[2]);
      if(e.name.includes('RootShadowNode')&&e.name.includes('clone'))details.context=context(args[3]);
      if(e.name.includes('layoutTree'))details.context=context(args[1]);
      if(clean&&e.name.includes('YogaLayoutableShadowNode'))details.clean=clean(this.node);
      report('boundary-enter',details);
    },
    onLeave(result){report('boundary-leave',{symbol:this.symbol,node:this.node.toString(),result:result.toString()});}
  });
}

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
  const Surface=Java.use('com.facebook.react.fabric.SurfaceHandlerBinding');
  const constraints=Surface.setLayoutConstraints.overloads[0];
  constraints.implementation=function(...args){
    report('surface-constraints',{values:args});
    return constraints.call(this,...args);
  };

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

Java.perform(()=>{
  const Activity=Java.use('com.natophonetics.app.MainActivity');
  const config=Activity.onConfigurationChanged.overloads[0];
  config.implementation=function(next){
    report('activity-config-before',{requested:next.fontScale.value,resources:this.getResources().getConfiguration().fontScale.value});
    const result=config.call(this,next);
    report('activity-config-after',{requested:next.fontScale.value,resources:this.getResources().getConfiguration().fontScale.value});
    return result;
  };
  const Surface=Java.use('com.facebook.react.runtime.ReactSurfaceImpl');
  const update=Surface.updateLayoutSpecs.overloads[0];
  update.implementation=function(...args){
    report('update-layout-specs',{fontScale:this.getContext().getResources().getConfiguration().fontScale.value,arguments:args});
    return update.call(this,...args);
  };
});
