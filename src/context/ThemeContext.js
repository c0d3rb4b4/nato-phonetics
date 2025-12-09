import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const systemColorScheme = useColorScheme();
  const [isDarkMode, setIsDarkMode] = useState(systemColorScheme === 'dark');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadThemePreference();
  }, []);

  const loadThemePreference = async () => {
    try {
      const saved = await AsyncStorage.getItem('darkMode');
      if (saved !== null) {
        setIsDarkMode(saved === 'true');
      }
    } catch (error) {
      console.error('Failed to load theme preference:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleDarkMode = async () => {
    const newValue = !isDarkMode;
    setIsDarkMode(newValue);
    try {
      await AsyncStorage.setItem('darkMode', String(newValue));
    } catch (error) {
      console.error('Failed to save theme preference:', error);
    }
  };

  const theme = {
    isDark: isDarkMode,
    colors: isDarkMode ? {
      background: '#1F2933',
      surface: '#323F4B',
      card: '#3E4C59',
      text: '#F5F7FA',
      textSecondary: '#CBD2D9',
      border: '#52606D',
      primary: '#3B82F6',
    } : {
      background: '#FFFDF7',
      surface: '#FFFFFF',
      card: '#F9FAFB',
      text: '#1F2933',
      textSecondary: '#6B7280',
      border: '#E5E7EB',
      primary: '#3B82F6',
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, isDarkMode, toggleDarkMode, isLoading }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
