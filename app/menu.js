import { useRouter } from '../src/navigation';
import { Button, Heading, NavigationCard, Screen } from '../src/components/ui';
import WebOfflineStatus from '../src/components/WebOfflineStatus';

/** @type {import('../src/types').NavigationItem[]} */
const MENU_ITEMS = [
  { title: 'Learning progress', icon: 'book-outline', route: '/progress', description: 'Review saved symbol totals and clear progress.' },
  { title: 'Settings', icon: 'settings-outline', route: '/settings', description: 'Choose appearance and voice preferences.' },
  { title: 'Audio help', icon: 'volume-high-outline', route: '/audio-help', description: 'Test playback and troubleshoot sound.' },
  { title: 'About', icon: 'information-circle-outline', route: '/about', description: 'Learn about the app and find support.' },
  { title: 'Privacy policy', icon: 'shield-checkmark-outline', route: '/privacy', description: 'Read about local data and speech providers.' },
];

export default function MenuScreen() {
  const router = useRouter();
  return <Screen>
    <Heading>Menu</Heading>
    {MENU_ITEMS.map(item => <NavigationCard key={item.route.toString()} {...item} />)}
    <Button label="Back to App" accessibilityHint="Returns to the previous app screen, or Home on a direct visit"
      onPress={() => router.canGoBack() ? router.back() : router.replace('/')} />
    <Button label="Home" variant="secondary" onPress={() => router.replace('/')} />
    <WebOfflineStatus />
  </Screen>;
}
