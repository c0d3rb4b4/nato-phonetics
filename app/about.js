import { Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../src/context/ThemeContext';

export default function AboutScreen() {
  const { theme } = useTheme();

  const openLink = (url) => {
    Linking.openURL(url);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.section}>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          NATO Phonetics
        </Text>
        <Text style={[styles.version, { color: theme.colors.textSecondary }]}>
          Version 1.0.0
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          About This App
        </Text>
        <Text style={[styles.paragraph, { color: theme.colors.textSecondary }]}>
          NATO Phonetics is a comprehensive learning tool for the NATO phonetic alphabet. 
          The NATO phonetic alphabet is used worldwide for radio communications to ensure 
          clarity and avoid misunderstandings.
        </Text>
        <Text style={[styles.paragraph, { color: theme.colors.textSecondary }]}>
          This app helps you learn, practice, and master the NATO phonetic alphabet through:
        </Text>
        <View style={styles.bulletList}>
          <Text style={[styles.bullet, { color: theme.colors.textSecondary }]}>
            • Interactive alphabet reference with audio
          </Text>
          <Text style={[styles.bullet, { color: theme.colors.textSecondary }]}>
            • Word to NATO phonetic converter
          </Text>
          <Text style={[styles.bullet, { color: theme.colors.textSecondary }]}>
            • Multiple quiz modes for practice
          </Text>
          <Text style={[styles.bullet, { color: theme.colors.textSecondary }]}>
            • Pronunciation guides
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          The NATO Alphabet
        </Text>
        <Text style={[styles.paragraph, { color: theme.colors.textSecondary }]}>
          Also known as the International Radiotelephony Spelling Alphabet, it assigns 
          code words to each letter of the English alphabet. These code words were chosen 
          to sound distinct from each other when spoken, even in poor audio conditions.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Privacy & Data
        </Text>
        <Text style={[styles.paragraph, { color: theme.colors.textSecondary }]}>
          Your privacy matters. This app processes all data locally on your device and does not 
          collect, transmit, or store any personal information on external servers.
        </Text>
      </View>

      <View style={[styles.footer, { borderTopColor: theme.colors.border }]}>
        <Text style={[styles.footerText, { color: theme.colors.textSecondary }]}>
          © 2025 NATO Phonetics App
        </Text>
        <Text style={[styles.footerText, { color: theme.colors.textSecondary }]}>
          Made with ❤️ for learners everywhere
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
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  version: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
  },
  paragraph: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 12,
  },
  bulletList: {
    marginTop: 8,
    marginLeft: 8,
  },
  bullet: {
    fontSize: 15,
    lineHeight: 24,
  },
  footer: {
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 1,
    alignItems: 'center',
    paddingBottom: 32,
  },
  footerText: {
    fontSize: 13,
    marginBottom: 4,
  },
});
