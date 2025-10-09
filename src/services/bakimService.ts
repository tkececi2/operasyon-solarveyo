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
  Timestamp,
  QueryConstraint
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { ElectricalMaintenance, MechanicalMaintenance, GeneralStatus } from '../types';
import { uploadBakimPhotos, deleteMultipleFiles } from './storageService';
import { notificationService } from './notificationService';

// Elektrik Bakım Oluşturma
export const createElectricalMaintenance = async (
  maintenanceData: Omit<ElectricalMaintenance, 'id' | 'olusturmaTarihi'>,
  photos?: File[]
): Promise<string> => {
  try {
    const now = Timestamp.now();
    const newMaintenance = {
      ...maintenanceData,
      olusturmaTarihi: now,
    };

    const docRef = await addDoc(collection(db, 'elektrikBakimlar'), newMaintenance);
    
    // Fotoğraflar varsa yükle
    if (photos && photos.length > 0) {
      const photoUrls = await uploadBakimPhotos(
        photos, 
        docRef.id, 
        maintenanceData.companyId,
        'elektrik'
      );
      
      // Fotoğraf URL'lerini güncelle
      await updateDoc(docRef, {
        fotograflar: photoUrls
      });
    }

    // Bildirim (role/segment hedeflemeli)
    try {
      // SahaId'yi kontrol et - yoksa santral'dan al
      let bildirimSahaId = maintenanceData.sahaId;
      let santralAdi = '';
      
      if (maintenanceData.santralId) {
        const santralDoc = await getDoc(doc(db, 'santraller', maintenanceData.santralId));
        if (santralDoc.exists()) {
          const santralData = santralDoc.data();
          santralAdi = santralData.name || santralData.adi || maintenanceData.santralId;
          
          // sahaId yoksa santral'dan al
          if (!bildirimSahaId || bildirimSahaId === '') {
            bildirimSahaId = santralData.sahaId;
            console.log(`🔍 SahaId santral'dan alındı: ${bildirimSahaId}`);
          }
        }
      }
      
      console.log(`📊 Elektrik Bakım Bildirimi Debug:`, {
        sahaId: bildirimSahaId || 'YOK',
        santralId: maintenanceData.santralId || 'YOK',
        santralAdi: santralAdi || 'YOK',
        companyId: maintenanceData.companyId
      });
      
      // metadata oluştur
      const metadata: any = { 
        maintenanceId: docRef.id, 
        maintenanceType: 'elektrik'
      };
      
      // SahaId'yi kullan - sadece o sahaya atanan kişilere gitsin
      if (bildirimSahaId) {
        metadata.sahaId = bildirimSahaId;
      }
      if (maintenanceData.santralId) {
        metadata.santralId = maintenanceData.santralId;
      }
      
      await notificationService.createScopedNotificationClient({
        companyId: maintenanceData.companyId,
        title: '⚡ Elektrik Bakım Tamamlandı',
        message: `${santralAdi || 'Santral'} için elektrik bakım işlemi tamamlandı.`,
        type: 'success',
        actionUrl: '/bakim/elektrik',
        metadata: metadata,
        roles: ['yonetici','muhendis','tekniker','bekci','musteri']
      });
      console.log(`✅ Elektrik bakım bildirimi gönderildi - sahaId: ${bildirimSahaId || 'YOK'}, santralId: ${maintenanceData.santralId || 'YOK'}`);
    } catch (e) { 
      console.error('❌ Elektrik bakım bildirimi hatası:', e);
    }
    return docRef.id;
  } catch (error) {
    console.error('Elektrik bakım oluşturma hatası:', error);
    throw error;
  }
};

// Mekanik Bakım Oluşturma
export const createMechanicalMaintenance = async (
  maintenanceData: Omit<MechanicalMaintenance, 'id' | 'olusturmaTarihi'>,
  photos?: File[]
): Promise<string> => {
  try {
    const now = Timestamp.now();
    const newMaintenance = {
      ...maintenanceData,
      olusturmaTarihi: now,
    };

    const docRef = await addDoc(collection(db, 'mekanikBakimlar'), newMaintenance);
    
    // Fotoğraflar varsa yükle
    if (photos && photos.length > 0) {
      const photoUrls = await uploadBakimPhotos(
        photos, 
        docRef.id, 
        maintenanceData.companyId,
        'mekanik'
      );
      
      // Fotoğraf URL'lerini güncelle
      await updateDoc(docRef, {
        fotograflar: photoUrls
      });
    }

    try {
      // SahaId'yi kontrol et - yoksa santral'dan al
      let bildirimSahaId = maintenanceData.sahaId;
      let santralAdi = '';
      
      if (maintenanceData.santralId) {
        const santralDoc = await getDoc(doc(db, 'santraller', maintenanceData.santralId));
        if (santralDoc.exists()) {
          const santralData = santralDoc.data();
          santralAdi = santralData.name || santralData.adi || maintenanceData.santralId;
          
          // sahaId yoksa santral'dan al
          if (!bildirimSahaId || bildirimSahaId === '') {
            bildirimSahaId = santralData.sahaId;
            console.log(`🔍 SahaId santral'dan alındı: ${bildirimSahaId}`);
          }
        }
      }
      
      console.log(`📊 Mekanik Bakım Bildirimi Debug:`, {
        sahaId: bildirimSahaId || 'YOK',
        santralId: maintenanceData.santralId || 'YOK',
        santralAdi: santralAdi || 'YOK',
        companyId: maintenanceData.companyId
      });
      
      // metadata oluştur
      const metadata: any = { 
        maintenanceId: docRef.id, 
        maintenanceType: 'mekanik'
      };
      
      // SahaId'yi kullan - sadece o sahaya atanan kişilere gitsin
      if (bildirimSahaId) {
        metadata.sahaId = bildirimSahaId;
      }
      if (maintenanceData.santralId) {
        metadata.santralId = maintenanceData.santralId;
      }
      
      await notificationService.createScopedNotificationClient({
        companyId: maintenanceData.companyId,
        title: '🔧 Mekanik Bakım Tamamlandı',
        message: `${santralAdi || 'Santral'} için mekanik bakım işlemi tamamlandı.`,
        type: 'success',
        actionUrl: '/bakim/mekanik',
        metadata: metadata,
        roles: ['yonetici','muhendis','tekniker','bekci','musteri']
      });
      console.log(`✅ Mekanik bakım bildirimi gönderildi - sahaId: ${bildirimSahaId || 'YOK'}, santralId: ${maintenanceData.santralId || 'YOK'}`);
    } catch (e) { 
      console.error('❌ Mekanik bakım bildirimi hatası:', e);
    }
    return docRef.id;
  } catch (error) {
    console.error('Mekanik bakım oluşturma hatası:', error);
    throw error;
  }
};

// Elektrik Bakım Güncelleme
export const updateElectricalMaintenance = async (
  maintenanceId: string,
  updates: Partial<ElectricalMaintenance>,
  newPhotos?: File[]
): Promise<void> => {
  try {
    const maintenanceRef = doc(db, 'elektrikBakimlar', maintenanceId);
    
    // Yeni fotoğraflar varsa yükle
    if (newPhotos && newPhotos.length > 0) {
      const maintenanceDoc = await getDoc(maintenanceRef);
      if (maintenanceDoc.exists()) {
        const maintenanceData = maintenanceDoc.data() as ElectricalMaintenance;
        const newPhotoUrls = await uploadBakimPhotos(
          newPhotos,
          maintenanceId,
          maintenanceData.companyId,
          'elektrik'
        );
        
        updates.fotograflar = [
          ...(maintenanceData.fotograflar || []),
          ...newPhotoUrls
        ];
      }
    }

    await updateDoc(maintenanceRef, updates);
  } catch (error) {
    console.error('Elektrik bakım güncelleme hatası:', error);
    throw error;
  }
};

// Mekanik Bakım Güncelleme
export const updateMechanicalMaintenance = async (
  maintenanceId: string,
  updates: Partial<MechanicalMaintenance>,
  newPhotos?: File[]
): Promise<void> => {
  try {
    const maintenanceRef = doc(db, 'mekanikBakimlar', maintenanceId);
    // Yeni fotoğraflar varsa yükle
    if (newPhotos && newPhotos.length > 0) {
      const maintenanceDoc = await getDoc(maintenanceRef);
      if (maintenanceDoc.exists()) {
        const maintenanceData = maintenanceDoc.data() as MechanicalMaintenance;
        const newPhotoUrls = await uploadBakimPhotos(
          newPhotos,
          maintenanceId,
          maintenanceData.companyId,
          'mekanik'
        );
        updates.fotograflar = [
          ...(maintenanceData.fotograflar || []),
          ...newPhotoUrls
        ];
      }
    }
    await updateDoc(maintenanceRef, updates);
  } catch (error) {
    console.error('Mekanik bakım güncelleme hatası:', error);
    throw error;
  }
};

// Şirkete ait elektrik bakımları getirme - MÜŞTERİ İZOLASYONU İLE
export const getElectricalMaintenances = async (
  companyId: string,
  santralId?: string,
  limit?: number,
  userRole?: string,
  userSantraller?: string[],
  userSahalar?: string[]
): Promise<ElectricalMaintenance[]> => {
  try {
    const constraints: QueryConstraint[] = [
      where('companyId', '==', companyId),
      orderBy('tarih', 'desc')
    ];

    if (santralId) {
      constraints.splice(-1, 0, where('santralId', '==', santralId));
    }

    if (limit) {
      constraints.push(firestoreLimit(limit));
    }

    const q = query(collection(db, 'elektrikBakimlar'), ...constraints);
    const querySnapshot = await getDocs(q);

    let bakimlar = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as ElectricalMaintenance[];

    // Müşteri/tekniker/mühendis/bekçi rollerinde sadece atanan kayıtları göster
    if (userRole === 'musteri' || userRole === 'tekniker' || userRole === 'muhendis' || userRole === 'bekci') {
      if (userSantraller && userSantraller.length > 0) {
        bakimlar = bakimlar.filter(bakim => userSantraller.includes(bakim.santralId));
      } else if (userSahalar && userSahalar.length > 0) {
        bakimlar = bakimlar.filter(bakim => userSahalar.includes(bakim.sahaId as any));
      }
    }

    return bakimlar;
  } catch (error) {
    console.error('Elektrik bakımları getirme hatası:', error);
    throw error;
  }
};

// Şirkete ait mekanik bakımları getirme - MÜŞTERİ İZOLASYONU İLE
export const getMechanicalMaintenances = async (
  companyId: string,
  santralId?: string,
  limit?: number,
  userRole?: string,
  userSantraller?: string[],
  userSahalar?: string[]
): Promise<MechanicalMaintenance[]> => {
  try {
    const constraints: QueryConstraint[] = [
      where('companyId', '==', companyId),
      orderBy('tarih', 'desc')
    ];

    if (santralId) {
      constraints.splice(-1, 0, where('santralId', '==', santralId));
    }

    if (limit) {
      constraints.push(firestoreLimit(limit));
    }

    const q = query(collection(db, 'mekanikBakimlar'), ...constraints);
    const querySnapshot = await getDocs(q);

    let bakimlar = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as MechanicalMaintenance[];

    // Müşteri/tekniker/mühendis/bekçi rollerinde sadece atanan kayıtları göster
    if (userRole === 'musteri' || userRole === 'tekniker' || userRole === 'muhendis' || userRole === 'bekci') {
      if (userSantraller && userSantraller.length > 0) {
        bakimlar = bakimlar.filter(bakim => userSantraller.includes(bakim.santralId));
      } else if (userSahalar && userSahalar.length > 0) {
        bakimlar = bakimlar.filter(bakim => userSahalar.includes(bakim.sahaId as any));
      }
    }

    return bakimlar;
  } catch (error) {
    console.error('Mekanik bakımları getirme hatası:', error);
    throw error;
  }
};

// Bakım istatistikleri
export const getMaintenanceStatistics = async (companyId: string) => {
  try {
    const [electricalMaintenances, mechanicalMaintenances] = await Promise.all([
      getElectricalMaintenances(companyId),
      getMechanicalMaintenances(companyId)
    ]);

    const allMaintenances = [
      ...electricalMaintenances,
      ...mechanicalMaintenances
    ];

    const stats = {
      toplamBakim: allMaintenances.length,
      elektrikBakim: electricalMaintenances.length,
      mekanikBakim: mechanicalMaintenances.length,
      iyiDurum: allMaintenances.filter(m => m.genelDurum === 'iyi').length,
      ortaDurum: allMaintenances.filter(m => m.genelDurum === 'orta').length,
      kotuDurum: allMaintenances.filter(m => m.genelDurum === 'kotu').length,
      sonBakim: allMaintenances[0] || null,
    };

    return stats;
  } catch (error) {
    console.error('Bakım istatistikleri getirme hatası:', error);
    throw error;
  }
};

// Bakım silme
export const deleteMaintenance = async (
  maintenanceId: string,
  type: 'elektrik' | 'mekanik'
): Promise<void> => {
  try {
    const collectionName = type === 'elektrik' ? 'elektrikBakimlar' : 'mekanikBakimlar';
    const maintenanceRef = doc(db, collectionName, maintenanceId);
    const maintenanceDoc = await getDoc(maintenanceRef);
    
    if (maintenanceDoc.exists()) {
      const maintenanceData = maintenanceDoc.data();
      
      // Fotoğrafları sil
      if (maintenanceData.fotograflar && maintenanceData.fotograflar.length > 0) {
        await deleteMultipleFiles(maintenanceData.fotograflar, maintenanceData.companyId);
      }
    }
    
    await deleteDoc(maintenanceRef);
  } catch (error) {
    console.error('Bakım silme hatası:', error);
    throw error;
  }
};

// Santral için bakım geçmişi
export const getPowerPlantMaintenanceHistory = async (
  companyId: string,
  santralId: string
) => {
  try {
    const [electricalHistory, mechanicalHistory] = await Promise.all([
      getElectricalMaintenances(companyId, santralId),
      getMechanicalMaintenances(companyId, santralId)
    ]);

    // Tarihe göre sırala
    const allHistory = [
      ...electricalHistory.map(m => ({ ...m, type: 'elektrik' })),
      ...mechanicalHistory.map(m => ({ ...m, type: 'mekanik' }))
    ].sort((a, b) => b.tarih.seconds - a.tarih.seconds);

    return allHistory;
  } catch (error) {
    console.error('Santral bakım geçmişi getirme hatası:', error);
    throw error;
  }
};

// Bakım planı oluşturma önerileri
export const generateMaintenancePlan = async (
  companyId: string,
  santralId: string
) => {
  try {
    const history = await getPowerPlantMaintenanceHistory(companyId, santralId);
    const now = new Date();
    
    // Son bakımlardan bu yana geçen süreyi hesapla
    const lastElectrical = history.find(h => h.type === 'elektrik');
    const lastMechanical = history.find(h => h.type === 'mekanik');
    
    const recommendations = [];
    
    // Elektrik bakım önerisi (6 ayda bir)
    if (!lastElectrical || 
        (now.getTime() - lastElectrical.tarih.toDate().getTime()) > (6 * 30 * 24 * 60 * 60 * 1000)) {
      recommendations.push({
        type: 'elektrik',
        priority: 'yuksek',
        reason: 'Son elektrik bakımından 6 ay geçti',
        suggestedDate: new Date(now.getTime() + (7 * 24 * 60 * 60 * 1000)) // 1 hafta sonra
      });
    }
    
    // Mekanik bakım önerisi (3 ayda bir)
    if (!lastMechanical || 
        (now.getTime() - lastMechanical.tarih.toDate().getTime()) > (3 * 30 * 24 * 60 * 60 * 1000)) {
      recommendations.push({
        type: 'mekanik',
        priority: 'normal',
        reason: 'Son mekanik bakımından 3 ay geçti',
        suggestedDate: new Date(now.getTime() + (3 * 24 * 60 * 60 * 1000)) // 3 gün sonra
      });
    }
    
    return recommendations;
  } catch (error) {
    console.error('Bakım planı oluşturma hatası:', error);
    throw error;
  }
};

// Yapılan İş Oluşturma
export const createYapilanIs = async (
  yapilanIsData: any,
  photos?: File[]
): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, 'yapilanIsler'), yapilanIsData);
    
    // Fotoğraflar varsa yükle
    if (photos && photos.length > 0) {
      const photoUrls = await uploadBakimPhotos(
        photos, 
        docRef.id, 
        yapilanIsData.companyId,
        'yapilanis'
      );
      
      // Fotoğraf URL'lerini güncelle
      await updateDoc(docRef, {
        fotograflar: photoUrls
      });
    }

    // Bildirim (saha-bazlı hedefli)
    try {
      // SahaId'yi kontrol et - yoksa santral'dan al
      let bildirimSahaId = yapilanIsData.sahaId;
      if ((!bildirimSahaId || bildirimSahaId === '') && yapilanIsData.santralId) {
        const santralDoc = await getDoc(doc(db, 'santraller', yapilanIsData.santralId));
        if (santralDoc.exists()) {
          bildirimSahaId = santralDoc.data().sahaId;
          console.log(`🔍 SahaId santral'dan alındı: ${bildirimSahaId}`);
        }
      }
      
      await notificationService.createScopedNotificationClient({
        companyId: yapilanIsData.companyId,
        title: 'Yapılan İş Kaydı Eklendi',
        message: `${yapilanIsData.baslik || 'Yeni kayıt'} eklendi`,
        type: 'success',
        actionUrl: '/bakim/yapilanisler',
        metadata: { 
          yapilanIsId: docRef.id,
          sahaId: bildirimSahaId,
          santralId: yapilanIsData.santralId
        },
        roles: ['yonetici','muhendis','tekniker','bekci','musteri']
      });
      console.log(`✅ Yapılan iş bildirimi gönderildi - sahaId: ${bildirimSahaId}`);
    } catch (e) { 
      console.error('❌ Yapılan iş bildirimi hatası:', e);
    }

    return docRef.id;
  } catch (error) {
    console.error('Yapılan iş oluşturma hatası:', error);
    throw error;
  }
};

// Şirkete ait yapılan işleri getirme - MÜŞTERİ İZOLASYONU İLE
export const getYapilanIsler = async (
  companyId: string,
  santralId?: string,
  limit?: number,
  userRole?: string,
  userSantraller?: string[],
  userSahalar?: string[]
): Promise<any[]> => {
  try {
    const constraints: QueryConstraint[] = [
      where('companyId', '==', companyId),
      orderBy('tarih', 'desc')
    ];

    if (santralId) {
      constraints.splice(-1, 0, where('santralId', '==', santralId));
    }

    if (limit) {
      constraints.push(firestoreLimit(limit));
    }

    const q = query(collection(db, 'yapilanIsler'), ...constraints);
    const querySnapshot = await getDocs(q);

    let yapilanIsler = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Müşteri/tekniker/mühendis/bekçi rollerinde sadece atanan kayıtları göster
    if (userRole === 'musteri' || userRole === 'tekniker' || userRole === 'muhendis' || userRole === 'bekci') {
      if (userSantraller && userSantraller.length > 0) {
        yapilanIsler = yapilanIsler.filter(is => userSantraller.includes(is.santralId));
      } else if (userSahalar && userSahalar.length > 0) {
        yapilanIsler = yapilanIsler.filter(is => userSahalar.includes(is.sahaId as any));
      }
    }

    return yapilanIsler;
  } catch (error) {
    console.error('Yapılan işler getirme hatası:', error);
    throw error;
  }
};

// Yapılan iş silme
export const deleteYapilanIs = async (yapilanIsId: string): Promise<void> => {
  try {
    const yapilanIsRef = doc(db, 'yapilanIsler', yapilanIsId);
    const yapilanIsDoc = await getDoc(yapilanIsRef);
    
    if (yapilanIsDoc.exists()) {
      const yapilanIsData = yapilanIsDoc.data();
      
      // Fotoğrafları sil
      if (yapilanIsData.fotograflar && yapilanIsData.fotograflar.length > 0) {
        await deleteMultipleFiles(yapilanIsData.fotograflar, yapilanIsData.companyId);
      }
    }
    
    await deleteDoc(yapilanIsRef);
  } catch (error) {
    console.error('Yapılan iş silme hatası:', error);
    throw error;
  }
};

// Yapılan iş güncelleme
export const updateYapilanIs = async (
  yapilanIsId: string,
  updates: any,
  newPhotos?: File[]
): Promise<void> => {
  try {
    const yapilanIsRef = doc(db, 'yapilanIsler', yapilanIsId);
    const yapilanIsDoc = await getDoc(yapilanIsRef);
    if (yapilanIsDoc.exists()) {
      const current = yapilanIsDoc.data() as any;
      if (newPhotos && newPhotos.length > 0) {
        const newPhotoUrls = await uploadBakimPhotos(
          newPhotos,
          yapilanIsId,
          current.companyId,
          'yapilanis'
        );
        updates.fotograflar = [
          ...(current.fotograflar || []),
          ...newPhotoUrls
        ];
      }
    }
    await updateDoc(yapilanIsRef, updates);
  } catch (error) {
    console.error('Yapılan iş güncelleme hatası:', error);
    throw error;
  }
};

export const bakimService = {
  createElectricalMaintenance,
  createMechanicalMaintenance,
  updateElectricalMaintenance,
  updateMechanicalMaintenance,
  getElectricalMaintenances,
  getMechanicalMaintenances,
  getMaintenanceStatistics,
  deleteMaintenance,
  getPowerPlantMaintenanceHistory,
  generateMaintenancePlan,
  createYapilanIs,
  getYapilanIsler,
  deleteYapilanIs,
  updateYapilanIs
};
