import { Platform, StyleSheet, View } from 'react-native';
import { ExternalLink, Heading, NavigationRow, Screen, SectionHeading, SupportingText } from '../src/components/ui';
import { APP_NAME, APP_VERSION, SUPPORT_URL } from '../src/lib/appMetadata';

export default function AboutScreen() {
  return <Screen>
    <View>
      <Heading>{APP_NAME}</Heading>
      <SupportingText>Version {APP_VERSION}</SupportingText>
    </View>
    <View style={styles.section}>
      <SectionHeading>Learn and practice</SectionHeading>
      <SupportingText muted={false}>The International Radiotelephony Spelling Alphabet uses distinct code words to make letters easier to understand over radio and telephone.</SupportingText>
      {['Alphabet reference with pronunciation guides and audio', 'Word-to-phonetic conversion', 'Letter/digit choice, listening and typed recall', ...(Platform.OS === 'android' ? ['Spoken answers with on-device US English recognition'] : []), 'Local progress with due and focused review', 'Device voice and appearance preferences'].map(feature =>
        <SupportingText key={feature} muted={false}>• {feature}</SupportingText>)}
    </View>
    <View style={styles.section}>
      <SectionHeading>Privacy and support</SectionHeading>
      <SupportingText muted={false}>Your preferences and symbol progress are saved on this device, without an account or app cloud sync. Audio uses your device or browser’s speech provider. Processing and internet requirements depend on the selected voice and provider.</SupportingText>
      <NavigationRow title="Read privacy policy" route="/privacy" icon="shield-checkmark-outline" />
      <NavigationRow title="Audio help and sound test" route="/audio-help" icon="volume-high-outline" />
      <ExternalLink title="Support and issue tracker" description="Opens GitHub in your browser" icon="help-circle-outline" url={SUPPORT_URL} />
      <SupportingText>Avoid posting sensitive text or personal information.</SupportingText>
    </View>
  </Screen>;
}

const styles = StyleSheet.create({ section: { gap: 8 } });
