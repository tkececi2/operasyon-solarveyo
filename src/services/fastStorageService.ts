import { doc, updateDoc, getDoc, onSnapshot } from 'firebase/firestore';
import { ref, listAll, getMetadata } from 'firebase/storage';
import { db, storage } from '../lib/firebase';
import { Company } from '../types';

interface StorageMetrics {
  storageUsedMB: number;
  fileCount: number;
  breakdown: Record<string, number>;
  lastCalculated: Date;
}

// Cache için memory storage
const storageCache = new Map<string, {
  metrics: StorageMetrics;
  timestamp: number;
}>();

// Cache süresi (5 dakika)
const CACHE_DURATION = 5 * 60 * 1000;

/**
 * Hızlı storage hesaplama - Parallel işlem ve cache kullanır
 */
export const fastCalculateStorage = async (companyId: string, forceRefresh = false): Promise<StorageMetrics> => {
  // Cache kontrolü
  if (!forceRefresh) {
    const cached = storageCache.get(companyId);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log('📦 Cache hit for:', companyId);
      return cached.metrics;
    }
  }

  console.log('🚀 Fast storage calculation starting for:', companyId);
  const startTime = Date.now();

  try {
    const breakdown: Record<string, number> = {
      logos: 0,
      arizaPhotos: 0,
      bakimPhotos: 0,
      vardiyaPhotos: 0,
      documents: 0,
      other: 0
    };

    let totalSizeInMB = 0;
    let totalFileCount = 0;
    const scannedFolders = new Set<string>();
    const filesByType = new Map<string, number>();

    // Kategori belirleme - Daha kapsamlı
    const getCategoryFromPath = (filePath: string): string => {
      const path = filePath.toLowerCase();
      
      // Logo ve profil fotoğrafları
      if (path.includes('/logo') || path.includes('/profile')) return 'logos';
      
      // Arıza fotoğrafları ve belgeleri
      if (path.includes('/ariza') || path.includes('/fault')) return 'arizaPhotos';
      
      // Bakım fotoğrafları (elektrik ve mekanik dahil)
      if (path.includes('/bakim') || path.includes('/elektrik') || path.includes('/mekanik') || path.includes('/maintenance')) return 'bakimPhotos';
      
      // Vardiya ve vardiya bildirimleri
      if (path.includes('/vardiya')) return 'vardiyaPhotos';
      
      // Stok fotoğrafları
      if (path.includes('/stok') || path.includes('/inventory')) return 'vardiyaPhotos';
      
      // Santral ve saha görselleri
      if (path.includes('/santral') || path.includes('/saha') || path.includes('/plant') || path.includes('/field')) return 'vardiyaPhotos';
      
      // Belgeler, raporlar ve export'lar
      if (path.includes('/document') || path.includes('/report') || path.includes('/export') || path.includes('.pdf') || path.includes('.xlsx') || path.includes('.docx')) return 'documents';
      
      return 'other';
    };

    // Paralel dosya işleme
    const processFiles = async (items: any[]) => {
      const promises = items.map(async (itemRef) => {
        try {
          const metadata = await getMetadata(itemRef);
          return {
            size: (metadata.size || 0) / (1024 * 1024),
            category: getCategoryFromPath(itemRef.fullPath)
          };
        } catch (err) {
          console.warn(`Skipping file: ${itemRef.fullPath}`);
          return null;
        }
      });

      const results = await Promise.all(promises);
      
      results.forEach(result => {
        if (result) {
          totalSizeInMB += result.size;
          totalFileCount++;
          breakdown[result.category] = (breakdown[result.category] || 0) + result.size;
        }
      });
    };

    // Recursive klasör tarama fonksiyonu - TÜM SEVİYELER
    const scanFolderRecursive = async (folderPath: string, depth = 0) => {
      if (depth > 10) { // Max derinlik koruması
        console.warn(`Max depth reached for: ${folderPath}`);
        return;
      }

      try {
        const folderRef = ref(storage, folderPath);
        const result = await listAll(folderRef);
        
        // Klasörü taranan olarak işaretle
        scannedFolders.add(folderPath);
        
        // Bu klasördeki dosyaları işle
        if (result.items.length > 0) {
          console.log(`📁 Scanning ${result.items.length} files in: ${folderPath}`);
          await processFiles(result.items);
        }

        // Alt klasörleri paralel olarak recursive tara
        if (result.prefixes.length > 0) {
          console.log(`📂 Found ${result.prefixes.length} subfolders in: ${folderPath}`);
          const subFolderPromises = result.prefixes.map(prefix => 
            scanFolderRecursive(prefix.fullPath, depth + 1)
          );
          
          // Batch halinde işle (max 10 paralel)
          const batchSize = 10;
          for (let i = 0; i < subFolderPromises.length; i += batchSize) {
            const batch = subFolderPromises.slice(i, i + batchSize);
            await Promise.all(batch);
          }
        }
      } catch (err) {
        console.warn(`Folder scan error at depth ${depth}: ${folderPath}`, err);
      }
    };

    // Ana klasörden başla - TÜM ALT KLASÖRLER DAHİL
    const mainPath = `companies/${companyId}`;
    
    try {
      // Tüm klasör yapısını recursive tara
      await scanFolderRecursive(mainPath);
      
      // Ek olarak bilinen özel klasörleri de kontrol et
      const specialFolders = [
        `companies/${companyId}/arizalar`,
        `companies/${companyId}/santraller`,
        `companies/${companyId}/sahalar`,
        `companies/${companyId}/vardiya`,
        `companies/${companyId}/vardiyaBildirimleri`,
        `companies/${companyId}/stok`,
        `companies/${companyId}/stoklar`,
        `companies/${companyId}/bakimlar`,
        `companies/${companyId}/elektrikBakimlar`,
        `companies/${companyId}/mekanikBakimlar`,
        `companies/${companyId}/documents`,
        `companies/${companyId}/logos`,
        `companies/${companyId}/profilePhotos`,
        `companies/${companyId}/exports`,
        `companies/${companyId}/reports`
      ];
      
      // Özel klasörleri de tara (eğer ana taramada atlandıysa)
      for (const folder of specialFolders) {
        try {
          const folderRef = ref(storage, folder);
          const result = await listAll(folderRef);
          if (result.items.length > 0) {
            await processFiles(result.items);
          }
        } catch (err) {
          // Klasör yoksa sessizce geç
        }
      }
      
    } catch (err) {
      console.error('Main folder scan error:', err);
      // Boş sonuç dönmek yerine, en azından cache'den eski veriyi dönelim
      const cached = storageCache.get(companyId);
      if (cached) {
        return cached.metrics;
      }
    }

    // Sonuçları yuvarla
    const finalStorageUsedMB = Math.round(totalSizeInMB * 100) / 100;
    Object.keys(breakdown).forEach(key => {
      breakdown[key] = Math.round(breakdown[key] * 100) / 100;
    });

    const metrics: StorageMetrics = {
      storageUsedMB: finalStorageUsedMB,
      fileCount: totalFileCount,
      breakdown,
      lastCalculated: new Date()
    };

    // Cache'e kaydet
    storageCache.set(companyId, {
      metrics,
      timestamp: Date.now()
    });

    // Firestore'a kaydet (async - beklemiyoruz)
    updateStorageMetrics(companyId, metrics).catch(console.error);

    const endTime = Date.now();
    console.log(`✅ Fast calculation completed in ${endTime - startTime}ms:`, {
      companyId,
      storageUsedMB: finalStorageUsedMB,
      storageUsedGB: (finalStorageUsedMB / 1024).toFixed(2) + ' GB',
      fileCount: totalFileCount,
      foldersScanned: scannedFolders.size,
      folders: Array.from(scannedFolders),
      breakdown,
      duration: `${endTime - startTime}ms`
    });

    return metrics;

  } catch (error) {
    console.error('Fast storage calculation error:', error);
    
    // Hata durumunda cache'den dön
    const cached = storageCache.get(companyId);
    if (cached) {
      return cached.metrics;
    }
    
    // Cache yoksa boş metrics dön
    return {
      storageUsedMB: 0,
      fileCount: 0,
      breakdown: {
        logos: 0,
        arizaPhotos: 0,
        bakimPhotos: 0,
        vardiyaPhotos: 0,
        documents: 0,
        other: 0
      },
      lastCalculated: new Date()
    };
  }
};

/**
 * Firestore'a metrics kaydet
 */
const updateStorageMetrics = async (companyId: string, metrics: StorageMetrics) => {
  try {
    const companyRef = doc(db, 'companies', companyId);
    await updateDoc(companyRef, {
      'metrics.storageUsedMB': metrics.storageUsedMB,
      'metrics.fileCount': metrics.fileCount,
      'metrics.breakdown': metrics.breakdown,
      'metrics.lastStorageCalculation': metrics.lastCalculated,
      'metrics.isReal': true
    });
  } catch (error) {
    console.error('Failed to update Firestore metrics:', error);
  }
};

/**
 * Real-time storage listener - Dosya değişikliklerini dinler
 */
export const setupStorageListener = (companyId: string, callback: (metrics: StorageMetrics) => void) => {
  // Firestore listener - metrics değişikliklerini dinle
  const companyRef = doc(db, 'companies', companyId);
  
  const unsubscribe = onSnapshot(companyRef, (doc) => {
    const data = doc.data() as Company;
    if (data?.metrics) {
      const metrics: StorageMetrics = {
        storageUsedMB: data.metrics.storageUsedMB || 0,
        fileCount: data.metrics.fileCount || 0,
        breakdown: data.metrics.breakdown || {},
        lastCalculated: data.metrics.lastStorageCalculation?.toDate() || new Date()
      };
      callback(metrics);
    }
  });

  return unsubscribe;
};

/**
 * Batch storage calculation - Birden fazla şirket için
 */
export const batchCalculateStorage = async (companyIds: string[]): Promise<Map<string, StorageMetrics>> => {
  console.log(`📊 Batch calculation for ${companyIds.length} companies`);
  
  const results = new Map<string, StorageMetrics>();
  
  // Paralel hesaplama - max 5 concurrent
  const chunks = [];
  for (let i = 0; i < companyIds.length; i += 5) {
    chunks.push(companyIds.slice(i, i + 5));
  }

  for (const chunk of chunks) {
    const promises = chunk.map(id => 
      fastCalculateStorage(id)
        .then(metrics => results.set(id, metrics))
        .catch(err => console.error(`Failed for ${id}:`, err))
    );
    await Promise.all(promises);
  }

  return results;
};

/**
 * Storage limit kontrolü
 */
export const checkStorageLimitFast = async (companyId: string): Promise<{
  used: number;
  limit: number;
  percentage: number;
  isOverLimit: boolean;
  isNearLimit: boolean;
}> => {
  // Hızlı hesaplama
  const metrics = await fastCalculateStorage(companyId);
  
  // Şirket bilgilerini al
  const companyDoc = await getDoc(doc(db, 'companies', companyId));
  const company = companyDoc.data() as Company;
  
  // Limit belirleme
  let limitMB = 5120; // Default 5GB
  if (company?.subscriptionLimits?.storageLimit) {
    limitMB = company.subscriptionLimits.storageLimit;
  }
  
  const percentage = (metrics.storageUsedMB / limitMB) * 100;
  
  return {
    used: metrics.storageUsedMB,
    limit: limitMB,
    percentage: Math.round(percentage * 100) / 100,
    isOverLimit: metrics.storageUsedMB > limitMB,
    isNearLimit: percentage > 80
  };
};

/**
 * Clear cache for a company
 */
export const clearStorageCache = (companyId?: string) => {
  if (companyId) {
    storageCache.delete(companyId);
  } else {
    storageCache.clear();
  }
};
