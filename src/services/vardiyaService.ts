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
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { notificationService } from './notificationService';

// Derin şekilde undefined değerleri temizler
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

export interface VardiyaBildirimi {
  id?: string;
  companyId: string;
  olusturanId: string; // Vardiyayı oluşturan kullanıcı ID'si
  olusturanAdi: string; // [DEPRECATED] Eski kayıtlar için - dinamik isim için olusturanId kullan
  olusturanRol: string; // yonetici, muhendis, tekniker, bekci
  olusturanFotoUrl?: string; // [DEPRECATED] Dinamik foto için olusturanId kullan
  sahaId: string;
  sahaAdi: string;
  santralId?: string;
  santralAdi?: string;
  tarih: Timestamp;
  vardiyaTipi: 'sabah' | 'ogle' | 'aksam' | 'gece';
  vardiyaSaatleri: {
    baslangic: string; // "08:00"
    bitis: string; // "16:00"
  };
  personeller: {
    id: string;
    ad: string;
    rol: string;
    telefon?: string;
  }[];
  durum: 'normal' | 'dikkat' | 'acil';
  acilDurum: boolean;
  gozlemler: {
    baslik: string;
    aciklama: string;
    oncelik: 'dusuk' | 'orta' | 'yuksek';
  }[];
  yapılanIsler: string[];
  fotograflar: string[];
  konum?: {
    lat: number;
    lng: number;
    adres?: string;
  };
  havaKosullari?: {
    sicaklik?: number;
    durum?: string; // "güneşli", "bulutlu", "yağmurlu"
    ruzgarHizi?: number;
  };
  guvenlikKontrolleri?: {
    kameraKontrol: boolean;
    telOrguKontrol: boolean;
    aydinlatmaKontrol: boolean;
    girisKontrol: boolean;
    notlar?: string;
  };
  ekipmanKontrolleri?: {
    panelTemizlik: boolean;
    inverterKontrol: boolean;
    kablolama: boolean;
    topraklama: boolean;
    notlar?: string;
  };
  olusturmaTarihi: Timestamp;
  guncellenmeTarihi: Timestamp;
}

// Yeni vardiya bildirimi oluştur
export const createVardiyaBildirimi = async (
  vardiyaData: Omit<VardiyaBildirimi, 'id' | 'olusturmaTarihi' | 'guncellenmeTarihi'>
): Promise<string> => {
  try {
    const newVardiya = {
      ...vardiyaData,
      olusturmaTarihi: serverTimestamp(),
      guncellenmeTarihi: serverTimestamp()
    };
    const docRef = await addDoc(collection(db, 'vardiyaBildirimleri'), removeUndefinedDeep(newVardiya));
    console.log('Yeni vardiya bildirimi oluşturuldu:', docRef.id);
    // Bildirim oluştur
    try {
      await notificationService.createNotification({
        companyId: vardiyaData.companyId,
        title: 'Yeni Vardiya',
        message: `${vardiyaData.sahaAdi} - ${vardiyaData.vardiyaTipi.toUpperCase()} (${vardiyaData.vardiyaSaatleri.baslangic}-${vardiyaData.vardiyaSaatleri.bitis})`,
        type: vardiyaData.durum === 'acil' ? 'error' : (vardiyaData.durum === 'dikkat' ? 'warning' : 'info'),
        actionUrl: '/vardiya',
        metadata: { vardiyaId: docRef.id, sahaId: vardiyaData.sahaId, santralId: vardiyaData.santralId }
      });
    } catch {}
    return docRef.id;
  } catch (error) {
    console.error('Vardiya bildirimi oluşturma hatası:', error);
    throw new Error('Vardiya bildirimi oluşturulamadı');
  }
};

// Vardiya bildirimi güncelle
export const updateVardiyaBildirimi = async (
  vardiyaId: string, 
  updates: Partial<VardiyaBildirimi>
): Promise<void> => {
  try {
    const vardiyaRef = doc(db, 'vardiyaBildirimleri', vardiyaId);
    
    const updateDataRaw = {
      ...updates,
      guncellenmeTarihi: serverTimestamp()
    } as Record<string, any>;
    const updateData: Record<string, any> = removeUndefinedDeep(updateDataRaw);
    
    // id alanını kaldır
    delete (updateData as any).id;
    
    await updateDoc(vardiyaRef, updateData);
    console.log('Vardiya bildirimi güncellendi:', vardiyaId);
    // Acil durum bildirimi
    try {
      if (updates.durum === 'acil' || updates.acilDurum === true) {
        const vardiyaDoc = await getDoc(vardiyaRef);
        if (vardiyaDoc.exists()) {
          const data = vardiyaDoc.data() as VardiyaBildirimi;
          await notificationService.createNotification({
            companyId: data.companyId,
            title: 'Acil Vardiya',
            message: `${data.sahaAdi} için acil durum bildirimi`,
            type: 'error',
            actionUrl: '/vardiya',
            metadata: { vardiyaId, sahaId: data.sahaId, santralId: data.santralId }
          });
        }
      }
    } catch {}
  } catch (error) {
    console.error('Vardiya bildirimi güncelleme hatası:', error);
    throw new Error('Vardiya bildirimi güncellenemedi');
  }
};

// Vardiya bildirimi sil
export const deleteVardiyaBildirimi = async (vardiyaId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'vardiyaBildirimleri', vardiyaId));
    console.log('Vardiya bildirimi silindi:', vardiyaId);
  } catch (error) {
    console.error('Vardiya bildirimi silme hatası:', error);
    throw new Error('Vardiya bildirimi silinemedi');
  }
};

// Tek bir vardiya bildirimi getir
export const getVardiyaBildirimi = async (vardiyaId: string): Promise<VardiyaBildirimi | null> => {
  try {
    const vardiyaDoc = await getDoc(doc(db, 'vardiyaBildirimleri', vardiyaId));
    
    if (vardiyaDoc.exists()) {
      return { id: vardiyaDoc.id, ...vardiyaDoc.data() } as VardiyaBildirimi;
    }
    
    return null;
  } catch (error) {
    console.error('Vardiya bildirimi getirme hatası:', error);
    throw new Error('Vardiya bildirimi getirilemedi');
  }
};

// Tüm vardiya bildirimlerini getir
export const getAllVardiyaBildirimleri = async (companyId: string): Promise<VardiyaBildirimi[]> => {
  try {
    const q = query(
      collection(db, 'vardiyaBildirimleri'),
      where('companyId', '==', companyId),
      orderBy('tarih', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const vardiyalar: VardiyaBildirimi[] = [];
    
    querySnapshot.forEach((doc) => {
      vardiyalar.push({ id: doc.id, ...doc.data() } as VardiyaBildirimi);
    });
    
    return vardiyalar;
  } catch (error) {
    console.error('Vardiya bildirimleri getirme hatası:', error);
    // Index hatası durumunda orderBy olmadan dene
    try {
      const q = query(
        collection(db, 'vardiyaBildirimleri'),
        where('companyId', '==', companyId)
      );
      
      const querySnapshot = await getDocs(q);
      const vardiyalar: VardiyaBildirimi[] = [];
      
      querySnapshot.forEach((doc) => {
        vardiyalar.push({ id: doc.id, ...doc.data() } as VardiyaBildirimi);
      });
      
      // Client-side sıralama
      return vardiyalar.sort((a, b) => 
        b.tarih.toDate().getTime() - a.tarih.toDate().getTime()
      );
    } catch (fallbackError) {
      console.error('Vardiya bildirimleri getirme hatası (fallback):', fallbackError);
      throw new Error('Vardiya bildirimleri getirilemedi');
    }
  }
};

// Kullanıcıya göre vardiya bildirimleri getir
export const getVardiyaByUser = async (userId: string): Promise<VardiyaBildirimi[]> => {
  try {
    const q = query(
      collection(db, 'vardiyaBildirimleri'),
      where('olusturanId', '==', userId),
      orderBy('tarih', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const vardiyalar: VardiyaBildirimi[] = [];
    
    querySnapshot.forEach((doc) => {
      vardiyalar.push({ id: doc.id, ...doc.data() } as VardiyaBildirimi);
    });
    
    return vardiyalar;
  } catch (error) {
    console.error('Kullanıcı vardiyaları getirme hatası:', error);
    return [];
  }
};

// Sahaya göre vardiya bildirimleri getir
export const getVardiyaBySaha = async (sahaId: string): Promise<VardiyaBildirimi[]> => {
  try {
    const q = query(
      collection(db, 'vardiyaBildirimleri'),
      where('sahaId', '==', sahaId),
      orderBy('tarih', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const vardiyalar: VardiyaBildirimi[] = [];
    
    querySnapshot.forEach((doc) => {
      vardiyalar.push({ id: doc.id, ...doc.data() } as VardiyaBildirimi);
    });
    
    return vardiyalar;
  } catch (error) {
    console.error('Saha vardiyaları getirme hatası:', error);
    return [];
  }
};

// Bugünkü vardiyaları getir
export const getTodayVardiyalar = async (companyId: string): Promise<VardiyaBildirimi[]> => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const q = query(
      collection(db, 'vardiyaBildirimleri'),
      where('companyId', '==', companyId),
      where('tarih', '>=', Timestamp.fromDate(today)),
      where('tarih', '<', Timestamp.fromDate(tomorrow))
    );
    
    const querySnapshot = await getDocs(q);
    const vardiyalar: VardiyaBildirimi[] = [];
    
    querySnapshot.forEach((doc) => {
      vardiyalar.push({ id: doc.id, ...doc.data() } as VardiyaBildirimi);
    });
    
    return vardiyalar;
  } catch (error) {
    console.error('Bugünkü vardiyalar getirme hatası:', error);
    return [];
  }
};

// Acil durum vardiyalarını getir
export const getAcilVardiyalar = async (companyId: string): Promise<VardiyaBildirimi[]> => {
  try {
    const q = query(
      collection(db, 'vardiyaBildirimleri'),
      where('companyId', '==', companyId),
      where('acilDurum', '==', true)
    );
    
    const querySnapshot = await getDocs(q);
    const vardiyalar: VardiyaBildirimi[] = [];
    
    querySnapshot.forEach((doc) => {
      vardiyalar.push({ id: doc.id, ...doc.data() } as VardiyaBildirimi);
    });
    
    return vardiyalar.sort((a, b) => 
      b.tarih.toDate().getTime() - a.tarih.toDate().getTime()
    );
  } catch (error) {
    console.error('Acil vardiyalar getirme hatası:', error);
    return [];
  }
};

// Export all functions
export const vardiyaService = {
  createVardiyaBildirimi,
  updateVardiyaBildirimi,
  deleteVardiyaBildirimi,
  getVardiyaBildirimi,
  getAllVardiyaBildirimleri,
  getVardiyaByUser,
  getVardiyaBySaha,
  getTodayVardiyalar,
  getAcilVardiyalar
};







