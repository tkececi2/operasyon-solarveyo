import React, { useState } from 'react';
import { Button } from '../../components/ui';
import { useAuth } from '../../hooks/useAuth';
import { useCompany } from '../../hooks/useCompany';
import { 
  migrateCompanyStorageMetrics, 
  migrateAllCompaniesStorageMetrics,
  debugCompanyMetrics,
  checkCompanyMetrics 
} from '../../services/migrationService';
import { getStorageMetrics } from '../../services/storageService';
import { debugAndFixCompanyLimits } from '../../services/debugCompanyService';
import { toast } from 'react-hot-toast';

const StorageMigration: React.FC = () => {
  const { userProfile } = useAuth();
  const { company } = useCompany();
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);

  // Sadece SuperAdmin görebilsin
  if (userProfile?.rol !== 'superadmin') {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-medium">Erişim Reddedildi</h3>
          <p className="text-red-700 text-sm mt-1">Bu sayfa sadece SuperAdmin kullanıcılar için.</p>
        </div>
      </div>
    );
  }

  const handleSingleCompanyMigration = async () => {
    if (!company) {
      toast.error('Company bilgisi bulunamadı');
      return;
    }

    try {
      setLoading(true);
      setResults(null);

      // Önce mevcut durumu kontrol et
      const hasMetrics = await checkCompanyMetrics(company.id);
      
      if (hasMetrics) {
        toast.success('Bu şirketin metrics\'i zaten mevcut!');
        
        // Mevcut metrics'i göster
        const currentMetrics = await getStorageMetrics(company.id);
        setResults({
          type: 'existing',
          data: currentMetrics
        });
        return;
      }

      // Migration çalıştır
      await migrateCompanyStorageMetrics(company.id);
      
      // Yeni metrics'i getir
      const newMetrics = await getStorageMetrics(company.id);
      
      toast.success('✅ Storage metrics başarıyla oluşturuldu!');
      setResults({
        type: 'migrated',
        data: newMetrics
      });

    } catch (error) {
      console.error('Migration error:', error);
      toast.error('Migration sırasında hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleAllCompaniesMigration = async () => {
    try {
      setLoading(true);
      await migrateAllCompaniesStorageMetrics();
      toast.success('Tüm şirketler için migration tamamlandı!');
    } catch (error) {
      console.error('Bulk migration error:', error);
      toast.error('Bulk migration sırasında hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleDebugCompany = async () => {
    if (!company) return;

    try {
      setLoading(true);
      await debugCompanyMetrics(company.id);
      toast.success('Debug bilgileri konsola yazdırıldı');
    } catch (error) {
      console.error('Debug error:', error);
      toast.error('Debug sırasında hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleFixCompanyLimits = async () => {
    if (!company) return;

    try {
      setLoading(true);
      const result = await debugAndFixCompanyLimits(company.id);
      
      if (result.updated) {
        toast.success(`✅ ${result.companyName} plan limitleri düzeltildi!`);
        setResults({
          type: 'limits_fixed',
          data: result
        });
        
        // Sayfayı yenilemeye zorla ki güncel limitler görünsün
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        toast.success('✓ Plan limitleri zaten doğru');
        setResults({
          type: 'limits_correct',
          data: result
        });
      }
    } catch (error) {
      console.error('Fix limits error:', error);
      toast.error('Plan limitleri düzeltilemedi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Storage Metrics Migration</h1>
        <p className="text-gray-600">
          Mevcut şirketler için storage metrics oluşturun. Bu one-time işlem sonrası 
          depolama bilgileri hızlı ve doğru görünecek.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Tek Şirket Migration */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Mevcut Şirket Migration
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            {company?.name} için storage metrics oluştur
          </p>
          <div className="space-y-3">
            <Button
              onClick={handleSingleCompanyMigration}
              disabled={loading}
              className="w-full"
            >
              {loading ? 'İşleniyor...' : 'Migration Çalıştır'}
            </Button>
            <Button
              onClick={handleDebugCompany}
              disabled={loading}
              variant="secondary"
              className="w-full"
            >
              Debug Bilgileri
            </Button>
            <Button
              onClick={handleFixCompanyLimits}
              disabled={loading}
              variant="ghost"
              className="w-full"
            >
              Plan Limitlerini Düzelt
            </Button>
          </div>
        </div>

        {/* Tüm Şirketler Migration */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Bulk Migration
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Tüm şirketler için storage metrics oluştur
          </p>
          <Button
            onClick={handleAllCompaniesMigration}
            disabled={loading}
            variant="danger"
            className="w-full"
          >
            {loading ? 'İşleniyor...' : 'Tüm Şirketler için Migration'}
          </Button>
        </div>
      </div>

      {/* Results */}
      {results && (
        <div className="mt-8 bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Migration Sonuçları</h3>
          
          {results.type === 'existing' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-blue-800 font-medium">✅ Metrics zaten mevcut</p>
            </div>
          )}
          
          {results.type === 'migrated' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <p className="text-green-800 font-medium">🎉 Migration başarılı</p>
            </div>
          )}
          
          {results.type === 'limits_fixed' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <p className="text-green-800 font-medium">✅ Plan limitleri düzeltildi</p>
              <div className="mt-2 text-sm text-green-700">
                <p><strong>{results.data.plan}</strong> planı için doğru limitler uygulandı</p>
              </div>
            </div>
          )}
          
          {results.type === 'limits_correct' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-blue-800 font-medium">✓ Plan limitleri zaten doğru</p>
              <div className="mt-2 text-sm text-blue-700">
                <p><strong>{results.data.plan}</strong> planı doğru şekilde yapılandırılmış</p>
              </div>
            </div>
          )}

          {results.data && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">Toplam Kullanım</div>
                <div className="text-xl font-bold text-gray-900">
                  {(results.data.storageUsedMB / 1024).toFixed(2)} GB
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">Dosya Sayısı</div>
                <div className="text-xl font-bold text-gray-900">
                  {results.data.fileCount}
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">Cached</div>
                <div className="text-xl font-bold text-gray-900">
                  {results.data.isCached ? '✅' : '❌'}
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">Son Hesaplama</div>
                <div className="text-sm text-gray-900">
                  {results.data.lastCalculated ? 
                    new Date(results.data.lastCalculated).toLocaleString('tr-TR') : 
                    'Hiç'
                  }
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Info */}
      <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h4 className="text-yellow-800 font-medium mb-2">💡 Bilgi</h4>
        <ul className="text-yellow-700 text-sm space-y-1">
          <li>• <strong>Storage Migration:</strong> Metrics'i olmayan şirketler için çalışır</li>
          <li>• <strong>Plan Limitleri Düzelt:</strong> Yanlış depolama limitleri (5GB yerine 500GB) düzeltir</li>
          <li>• İşlem tamamlandıktan sonra depolama bilgileri doğru görünecek</li>
          <li>• Sonraki dosya upload/delete işlemleri otomatik güncellenir</li>
          <li>• Bu one-time işlemlerdir, tekrar çalıştırmanıza gerek yok</li>
        </ul>
      </div>
    </div>
  );
};

export default StorageMigration;
