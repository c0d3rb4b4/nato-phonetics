import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button, Feedback, Heading, Screen } from '../src/components/ui';
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
  const textStyle = [styles.body, { color: theme.colors.text }];
  return <Screen>
    <Heading>Learning progress</Heading>
    <Text style={textStyle}>Saved on this device or browser, without an account or app cloud sync. Every submitted answer counts, including listening text alternatives and Retry Mistakes. These totals combine practice modes; they are a practice aid, not a mastery assessment.</Text>
    <ProgressStatus progress={progress} />
    {!progress.isLoading && progress.error?.operation !== 'load' && <>
      <Text testID="progress-summary" style={textStyle}>{summary.attempts} answers saved · {summary.correct} correct · {summary.errors} errors</Text>
      <Text testID="progress-due" style={textStyle}>{summary.practised} of 36 symbols practised · {summary.due} due now · {summary.mistakes} need another try</Text>
      {!summary.attempts && <Text style={textStyle}>No saved answers yet. Start a full practice round to build your review list.</Text>}
    </>}
    <Button label="Open practice" onPress={() => router.push('/letter-quiz')} />
    <Text style={textStyle}>In practice, choose a symbol set and Due review or Focus on mistakes. Unpractised symbols remain in Full symbol set. A wrong answer is due immediately; consecutive correct answers schedule review after 1, 3, 7, 14, then 30 elapsed days. Another correct answer keeps the 30-day interval. A miss resets the interval. Due counts refresh on return and each minute; device clock changes affect due times.</Text>
    <Heading>Saved symbols</Heading>
    {PRACTICE_ENTRIES.map(entry => {
      const symbol = entrySymbol(entry), row = progress.data.symbols[symbol];
      return row && <View key={symbol} style={styles.row}>
        <Text testID={`progress-symbol-${symbol}`} style={textStyle}>{symbol} · {entry.word}: {row.attempts} attempts, {row.errors} errors. {row.dueAt <= progress.now ? 'Due now' : `Next review: ${new Date(row.dueAt).toLocaleString()}`}. Last answer {row.streak ? 'correct' : 'incorrect'}.</Text>
      </View>;
    })}
    <Heading>Clear Progress</Heading>
    <Text style={textStyle}>Delete all saved symbol totals and review times, including unsaved answers waiting for Retry. Appearance, voice and converter pace are kept. Your current round stays in memory; only answers submitted after deletion build new progress. This cannot be undone.</Text>
    {confirming ? <>
      <Feedback message="Delete all learning progress on this device?" />
      <Button label="Delete saved progress" testID="progress-delete" disabled={progress.isLoading || progress.isSaving} onPress={() => {
        setCleared(false);
        void progressStore.clear().then(ok => { if (ok) { setConfirming(false); setCleared(true); } });
      }} />
      <Button label="Keep progress" variant="secondary" onPress={() => setConfirming(false)} />
    </> : <Button label="Clear Progress" testID="progress-clear" variant="secondary" disabled={progress.isLoading || progress.isSaving}
      onPress={() => { setCleared(false); setConfirming(true); }} />}
    <Feedback error message={progress.error?.operation === 'clear' ? progress.error.message : null} />
    <Feedback message={cleared && !summary.attempts && !progress.pendingCount ? 'Progress cleared. Preferences were kept.' : null} />
    <Button label="Preferences" variant="secondary" onPress={() => router.push('/settings')} />
  </Screen>;
}

const styles = StyleSheet.create({ body: { fontSize: 16, lineHeight: 24 }, row: { paddingVertical: 8 } });
