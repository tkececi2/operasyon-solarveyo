import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';
import { notificationService, type Notification } from '../services/notificationService';
import { badgeService } from '../services/badgeService';
import toast from 'react-hot-toast';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { userProfile } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const initializedRef = useRef(false);
  const seenIdsRef = useRef<Set<string>>(new Set());
  
  // iOS: Uygulama açıldığında badge'i temizle
  useEffect(() => {
    badgeService.clearBadge().then(() => {
      console.log('✅ iOS Badge temizlendi (app mount)');
    });
  }, []);

  const filterByRole = (items: Notification[]): Notification[] => {
    if (!userProfile) return items;
    // Eğer bildirim belirli rollere hedeflendiyse sadece o rollere göster
    const roleFiltered = items.filter(n => {
      const targetRoles: string[] | undefined = (n as any).metadata?.targetRoles;
      return !targetRoles || targetRoles.includes(userProfile.rol);
    });

    // Müşteri ve Bekçi rolleri için saha/santral bazlı filtreleme
    if (userProfile.rol === 'musteri' || userProfile.rol === 'bekci') {
      const userSahalar = (userProfile.sahalar as string[] | undefined) || [];
      const userSantraller = (userProfile.santraller as string[] | undefined) || [];
      return roleFiltered.filter(n => {
        const md = n.metadata || {};
        const sahaOk = (md as any).sahaId ? userSahalar.includes((md as any).sahaId) : true;
        const santralOk = (md as any).santralId ? userSantraller.includes((md as any).santralId) : true;
        return sahaOk && santralOk;
      });
    }
    
    return roleFiltered;
  };

  // Bildirimleri yükle
  const refreshNotifications = async () => {
    if (!userProfile?.companyId || !userProfile?.id) return;

    try {
      setLoading(true);
      const list = await notificationService.getScopedUserNotifications(
        userProfile.companyId,
        userProfile.id,
        (userProfile.sahalar as string[]) || [],
        (userProfile.santraller as string[]) || [],
        50,
        userProfile.rol
      );
      
      console.log('📬 Bildirimler geldi:', {
        toplam: list.length,
        rol: userProfile.rol,
        userId: userProfile.id,
        ilk5: list.slice(0, 5).map(n => ({
          title: n.title,
          userId: (n as any).userId,
          metadata: n.metadata
        }))
      });
      
      const filtered = filterByRole(list).map(n => ({
        ...n,
        // Önce kullanıcı-bazlı okundu, yoksa legacy 'read' alanı
        read: (n.readBy || []).includes(userProfile.id) || (!n.readBy && (n as any).read === true)
      }));
      
      console.log('📬 Filtrelenmiş bildirimler:', filtered.length);
      
      setNotifications(filtered);
      const unread = filtered.filter(n => !n.read).length;
      setUnreadCount(unread);
      
      // KRİTİK: iOS Badge sayısını güncelle
      await badgeService.setBadgeCount(unread);
      console.log(`🔴 iOS Badge güncellendi: ${unread}`);
    } catch (error) {
      console.error('Bildirimler yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  // Real-time bildirim dinleyicisi
  useEffect(() => {
    // Kullanıcı giriş yapmamışsa bildirim dinleme
    if (!userProfile?.companyId || !userProfile?.id) {
      // Kullanıcı çıkış yaptıysa state'leri temizle
      setNotifications([]);
      setUnreadCount(0);
      seenIdsRef.current.clear();
      initializedRef.current = false;
      
      // KRİTİK: iOS Badge'i temizle
      badgeService.clearBadge().then(() => {
        console.log('✅ iOS Badge temizlendi (logout)');
      });
      
      return;
    }

    const unsubscribe = notificationService.subscribeToScopedNotifications(
      userProfile.companyId,
      userProfile.id,
      (userProfile.sahalar as string[]) || [],
      (userProfile.santraller as string[]) || [],
      (newNotifications) => {
        const filtered = filterByRole(newNotifications).map(n => ({
          ...n,
          read: (n.readBy || []).includes(userProfile.id) || (!n.readBy && (n as any).read === true)
        }));

        // Toast bildirimleri devre dışı (popup'ları kaldırmak için)
        if (!initializedRef.current) {
          initializedRef.current = true;
        }
        // Yeni gelenler için toast gösterme - popup'ları kaldırdık
        // const newlyAdded = filtered.filter(n => !seenIdsRef.current.has(n.id));
        // newlyAdded.forEach(n => {
        //   const text = n.message ? `${n.title}: ${n.message}` : n.title;
        //   if (n.type === 'error') toast.error(text);
        //   else if (n.type === 'success') toast.success(text);
        //   else if (n.type === 'warning') toast(text, { icon: '⚠️' });
        //   else toast(text, { icon: 'ℹ️' });
        // });

        // Görülen ID'leri güncelle
        seenIdsRef.current = new Set(filtered.map(n => n.id));

        setNotifications(filtered);
        const unreadCount = filtered.filter(n => !n.read).length;
        setUnreadCount(unreadCount);
        
        // KRİTİK: iOS Badge sayısını güncelle (realtime)
        badgeService.setBadgeCount(unreadCount).then(() => {
          console.log(`🔴 iOS Badge güncellendi (realtime): ${unreadCount}`);
        });
      },
      userProfile.rol
    );

    return unsubscribe;
  }, [userProfile?.companyId, userProfile?.id]);

  // Bildirimi okundu olarak işaretle
  const markAsRead = async (notificationId: string) => {
    try {
      if (!userProfile?.id) return;
      await notificationService.markNotificationAsRead(notificationId, userProfile.id);
      
      // Local state'i güncelle
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, read: true, readBy: [ ...(notification.readBy || []), userProfile.id ] }
            : notification
        )
      );
      
      const newUnreadCount = Math.max(0, unreadCount - 1);
      setUnreadCount(newUnreadCount);
      
      // KRİTİK: iOS Badge'i güncelle
      badgeService.setBadgeCount(newUnreadCount).then(() => {
        console.log(`🔴 iOS Badge güncellendi (okundu): ${newUnreadCount}`);
      });
    } catch (error) {
      console.error('Bildirim okundu işaretleme hatası:', error);
    }
  };

  // Tüm bildirimleri okundu olarak işaretle
  const markAllAsRead = async () => {
    if (!userProfile?.companyId || !userProfile?.id) return;

    try {
      await notificationService.markAllNotificationsAsRead(userProfile.companyId, userProfile.id);
      
      // Local state'i güncelle
      setNotifications(prev => 
        prev.map(notification => ({ 
          ...notification, 
          read: true,
          readBy: [ ...(notification.readBy || []), userProfile.id ]
        }))
      );
      
      setUnreadCount(0);
      
      // KRİTİK: iOS Badge'i temizle (tümü okundu)
      badgeService.clearBadge().then(() => {
        console.log('✅ iOS Badge temizlendi (tümü okundu)');
      });
    } catch (error) {
      console.error('Tüm bildirimler okundu işaretleme hatası:', error);
    }
  };

  // İlk yükleme
  useEffect(() => {
    refreshNotifications();
  }, [userProfile?.companyId, userProfile?.id]);

  const value = {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    refreshNotifications
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}
