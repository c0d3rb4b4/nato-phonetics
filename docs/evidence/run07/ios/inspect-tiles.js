(() => {
  const hook = globalThis.__REACT_DEVTOOLS_GLOBAL_HOOK__;
  const roots = [...hook.renderers.keys()].flatMap(id => [...hook.getFiberRoots(id)]);
  const seen = new Set(); const tiles = [];
  function visit(node) {
    if (!node || seen.has(node)) return; seen.add(node);
    const id = node.memoizedProps?.testID;
    if (node.tag === 5 && id && /^(alphabet-|converter-\d|quiz-card|quiz-letter|quiz-answer)/.test(id)) {
      const state = node.stateNode;
      const instance = state?.canonical?.publicInstance ?? state?.publicInstance ?? state;
      let ancestor=node.return;let nativeLineMeasurement=null;let nativeOrigins={};
      while(ancestor){
        if(ancestor.type?.name==='TileText'){
          let h=ancestor.memoizedState;
          while(h){
            if(h.memoizedState && typeof h.memoizedState.baseline==='number' && typeof h.memoizedState.key==='string')nativeLineMeasurement={...h.memoizedState,source:'Actual onTextLayout native event y+ascender retained by useTileBaseline'};
            if(h.memoizedState && typeof h.memoizedState.y==='number' && typeof h.memoizedState.key==='string')nativeOrigins.box={...h.memoizedState,source:'Actual onLayout native event layout.y retained by useTileOrigin'};
            h=h.next;
          }
          nativeOrigins.parentYUsed=ancestor.memoizedProps.parentY;
        }
        if(ancestor.type?.name==='NatoTile'){
          let h=ancestor.memoizedState;const origins=[];
          while(h){if(h.memoizedState && typeof h.memoizedState.y==='number' && typeof h.memoizedState.key==='string')origins.push({...h.memoizedState,source:'Actual onLayout native event layout.y retained by useTileOrigin'});h=h.next;}
          if(origins.length){nativeOrigins.header=origins[0];nativeOrigins.body=origins[1];}break;
        }ancestor=ancestor.return;
      }
      const flat = value => Array.isArray(value) ? Object.assign({},...value.map(flat)) : (typeof value === 'object' ? value : {});
      tiles.push({id, tag:state?.canonical?.nativeTag ?? state?._nativeTag, style:flat(node.memoizedProps.style), allowFontScaling:node.memoizedProps.allowFontScaling,
        nativeLineMeasurement, nativeOrigins, text:typeof node.memoizedProps.children === 'string' ? node.memoizedProps.children : null, instance});
    }
    visit(node.child); visit(node.sibling);
  }
  for (const root of roots) visit(root.current);
  const dimensions=[...globalThis.__r.getModules().values()].find(m=>m.verboseName.endsWith('/Dimensions.js')).publicModule.exports.default.get('window');
  globalThis.__natoTileMeasurements = {pending:true,dimensions};
  Promise.all(tiles.map(row => new Promise(resolve => {
    const {instance,...data}=row;
    if (typeof instance?.measure !== 'function') return resolve({...data,measurementError:'No host measure'});
    instance.measure((x,y,width,height,pageX,pageY)=>resolve({...data,frame:{x,y,width,height,pageX,pageY}}));
    setTimeout(()=>resolve({...data,measurementError:'Timeout'}),2500);
  }))).then(values=>{globalThis.__natoTileMeasurements={values,dimensions};});
  return {queued:tiles.length};
})()
