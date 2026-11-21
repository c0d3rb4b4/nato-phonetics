import { router, useFocusEffect } from '../src/navigation';
import { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button, Feedback, Heading, Screen } from '../src/components/ui';
import { useTheme } from '../src/context/ThemeContext';
import { CONVERTER_RATES, CONVERTER_WORD_PAUSES, DEFAULT_CONVERTER_DISPLAY, DEFAULT_CONVERTER_PACING } from '../src/lib/preferences';
import { loadEnglishVoices } from '../src/lib/speech';

/** @type {{value: import('../src/types').ThemeMode, label: string}[]} */
const THEME_OPTIONS = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

export default function SettingsScreen() {
  const { theme, preferences, setThemeMode, setConverterPacing, setConverterDisplay, isSaving, resetPreferences } = useTheme();
  const pacing = preferences.converterPacing ?? DEFAULT_CONVERTER_PACING;
  const display = preferences.converterDisplay ?? DEFAULT_CONVERTER_DISPLAY;
  const [selectedVoiceName, setSelectedVoiceName] = useState('System Default');

  useFocusEffect(useCallback(() => {
    let active = true;
    if (preferences.selectedVoice === null) {
      setSelectedVoiceName('System Default');
    } else {
      setSelectedVoiceName('Loading saved voice…');
      loadEnglishVoices().then(voices => {
        if (!active) return;
        const voice = voices.find(item => item.identifier === preferences.selectedVoice);
        setSelectedVoiceName(voice ? voice.name : 'Saved voice unavailable — choose System Default');
      }).catch(() => {
        if (active) setSelectedVoiceName('Saved voice — name unavailable');
      });
    }
    return () => { active = false; };
  }, [preferences.selectedVoice]));

  return <Screen>
    <Heading>Word Converter</Heading>
    <Text style={[styles.infoText, { color: theme.colors.text }]}>Display</Text>
    <View accessibilityRole="radiogroup" accessibilityLabel="Converter display" style={styles.options}>
      {(/** @type {const} */ (['bubbles', 'cards'])).map(option =>
        <Button key={option} label={option === 'bubbles' ? 'Phonetic bubbles' : 'Full cards'}
          style={styles.option} variant={display === option ? 'primary' : 'secondary'} disabled={isSaving}
          accessibilityRole="radio" accessibilityState={{ checked: display === option }}
          onPress={() => { void setConverterDisplay(option); }} />)}
    </View>
    <Text style={[styles.infoText, { color: theme.colors.text }]}>Playback speed</Text>
    <View accessibilityRole="radiogroup" accessibilityLabel="Playback speed" style={styles.options}>
      {CONVERTER_RATES.map(rate => <Button key={rate} label={`${rate}×`} accessibilityLabel={`Rate ${rate}×`}
        style={styles.option} variant={pacing.rate === rate ? 'primary' : 'secondary'} disabled={isSaving}
        accessibilityRole="radio" accessibilityState={{ checked: pacing.rate === rate }}
        onPress={() => { void setConverterPacing({ ...pacing, rate }); }} />)}
    </View>
    <Text style={[styles.infoText, { color: theme.colors.text }]}>Pause between words</Text>
    <View accessibilityRole="radiogroup" accessibilityLabel="Pause between words" style={styles.options}>
      {CONVERTER_WORD_PAUSES.map(wordPauseMs => <Button key={wordPauseMs} label={`${wordPauseMs} ms`} accessibilityLabel={`Word pause ${wordPauseMs} ms`}
        style={styles.option} variant={pacing.wordPauseMs === wordPauseMs ? 'primary' : 'secondary'} disabled={isSaving}
        accessibilityRole="radio" accessibilityState={{ checked: pacing.wordPauseMs === wordPauseMs }}
        onPress={() => { void setConverterPacing({ ...pacing, wordPauseMs }); }} />)}
    </View>
    <Heading>Appearance</Heading>
    <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>System follows your device’s current light or dark appearance.</Text>
    <View accessibilityRole="radiogroup" accessibilityLabel="Appearance" style={styles.group}>
      {THEME_OPTIONS.map(option => <Button key={option.value} variant="secondary"
        label={`${option.label}${preferences.themeMode === option.value ? ' ✓' : ''}`} accessibilityLabel={option.label}
        accessibilityRole="radio" accessibilityState={{ checked: preferences.themeMode === option.value }}
        aria-checked={preferences.themeMode === option.value}
        onPress={() => { void setThemeMode(option.value); }} />)}
    </View>
    <Heading>Voice</Heading>
    <Button label="Change Voice" variant="secondary" accessibilityHint={`Current choice: ${selectedVoiceName}`}
      onPress={() => router.push('/voice-select')} />
    <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>{selectedVoiceName}</Text>
    <Button label="Audio help and sound test" variant="secondary" onPress={() => router.push('/audio-help')} />
    <Heading>Preferences</Heading>
    <Feedback message={isSaving ? 'Saving settings…' : 'Choices are selected after they have been saved on this device.'} />
    <Button label="Reset Preferences" variant="secondary"
      accessibilityHint="Restores System appearance, System Default voice, phonetic bubbles and the default playback pace."
      onPress={() => { void resetPreferences(); }} />
    <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>Reset restores System appearance, System Default voice, phonetic bubbles and the default playback pace (1× speed, 300 ms between words). Learning progress is kept.</Text>
    <Button label="Learning progress and deletion" variant="secondary" onPress={() => router.push('/progress')} />
  </Screen>;
}

const styles = StyleSheet.create({
  group: { gap: 8 },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  option: { flex: 1, flexBasis: 68, paddingHorizontal: 8, paddingVertical: 8 },
  infoText: { fontSize: 16, lineHeight: 24 },
});
