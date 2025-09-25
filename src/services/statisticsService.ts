import { 
  collection, 
  query, 
  where, 
  getDocs,
  Timestamp
} from 'firebase/firestore';
import { ref, listAll, getMetadata } from 'firebase/storage';
import { storage } from '../lib/firebase';
import { getStorageMetrics } from './storageService';
import { db } from '../lib/firebase';
import { getAllEkipUyeleri } from './ekipService';
import { getFaultStatistics } from './arizaService';
import { getSahaStats } from './sahaService';
import { getSantralIstatistikleri } from './santralService';
import { getAllStoklar } from './stokService';

export interface CompanyStatistics {
  kullanicilar: {
    toplam: number;
    aktif: number;
    yonetici: number;
    muhendis: number;
    tekniker: number;
    musteri: number;
    bekci: number;
  };
  arizalar: {
    buAy: number;
    acik: number;
    cozuldu: number;
    kritik: number;
  };
  sahalar: {
    toplam: number;
    aktif: number;
    toplamKapasite: number;
  };
  santraller: {
    toplam: number;
    aktif: number;
    toplamKapasite: number;
    aylikUretim: number;
  };
  stok: {
    toplam: number;
    kritik: number;
    toplamDeger: number;
  };
  depolama: {
    kullanilan: number;
    limit: number;
    yuzde: number;
    isReal?: boolean; // Gerçek veri mi tahmini mi?
  };
}

// Şirket istatistiklerini getir
export const getCompanyStatistics = async (companyId: string): Promise<CompanyStatistics> => {
  try {
    // Paralel olarak tüm verileri çek
    const [
      ekipUyeleri,
      arizaStats,
      sahaStats,
      santralStats,
      stoklar
    ] = await Promise.all([
      getAllEkipUyeleri(companyId),
      getFaultStatistics(companyId),
      getSahaStats(companyId),
      getSantralIstatistikleri(companyId),
      getAllStoklar(companyId)
    ]);

    // Bu ayın başlangıç ve bitiş tarihlerini hesapla
    const now = new Date();
    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfCurrentMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Bu ay oluşturulan arızaları say
    const buAyArizaQuery = query(
      collection(db, 'arizalar'),
      where('companyId', '==', companyId),
      where('olusturmaTarihi', '>=', Timestamp.fromDate(startOfCurrentMonth)),
      where('olusturmaTarihi', '<=', Timestamp.fromDate(endOfCurrentMonth))
    );
    const buAyArizaSnapshot = await getDocs(buAyArizaQuery);
    const buAyArizaSayisi = buAyArizaSnapshot.size;

    // Kullanıcı istatistikleri
    const kullaniciStats = {
      toplam: ekipUyeleri.length,
      aktif: ekipUyeleri.filter(u => u.aktif !== false).length,
      yonetici: ekipUyeleri.filter(u => u.rol === 'yonetici').length,
      muhendis: ekipUyeleri.filter(u => u.rol === 'muhendis').length,
      tekniker: ekipUyeleri.filter(u => u.rol === 'tekniker').length,
      musteri: ekipUyeleri.filter(u => u.rol === 'musteri').length,
      bekci: ekipUyeleri.filter(u => u.rol === 'bekci').length
    };

    // Stok istatistikleri
    const stokStats = {
      toplam: stoklar.length,
      kritik: stoklar.filter(s => s.miktar <= s.minimumStok).length,
      toplamDeger: stoklar.reduce((total, stok) => {
        return total + (stok.miktar * stok.birimFiyat);
      }, 0)
    };

    // Şirket bilgilerini al (abonelik limitleri için)
    const companyDoc = await getDocs(
      query(collection(db, 'companies'), where('__name__', '==', companyId))
    );
    const companyData = companyDoc.docs[0]?.data();
    
    // Depolama limitini önce abonelik limitlerinden al
    let storageLimit = 5120; // Varsayılan 5GB
    
    if (companyData?.subscriptionLimits?.storageLimit) {
      storageLimit = companyData.subscriptionLimits.storageLimit;
    } else {
      // Fallback: Plan bazında belirle
      const plan = companyData?.subscriptionPlan?.toLowerCase();
      if (plan === 'premium' || plan === 'professional') {
        storageLimit = 20480; // 20GB
      } else if (plan === 'enterprise') {
        storageLimit = 102400; // 100GB
      }
    }
    
    // Modern SaaS yaklaşımı: Cached metrics kullan (O(1) database read)
    const storageMetrics = await getStorageMetrics(companyId);
    const realStorageUsage = storageMetrics.storageUsedMB || 0;
    
    // MB'dan GB'a çevir
    const kullanilan = realStorageUsage / 1024;
    const limit = storageLimit / 1024;
    const yuzde = Math.round((realStorageUsage / storageLimit) * 100);
    
    const depolamaStats = {
      kullanilan: parseFloat(kullanilan.toFixed(2)), // GB
      limit: Math.round(limit), // GB
      yuzde: Math.min(yuzde, 100), // %
      isReal: true // Modern SaaS: Her zaman cached metrics kullan
    };



    // Bu ayın santral üretimi (simüle edilmiş - gerçek implementasyonda üretim verileri kullanılmalı)
    const aylikUretim = santralStats.toplamKapasite * 24 * 30 * 0.15; // Basit hesaplama

    return {
      kullanicilar: kullaniciStats,
      arizalar: {
        buAy: buAyArizaSayisi,
        acik: arizaStats.acik,
        cozuldu: arizaStats.cozuldu,
        kritik: arizaStats.kritik
      },
      sahalar: sahaStats,
      santraller: {
        toplam: santralStats.toplamSantral,
        aktif: santralStats.aktifSantraller,
        toplamKapasite: santralStats.toplamKapasite,
        aylikUretim: Math.round(aylikUretim)
      },
      stok: stokStats,
      depolama: depolamaStats
    };
  } catch (error) {
    console.error('İstatistikler getirme hatası:', error);
    throw error;
  }
};

// Abonelik kullanım istatistikleri
export const getSubscriptionUsageStats = async (companyId: string) => {
  try {
    const stats = await getCompanyStatistics(companyId);
    
    // Şirket bilgilerini al (kullanıcı limiti için)
    const companyDoc = await getDocs(
      query(collection(db, 'companies'), where('__name__', '==', companyId))
    );
    const companyData = companyDoc.docs[0]?.data();
    
    // Kullanıcı limitini önce abonelik limitlerinden al
    let userLimit = 10; // Varsayılan Basic
    
    if (companyData?.subscriptionLimits?.users) {
      userLimit = companyData.subscriptionLimits.users;
    } else {
      // Fallback: Plan bazında belirle
      const plan = companyData?.subscriptionPlan?.toLowerCase();
      if (plan === 'premium' || plan === 'professional') {
        userLimit = 50;
      } else if (plan === 'enterprise') {
        userLimit = 999; // Sınırsız
      }
    }
    
    return {
      kullaniciSayisi: stats.kullanicilar.toplam,
      kullaniciLimiti: userLimit,
      depolamaKullanimi: `${stats.depolama.kullanilan} GB`,
      depolamaLimiti: `${stats.depolama.limit} GB`,
      sahaSayisi: stats.sahalar.toplam,
      santralSayisi: stats.santraller.toplam,
      arizaSayisi: stats.arizalar.buAy,
      kullaniciYuzdesi: Math.round((stats.kullanicilar.toplam / userLimit) * 100),
      depolamaYuzdesi: stats.depolama.yuzde
    };
  } catch (error) {
    console.error('Abonelik kullanım istatistikleri hatası:', error);
    throw error;
  }
};

// Firebase Storage'dan gerçek depolama kullanımını hesapla
export const calculateRealStorageUsage = async (companyId: string): Promise<number> => {
  try {
    let totalSizeInMB = 0;
    
    // Şirketin tüm dosyalarını kontrol et
    const folders = [
      `companies/${companyId}/logos`,
      `companies/${companyId}/arizalar`,
      `companies/${companyId}/santraller`,
      `companies/${companyId}/sahalar`,
      `companies/${companyId}/vardiya`,
      `companies/${companyId}/stok`,
      `companies/${companyId}/bakimlar`,
      `companies/${companyId}/documents`
    ];

    for (const folderPath of folders) {
      try {
        const folderRef = ref(storage, folderPath);
        const result = await listAll(folderRef);
        
        // Her dosyanın boyutunu al
        for (const itemRef of result.items) {
          try {
            const metadata = await getMetadata(itemRef);
            totalSizeInMB += (metadata.size || 0) / (1024 * 1024); // Bytes'dan MB'a çevir
          } catch (metadataError) {
            console.warn(`Metadata alınamadı: ${itemRef.fullPath}`, metadataError);
          }
        }
        
        // Alt klasörleri de kontrol et (recursive)
        for (const prefixRef of result.prefixes) {
          const subResult = await listAll(prefixRef);
          for (const subItemRef of subResult.items) {
            try {
              const metadata = await getMetadata(subItemRef);
              totalSizeInMB += (metadata.size || 0) / (1024 * 1024);
            } catch (metadataError) {
              console.warn(`Sub metadata alınamadı: ${subItemRef.fullPath}`, metadataError);
            }
          }
        }
      } catch (folderError) {
        console.warn(`Klasör kontrol edilemedi: ${folderPath}`, folderError);
      }
    }
    
    return Math.round(totalSizeInMB * 100) / 100; // 2 ondalık basamak
  } catch (error) {
    console.error('Gerçek depolama hesaplama hatası:', error);
    throw error;
  }
};

// Depolama kullanımı detaylarını getir
export const getStorageUsageDetails = async (companyId: string) => {
  try {
    const folders = [
      { name: 'Logolar', path: `companies/${companyId}/logos` },
      { name: 'Arıza Dosyaları', path: `companies/${companyId}/arizalar` },
      { name: 'Santral Belgeleri', path: `companies/${companyId}/santraller` },
      { name: 'Saha Dosyaları', path: `companies/${companyId}/sahalar` },
      { name: 'Vardiya Fotoğrafları', path: `companies/${companyId}/vardiya` },
      { name: 'Stok Resimleri', path: `companies/${companyId}/stok` },
      { name: 'Bakım Belgeleri', path: `companies/${companyId}/bakimlar` },
      { name: 'Diğer Belgeler', path: `companies/${companyId}/documents` }
    ];

    const details = [];
    
    for (const folder of folders) {
      try {
        const folderRef = ref(storage, folder.path);
        const result = await listAll(folderRef);
        
        let folderSizeInMB = 0;
        let fileCount = 0;
        
        for (const itemRef of result.items) {
          try {
            const metadata = await getMetadata(itemRef);
            folderSizeInMB += (metadata.size || 0) / (1024 * 1024);
            fileCount++;
          } catch (error) {
            console.warn(`Dosya metadata hatası: ${itemRef.fullPath}`, error);
          }
        }
        
        details.push({
          name: folder.name,
          sizeInMB: Math.round(folderSizeInMB * 100) / 100,
          fileCount,
          path: folder.path
        });
      } catch (error) {
        console.warn(`Klasör detay hatası: ${folder.path}`, error);
        details.push({
          name: folder.name,
          sizeInMB: 0,
          fileCount: 0,
          path: folder.path,
          error: true
        });
      }
    }
    
    return details;
  } catch (error) {
    console.error('Depolama detay hatası:', error);
    throw error;
  }
};
