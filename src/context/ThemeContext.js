import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ThemeContext = createContext();

// Thèmes clair et sombre
const lightTheme = {
  isDark: false,
  colors: {
    primary: '#007AFF',
    secondary: '#34C759',
    background: '#FFFFFF',
    surface: '#F2F2F7',
    text: '#000000',
    textSecondary: '#6D6D80',
    border: '#E5E5EA',
    error: '#FF3B30',
    warning: '#FF9500',
    success: '#34C759',
    income: '#34C759',
    expense: '#FF3B30',
    shadow: '#000000',
  },
  // Propriétés de police complètes
  fonts: {
    light: '300',
    regular: 'normal',
    medium: '500',
    semiBold: '600',
    bold: 'bold',
  },
  // Propriétés directes pour compatibilité
  light: '300',
  regular: 'normal',
  medium: '500',
  semiBold: '600',
  bold: 'bold',
  // Tailles de police
  fontSizes: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
  },
  // Espacements
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  // Rayons de bordure
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
  },
};

const darkTheme = {
  isDark: true,
  colors: {
    primary: '#0A84FF',
    secondary: '#32D74B',
    background: '#000000',
    surface: '#1C1C1E',
    text: '#FFFFFF',
    textSecondary: '#8E8E93',
    border: '#38383A',
    error: '#FF453A',
    warning: '#FF9F0A',
    success: '#32D74B',
    income: '#32D74B',
    expense: '#FF453A',
    shadow: '#FFFFFF',
  },
  // Propriétés de police complètes
  fonts: {
    light: '300',
    regular: 'normal',
    medium: '500',
    semiBold: '600',
    bold: 'bold',
  },
  // Propriétés directes pour compatibilité
  light: '300',
  regular: 'normal',
  medium: '500',
  semiBold: '600',
  bold: 'bold',
  // Tailles de police
  fontSizes: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
  },
  // Espacements
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  // Rayons de bordure
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
  },
};

export const ThemeProvider = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [isDarkMode, setIsDarkMode] = useState(systemColorScheme === 'dark');
  const [themePreference, setThemePreference] = useState('system');

  // Charger les préférences au démarrage
  useEffect(() => {
    loadThemePreference();
  }, []);

  // Appliquer le thème selon la préférence
  useEffect(() => {
    if (themePreference === 'system') {
      setIsDarkMode(systemColorScheme === 'dark');
    } else {
      setIsDarkMode(themePreference === 'dark');
    }
  }, [themePreference, systemColorScheme]);

  const loadThemePreference = async () => {
    try {
      const savedPreference = await AsyncStorage.getItem('themePreference');
      if (savedPreference) {
        setThemePreference(savedPreference);
      }
    } catch (error) {
      console.error('Erreur lors du chargement du thème:', error);
    }
  };

  const saveThemePreference = async (preference) => {
    try {
      await AsyncStorage.setItem('themePreference', preference);
      setThemePreference(preference);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du thème:', error);
    }
  };

  const toggleTheme = () => {
    const newPreference = isDarkMode ? 'light' : 'dark';
    saveThemePreference(newPreference);
  };

  const setSystemTheme = () => {
    saveThemePreference('system');
  };

  const theme = isDarkMode ? darkTheme : lightTheme;

  const value = {
    theme,
    isDarkMode,
    themePreference,
    toggleTheme,
    setSystemTheme,
    setThemePreference: saveThemePreference,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export default ThemeProvider;