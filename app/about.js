import { useRouter } from '../src/navigation';
import { StyleSheet, Text, View } from 'react-native';
import { Button, ExternalLink, Heading, Screen } from '../src/components/ui';
import { useTheme } from '../src/context/ThemeContext';
import { APP_NAME, APP_VERSION, SUPPORT_URL } from '../src/lib/appMetadata';

export default function AboutScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  return <Screen>
    <Heading>{APP_NAME}</Heading>
    <Text style={[styles.paragraph, { color: theme.colors.textSecondary }]}>Version {APP_VERSION}</Text>
    <Heading>Learn and practice</Heading>
    <Text style={[styles.paragraph, { color: theme.colors.text }]}>The International Radiotelephony Spelling Alphabet uses distinct code words to make letters easier to understand over radio and telephone.</Text>
    <View style={styles.features}>
      {['Alphabet reference with pronunciation guides and audio', 'Word-to-phonetic conversion', 'Letter/digit choice, listening and typed recall', 'Local progress with due and focused review', 'Device voice and appearance preferences'].map(feature =>
        <Text key={feature} style={[styles.paragraph, { color: theme.colors.text }]}>• {feature}</Text>)}
    </View>
    <Heading>Privacy and support</Heading>
    <Text style={[styles.paragraph, { color: theme.colors.text }]}>Your preferences and symbol progress are saved on this device, without an account or app cloud sync. Audio uses your device or browser’s speech provider; processing and internet requirements depend on the selected voice and provider.</Text>
    <Button label="Read privacy policy" variant="secondary" onPress={() => router.push('/privacy')} />
    <Button label="Audio help and sound test" variant="secondary" onPress={() => router.push('/audio-help')} />
    <ExternalLink label="Support and issue tracker" url={SUPPORT_URL} />
    <Text style={[styles.paragraph, { color: theme.colors.textSecondary }]}>Support opens GitHub in your browser. Avoid posting sensitive text or personal information.</Text>
  </Screen>;
}

const styles = StyleSheet.create({ paragraph: { fontSize: 16, lineHeight: 24 }, features: { gap: 8 } });
