/**
 * 🎯 OneSignal React Hook
 * Multi-tenant SAAS için kullanıcı yönetimi
 */

import { useState, useEffect } from 'react';
import OneSignalService from '../services/oneSignalService';
import { useAuth } from '../contexts/AuthContext';
import { User } from '../types';

interface OneSignalHookReturn {
  initialized: boolean;
  permission: string | null;
  playerId: string | null;
  tags: Record<string, any> | null;
  setupUser: (userProfile: User) => Promise<void>;
  sendTestNotification: () => Promise<boolean>;
  getUserInfo: () => Promise<any>;
}

export const useOneSignal = (): OneSignalHookReturn => {
  const { userProfile } = useAuth();
  const [initialized, setInitialized] = useState(false);
  const [permission, setPermission] = useState<string | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [tags, setTags] = useState<Record<string, any> | null>(null);

  // OneSignal'i başlat
  useEffect(() => {
    const initOneSignal = async () => {
      const success = await OneSignalService.initialize();
      setInitialized(success);
      
      if (success) {
        loadUserInfo();
      }
    };

    initOneSignal();
  }, []);

  // Kullanıcı bilgilerini yükle
  const loadUserInfo = async () => {
    try {
      const info = await OneSignalService.getUserInfo();
      if (info) {
        setPermission(info.permission);
        setPlayerId(info.playerId);
        setTags(info.tags);
      }
    } catch (error) {
      console.error('OneSignal user info yüklenirken hata:', error);
    }
  };

  // Kullanıcı profili değiştiğinde tags güncelle
  useEffect(() => {
    if (initialized && userProfile?.companyId) {
      setupUser(userProfile);
    }
  }, [initialized, userProfile?.companyId, userProfile?.rol]);

  // Kullanıcı bilgilerini OneSignal'e set et
  const setupUser = async (user: User) => {
    if (!initialized || !user.companyId) return;

    try {
      console.log('👤 OneSignal user setup:', user.email);

      const success = await OneSignalService.setUserTags({
        companyId: user.companyId,
        companyName: user.companyName || user.companyId,
        role: user.rol,
        userId: user.id,
        sahalar: user.sahalar as string[],
        santraller: user.santraller as string[], 
        email: user.email,
        name: user.ad
      });

      if (success) {
        await loadUserInfo();
        console.log('✅ OneSignal user setup başarılı');
      }
    } catch (error) {
      console.error('❌ OneSignal user setup hatası:', error);
    }
  };

  // Test bildirimi gönder
  const sendTestNotification = async (): Promise<boolean> => {
    if (!userProfile?.companyId) return false;

    return OneSignalService.sendTestNotification(
      userProfile.companyId,
      `Test - ${userProfile.ad}`
    );
  };

  // Kullanıcı bilgilerini al (debug)
  const getUserInfo = async () => {
    return OneSignalService.getUserInfo();
  };

  return {
    initialized,
    permission,
    playerId,
    tags,
    setupUser,
    sendTestNotification,
    getUserInfo
  };
};

export default useOneSignal;
