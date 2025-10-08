import { doc, updateDoc, increment, getDoc } from 'firebase/firestore';
import { ref, getMetadata, deleteObject, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../lib/firebase';
import { Company } from '../types';
import { SAAS_CONFIG, getPlanById } from '../config/saas.config';
import { compressImage, isImageFile } from '../utils/imageCompression';
import { logger } from '../utils/logger';
import { storageInterceptor } from './autoStorageUpdateService';

/**
 * Modern SaaS yaklaşımı: Storage hesaplama hooks
 * Gerçek zamanlı hesaplama yapmak yerine, dosya upload/delete olduğunda metrics güncellenir
 */

// Dosya yüklendiğinde metrics güncelle
export const updateStorageMetricsOnUpload = async (
  companyId: string, 
  filePath: string,
  category: 'logos' | 'arizaPhotos' | 'bakimPhotos' | 'vardiyaPhotos' | 'documents' | 'other' = 'other'
) => {
  try {
    // Dosya boyutunu al
    const fileRef = ref(storage, filePath);
    const metadata = await getMetadata(fileRef);
    const sizeInMB = metadata.size / (1024 * 1024);

    // Company metrics güncelle
    const companyRef = doc(db, 'companies', companyId);
    
    const updates = {
      'metrics.storageUsedMB': increment(sizeInMB),
      'metrics.fileCount': increment(1),
      [`metrics.breakdown.${category}`]: increment(sizeInMB),
      'metrics.lastStorageCalculation': new Date()
    };

    await updateDoc(companyRef, updates);
    
    console.log(`✅ Storage metrics updated: +${sizeInMB.toFixed(2)}MB for ${category}`);
  } catch (error) {
    console.error('Storage metrics güncellenemedi:', error);
    // Hata durumunda sessizce geç
  }
};

// Dosya silindiğinde metrics güncelle
export const updateStorageMetricsOnDelete = async (
  companyId: string, 
  filePath: string,
  category: 'logos' | 'arizaPhotos' | 'bakimPhotos' | 'vardiyaPhotos' | 'documents' | 'other' = 'other'
) => {
  try {
    // Dosya boyutunu al (silmeden önce)
    const fileRef = ref(storage, filePath);
    const metadata = await getMetadata(fileRef);
    const sizeInMB = metadata.size / (1024 * 1024);

    // Company metrics güncelle
    const companyRef = doc(db, 'companies', companyId);
    
    const updates = {
      'metrics.storageUsedMB': increment(-sizeInMB),
      'metrics.fileCount': increment(-1),
      [`metrics.breakdown.${category}`]: increment(-sizeInMB),
      'metrics.lastStorageCalculation': new Date()
    };

    await updateDoc(companyRef, updates);
    
    console.log(`✅ Storage metrics updated: -${sizeInMB.toFixed(2)}MB for ${category}`);
  } catch (error) {
    console.error('Storage metrics güncellenemedi:', error);
    // Hata durumunda sessizce geç
  }
};

// Cached storage metrics al
export const getStorageMetrics = async (companyId: string) => {
  try {
    const companyDoc = await getDoc(doc(db, 'companies', companyId));
    const company = companyDoc.data() as Company;
    
    if (company?.metrics) {
      return {
        storageUsedMB: company.metrics.storageUsedMB || 0,
        fileCount: company.metrics.fileCount || 0,
        lastCalculated: company.metrics.lastStorageCalculation,
        breakdown: company.metrics.breakdown || {
          logos: 0,
          arizaPhotos: 0,
          bakimPhotos: 0,
          vardiyaPhotos: 0,
          documents: 0,
          other: 0
        },
        isCached: true
      };
    }
    
    // Eğer metrics yoksa, şimdilik 0 döndür
    // Background job bu değerleri hesaplayacak
    return {
      storageUsedMB: 0,
      fileCount: 0,
      lastCalculated: null,
      breakdown: {
        logos: 0,
        arizaPhotos: 0,
        bakimPhotos: 0,
        vardiyaPhotos: 0,
        documents: 0,
        other: 0
      },
      isCached: false
    };
  } catch (error) {
    console.error('Storage metrics alınamadı:', error);
    throw error;
  }
};

// Dosya kategorisini path'e göre belirle
export const getCategoryFromPath = (filePath: string): 'logos' | 'arizaPhotos' | 'bakimPhotos' | 'vardiyaPhotos' | 'documents' | 'other' => {
  const path = filePath.toLowerCase();
  
  if (path.includes('/logos/') || path.includes('/logo/')) return 'logos';
  if (path.includes('/ariza') || path.includes('/fault')) return 'arizaPhotos';
  if (path.includes('/bakim') || path.includes('/maintenance')) return 'bakimPhotos';
  if (path.includes('/vardiya') || path.includes('/shift')) return 'vardiyaPhotos';
  if (path.includes('/document') || path.includes('/belge')) return 'documents';
  
  return 'other';
};

// Dosya boyut kontrolü
export const isValidFileSize = (file: File, maxSizeMB: number = 10): boolean => {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxSizeBytes;
};

// Resim dosyası kontrolü
export const isValidImageType = (file: File): boolean => {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  return validTypes.includes(file.type);
};

// Dosya boyutu formatlama
export const formatFileSize = (sizeInBytes: number): string => {
  if (sizeInBytes < 1024) return `${sizeInBytes} B`;
  if (sizeInBytes < 1024 * 1024) return `${(sizeInBytes / 1024).toFixed(1)} KB`;
  if (sizeInBytes < 1024 * 1024 * 1024) return `${(sizeInBytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(sizeInBytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
};

// Depolama kapasitesi kontrolü (hard cap)
const ensureStorageCapacity = async (companyId: string, bytesToAdd: number) => {
  try {
    const [metricsDoc, companyDoc] = await Promise.all([
      getStorageMetrics(companyId),
      getDoc(doc(db, 'companies', companyId))
    ]);

    const company = companyDoc.data() as Company | undefined;
    const usedMB = metricsDoc?.storageUsedMB || 0;
    const addMB = bytesToAdd / (1024 * 1024);
    
    // Modern SaaS config kullanarak limit al
    const planId = company?.subscriptionPlan || 'trial';
    const plan = getPlanById(planId);
    const limitMB = plan ? plan.limits.storageGB * 1024 : 500; // Default 500MB for trial

    if (usedMB + addMB > limitMB) {
      const remainingMB = Math.max(0, limitMB - usedMB);
      const remainingText = remainingMB > 1024 ? `${(remainingMB / 1024).toFixed(2)} GB` : `${remainingMB.toFixed(0)} MB`;
      throw new Error(`Depolama limiti aşılıyor. Kalan kapasite: ${remainingText}. Lütfen planınızı yükseltin veya dosya silin.`);
    }
  } catch (error) {
    if (error instanceof Error) throw error;
    throw new Error('Depolama kontrolü yapılamadı');
  }
};

// Genel dosya yükleme (geriye dönük uyumluluk)
export const uploadFile = async (
  file: File,
  filePath: string,
  companyId?: string
): Promise<string> => {
  const fileRef = ref(storage, filePath);
  try {
    if (companyId) {
      await ensureStorageCapacity(companyId, file.size);
    }
    const snapshot = await uploadBytes(fileRef, file, { contentType: file.type || 'application/octet-stream' });
    const downloadURL = await getDownloadURL(snapshot.ref);

    // Otomatik storage güncelleme - 5 saniye sonra
    if (companyId) {
      storageInterceptor.onFileUpload(companyId, filePath, file.size);
    }

    return downloadURL;
  } catch (error) {
    console.error('uploadFile hata:', error);
    throw error;
  }
};

// Multiple santral photosları için wrapper
export const uploadSantralPhotos = async (
  photos: File[],
  santralId: string,
  companyId: string
): Promise<string[]> => {
  const uploadPromises = photos.map((photo, index) => 
    uploadSantralPhoto(photo, santralId, companyId, index === 0 ? 'logo' : 'kapak')
  );
  return Promise.all(uploadPromises);
};

// Modern SaaS yaklaşımı: Upload fonksiyonları + otomatik metrics güncellemesi
export const uploadBakimPhotos = async (
  photos: File[],
  bakimId: string,
  companyId: string,
  bakimType: 'elektrik' | 'mekanik' | 'yapilanis'
): Promise<string[]> => {
  const uploadPromises = photos.map(async (photo, index) => {
    const fileName = `${Date.now()}_${index}.${photo.name.split('.').pop()}`;
    const filePath = `companies/${companyId}/bakimlar/${bakimId}/${fileName}`;
    const fileRef = ref(storage, filePath);

    try {
      await ensureStorageCapacity(companyId, photo.size);
      // Dosyayı yükle
      const snapshot = await uploadBytes(fileRef, photo, { contentType: photo.type || 'image/jpeg' });
      const downloadURL = await getDownloadURL(snapshot.ref);

      // Otomatik storage güncelleme - 5 saniye sonra
      storageInterceptor.onFileUpload(companyId, filePath, photo.size);

      return downloadURL;
    } catch (error) {
      console.error(`Dosya yüklenemedi: ${fileName}`, error);
      throw error;
    }
  });

  return Promise.all(uploadPromises);
};

// Arıza fotoğrafları yükleme
export const uploadArizaPhotos = async (
  photos: File[],
  arizaId: string,
  companyId: string
): Promise<string[]> => {
  const uploadPromises = photos.map(async (photo, index) => {
    const fileName = `${Date.now()}_${index}.jpg`; // Hep jpg olarak kaydet
    const filePath = `companies/${companyId}/arizalar/${arizaId}/photos/${fileName}`;
    const fileRef = ref(storage, filePath);

    try {
      // Resim dosyasıysa sıkıştır
      let uploadData: Blob | File = photo;
      if (isImageFile(photo)) {
        logger.info(`Fotoğraf sıkıştırılıyor: ${photo.name}`);
        uploadData = await compressImage(photo, {
          maxWidth: 1920,
          maxHeight: 1080,
          quality: 0.85,
          format: 'jpeg'
        });
      }
      
      await ensureStorageCapacity(companyId, uploadData.size);
      const snapshot = await uploadBytes(fileRef, uploadData, { contentType: 'image/jpeg' });
      const downloadURL = await getDownloadURL(snapshot.ref);

      // Otomatik storage güncelleme - 5 saniye sonra
      storageInterceptor.onFileUpload(companyId, filePath, uploadData.size);

      return downloadURL;
    } catch (error) {
      console.error(`Arıza fotoğrafı yüklenemedi: ${fileName}`, error);
      throw error;
    }
  });

  return Promise.all(uploadPromises);
};

// Vardiya fotoğrafları yükleme
export const uploadVardiyaPhotos = async (
  photos: File[],
  vardiyaId: string,
  companyId: string
): Promise<string[]> => {
  const uploadPromises = photos.map(async (photo, index) => {
    const fileName = `${Date.now()}_${index}.${photo.name.split('.').pop()}`;
    const filePath = `companies/${companyId}/vardiya/${vardiyaId}/${fileName}`;
    const fileRef = ref(storage, filePath);

    try {
      await ensureStorageCapacity(companyId, photo.size);
      const snapshot = await uploadBytes(fileRef, photo, { contentType: photo.type || 'image/jpeg' });
      const downloadURL = await getDownloadURL(snapshot.ref);

      // Otomatik storage güncelleme - 5 saniye sonra
      storageInterceptor.onFileUpload(companyId, filePath, photo.size);

      return downloadURL;
    } catch (error) {
      console.error(`Vardiya fotoğrafı yüklenemedi: ${fileName}`, error);
      throw error;
    }
  });

  return Promise.all(uploadPromises);
};

// Santral logo/kapak resmi yükleme
export const uploadSantralPhoto = async (
  photo: File,
  santralId: string,
  companyId: string,
  type: 'logo' | 'kapak' = 'logo'
): Promise<string> => {
  const fileName = `${type}_${Date.now()}.${photo.name.split('.').pop()}`;
  const filePath = `companies/${companyId}/santraller/${santralId}/${fileName}`;
  const fileRef = ref(storage, filePath);

  try {
    await ensureStorageCapacity(companyId, photo.size);
    const snapshot = await uploadBytes(fileRef, photo, { contentType: photo.type || 'image/jpeg' });
    const downloadURL = await getDownloadURL(snapshot.ref);

    // Otomatik storage güncelleme - 5 saniye sonra
    storageInterceptor.onFileUpload(companyId, filePath, photo.size);

    return downloadURL;
  } catch (error) {
    console.error(`Santral ${type} yüklenemedi:`, error);
    throw error;
  }
};

// Multiple dosya silme + metrics güncelleme
export const deleteMultipleFiles = async (
  fileUrls: string[],
  companyId: string
): Promise<void> => {
  const deletePromises = fileUrls.map(async (url) => {
    try {
      // URL'den path çıkar
      const filePath = url.split('/o/')[1]?.split('?')[0];
      if (!filePath) return;

      const decodedPath = decodeURIComponent(filePath);
      const fileRef = ref(storage, decodedPath);
      
      // Dosyayı sil
      await deleteObject(fileRef);
      
      // Otomatik storage güncelleme - 5 saniye sonra
      storageInterceptor.onFileDelete(companyId, decodedPath);
    } catch (error) {
      console.error(`Dosya silinemedi: ${url}`, error);
    }
  });

  await Promise.all(deletePromises);
};

// Şirket logosu yükleme
export const uploadCompanyLogo = async (
  photo: File,
  companyId: string
): Promise<string> => {
  const fileName = `logo_${Date.now()}.${photo.name.split('.').pop()}`;
  const filePath = `companies/${companyId}/logo/${fileName}`;
  const fileRef = ref(storage, filePath);

  try {
    await ensureStorageCapacity(companyId, photo.size);
    const snapshot = await uploadBytes(fileRef, photo, { contentType: photo.type || 'image/jpeg' });
    const downloadURL = await getDownloadURL(snapshot.ref);

    // Otomatik storage güncelleme - 5 saniye sonra
    storageInterceptor.onFileUpload(companyId, filePath, photo.size);

    return downloadURL;
  } catch (error) {
    console.error('Şirket logosu yüklenemedi:', error);
    throw error;
  }
};

// Stok fotoğrafları yükleme
export const uploadStokPhotos = async (
  photos: File[],
  companyId: string
): Promise<string[]> => {
  const uploadPromises = photos.map(async (photo, index) => {
    const fileName = `${Date.now()}_${index}_${photo.name}`;
    const filePath = `companies/${companyId}/stoklar/${fileName}`;
    const fileRef = ref(storage, filePath);

    try {
      await ensureStorageCapacity(companyId, photo.size);
      const snapshot = await uploadBytes(fileRef, photo, { contentType: photo.type || 'image/jpeg' });
      const downloadURL = await getDownloadURL(snapshot.ref);

      // Otomatik storage güncelleme - 5 saniye sonra
      storageInterceptor.onFileUpload(companyId, filePath, photo.size);

      return downloadURL;
    } catch (error) {
      console.error(`Stok fotoğrafı yüklenemedi: ${fileName}`, error);
      throw error;
    }
  });

  return Promise.all(uploadPromises);
};

// Backward compatibility için storage service object
export const storageService = {
  updateStorageMetricsOnUpload,
  updateStorageMetricsOnDelete,
  getStorageMetrics,
  getCategoryFromPath,
  isValidFileSize,
  isValidImageType,
  formatFileSize,
  uploadFile,
  uploadBakimPhotos,
  uploadArizaPhotos,
  uploadVardiyaPhotos,
  uploadSantralPhoto,
  uploadSantralPhotos,
  uploadCompanyLogo,
  uploadStokPhotos,
  deleteMultipleFiles
};