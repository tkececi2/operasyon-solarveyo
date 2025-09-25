import { toast } from 'react-hot-toast';
import { Bell, AlertTriangle, Clock, CreditCard } from 'lucide-react';

export interface SubscriptionNotification {
  type: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  remainingDays: number;
  action?: () => void;
}

// Abonelik durumuna göre bildirim gönder
export const sendSubscriptionNotification = (remainingDays: number | null, navigate: (path: string) => void): void => {
  if (remainingDays === null) return; // Lifetime planlar için bildirim yok
  
  // 5 gün kala bilgilendirici bildirim (popup)
  if (remainingDays === 5) {
    toast.success(
      `Aboneliğinizin bitimine ${remainingDays} gün kaldı. Planları görüntülemek için tıklayın.`,
      {
        duration: 6000,
        icon: '⏰',
        style: {
          background: '#f3f4f6',
          color: '#374151',
          border: '1px solid #d1d5db'
        },
        onClick: () => navigate('/subscription')
      }
    );
  }
  
  // 1-4 gün için kritik bildirim
  else if (remainingDays > 0 && remainingDays < 5) {
    toast.error(
      `⚠️ Kritik: Aboneliğinizin bitimine ${remainingDays} gün kaldı! Hemen yenileyin.`,
      {
        duration: 8000,
        style: {
          background: '#fef2f2',
          color: '#dc2626',
          border: '1px solid #fecaca'
        },
        onClick: () => navigate('/subscription')
      }
    );
  }
  
  // Süresi dolmuş için acil bildirim
  else if (remainingDays <= 0) {
    toast.error(
      '🚨 Aboneliğinizin süresi dolmuş! Hizmetlere erişim kısıtlanmıştır.',
      {
        duration: 10000,
        style: {
          background: '#fef2f2',
          color: '#dc2626',
          border: '2px solid #dc2626',
          fontWeight: 'bold'
        },
        onClick: () => navigate('/subscription')
      }
    );
  }
};

// Dashboard yüklendiğinde otomatik bildirim kontrolü
export const checkSubscriptionStatus = (
  remainingDays: number | null, 
  navigate: (path: string) => void,
  lastNotificationDate?: Date
): void => {
  if (remainingDays === null) return;
  
  const today = new Date().toDateString();
  const lastNotified = lastNotificationDate?.toDateString();
  
  // Günde sadece bir kez bildirim gönder
  if (lastNotified === today) return;
  
  // Bildirim gönder
  sendSubscriptionNotification(remainingDays, navigate);
  
  // Son bildirim tarihini localStorage'a kaydet
  localStorage.setItem('lastSubscriptionNotification', today);
};

// Bildirim geçmişini temizle
export const clearNotificationHistory = (): void => {
  localStorage.removeItem('lastSubscriptionNotification');
};

// Son bildirim tarihini al
export const getLastNotificationDate = (): Date | null => {
  const lastNotified = localStorage.getItem('lastSubscriptionNotification');
  return lastNotified ? new Date(lastNotified) : null;
};



