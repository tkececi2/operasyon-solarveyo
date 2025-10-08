import { doc, onSnapshot, collection, query, where, getDocs } from 'firebase/firestore';
import { ref, uploadBytesResumable, deleteObject } from 'firebase/storage';
import { db, storage } from '../lib/firebase';
import { fastCalculateStorage } from './fastStorageService';
import { Company } from '../types';

// Storage işlemlerini takip için interceptor
class StorageInterceptor {
  private updateQueue = new Map<string, NodeJS.Timeout>();
  private readonly DEBOUNCE_TIME = 5000; // 5 saniye bekle

  /**
   * Dosya yükleme sonrası storage güncelle
   */
  async onFileUpload(companyId: string, filePath: string, fileSize: number) {
    console.log(`📤 File uploaded: ${filePath} (${(fileSize / 1024 / 1024).toFixed(2)}MB)`);
    this.scheduleUpdate(companyId);
  }

  /**
   * Dosya silme sonrası storage güncelle
   */
  async onFileDelete(companyId: string, filePath: string) {
    console.log(`🗑️ File deleted: ${filePath}`);
    this.scheduleUpdate(companyId);
  }

  /**
   * Debounced update - Birden fazla işlem olursa bekle
   */
  private scheduleUpdate(companyId: string) {
    // Önceki timer'ı iptal et
    const existingTimer = this.updateQueue.get(companyId);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Yeni timer başlat
    const timer = setTimeout(async () => {
      console.log(`🔄 Auto-updating storage for company: ${companyId}`);
      try {
        await fastCalculateStorage(companyId, true); // Force refresh
        console.log(`✅ Storage auto-updated for: ${companyId}`);
      } catch (error) {
        console.error(`❌ Auto-update failed for ${companyId}:`, error);
      }
      this.updateQueue.delete(companyId);
    }, this.DEBOUNCE_TIME);

    this.updateQueue.set(companyId, timer);
  }

  /**
   * Tüm bekleyen güncellemeleri iptal et
   */
  clearAll() {
    this.updateQueue.forEach(timer => clearTimeout(timer));
    this.updateQueue.clear();
  }
}

// Global interceptor instance
export const storageInterceptor = new StorageInterceptor();

/**
 * Enhanced upload function - Storage'ı otomatik günceller
 */
export const uploadFileWithAutoUpdate = async (
  companyId: string,
  filePath: string,
  file: File | Blob,
  onProgress?: (progress: number) => void
): Promise<string> => {
  const storageRef = ref(storage, filePath);
  const uploadTask = uploadBytesResumable(storageRef, file);

  return new Promise((resolve, reject) => {
    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        if (onProgress) onProgress(progress);
      },
      (error) => {
        console.error('Upload error:', error);
        reject(error);
      },
      async () => {
        const downloadURL = await uploadTask.snapshot.ref.getDownloadURL();
        
        // Auto-update storage metrics
        await storageInterceptor.onFileUpload(
          companyId,
          filePath,
          file.size || 0
        );
        
        resolve(downloadURL);
      }
    );
  });
};

/**
 * Enhanced delete function - Storage'ı otomatik günceller
 */
export const deleteFileWithAutoUpdate = async (
  companyId: string,
  filePath: string
): Promise<void> => {
  try {
    const fileRef = ref(storage, filePath);
    await deleteObject(fileRef);
    
    // Auto-update storage metrics
    await storageInterceptor.onFileDelete(companyId, filePath);
  } catch (error) {
    console.error('Delete error:', error);
    throw error;
  }
};

/**
 * Periyodik storage güncelleme (her gece çalışacak)
 */
export const runNightlyStorageUpdate = async () => {
  console.log('🌙 Starting nightly storage update...');
  const startTime = Date.now();
  
  try {
    // Tüm aktif şirketleri al
    const companiesSnapshot = await getDocs(
      query(
        collection(db, 'companies'),
        where('isActive', '!=', false)
      )
    );

    let successCount = 0;
    let errorCount = 0;

    // Her şirket için storage hesapla (batch processing)
    const batchSize = 5;
    const companies = companiesSnapshot.docs;
    
    for (let i = 0; i < companies.length; i += batchSize) {
      const batch = companies.slice(i, i + batchSize);
      
      const promises = batch.map(async (companyDoc) => {
        try {
          const companyId = companyDoc.id;
          await fastCalculateStorage(companyId, true); // Force refresh
          successCount++;
          console.log(`✅ Updated: ${companyId}`);
        } catch (error) {
          errorCount++;
          console.error(`❌ Failed: ${companyDoc.id}`, error);
        }
      });
      
      await Promise.all(promises);
      
      // Rate limiting - bekle
      if (i + batchSize < companies.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    const duration = Date.now() - startTime;
    console.log(`🌟 Nightly update completed in ${duration}ms`);
    console.log(`   Success: ${successCount}, Errors: ${errorCount}`);
    
    return {
      success: successCount,
      errors: errorCount,
      duration
    };
    
  } catch (error) {
    console.error('❌ Nightly update failed:', error);
    throw error;
  }
};

/**
 * Real-time company storage listener
 * Şirket storage değişikliklerini dinler
 */
export const setupCompanyStorageListener = (
  companyId: string,
  onUpdate: (metrics: {
    storageUsedMB: number;
    fileCount: number;
    percentage: number;
    isOverLimit: boolean;
  }) => void
) => {
  const companyRef = doc(db, 'companies', companyId);
  
  return onSnapshot(companyRef, (doc) => {
    const data = doc.data() as Company;
    if (data?.metrics) {
      const limitMB = data.subscriptionLimits?.storageLimit || 5120;
      const usedMB = data.metrics.storageUsedMB || 0;
      const percentage = (usedMB / limitMB) * 100;
      
      onUpdate({
        storageUsedMB: usedMB,
        fileCount: data.metrics.fileCount || 0,
        percentage: Math.round(percentage * 100) / 100,
        isOverLimit: usedMB > limitMB
      });
    }
  });
};

/**
 * Storage limit uyarı sistemi
 */
export const checkStorageWarnings = async (companyId: string): Promise<{
  shouldWarn: boolean;
  message?: string;
  percentage: number;
}> => {
  try {
    const companyDoc = await getDocs(
      query(
        collection(db, 'companies'),
        where('__name__', '==', companyId)
      )
    );
    
    const company = companyDoc.docs[0]?.data() as Company;
    if (!company) {
      return { shouldWarn: false, percentage: 0 };
    }
    
    const limitMB = company.subscriptionLimits?.storageLimit || 5120;
    const usedMB = company.metrics?.storageUsedMB || 0;
    const percentage = (usedMB / limitMB) * 100;
    
    if (percentage >= 100) {
      return {
        shouldWarn: true,
        message: '⛔ Depolama limitiniz doldu! Lütfen planınızı yükseltin.',
        percentage
      };
    } else if (percentage >= 90) {
      return {
        shouldWarn: true,
        message: '⚠️ Depolama alanınızın %90\'ı dolu!',
        percentage
      };
    } else if (percentage >= 80) {
      return {
        shouldWarn: true,
        message: '📊 Depolama alanınızın %80\'i dolu.',
        percentage
      };
    }
    
    return { shouldWarn: false, percentage };
    
  } catch (error) {
    console.error('Storage warning check failed:', error);
    return { shouldWarn: false, percentage: 0 };
  }
};
