import { router, useFocusEffect } from '../src/navigation';
import { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button, Feedback, Heading, Screen } from '../src/components/ui';
import { useTheme } from '../src/context/ThemeContext';
import { loadEnglishVoices } from '../src/lib/speech';

/** @type {{value: import('../src/types').ThemeMode, label: string}[]} */
const THEME_OPTIONS = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

export default function SettingsScreen() {
  const { theme, preferences, setThemeMode, isSaving, resetPreferences } = useTheme();
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
      accessibilityHint="Restores System appearance, System Default voice and converter pace. Other app data is kept."
      onPress={() => { void resetPreferences(); }} />
    <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>Reset restores System appearance, System Default voice and converter pace (rate 1×, word pause 300 ms). It does not delete progress or other app data.</Text>
    <Button label="Learning progress and deletion" variant="secondary" onPress={() => router.push('/progress')} />
  </Screen>;
}

const styles = StyleSheet.create({
  group: { gap: 8 },
  infoText: { fontSize: 16, lineHeight: 24 },
});
