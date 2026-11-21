import { useRouter } from '../src/navigation';
import { Text } from 'react-native';
import { Button, Heading, Screen } from '../src/components/ui';
import { useTheme } from '../src/context/ThemeContext';

export default function NotFoundScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  return <Screen>
    <Heading>Page not found</Heading>
    <Text style={{ fontSize: 16, lineHeight: 24, color: theme.colors.text }}>This address does not match a page in the app.</Text>
    <Button label="Open site map" variant="secondary" onPress={() => router.replace('/_sitemap')} />
  </Screen>;
}
