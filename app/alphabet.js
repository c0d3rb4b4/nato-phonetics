import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { NatoTile, TileGrid } from '../src/components/NatoTile';
import { PlaybackStatus } from '../src/components/PlaybackStatus';
import { Button, Heading, Screen } from '../src/components/ui';
import { useTheme } from '../src/context/ThemeContext';
import { NATO_ALPHABET, NATO_NUMBERS } from '../src/data/natoData';
import { usePlayback } from '../src/hooks/usePlayback';
import { entrySymbol } from '../src/lib/practiceSets';

export default function AlphabetScreen() {
  const { theme } = useTheme();
  const audio = usePlayback('alphabet');
  const [digits, setDigits] = useState(false);
  return <Screen>
    <Heading>Letter and digit reference</Heading>
    <View style={styles.choices}>
      {[false, true].map(value => <Button key={String(value)} label={value ? 'Digits 0–9' : 'Letters A–Z'}
        variant="secondary" accessibilityRole="radio" accessibilityState={{ checked: digits === value }}
        selected={digits === value} onPress={() => { audio.stop(); setDigits(value); }} />)}
    </View>
    <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>Tap a card to hear the word. New playback replaces current audio.</Text>
    <PlaybackStatus audio={audio} />
    <TileGrid testID={digits ? "digits-grid" : "alphabet-grid"}>
      {(digits ? NATO_NUMBERS : NATO_ALPHABET).map(entry => <NatoTile key={entrySymbol(entry)} entry={entry} testID={`${digits ? "digit" : "alphabet"}-${entrySymbol(entry)}`}
        accessibilityLabel={`Play ${entrySymbol(entry)}, ${entry.word}`} accessibilityHint={entry.pronunciation}
        onPress={() => { void audio.play([{ text: entry.speechText }]); }} />)}
    </TileGrid>
  </Screen>;
}
const styles = StyleSheet.create({
  choices: { gap: 10, marginBottom: 12 },
  subtitle: { fontSize: 15, marginBottom: 12 },
});
