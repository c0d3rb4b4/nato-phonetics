import { Platform, StyleSheet, Text } from 'react-native';
import { ExternalLink, Heading, Screen } from '../src/components/ui';
import { useTheme } from '../src/context/ThemeContext';
import { PRIVACY_UPDATED, SUPPORT_URL } from '../src/lib/appMetadata';

const SECTIONS = [
  ['About this policy', 'NATO Phonetics provides letter/digit reference, text conversion and letter/digit practice without an account. The authored app has no analytics, advertising or application backend. This describes the current implementation, not a legal compliance certification.'],
  ['Local data', 'The app uses AsyncStorage (browser storage on web) to store nato.preferences.v1: a version 1 record containing your System, Light or Dark appearance, nullable selectedVoice identifier and optional converterPacing rate and wordPauseMs. Pacing is saved only when you choose it; older records use rate 1× and word pause 300 ms. Input text, playback position and card page are not saved.'],
  ['Updating older preferences', 'On first use after updating, the app reads the old darkMode and selectedVoice keys. It removes only those legacy keys after the versioned record is saved successfully. A failed migration retains old data and displays a recovery message.'],
  ['Learning progress', 'Each submitted quiz answer saves a separate nato.progress.v1 record on this device or browser: per-symbol attempts, errors, consecutive-correct step, last-review time and next-due time. All practice modes and listening text alternatives share these totals. There is no account or app cloud sync. No typed response, round recap, practice mode or audio is stored in progress.'],
  ['Text and practice', 'Converter text, practice mode, review selection, typed drafts, text alternatives and current quiz answers/recaps stay in memory. Closing or reloading clears them. No microphone recording or speech recognition is currently implemented.'],
  ['Progress recovery', 'Progress starts at version 1; there is no earlier progress record to migrate. Unsupported or unreadable data is kept unchanged until you retry loading or explicitly clear it. Failed answer writes are held in memory for Retry while the app remains open; summaries show saved answers only.'],
  ['Copy and Share', 'Only when you tap Copy conversion does the app write the plain text conversion, including not-spoken markers, to the system clipboard. Share conversion passes that same text to the operating system or browser share sheet for you to choose a destination. Clipboard history, synced clipboards and receiving apps have their own controls. Clear input removes the converter text and stops its playback; it does not erase an earlier clipboard copy or shared content.'],
  ['Speech and connectivity', 'Requested playback passes text through the native operating system speech API or directly to the browser’s speech provider on web. Voices, processing location, connectivity and retention depend on that provider. Some voices may use network services. The app does not enforce on-device speech or verify provider retention. Check your provider’s settings and policy before entering sensitive text. Speech output does not request microphone access.'],
  ['Offline availability', 'Reference and conversion logic run locally once loaded. Web installation and offline caching have not yet been implemented, so an offline cold launch on web is not guaranteed. Audio in airplane mode has not been verified across supported devices.'],
  ['Deletion and control', 'Settings → Reset Preferences restores System appearance, System Default voice and converter pace (rate 1×, word pause 300 ms). Reset changes only nato.preferences.v1 and removes its two old migration keys. It keeps unrelated local storage and learning progress. A failed save leaves the previous choice selected and displays an error.'],
  ['Clear Progress', Platform.OS === 'web' ? 'Clear Progress deletes saved totals and review times across this site’s updated app windows. A random deletion marker remains in nato.progress.v1 so an older unsaved answer cannot restore cleared totals on Retry. The marker has no answers or identity information and is replaced at each deletion. Preferences and unrelated storage are kept. New submissions start new progress. Failed deletion keeps data and reports an error. This cannot erase backups.' : 'Menu → Learning progress → Clear Progress asks you to confirm deletion of nato.progress.v1 and pending unsaved answers. Preferences and unrelated storage are kept. The current round stays in memory; answers submitted after deletion begin new progress. Failed deletion reports an error and keeps progress. This cannot erase device backups.'],
  ...(Platform.OS === 'web' ? [['Browser progress', 'Updated windows on this site coordinate progress writes and refresh saved summaries. Saving and clearing require HTTPS (or secure localhost) and browser Web Locks support. If unavailable, practice still works and pending answers stay only in memory with recovery guidance. Refresh all older app windows after an update.']] : []),
  ['Device controls', 'You can clear this site’s browser storage, clear Android app storage, or delete the iOS app and its data. These broader actions remove other installation data too. Device backups and speech providers have their own controls.'],
  ['Support and changes', 'Report issues or privacy questions using the repository issue tracker below. GitHub processes submitted information under its own policies; avoid posting sensitive converter text. This policy will change when app storage, permissions or providers change.'],
];

export default function PrivacyScreen() {
  const { theme } = useTheme();
  return <Screen>
    <Heading>Privacy policy</Heading>
    <Text style={[styles.paragraph, { color: theme.colors.textSecondary }]}>Updated {PRIVACY_UPDATED}</Text>
    {SECTIONS.map(([title, body]) => <Text key={title} testID={title === 'Copy and Share' ? 'privacy-copy-share' : undefined} style={[styles.paragraph, { color: theme.colors.text }]}>
      <Text style={styles.sectionTitle}>{title}{'\n'}</Text>{body}
    </Text>)}
    <ExternalLink label="Privacy questions and support" url={SUPPORT_URL} />
  </Screen>;
}

const styles = StyleSheet.create({ paragraph: { fontSize: 16, lineHeight: 25, marginBottom: 12 }, sectionTitle: { fontWeight: '700', fontSize: 20 } });
