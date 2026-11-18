// Diagnostic-only entry. Bundled into a COPY of the simulator app, never shipped.
// No router, speech, preference state or application components participate.
import React, { useState } from 'react';
import { AppRegistry, View, Text, TextInput } from 'react-native';

function Probe() {
  const [controlled, setControlled] = useState('');
  const [uncontrolled, setUncontrolled] = useState('');
  return <View style={{ padding: 24, paddingTop: 90, backgroundColor: 'white', flex: 1 }}>
    <Text>Minimal React Native 0.81.5 TextInput diagnostic</Text>
    <TextInput testID="controlled-input" accessibilityLabel="Controlled input"
      value={controlled} onChangeText={setControlled}
      autoCorrect={false} spellCheck={false} autoCapitalize="characters"
      style={{ height: 60, borderWidth: 1, marginVertical: 20, color: 'black' }} />
    <Text testID="controlled-output">{controlled}</Text>
    <TextInput testID="uncontrolled-input" accessibilityLabel="Uncontrolled input"
      defaultValue="" onChangeText={setUncontrolled}
      autoCorrect={false} spellCheck={false} autoCapitalize="characters"
      style={{ height: 60, borderWidth: 1, marginVertical: 20, color: 'black' }} />
    <Text testID="uncontrolled-output">{uncontrolled}</Text>
  </View>;
}
AppRegistry.registerComponent('NATOPhonetics', () => Probe);
