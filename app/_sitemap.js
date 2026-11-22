import { StyleSheet, View } from 'react-native';
import { Heading, NavigationRow, Screen } from '../src/components/ui';

/** @type {import('../src/types').NavigationItem[]} */
const ROUTES = [
  { title: 'Reference', route: '/alphabet', icon: 'book-outline', description: 'Browse letters, digits and pronunciation guides.' },
  { title: 'Word Converter', route: '/converter', icon: 'text-outline', description: 'Convert and play a word or phrase.' },
  { title: 'Letter Quiz', route: '/letter-quiz', icon: 'help-circle-outline', description: 'Practice with choices, listening or typed answers.' },
  { title: 'Learning progress', route: '/progress', icon: 'book-outline', description: 'Review saved results and due symbols.' },
  { title: 'Menu', route: '/menu', icon: 'menu-outline', description: 'Find settings, help and app information.' },
  { title: 'Settings', route: '/settings', icon: 'settings-outline', description: 'Converter, appearance and voice.' },
  { title: 'Select Voice', route: '/voice-select', icon: 'mic-outline', description: 'Browse English speech voices.' },
  { title: 'Audio Help', route: '/audio-help', icon: 'volume-high-outline', description: 'Test audio and troubleshoot playback.' },
  { title: 'About', route: '/about', icon: 'information-circle-outline', description: 'Read about the app and find support.' },
  { title: 'Privacy Policy', route: '/privacy', icon: 'shield-checkmark-outline', description: 'Read how local data and speech are handled.' },
];

export default function SiteMapScreen() {
  return <Screen>
    <Heading>Site map</Heading>
    <View style={styles.destinations}>
      {ROUTES.map(item => <NavigationRow key={item.route} {...item} />)}
    </View>
  </Screen>;
}

const styles = StyleSheet.create({ destinations: { gap: 8 } });
