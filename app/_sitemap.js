import { Heading, NavigationCard, Screen } from '../src/components/ui';

/** @type {import('../src/types').NavigationItem[]} */
const ROUTES = [
  { title: 'Home', route: '/', icon: 'home-outline', description: 'Choose a learning activity.' },
  { title: 'NATO Alphabet', route: '/alphabet', icon: 'book-outline', description: 'Browse letters and pronunciation guides.' },
  { title: 'Word Converter', route: '/converter', icon: 'text-outline', description: 'Convert and play a word or phrase.' },
  { title: 'Letter Quiz', route: '/letter-quiz', icon: 'help-circle-outline', description: 'Practice with multiple-choice questions.' },
  { title: 'Menu', route: '/menu', icon: 'menu-outline', description: 'Find settings, help and app information.' },
  { title: 'Settings', route: '/settings', icon: 'settings-outline', description: 'Choose appearance and voice.' },
  { title: 'Select Voice', route: '/voice-select', icon: 'mic-outline', description: 'Browse English speech voices.' },
  { title: 'Audio Help', route: '/audio-help', icon: 'volume-high-outline', description: 'Test audio and troubleshoot playback.' },
  { title: 'About', route: '/about', icon: 'information-circle-outline', description: 'Read about the app and find support.' },
  { title: 'Privacy Policy', route: '/privacy', icon: 'shield-checkmark-outline', description: 'Read how local data and speech are handled.' },
];

export default function SiteMapScreen() {
  return <Screen>
    <Heading>Site map</Heading>
    {ROUTES.map(item => <NavigationCard key={item.route.toString()} {...item} />)}
  </Screen>;
}
