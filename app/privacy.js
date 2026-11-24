import { Platform, StyleSheet, View } from 'react-native';
import { ExternalLink, Heading, Screen, SectionHeading, SupportingText } from '../src/components/ui';
import { PRIVACY_UPDATED, SUPPORT_URL } from '../src/lib/appMetadata';
import { getSpokenPracticeSupport } from '../src/lib/spokenPracticeSupport';

const { versionNotice } = getSpokenPracticeSupport(Platform);
const SECTIONS = [
  ['About this policy', 'NATO Phonetics provides letter/digit reference, text conversion and letter/digit practice without an account. The authored app has no analytics, advertising or application backend. This describes the current implementation, not a legal compliance certification.'],
  ['Local data', 'The app uses AsyncStorage (browser storage on web) to store nato.preferences.v1. The record holds appearance, a selected voice, and any converter display and playback pace choices you save. The converter defaults to phonetic bubbles, 1× speed and 300 ms between words. Converter input, playback position and output page stay in memory.'],
  ['Updating older preferences', 'On first use after updating, the app reads the old darkMode and selectedVoice keys. It removes only those legacy keys after the versioned record is saved successfully. A failed migration retains old data and displays a recovery message.'],
  ['Learning progress', 'Each submitted quiz answer saves a separate nato.progress.v1 record on this device or browser: per-symbol attempts, errors, consecutive-correct step, last-review time and next-due time. All practice modes and listening text alternatives share these totals. There is no account or app cloud sync. No typed response, round recap, practice mode or audio is stored in progress.'],
  ['Text and practice', 'Converter text, practice mode, review selection, typed drafts, text alternatives and current quiz answers/recaps stay in memory. Closing or reloading clears them.'],
  ['Progress recovery', 'Progress starts at version 1; there is no earlier progress record to migrate. Unsupported or unreadable data is kept unchanged until you retry loading or explicitly clear it. Failed answer writes are held in memory for Retry while the app remains open; summaries show saved answers only.'],
  ...(Platform.OS === 'android' ? [['Spoken answers', versionNotice
    ? `${versionNotice} The app does not request microphone access on this Android version.`
    : 'Start recording asks for microphone access. Spoken practice uses Android’s on-device US English recognizer. You can edit the result before checking. The app keeps the code word in the current round and saves only symbol totals and review times. It does not save recordings or send audio to an app service.']] : []),
  ['Copy and Share', 'Only when you tap Copy conversion does the app write the plain text conversion, including not-spoken markers, to the system clipboard. Share conversion passes that same text to the operating system or browser share sheet for you to choose a destination. Clipboard history, synced clipboards and receiving apps have their own controls. Editing the converter text stops playback. Manage earlier copies or shares through your clipboard or the receiving app.'],
  ['Speech and connectivity', 'Requested playback passes text through the native operating system speech API or directly to the browser’s speech provider on web. Voices, processing location, connectivity and retention depend on that provider. Some voices may use network services. The app does not enforce on-device speech or verify provider retention. Check your provider’s settings and policy before entering sensitive text. Speech output does not request microphone access.'],
  ['Offline availability', Platform.OS === 'web' ? 'After a successful connected setup, this site caches a versioned app shell: route pages, application code, bundled fonts and favicon. Menu shows offline readiness or setup/retry guidance. Reference, conversion and practice run locally; preferences and learning progress stay in their separate browser records. No converter input, quiz response or provider traffic is added to the shell cache. Browser storage may be cleared or evicted; a first visit needs a connection. Speech still depends on the browser and voice provider. Updates wait until all app windows close; finish/save or copy drafts before closing. No forced reload or microphone capture is added.' : 'Reference and conversion logic run locally once loaded. Audio in airplane mode has not been verified across supported devices.'],
  ['Deletion and control', 'Settings → Reset Preferences restores System appearance, System Default voice, phonetic bubbles and the default playback pace (1× speed, 300 ms between words). Reset changes only nato.preferences.v1 and removes its two old migration keys. It keeps unrelated local storage and learning progress. A failed save leaves the previous choice selected and displays an error.'],
  ['Clear Progress', Platform.OS === 'web' ? 'Clear Progress deletes saved totals and review times across this site’s updated app windows. A random deletion marker remains in nato.progress.v1 so an older unsaved answer cannot restore cleared totals on Retry. The marker has no answers or identity information and is replaced at each deletion. Preferences and unrelated storage are kept. New submissions start new progress. Failed deletion keeps data and reports an error. This cannot erase backups.' : 'Menu → Learning progress → Clear Progress asks you to confirm deletion of nato.progress.v1 and pending unsaved answers. Preferences and unrelated storage are kept. The current round stays in memory; answers submitted after deletion begin new progress. Failed deletion reports an error and keeps progress. This cannot erase device backups.'],
  ...(Platform.OS === 'web' ? [['Browser progress', 'Updated windows on this site coordinate progress writes and refresh saved summaries. Saving and clearing require HTTPS (or secure localhost) and browser Web Locks support. If unavailable, practice still works and pending answers stay only in memory with recovery guidance. Refresh all older app windows after an update.']] : []),
  ['Device controls', 'You can clear this site’s browser storage, clear Android app storage, or delete the iOS app and its data. These broader actions remove other installation data too. Device backups and speech providers have their own controls.'],
  ['Support and changes', 'Report issues or privacy questions using the repository issue tracker below. GitHub processes submitted information under its own policies; avoid posting sensitive converter text. This policy will change when app storage, permissions or providers change.'],
];

export default function PrivacyScreen() {
  return <Screen>
    <View>
      <Heading>Privacy policy</Heading>
      <SupportingText>Updated {PRIVACY_UPDATED}</SupportingText>
    </View>
    {SECTIONS.map(([title, body]) => <View key={title} testID={title === 'Copy and Share' ? 'privacy-copy-share' : undefined} style={styles.section}>
      <SectionHeading>{title}</SectionHeading>
      <SupportingText muted={false} style={styles.paragraph}>{body}</SupportingText>
    </View>)}
    <ExternalLink title="Privacy questions and support" description="Opens GitHub in your browser" icon="help-circle-outline" url={SUPPORT_URL} />
  </Screen>;
}

const styles = StyleSheet.create({ section: { gap: 4 }, paragraph: { fontSize: 16, lineHeight: 25 } });
