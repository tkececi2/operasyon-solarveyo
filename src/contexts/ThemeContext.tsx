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
  const [theme, setThemeState] = useState<Theme>('system');
  const [loading, setLoading] = useState(true);

  const [actualTheme, setActualTheme] = useState<'light' | 'dark'>('light');

  // Kullanıcı değiştiğinde tema tercihini yükle
  useEffect(() => {
    const loadUserTheme = async () => {
      if (userProfile?.uid) {
        setLoading(true);
        try {
          const userTheme = await getUserThemePreference(userProfile.uid);
          setThemeState(userTheme);
          applyTheme(userTheme);
          
          // Actual theme'i güncelle
          if (userTheme === 'system') {
            const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            setActualTheme(isDark ? 'dark' : 'light');
          } else {
            setActualTheme(userTheme as 'light' | 'dark');
          }
        } catch (error) {
          console.error('Tema yükleme hatası:', error);
        } finally {
          setLoading(false);
        }
      } else {
        // Kullanıcı yoksa varsayılan tema
        setThemeState('system');
        applyTheme('system');
        setLoading(false);
      }
    };

    loadUserTheme();
  }, [userProfile?.uid]);

  // Tema değiştiğinde uygula
  useEffect(() => {
    if (!loading && theme) {
      applyTheme(theme);
      
      // Actual theme'i güncelle
      if (theme === 'system') {
        const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setActualTheme(isDark ? 'dark' : 'light');
      } else {
        setActualTheme(theme as 'light' | 'dark');
      }
    }
  }, [theme, loading]);

  // Sistem teması değişikliklerini dinle
  useEffect(() => {
    if (theme === 'system') {
      const cleanup = watchSystemThemeChanges((isDark) => {
        setActualTheme(isDark ? 'dark' : 'light');
        applyTheme('system');
      });
      
      return cleanup;
    }
  }, [theme]);

  const setTheme = async (newTheme: Theme) => {
    if (userProfile?.uid) {
      try {
        // Firebase'e kaydet
        await saveUserThemePreference(userProfile.uid, newTheme);
        setThemeState(newTheme);
        applyTheme(newTheme);
      } catch (error) {
        console.error('Tema kaydetme hatası:', error);
      }
    } else {
      // Kullanıcı yoksa sadece local'e kaydet
      setThemeState(newTheme);
      localStorage.setItem('theme', newTheme);
      applyTheme(newTheme);
    }
  };

  const toggleTheme = () => {
    const newTheme = actualTheme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
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
