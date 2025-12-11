import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Speech from 'expo-speech';
import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../src/context/ThemeContext';

export default function VoiceSelectScreen() {
  const { theme } = useTheme();
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState(null);

  useEffect(() => {
    loadVoices();
    loadSelectedVoice();
  }, []);

  const loadVoices = async () => {
    try {
      const availableVoices = await Speech.getAvailableVoicesAsync();
      // Try to get Enhanced quality voices first
      let englishVoices = availableVoices.filter(v => 
        v.language.startsWith('en') && v.quality === 'Enhanced'
      );
      
      // Fallback to any English voices if no Enhanced ones
      if (englishVoices.length === 0) {
        englishVoices = availableVoices.filter(v => 
          v.language.startsWith('en')
        );
      }
      
      englishVoices.sort((a, b) => a.name.localeCompare(b.name));
      setVoices(englishVoices);
      
      if (englishVoices.length === 0) {
        Alert.alert('No Voices Available', 'No English voices were found on this device.');
      }
    } catch (e) {
      console.error('Error loading voices:', e);
      Alert.alert('Error', 'Failed to load available voices. Please try again.');
    }
  };

  const loadSelectedVoice = async () => {
    try {
      const saved = await AsyncStorage.getItem('selectedVoice');
      if (saved) {
        setSelectedVoice(saved);
      }
    } catch (e) {
      console.error('Error loading voice:', e);
      Alert.alert('Error', 'Failed to load your saved voice preference.');
    }
  };

  const handleVoiceSelect = async (voiceIdentifier) => {
    setSelectedVoice(voiceIdentifier);
    try {
      await AsyncStorage.setItem('selectedVoice', voiceIdentifier);
      // Test the voice with a NATO phrase
      Speech.speak('Alpha Bravo Charlie Delta Echo Foxtrot', { 
        voice: voiceIdentifier,
        language: 'en-GB'
      });
    } catch (e) {
      console.error('Error saving voice:', e);
      Alert.alert('Error', 'Failed to save voice selection. Please try again.');
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Select Voice
        </Text>
        <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
          Tap a voice to preview and select it
        </Text>
      </View>

      <View style={styles.section}>
        {voices.length === 0 ? (
          <View style={[styles.voiceOption, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.settingLabel, { color: theme.colors.textSecondary }]}>
              No English voices available on this device
            </Text>
          </View>
        ) : (
          voices.map((voice) => (
            <Pressable
              key={voice.identifier}
              onPress={() => handleVoiceSelect(voice.identifier)}
              style={[
                styles.voiceOption,
                { 
                  backgroundColor: theme.colors.surface,
                  borderColor: selectedVoice === voice.identifier 
                    ? '#3B82F6' 
                    : theme.colors.border,
                  borderWidth: selectedVoice === voice.identifier ? 2 : 1,
                }
              ]}
            >
              <View style={styles.settingInfo}>
                <Text style={[styles.settingLabel, { color: theme.colors.text }]}>
                  {voice.name}
                </Text>
                <Text style={[styles.settingDescription, { color: theme.colors.textSecondary }]}>
                  {voice.language} • {voice.quality || 'Standard'}
                </Text>
              </View>
              {selectedVoice === voice.identifier && (
                <View style={styles.selectedBadge}>
                  <Text style={styles.selectedText}>✓</Text>
                </View>
              )}
            </Pressable>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 13,
  },
  voiceOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  selectedBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
