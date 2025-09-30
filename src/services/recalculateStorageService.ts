import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { ref, listAll, getMetadata } from 'firebase/storage';
import { db, storage } from '../lib/firebase';
import { Company } from '../types';

/**
 * Şirketin gerçek depolama kullanımını hesaplar ve günceller
 * Bu fonksiyon tüm dosyaları tarayarak gerçek kullanımı hesaplar
 */
export const recalculateStorageForCompany = async (companyId: string): Promise<{
  storageUsedMB: number;
  fileCount: number;
  breakdown: Record<string, number>;
}> => {
  try {
    console.log(`📊 Depolama hesaplanıyor: ${companyId}`);
    
    let totalSizeInMB = 0;
    let totalFileCount = 0;
    const breakdown: Record<string, number> = {
      logos: 0,
      arizaPhotos: 0,
      bakimPhotos: 0,
      vardiyaPhotos: 0,
      documents: 0,
      other: 0
    };

    // Kategori belirleme fonksiyonu
    const getCategoryFromPath = (filePath: string): string => {
      const path = filePath.toLowerCase();
      if (path.includes('/logo')) return 'logos';
      if (path.includes('/ariza')) return 'arizaPhotos';
      if (path.includes('/bakim')) return 'bakimPhotos';
      if (path.includes('/vardiya')) return 'vardiyaPhotos';
      if (path.includes('/document') || path.includes('/belge')) return 'documents';
      return 'other';
    };

    // Recursive olarak tüm dosyaları tara
    const scanFolder = async (folderPath: string) => {
      try {
        const folderRef = ref(storage, folderPath);
        const result = await listAll(folderRef);
        
        // Dosyaları işle
        for (const itemRef of result.items) {
          try {
            const metadata = await getMetadata(itemRef);
            const sizeInMB = (metadata.size || 0) / (1024 * 1024);
            
            totalSizeInMB += sizeInMB;
            totalFileCount++;
            
            // Kategori bazında breakdown
            const category = getCategoryFromPath(itemRef.fullPath);
            breakdown[category] = (breakdown[category] || 0) + sizeInMB;
            
          } catch (err) {
            console.warn(`Dosya metadata alınamadı: ${itemRef.fullPath}`);
          }
        }
        
        // Alt klasörleri tara
        for (const prefixRef of result.prefixes) {
          await scanFolder(prefixRef.fullPath);
        }
        
      } catch (err) {
        console.warn(`Klasör taranamadı: ${folderPath}`);
      }
    };

    // Ana klasörü tara
    const mainPath = `companies/${companyId}`;
    await scanFolder(mainPath);

    // Sonuçları yuvarla
    const finalStorageUsedMB = Math.round(totalSizeInMB * 100) / 100;
    
    // Breakdown değerlerini yuvarla
    Object.keys(breakdown).forEach(key => {
      breakdown[key] = Math.round(breakdown[key] * 100) / 100;
    });

    // Company metrics'i güncelle
    const companyRef = doc(db, 'companies', companyId);
    await updateDoc(companyRef, {
      'metrics.storageUsedMB': finalStorageUsedMB,
      'metrics.fileCount': totalFileCount,
      'metrics.breakdown': breakdown,
      'metrics.lastStorageCalculation': new Date(),
      'metrics.isReal': true
    });

    console.log(`✅ Depolama güncellendi: ${companyId}`, {
      storageUsedMB: finalStorageUsedMB,
      storageUsedGB: (finalStorageUsedMB / 1024).toFixed(2) + ' GB',
      fileCount: totalFileCount,
      breakdown
    });

    return {
      storageUsedMB: finalStorageUsedMB,
      fileCount: totalFileCount,
      breakdown
    };
    
  } catch (error) {
    console.error('Depolama hesaplama hatası:', error);
    throw error;
  }
};

/**
 * Şirketin depolama limitini kontrol eder
 */
export const checkStorageLimit = async (companyId: string): Promise<{
  used: number;
  limit: number;
  percentage: number;
  isOverLimit: boolean;
}> => {
  try {
    const companyDoc = await getDoc(doc(db, 'companies', companyId));
    const company = companyDoc.data() as Company;
    
    if (!company) {
      throw new Error('Şirket bulunamadı');
    }

    // Gerçek kullanımı al
    const usedMB = company.metrics?.storageUsedMB || 0;
    
    // Limiti belirle
    let limitMB = 5120; // Varsayılan 5GB
    if (company.subscriptionLimits?.storageLimit) {
      limitMB = company.subscriptionLimits.storageLimit;
    } else {
      // Plan bazında limit
      const plan = company.subscriptionPlan?.toLowerCase();
      if (plan === 'starter') limitMB = 5 * 1024;
      else if (plan === 'professional') limitMB = 50 * 1024;
      else if (plan === 'enterprise') limitMB = 100 * 1024;
    }

    const percentage = (usedMB / limitMB) * 100;
    const isOverLimit = usedMB > limitMB;

    return {
      used: usedMB,
      limit: limitMB,
      percentage: Math.round(percentage * 100) / 100,
      isOverLimit
    };
    
  } catch (error) {
    console.error('Depolama limit kontrolü hatası:', error);
    throw error;
  }
};
