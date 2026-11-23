import { Platform, StyleSheet, View } from 'react-native';
import { PlaybackButton, PlaybackNotice } from '../src/components/PlaybackControls';
import { NavigationRow, Screen, SectionHeading, SupportingText } from '../src/components/ui';
import { NATO_ALPHABET, NATO_NUMBERS } from '../src/data/natoData';
import { usePlayback } from '../src/hooks/usePlayback';

export default function AudioHelpScreen() {
  const audio = usePlayback('audio-help');
  return <Screen overlay={<PlaybackNotice audio={audio} showHelp={false} />}>
    <View style={styles.audioRow}>
      <View style={styles.audioHeading}><SectionHeading>Test your audio</SectionHeading></View>
      <PlaybackButton audio={audio} label="Play audio test" testID="audio-test-playback" onPlay={() => {
        void audio.play([
          ...NATO_ALPHABET.slice(0, 2), ...NATO_NUMBERS.filter(entry => ['3', '5', '9'].includes(entry.digit)),
        ].map(entry => ({ text: entry.speechText })));
      }} />
    </View>
    <SupportingText muted={false}>The test plays Alfa, Bravo, then the radio pronunciations for 3, 5 and 9. Compare the digits with TREE, FIFE and NIN-er.</SupportingText>
    <View style={styles.section}>
      <SectionHeading>If you cannot hear speech</SectionHeading>
      <SupportingText muted={false}>Check media volume, headphones and Bluetooth. On an iPhone, turn off silent mode.</SupportingText>
      <SupportingText muted={false}>Try System Default or another English voice. You can install more voices in your device speech settings, then refresh the voice list.</SupportingText>
      <NavigationRow title="Choose a voice" route="/voice-select" icon="mic-outline" />
    </View>
    <View style={styles.section}>
      <SectionHeading>Playback and privacy</SectionHeading>
      <SupportingText muted={false}>Letter Quiz includes listening practice with Play code word, Stop and a text alternative when you cannot use audio. Typed recall uses the canonical code word without a microphone. Listening text alternatives count toward the same practice score; pronunciation guides are not alternative typed answers.</SupportingText>
      {Platform.OS === 'android' && <SupportingText muted={false}>In Letter Quiz, choose Speak a code word. Start recording uses the device’s US English model. Stop recording ends the input. Review or edit the word before checking. If the model or microphone is unavailable, type in the same field.</SupportingText>}
      <SupportingText muted={false}>Every submitted answer adds to local symbol progress, including listening text alternatives. Menu → Learning progress explains review times and offers Clear Progress. Reset Preferences keeps progress. Typed answers and recaps are not saved.</SupportingText>
      <SupportingText muted={false}>Starting another card, phrase, quiz answer or preview replaces the current audio. Stop, leaving the screen, editing converter text or backgrounding the app cancels the remaining words and pauses. If a provider does not finish, playback times out with a retry message.</SupportingText>
      <SupportingText muted={false}>Audio uses your device or browser speech provider. Some voices need a network connection. The app does not verify where a provider processes text, guarantee offline speech, or request microphone access for playback. Pronunciation varies by voice. The written guide remains available.</SupportingText>
      <NavigationRow title="Privacy Policy" route="/privacy" icon="shield-checkmark-outline" />
    </View>
  </Screen>;
}
const styles = StyleSheet.create({
  audioRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  audioHeading: { flex: 1 },
  section: { gap: 8 },
});
