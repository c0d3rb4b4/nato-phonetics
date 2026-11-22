import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { PlaybackButton, PlaybackNotice } from '../src/components/PlaybackControls';
import { Button, ChoiceButton, ChoiceGroup, Feedback, Screen, SectionHeading, showsFocusRing, SupportingText, TextField } from '../src/components/ui';
import { useTheme } from '../src/context/ThemeContext';
import { usePlayback } from '../src/hooks/usePlayback';
import { NATO_ALPHABET } from '../src/data/natoData';
import { loadEnglishVoices } from '../src/lib/speech';
import { filterEnglishVoices } from '../src/lib/audioVoices';

/** @param {{label: string, name: string, description: string, selected: boolean, onPress: () => void}} props */
function VoiceChoice({ label, name, description, selected, onPress }) {
  const { theme } = useTheme();
  const [focused, setFocused] = useState(false);
  return <Pressable accessibilityRole="radio" accessibilityLabel={label} accessibilityHint={description}
    accessibilityState={{ checked: selected }} aria-checked={selected} onPress={onPress}
    onFocus={event => setFocused(showsFocusRing(event.currentTarget))} onBlur={() => setFocused(false)}
    style={({ pressed }) => [styles.voice, {
      backgroundColor: pressed || selected ? theme.colors.card : theme.colors.surface,
      borderColor: focused ? theme.colors.text : selected ? theme.colors.primary : theme.colors.border,
    }]}>
    <Text style={[styles.name, { color: theme.colors.text }]}>{name}{selected ? ' ✓' : ''}</Text>
    <SupportingText>{description}</SupportingText>
  </Pressable>;
}

export default function VoiceSelectScreen() {
  const { preferences, setSelectedVoice, isSaving } = useTheme();
  const audio = usePlayback('voice-select');
  const [voices, setVoices] = useState(/** @type {Awaited<ReturnType<typeof loadEnglishVoices>>} */ ([]));
  const [state, setState] = useState('loading');
  const [query, setQuery] = useState('');
  const [locale, setLocale] = useState('');
  const [previewVoice, setPreviewVoice] = useState(/** @type {string | null} */ (null));
  const generation = useRef(0);
  const loadVoices = async () => {
    const request = ++generation.current;
    setState('loading');
    try {
      const found = await loadEnglishVoices();
      if (request !== generation.current) return;
      setVoices(found);
      setLocale(value => found.some(voice => voice.language === value) ? value : '');
      setState(found.length ? 'ready' : 'empty');
    } catch {
      if (request === generation.current) setState('error');
    }
  };
  useEffect(() => {
    void loadVoices();
    return () => { generation.current += 1; };
  }, []);
  const selected = preferences.selectedVoice;
  const locales = [...new Set(voices.map(voice => voice.language))];
  const filtered = filterEnglishVoices(voices, query, locale);
  const removed = selected && state === 'ready' && !voices.some(voice => voice.identifier === selected);
  /** @param {string | null} id */
  const select = (id) => { audio.stop(); void setSelectedVoice(id); };
  /** @param {string | null} id */
  const preview = id => {
    setPreviewVoice(id);
    void audio.play(NATO_ALPHABET.slice(0, 3).map(entry => ({ text: entry.speechText })), { voice: id });
  };
  return <Screen overlay={<PlaybackNotice audio={audio} />}>
    <SectionHeading>Select Voice</SectionHeading>
    <SupportingText>Choose a voice to save it. Preview plays a sample without saving.</SupportingText>
    {isSaving && <Feedback message="Saving settings…" />}
    <View testID="voice-list" style={styles.list}>
      <View style={styles.voiceRow}>
        <VoiceChoice label="System Default" name="System Default" description="Let the speech provider choose a voice"
          selected={selected === null} onPress={() => select(null)} />
        <PlaybackButton audio={audio} active={audio.active && previewVoice === null}
          label="Preview System Default" onPlay={() => preview(null)} />
      </View>
      <View testID="voice-status">
        {state === 'loading' && <Feedback message="Loading English voices…" />}
        {state === 'error' && <Feedback error message="Could not load voices. Try again or use System Default." />}
        {state === 'empty' && <Feedback message="No English voices found. Install an English voice in your device settings, then retry. System Default may still work." />}
        {removed && <Feedback message="Your saved voice is no longer available. Playback will use System Default. Choose an available voice or save System Default." />}
      </View>
      {state === 'ready' && <View style={styles.filters}>
        <SectionHeading>Find an English voice</SectionHeading>
        <SupportingText>Search by name, locale or quality.</SupportingText>
        <TextField testID="voice-search" accessibilityLabel="Search English voices" value={query}
          placeholder="Search voices"
          autoCapitalize="none" autoCorrect={false} spellCheck={false}
          onChangeText={value => { audio.stop(); setQuery(value); }} />
        <ChoiceGroup label="English voice locale">
          {['', ...locales].map(value => <ChoiceButton key={value} label={value || 'All English locales'}
            accessibilityLabel={value ? `Locale ${value}` : 'All English locales'} selected={locale === value}
            onPress={() => { audio.stop(); setLocale(value); }} />)}
        </ChoiceGroup>
        <SupportingText testID="voice-filter-count" accessibilityLiveRegion="polite" aria-live="polite">Showing {filtered.length} of {voices.length} English voices.</SupportingText>
        {!filtered.length && <Feedback message="No voices match these filters." />}
        <Button label="Reset voice filters" variant="secondary" compact style={styles.action} disabled={!query && !locale}
          onPress={() => { audio.stop(); setQuery(''); setLocale(''); }} />
      </View>}
      {state !== 'loading' && <Button label={state === 'ready' ? 'Refresh voice list' : 'Retry voice list'} variant="secondary" compact style={styles.action}
        onPress={() => { audio.stop(); void loadVoices(); }} />}
      {state === 'ready' && filtered.map((voice, index) => <View key={voice.identifier} style={styles.list}>
        {(index === 0 || filtered[index - 1].language !== voice.language) && <SectionHeading>{voice.language}</SectionHeading>}
        <View style={styles.voiceRow}>
          <VoiceChoice label={`${voice.name}, ${voice.language}`} name={voice.name}
            description={`${voice.language} · ${voice.quality || 'Default'}`} selected={selected === voice.identifier}
            onPress={() => select(voice.identifier)} />
          <PlaybackButton audio={audio} active={audio.active && previewVoice === voice.identifier}
            label={`Preview ${voice.name}`} onPlay={() => preview(voice.identifier)} />
        </View>
      </View>)}
    </View>
  </Screen>;
}
const styles = StyleSheet.create({
  list: { gap: 8 },
  filters: { gap: 8, marginBottom: 4 },
  action: { alignSelf: 'flex-start' },
  voiceRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  voice: { flex: 1, minWidth: 0, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 12, borderWidth: 2, minHeight: 48, gap: 2 },
  name: { fontSize: 16, fontWeight: '600' },
});
