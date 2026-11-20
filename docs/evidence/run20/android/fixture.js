// DIAGNOSTIC ENTRY ONLY. Normal AppRegistry startup; never replaces a live root.
import React, {useEffect, useRef, useState} from 'react';
import {AppRegistry, ScrollView, Text, TextInput, View, useWindowDimensions} from 'react-native';

globalThis.__fontProbe = {mounts: 0, events: [], frames: {}, value: 'NUWJ359'};
function Probe() {
  const dimensions = useWindowDimensions();
  const [value, setValue] = useState('NUWJ359');
  const refs = useRef({});
  useEffect(() => { globalThis.__fontProbe.mounts += 1; }, []);
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
    <Text style={{color:'black',fontSize:14}}>Diagnostic normal startup — scale {dimensions.fontScale}</Text>
    {examples.map(([name,text]) => <View key={name} style={{marginBottom:12}}>
      <Text ref={ref=>{refs.current[name]=ref;}} testID={name}
        style={{color:'black',fontSize:16,width:260,...(name==='feedback'?{lineHeight:24}:{})}}
        onTextLayout={e=>globalThis.__fontProbe.events.push({name,scale:dimensions.fontScale,lines:e.nativeEvent.lines})}>{text}</Text>
    </View>)}
    <TextInput ref={ref=>{refs.current.input=ref;}} testID="probe-input" value={value}
      onChangeText={setValue} onSelectionChange={e=>{globalThis.__fontProbe.selection=e.nativeEvent.selection;}}
      onContentSizeChange={e=>globalThis.__fontProbe.events.push({name:'input',scale:dimensions.fontScale,size:e.nativeEvent.contentSize})}
      style={{color:'black',fontSize:18,borderWidth:1}}/>
  </ScrollView>;
}
AppRegistry.registerComponent('NATOPhonetics', () => Probe);
