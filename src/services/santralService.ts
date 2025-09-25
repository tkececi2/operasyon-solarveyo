import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  serverTimestamp,
  getDoc,
  setDoc 
} from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface Santral {
  id: string;
  ad: string;
  sahaId: string;
  sahaAdi: string;
  musteriAdi: string;
  kapasite: number; // kW
  konum: {
    lat: number;
    lng: number;
    adres: string;
  };
  kurulumTarihi: any; // Firebase Timestamp
  elektrikFiyati: number; // TL/kWh
  dagitimBedeli: number; // TL/kWh
  durum: 'aktif' | 'bakim' | 'ariza' | 'pasif';
  
  // Tahmini üretim değerleri
  yillikHedefUretim: number; // kWh
  aylikHedefUretim: number; // kWh
  gunlukHedefUretim: number; // kWh
  yazVerimlilikOrani: number; // %
  kisVerimlilikOrani: number; // %
  
  // Gerçek üretim değerleri
  sonUretim: number; // kWh (günlük)
  performans: number; // %
  toplamUretim: number; // kWh (toplam)
  
  // Teknik detaylar
  panelSayisi?: number;
  panelGucu?: number; // W
  inverterSayisi?: number;
  
  // Diğer
  musteriSayisi: number;
  companyId: string;
  aktif: boolean;
  aciklama?: string;
  olusturmaTarihi: any; // Firebase Timestamp
  guncellenmeTarihi: any; // Firebase Timestamp
}

// Santral oluştur
export const createSantral = async (santralData: Omit<Santral, 'id' | 'olusturmaTarihi' | 'guncellenmeTarihi'>): Promise<Santral> => {
  try {
    const docRef = await addDoc(collection(db, 'santraller'), {
      ...santralData,
      toplamUretim: 0, // Başlangıçta 0
      olusturmaTarihi: serverTimestamp(),
      guncellenmeTarihi: serverTimestamp(),
    });

    const newSantral = {
      id: docRef.id,
      ...santralData,
      toplamUretim: 0,
      olusturmaTarihi: new Date(),
      guncellenmeTarihi: new Date(),
    };

    console.log('Santral oluşturuldu:', newSantral);
    return newSantral;
  } catch (error) {
    console.error('Santral oluşturma hatası:', error);
    throw new Error('Santral oluşturulamadı');
  }
};

// Santral güncelle
export const updateSantral = async (santralId: string, santralData: Partial<Santral>): Promise<void> => {
  try {
    const santralRef = doc(db, 'santraller', santralId);
    await updateDoc(santralRef, {
      ...santralData,
      guncellenmeTarihi: serverTimestamp(),
    });
    console.log('Santral güncellendi:', santralId);
  } catch (error) {
    console.error('Santral güncelleme hatası:', error);
    throw new Error('Santral güncellenemedi');
  }
};

// Santral sil
export const deleteSantral = async (santralId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'santraller', santralId));
    console.log('Santral silindi:', santralId);
  } catch (error) {
    console.error('Santral silme hatası:', error);
    throw new Error('Santral silinemedi');
  }
};

// Tüm santralları getir (rol bazlı filtreleme ile)
export const getAllSantraller = async (companyId?: string, userRole?: string, userSantraller?: string[]): Promise<Santral[]> => {
  try {
    // CompanyId kontrolü
    if (!companyId) {
      console.log('getAllSantraller: companyId boş');
      return [];
    }
    
    const q = query(
      collection(db, 'santraller'),
      where('companyId', '==', companyId),
      where('aktif', '==', true)
      // orderBy('olusturmaTarihi', 'desc') // Index gerekebilir
    );
    
    const querySnapshot = await getDocs(q);
    let santraller: Santral[] = [];
    
    querySnapshot.forEach((doc) => {
      santraller.push({ id: doc.id, ...doc.data() } as Santral);
    });
    
    // Müşteri/tekniker/mühendis/bekçi rollerinde sadece atanan santralları göster
    if ((userRole === 'musteri' || userRole === 'tekniker' || userRole === 'muhendis' || userRole === 'bekci') && userSantraller && userSantraller.length > 0) {
      santraller = santraller.filter(santral => userSantraller.includes(santral.id));
    }
    
    // Client-side sorting (index problemi için geçici çözüm)
    return santraller.sort((a, b) => 
      b.olusturmaTarihi.toDate().getTime() - a.olusturmaTarihi.toDate().getTime()
    );
  } catch (error) {
    console.error('Santraller getirme hatası:', error);
    throw new Error('Santraller getirilemedi');
  }
};

// Belirli bir sahanın santrallarını getir
export const getSantrallerBySaha = async (companyId: string, sahaId: string): Promise<Santral[]> => {
  try {
    const q = query(
      collection(db, 'santraller'),
      where('companyId', '==', companyId),
      where('sahaId', '==', sahaId),
      where('aktif', '==', true)
    );
    
    const querySnapshot = await getDocs(q);
    const santraller: Santral[] = [];
    
    querySnapshot.forEach((doc) => {
      santraller.push({ id: doc.id, ...doc.data() } as Santral);
    });
    
    return santraller;
  } catch (error) {
    console.error('Saha santralları getirme hatası:', error);
    throw new Error('Saha santralları getirilemedi');
  }
};

// Tek santral getir
export const getSantral = async (santralId: string): Promise<Santral | null> => {
  try {
    const docRef = doc(db, 'santraller', santralId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Santral;
    } else {
      return null;
    }
  } catch (error) {
    console.error('Santral getirme hatası:', error);
    throw new Error('Santral getirilemedi');
  }
};

// Santral üretim verisi ekle
export const addSantralUretimVerisi = async (
  santralId: string, 
  uretimVerisi: {
    tarih: Date;
    gunlukUretim: number; // kWh
    performans: number; // %
    havaKosullari?: string;
    notlar?: string;
  }
): Promise<void> => {
  try {
    // Üretim verileri alt koleksiyonu
    await addDoc(collection(db, 'santraller', santralId, 'uretimVerileri'), {
      ...uretimVerisi,
      olusturmaTarihi: serverTimestamp(),
    });

    // Santralın son üretim ve performans değerlerini güncelle
    await updateSantral(santralId, {
      sonUretim: uretimVerisi.gunlukUretim,
      performans: uretimVerisi.performans,
      guncellenmeTarihi: serverTimestamp(),
    });

    console.log('Santral üretim verisi eklendi:', santralId);
  } catch (error) {
    console.error('Üretim verisi ekleme hatası:', error);
    throw new Error('Üretim verisi eklenemedi');
  }
};

// Santral üretim verilerini getir
export const getSantralUretimVerileri = async (
  santralId: string, 
  baslangicTarihi?: Date, 
  bitisTarihi?: Date
): Promise<any[]> => {
  try {
    let q = query(
      collection(db, 'santraller', santralId, 'uretimVerileri'),
      orderBy('tarih', 'desc')
    );

    // Tarih filtreleri eklenebilir
    if (baslangicTarihi && bitisTarihi) {
      // q = query(q, where('tarih', '>=', baslangicTarihi), where('tarih', '<=', bitisTarihi));
    }

    const querySnapshot = await getDocs(q);
    const uretimVerileri: any[] = [];
    
    querySnapshot.forEach((doc) => {
      uretimVerileri.push({ id: doc.id, ...doc.data() });
    });
    
    return uretimVerileri;
  } catch (error) {
    console.error('Üretim verileri getirme hatası:', error);
    throw new Error('Üretim verileri getirilemedi');
  }
};

// Santral istatistikleri
export const getSantralIstatistikleri = async (companyId: string) => {
  try {
    const santraller = await getAllSantraller(companyId);
    
    const toplamKapasite = santraller.reduce((total, santral) => total + santral.kapasite, 0);
    const aktifSantraller = santraller.filter(s => s.durum === 'aktif').length;
    const toplamUretim = santraller.reduce((total, santral) => total + santral.sonUretim, 0);
    const ortalamaPerformans = santraller.length > 0 
      ? Math.round(santraller.reduce((total, santral) => total + santral.performans, 0) / santraller.length)
      : 0;

    return {
      toplamKapasite,
      aktifSantraller,
      toplamSantral: santraller.length,
      toplamUretim,
      ortalamaPerformans,
      santraller
    };
  } catch (error) {
    console.error('Santral istatistikleri hatası:', error);
    throw new Error('İstatistikler getirilemedi');
  }
};

// Aylık üretim verilerini getir
export const getAylikUretim = async (santralId: string, yil: number): Promise<any> => {
  try {
    // Belirli yıl için alt koleksiyondan veri getir
    const yilDocRef = doc(db, 'santraller', santralId, 'aylikUretim', String(yil));
    const yilDocSnap = await getDoc(yilDocRef);
    
    console.log(`${yil} yılı belgesi var mı:`, yilDocSnap.exists());
    
    // Varsayılan değerler
    const aylik: Record<string, number> = {
      ocak: 0, subat: 0, mart: 0, nisan: 0,
      mayis: 0, haziran: 0, temmuz: 0, agustos: 0,
      eylul: 0, ekim: 0, kasim: 0, aralik: 0
    };
    
    // Belge varsa verileri oku
    if (yilDocSnap.exists()) {
      const data = yilDocSnap.data();
      console.log(`${yil} yılı verileri:`, data);
      
      // Her ay için değerleri al
      Object.keys(aylik).forEach(ay => {
        if (data[ay] !== undefined) {
          aylik[ay] = Number(data[ay]) || 0;
        }
      });
      
      // Eğer aylik alan varsa onu da kontrol et
      if (data.aylik) {
        Object.keys(data.aylik).forEach(ay => {
          if (aylik.hasOwnProperty(ay)) {
            aylik[ay] = Number(data.aylik[ay]) || 0;
          }
        });
      }
    } else {
      console.log(`${yil} yılı için veri bulunamadı`);
      
      // Tüm belgeleri listele (debug için)
      const aylikUretimRef = collection(db, 'santraller', santralId, 'aylikUretim');
      const allDocs = await getDocs(aylikUretimRef);
      console.log('Mevcut yıllar:', allDocs.docs.map(d => d.id));
    }
    
    // Santral belgesinden tahmin verilerini de alalım
    const santralRef = doc(db, 'santraller', santralId);
    const santralSnap = await getDoc(santralRef);
    
    let tahminler: Record<string, number> = {};
    if (santralSnap.exists()) {
      const santralData = santralSnap.data();
      if (santralData.aylikTahminler) {
        tahminler = santralData.aylikTahminler;
        console.log('Tahmin verileri:', tahminler);
      }
    }
    
    const result = {
      santralId,
      yil,
      aylik, // Gerçekleşen üretim (kWh)
      tahminler // Tahmin edilen üretim (kWh)
    };
    
    console.log('Döndürülen sonuç:', result);
    return result;
    
  } catch (error) {
    console.error('Aylık üretim verisi getirme hatası:', error);
    return {
      santralId,
      yil,
      aylik: {
        ocak: 0, subat: 0, mart: 0, nisan: 0,
        mayis: 0, haziran: 0, temmuz: 0, agustos: 0,
        eylul: 0, ekim: 0, kasim: 0, aralik: 0
      }
    };
  }
};

// Aylık üretim verilerini kaydet
export const setAylikUretim = async (santralId: string, yil: number, veri: any): Promise<void> => {
  try {
    console.log('Kaydedilecek veri:', veri);
    
    // Alt koleksiyona kaydet
    if (veri.aylik) {
      // Yıl belgesine referans (örn: "2025")
      const aylikUretimDocRef = doc(db, 'santraller', santralId, 'aylikUretim', String(yil));
      
      // Veriyi alt koleksiyona kaydet
      await setDoc(aylikUretimDocRef, {
        ...veri.aylik,
        aylik: veri.aylik, // aylik alanını da ekle
        yillikToplam: Object.values(veri.aylik).reduce((sum: number, val: any) => sum + (Number(val) || 0), 0),
        co2Tasarrufukg: Object.values(veri.aylik).reduce((sum: number, val: any) => sum + (Number(val) || 0), 0) * 0.756,
        guncellenmeTarihi: serverTimestamp()
      }, { merge: true }); // merge: true ile mevcut veriyi güncelle
      
      console.log(`${yil} yılı verileri başarıyla kaydedildi`);
    }
    
  } catch (error) {
    console.error('Kaydetme hatası:', error);
    throw error;
  }
};