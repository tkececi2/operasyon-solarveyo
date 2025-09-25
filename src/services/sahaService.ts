import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit as firestoreLimit,
  Timestamp
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import toast from 'react-hot-toast';

export interface Saha {
  id: string;
  companyId: string;
  ad: string;
  musteriId: string;
  musteriAdi: string;
  santralIds: string[];
  konum: {
    lat: number;
    lng: number;
    adres: string;
  };
  toplamKapasite: number; // kW
  aktif: boolean;
  aciklama?: string;
  olusturmaTarihi: Timestamp;
  guncellenmeTarihi: Timestamp;
}

// Saha oluştur
export const createSaha = async (
  sahaData: Omit<Saha, 'id' | 'olusturmaTarihi' | 'guncellenmeTarihi' | 'santralIds'>
): Promise<string> => {
  try {
    const now = Timestamp.now();
    const newSaha = {
      ...sahaData,
      santralIds: [],
      aktif: true,
      toplamKapasite: 0,
      olusturmaTarihi: now,
      guncellenmeTarihi: now
    };

    const docRef = await addDoc(collection(db, 'sahalar'), newSaha);
    
    toast.success('Saha başarıyla oluşturuldu!');
    return docRef.id;
  } catch (error) {
    console.error('Saha oluşturma hatası:', error);
    toast.error('Saha oluşturulamadı: ' + (error as Error).message);
    throw error;
  }
};

// Saha güncelle
export const updateSaha = async (
  sahaId: string,
  updates: Partial<Omit<Saha, 'id' | 'olusturmaTarihi' | 'guncellenmeTarihi'>>
): Promise<void> => {
  try {
    const sahaRef = doc(db, 'sahalar', sahaId);
    
    await updateDoc(sahaRef, {
      ...updates,
      guncellenmeTarihi: Timestamp.now()
    });

    toast.success('Saha başarıyla güncellendi!');
  } catch (error) {
    console.error('Saha güncelleme hatası:', error);
    toast.error('Saha güncellenemedi: ' + (error as Error).message);
    throw error;
  }
};

// Saha sil
export const deleteSaha = async (sahaId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'sahalar', sahaId));
    toast.success('Saha başarıyla silindi!');
  } catch (error) {
    console.error('Saha silme hatası:', error);
    toast.error('Saha silinemedi: ' + (error as Error).message);
    throw error;
  }
};

// Tek saha getir
export const getSaha = async (sahaId: string): Promise<Saha | null> => {
  try {
    const sahaDoc = await getDoc(doc(db, 'sahalar', sahaId));
    
    if (sahaDoc.exists()) {
      return {
        id: sahaDoc.id,
        ...sahaDoc.data()
      } as Saha;
    }
    
    return null;
  } catch (error) {
    console.error('Saha getirme hatası:', error);
    throw error;
  }
};

// Şirketin tüm sahalarını getir - MÜŞTERİ İZOLASYONU İLE
export const getAllSahalar = async (companyId?: string, userRole?: string, userSahalar?: string[]): Promise<Saha[]> => {
  try {
    // CompanyId kontrolü
    if (!companyId) {
      console.log('getAllSahalar: companyId boş');
      return [];
    }
    
    // Index hazır olana kadar basit query
    const q = query(
      collection(db, 'sahalar'),
      where('companyId', '==', companyId)
    );

    const querySnapshot = await getDocs(q);
    let sahalar: Saha[] = [];

    querySnapshot.forEach((doc) => {
      sahalar.push({
        id: doc.id,
        ...doc.data()
      } as Saha);
    });

    // Müşteri/tekniker/mühendis/bekçi rollerinde sadece atanan sahaları göster
    if ((userRole === 'musteri' || userRole === 'tekniker' || userRole === 'muhendis' || userRole === 'bekci') && userSahalar && userSahalar.length > 0) {
      sahalar = sahalar.filter(saha => userSahalar.includes(saha.id));
    }

    // Client-side sorting (index hazır olana kadar)
    return sahalar.sort((a, b) => 
      b.olusturmaTarihi.toDate().getTime() - a.olusturmaTarihi.toDate().getTime()
    );
  } catch (error) {
    console.error('Sahalar getirme hatası:', error);
    throw error;
  }
};

// Müşterinin sahalarını getir
export const getMusteriSahalar = async (musteriId: string): Promise<Saha[]> => {
  try {
    const q = query(
      collection(db, 'sahalar'),
      where('musteriId', '==', musteriId),
      orderBy('olusturmaTarihi', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const sahalar: Saha[] = [];

    querySnapshot.forEach((doc) => {
      sahalar.push({
        id: doc.id,
        ...doc.data()
      } as Saha);
    });

    return sahalar;
  } catch (error) {
    console.error('Müşteri sahaları getirme hatası:', error);
    throw error;
  }
};

// Kullanıcı rolüne göre sahaları getir
export const getSahalarByUser = async (companyId: string, userRole: string, userSahalar?: string[]): Promise<Saha[]> => {
  try {
    if (!companyId) {
      return [];
    }
    
    const q = query(
      collection(db, 'sahalar'),
      where('companyId', '==', companyId)
    );

    const querySnapshot = await getDocs(q);
    let sahalar: Saha[] = [];

    querySnapshot.forEach((doc) => {
      sahalar.push({
        id: doc.id,
        ...doc.data()
      } as Saha);
    });

    // Müşteri ise sadece atanan sahaları göster
    if (userRole === 'musteri' && userSahalar && userSahalar.length > 0) {
      sahalar = sahalar.filter(saha => userSahalar.includes(saha.id));
    }

    return sahalar.sort((a, b) => 
      b.olusturmaTarihi.toDate().getTime() - a.olusturmaTarihi.toDate().getTime()
    );
  } catch (error) {
    console.error('Kullanıcı sahaları getirme hatası:', error);
    throw error;
  }
};

// Aktif sahaları getir
export const getActiveSahalar = async (companyId: string): Promise<Saha[]> => {
  try {
    const q = query(
      collection(db, 'sahalar'),
      where('companyId', '==', companyId),
      where('aktif', '==', true),
      orderBy('olusturmaTarihi', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const sahalar: Saha[] = [];

    querySnapshot.forEach((doc) => {
      sahalar.push({
        id: doc.id,
        ...doc.data()
      } as Saha);
    });

    return sahalar;
  } catch (error) {
    console.error('Aktif sahalar getirme hatası:', error);
    throw error;
  }
};

// Saha arama
export const searchSahalar = async (
  companyId: string, 
  searchTerm: string,
  userRole?: string,
  userSahalar?: string[]
): Promise<Saha[]> => {
  try {
    const allSahalar = await getAllSahalar(companyId, userRole, userSahalar);
    
    const filteredSahalar = allSahalar.filter(saha => 
      saha.ad.toLowerCase().includes(searchTerm.toLowerCase()) ||
      saha.musteriAdi.toLowerCase().includes(searchTerm.toLowerCase()) ||
      saha.konum.adres.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return filteredSahalar;
  } catch (error) {
    console.error('Saha arama hatası:', error);
    throw error;
  }
};

// Saha istatistikleri
export const getSahaStats = async (companyId: string, userRole?: string, userSahalar?: string[]) => {
  try {
    const sahalar = await getAllSahalar(companyId, userRole, userSahalar);
    
    return {
      toplam: sahalar.length,
      aktif: sahalar.filter(s => s.aktif).length,
      pasif: sahalar.filter(s => !s.aktif).length,
      toplamKapasite: sahalar.reduce((sum, s) => sum + s.toplamKapasite, 0)
    };
  } catch (error) {
    console.error('Saha istatistikleri hatası:', error);
    throw error;
  }
};
