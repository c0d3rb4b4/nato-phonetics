let stage='boot';rpc.exports={stage(value){stage=value;}};
const callers=new Map();function report(kind,data){send({stage,kind,time:Date.now(),thread:Process.getCurrentThreadId(),...data});}
Process.attachModuleObserver({onAdded(module){
 if(module.name!=='libreactnative.so')return;
 for(const symbol of module.enumerateExports().filter(s=>/ParagraphShadowNode.*measureContent|AndroidTextInputShadowNode.*measureContent|YogaLayoutableShadowNode.*layoutTree|TextLayoutManager.*measureER/.test(s.name))){
  Interceptor.attach(symbol.address,{
   onEnter(args){
    this.symbol=symbol.name;this.manager=symbol.name.includes('TextLayoutManager');this.output=this.context.x8;this.thread=Process.getCurrentThreadId();
    if(!this.manager){this.previous=callers.get(this.thread);callers.set(this.thread,this.symbol);report('layout-context',{symbol:this.symbol,fontMultiplier:args[1].add(20).readFloat(),pointDensity:args[1].readFloat()});}
    else report('cpp-measure-enter',{caller:callers.get(this.thread)??null});
   },
   onLeave(){if(this.manager)report('cpp-measure-leave',{caller:callers.get(this.thread)??null,width:this.output.readFloat(),height:this.output.add(4).readFloat()});else callers.set(this.thread,this.previous);}
  });
 }
}});
