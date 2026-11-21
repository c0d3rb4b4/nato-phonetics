import { NavigationCard, Screen } from '../src/components/ui';
import WebOfflineStatus from '../src/components/WebOfflineStatus';

/** @type {import('../src/types').NavigationItem[]} */
const MENU_ITEMS = [
  { title: 'Learning progress', icon: 'book-outline', route: '/progress', description: 'Review saved symbol totals and clear progress.' },
  { title: 'Settings', icon: 'settings-outline', route: '/settings', description: 'Set converter display and playback pace, appearance, and voice.' },
  { title: 'Audio help', icon: 'volume-high-outline', route: '/audio-help', description: 'Test playback and troubleshoot sound.' },
  { title: 'About', icon: 'information-circle-outline', route: '/about', description: 'Learn about the app and find support.' },
  { title: 'Privacy policy', icon: 'shield-checkmark-outline', route: '/privacy', description: 'Read about local data and speech providers.' },
];

export default function MenuScreen() {
  return <Screen>
    {MENU_ITEMS.map(item => <NavigationCard key={item.route.toString()} {...item} />)}
    <WebOfflineStatus />
  </Screen>;
}
