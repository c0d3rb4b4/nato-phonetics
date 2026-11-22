import { StyleSheet, View } from 'react-native';
import { NavigationRow, Screen } from '../src/components/ui';
import WebOfflineStatus from '../src/components/WebOfflineStatus';

/** @type {import('../src/types').NavigationItem[]} */
const MENU_ITEMS = [
  { title: 'Learning progress', icon: 'book-outline', route: '/progress', description: 'Review saved results and due symbols.' },
  { title: 'Settings', icon: 'settings-outline', route: '/settings', description: 'Converter, appearance and voice.' },
  { title: 'Audio help', icon: 'volume-high-outline', route: '/audio-help', description: 'Test playback and troubleshoot sound.' },
  { title: 'About', icon: 'information-circle-outline', route: '/about' },
  { title: 'Privacy policy', icon: 'shield-checkmark-outline', route: '/privacy' },
];

export default function MenuScreen() {
  return <Screen>
    <View style={styles.destinations}>
      {MENU_ITEMS.map(item => <NavigationRow key={item.route} {...item} />)}
    </View>
    <WebOfflineStatus />
  </Screen>;
}

const styles = StyleSheet.create({ destinations: { gap: 8 } });
