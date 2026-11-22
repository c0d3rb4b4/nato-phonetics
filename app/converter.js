import { useCallback, useMemo, useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { PlaybackButton, PlaybackNotice } from '../src/components/PlaybackControls';
import { NatoTile, TileGrid } from '../src/components/NatoTile';
import { Button, Feedback, Screen, showsFocusRing, TextField } from '../src/components/ui';
import { useTheme } from '../src/context/ThemeContext';
import { usePlayback } from '../src/hooks/usePlayback';
import { useTileEnvironment } from '../src/hooks/useTileEnvironment';
import { CONVERSION_PAGE_SIZE, conversionOutput, convertText, describeUnknown, spokenPartIndices } from '../src/lib/conversion';
import { DEFAULT_CONVERTER_DISPLAY, DEFAULT_CONVERTER_PACING } from '../src/lib/preferences';
import { copyConversion, shareConversion } from '../src/lib/conversionExport';
import { TILE_DESIGN } from '../src/lib/tileDesign';
import { tileTextUnits } from '../src/lib/tileTextUnits';
import { useFocusEffect } from '../src/navigation';

export default function ConverterScreen() {
  const { theme, preferences } = useTheme();
  const pacing = preferences.converterPacing ?? DEFAULT_CONVERTER_PACING;
  const showCards = (preferences.converterDisplay ?? DEFAULT_CONVERTER_DISPLAY) === 'cards';
  const fonts = useTileEnvironment();
  const [input, setInput] = useState('');
  const audio = usePlayback('converter');
  const parts = useMemo(() => convertText(input), [input]);
  const output = useMemo(() => conversionOutput(parts, pacing.wordPauseMs), [parts, pacing.wordPauseMs]);
  const speechIndices = useMemo(() => spokenPartIndices(parts), [parts]);
  const [playIndices, setPlayIndices] = useState(/** @type {number[]} */ ([]));
  const [page, setPage] = useState(0);
  const [showExport, setShowExport] = useState(false);
  const [focusedBubble, setFocusedBubble] = useState(/** @type {number | null} */ (null));
  const pageCount = Math.max(1, Math.ceil(parts.length / CONVERSION_PAGE_SIZE));
  const currentIndex = audio.active && audio.snapshot.tokenIndex >= 0 ? playIndices[audio.snapshot.tokenIndex] : undefined;
  const playingPage = currentIndex === undefined ? page : Math.floor(currentIndex / CONVERSION_PAGE_SIZE);
  const [exportStatus, setExportStatus] = useState('');
  const [exporting, setExporting] = useState(false);
  const revision = useRef(0);
  const busy = useRef(false);
  const invalidateExport = useCallback(() => {
    revision.current++; busy.current = false; setExporting(false); setExportStatus('');
  }, []);
  useFocusEffect(useCallback(() => invalidateExport, [invalidateExport]));
  /** @param {string} value */
  const edit = value => { audio.stop(); invalidateExport(); setPage(0); setPlayIndices([]); setInput(value); };
  /** @param {number} index @param {string} text */
  const playPart = (index, text) => { setPlayIndices([index]); void audio.play([{ text }], { rate: pacing.rate }); };
  /** @param {'copy' | 'share'} action */
  const exportText = async action => {
    if (busy.current || !output.text) return;
    const current = ++revision.current;
    busy.current = true; setExporting(true); setExportStatus('');
    try {
      const result = action === 'copy' ? await copyConversion(output.text) : await shareConversion(output.text);
      if (revision.current !== current) return;
      setExportStatus(action === 'copy' ? 'Copied conversion.' : result === 'unavailable'
        ? 'Sharing is unavailable here. Use Copy conversion or select the plain text conversion.'
        : result === 'cancelled' ? 'Sharing cancelled.' : 'Share sheet opened.');
    } catch {
      if (revision.current === current) setExportStatus(action === 'copy'
        ? 'Could not copy. Select the plain text conversion and use your device’s Copy action.'
        : 'Could not open sharing. Use Copy conversion or select the plain text conversion.');
    } finally {
      if (revision.current === current) { busy.current = false; setExporting(false); }
    }
  };
  const playPhrase = () => {
    setPlayIndices(speechIndices);
    void audio.play(output.speech, { rate: pacing.rate });
  };
  const pageStart = page * CONVERSION_PAGE_SIZE;
  const tokens = parts.slice(pageStart, pageStart + CONVERSION_PAGE_SIZE).map((part, offset) => {
    const index = pageStart + offset;
    const current = currentIndex === index;
    const testID = `converter-${index}`;
    if (part.type === 'space') {
      return showCards ? <Text key={index} style={[styles.space, { color: theme.colors.textSecondary }]}>SPACE</Text> : null;
    }
    if (part.type === 'unknown') {
      return <View key={index} style={[showCards ? styles.card : styles.bubble,
        { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderWidth: 1 }]}>
        <Text style={{ color: theme.colors.textSecondary }}>{describeUnknown(part.char)} · Not spoken</Text>
      </View>;
    }
    const entry = part.type === 'punctuation' ? null : part.entry;
    if (showCards && part.type === 'punctuation') {
      return <View key={index} style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderWidth: 1 }]}>
        <Button label={`Play ${part.word}`} testID={testID} selected={current} variant={current ? 'primary' : 'secondary'}
          onPress={() => playPart(index, part.word)} />
        <Text style={{ color: theme.colors.text }}>{part.char} · Literal separator</Text>
      </View>;
    }
    if (showCards && entry) {
      return <NatoTile key={index} entry={entry} current={current} testID={testID}
        onPress={() => playPart(index, entry.speechText)} />;
    }
    const word = part.type === 'punctuation' ? part.word : part.entry.word;
    const color = entry ? TILE_DESIGN.colors.text : theme.colors.text;
    return <Pressable key={index} testID={testID} accessibilityRole="button" accessibilityLabel={`Play ${word}`}
      accessibilityState={{ selected: current }} aria-pressed={current}
      onFocus={event => setFocusedBubble(showsFocusRing(event.currentTarget) ? index : null)}
      onBlur={() => setFocusedBubble(null)}
      onPress={() => playPart(index, part.type === 'punctuation' ? part.word : part.entry.speechText)}
      style={[styles.bubble, { backgroundColor: entry?.color ?? theme.colors.surface },
        parts[index - 1]?.type === 'space' && offset > 0 && styles.wordBoundary]}>
      {({ pressed }) => <>
        <Text style={{ color, fontSize: tileTextUnits(TILE_DESIGN.word.size, 1, fonts.fontScale),
          fontFamily: fonts.ready ? TILE_DESIGN.word.family : undefined, fontWeight: '600' }}>{word}</Text>
        {(pressed || current || focusedBubble === index) &&
          <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.bubbleRing, { borderColor: color }]} />}
      </>}
    </Pressable>;
  });

  return <Screen stickyHeaderIndices={[0]} overlay={<PlaybackNotice audio={audio} />}>
    <View style={{ backgroundColor: theme.colors.background }}>
      <View style={styles.inputRow}>
        <TextField accessibilityLabel="Text to convert" testID="converter-input" style={styles.input}
          value={input} onChangeText={edit} multiline numberOfLines={Platform.OS === 'web' ? 1 : undefined}
          placeholder="Type a word or phrase"
          autoCapitalize="characters" autoCorrect={false} spellCheck={false} />
        <PlaybackButton audio={audio} label="Play Full Phrase" onPlay={playPhrase}
          disabled={!output.speech.length} testID="converter-playback" />
      </View>
    </View>
    {!!output.text && (showCards ? <TileGrid testID="converter-output">{tokens}</TileGrid>
      : <View testID="converter-output" style={styles.bubbles}>{tokens}</View>)}
    {pageCount > 1 && <>
      <Text testID="converter-card-page" style={{ color: theme.colors.textSecondary }}>Page {page + 1} of {pageCount}</Text>
      <View style={styles.actions}>
        <Button label="Previous page" variant="secondary" style={styles.action} disabled={page === 0} onPress={() => setPage(page - 1)} />
        <Button label="Next page" variant="secondary" style={styles.action} disabled={page === pageCount - 1} onPress={() => setPage(page + 1)} />
      </View>
      <Button label="Show playing word" variant="secondary" disabled={playingPage === page} onPress={() => setPage(playingPage)} />
    </>}
    {!!output.text && <>
      <Button label="Copy or share" variant="secondary" style={styles.exportToggle}
        accessibilityState={{ expanded: showExport }} onPress={() => setShowExport(!showExport)} />
      {showExport && <>
        <ScrollView testID="converter-plain-scroll" nestedScrollEnabled style={{ maxHeight: 240 }}>
          <Text selectable testID="converter-plain-text" style={[styles.plain, { color: theme.colors.text, borderColor: theme.colors.border }]}>{output.text}</Text>
        </ScrollView>
        <View style={styles.actions}>
          <Button label="Copy conversion" style={styles.action} disabled={exporting} onPress={() => { void exportText('copy'); }} />
          <Button label="Share conversion" style={styles.action} variant="secondary" disabled={exporting} onPress={() => { void exportText('share'); }} />
        </View>
        <Feedback message={exportStatus} />
      </>}
    </>}
  </Screen>;
}
const styles = StyleSheet.create({
  inputRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  input: { flex: 1, fontSize: 18, maxHeight: 160, textAlignVertical: 'top' },
  bubbles: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
  bubble: { borderRadius: TILE_DESIGN.radius, paddingHorizontal: 10, paddingVertical: 8, minHeight: 44, justifyContent: 'center', maxWidth: '100%' },
  bubbleRing: { borderRadius: TILE_DESIGN.radius, borderWidth: 2 },
  wordBoundary: { marginStart: 6 },
  actions: { flexDirection: 'row', gap: 8 },
  action: { flex: 1, paddingHorizontal: 8 },
  exportToggle: { alignSelf: 'flex-start', paddingVertical: 8 },
  plain: { fontSize: 16, lineHeight: 24, borderWidth: 1, borderRadius: 12, padding: 12 },
  card: { minWidth: 110, padding: 12, borderRadius: 12, justifyContent: 'center' },
  space: { padding: 12, alignSelf: 'center', fontSize: 14 },
});
