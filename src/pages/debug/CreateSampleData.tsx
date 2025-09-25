import React, { useState } from 'react';
import { Button, Card, LoadingSpinner } from '../../components/ui';
import { createSampleDataForABC } from '../../utils/createSampleData';
import { updateABCStorageMetrics } from '../../utils/updateABCStorageMetrics';
import toast from 'react-hot-toast';
import { Database, Users, Building, Zap, AlertTriangle, HardDrive } from 'lucide-react';

const CreateSampleData: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [storageLoading, setStorageLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [storageResult, setStorageResult] = useState<any>(null);

  const handleCreateSampleData = async () => {
    try {
      setLoading(true);
      setResult(null);
      
      const response = await createSampleDataForABC();
      setResult(response);
      toast.success('Örnek veri başarıyla oluşturuldu!');
    } catch (error: any) {
      console.error('Error creating sample data:', error);
      toast.error(error.message || 'Örnek veri oluşturulamadı');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStorageMetrics = async () => {
    try {
      setStorageLoading(true);
      setStorageResult(null);
      
      const response = await updateABCStorageMetrics();
      setStorageResult(response);
      toast.success('Depolama metrikleri güncellendi!');
    } catch (error: any) {
      console.error('Error updating storage metrics:', error);
      toast.error(error.message || 'Depolama metrikleri güncellenemedi');
    } finally {
      setStorageLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Örnek Veri Oluştur</h1>
        <p className="text-gray-600 mt-2">
          ABC Şirketi için test verilerini oluşturun
        </p>
      </div>

      <Card className="p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">ABC Şirketi Test Verisi</h2>
        <p className="text-gray-600 mb-4">
          Bu işlem ABC Şirketi için aşağıdaki test verilerini oluşturacak:
        </p>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
            <Users className="w-5 h-5 text-blue-600" />
            <div>
              <div className="font-semibold">3 Kullanıcı</div>
              <div className="text-sm text-gray-600">Yönetici, Mühendis, Tekniker</div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
            <Building className="w-5 h-5 text-green-600" />
            <div>
              <div className="font-semibold">2 Saha</div>
              <div className="text-sm text-gray-600">Ankara, İstanbul</div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 p-3 bg-yellow-50 rounded-lg">
            <Zap className="w-5 h-5 text-yellow-600" />
            <div>
              <div className="font-semibold">4 Santral</div>
              <div className="text-sm text-gray-600">Toplam 3.5 MW</div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <div>
              <div className="font-semibold">3 Arıza</div>
              <div className="text-sm text-gray-600">Farklı durumlar</div>
            </div>
          </div>
        </div>

        <Button 
          onClick={handleCreateSampleData} 
          disabled={loading}
          className="w-full flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <LoadingSpinner size="sm" />
              Oluşturuluyor...
            </>
          ) : (
            <>
              <Database className="w-4 h-4" />
              Örnek Veri Oluştur
            </>
          )}
        </Button>
      </Card>

      <Card className="p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Depolama Metriklerini Güncelle</h2>
        <p className="text-gray-600 mb-4">
          ABC Şirketi için gerçek depolama kullanım verilerini günceller (0.05 GB = 51.2 MB)
        </p>
        
        <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg mb-4">
          <HardDrive className="w-5 h-5 text-blue-600" />
          <div>
            <div className="font-semibold">51.2 MB Depolama</div>
            <div className="text-sm text-gray-600">Yönetici paneli ile uyumlu</div>
          </div>
        </div>

        <Button 
          onClick={handleUpdateStorageMetrics} 
          disabled={storageLoading}
          className="w-full flex items-center justify-center gap-2"
          variant="outline"
        >
          {storageLoading ? (
            <>
              <LoadingSpinner size="sm" />
              Güncelleniyor...
            </>
          ) : (
            <>
              <HardDrive className="w-4 h-4" />
              Depolama Metriklerini Güncelle
            </>
          )}
        </Button>
      </Card>

      {result && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-green-600 mb-4">
            ✅ İşlem Başarılı
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{result.data?.users || 0}</div>
              <div className="text-sm text-gray-600">Kullanıcı</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{result.data?.sahalar || 0}</div>
              <div className="text-sm text-gray-600">Saha</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">{result.data?.santraller || 0}</div>
              <div className="text-sm text-gray-600">Santral</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{result.data?.arizalar || 0}</div>
              <div className="text-sm text-gray-600">Arıza</div>
            </div>
          </div>
          <p className="text-green-600 mt-4 text-center font-medium">
            {result.message}
          </p>
        </Card>
      )}

      {storageResult && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-blue-600 mb-4">
            ✅ Depolama Metrikleri Güncellendi
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{(storageResult.data?.storageUsedMB || 0).toFixed(2)} MB</div>
              <div className="text-sm text-gray-600">Toplam Depolama</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{storageResult.data?.fileCount || 0}</div>
              <div className="text-sm text-gray-600">Dosya Sayısı</div>
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <h4 className="font-semibold">Kategori Dağılımı:</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>Logo: {(storageResult.data?.breakdown?.logos || 0).toFixed(2)} MB</div>
              <div>Arıza: {(storageResult.data?.breakdown?.arizaPhotos || 0).toFixed(2)} MB</div>
              <div>Bakım: {(storageResult.data?.breakdown?.bakimPhotos || 0).toFixed(2)} MB</div>
              <div>Vardiya: {(storageResult.data?.breakdown?.vardiyaPhotos || 0).toFixed(2)} MB</div>
              <div>Belgeler: {(storageResult.data?.breakdown?.documents || 0).toFixed(2)} MB</div>
              <div>Diğer: {(storageResult.data?.breakdown?.other || 0).toFixed(2)} MB</div>
            </div>
          </div>
          <p className="text-blue-600 mt-4 text-center font-medium">
            {storageResult.message}
          </p>
        </Card>
      )}
    </div>
  );
};

export default CreateSampleData;
