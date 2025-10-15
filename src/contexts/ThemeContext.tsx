import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { 
  saveUserThemePreference, 
  getUserThemePreference, 
  applyTheme,
  updateThemeOnUserChange,
  watchSystemThemeChanges,
  ThemePreference 
} from '../services/themeService';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  actualTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  loading: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { userProfile } = useAuth();
  const [theme, setThemeState] = useState<Theme>('light');
  const [loading, setLoading] = useState(true);

  const [actualTheme, setActualTheme] = useState<'light' | 'dark'>('light');

  // Kullanıcı değiştiğinde tema tercihini yükle
  useEffect(() => {
    // Koyu tema kapalı: her zaman açık temayı uygula
    applyTheme('light');
    setThemeState('light');
    setActualTheme('light');
    setLoading(false);
  }, [userProfile?.uid]);

  // Tema değiştiğinde uygula
  useEffect(() => {
    if (!loading) {
      applyTheme('light');
      setActualTheme('light');
    }
  }, [theme, loading]);

  // Sistem teması değişikliklerini dinle
  useEffect(() => {
    // Sistem değişikliklerini dinlemeye gerek yok
  }, [theme]);

  const setTheme = async (_newTheme: Theme) => {
    // Tema kilitli: her zaman light uygula
    setThemeState('light');
    if (userProfile?.uid) {
      try {
        await saveUserThemePreference(userProfile.uid, 'light');
      } catch {}
    } else {
      localStorage.setItem('theme', 'light');
    }
    applyTheme('light');
  };

  const toggleTheme = () => {
    // Kapalı
    setTheme('light');
  };

  return (
    <ThemeContext.Provider value={{ theme, actualTheme, setTheme, toggleTheme, loading }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
