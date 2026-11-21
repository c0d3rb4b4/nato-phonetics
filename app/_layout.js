import { useEffect, useState } from 'react';
import { Keyboard, KeyboardAvoidingView, Platform, Pressable, StatusBar, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Icon } from '../src/components/Icon';
import { ThemeProvider, useTheme } from '../src/context/ThemeContext';
import { APP_NAME } from '../src/lib/appMetadata';
import { router, ScreenFocusContext, useNavigationEvents, useNavigationState } from '../src/navigation';
import { PRIMARY_ROUTES, primaryRoute, ROUTE_TITLES } from '../src/navigation/routes';
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
  '/': Alphabet, '/alphabet': Alphabet, '/converter': Converter, '/letter-quiz': LetterQuiz,
  '/menu': Menu, '/settings': Settings, '/about': About, '/voice-select': VoiceSelect,
  '/privacy': Privacy, '/audio-help': AudioHelp, '/_sitemap': SiteMap, '/+not-found': NotFound,
  '/progress': Progress,
};

/** @type {Record<typeof PRIMARY_ROUTES[number], import('../src/types').IconName>} */
const TAB_ICONS = {
  '/alphabet': 'book-outline',
  '/converter': 'text-outline',
  '/letter-quiz': 'help-circle-outline',
  '/menu': 'menu',
};

/** @param {{route: typeof PRIMARY_ROUTES[number], active: boolean, onPress: () => void}} props */
function TabButton({ route, active, onPress }) {
  const { theme } = useTheme();
  const [focused, setFocused] = useState(false);
  const accent = theme.isDark ? '#A6C7FF' : theme.colors.primary;
  const color = active ? accent : theme.colors.textSecondary;
  return <Pressable accessibilityRole="button" accessibilityLabel={ROUTE_TITLES[route]}
    accessibilityState={{ selected: active }} aria-current={active ? 'page' : undefined}
    onPress={onPress} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
    style={({ pressed }) => [styles.tab, {
      backgroundColor: pressed || focused ? theme.colors.card : theme.colors.surface,
    }]}>
    {active && <View style={[styles.tabIndicator, { backgroundColor: accent }]} />}
    <Icon name={TAB_ICONS[route]} size={24} color={color} />
  </Pressable>;
}

/** @param {{path: import('../src/types').RoutePath, focused: boolean}} props */
function RoutedScreen({ path, focused }) {
  const CurrentScreen = SCREENS[path];
  return <ScreenFocusContext.Provider value={focused}>
    <View style={{ flex: 1, display: focused ? 'flex' : 'none' }}
      accessibilityElementsHidden={!focused} importantForAccessibility={focused ? 'auto' : 'no-hide-descendants'}
      aria-hidden={!focused}>
      <CurrentScreen />
    </View>
  </ScreenFocusContext.Provider>;
}

function LayoutContent() {
  const { theme, isLoading, preferenceError, retryPreferences } = useTheme();
  const navigation = useNavigationState();
  useNavigationEvents();
  const title = ROUTE_TITLES[navigation.path];
  const currentTab = primaryRoute(navigation.path);

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

  return <SafeAreaView testID="app-theme" edges={['top', 'left', 'right']}
    style={{ flex: 1, backgroundColor: theme.colors.background }}>
    <StatusBar barStyle={theme.isDark ? 'light-content' : 'dark-content'} backgroundColor={theme.colors.background} />
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'web' ? undefined : 'padding'}>
      {preferenceError && <View style={{ padding: 12, backgroundColor: theme.colors.surface }}>
        <Text accessibilityRole="alert" style={{ color: theme.colors.text }}>{preferenceError.message}</Text>
        {(preferenceError.operation === 'load' || preferenceError.operation === 'migration') &&
          <Pressable accessibilityRole="button" accessibilityLabel="Retry loading settings"
            onPress={() => { void retryPreferences(); }} style={{ paddingVertical: 12 }}>
            <Text style={{ color: theme.colors.text }}>Retry loading settings</Text>
          </Pressable>}
      </View>}
      {navigation.tabs.map(route => <RoutedScreen key={route} path={route} focused={route === currentTab} />)}
      {navigation.entries.filter(entry => !primaryRoute(entry.path)).map(entry =>
        <RoutedScreen key={entry.key} path={entry.path} focused={entry.key === navigation.key} />)}
      <SafeAreaView edges={['bottom']} style={[styles.tabBar, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
        <View testID="bottom-navigation" style={styles.tabRow}>
          {PRIMARY_ROUTES.map(route => <TabButton key={route} route={route} active={route === (currentTab ?? '/menu')}
            onPress={() => {
              if (route === currentTab) return;
              Keyboard.dismiss();
              router.push(route);
            }} />)}
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  </SafeAreaView>;
}

export default function RootLayout() {
  return <SafeAreaProvider><ThemeProvider><LayoutContent /></ThemeProvider></SafeAreaProvider>;
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#1F2933' },
  tabBar: { borderTopWidth: StyleSheet.hairlineWidth },
  tabRow: { flexDirection: 'row', width: '100%', maxWidth: 840, alignSelf: 'center' },
  tab: { flex: 1, minHeight: 52, alignItems: 'center', justifyContent: 'center' },
  tabIndicator: { position: 'absolute', top: 0, width: 28, height: 3, borderBottomLeftRadius: 3, borderBottomRightRadius: 3 },
});
