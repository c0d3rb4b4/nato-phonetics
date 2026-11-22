import { useRouter } from '../src/navigation';
import { Button, Heading, Screen, SupportingText } from '../src/components/ui';

export default function NotFoundScreen() {
  const router = useRouter();
  return <Screen>
    <Heading>Page not found</Heading>
    <SupportingText>This address does not match a page in the app.</SupportingText>
    <Button label="Open site map" compact onPress={() => router.replace('/_sitemap')} />
  </Screen>;
}
