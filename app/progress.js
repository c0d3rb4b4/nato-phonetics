import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button, Feedback, Heading, NavigationRow, Screen, SectionHeading, SupportingText } from '../src/components/ui';
import { ProgressStatus } from '../src/components/ProgressStatus';
import { useTheme } from '../src/context/ThemeContext';
import { useProgress } from '../src/hooks/useProgress';
import { progressSummary } from '../src/lib/progress';
import { progressStore } from '../src/lib/progressStore';
import { entrySymbol, PRACTICE_ENTRIES } from '../src/lib/practiceSets';
import { router } from '../src/navigation';

export default function ProgressScreen() {
  const { theme } = useTheme();
  const progress = useProgress();
  const summary = progressSummary(progress.data, progress.now);
  const [confirming, setConfirming] = useState(false);
  const [cleared, setCleared] = useState(false);
  return <Screen>
    <Heading>Learning progress</Heading>
    {!progress.isLoading && progress.error?.operation !== 'load' && <>
      <View style={styles.section}>
        <Text testID="progress-summary" style={[styles.summary, { color: theme.colors.text }]}>{summary.attempts} answers saved · {summary.correct} correct · {summary.errors} errors</Text>
        <SupportingText testID="progress-due" muted={false}>{summary.practised} of 36 symbols practised · {summary.due} due now · {summary.mistakes} need another try</SupportingText>
        {!summary.attempts && <SupportingText>No saved answers yet. Start a full practice round to build your review list.</SupportingText>}
      </View>
    </>}
    <ProgressStatus progress={progress} />
    <Button compact label="Open practice" onPress={() => router.push('/letter-quiz')} />
    {!!summary.practised && <View style={styles.section}>
      <SectionHeading>Saved symbols</SectionHeading>
      {PRACTICE_ENTRIES.map(entry => {
        const symbol = entrySymbol(entry), row = progress.data.symbols[symbol];
        return row && <View key={symbol} testID={`progress-symbol-${symbol}`} style={[styles.row, {
          backgroundColor: theme.colors.surface, borderColor: theme.colors.border,
        }]}>
          <Text style={[styles.symbol, { color: theme.colors.text }]}>{symbol} · {entry.word}</Text>
          <SupportingText>{row.attempts} {row.attempts === 1 ? 'attempt' : 'attempts'} · {row.errors} {row.errors === 1 ? 'error' : 'errors'} · Last answer {row.streak ? 'correct' : 'incorrect'}</SupportingText>
          <SupportingText muted={false}>{row.dueAt <= progress.now ? 'Due now' : `Next review: ${new Date(row.dueAt).toLocaleString()}`}</SupportingText>
        </View>;
      })}
    </View>}
    <View style={styles.section}>
      <SectionHeading>How review works</SectionHeading>
      <SupportingText>In practice, choose a symbol set and Due review or Focus on mistakes. Unpractised symbols remain in Full symbol set. A wrong answer is due immediately. Consecutive correct answers schedule review after 1, 3, 7, 14, then 30 elapsed days. Another correct answer keeps the 30-day interval. A miss resets it.</SupportingText>
      <SupportingText>Due counts refresh on return and each minute. Device clock changes affect due times.</SupportingText>
      <SupportingText>Every submitted answer counts, including listening text alternatives and Retry Mistakes. Totals combine practice modes and are saved on this device or browser without an account or app cloud sync. Use them as a practice aid.</SupportingText>
    </View>
    <View style={styles.section}>
      <SectionHeading>Clear Progress</SectionHeading>
      <SupportingText>Delete all saved symbol totals and review times, including unsaved answers waiting for Retry. Your preferences and current round are kept. Only answers submitted after deletion build new progress. This cannot be undone.</SupportingText>
      {confirming ? <>
        <Feedback message="Delete all learning progress on this device?" />
        <Button label="Delete saved progress" testID="progress-delete" disabled={progress.isLoading || progress.isSaving} onPress={() => {
          setCleared(false);
          void progressStore.clear().then(ok => { if (ok) { setConfirming(false); setCleared(true); } });
        }} />
        <Button compact label="Keep progress" variant="secondary" onPress={() => setConfirming(false)} />
      </> : <Button compact label="Clear Progress" testID="progress-clear" variant="secondary" disabled={progress.isLoading || progress.isSaving}
        onPress={() => { setCleared(false); setConfirming(true); }} />}
      <Feedback error message={progress.error?.operation === 'clear' ? progress.error.message : null} />
      <Feedback message={cleared && !summary.attempts && !progress.pendingCount ? 'Progress cleared. Preferences were kept.' : null} />
    </View>
    <NavigationRow title="Preferences" route="/settings" icon="settings-outline" />
  </Screen>;
}

const styles = StyleSheet.create({
  section: { gap: 8 },
  summary: { fontSize: 18, fontWeight: '600' },
  row: { borderWidth: 1, borderRadius: 12, paddingVertical: 8, paddingHorizontal: 12, gap: 4 },
  symbol: { fontSize: 16, fontWeight: '600' },
});
