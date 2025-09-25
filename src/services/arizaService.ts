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
import { createNotification, createNotificationWithEmail } from './notificationService';
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
    
    // Bildirim oluştur - tüm arızalar için
    try {
      // Önceliğe göre bildirim tipi belirle
      const notificationType = faultData.oncelik === 'kritik' ? 'error' : 
                              faultData.oncelik === 'yuksek' ? 'warning' : 'info';
      
      // Genel bildirim oluştur (notifications koleksiyonuna)
      await createNotification({
        companyId: faultData.companyId,
        title: `Yeni Arıza: ${faultData.baslik}`,
        message: `${faultData.saha} sahasında ${faultData.santral || 'santral'} için yeni arıza bildirildi.`,
        type: notificationType,
        actionUrl: `/arizalar/${docRef.id}`,
        metadata: {
          faultId: docRef.id,
          santralId: faultData.santralId,
          sahaId: faultData.sahaId,
          oncelik: faultData.oncelik
        }
      });

      // Kritik ve yüksek öncelikli arızalar için email bildirimi
      if (faultData.oncelik === 'kritik' || faultData.oncelik === 'yuksek') {
        // Şirketteki tüm ilgili rolleri bul
        const usersSnapshot = await getDocs(
          query(
            collection(db, 'kullanicilar'),
            where('companyId', '==', faultData.companyId),
            where('rol', 'in', ['yonetici', 'muhendis', 'tekniker', 'bekci', 'musteri'])
          )
        );
        
        // Her kullanıcı için bildirim oluştur (saha kontrolü ile)
        for (const userDoc of usersSnapshot.docs) {
          const userData = userDoc.data();
          
          // Bekçi ve Müşteri rolleri için saha kontrolü
          if (userData.rol === 'bekci' || userData.rol === 'musteri') {
            const userSahalar = userData.sahalar || [];
            // Bu sahaya atanmamışsa bildirim gönderme
            if (!userSahalar.includes(faultData.sahaId)) {
              continue;
            }
          }
          
          // Kullanıcıya özel bildirim
          await createNotification({
            companyId: faultData.companyId,
            userId: userDoc.id,
            title: `🚨 ${faultData.oncelik === 'kritik' ? 'KRİTİK' : 'YÜKSEK'} - ${faultData.baslik}`,
            message: `${faultData.saha} sahasında acil müdahale gerektiren arıza!`,
            type: notificationType,
            actionUrl: `/arizalar/${docRef.id}`,
            metadata: {
              faultId: docRef.id,
              santralId: faultData.santralId,
              sahaId: faultData.sahaId,
              oncelik: faultData.oncelik
            }
          });

          // Email bildirimi (opsiyonel - email servisi aktifse)
          if (userData.email) {
            try {
              await createNotificationWithEmail({
                companyId: faultData.companyId,
                userId: userDoc.id,
                type: 'error',
                title: `🚨 Yeni Arıza - ${faultData.baslik}`,
                message: `${faultData.saha} sahasında yeni bir arıza bildirildi. Öncelik: ${faultData.oncelik}`,
                data: {
                  faultId: docRef.id,
                  santralId: faultData.santralId,
                  saha: faultData.saha
                },
              }, {
                recipients: [{
                  name: userData.ad || 'Yetkili',
                  email: userData.email
                }],
                type: 'fault_created',
                data: {
                  ...newFault,
                  id: docRef.id
                },
                priority: faultData.oncelik as any
              });
            } catch (emailError) {
              // Email hatası bildirimi engellemez
              console.error('Email gönderme hatası:', emailError);
            }
          }
        }
      } else {
        // Düşük ve orta öncelikli arızalar için bekçi ve müşterilere bildirim gönder
        const usersSnapshot = await getDocs(
          query(
            collection(db, 'kullanicilar'),
            where('companyId', '==', faultData.companyId),
            where('rol', 'in', ['bekci', 'musteri'])
          )
        );
        
        for (const userDoc of usersSnapshot.docs) {
          const userData = userDoc.data();
          const userSahalar = userData.sahalar || [];
          
          // Bu sahaya atanmışsa bildirim gönder
          if (userSahalar.includes(faultData.sahaId)) {
            await createNotification({
              companyId: faultData.companyId,
              userId: userDoc.id,
              title: `🔧 Yeni Arıza - ${faultData.baslik}`,
              message: `${faultData.saha} sahasında yeni arıza bildirimi`,
              type: 'info',
              actionUrl: `/arizalar/${docRef.id}`,
              metadata: {
                faultId: docRef.id,
                santralId: faultData.santralId,
                sahaId: faultData.sahaId,
                oncelik: faultData.oncelik
              }
            });
          }
        }
      }
    } catch (notificationError) {
      console.error('Bildirim oluşturma hatası:', notificationError);
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
      pageSize = 20,
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

      // Arıza çözüldü bildirimi
      await createNotification({
        companyId: faultData.companyId,
        title: `✅ Arıza Çözüldü: ${faultData.baslik}`,
        message: `${faultData.saha} sahasındaki arıza başarıyla çözüldü.`,
        type: 'success',
        actionUrl: `/arizalar/${faultId}`,
        metadata: {
          faultId: faultId,
          santralId: faultData.santralId,
          sahaId: faultData.sahaId
        }
      });
    } else if (durum === 'devam-ediyor') {
      // Arıza devam ediyor bildirimi
      await createNotification({
        companyId: faultData.companyId,
        title: `🔄 Arıza Güncellendi: ${faultData.baslik}`,
        message: `${faultData.saha} sahasındaki arıza üzerinde çalışılıyor.`,
        type: 'warning',
        actionUrl: `/arizalar/${faultId}`,
        metadata: {
          faultId: faultId,
          santralId: faultData.santralId,
          sahaId: faultData.sahaId
        }
      });
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
