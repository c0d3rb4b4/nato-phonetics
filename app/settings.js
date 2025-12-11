import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import * as Speech from 'expo-speech';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useTheme } from '../src/context/ThemeContext';

export default function SettingsScreen() {
  const { theme, isDarkMode, toggleDarkMode } = useTheme();
  const [selectedVoiceName, setSelectedVoiceName] = useState('Default');

  // Reload voice name when screen gets focus
  useEffect(() => {
    const unsubscribe = router.subscribe(() => {
      loadSelectedVoice();
    });
    loadSelectedVoice();
    return unsubscribe;
  }, []);

  const loadSelectedVoice = async () => {
    try {
      const saved = await AsyncStorage.getItem('selectedVoice');
      if (saved) {
        const availableVoices = await Speech.getAvailableVoicesAsync();
        const voice = availableVoices.find(v => v.identifier === saved);
        if (voice) {
          setSelectedVoiceName(voice.name);
        }
      }
    } catch (e) {
      console.error('Error loading voice:', e);
      Alert.alert('Error', 'Failed to load voice settings.');
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Appearance
        </Text>
        
        <View style={[styles.settingRow, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.settingInfo}>
            <Text style={[styles.settingLabel, { color: theme.colors.text }]}>
              Dark Mode
            </Text>
            <Text style={[styles.settingDescription, { color: theme.colors.textSecondary }]}>
              Switch between light and dark theme
            </Text>
          </View>
          <Switch
            value={isDarkMode}
            onValueChange={toggleDarkMode}
            trackColor={{ false: '#D1D5DB', true: '#3B82F6' }}
            thumbColor={isDarkMode ? '#FFFFFF' : '#F3F4F6'}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Voice
        </Text>
        
        <Pressable 
          onPress={() => router.push('/voice-select')}
          style={[styles.settingRow, { backgroundColor: theme.colors.surface }]}
        >
          <View style={styles.settingInfo}>
            <Text style={[styles.settingLabel, { color: theme.colors.text }]}>
              Change Voice
            </Text>
            <Text style={[styles.settingDescription, { color: theme.colors.textSecondary }]}>
              {selectedVoiceName}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
        </Pressable>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          About Settings
        </Text>
        <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
          Customize your NATO Phonetics app experience. Your preferences are saved automatically.
        </Text>
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
    marginBottom: 12,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
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
  infoText: {
    fontSize: 14,
    lineHeight: 20,
  },
});
