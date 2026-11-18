import { useEffect } from 'react';
import { Platform, Pressable, StatusBar, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Icon } from '../src/components/Icon';
import { HeaderInsets } from '../src/components/HeaderInsets';
import { ThemeProvider, useTheme } from '../src/context/ThemeContext';
import { APP_NAME } from '../src/lib/appMetadata';
import { router, ScreenFocusContext, useNavigationEvents, useNavigationState } from '../src/navigation';
import { ROUTE_TITLES } from '../src/navigation/routes';
import Home from './index';
import Alphabet from './alphabet';
import Converter from './converter';
import LetterQuiz from './letter-quiz';
import Progress from './progress';
import Menu from './menu';
import Settings from './settings';
import About from './about';
import VoiceSelect from './voice-select';
import Privacy from './privacy';
import AudioHelp from './audio-help';
import SiteMap from './_sitemap';
import NotFound from './+not-found';

/** @type {Record<import('../src/types').RoutePath, import('react').ComponentType>} */
const SCREENS = {
  '/': Home, '/alphabet': Alphabet, '/converter': Converter, '/letter-quiz': LetterQuiz,
  '/menu': Menu, '/settings': Settings, '/about': About, '/voice-select': VoiceSelect,
  '/privacy': Privacy, '/audio-help': AudioHelp, '/_sitemap': SiteMap, '/+not-found': NotFound,
  '/progress': Progress,
};

/** @param {{label: string, icon: import('../src/types').IconName, onPress: () => void}} props */
function HeaderButton({ label, icon, onPress }) {
  const { theme } = useTheme();
  return <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress}
    style={({ pressed }) => [styles.headerButton, { backgroundColor: pressed ? theme.colors.card : theme.colors.surface }]}>
    <Icon name={icon} size={24} color={theme.colors.text} />
  </Pressable>;
}

function LayoutContent() {
  const { theme, isLoading, preferenceError, retryPreferences } = useTheme();
  const navigation = useNavigationState();
  useNavigationEvents();
  const title = ROUTE_TITLES[navigation.path];
  const showMenu = ['/', '/alphabet', '/converter', '/letter-quiz'].includes(navigation.path);

  useEffect(() => {
    if (Platform.OS === 'web') {
      document.title = `${title} · ${APP_NAME}`;
      document.documentElement.style.backgroundColor = theme.colors.background;
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme.colors.background);
    }
  }, [title, theme.colors.background]);

  if (isLoading) {
    return <View testID="preferences-loading" style={styles.loading}>
      <Text style={{ color: '#F5F7FA' }}>Loading settings…</Text>
    </View>;
  }

  return <View testID="app-theme" style={{ flex: 1, backgroundColor: theme.colors.background }}>
    <StatusBar barStyle={theme.isDark ? 'light-content' : 'dark-content'} backgroundColor={theme.colors.surface} />
    <SafeAreaView edges={['top', 'left', 'right']} style={{ backgroundColor: theme.colors.surface }}>
      <HeaderInsets><View testID="app-header" style={styles.header}>
        {navigation.path !== '/' ? <HeaderButton label="Home" icon="home-outline" onPress={() => router.replace('/')} /> : <View style={styles.headerButton} />}
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>{title}</Text>
        {showMenu ? <HeaderButton label="Open menu" icon="menu" onPress={() => router.push('/menu')} /> : <View style={styles.headerButton} />}
      </View></HeaderInsets>
    </SafeAreaView>
    {preferenceError && <View style={{ padding: 12, backgroundColor: theme.colors.surface }}>
      <Text accessibilityRole="alert" style={{ color: theme.colors.text }}>{preferenceError.message}</Text>
      {(preferenceError.operation === 'load' || preferenceError.operation === 'migration') &&
        <Pressable accessibilityRole="button" accessibilityLabel="Retry loading settings"
          onPress={() => { void retryPreferences(); }} style={{ paddingVertical: 12 }}>
          <Text style={{ color: theme.colors.text }}>Retry loading settings</Text>
        </Pressable>}
    </View>}
    {navigation.entries.map(entry => {
      const CurrentScreen = SCREENS[entry.path];
      const focused = entry.key === navigation.key;
      return <ScreenFocusContext.Provider key={entry.key} value={focused}>
        <View style={{ flex: 1, display: focused ? 'flex' : 'none' }}
          accessibilityElementsHidden={!focused} importantForAccessibility={focused ? 'auto' : 'no-hide-descendants'}
          aria-hidden={!focused}>
          <CurrentScreen />
        </View>
      </ScreenFocusContext.Provider>;
    })}
  </View>;
}

export default function RootLayout() {
  return <SafeAreaProvider><ThemeProvider><LayoutContent /></ThemeProvider></SafeAreaProvider>;
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#1F2933' },
  header: { flexDirection: 'row', alignItems: 'center', minHeight: 56, paddingHorizontal: 8 },
  headerButton: { width: 48, minHeight: 48, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '600', paddingVertical: 12, paddingHorizontal: 4 },
});
