import { useCallback, useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { PlaybackStatus } from '../src/components/PlaybackStatus';
import { NatoTile, TileGrid } from '../src/components/NatoTile';
import { Button, Feedback, Screen } from '../src/components/ui';
import { useTheme } from '../src/context/ThemeContext';
import { usePlayback } from '../src/hooks/usePlayback';
import { CONVERSION_PAGE_SIZE, conversionOutput, convertText, describeUnknown, spokenPartIndices } from '../src/lib/conversion';
import { CONVERTER_RATES, CONVERTER_WORD_PAUSES, DEFAULT_CONVERTER_PACING } from '../src/lib/preferences';
import { copyConversion, shareConversion } from '../src/lib/conversionExport';
import { useFocusEffect } from '../src/navigation';

export default function ConverterScreen() {
  const { theme, preferences, setConverterPacing, preferenceError, isSaving } = useTheme();
  const pacing = preferences.converterPacing ?? DEFAULT_CONVERTER_PACING;
  const [input, setInput] = useState('');
  const audio = usePlayback('converter');
  const parts = useMemo(() => convertText(input), [input]);
  const output = useMemo(() => conversionOutput(parts, pacing.wordPauseMs), [parts, pacing.wordPauseMs]);
  const speechIndices = useMemo(() => spokenPartIndices(parts), [parts]);
  const [playIndices, setPlayIndices] = useState(/** @type {number[]} */ ([]));
  const [page, setPage] = useState(0);
  const [showPacing, setShowPacing] = useState(false);
  const pageCount = Math.max(1, Math.ceil(parts.length / CONVERSION_PAGE_SIZE));
  const currentIndex = audio.active && audio.snapshot.tokenIndex >= 0 ? playIndices[audio.snapshot.tokenIndex] : undefined;
  const currentPart = currentIndex === undefined ? undefined : parts[currentIndex];
  const currentWord = currentPart?.type === 'punctuation' ? currentPart.word
    : currentPart?.type === 'letter' || currentPart?.type === 'number' ? currentPart.entry.word : '';
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
  /** @param {typeof pacing} value */
  const changePacing = value => { audio.stop(); void setConverterPacing(value); };
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
  const handlePlayAll = () => {
    setPlayIndices(speechIndices);
    void audio.play(output.speech, { rate: pacing.rate });
  };
  return <Screen>
    <Text style={[styles.label, { color: theme.colors.text }]}>Type a word or phrase:</Text>
    <TextInput accessibilityLabel="Text to convert" testID="converter-input"
      style={[styles.input, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, color: theme.colors.text }]}
      value={input} onChangeText={edit} multiline
      placeholder="Example: CV34 7AP" placeholderTextColor={theme.colors.textSecondary}
      autoCapitalize="characters" autoCorrect={false} spellCheck={false} />
    <Button label="Clear input" variant="secondary" disabled={!input} onPress={() => edit('')} />
    <Text style={{ color: theme.colors.textSecondary }}>Letters A–Z and digits 0–9. Tabs, newlines and spaces form word boundaries. Dash (-), dot (.), slash (/), at (@) and plus (+) are spoken literally, not NATO code words. Accents and other symbols are shown as not spoken.</Text>
    <Button label="Play Full Phrase" disabled={!output.speech.length} onPress={handlePlayAll} />
    <Button label="Replay phrase" variant="secondary" disabled={!output.speech.length} onPress={handlePlayAll} />
    <PlaybackStatus audio={audio} />
    <Text testID="converter-current-token" accessibilityLiveRegion="polite" style={{ color: theme.colors.text }}>
      {currentWord ? `Current token: ${currentWord} (${audio.snapshot.tokenIndex + 1} of ${audio.snapshot.tokenCount})` : 'No token playing.'}
    </Text>
    {currentIndex !== undefined && <Button label="Show current card" variant="secondary"
      onPress={() => setPage(Math.floor(currentIndex / CONVERSION_PAGE_SIZE))} />}
    <Button label={showPacing ? 'Hide playback pace' : 'Change playback pace'} variant="secondary" accessibilityState={{ expanded: showPacing }} onPress={() => setShowPacing(value => !value)} />
    <Text style={{ color: theme.colors.textSecondary }}>Rate {pacing.rate}× · word pause {pacing.wordPauseMs} ms</Text>
    {showPacing && <>
    <Text style={{ color: theme.colors.textSecondary }}>Rate and word pause are saved on this device. Changing either stops playback; Play or Replay starts from the beginning.</Text>
    {CONVERTER_RATES.map(rate => <Button key={rate} label={`Rate ${rate}×`} variant="secondary"
      selected={pacing.rate === rate} disabled={isSaving} onPress={() => changePacing({ ...pacing, rate })} />)}
    {CONVERTER_WORD_PAUSES.map(wordPauseMs => <Button key={wordPauseMs} label={`Word pause ${wordPauseMs} ms`} variant="secondary"
      selected={pacing.wordPauseMs === wordPauseMs} disabled={isSaving} onPress={() => changePacing({ ...pacing, wordPauseMs })} />)}
    <Text style={{ color: theme.colors.textSecondary }}>Word pause replaces the usual 120 ms token gap at an input word boundary. Provider timing and rate vary by voice.</Text>
    </>}
    <Feedback error message={preferenceError?.message} />
    <Text accessibilityRole="header" style={[styles.label, { color: theme.colors.text }]}>Plain text conversion</Text>
    <ScrollView testID="converter-plain-scroll" nestedScrollEnabled style={{ maxHeight: 240 }}>
      <Text selectable testID="converter-plain-text" style={[styles.plain, { color: theme.colors.text, borderColor: theme.colors.border }]}>{output.text || 'Your conversion will appear here.'}</Text>
    </ScrollView>
    <Text testID="converter-omissions" style={{ color: theme.colors.textSecondary }}>{output.omitted
      ? `${output.omitted} unsupported character${output.omitted === 1 ? '' : 's'} not spoken. Copy and Share include not-spoken markers.`
      : 'No unsupported characters. In plain text, / separates input words.'}</Text>
    <Button label="Copy conversion" disabled={!output.text || exporting} onPress={() => { void exportText('copy'); }} />
    <Button label="Share conversion" variant="secondary" disabled={!output.text || exporting} onPress={() => { void exportText('share'); }} />
    <Feedback message={exportStatus} />
    <Text accessibilityRole="header" style={[styles.label, { color: theme.colors.text }]}>NATO Phonetic:</Text>
    <Text style={{ color: theme.colors.textSecondary }}>Cards show 24 input tokens per page. Plain text, Copy, Share and phrase playback include the whole input. Input, playback position and card page stay in memory.</Text>
    <Text testID="converter-card-page" style={{ color: theme.colors.text }}>Card page {page + 1} of {pageCount}{parts.length ? ` · tokens ${page * CONVERSION_PAGE_SIZE + 1}–${Math.min(parts.length, (page + 1) * CONVERSION_PAGE_SIZE)} of ${parts.length}` : ''}</Text>
    {pageCount > 1 && <>
      <Button label="Previous cards" variant="secondary" disabled={page === 0} onPress={() => setPage(value => Math.max(0, value - 1))} />
      <Button label="Next cards" variant="secondary" disabled={page === pageCount - 1} onPress={() => setPage(value => Math.min(pageCount - 1, value + 1))} />
    </>}
    <TileGrid testID="converter-output">
      {!parts.length && <Text style={{ color: theme.colors.textSecondary }}>Cards will appear here as you type.</Text>}
      {parts.slice(page * CONVERSION_PAGE_SIZE, (page + 1) * CONVERSION_PAGE_SIZE).map((part, offset) => {
        const index = page * CONVERSION_PAGE_SIZE + offset;
        if (part.type === 'space') return <Text key={index} style={[styles.space, { color: theme.colors.textSecondary }]}>SPACE</Text>;
        if (part.type === 'unknown') return <View key={index} style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderWidth: 1 }]}>
          <Text style={[styles.word, { color: theme.colors.text }]}>{describeUnknown(part.char)}</Text>
          <Text style={{ color: theme.colors.textSecondary }}>Not spoken</Text>
        </View>;
        if (part.type === 'punctuation') return <View key={index} testID={`converter-${index}`} style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: currentIndex === index ? theme.colors.text : theme.colors.border, borderWidth: currentIndex === index ? 3 : 1 }]}>
          <Button label={`Play ${part.word}`} selected={currentIndex === index} variant="secondary" onPress={() => playPart(index, part.word)} />
          <Text style={{ color: theme.colors.text }}>{part.char} · Literal separator</Text>
        </View>;
        const entry = part.entry;
        return <NatoTile key={index} entry={entry} current={currentIndex === index} testID={`converter-${index}`} accessibilityLabel={`Play ${entry.word}`}
          accessibilityHint={`${entry.pronunciation}. Replaces current audio.`}
          onPress={() => playPart(index, entry.speechText)} />;
      })}
    </TileGrid>
  </Screen>;
}
const styles = StyleSheet.create({
  label: { fontSize: 16, fontWeight: '600', marginVertical: 8 },
  plain: { fontSize: 16, lineHeight: 24, borderWidth: 1, borderRadius: 12, padding: 12 },
  input: { borderRadius: 12, borderWidth: 1, padding: 12, fontSize: 18, marginBottom: 12, minHeight: 48, maxHeight: 200, textAlignVertical: 'top' },
  card: { minWidth: 110, padding: 12, borderRadius: 12, justifyContent: 'center' },
  word: { color: '#1F2933', fontSize: 18, fontWeight: '700' },
  space: { padding: 12, alignSelf: 'center', fontSize: 14 },
});
