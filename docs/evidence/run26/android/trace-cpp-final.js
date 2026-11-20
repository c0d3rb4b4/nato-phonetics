let stage='boot';rpc.exports={stage(value){stage=value;}};
const callers=new Map();function report(kind,data){send({stage,kind,time:Date.now(),thread:Process.getCurrentThreadId(),...data});}
Process.attachModuleObserver({onAdded(module){
 if(module.name!=='libreactnative.so')return;
 const exports=module.enumerateExports();
 const getValue=new NativeFunction(exports.find(s=>s.name==='_ZNK8facebook5react19AttributedStringBox8getValueEv').address,'pointer',['pointer']);
 const getBase=new NativeFunction(exports.find(s=>s.name==='_ZNK8facebook5react16AttributedString21getBaseTextAttributesEv').address,'pointer',['pointer']);
 const getFragments=new NativeFunction(exports.find(s=>s.name==='_ZNK8facebook5react16AttributedString12getFragmentsEv').address,'pointer',['pointer']);
 for(const symbol of exports.filter(s=>/ParagraphShadowNode.*measureContent|AndroidTextInputShadowNode.*measureContent|YogaLayoutableShadowNode.*layoutTree|TextLayoutManager.*measureER/.test(s.name))){
  Interceptor.attach(symbol.address,{
   onEnter(args){
    this.symbol=symbol.name;this.manager=symbol.name.includes('TextLayoutManager');this.output=this.context.x8;this.thread=Process.getCurrentThreadId();
    if(!this.manager){this.previous=callers.get(this.thread);callers.set(this.thread,{symbol:this.symbol,node:args[0].toString(),font:args[1].add(20).readFloat(),generation:args[1].add(32).readU64().toString()});report('layout-context',callers.get(this.thread));}
    else {
     this.caller=callers.get(this.thread)??null;
     const text=getValue(args[1]), base=getBase(text), fragments=getFragments(text), begin=fragments.readPointer(), end=fragments.add(Process.pointerSize).readPointer();
     report('cpp-measure-enter',{caller:this.caller,baseMultiplier:base.add(52).readFloat(),fragmentMultiplier:begin.equals(end)?null:begin.add(24+52).readFloat()});
    }
   },
   onLeave(){if(this.manager)report('cpp-measure-leave',{caller:this.caller,width:this.output.readFloat(),height:this.output.add(4).readFloat()});else callers.set(this.thread,this.previous);}
  });
 }
 const prepared=exports.find(s=>/ReactNativeFeatureFlags.*enablePreparedTextLayoutEv/.test(s.name));
 if(prepared)Interceptor.attach(prepared.address,{onLeave(value){report('prepared-text-flag',{value:(value.toInt32()&255)!==0});}});
}});
