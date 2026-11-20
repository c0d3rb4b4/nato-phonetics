import { useSyncExternalStore } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { checkOffline, getOfflineState, subscribeOffline } from '../lib/webOffline';
import { Button, Heading } from './ui';

const messages = {
  preparing: 'Preparing the offline copy. Keep this window open and connected until it is ready.',
  ready: 'Offline copy ready. Reference, conversion, practice and saved local progress can open without a connection. Browser storage may be cleared or evicted.',
  waiting: 'Update ready. Finish your round, save pending progress and copy any draft you want to keep. Close every app window, then reopen to use the update. Reloading one window while others stay open keeps the current version.',
  error: 'Offline setup or update could not finish. Reconnect and retry. An existing offline copy is kept; first-time offline use needs a successful setup.',
  unavailable: 'Offline setup is unavailable here. Use a supported browser over HTTPS. Private browsing or storage restrictions may prevent setup. The connected app still works.',
};

export default function WebOfflineStatus() {
  const { theme } = useTheme();
  const { status, online } = useSyncExternalStore(subscribeOffline, getOfflineState);
  return <View testID="web-offline" style={styles.section}>
    <Heading>Web availability</Heading>
    <Text testID="web-offline-status" accessibilityLiveRegion="polite" style={[styles.text, { color: theme.colors.text }]}>{messages[/** @type {keyof typeof messages} */ (status)]}</Text>
    <Text style={[styles.text, { color: theme.colors.textSecondary }]}>{online ? 'Browser reports a connection.' : 'Browser reports offline.'} Speech connectivity depends on your browser and voice; an offline copy does not guarantee audio. No microphone recognition is implemented.</Text>
    <Button label={status === 'error' ? 'Retry offline setup' : 'Check for web update'} variant="secondary" onPress={() => { void checkOffline(); }} />
  </View>;
}
const styles = StyleSheet.create({ section: { gap: 12, marginTop: 16 }, text: { fontSize: 16, lineHeight: 25 } });
