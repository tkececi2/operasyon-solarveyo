import React, { useState, useEffect } from 'react';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Input';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { Calculator, Database, HardDrive, RefreshCw, AlertCircle, Zap, Clock, Users, CheckCircle, XCircle, Building2 } from 'lucide-react';
import { fastCalculateStorage, setupStorageListener, clearStorageCache, batchCalculateStorage } from '../../services/fastStorageService';
import { getStorageMetrics } from '../../services/storageService';
import { collection, getDocs, doc, getDoc, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';

interface CompanyStorage {
  id: string;
  name: string;
  storageUsedMB: number;
  fileCount: number;
  limit: number;
  percentage: number;
  status: 'success' | 'warning' | 'danger';
  lastCalculated?: Date;
}

const StorageManager: React.FC = () => {
  const { userProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [companyId, setCompanyId] = useState('');
  const [companies, setCompanies] = useState<CompanyStorage[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<string>('');
  const [results, setResults] = useState<any>(null);
  const [calculationTime, setCalculationTime] = useState<number>(0);
  const [realTimeMetrics, setRealTimeMetrics] = useState<any>(null);
  const [batchLoading, setBatchLoading] = useState(false);
  const [batchProgress, setBatchProgress] = useState(0);

  // Şirketleri yükle
  useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    try {
      const companiesQuery = userProfile?.rol === 'superadmin' 
        ? collection(db, 'companies')
        : query(collection(db, 'companies'), where('id', '==', userProfile?.companyId));
        
      const snapshot = await getDocs(companiesQuery);
      const companiesList: CompanyStorage[] = [];
      
      for (const doc of snapshot.docs) {
        const data = doc.data();
        const storageUsedMB = data.metrics?.storageUsedMB || 0;
        const storageLimit = data.subscriptionLimits?.storageLimit || 5120;
        const percentage = (storageUsedMB / storageLimit) * 100;
        
        companiesList.push({
          id: doc.id,
          name: data.name || 'Bilinmiyor',
          storageUsedMB,
          fileCount: data.metrics?.fileCount || 0,
          limit: storageLimit,
          percentage,
          status: percentage > 90 ? 'danger' : percentage > 80 ? 'warning' : 'success',
          lastCalculated: data.metrics?.lastStorageCalculation?.toDate()
        });
      }
      
      // Kullanıma göre sırala (büyükten küçüğe)
      companiesList.sort((a, b) => b.storageUsedMB - a.storageUsedMB);
      setCompanies(companiesList);
    } catch (error) {
      console.error('Şirketler yüklenemedi:', error);
      toast.error('Şirketler yüklenemedi');
    }
  };

  // Real-time listener setup
  useEffect(() => {
    if (companyId && results) {
      const unsubscribe = setupStorageListener(companyId, (metrics) => {
        setRealTimeMetrics(metrics);
      });
      
      return () => unsubscribe();
    }
  }, [companyId, results]);

  const checkStorage = async (useCache = false) => {
    if (!companyId) {
      toast.error('Lütfen şirket seçin veya ID girin');
      return;
    }

    setLoading(true);
    const startTime = performance.now();
    
    try {
      // Cache temizle (eğer force refresh ise)
      if (!useCache) {
        clearStorageCache(companyId);
      }

      // 1. Mevcut cached metrics'i al
      const currentMetrics = await getStorageMetrics(companyId);
      
      // 2. Şirket bilgilerini al
      const companyDoc = await getDoc(doc(db, 'companies', companyId));
      const companyData = companyDoc.data();
      
      // 3. HIZLI hesaplama yap
      const recalculated = await fastCalculateStorage(companyId, !useCache);
      
      // 4. Güncel metrics'i tekrar al
      const updatedMetrics = await getStorageMetrics(companyId);
      
      const endTime = performance.now();
      setCalculationTime(endTime - startTime);
      
      setResults({
        companyName: companyData?.name || 'Bilinmiyor',
        planLimits: companyData?.subscriptionLimits || {},
        before: currentMetrics,
        after: updatedMetrics,
        recalculated: recalculated,
        difference: {
          storage: recalculated.storageUsedMB - (currentMetrics.storageUsedMB || 0),
          files: recalculated.fileCount - (currentMetrics.fileCount || 0)
        }
      });
      
      toast.success(`Depolama analizi ${(endTime - startTime).toFixed(0)}ms'de tamamlandı! 🚀`);
      
      // Listeyi güncelle
      await loadCompanies();
    } catch (error) {
      console.error('Depolama kontrolü hatası:', error);
      toast.error('Kontrol sırasında hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  // Toplu kontrol - Tüm şirketler
  const checkAllCompanies = async () => {
    if (companies.length === 0) {
      toast.error('Kontrol edilecek şirket yok');
      return;
    }

    setBatchLoading(true);
    setBatchProgress(0);
    
    try {
      const startTime = performance.now();
      const companyIds = companies.map(c => c.id);
      
      // Progress callback ile batch hesaplama
      let processed = 0;
      const batchSize = 5;
      
      for (let i = 0; i < companyIds.length; i += batchSize) {
        const batch = companyIds.slice(i, i + batchSize);
        
        // Paralel hesaplama
        await Promise.all(batch.map(id => 
          fastCalculateStorage(id, true).catch(err => 
            console.error(`Hata: ${id}`, err)
          )
        ));
        
        processed += batch.length;
        setBatchProgress(Math.round((processed / companyIds.length) * 100));
        
        // Rate limiting
        if (i + batchSize < companyIds.length) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
      
      const endTime = performance.now();
      const duration = ((endTime - startTime) / 1000).toFixed(1);
      
      toast.success(`${companies.length} şirket ${duration} saniyede güncellendi!`);
      
      // Listeyi yenile
      await loadCompanies();
    } catch (error) {
      console.error('Toplu kontrol hatası:', error);
      toast.error('Toplu kontrol başarısız');
    } finally {
      setBatchLoading(false);
      setBatchProgress(0);
    }
  };

  const formatMB = (mb: number) => {
    if (mb < 1024) return `${mb.toFixed(2)} MB`;
    return `${(mb / 1024).toFixed(2)} GB`;
  };

  const formatDate = (date?: Date) => {
    if (!date) return 'Hiç hesaplanmamış';
    return date.toLocaleString('tr-TR');
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <HardDrive className="h-6 w-6" />
            Depolama Yönetimi
          </h1>
          <p className="text-gray-600 mt-1">Şirketlerin depolama kullanımını kontrol edin ve yönetin</p>
        </div>
        <Button 
          onClick={checkAllCompanies}
          disabled={batchLoading}
          variant="primary"
        >
          {batchLoading ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Kontrol Ediliyor... {batchProgress}%
            </>
          ) : (
            <>
              <Users className="h-4 w-4 mr-2" />
              Tüm Şirketleri Kontrol Et ({companies.length})
            </>
          )}
        </Button>
      </div>

      {/* Şirket Listesi */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Şirket Depolama Durumu
            </span>
            <Button variant="outline" size="sm" onClick={loadCompanies}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b">
                <tr className="text-left text-sm text-gray-600">
                  <th className="pb-2">Şirket</th>
                  <th className="pb-2">Kullanım</th>
                  <th className="pb-2">Limit</th>
                  <th className="pb-2">Yüzde</th>
                  <th className="pb-2">Dosya Sayısı</th>
                  <th className="pb-2">Son Hesaplama</th>
                  <th className="pb-2">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {companies.map(company => (
                  <tr key={company.id} className="hover:bg-gray-50">
                    <td className="py-3">
                      <div>
                        <div className="font-medium">{company.name}</div>
                        <div className="text-xs text-gray-500">{company.id}</div>
                      </div>
                    </td>
                    <td className="py-3">{formatMB(company.storageUsedMB)}</td>
                    <td className="py-3">{formatMB(company.limit)}</td>
                    <td className="py-3">
                      <Badge variant={company.status}>
                        {company.percentage.toFixed(1)}%
                      </Badge>
                    </td>
                    <td className="py-3">{company.fileCount}</td>
                    <td className="py-3 text-sm text-gray-600">
                      {formatDate(company.lastCalculated)}
                    </td>
                    <td className="py-3">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setCompanyId(company.id);
                          setSelectedCompany(company.id);
                          setTimeout(() => checkStorage(false), 100);
                        }}
                      >
                        <Zap className="h-3 w-3" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Detaylı Kontrol */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Detaylı Depolama Kontrolü
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex gap-2">
              <Select 
                value={selectedCompany}
                onChange={(e) => {
                  setSelectedCompany(e.target.value);
                  setCompanyId(e.target.value);
                }}
                className="flex-1"
              >
                <option value="">Şirket Seçin</option>
                {companies.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({formatMB(c.storageUsedMB)} / {formatMB(c.limit)})
                  </option>
                ))}
              </Select>
              <span className="text-gray-500 self-center">veya</span>
              <Input
                type="text"
                placeholder="Şirket ID"
                value={companyId}
                onChange={(e) => setCompanyId(e.target.value)}
                className="flex-1"
              />
            </div>
            
            <div className="flex gap-2">
              <Button onClick={() => checkStorage(false)} disabled={loading} variant="primary">
                {loading ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Zap className="h-4 w-4" />
                )}
                Hızlı Kontrol
              </Button>
              <Button onClick={() => checkStorage(true)} disabled={loading} variant="outline">
                <Clock className="h-4 w-4" />
                Cache'den
              </Button>
            </div>
            
            {calculationTime > 0 && (
              <div className="text-sm text-green-600 flex items-center gap-1">
                <Zap className="h-3 w-3" />
                Hesaplama süresi: {calculationTime.toFixed(0)}ms
              </div>
            )}
          </div>

          {results && (
            <div className="space-y-4 mt-6">
              {/* Şirket Bilgileri */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Şirket: {results.companyName}</h3>
                <div className="text-sm text-gray-600">
                  Plan Limiti: {formatMB(results.planLimits.storageLimit || 5120)}
                </div>
              </div>

              {/* Önceki Durum */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Database className="h-4 w-4" />
                    Önceki Durum (Cached)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>Depolama: <span className="font-semibold">{formatMB(results.before.storageUsedMB)}</span></div>
                    <div>Dosya Sayısı: <span className="font-semibold">{results.before.fileCount}</span></div>
                    <div className="col-span-2">
                      Son Hesaplama: {results.before.lastCalculated ? 
                        new Date(results.before.lastCalculated.seconds * 1000).toLocaleString('tr-TR') : 
                        'Hiç hesaplanmamış'}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Yeniden Hesaplama Sonucu */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <RefreshCw className="h-4 w-4" />
                    Yeniden Hesaplama (Gerçek)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>Depolama: <span className="font-semibold text-green-600">{formatMB(results.recalculated.storageUsedMB)}</span></div>
                    <div>Dosya Sayısı: <span className="font-semibold text-green-600">{results.recalculated.fileCount}</span></div>
                  </div>
                  
                  {/* Kategori Dağılımı */}
                  <div className="mt-3 pt-3 border-t">
                    <h4 className="text-xs font-semibold mb-2">Kategori Dağılımı:</h4>
                    <div className="space-y-1 text-xs">
                      {Object.entries(results.recalculated.breakdown || {}).map(([key, value]: [string, any]) => (
                        <div key={key} className="flex justify-between">
                          <span className="capitalize">{key}:</span>
                          <span className="font-medium">{formatMB(value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Fark Analizi */}
              <Card className={results.difference.storage !== 0 ? 'border-orange-300 bg-orange-50' : 'border-green-300 bg-green-50'}>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    Fark Analizi
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Depolama Farkı:</span>
                      <Badge variant={Math.abs(results.difference.storage) > 1 ? 'warning' : 'success'}>
                        {results.difference.storage > 0 ? '+' : ''}{formatMB(results.difference.storage)}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Dosya Sayısı Farkı:</span>
                      <Badge variant={results.difference.files !== 0 ? 'warning' : 'success'}>
                        {results.difference.files > 0 ? '+' : ''}{results.difference.files}
                      </Badge>
                    </div>
                    
                    {Math.abs(results.difference.storage) > 1 && (
                      <div className="mt-3 p-2 bg-yellow-100 rounded text-xs">
                        ⚠️ Önemli fark tespit edildi! Cached değerler gerçek kullanımı yansıtmıyor olabilir.
                      </div>
                    )}
                    
                    {Math.abs(results.difference.storage) <= 1 && (
                      <div className="mt-3 p-2 bg-green-100 rounded text-xs">
                        ✅ Hesaplama doğru görünüyor. Cached değerler güncel.
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Real-time Metrics (eğer varsa) */}
              {realTimeMetrics && (
                <Card className="border-blue-300 bg-blue-50">
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Zap className="h-4 w-4 text-blue-600" />
                      Real-Time Metrics (Canlı)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>Depolama: <span className="font-semibold text-blue-600">{formatMB(realTimeMetrics.storageUsedMB)}</span></div>
                      <div>Dosya Sayısı: <span className="font-semibold text-blue-600">{realTimeMetrics.fileCount}</span></div>
                      <div className="col-span-2">
                        Son Güncelleme: {realTimeMetrics.lastCalculated ? 
                          new Date(realTimeMetrics.lastCalculated).toLocaleString('tr-TR') : 
                          'Bilinmiyor'}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StorageManager;
