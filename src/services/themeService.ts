/**
 * Theme Service
 * Kullanıcı bazlı tema yönetimi
 */

import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { User } from '../types';

export type ThemePreference = 'light' | 'dark' | 'system';

/**
 * Kullanıcının tema tercihini kaydet
 */
export async function saveUserThemePreference(
  userId: string, 
  theme: ThemePreference
): Promise<void> {
  try {
    const userRef = doc(db, 'kullanicilar', userId);
    
    await updateDoc(userRef, {
      themePreference: theme,
      themeUpdatedAt: new Date()
    });

    // LocalStorage'a da kaydet (hızlı erişim için)
    localStorage.setItem(`theme_${userId}`, theme);
    
    console.log('✅ Tema tercihi kaydedildi:', theme);
  } catch (error) {
    console.error('❌ Tema kaydetme hatası:', error);
    throw error;
  }
}

/**
 * Kullanıcının tema tercihini getir
 */
export async function getUserThemePreference(userId: string): Promise<ThemePreference> {
  try {
    // Önce LocalStorage'dan kontrol et (hızlı)
    const cachedTheme = localStorage.getItem(`theme_${userId}`) as ThemePreference;
    if (cachedTheme) {
      return cachedTheme;
    }

    // Firebase'den getir
    const userRef = doc(db, 'kullanicilar', userId);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      const data = userDoc.data();
      const theme = data.themePreference || 'system';
      
      // LocalStorage'a kaydet
      localStorage.setItem(`theme_${userId}`, theme);
      
      return theme as ThemePreference;
    }
    
    return 'system'; // Varsayılan
  } catch (error) {
    console.error('❌ Tema getirme hatası:', error);
    return 'system';
  }
}

/**
 * Tema uygula
 */
export function applyTheme(theme: ThemePreference): void {
  // Koyu tema KAPALI: Her zaman açık temayı uygula ve tüm dark classlarını kaldır
  document.documentElement.classList.remove('dark');
  document.documentElement.style.colorScheme = 'light';
  document.body.classList.remove('dark');
}

/**
 * Kullanıcı değiştiğinde tema güncelle
 */
export async function updateThemeOnUserChange(userId: string | null): Promise<void> {
  if (!userId) {
    // Kullanıcı çıkış yaptı, varsayılan temaya dön
    applyTheme('system');
    return;
  }

  // Kullanıcının tema tercihini getir ve uygula
  const theme = await getUserThemePreference(userId);
  applyTheme(theme);
}

/**
 * Tüm kullanıcıların tema tercihlerini temizle (admin için)
 */
export function clearAllThemePreferences(): void {
  // LocalStorage'daki tüm tema tercihlerini temizle
  const keys = Object.keys(localStorage);
  keys.forEach(key => {
    if (key.startsWith('theme_')) {
      localStorage.removeItem(key);
    }
  });
  
  console.log('🗑️ Tüm tema tercihleri temizlendi');
}

/**
 * Tema değişikliklerini dinle (sistem teması için)
 */
export function watchSystemThemeChanges(callback: (isDark: boolean) => void): () => void {
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  
  const handler = (e: MediaQueryListEvent) => {
    callback(e.matches);
  };
  
  mediaQuery.addEventListener('change', handler);
  
  // Cleanup function
  return () => {
    mediaQuery.removeEventListener('change', handler);
  };
}
