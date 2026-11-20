// DIAGNOSTIC ENTRY ONLY. Normal AppRegistry startup; never replaces a live root.
import {useEffect, useRef, useState} from 'react';
import {AppRegistry, ScrollView, Text, TextInput, View, useWindowDimensions} from 'react-native';

globalThis.__fontProbe = {mounts: 0, events: [], frames: {}, value: 'NUWJ359'};
function Probe() {
  const dimensions = useWindowDimensions();
  const [value, setValue] = useState('NUWJ359');
  const refs = useRef({});
  const observation = useRef(null);
  useEffect(() => { globalThis.__fontProbe.mounts += 1; }, []);
  // Test fixture only: native instrumentation can observe a production-mode
  // Hermes bundle without an inspector, state update, or root replacement.
  useEffect(() => {
    let active = true;
    const timer = setInterval(() => {
      const probe = globalThis.__fontProbe;
      const measuredDimensions = probe.dimensions;
      Promise.all(Object.entries(refs.current).map(([name, ref]) => new Promise(resolve => {
        if (!ref) { resolve(null); return; }
        ref.measureInWindow((x,y,width,height) => resolve([name, {x,y,width,height}]));
      }))).then(rows => {
        if (!active || measuredDimensions !== globalThis.__fontProbe.dimensions || rows.some(row => !row)) return;
        observation.current?.setNativeProps({accessibilityLabel: JSON.stringify({
          ...probe, frames: Object.fromEntries(rows), events: probe.events.slice(-100),
          sequence: (probe.sequence = (probe.sequence || 0) + 1),
        })});
      });
    }, 200);
    return () => { active = false; clearInterval(timer); };
  }, []);
  globalThis.__fontProbe.dimensions = dimensions;
  globalThis.__fontProbe.value = value;
  globalThis.__fontProbe.sample = () => {
    Object.entries(refs.current).forEach(([name, ref]) => ref?.measureInWindow((x,y,width,height) => {
      globalThis.__fontProbe.frames[name] = {x,y,width,height};
    }));
  };
  const examples = [
    ['stable', 'Tap a card to hear the word. New playback replaces current audio.'],
    ['revision', `Tap a card to hear the word. New playback replaces current audio. Scale ${dimensions.fontScale}`],
    ['feedback', 'Correct! B is Bravo.'],
  ];
  return <ScrollView style={{backgroundColor: 'white'}} contentContainerStyle={{padding: 18,paddingTop: 48}}>
    <View ref={observation} testID="probe-observation" collapsable={false}
      pointerEvents="none" style={{position:'absolute',width:0,height:0}} />
    <Text style={{color:'black',fontSize:14}}>Diagnostic normal startup — scale {dimensions.fontScale}</Text>
    {examples.map(([name,text]) => <View key={name} style={{marginBottom:12}}>
      <Text ref={ref=>{refs.current[name]=ref;}} testID={name}
        style={{color:'black',fontSize:16,width:260,...(name==='feedback'?{lineHeight:24}:{})}}
        onTextLayout={e=>globalThis.__fontProbe.events.push({name,scale:dimensions.fontScale,lines:e.nativeEvent.lines})}>{text}</Text>
    </View>)}
    <TextInput ref={ref=>{refs.current.input=ref;}} testID="probe-input" value={value}
      onChangeText={setValue} onSelectionChange={e=>{globalThis.__fontProbe.selection=e.nativeEvent.selection;}}
      onFocus={()=>{globalThis.__fontProbe.focused=true;}} onBlur={()=>{globalThis.__fontProbe.focused=false;}}
      onContentSizeChange={e=>globalThis.__fontProbe.events.push({name:'input',scale:dimensions.fontScale,size:e.nativeEvent.contentSize})}
      style={{color:'black',fontSize:18,borderWidth:1}}/>
    <Text ref={ref=>{refs.current.nested=ref;}} testID="nested"
      style={{color:'black',fontSize:16,width:260,lineHeight:24}}
      onTextLayout={e=>globalThis.__fontProbe.events.push({name:'nested',scale:dimensions.fontScale,lines:e.nativeEvent.lines})}>
      Nested <Text style={{fontWeight:'bold'}}>stable bold text</Text> and <Text style={{fontStyle:'italic'}}>italic words</Text> wrap with the system font size.
    </Text>
  </ScrollView>;
}
AppRegistry.registerComponent('NATOPhonetics', () => Probe);
