(() => {
  // DIAGNOSTIC ONLY: replace this debug surface with a minimal RN control via
  // the standard React DevTools renderer. No source/package changes are made.
  const modules = [...__r.getModules().values()];
  const exported = suffix => modules.find(m => m.verboseName.endsWith(suffix)).publicModule.exports;
  const React = exported('/react.development.js');
  const {Text, TextInput, ScrollView, View, useWindowDimensions} = exported('/react-native/index.js');
  globalThis.__fontProbe = {events: [], mounts: 0};
  function Probe() {
    const dimensions = useWindowDimensions();
    const [value, setValue] = React.useState('NUWJ359');
    React.useEffect(() => { __fontProbe.mounts += 1; }, []);
    __fontProbe.dimensions = dimensions;
    __fontProbe.value = value;
    const examples = [
      {name: 'body', text: 'Tap a card to hear the word. New playback replaces current audio.', style: {fontSize: 15}},
      {name: 'heading', text: 'NATO Phonetic Alphabet', style: {fontSize: 26, fontWeight: '700'}},
      {name: 'feedback', text: 'Correct! B is Bravo.', style: {fontSize: 16, lineHeight: 24}},
      {name: 'nested', text: 'Your text stays in memory.', style: {fontSize: 16, lineHeight: 24}},
    ];
    return React.createElement(ScrollView, {style: {backgroundColor: 'white'}, contentContainerStyle: {padding: 18, paddingTop: 48}},
      ...examples.map(example => React.createElement(View, {key: example.name, style: {flexDirection: 'row', marginBottom: 20, gap: 12}},
        ...['control', 'candidate'].map(kind => React.createElement(Text, {
          key: kind, testID: `${kind}-${example.name}`,
          style: [example.style, {color: 'black', width: 176}, ...(kind==='candidate'?[{minHeight:dimensions.fontScale}]:[])],
          ...(kind === 'candidate' ? {maxFontSizeMultiplier: dimensions.fontScale + 1} : {}),
          onTextLayout: e => __fontProbe.events.push({kind, name: example.name, scale: dimensions.fontScale, lines: e.nativeEvent.lines}),
        }, ...(example.name === 'nested' ? [React.createElement(Text, {key:'nested-heading', style:{fontWeight:'700'},
          ...(kind === 'candidate' ? {maxFontSizeMultiplier: dimensions.fontScale + 1} : {})}, 'Text and practice\n'), example.text] : [example.text]))))),
      ...['control', 'candidate'].map(kind => React.createElement(TextInput, {
        key: kind, testID: `${kind}-input`, value, onChangeText: setValue,
        onContentSizeChange: e => __fontProbe.events.push({kind, name:'input', scale:dimensions.fontScale, size:e.nativeEvent.contentSize}),
        style: [{fontSize: 18, color: 'black', borderWidth: 1, marginBottom: 10}, ...(kind==='candidate'?[{minHeight:dimensions.fontScale}]:[])],
        ...(kind === 'candidate' ? {maxFontSizeMultiplier: dimensions.fontScale + 1} : {}),
      })));
  }
  const hook = __REACT_DEVTOOLS_GLOBAL_HOOK__;
  for (const [id, renderer] of [...hook.renderers]) {
    for (const root of [...hook.getFiberRoots(id)]) renderer.scheduleRoot(root, React.createElement(Probe));
  }
  return 'mounted diagnostic control';
})()
