import { createContext, useContext, useEffect, useState, useSyncExternalStore } from 'react';
import { Appearance, Platform, useColorScheme } from 'react-native';
import { preferenceStore } from '../lib/preferenceStore';
import { resolveThemeMode } from '../lib/preferences';

/** @type {import('react').Context<import('../types').ThemeContextValue | undefined>} */
const ThemeContext = createContext(/** @type {import('../types').ThemeContextValue | undefined} */ (undefined));

/** @param {{ children: import('react').ReactNode }} props */
export function ThemeProvider({ children }) {
  const snapshot = useSyncExternalStore(
    preferenceStore.subscribe, preferenceStore.getSnapshot, preferenceStore.getServerSnapshot,
  );
  const systemScheme = useColorScheme();
  const [clientReady, setClientReady] = useState(false);

  useEffect(() => {
    setClientReady(true);
    void preferenceStore.hydrate();
  }, []);

  useEffect(() => {
    if (!snapshot.isLoading && Platform.OS !== 'web') {
      // This also styles native controls. Clearing the override restores OS events.
      Appearance.setColorScheme(snapshot.preferences.themeMode === 'system'
        ? null : snapshot.preferences.themeMode);
    }
  }, [snapshot.isLoading, snapshot.preferences.themeMode]);

  const isDark = resolveThemeMode(snapshot.preferences.themeMode, systemScheme) === 'dark';
  /** @type {import('../types').Theme} */
  const theme = {
    isDark,
    colors: isDark ? {
      background: '#1F2933',
      surface: '#323F4B',
      card: '#3E4C59',
      text: '#F5F7FA',
      textSecondary: '#CBD2D9',
      border: '#52606D',
      primary: '#1D4ED8',
    } : {
      background: '#FFFDF7',
      surface: '#FFFFFF',
      card: '#F9FAFB',
      text: '#1F2933',
      textSecondary: '#6B7280',
      border: '#E5E7EB',
      primary: '#1D4ED8',
    },
  };

  return (
    <ThemeContext.Provider value={{
      theme,
      preferences: snapshot.preferences,
      isLoading: snapshot.isLoading || !clientReady,
      isSaving: snapshot.isSaving,
      preferenceError: snapshot.error,
      setThemeMode: themeMode => preferenceStore.update({ themeMode }),
      setSelectedVoice: selectedVoice => preferenceStore.update({ selectedVoice }),
      setConverterPacing: converterPacing => preferenceStore.update({ converterPacing }),
      resetPreferences: preferenceStore.reset,
      retryPreferences: preferenceStore.retry,
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
}
