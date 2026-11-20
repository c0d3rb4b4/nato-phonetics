(() => {
  const hook = globalThis.__REACT_DEVTOOLS_GLOBAL_HOOK__;
  const roots = [...hook.renderers.keys()].flatMap(id => [...hook.getFiberRoots(id)]);
  const seen = new Set(), texts = [];
  const flat = value => Array.isArray(value) ? Object.assign({}, ...value.map(flat)) : (typeof value === 'object' ? value : {});
  function visit(node) {
    if (!node || seen.has(node)) return; seen.add(node);
    if (node.tag === 5 && (typeof node.memoizedProps?.children === 'string' || typeof node.memoizedProps?.value === 'string')) {
      const state = node.stateNode;
      texts.push({text: node.memoizedProps.children ?? node.memoizedProps.value, testID:node.memoizedProps.testID,
        style:flat(node.memoizedProps.style), instance:state?.canonical?.publicInstance ?? state?.publicInstance ?? state});
    }
    visit(node.child); visit(node.sibling);
  }
  for (const root of roots) visit(root.current);
  const dimensions=[...globalThis.__r.getModules().values()].find(m=>m.verboseName.endsWith('/Dimensions.js')).publicModule.exports.default.get('window');
  globalThis.__natoTextMeasurements={pending:true};
  Promise.all(texts.map(row => new Promise(resolve => {
    const {instance,...data}=row;
    if(typeof instance?.measure!=='function')return resolve({...data,error:'No host measure'});
    instance.measure((x,y,width,height,pageX,pageY)=>resolve({...data,frame:{x,y,width,height,pageX,pageY}}));
    setTimeout(()=>resolve({...data,error:'Timeout'}),2500);
  }))).then(values=>globalThis.__natoTextMeasurements={values,dimensions});
  return {queued:texts.length};
})()
