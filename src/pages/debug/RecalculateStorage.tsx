import React, { useState } from 'react';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { ref, listAll, getMetadata } from 'firebase/storage';
import { db, storage } from '../../lib/firebase';
import { ArrowLeft, RefreshCw, Database, CheckCircle, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';

interface StorageBreakdown {
  logos: number;
  arizaPhotos: number;
  bakimPhotos: number;
  vardiyaPhotos: number;
  santraller: number;
  sahalar: number;
  stoklar: number;
  documents: number;
  other: number;
}

interface CompanyStorage {
  companyId: string;
  companyName: string;
  totalMB: number;
  fileCount: number;
  breakdown: StorageBreakdown;
  status: 'pending' | 'calculating' | 'done' | 'error';
  error?: string;
}

const RecalculateStorage: React.FC = () => {
  const [companies, setCompanies] = useState<CompanyStorage[]>([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  // Tüm şirketleri listele
  const loadCompanies = async () => {
    try {
      setLoading(true);
      const companiesSnap = await getDocs(collection(db, 'companies'));
      const companiesData: CompanyStorage[] = companiesSnap.docs.map(doc => ({
        companyId: doc.id,
        companyName: doc.data().ad || 'İsimsiz Şirket',
        totalMB: 0,
        fileCount: 0,
        breakdown: {
          logos: 0,
          arizaPhotos: 0,
          bakimPhotos: 0,
          vardiyaPhotos: 0,
          santraller: 0,
          sahalar: 0,
          stoklar: 0,
          documents: 0,
          other: 0
        },
        status: 'pending'
      }));
      setCompanies(companiesData);
    } catch (error) {
      console.error('Şirketler yüklenemedi:', error);
    } finally {
      setLoading(false);
    }
  };

  // Tek bir şirketin gerçek depolama kullanımını hesapla
  const calculateCompanyStorage = async (companyId: string): Promise<{ totalMB: number; fileCount: number; breakdown: StorageBreakdown }> => {
    const breakdown: StorageBreakdown = {
      logos: 0,
      arizaPhotos: 0,
      bakimPhotos: 0,
      vardiyaPhotos: 0,
      santraller: 0,
      sahalar: 0,
      stoklar: 0,
      documents: 0,
      other: 0
    };
    
    let totalBytes = 0;
    let fileCount = 0;

    const basePath = `companies/${companyId}`;
    
    const calculateFolder = async (folderPath: string, category: keyof StorageBreakdown) => {
      try {
        const folderRef = ref(storage, folderPath);
        const result = await listAll(folderRef);
        
        // Dosyaları say
        for (const itemRef of result.items) {
          try {
            const metadata = await getMetadata(itemRef);
            const sizeInBytes = metadata.size || 0;
            const sizeInMB = sizeInBytes / (1024 * 1024);
            
            totalBytes += sizeInBytes;
            fileCount++;
            breakdown[category] += sizeInMB;
          } catch (error) {
            console.warn(`Metadata alınamadı: ${itemRef.fullPath}`);
          }
        }
        
        // Alt klasörleri recursive tara
        for (const prefixRef of result.prefixes) {
          await calculateFolder(prefixRef.fullPath, category);
        }
      } catch (error) {
        // Klasör yoksa hata verme
        console.warn(`Klasör bulunamadı: ${folderPath}`);
      }
    };

    // Tüm klasörleri tara
    await Promise.all([
      calculateFolder(`${basePath}/logo`, 'logos'),
      calculateFolder(`${basePath}/logos`, 'logos'),
      calculateFolder(`${basePath}/arizalar`, 'arizaPhotos'),
      calculateFolder(`${basePath}/bakimlar`, 'bakimPhotos'),
      calculateFolder(`${basePath}/vardiya`, 'vardiyaPhotos'),
      calculateFolder(`${basePath}/santraller`, 'santraller'),
      calculateFolder(`${basePath}/sahalar`, 'sahalar'),
      calculateFolder(`${basePath}/stoklar`, 'stoklar'),
      calculateFolder(`${basePath}/documents`, 'documents'),
      calculateFolder(`${basePath}/belgeler`, 'documents'),
    ]);

    const totalMB = totalBytes / (1024 * 1024);

    return { totalMB, fileCount, breakdown };
  };

  // Tüm şirketler için hesapla ve güncelle
  const recalculateAll = async () => {
    if (companies.length === 0) {
      await loadCompanies();
      return;
    }

    setProgress({ current: 0, total: companies.length });

    for (let i = 0; i < companies.length; i++) {
      const company = companies[i];
      
      // Durumu güncelle
      setCompanies(prev => prev.map(c => 
        c.companyId === company.companyId 
          ? { ...c, status: 'calculating' }
          : c
      ));

      try {
        // Gerçek depolama hesapla
        const result = await calculateCompanyStorage(company.companyId);

        // Firestore'u güncelle
        const companyRef = doc(db, 'companies', company.companyId);
        await updateDoc(companyRef, {
          'metrics.storageUsedMB': result.totalMB,
          'metrics.fileCount': result.fileCount,
          'metrics.breakdown': result.breakdown,
          'metrics.lastStorageCalculation': new Date()
        });

        // State'i güncelle
        setCompanies(prev => prev.map(c => 
          c.companyId === company.companyId 
            ? { ...c, ...result, status: 'done' }
            : c
        ));

        console.log(`✅ ${company.companyName}: ${result.totalMB.toFixed(2)} MB`);
      } catch (error) {
        console.error(`❌ ${company.companyName} hata:`, error);
        setCompanies(prev => prev.map(c => 
          c.companyId === company.companyId 
            ? { ...c, status: 'error', error: error instanceof Error ? error.message : 'Bilinmeyen hata' }
            : c
        ));
      }

      setProgress({ current: i + 1, total: companies.length });
    }
  };

  React.useEffect(() => {
    loadCompanies();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Link to="/dashboard" className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Depolama Yeniden Hesaplama</h1>
            <p className="text-sm text-gray-600">Tüm şirketler için Firebase Storage'dan gerçek depolama kullanımını hesaplar</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Toplam Şirket</p>
              <p className="text-2xl font-bold text-gray-900">{companies.length}</p>
            </div>
            <button
              onClick={recalculateAll}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Hesaplanıyor...' : 'Tümünü Yeniden Hesapla'}
            </button>
          </div>

          {progress.total > 0 && (
            <div className="mt-4">
              <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                <span>İlerleme</span>
                <span>{progress.current} / {progress.total}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{ width: `${(progress.current / progress.total) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Şirket</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dosya Sayısı</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Toplam Boyut</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Durum</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {companies.map((company) => (
                <tr key={company.companyId} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{company.companyName}</div>
                    <div className="text-xs text-gray-500">{company.companyId}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {company.fileCount > 0 ? company.fileCount : '-'}
                  </td>
                  <td className="px-6 py-4">
                    {company.totalMB > 0 ? (
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {company.totalMB >= 1024 
                            ? `${(company.totalMB / 1024).toFixed(2)} GB`
                            : `${company.totalMB.toFixed(2)} MB`
                          }
                        </div>
                        <div className="text-xs text-gray-500">
                          Arıza: {company.breakdown.arizaPhotos.toFixed(1)}MB | 
                          Bakım: {company.breakdown.bakimPhotos.toFixed(1)}MB | 
                          Diğer: {company.breakdown.other.toFixed(1)}MB
                        </div>
                      </div>
                    ) : '-'}
                  </td>
                  <td className="px-6 py-4">
                    {company.status === 'pending' && (
                      <span className="inline-flex items-center gap-1 text-sm text-gray-500">
                        <Database className="w-4 h-4" />
                        Bekliyor
                      </span>
                    )}
                    {company.status === 'calculating' && (
                      <span className="inline-flex items-center gap-1 text-sm text-blue-600">
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Hesaplanıyor
                      </span>
                    )}
                    {company.status === 'done' && (
                      <span className="inline-flex items-center gap-1 text-sm text-emerald-600">
                        <CheckCircle className="w-4 h-4" />
                        Tamamlandı
                      </span>
                    )}
                    {company.status === 'error' && (
                      <span className="inline-flex items-center gap-1 text-sm text-red-600">
                        <AlertTriangle className="w-4 h-4" />
                        Hata
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800">
              <p className="font-semibold mb-1">Dikkat!</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>Bu işlem tüm Firebase Storage dosyalarını tarar, uzun sürebilir</li>
                <li>Şirket başına 1-2 dakika sürebilir</li>
                <li>Hesaplama sonucu Firestore'daki metrics güncellenir</li>
                <li>Bu işlem production ortamında dikkatli yapılmalıdır</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecalculateStorage;
