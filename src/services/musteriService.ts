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

export interface Musteri {
  id: string;
  companyId: string;
  ad: string;
  email: string;
  telefon: string;
  adres: string;
  sirket?: string;
  notlar?: string;
  aktif: boolean;
  sahaSayisi: number;
  olusturmaTarihi: Timestamp;
  guncellenmeTarihi: Timestamp;
}

// Müşteri oluştur
export const createMusteri = async (
  musteriData: Omit<Musteri, 'id' | 'olusturmaTarihi' | 'guncellenmeTarihi' | 'sahaSayisi'>
): Promise<string> => {
  try {
    const now = Timestamp.now();
    const newMusteri = {
      ...musteriData,
      aktif: true,
      sahaSayisi: 0,
      olusturmaTarihi: now,
      guncellenmeTarihi: now
    };

    const docRef = await addDoc(collection(db, 'musteriler'), newMusteri);
    
    toast.success('Müşteri başarıyla oluşturuldu!');
    return docRef.id;
  } catch (error) {
    console.error('Müşteri oluşturma hatası:', error);
    toast.error('Müşteri oluşturulamadı: ' + (error as Error).message);
    throw error;
  }
};

// Müşteri güncelle
export const updateMusteri = async (
  musteriId: string,
  updates: Partial<Omit<Musteri, 'id' | 'olusturmaTarihi' | 'guncellenmeTarihi'>>
): Promise<void> => {
  try {
    const musteriRef = doc(db, 'musteriler', musteriId);
    
    await updateDoc(musteriRef, {
      ...updates,
      guncellenmeTarihi: Timestamp.now()
    });

    toast.success('Müşteri başarıyla güncellendi!');
  } catch (error) {
    console.error('Müşteri güncelleme hatası:', error);
    toast.error('Müşteri güncellenemedi: ' + (error as Error).message);
    throw error;
  }
};

// Müşteri sil
export const deleteMusteri = async (musteriId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'musteriler', musteriId));
    toast.success('Müşteri başarıyla silindi!');
  } catch (error) {
    console.error('Müşteri silme hatası:', error);
    toast.error('Müşteri silinemedi: ' + (error as Error).message);
    throw error;
  }
};

// Tek müşteri getir
export const getMusteri = async (musteriId: string): Promise<Musteri | null> => {
  try {
    const musteriDoc = await getDoc(doc(db, 'musteriler', musteriId));
    
    if (musteriDoc.exists()) {
      return {
        id: musteriDoc.id,
        ...musteriDoc.data()
      } as Musteri;
    }
    
    return null;
  } catch (error) {
    console.error('Müşteri getirme hatası:', error);
    throw error;
  }
};

// Şirketin tüm müşterilerini getir - INDEX SORUNU İÇİN BASİT VERSİYON
export const getAllMusteriler = async (companyId: string): Promise<Musteri[]> => {
  try {
    // Index hazır olana kadar basit query
    const q = query(
      collection(db, 'musteriler'),
      where('companyId', '==', companyId)
    );

    const querySnapshot = await getDocs(q);
    const musteriler: Musteri[] = [];

    querySnapshot.forEach((doc) => {
      musteriler.push({
        id: doc.id,
        ...doc.data()
      } as Musteri);
    });

    // Client-side sorting (index hazır olana kadar)
    return musteriler.sort((a, b) => {
      const dateA = a.olusturmaTarihi?.toDate?.() || new Date(0);
      const dateB = b.olusturmaTarihi?.toDate?.() || new Date(0);
      return dateB.getTime() - dateA.getTime();
    });
  } catch (error) {
    console.error('Müşteriler getirme hatası:', error);
    throw error;
  }
};

// Aktif müşterileri getir
export const getActiveMusteriler = async (companyId: string): Promise<Musteri[]> => {
  try {
    const q = query(
      collection(db, 'musteriler'),
      where('companyId', '==', companyId),
      where('aktif', '==', true)
    );

    const querySnapshot = await getDocs(q);
    const musteriler: Musteri[] = [];

    querySnapshot.forEach((doc) => {
      musteriler.push({
        id: doc.id,
        ...doc.data()
      } as Musteri);
    });

    // Client-side sorting
    return musteriler.sort((a, b) => 
      b.olusturmaTarihi.toDate().getTime() - a.olusturmaTarihi.toDate().getTime()
    );
  } catch (error) {
    console.error('Aktif müşteriler getirme hatası:', error);
    throw error;
  }
};

// Müşteri arama
export const searchMusteriler = async (
  companyId: string,
  searchTerm: string
): Promise<Musteri[]> => {
  try {
    // Firebase'de text search sınırlı olduğu için tüm müşterileri getirip filtreleyelim
    const allMusteriler = await getAllMusteriler(companyId);
    
    const filteredMusteriler = allMusteriler.filter(musteri => 
      musteri.ad.toLowerCase().includes(searchTerm.toLowerCase()) ||
      musteri.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      musteri.sirket?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return filteredMusteriler;
  } catch (error) {
    console.error('Müşteri arama hatası:', error);
    throw error;
  }
};

// Müşteri istatistikleri
export const getMusteriStats = async (companyId: string) => {
  try {
    const musteriler = await getAllMusteriler(companyId);
    
    return {
      toplam: musteriler.length,
      aktif: musteriler.filter(m => m.aktif).length,
      pasif: musteriler.filter(m => !m.aktif).length,
      sahaliMusteriler: musteriler.filter(m => m.sahaSayisi > 0).length
    };
  } catch (error) {
    console.error('Müşteri istatistikleri hatası:', error);
    throw error;
  }
};
