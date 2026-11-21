import { useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { NatoTile, TileGrid } from '../src/components/NatoTile';
import { PlaybackButton, PlaybackNotice } from '../src/components/PlaybackControls';
import { Button, Screen } from '../src/components/ui';
import { useTheme } from '../src/context/ThemeContext';
import { NATO_ALPHABET, NATO_NUMBERS } from '../src/data/natoData';
import { usePlayback } from '../src/hooks/usePlayback';
import { entrySymbol } from '../src/lib/practiceSets';

export default function AlphabetScreen() {
  const { theme } = useTheme();
  const audio = usePlayback('alphabet');
  const [digits, setDigits] = useState(false);
  const [startedAt, setStartedAt] = useState({ index: 0, sequence: false });
  const resumeAt = useRef(0);
  const entries = digits ? NATO_NUMBERS : NATO_ALPHABET;
  const offset = audio.snapshot.tokenIndex;
  const currentIndex = audio.active && (offset >= 0 || !startedAt.sequence) ? startedAt.index + Math.max(0, offset) : -1;

  /** @param {boolean} value */
  const chooseSet = value => {
    if (value === digits) return;
    audio.stop();
    resumeAt.current = 0;
    setDigits(value);
  };
  const playAll = () => {
    const index = resumeAt.current;
    resumeAt.current = 0;
    setStartedAt({ index, sequence: true });
    void audio.play(entries.slice(index).map(entry => ({ text: entry.speechText })));
  };
  const stop = () => {
    if (startedAt.sequence) {
      const interrupted = Math.max(startedAt.index, currentIndex);
      resumeAt.current = interrupted + (audio.snapshot.status === 'paused' ? 1 : 0);
    }
    audio.stop();
  };

  return <Screen stickyHeaderIndices={[0]} overlay={<PlaybackNotice audio={audio} />}>
    <View style={{ backgroundColor: theme.colors.background }}>
      <View style={styles.toolbar}>
        <View accessibilityRole="radiogroup" accessibilityLabel="Reference type" style={styles.choices}>
          {[false, true].map(value => <Button key={String(value)} label={value ? 'Digits 0–9' : 'Letters A–Z'}
            style={styles.choice} variant={digits === value ? 'primary' : 'secondary'}
            accessibilityRole="radio" accessibilityState={{ checked: digits === value }}
            selected={digits === value} onPress={() => chooseSet(value)} />)}
        </View>
        <PlaybackButton audio={audio} label={digits ? 'Play all digits' : 'Play all letters'} onPlay={playAll}
          onStop={stop} testID="reference-playback" />
      </View>
    </View>
    <TileGrid testID={digits ? "digits-grid" : "alphabet-grid"}>
      {entries.map((entry, index) => <NatoTile key={entrySymbol(entry)} entry={entry} current={index === currentIndex} testID={`${digits ? "digit" : "alphabet"}-${entrySymbol(entry)}`}
        accessibilityLabel={`Play ${entrySymbol(entry)}, ${entry.word}`} accessibilityHint={entry.pronunciation}
        onPress={() => {
          resumeAt.current = 0;
          setStartedAt({ index, sequence: false });
          void audio.play([{ text: entry.speechText }]);
        }} />)}
    </TileGrid>
  </Screen>;
}
const styles = StyleSheet.create({
  toolbar: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  choices: { flex: 1, flexDirection: 'row', gap: 8 },
  choice: { flex: 1, paddingHorizontal: 6, paddingVertical: 8 },
});
