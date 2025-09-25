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
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { notificationService } from './notificationService';

export interface StokItem {
  id?: string;
  companyId: string;
  malzemeAdi: string;
  kategori: string;
  birim: string;
  mevcutStok: number;
  minimumStok?: number; // Bazı sayfalarda minimumStokSeviyesi alan adı kullanılıyor
  minimumStokSeviyesi?: number;
  maximumStok?: number;
  birimFiyat: number;
  tedarikci?: string;
  sonGuncelleme: Timestamp;
  sahaId?: string;
  santralId?: string;
  konum?: string;
  notlar?: string;
  resimler?: string[];
}

export interface StokHareket {
  id?: string;
  stokId: string;
  companyId: string;
  hareketTipi: 'giris' | 'cikis' | 'transfer' | 'sayim';
  miktar: number;
  aciklama?: string;
  yapanKisi: string;
  tarih: Timestamp;
  eskiMiktar?: number;
  yeniMiktar?: number;
  hedefSaha?: string;
  hedefSantral?: string;
}

// Stok durumu hesaplama
export const getStokDurumu = (miktar: number, minimumStok: number, maximumStok?: number): 'kritik' | 'dusuk' | 'normal' | 'fazla' => {
  if (miktar <= 0) return 'kritik';
  if (miktar <= minimumStok) return 'dusuk';
  if (maximumStok && miktar >= maximumStok) return 'fazla';
  return 'normal';
};

// Yeni stok oluştur
export const createStok = async (stokData: Omit<StokItem, 'id' | 'sonGuncelleme'>): Promise<string> => {
  try {
    const newStok = {
      ...stokData,
      sonGuncelleme: serverTimestamp()
    };
    
    const docRef = await addDoc(collection(db, 'stoklar'), newStok);
    console.log('Yeni stok oluşturuldu:', docRef.id);
    // Düşük/kritik stok bildirimi (hemen ekleme sonrası)
    try {
      const min = (newStok.minimumStok ?? newStok.minimumStokSeviyesi) || 0;
      const durum = getStokDurumu(newStok.mevcutStok || 0, min, newStok.maximumStok);
      if (durum === 'kritik' || durum === 'dusuk') {
        const { notificationService } = await import('./notificationService');
        await notificationService.createLowStockNotification(
          newStok.companyId,
          newStok.malzemeAdi,
          newStok.mevcutStok || 0,
          min,
          newStok.sahaId,
          newStok.santralId
        );
      }
    } catch {}
    return docRef.id;
  } catch (error) {
    console.error('Stok oluşturma hatası:', error);
    throw new Error('Stok oluşturulamadı');
  }
};

// Stok güncelle
export const updateStok = async (stokId: string, updates: Partial<StokItem>): Promise<void> => {
  try {
    const stokRef = doc(db, 'stoklar', stokId);
    
    const updateData = {
      ...updates,
      sonGuncelleme: serverTimestamp()
    };
    
    // id alanını kaldır
    delete updateData.id;
    
    await updateDoc(stokRef, updateData);
    console.log('Stok güncellendi:', stokId);
    // Düşük/kritik stok bildirimi (güncelleme sonrası)
    try {
      const stokDoc = await getDoc(stokRef);
      if (stokDoc.exists()) {
        const stok = stokDoc.data() as StokItem;
        const min = (stok.minimumStok ?? stok.minimumStokSeviyesi) || 0;
        const durum = getStokDurumu(stok.mevcutStok || 0, min, stok.maximumStok);
        if (durum === 'kritik' || durum === 'dusuk') {
          const { notificationService } = await import('./notificationService');
          await notificationService.createLowStockNotification(
            stok.companyId,
            stok.malzemeAdi,
            stok.mevcutStok || 0,
            min,
            stok.sahaId,
            stok.santralId
          );
        }
      }
    } catch {}
  } catch (error) {
    console.error('Stok güncelleme hatası:', error);
    throw new Error('Stok güncellenemedi');
  }
};

// Stok sil
export const deleteStok = async (stokId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'stoklar', stokId));
    console.log('Stok silindi:', stokId);
  } catch (error) {
    console.error('Stok silme hatası:', error);
    throw new Error('Stok silinemedi');
  }
};

// Tek bir stok getir
export const getStok = async (stokId: string): Promise<StokItem | null> => {
  try {
    const stokDoc = await getDoc(doc(db, 'stoklar', stokId));
    
    if (stokDoc.exists()) {
      return { id: stokDoc.id, ...stokDoc.data() } as StokItem;
    }
    
    return null;
  } catch (error) {
    console.error('Stok getirme hatası:', error);
    throw new Error('Stok getirilemedi');
  }
};

// Tüm stokları getir (orderBy olmadan, client-side sıralama ile)
export const getAllStoklar = async (
  companyId: string,
  userRole?: string,
  userSahalar?: string[],
  userSantraller?: string[]
): Promise<StokItem[]> => {
  try {
    const q = query(
      collection(db, 'stoklar'),
      where('companyId', '==', companyId)
    );
    
    const querySnapshot = await getDocs(q);
    let stoklar: StokItem[] = [];
    
    querySnapshot.forEach((doc) => {
      stoklar.push({ id: doc.id, ...doc.data() } as StokItem);
    });

    // Rol bazlı görünürlük: musteri/tekniker/muhendis/bekci -> yalnız atanan saha/santral
    if (userRole === 'musteri' || userRole === 'tekniker' || userRole === 'muhendis' || userRole === 'bekci') {
      const allowedSahalar = Array.isArray(userSahalar) ? userSahalar : [];
      const allowedSantraller = Array.isArray(userSantraller) ? userSantraller : [];
      stoklar = stoklar.filter(s => {
        const sahaMatch = s.sahaId ? allowedSahalar.includes(s.sahaId) : false;
        const santralMatch = s.santralId ? allowedSantraller.includes(s.santralId) : false;
        return sahaMatch || santralMatch;
      });
    }
    
    // Client-side sıralama
    return stoklar.sort((a, b) => a.malzemeAdi.localeCompare(b.malzemeAdi));
  } catch (error) {
    console.error('Stoklar getirme hatası:', error);
    throw new Error('Stoklar getirilemedi');
  }
};

// Santrale göre stokları getir
export const getStokBySantral = async (santralId: string): Promise<StokItem[]> => {
  try {
    const q = query(
      collection(db, 'stoklar'),
      where('santralId', '==', santralId)
    );
    
    const querySnapshot = await getDocs(q);
    const stoklar: StokItem[] = [];
    
    querySnapshot.forEach((doc) => {
      stoklar.push({ id: doc.id, ...doc.data() } as StokItem);
    });
    
    // Client-side sıralama
    return stoklar.sort((a, b) => a.malzemeAdi.localeCompare(b.malzemeAdi));
  } catch (error) {
    console.error('Santral stokları getirme hatası:', error);
    throw new Error('Santral stokları getirilemedi');
  }
};

// Stok hareketi ekle
export const addStokHareket = async (stokId: string, hareketData: Omit<StokHareket, 'id' | 'tarih' | 'stokId'>): Promise<string> => {
  try {
    // Önce mevcut stok bilgisini al
    const stokDoc = await getDoc(doc(db, 'stoklar', stokId));
    if (!stokDoc.exists()) {
      throw new Error('Stok bulunamadı');
    }

    const stok = stokDoc.data() as StokItem;
    const eskiMiktar = stok.mevcutStok || 0;
    
    // Yeni miktarı hesapla
    let yeniMiktar = eskiMiktar;
    if (hareketData.hareketTipi === 'giris') {
      yeniMiktar += hareketData.miktar;
    } else if (hareketData.hareketTipi === 'cikis') {
      yeniMiktar -= hareketData.miktar;
      if (yeniMiktar < 0) {
        throw new Error('Stok miktarı negatif olamaz');
      }
    } else if (hareketData.hareketTipi === 'sayim') {
      yeniMiktar = hareketData.miktar;
    }

    // Hareket kaydını oluştur
    const newHareket = {
      stokId,
      ...hareketData,
      tarih: serverTimestamp(),
      eskiMiktar,
      yeniMiktar
    };
    
    // Hareket kaydını ekle
    const hareketRef = await addDoc(collection(db, 'stokHareketleri'), newHareket);
    
    // Stok miktarını güncelle
    await updateDoc(doc(db, 'stoklar', stokId), {
      mevcutStok: yeniMiktar,
      sonGuncelleme: serverTimestamp()
    });
    
    try {
      await notificationService.createStockMovementNotification(
        stok.companyId,
        stokId,
        hareketData.hareketTipi,
        yeniMiktar,
        stok.sahaId,
        stok.santralId
      );
      const min = (stok.minimumStok ?? (stok as any).minimumStokSeviyesi) || 0;
      const durum = getStokDurumu(yeniMiktar, min, stok.maximumStok);
      if (durum === 'kritik' || durum === 'dusuk') {
        await notificationService.createLowStockNotification(
          stok.companyId,
          stok.malzemeAdi,
          yeniMiktar,
          min,
          stok.sahaId,
          stok.santralId
        );
      }
    } catch (e) { /* ignore */ }

    console.log('Stok hareketi eklendi:', hareketRef.id);
    return hareketRef.id;
  } catch (error) {
    console.error('Stok hareket ekleme hatası:', error);
    throw error;
  }
};

// Stok hareketlerini getir
export const getStokHareketleri = async (stokId: string, companyId?: string): Promise<StokHareket[]> => {
  try {
    let q;
    if (companyId) {
      q = query(
        collection(db, 'stokHareketleri'),
        where('stokId', '==', stokId),
        where('companyId', '==', companyId)
      );
    } else {
      q = query(
        collection(db, 'stokHareketleri'),
        where('stokId', '==', stokId)
      );
    }
    
    const querySnapshot = await getDocs(q);
    const hareketler: StokHareket[] = [];
    
    querySnapshot.forEach((doc) => {
      hareketler.push({ id: doc.id, ...doc.data() } as StokHareket);
    });
    
    // Tarihe göre sırala (en yeni önce)
    return hareketler.sort((a, b) => {
      const aTime = a.tarih instanceof Timestamp ? a.tarih.toMillis() : 0;
      const bTime = b.tarih instanceof Timestamp ? b.tarih.toMillis() : 0;
      return bTime - aTime;
    });
  } catch (error) {
    console.error('Stok hareketleri getirme hatası:', error);
    throw new Error('Stok hareketleri getirilemedi');
  }
};

// Şirketin tüm stok hareketlerini getir
export const getAllStokHareketleri = async (companyId: string): Promise<StokHareket[]> => {
  try {
    const q = query(
      collection(db, 'stokHareketleri'),
      where('companyId', '==', companyId)
    );
    
    const querySnapshot = await getDocs(q);
    const hareketler: StokHareket[] = [];
    
    querySnapshot.forEach((doc) => {
      hareketler.push({ id: doc.id, ...doc.data() } as StokHareket);
    });
    
    // Tarihe göre sırala (en yeni önce)
    return hareketler.sort((a, b) => {
      const aTime = a.tarih instanceof Timestamp ? a.tarih.toMillis() : 0;
      const bTime = b.tarih instanceof Timestamp ? b.tarih.toMillis() : 0;
      return bTime - aTime;
    });
  } catch (error) {
    console.error('Tüm stok hareketleri getirme hatası:', error);
    throw new Error('Stok hareketleri getirilemedi');
  }
};

// Export all functions
export const stokService = {
  createStok,
  updateStok,
  deleteStok,
  getStok,
  getAllStoklar,
  getStokBySantral,
  getStokDurumu,
  addStokHareket,
  getStokHareketleri,
  getAllStokHareketleri
};