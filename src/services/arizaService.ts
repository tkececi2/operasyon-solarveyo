import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc,
  query, 
  where, 
  orderBy, 
  limit as firestoreLimit,
  startAfter,
  Timestamp,
  DocumentSnapshot,
  QueryConstraint
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { notificationService } from './notificationService';
import { sendFaultNotification } from './oneSignalService';
import type { Fault, FaultStatus, Priority } from '../types';
import { uploadArizaPhotos, deleteMultipleFiles } from './storageService';
import { trackEvent } from '../lib/posthog-events';

// Arıza oluşturma
export const createFault = async (
  faultData: Omit<Fault, 'id' | 'olusturmaTarihi' | 'guncellenmeTarihi' | 'cozumTarihi'>,
  photos?: File[],
  options?: { createdAt?: Date; resolvedAt?: Date; durum?: FaultStatus }
): Promise<string> => {
  try {
    const now = options?.createdAt ? Timestamp.fromDate(options.createdAt) : Timestamp.now();
    const newFault = {
      ...faultData,
      durum: options?.durum || (options?.resolvedAt ? ('cozuldu' as FaultStatus) : ('acik' as FaultStatus)),
      olusturmaTarihi: now,
      guncellenmeTarihi: now,
      ...(options?.resolvedAt ? { cozumTarihi: Timestamp.fromDate(options.resolvedAt) } : {})
    };

    const docRef = await addDoc(collection(db, 'arizalar'), newFault);
    
    // PostHog event
    trackEvent.arizaCreated({
      oncelik: faultData.oncelik,
      santralId: faultData.santralId
    });
    
    // Bildirim oluştur - Kullanıcı-bazlı hedefli (Scoped Notification)
    try {
      // Önceliğe göre bildirim tipi ve mesaj belirle
      const notificationType = faultData.oncelik === 'kritik' ? 'error' : 
                              faultData.oncelik === 'yuksek' ? 'warning' : 'info';
      
      const titlePrefix = faultData.oncelik === 'kritik' ? '🚨 KRİTİK ARIZA' : 
                         faultData.oncelik === 'yuksek' ? '⚠️ YÜKSEK ÖNCELİKLİ ARIZA' : 
                         '🔧 Yeni Arıza';
      
      // Debug log ekle
      console.log(`📊 Arıza Bildirimi Debug:`, {
        companyId: faultData.companyId,
        sahaId: faultData.sahaId || 'YOK',
        santralId: faultData.santralId || 'YOK',
        baslik: faultData.baslik,
        oncelik: faultData.oncelik
      });

      // OneSignal ile basit ve güvenilir bildirim gönder
      const pushSuccess = await sendFaultNotification(
        faultData.companyId,
        faultData.baslik,
        `${faultData.saha} sahasında ${faultData.santral || 'santral'} için ${faultData.oncelik} öncelikli arıza bildirildi.`,
        faultData.oncelik as 'kritik' | 'yuksek' | 'normal',
        faultData.sahaId
      );
      
      if (pushSuccess) {
        console.log(`✅ OneSignal arıza bildirimi gönderildi: ${faultData.baslik}`);
      } else {
        console.error(`❌ OneSignal arıza bildirimi başarısız: ${faultData.baslik}`);
      }

      // Firebase notifications koleksiyonuna da kaydet (web içi bildirimler için)
      await notificationService.createScopedNotificationClient({
        companyId: faultData.companyId,
        title: `${titlePrefix} - ${faultData.baslik}`,
        message: `${faultData.saha} sahasında ${faultData.santral || 'santral'} için ${faultData.oncelik} öncelikli arıza bildirildi.`,
        type: notificationType,
        actionUrl: `/arizalar/${docRef.id}`,
        metadata: {
          faultId: docRef.id,
          santralId: faultData.santralId,
          sahaId: faultData.sahaId || null,
          oncelik: faultData.oncelik,
          screen: '/arizalar'
        },
        roles: ['yonetici', 'muhendis', 'tekniker', 'bekci', 'musteri']
      });
      
      console.log(`✅ Arıza bildirimi sistemi tamamlandı: ${faultData.baslik} (${faultData.oncelik})`);
    } catch (notificationError) {
      console.error('❌ Bildirim oluşturma hatası:', notificationError);
      // OneSignal çok güvenilir, bu catch bloğa nadiren girer
      // Bildirim hatası arıza oluşturmayı engellemez
    }
    
    // Fotoğraflar varsa yükle
    if (photos && photos.length > 0) {
      const photoUrls = await uploadArizaPhotos(
        photos, 
        docRef.id, 
        faultData.companyId
      );
      
      // Fotoğraf URL'lerini güncelle
      await updateDoc(docRef, {
        fotograflar: photoUrls,
        guncellenmeTarihi: Timestamp.now()
      });
    }

    // Email bildirimi gönder
    try {
      // Notification preferences'ı localStorage'dan al
      const preferences = localStorage.getItem('notificationPreferences');
      if (preferences) {
        const prefs = JSON.parse(preferences);
        
        if (prefs.email?.enabled && prefs.email?.faultCreated) {
          await createNotificationWithEmail(
            {
              companyId: faultData.companyId,
              title: `Yeni Arıza: ${faultData.baslik}`,
              message: `${faultData.saha} sahasında yeni arıza bildirimi oluşturuldu.`,
              type: faultData.oncelik === 'kritik' ? 'error' : 'warning',
              actionUrl: `/arizalar/${docRef.id}`,
              metadata: { faultId: docRef.id, priority: faultData.oncelik }
            },
            {
              recipients: [{ name: prefs.email.address.split('@')[0], email: prefs.email.address }],
              type: 'fault_created',
              data: { ...faultData, id: docRef.id },
              priority: faultData.oncelik === 'kritik' ? 'critical' : 
                       faultData.oncelik === 'yuksek' ? 'high' : 'normal'
            }
          );
        }
      }
    } catch (emailError) {
      console.error('Email bildirimi gönderilemedi:', emailError);
      // Email hatası arıza oluşturmayı engellemez
    }

    return docRef.id;
  } catch (error) {
    console.error('Arıza oluşturma hatası:', error);
    throw error;
  }
};

// Arıza güncelleme
export const updateFault = async (
  faultId: string,
  updates: Partial<Fault>,
  newPhotos?: File[]
): Promise<void> => {
  try {
    const faultRef = doc(db, 'arizalar', faultId);
    
    // Yeni fotoğraflar varsa yükle
    if (newPhotos && newPhotos.length > 0) {
      const faultDoc = await getDoc(faultRef);
      if (faultDoc.exists()) {
        const faultData = faultDoc.data() as Fault;
        const newPhotoUrls = await uploadArizaPhotos(
          newPhotos,
          faultId,
          faultData.companyId
        );
        
        updates.fotograflar = [
          ...(faultData.fotograflar || []),
          ...newPhotoUrls
        ];
      }
    }

    await updateDoc(faultRef, {
      ...updates,
      guncellenmeTarihi: Timestamp.now()
    });
  } catch (error) {
    console.error('Arıza güncelleme hatası:', error);
    throw error;
  }
};

// Arıza silme
export const deleteFault = async (faultId: string): Promise<void> => {
  try {
    const faultRef = doc(db, 'arizalar', faultId);
    const faultDoc = await getDoc(faultRef);
    
    if (faultDoc.exists()) {
      const faultData = faultDoc.data() as Fault;
      
      // Fotoğrafları sil
      if (faultData.fotograflar && faultData.fotograflar.length > 0) {
        await deleteMultipleFiles(faultData.fotograflar, faultData.companyId);
      }
      
      // Çözüm fotoğraflarını sil
      if (faultData.cozumFotograflari && faultData.cozumFotograflari.length > 0) {
        await deleteMultipleFiles(faultData.cozumFotograflari, faultData.companyId);
      }
    }
    
    await deleteDoc(faultRef);
  } catch (error) {
    console.error('Arıza silme hatası:', error);
    throw error;
  }
};

// Tek arıza getirme
export const getFault = async (faultId: string): Promise<Fault | null> => {
  try {
    const faultDoc = await getDoc(doc(db, 'arizalar', faultId));
    
    if (faultDoc.exists()) {
      return { id: faultDoc.id, ...faultDoc.data() } as Fault;
    }
    
    return null;
  } catch (error) {
    console.error('Arıza getirme hatası:', error);
    throw error;
  }
};

// Arıza listesi getirme (sayfalama ile)
export interface GetFaultsOptions {
  companyId: string;
  durum?: FaultStatus;
  oncelik?: Priority;
  santralId?: string;
  raporlayanId?: string;
  pageSize?: number;
  lastDoc?: DocumentSnapshot;
  searchTerm?: string;
  userRole?: string;
  userSahalar?: string[];
  userSantraller?: string[];
  userId?: string;
}

export const getFaults = async (options: GetFaultsOptions) => {
  try {
    const {
      companyId,
      durum,
      oncelik,
      santralId,
      raporlayanId,
      pageSize = 10, // Sayfa başına 10 kayıt göster
      lastDoc,
      searchTerm,
      userRole,
      userSahalar,
      userSantraller,
      userId
    } = options;

    const constraints: QueryConstraint[] = [
      where('companyId', '==', companyId),
      orderBy('olusturmaTarihi', 'desc')
    ];

    // Filtreler
    if (durum) {
      constraints.splice(-1, 0, where('durum', '==', durum));
    }
    if (oncelik) {
      constraints.splice(-1, 0, where('oncelik', '==', oncelik));
    }
    if (santralId) {
      constraints.splice(-1, 0, where('santralId', '==', santralId));
    }
    if (raporlayanId) {
      constraints.splice(-1, 0, where('raporlayanId', '==', raporlayanId));
    }

    // Sayfalama
    constraints.push(firestoreLimit(pageSize));
    if (lastDoc) {
      constraints.push(startAfter(lastDoc));
    }

    const q = query(collection(db, 'arizalar'), ...constraints);
    const querySnapshot = await getDocs(q);

    let faults = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Fault[];

    // Arama terimi varsa client-side filtreleme
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      faults = faults.filter(fault => 
        fault.baslik.toLowerCase().includes(term) ||
        fault.aciklama.toLowerCase().includes(term) ||
        fault.saha.toLowerCase().includes(term)
      );
    }

    // Rol bazlı görünürlük: musteri/tekniker/muhendis/bekci -> atanan saha/santral
    if (userRole === 'musteri' || userRole === 'tekniker' || userRole === 'muhendis' || userRole === 'bekci') {
      const allowedSahalar = Array.isArray(userSahalar) ? userSahalar : [];
      const allowedSantraller = Array.isArray(userSantraller) ? userSantraller : [];
      faults = faults.filter(f => {
        const sahaMatch = f.sahaId ? allowedSahalar.includes(f.sahaId as any) : false;
        const santralMatch = f.santralId ? allowedSantraller.includes(f.santralId) : false;
        return sahaMatch || santralMatch;
      });
    }

    return {
      faults,
      lastDoc: querySnapshot.docs[querySnapshot.docs.length - 1] || null,
      hasMore: querySnapshot.docs.length === pageSize
    };
  } catch (error) {
    console.error('Arıza listesi getirme hatası:', error);
    throw error;
  }
};

// Arıza durumu güncelleme
export const updateFaultStatus = async (
  faultId: string,
  durum: FaultStatus,
  cozumAciklamasi?: string,
  cozumFotograflari?: File[],
  resolvedAt?: Date
): Promise<void> => {
  try {
    const updates: Partial<Fault> = {
      durum,
      guncellenmeTarihi: Timestamp.now()
    };

    // Arıza bilgilerini al
    const faultDoc = await getDoc(doc(db, 'arizalar', faultId));
    if (!faultDoc.exists()) {
      throw new Error('Arıza bulunamadı');
    }
    const faultData = faultDoc.data() as Fault;

    if (durum === 'cozuldu') {
      updates.cozumTarihi = resolvedAt ? Timestamp.fromDate(resolvedAt) : Timestamp.now();
      if (cozumAciklamasi) {
        updates.cozumAciklamasi = cozumAciklamasi;
      }
      
      // PostHog event - arıza çözüldü
      const duration = faultData.olusturmaTarihi ? 
        (Date.now() - faultData.olusturmaTarihi.toDate().getTime()) / (1000 * 60 * 60) : 0; // saat cinsinden
      trackEvent.arizaResolved(duration);

      // Arıza çözüldü bildirimi (kullanıcı-bazlı hedefli)
      try {
        await notificationService.createScopedNotificationClient({
          companyId: faultData.companyId,
          title: `✅ Arıza Çözüldü - ${faultData.baslik}`,
          message: `${faultData.saha} sahasında ${faultData.santral || 'santral'} arızası başarıyla çözüldü.`,
          type: 'success',
          actionUrl: `/arizalar/${faultId}`,
          metadata: {
            faultId: faultId,
            santralId: faultData.santralId,
            sahaId: faultData.sahaId,
            durum: 'cozuldu',
            screen: '/arizalar'
          },
          roles: ['yonetici', 'muhendis', 'tekniker', 'bekci', 'musteri']
        });
        console.log(`✅ Arıza çözüldü bildirimi gönderildi: ${faultData.baslik}`);
      } catch (err) {
        console.error('❌ Arıza çözüldü bildirimi hatası:', err);
      }
    } else if (durum === 'devam-ediyor') {
      // Arıza devam ediyor bildirimi (kullanıcı-bazlı hedefli)
      try {
        await notificationService.createScopedNotificationClient({
          companyId: faultData.companyId,
          title: `🔄 Arıza Güncellendi - ${faultData.baslik}`,
          message: `${faultData.saha} sahasında ${faultData.santral || 'santral'} arızası üzerinde çalışılıyor.`,
          type: 'warning',
          actionUrl: `/arizalar/${faultId}`,
          metadata: {
            faultId: faultId,
            santralId: faultData.santralId,
            sahaId: faultData.sahaId,
            durum: 'devam-ediyor',
            screen: '/arizalar'
          },
          roles: ['yonetici', 'muhendis', 'tekniker', 'bekci', 'musteri']
        });
        console.log(`🔄 Arıza güncelleme bildirimi gönderildi: ${faultData.baslik}`);
      } catch (err) {
        console.error('❌ Arıza güncelleme bildirimi hatası:', err);
      }
    }

    // Çözüm fotoğrafları varsa yükle
    if (cozumFotograflari && cozumFotograflari.length > 0) {
      const faultDoc = await getDoc(doc(db, 'arizalar', faultId));
      if (faultDoc.exists()) {
        const faultData = faultDoc.data() as Fault;
        const photoUrls = await uploadArizaPhotos(
          cozumFotograflari,
          `${faultId}_cozum`,
          faultData.companyId
        );
        updates.cozumFotograflari = photoUrls;
      }
    }

    await updateFault(faultId, updates);
  } catch (error) {
    console.error('Arıza durumu güncelleme hatası:', error);
    throw error;
  }
};

// Şirkete göre arıza istatistikleri
export const getFaultStatistics = async (companyId: string) => {
  try {
    const q = query(
      collection(db, 'arizalar'),
      where('companyId', '==', companyId)
    );
    
    const querySnapshot = await getDocs(q);
    const faults = querySnapshot.docs.map(doc => doc.data()) as Fault[];

    const stats = {
      toplam: faults.length,
      acik: faults.filter(f => f.durum === 'acik').length,
      devamEdiyor: faults.filter(f => f.durum === 'devam-ediyor').length,
      beklemede: faults.filter(f => f.durum === 'beklemede').length,
      cozuldu: faults.filter(f => f.durum === 'cozuldu').length,
      kritik: faults.filter(f => f.oncelik === 'kritik' && f.durum !== 'cozuldu').length,
      yuksek: faults.filter(f => f.oncelik === 'yuksek' && f.durum !== 'cozuldu').length,
    };

    return stats;
  } catch (error) {
    console.error('Arıza istatistikleri getirme hatası:', error);
    throw error;
  }
};

// Kullanıcıya göre arızalar
export const getUserFaults = async (
  companyId: string,
  userId: string,
  role: string,
  userSahalar?: string[],
  userSantraller?: string[]
) => {
  try {
    // İlk olarak tüm arızaları getir
    const q = query(
      collection(db, 'arizalar'),
      where('companyId', '==', companyId),
      orderBy('olusturmaTarihi', 'desc')
    );

    const querySnapshot = await getDocs(q);
    let arizalar = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Fault[];

    // Rol bazlı filtreleme
    if (role === 'musteri') {
      // Müşteri sadece atanan saha/santrallarındaki arızaları görebilir
      arizalar = arizalar.filter(ariza => {
        const sahaMatch = userSahalar && userSahalar.includes(ariza.sahaId);
        const santralMatch = userSantraller && ariza.santralId && userSantraller.includes(ariza.santralId);
        return sahaMatch || santralMatch;
      });
    } else if (role === 'tekniker' || role === 'bekci') {
      // Tekniker ve bekçi sadece kendi raporladığı arızaları görebilir
      arizalar = arizalar.filter(ariza => ariza.raporlayanId === userId);
    }

    return arizalar;
  } catch (error) {
    console.error('Kullanıcı arızaları getirme hatası:', error);
    throw error;
  }
};

// Santral bazlı arızalar
export const getSantralFaults = async (
  companyId: string,
  santralId: string,
  limit?: number
) => {
  try {
    const constraints: QueryConstraint[] = [
      where('companyId', '==', companyId),
      where('santralId', '==', santralId),
      orderBy('olusturmaTarihi', 'desc')
    ];

    if (limit) {
      constraints.push(firestoreLimit(limit));
    }

    const q = query(collection(db, 'arizalar'), ...constraints);
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Fault[];
  } catch (error) {
    console.error('Santral arızaları getirme hatası:', error);
    throw error;
  }
};

// Arıza servisi objesi
export const arizaService = {
  createFault,
  getFaults,
  getFault,
  updateFault,
  deleteFault,
  getSantralFaults,
  updateFaultStatus,
  getUserFaults,
  getFaultStatistics
};
