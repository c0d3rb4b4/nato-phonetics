import { router } from '../src/navigation';
import { StyleSheet, Text, View } from 'react-native';
import { PlaybackButton, PlaybackNotice } from '../src/components/PlaybackControls';
import { Button, Heading, Screen } from '../src/components/ui';
import { useTheme } from '../src/context/ThemeContext';
import { NATO_ALPHABET, NATO_NUMBERS } from '../src/data/natoData';
import { usePlayback } from '../src/hooks/usePlayback';

export default function AudioHelpScreen() {
  const { theme } = useTheme();
  const audio = usePlayback('audio-help');
  const textStyle = [styles.text, { color: theme.colors.text }];
  return <Screen overlay={<PlaybackNotice audio={audio} showHelp={false} />}>
    <View style={styles.audioRow}>
      <View style={styles.audioHeading}><Heading>Test your audio</Heading></View>
      <PlaybackButton audio={audio} label="Play audio test" testID="audio-test-playback" onPlay={() => {
        void audio.play([
          ...NATO_ALPHABET.slice(0, 2), ...NATO_NUMBERS.filter(entry => ['3', '5', '9'].includes(entry.digit)),
        ].map(entry => ({ text: entry.speechText })));
      }} />
    </View>
    <Text style={textStyle}>The test plays Alfa, Bravo, then the radio pronunciations for 3, 5 and 9. Compare the digits with TREE, FIFE and NIN-er.</Text>
    <Heading>If you cannot hear speech</Heading>
    <Text style={textStyle}>Check media volume, connected headphones and Bluetooth audio. On a physical iPhone, turn off silent mode. Try System Default or another installed English voice. Install voices using your device speech settings, then retry the voice list.</Text>
    <Button label="Choose a voice" variant="secondary" onPress={() => router.push('/voice-select')} />
    <Heading>Playback and privacy</Heading>
    <Text style={textStyle}>Letter Quiz includes listening practice with Play code word, Stop and a text alternative when you cannot use audio. Typed recall uses the canonical code word without a microphone. Listening text alternatives count toward the same practice score; pronunciation guides are not alternative typed answers.</Text>
    <Text style={textStyle}>Every submitted answer adds to local symbol progress, including listening text alternatives. Menu → Learning progress explains review times and offers Clear Progress. Reset Preferences keeps progress. Typed answers and recaps are not saved.</Text>
    <Text style={textStyle}>Starting another card, phrase, quiz answer or preview replaces the current audio. Stop, leaving the screen, editing converter text or backgrounding the app cancels the remaining words and pauses. If a provider does not finish, playback times out with a retry message.</Text>
    <Text style={textStyle}>Audio uses your device or browser speech provider. Some voices need a network connection. The app does not verify where a provider processes text, guarantee offline speech, or request microphone access for playback. Pronunciation varies by voice; the written guide remains available.</Text>
    <Button label="Privacy Policy" variant="secondary" onPress={() => router.push('/privacy')} />
  </Screen>;
}
const styles = StyleSheet.create({
  audioRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  audioHeading: { flex: 1 },
  text: { fontSize: 16, lineHeight: 25, marginBottom: 16 },
});
