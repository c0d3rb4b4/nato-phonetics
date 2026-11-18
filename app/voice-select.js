import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { PlaybackStatus } from '../src/components/PlaybackStatus';
import { Button, Feedback, Heading, Screen } from '../src/components/ui';
import { useTheme } from '../src/context/ThemeContext';
import { usePlayback } from '../src/hooks/usePlayback';
import { NATO_ALPHABET } from '../src/data/natoData';
import { loadEnglishVoices } from '../src/lib/speech';
import { filterEnglishVoices } from '../src/lib/audioVoices';

export default function VoiceSelectScreen() {
  const { theme, preferences, setSelectedVoice, isSaving } = useTheme();
  const audio = usePlayback('voice-select');
  const [voices, setVoices] = useState(/** @type {Awaited<ReturnType<typeof loadEnglishVoices>>} */ ([]));
  const [state, setState] = useState('loading');
  const [query, setQuery] = useState('');
  const [locale, setLocale] = useState('');
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
  const textColor = { color: theme.colors.text };
  /** @param {string | null} id */
  const select = (id) => { audio.stop(); void setSelectedVoice(id); };
  /** @param {string | null} id */
  const preview = (id) => { void audio.play(NATO_ALPHABET.slice(0, 3).map(entry => ({ text: entry.speechText })), { voice: id }); };
  return <Screen>
    <Heading>Select Voice</Heading>
    <Text style={[styles.info, { color: theme.colors.textSecondary }]}>Choose a voice to save it. Preview plays a sample without changing your saved choice. All available English voices are listed by locale and quality.</Text>
    {isSaving && <Feedback message="Saving settings…" />}
    <PlaybackStatus audio={audio} />
    <View testID="voice-list">
      <Pressable accessibilityRole="radio" accessibilityLabel="System Default"
        accessibilityState={{ checked: selected === null }} aria-checked={selected === null}
        onPress={() => select(null)} style={[styles.voice, { backgroundColor: theme.colors.surface, borderColor: selected === null ? theme.colors.primary : theme.colors.border }]}>
        <Text style={[styles.name, textColor]}>System Default {selected === null ? '✓' : ''}</Text>
        <Text style={{ color: theme.colors.textSecondary }}>Let the speech provider choose a voice</Text>
      </Pressable>
      <Button label="Preview System Default" variant="secondary" onPress={() => preview(null)} />
      <View testID="voice-status">
        {state === 'loading' && <Feedback message="Loading English voices…" />}
        {state === 'error' && <Feedback error message="Could not load voices. Try again or use System Default." />}
        {state === 'empty' && <Feedback message="No English voices found. Install an English voice in your device settings, then retry. System Default may still work." />}
        {removed && <Feedback message="Your saved voice is no longer available. Playback will use System Default; choose an available voice or save System Default below." />}
      </View>
      <Button label="Retry voice list" variant="secondary" onPress={() => { void loadVoices(); }} />
      {state === 'ready' && <View style={styles.filters}>
        <Heading>Find a voice</Heading>
        <Text style={textColor}>Search by name, locale code or quality. Filters do not change your saved voice.</Text>
        <TextInput testID="voice-search" accessibilityLabel="Search English voices" value={query}
          placeholder="Name, locale or quality" placeholderTextColor={theme.colors.textSecondary}
          autoCapitalize="none" autoCorrect={false} spellCheck={false}
          onChangeText={value => { audio.stop(); setQuery(value); }}
          style={[styles.search, { color: theme.colors.text, borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]} />
        {['', ...locales].map(value => <Button key={value} label={value ? `Locale ${value}` : 'All English locales'}
          variant="secondary" accessibilityRole="radio" accessibilityState={{ checked: locale === value }} selected={locale === value}
          onPress={() => { audio.stop(); setLocale(value); }} />)}
        <Button label="Reset voice filters" variant="secondary" disabled={!query && !locale}
          onPress={() => { audio.stop(); setQuery(''); setLocale(''); }} />
        <Text testID="voice-filter-count" accessibilityLiveRegion="polite" style={textColor}>Showing {filtered.length} of {voices.length} English voices.</Text>
        {!filtered.length && <Feedback message="No voices match these filters. Reset voice filters to see all available English voices." />}
      </View>}
      {state === 'ready' && filtered.map((voice, index) => <View key={voice.identifier}>
        {(index === 0 || filtered[index - 1].language !== voice.language) && <Heading>{voice.language}</Heading>}
        <Pressable accessibilityRole="radio" accessibilityLabel={`${voice.name}, ${voice.language}`}
          accessibilityState={{ checked: selected === voice.identifier }} aria-checked={selected === voice.identifier}
          onPress={() => select(voice.identifier)}
          style={[styles.voice, { backgroundColor: theme.colors.surface, borderColor: selected === voice.identifier ? theme.colors.primary : theme.colors.border }]}>
          <Text style={[styles.name, textColor]}>{voice.name} {selected === voice.identifier ? '✓' : ''}</Text>
          <Text style={{ color: theme.colors.textSecondary }}>{voice.language} · {voice.quality || 'Default'}</Text>
        </Pressable>
        <Button label={`Preview ${voice.name}`} variant="secondary" onPress={() => preview(voice.identifier)} />
      </View>)}
    </View>
  </Screen>;
}
const styles = StyleSheet.create({
  filters: { gap: 10, marginTop: 12 },
  search: { borderWidth: 1, borderRadius: 12, padding: 12, fontSize: 16, minHeight: 48 },
  info: { fontSize: 15, lineHeight: 23, marginBottom: 12 },
  voice: { padding: 16, borderRadius: 12, borderWidth: 2, marginVertical: 8, minHeight: 52 },
  name: { fontSize: 17, fontWeight: '600', marginBottom: 4 },
});
