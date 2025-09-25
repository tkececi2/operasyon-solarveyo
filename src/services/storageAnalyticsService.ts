import { ref, listAll, getMetadata } from 'firebase/storage';
import { storage } from '../lib/firebase';
import { db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export interface StorageBreakdown {
  totalUsed: number; // MB cinsinden
  breakdown: {
    logos: number;
    arizaPhotos: number;
    bakimPhotos: number;
    vardiyaPhotos: number;
    documents: number;
    other: number;
  };
  fileCount: {
    total: number;
    images: number;
    documents: number;
    other: number;
  };
  largestFiles: Array<{
    name: string;
    size: number;
    path: string;
    type: string;
  }>;
}

export interface StorageQuota {
  used: number;
  limit: number;
  percentage: number;
  remainingMB: number;
  remainingGB: number;
  status: 'safe' | 'warning' | 'critical' | 'full';
  nextPlanSuggestion?: {
    planName: string;
    storageLimit: number;
    price: number;
  };
}

// Dosya uzantısından tip belirleme
const getFileType = (fileName: string): string => {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) {
    return 'image';
  } else if (['pdf', 'doc', 'docx', 'xls', 'xlsx', 'txt'].includes(ext)) {
    return 'document';
  } else {
    return 'other';
  }
};

// Gerçek depolama kullanımını hesapla
export const calculateRealStorageUsage = async (companyId: string): Promise<StorageBreakdown> => {
  
  const breakdown: StorageBreakdown = {
    totalUsed: 0,
    breakdown: {
      logos: 0,
      arizaPhotos: 0,
      bakimPhotos: 0,
      vardiyaPhotos: 0,
      documents: 0,
      other: 0
    },
    fileCount: {
      total: 0,
      images: 0,
      documents: 0,
      other: 0
    },
    largestFiles: []
  };

  try {
    // Kökten tüm alt klasörleri tara
    const basePath = `companies/${companyId}`;

    const allFiles: Array<{ name: string; size: number; path: string; type: string }> = [];
    let totalUsed = 0;

    // Dosya sayılarını takip et
    const fileCount = { logos: 0, arizalar: 0, bakim: 0, vardiya: 0, belgeler: 0 };

    const classifyCategoryByPath = (fullPath: string): keyof typeof breakdown.breakdown => {
      const p = fullPath.toLowerCase();
      if (p.includes('/logos')) return 'logos';
      if (p.includes('/ariza') || p.includes('/arizalar')) return 'arizaPhotos';
      if (p.includes('/bakim')) return 'bakimPhotos';
      if (p.includes('/vardiya')) return 'vardiyaPhotos';
      if (p.includes('/document') || p.includes('/belge')) return 'documents';
      return 'other';
    };

    const traverse = async (fullPath: string) => {
      const folderRef = ref(storage, fullPath);
      const result = await listAll(folderRef);

      for (const item of result.items) {
        try {
          const metadata = await getMetadata(item);
          const sizeInMB = metadata.size / (1024 * 1024);
          const fileType = getFileType(metadata.name);
          const category = classifyCategoryByPath(item.fullPath);

          totalUsed += sizeInMB;
          breakdown.breakdown[category] += sizeInMB;
          breakdown.totalUsed += sizeInMB;
          breakdown.fileCount.total++;

          if (category === 'logos') fileCount.logos++;
          else if (category === 'arizaPhotos') fileCount.arizalar++;
          else if (category === 'bakimPhotos') fileCount.bakim++;
          else if (category === 'vardiyaPhotos') fileCount.vardiya++;
          else if (category === 'documents') fileCount.belgeler++;

          if (fileType === 'image') breakdown.fileCount.images++;
          else if (fileType === 'document') breakdown.fileCount.documents++;
          else breakdown.fileCount.other++;

          allFiles.push({ name: metadata.name, size: sizeInMB, path: item.fullPath, type: fileType });
        } catch (err) {
          // Sessizce geç, metadata alınamazsa
        }
      }

      for (const prefix of result.prefixes) {
        await traverse(prefix.fullPath);
      }
    };

    await traverse(basePath);
    
    // En büyük 10 dosyayı bul
    breakdown.largestFiles = allFiles
      .sort((a, b) => b.size - a.size)
      .slice(0, 10);
    return breakdown;
    
  } catch (error) {
    console.error('Depolama kullanımı hesaplanamadı:', error);
    throw error;
  }
};

// Depolama kotası analizi
export const analyzeStorageQuota = async (
  companyId: string,
  storageLimit: number, // MB cinsinden
  options?: { cacheTtlMs?: number; force?: boolean }
): Promise<StorageQuota> => {
  const ttl = options?.cacheTtlMs ?? 30 * 60 * 1000; // 30dk - daha uzun cache
  const force = options?.force ?? false;
  const cacheKey = `storageQuota:${companyId}:${storageLimit}`;

  try {
    if (!force) {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed?.cachedAt && Date.now() - parsed.cachedAt < ttl && parsed.data) {
          return parsed.data as StorageQuota;
        }
      }
    }

    // Önce metrics'ten hizlı oku (varsa)
    if (!force) {
      try {
        const snap = await getDoc(doc(db, 'companies', companyId));
        const data = snap.data() as any;
        if (data?.metrics?.storageUsedMB !== undefined) {
          const used = Number(data.metrics.storageUsedMB) || 0;
          const percentage = (used / storageLimit) * 100;
          const remainingMB = Math.max(0, storageLimit - used);
          const remainingGB = remainingMB / 1024;
          const quick: StorageQuota = {
            used,
            limit: storageLimit,
            percentage: Math.round(percentage * 100) / 100,
            remainingMB: Math.round(remainingMB * 100) / 100,
            remainingGB: Math.round(remainingGB * 100) / 100,
            status: percentage >= 100 ? 'full' : percentage >= 90 ? 'critical' : percentage >= 75 ? 'warning' : 'safe'
          };
          try { localStorage.setItem(cacheKey, JSON.stringify({ cachedAt: Date.now(), data: quick })); } catch (_) {}
          return quick;
        }
      } catch (_) {}
    }

    const breakdown = await calculateRealStorageUsage(companyId);
    const used = breakdown.totalUsed;
    const percentage = (used / storageLimit) * 100;
    const remainingMB = Math.max(0, storageLimit - used);
    const remainingGB = remainingMB / 1024;

    let status: StorageQuota['status'] = 'safe';
    if (percentage >= 100) status = 'full';
    else if (percentage >= 90) status = 'critical';
    else if (percentage >= 75) status = 'warning';

    // Plan önerisi
    let nextPlanSuggestion: StorageQuota['nextPlanSuggestion'];
    if (status === 'critical' || status === 'full') {
      if (storageLimit <= 5 * 1024) {
        nextPlanSuggestion = { planName: 'Professional', storageLimit: 50 * 1024, price: 499 };
      } else if (storageLimit <= 50 * 1024) {
        nextPlanSuggestion = { planName: 'Enterprise', storageLimit: 500 * 1024, price: 999 };
      }
    }

    const result: StorageQuota = {
      used,
      limit: storageLimit,
      percentage: Math.round(percentage * 100) / 100,
      remainingMB: Math.round(remainingMB * 100) / 100,
      remainingGB: Math.round(remainingGB * 100) / 100,
      status,
      nextPlanSuggestion
    };

    try {
      localStorage.setItem(cacheKey, JSON.stringify({ cachedAt: Date.now(), data: result }));
    } catch (_) {}

    return result;
  } catch (error) {
    console.error('Depolama kotası analiz edilemedi:', error);
    // Hata durumunda önbellek varsa dön
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed?.data) return parsed.data as StorageQuota;
      }
    } catch (_) {}

    return {
      used: 0,
      limit: storageLimit,
      percentage: 0,
      remainingMB: storageLimit,
      remainingGB: storageLimit / 1024,
      status: 'safe'
    };
  }
};

// Depolama temizlik önerileri
export const getStorageCleanupSuggestions = async (companyId: string) => {
  try {
    const breakdown = await calculateRealStorageUsage(companyId);
    
    const suggestions = [];
    
    // En büyük dosyalar
    if (breakdown.largestFiles.length > 0) {
      suggestions.push({
        type: 'large_files',
        title: 'Büyük Dosyalar',
        description: `En büyük ${breakdown.largestFiles.length} dosya toplam ${breakdown.largestFiles.reduce((sum, f) => sum + f.size, 0).toFixed(1)} MB yer kaplıyor`,
        files: breakdown.largestFiles,
        potentialSavings: breakdown.largestFiles.reduce((sum, f) => sum + f.size, 0)
      });
    }
    
    // Kategori önerileri
    const categories = Object.entries(breakdown.breakdown)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3);
    
    for (const [category, size] of categories) {
      if (size > 100) { // 100MB'dan büyükse
        suggestions.push({
          type: 'category_cleanup',
          title: getCategoryName(category),
          description: `${size.toFixed(1)} MB yer kaplıyor`,
          category,
          potentialSavings: size * 0.3 // %30 tasarruf varsayımı
        });
      }
    }
    
    return suggestions;
    
  } catch (error) {
    console.error('Temizlik önerileri alınamadı:', error);
    return [];
  }
};

const getCategoryName = (category: string): string => {
  const names: Record<string, string> = {
    logos: 'Şirket Logoları',
    arizaPhotos: 'Arıza Fotoğrafları',
    bakimPhotos: 'Bakım Fotoğrafları',
    vardiyaPhotos: 'Vardiya Fotoğrafları',
    documents: 'Belgeler',
    other: 'Diğer Dosyalar'
  };
  return names[category] || category;
};
