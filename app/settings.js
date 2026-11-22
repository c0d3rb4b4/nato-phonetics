import { useFocusEffect } from '../src/navigation';
import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, ChoiceButton, ChoiceGroup, Feedback, NavigationRow, Screen, SectionHeading, SupportingText } from '../src/components/ui';
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
  const { preferences, setThemeMode, setConverterPacing, setConverterDisplay, isSaving, resetPreferences } = useTheme();
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
    <View style={styles.section}>
      <SectionHeading>Word Converter</SectionHeading>
      <SupportingText muted={false}>Display</SupportingText>
      <ChoiceGroup label="Converter display">
        {(/** @type {const} */ (['bubbles', 'cards'])).map(option =>
          <ChoiceButton key={option} label={option === 'bubbles' ? 'Phonetic bubbles' : 'Full cards'}
            selected={display === option} disabled={isSaving}
            onPress={() => { void setConverterDisplay(option); }} />)}
      </ChoiceGroup>
      <SupportingText muted={false}>Playback speed</SupportingText>
      <ChoiceGroup label="Playback speed">
        {CONVERTER_RATES.map(rate => <ChoiceButton key={rate} label={`${rate}×`} accessibilityLabel={`Rate ${rate}×`}
          selected={pacing.rate === rate} disabled={isSaving}
          onPress={() => { void setConverterPacing({ ...pacing, rate }); }} />)}
      </ChoiceGroup>
      <SupportingText muted={false}>Pause between words</SupportingText>
      <ChoiceGroup label="Pause between words">
        {CONVERTER_WORD_PAUSES.map(wordPauseMs => <ChoiceButton key={wordPauseMs} label={`${wordPauseMs} ms`} accessibilityLabel={`Word pause ${wordPauseMs} ms`}
          selected={pacing.wordPauseMs === wordPauseMs} disabled={isSaving}
          onPress={() => { void setConverterPacing({ ...pacing, wordPauseMs }); }} />)}
      </ChoiceGroup>
    </View>
    <View style={styles.section}>
      <SectionHeading>Appearance</SectionHeading>
      <ChoiceGroup label="Appearance">
        {THEME_OPTIONS.map(option => <ChoiceButton key={option.value} label={option.label}
          selected={preferences.themeMode === option.value} disabled={isSaving}
          onPress={() => { void setThemeMode(option.value); }} />)}
      </ChoiceGroup>
      <SupportingText>System follows your device’s appearance.</SupportingText>
    </View>
    <View style={styles.section}>
      <SectionHeading>Voice and help</SectionHeading>
      <NavigationRow title="Change Voice" route="/voice-select" icon="mic-outline" description={selectedVoiceName} />
      <NavigationRow title="Audio help and sound test" route="/audio-help" icon="volume-high-outline" />
    </View>
    <NavigationRow title="Learning progress and deletion" route="/progress" icon="book-outline" />
    <View style={styles.section}>
      <SectionHeading>Reset settings</SectionHeading>
      <SupportingText>Reset restores System appearance, System Default voice, phonetic bubbles and the default playback pace (1× speed, 300 ms between words). Learning progress is kept.</SupportingText>
      <Button label="Reset Preferences" variant="secondary" compact style={styles.action} disabled={isSaving}
        accessibilityHint="Restores System appearance, System Default voice, phonetic bubbles and the default playback pace."
        onPress={() => { void resetPreferences(); }} />
    </View>
    {isSaving && <Feedback message="Saving settings…" />}
  </Screen>;
}

const styles = StyleSheet.create({
  section: { gap: 8 },
  action: { alignSelf: 'flex-start' },
});
