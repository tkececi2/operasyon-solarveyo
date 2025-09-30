import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit as firestoreLimit,
  Timestamp,
  onSnapshot,
  arrayUnion
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../lib/firebase';
import { emailService, EmailNotificationData } from './emailService';
// Email servisi devre dışı - resendService kaldırıldı
import { analyticsService } from './analyticsService';

export interface Notification {
  id: string;
  companyId: string;
  userId?: string; // Eğer belirli bir kullanıcıya özelses
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  readBy?: string[]; // Okuyan kullanıcıların listesi
  actionUrl?: string; // Tıklanınca gidilecek URL
  metadata?: Record<string, any>; // Ek bilgiler (sahaId, santralId vb.)
  createdAt: Timestamp;
  expiresAt?: Timestamp;
}

// Bildirim oluştur
// Yardımcı: undefined alanları derin temizle
const removeUndefinedDeep = (value: any): any => {
  if (Array.isArray(value)) return value.map(removeUndefinedDeep);
  if (value && typeof value === 'object') {
    const out: Record<string, any> = {};
    Object.entries(value).forEach(([k, v]) => {
      if (v !== undefined) out[k] = removeUndefinedDeep(v);
    });
    return out;
  }
  return value;
};

export const createNotification = async (
  notification: Omit<Notification, 'id' | 'createdAt' | 'read'>
): Promise<string> => {
  try {
    const now = Timestamp.now();
    const base: any = {
      ...notification,
      // Yeni okundu modeli: kullanıcı bazlı okundu listesi
      readBy: [],
      // Geriye dönük uyumluluk için read alanını false bırakıyoruz (okuma tarafında readBy öncelikli)
      read: false,
      createdAt: now,
    };
    if (notification.metadata) {
      base.metadata = removeUndefinedDeep(notification.metadata);
    }

    const docRef = await addDoc(collection(db, 'notifications'), base);

    return docRef.id;
  } catch (error) {
    console.error('Bildirim oluşturma hatası:', error);
    throw error;
  }
};

// Sunucu tarafı hedeflemeli bildirim oluşturma (kullanıcıya özel dokümanlar)
export const createScopedNotificationClient = async (params: {
  companyId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  actionUrl?: string;
  metadata?: Record<string, any>;
  roles?: string[];
  expiresAt?: string; // ISO
}) => {
  const fn = httpsCallable(functions, 'createScopedNotification');
  const res: any = await fn(params);
  return res?.data || res;
};

// Email ile bildirim oluştur
export const createNotificationWithEmail = async (
  notification: Omit<Notification, 'id' | 'createdAt' | 'read'>,
  emailData?: {
    recipients: { name: string; email: string }[];
    type: EmailNotificationData['type'];
    data: any;
    priority?: EmailNotificationData['priority'];
  }
): Promise<string> => {
  try {
    // Normal bildirim oluştur
    const notificationId = await createNotification(notification);

    // Email gönder (SendGrid kullan)
    if (emailData && emailData.recipients.length > 0) {
      const emailNotifications = emailData.recipients.map(recipient => ({
        type: emailData.type,
        recipient,
        subject: notification.title,
        data: emailData.data,
        priority: emailData.priority || 'normal'
      }));

      // Resend ile email gönderimi (async - beklemeden)
      // Email gönderimi devre dışı
      Promise.resolve()
        .then(results => {
          const success = results.filter(r => r).length;
          const failed = results.length - success;
          console.log(`📧 Email gönderim sonucu: ${success} başarılı, ${failed} başarısız`);
          
          // Analytics - Email gönderim takibi
          analyticsService.track('notification_sent', {
            type: 'email',
            notification_type: emailData.type,
            recipient_count: emailData.recipients.length,
            success_count: success,
            failed_count: failed
          });
        })
        .catch(error => {
          console.error('📧 Email gönderim hatası:', error);
          analyticsService.trackError(error, { context: 'email_notification' });
        });
    }

    return notificationId;
  } catch (error) {
    console.error('Email ile bildirim oluşturma hatası:', error);
    throw error;
  }
};

// Kullanıcının bildirimlerini getir
export const getUserNotifications = async (
  companyId: string,
  userId?: string,
  limit: number = 50
): Promise<Notification[]> => {
  try {
    // Firestore 'in' + null kombinasyonu desteklenmediği için tek query ve client-side filtre uyguluyoruz
    const q = query(
      collection(db, 'notifications'),
      where('companyId', '==', companyId),
      orderBy('createdAt', 'desc'),
      firestoreLimit(limit)
    );

    const querySnapshot = await getDocs(q);
    let items = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
    
    // Kullanıcıya özel bildirimleri filtrele
    if (userId) {
      items = items.filter(n => {
        // Kullanıcı tarafından gizlenmiş bildirimleri gösterme
        const hiddenBy = n.hiddenBy || [];
        if (hiddenBy.includes(userId)) return false;
        
        // Kullanıcıya özel bildirimleri göster
        return !('userId' in n) || n.userId === userId;
      });
    }
    
    return items as Notification[];
  } catch (error) {
    console.error('Bildirimler getirme hatası:', error);
    throw error;
  }
};

// Kullanıcının atanmış saha/santrallerine göre bildirimleri getir (scoped)
export const getScopedUserNotifications = async (
  companyId: string,
  userId: string,
  userSahalar: string[] = [],
  userSantraller: string[] = [],
  limit: number = 50,
  role?: string
): Promise<Notification[]> => {
  try {
    const q = query(
      collection(db, 'notifications'),
      where('companyId', '==', companyId),
      orderBy('createdAt', 'desc'),
      firestoreLimit(limit)
    );

    const snapshot = await getDocs(q);
    let items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
    
    console.log('🔍 Ham bildirimler:', {
      toplam: items.length,
      ilk3: items.slice(0, 3).map(n => ({
        id: n.id,
        userId: n.userId,
        title: n.title
      }))
    });

    // Kullanıcıya özel ve gizlenenleri ayıkla
    const beforeFilter = items.length;
    items = items.filter(n => {
      const hiddenBy = n.hiddenBy || [];
      if (hiddenBy.includes(userId)) return false;
      const userMatch = !('userId' in n) || n.userId === userId;
      if (!userMatch && n.userId) {
        console.log(`❌ Bildirim filtrelendi - userId eşleşmedi: ${n.userId} !== ${userId}`);
      }
      return userMatch;
    });
    
    console.log(`🔍 userId filtresi sonrası: ${beforeFilter} -> ${items.length}`);

    // Saha/santral izolasyonu (yalnızca musteri ve bekci için uygula)
    const shouldApplyScope = role === 'musteri' || role === 'bekci';
    if (shouldApplyScope) {
      items = items.filter(n => {
        const md = (n.metadata || {}) as Record<string, any>;
        const sahaOk = md.sahaId ? userSahalar.includes(md.sahaId) : true;
        const santralOk = md.santralId ? userSantraller.includes(md.santralId) : true;
        return sahaOk && santralOk;
      });
    }

    return items as Notification[];
  } catch (error) {
    console.error('Scoped bildirimler getirme hatası:', error);
    throw error;
  }
};

// Bildirimi okundu olarak işaretle
export const markNotificationAsRead = async (notificationId: string, userId: string): Promise<void> => {
  try {
    const notificationRef = doc(db, 'notifications', notificationId);
    await updateDoc(notificationRef, {
      // Kullanıcı-bazlı okundu listesi; global read alanını değiştirmiyoruz
      readBy: arrayUnion(userId),
      readAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Bildirim okundu işaretleme hatası:', error);
    throw error;
  }
};

// Tüm bildirimleri okundu olarak işaretle
export const markAllNotificationsAsRead = async (
  companyId: string,
  userId?: string
): Promise<void> => {
  try {
    const notifications = await getUserNotifications(companyId, userId);
    // Kullanıcı-bazlı okunmamışları seç (readBy kullanılmalı; global 'read' alanı tüm kullanıcılar için değildir)
    const unreadNotifications = notifications.filter(n => !(n.readBy || []).includes(userId || ''));
    
    const updatePromises = unreadNotifications.map(notification => {
      if (!userId) return Promise.resolve();
      return markNotificationAsRead(notification.id, userId);
    });
    
    await Promise.all(updatePromises);
  } catch (error) {
    console.error('Tüm bildirimler okundu işaretleme hatası:', error);
    throw error;
  }
};

// Okunmamış bildirim sayısını getir
export const getUnreadNotificationCount = async (
  companyId: string,
  userId?: string
): Promise<number> => {
  try {
    // getUserNotifications zaten gizli bildirimleri filtreliyor
    const notifications = await getUserNotifications(companyId, userId, 100);
    if (!userId) return notifications.length; // kullanıcı yoksa ham liste
    return notifications.filter(n => !((n.readBy || []).includes(userId) || (!n.readBy && n.read === true))).length;
  } catch (error) {
    console.error('Okunmamış bildirim sayısı getirme hatası:', error);
    return 0;
  }
};

// Bildirimi gizle - Her kullanıcı sadece kendisi için gizler
export const deleteNotification = async (
  notificationId: string,
  userId: string
): Promise<void> => {
  try {
    // Bildirimi silmek yerine, kullanıcıyı "hiddenBy" listesine ekle
    const notificationRef = doc(db, 'notifications', notificationId);
    await updateDoc(notificationRef, {
      hiddenBy: arrayUnion(userId),
      [`hiddenAt_${userId}`]: Timestamp.now()
    });
    
    console.log(`Bildirim gizlendi: ${notificationId} - Kullanıcı: ${userId}`);
  } catch (error) {
    console.error('Bildirim gizleme hatası:', error);
    throw error;
  }
};

// Real-time bildirim dinleyicisi
export const subscribeToNotifications = (
  companyId: string,
  userId: string | undefined,
  callback: (notifications: Notification[]) => void
) => {
  const q = query(
    collection(db, 'notifications'),
    where('companyId', '==', companyId),
    orderBy('createdAt', 'desc'),
    firestoreLimit(20)
  );

  return onSnapshot(q, (querySnapshot) => {
    let notifications = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
    
    // Kullanıcıya özel filtreleme
    if (userId) {
      notifications = notifications.filter(n => {
        // Kullanıcı tarafından gizlenmiş bildirimleri gösterme
        const hiddenBy = n.hiddenBy || [];
        if (hiddenBy.includes(userId)) return false;
        
        // Kullanıcıya özel bildirimleri göster
        return !('userId' in n) || n.userId === userId;
      });
    }
    
    callback(notifications as Notification[]);
  });
};

// Kullanıcının atanmış saha/santrallerine göre real-time abonelik (scoped)
export const subscribeToScopedNotifications = (
  companyId: string,
  userId: string,
  userSahalar: string[] = [],
  userSantraller: string[] = [],
  callback: (notifications: Notification[]) => void,
  role?: string
) => {
  const q = query(
    collection(db, 'notifications'),
    where('companyId', '==', companyId),
    orderBy('createdAt', 'desc'),
    firestoreLimit(20)
  );

  return onSnapshot(q, (querySnapshot) => {
    let notifications = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
    // Kullanıcıya özel/gizli filtreleri uygula
    notifications = notifications.filter(n => {
      const hiddenBy = n.hiddenBy || [];
      if (hiddenBy.includes(userId)) return false;
      return !('userId' in n) || n.userId === userId;
    });
    // Saha/santral izolasyonu (yalnızca musteri ve bekci için uygula)
    const shouldApplyScope = role === 'musteri' || role === 'bekci';
    if (shouldApplyScope) {
      notifications = notifications.filter(n => {
        const md = (n.metadata || {}) as Record<string, any>;
        const sahaOk = md.sahaId ? userSahalar.includes(md.sahaId) : true;
        const santralOk = md.santralId ? userSantraller.includes(md.santralId) : true;
        return sahaOk && santralOk;
      });
    }
    callback(notifications as Notification[]);
  });
};

// Otomatik bildirim oluşturucuları
export const createFaultNotification = async (
  companyId: string,
  faultTitle: string,
  priority: 'dusuk' | 'normal' | 'yuksek' | 'kritik',
  faultId: string,
  sahaId?: string,
  santralId?: string
) => {
  const priorityMessages = {
    'kritik': 'Kritik arıza! Acil müdahale gerekli.',
    'yuksek': 'Yüksek öncelikli arıza bildirimi.',
    'normal': 'Yeni arıza bildirimi.',
    'dusuk': 'Düşük öncelikli arıza bildirimi.'
  };

  await createNotification({
    companyId,
    title: `Yeni Arıza: ${faultTitle}`,
    message: priorityMessages[priority],
    type: priority === 'kritik' ? 'error' : priority === 'yuksek' ? 'warning' : 'info',
    actionUrl: `/arizalar`,
    metadata: { faultId, priority, sahaId, santralId }
  });
};

export const createMaintenanceNotification = async (
  companyId: string,
  maintenanceType: 'elektrik' | 'mekanik',
  santralId: string,
  maintenanceId: string
) => {
  await createNotification({
    companyId,
    title: `${maintenanceType === 'elektrik' ? 'Elektrik' : 'Mekanik'} Bakım Tamamlandı`,
    message: `Santral ${santralId} için bakım işlemi başarıyla tamamlandı.`,
    type: 'success',
    actionUrl: maintenanceType === 'elektrik' ? '/bakim/elektrik' : '/bakim/mekanik',
    metadata: { maintenanceId, maintenanceType, santralId }
  });
};

export const createLowStockNotification = async (
  companyId: string,
  itemName: string,
  currentStock: number,
  minimumStock: number,
  sahaId?: string,
  santralId?: string
) => {
  await createNotification({
    companyId,
    title: 'Düşük Stok Uyarısı',
    message: `${itemName} stoku kritik seviyede (${currentStock}/${minimumStock})`,
    type: 'warning',
    actionUrl: '/stok',
    metadata: { itemName, currentStock, minimumStock, sahaId, santralId }
  });
};

export const createPowerOutageNotification = async (
  companyId: string,
  sahaId: string,
  santralId: string | undefined,
  outageId: string,
  reason?: string
) => {
  await createNotification({
    companyId,
    title: 'Elektrik Kesintisi',
    message: reason ? `Neden: ${reason}` : 'Elektrik kesintisi bildirildi.',
    type: 'error',
    actionUrl: '/arizalar/elektrik-kesintileri',
    metadata: { outageId, sahaId, santralId }
  });
};

export const createStockMovementNotification = async (
  companyId: string,
  stokId: string,
  hareketTipi: string,
  yeniMiktar: number,
  sahaId?: string,
  santralId?: string
) => {
  await createNotification({
    companyId,
    title: 'Stok Hareketi',
    message: `${hareketTipi.toUpperCase()} – Yeni miktar: ${yeniMiktar}`,
    type: 'info',
    actionUrl: '/stok',
    metadata: { stokId, hareketTipi, yeniMiktar, sahaId, santralId }
  });
};

export const notificationService = {
  createNotification,
  getUserNotifications,
  getScopedUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getUnreadNotificationCount,
  deleteNotification,
  subscribeToNotifications,
  subscribeToScopedNotifications,
  createFaultNotification,
  createMaintenanceNotification,
  createLowStockNotification,
  createPowerOutageNotification,
  createStockMovementNotification,
  createScopedNotificationClient
};
