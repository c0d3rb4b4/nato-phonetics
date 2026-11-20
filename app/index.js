import { StyleSheet, Text, View } from 'react-native';
import { Heading, NavigationCard, Screen } from '../src/components/ui';
import { useTheme } from '../src/context/ThemeContext';
import { APP_NAME, APP_VERSION } from '../src/lib/appMetadata';

/** @type {import('../src/types').NavigationItem[]} */
const MENU_ITEMS = [
  { title: 'NATO Alphabet', icon: 'book-outline', route: '/alphabet', description: 'Browse A–Z and 0–9 cards and hear each word.' },
  { title: 'Word Converter', icon: 'text-outline', route: '/converter', description: 'Type a word or phrase and see its NATO breakdown.' },
  { title: 'Letter Quiz', icon: 'help-circle-outline', route: '/letter-quiz', description: 'Choose, listen or type code words for letters and digits.' },
];

export default function Home() {
  const { theme } = useTheme();
  return <Screen>
    <Heading>{APP_NAME}</Heading>
    <Text style={[styles.description, { color: theme.colors.textSecondary }]}>Learn, convert, and quiz yourself on the NATO alphabet.</Text>
    {MENU_ITEMS.map(item => <NavigationCard key={item.route.toString()} {...item} />)}
    <View style={styles.footer}>
      <Text style={[styles.footerText, { color: theme.colors.textSecondary }]}>Version {APP_VERSION} · Preferences and progress saved on-device</Text>
      <Text style={[styles.footerText, { color: theme.colors.textSecondary }]}>NATO phonetic alphabet · Voice choice depends on your device</Text>
    </View>
  </Screen>;
}

const styles = StyleSheet.create({
  description: { fontSize: 16, lineHeight: 24, marginBottom: 8 },
  footer: { marginTop: 12, gap: 6 },
  footerText: { fontSize: 13, lineHeight: 20 },
});
