import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';
import { notificationService, type Notification } from '../services/notificationService';
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
        (userProfile.santraller as string[]) || []
      );
      const filtered = filterByRole(list).map(n => ({
        ...n,
        // Önce kullanıcı-bazlı okundu, yoksa legacy 'read' alanı
        read: (n.readBy || []).includes(userProfile.id) || (!n.readBy && (n as any).read === true)
      }));
      setNotifications(filtered);
      setUnreadCount(filtered.filter(n => !n.read).length);
    } catch (error) {
      console.error('Bildirimler yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  // Real-time bildirim dinleyicisi
  useEffect(() => {
    if (!userProfile?.companyId || !userProfile?.id) return;

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

        // Yeni gelenler için toast (ilk snapshot hariç)
        if (initializedRef.current) {
          const newlyAdded = filtered.filter(n => !seenIdsRef.current.has(n.id));
          newlyAdded.forEach(n => {
            const text = n.message ? `${n.title}: ${n.message}` : n.title;
            if (n.type === 'error') toast.error(text);
            else if (n.type === 'success') toast.success(text);
            else if (n.type === 'warning') toast(text, { icon: '⚠️' });
            else toast(text, { icon: 'ℹ️' });
          });
        } else {
          initializedRef.current = true;
        }

        // Görülen ID'leri güncelle
        seenIdsRef.current = new Set(filtered.map(n => n.id));

        setNotifications(filtered);
        setUnreadCount(filtered.filter(n => !n.read).length);
      }
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
      
      setUnreadCount(prev => Math.max(0, prev - 1));
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
