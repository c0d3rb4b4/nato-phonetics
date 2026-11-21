import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { NatoTile, TileGrid } from '../src/components/NatoTile';
import { PlaybackStatus } from '../src/components/PlaybackStatus';
import { Button, Screen } from '../src/components/ui';
import { NATO_ALPHABET, NATO_NUMBERS } from '../src/data/natoData';
import { usePlayback } from '../src/hooks/usePlayback';
import { entrySymbol } from '../src/lib/practiceSets';

export default function AlphabetScreen() {
  const audio = usePlayback('alphabet');
  const [digits, setDigits] = useState(false);
  return <Screen>
    <View accessibilityRole="radiogroup" accessibilityLabel="Reference type" style={styles.choices}>
      {[false, true].map(value => <Button key={String(value)} label={value ? 'Digits 0–9' : 'Letters A–Z'}
        style={styles.choice} variant={digits === value ? 'primary' : 'secondary'}
        accessibilityRole="radio" accessibilityState={{ checked: digits === value }}
        selected={digits === value} onPress={() => { audio.stop(); setDigits(value); }} />)}
    </View>
    <PlaybackStatus audio={audio} />
    <TileGrid testID={digits ? "digits-grid" : "alphabet-grid"}>
      {(digits ? NATO_NUMBERS : NATO_ALPHABET).map(entry => <NatoTile key={entrySymbol(entry)} entry={entry} testID={`${digits ? "digit" : "alphabet"}-${entrySymbol(entry)}`}
        accessibilityLabel={`Play ${entrySymbol(entry)}, ${entry.word}`} accessibilityHint={entry.pronunciation}
        onPress={() => { void audio.play([{ text: entry.speechText }]); }} />)}
    </TileGrid>
  </Screen>;
}
const styles = StyleSheet.create({
  choices: { flexDirection: 'row', gap: 8 },
  choice: { flex: 1, paddingHorizontal: 6, paddingVertical: 8 },
});
