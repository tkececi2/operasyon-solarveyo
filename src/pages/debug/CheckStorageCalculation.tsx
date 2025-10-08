import React, { useState, useEffect } from 'react';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Calculator, Database, HardDrive, RefreshCw, AlertCircle, Zap, Clock } from 'lucide-react';
import { fastCalculateStorage, setupStorageListener, clearStorageCache } from '../../services/fastStorageService';
import { getStorageMetrics } from '../../services/storageService';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import toast from 'react-hot-toast';

const CheckStorageCalculation: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [companyId, setCompanyId] = useState('');
  const [results, setResults] = useState<any>(null);
  const [calculationTime, setCalculationTime] = useState<number>(0);
  const [realTimeMetrics, setRealTimeMetrics] = useState<any>(null);

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
      toast.error('Lütfen şirket ID girin');
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
    } catch (error) {
      console.error('Depolama kontrolü hatası:', error);
      toast.error('Kontrol sırasında hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const formatMB = (mb: number) => {
    if (mb < 1024) return `${mb.toFixed(2)} MB`;
    return `${(mb / 1024).toFixed(2)} GB`;
  };

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Depolama Hesaplama Kontrolü
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Şirket ID (örn: txececi@edeonenerji.com)"
                value={companyId}
                onChange={(e) => setCompanyId(e.target.value)}
                className="flex-1 px-3 py-2 border rounded-md"
              />
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

export default CheckStorageCalculation;
