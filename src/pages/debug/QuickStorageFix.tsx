import React, { useState } from 'react';
import { Button } from '../../components/ui';
import { useAuth } from '../../hooks/useAuth';
import { useCompany } from '../../hooks/useCompany';
import { debugAndFixCompanyLimits } from '../../services/debugCompanyService';
import { toast } from 'react-hot-toast';

const QuickStorageFix: React.FC = () => {
  const { userProfile } = useAuth();
  const { company } = useCompany();
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);

  const handleQuickFix = async () => {
    if (!company) return;

    try {
      setLoading(true);
      console.log('🚀 Quick Storage Fix başlatıldı...');
      
      const result = await debugAndFixCompanyLimits(company.id);
      
      if (result.updated) {
        toast.success(`✅ ${result.companyName} storage limiti düzeltildi!`, {
          duration: 5000
        });
        setResults(result);
        
        console.log('✅ Düzeltildi:', {
          planType: result.plan,
          oldLimits: result.oldLimits,
          newLimits: result.newLimits
        });
        
        // 2 saniye sonra sayfa yenile
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        toast.success('✓ Storage limitleri zaten doğru');
        setResults(result);
      }
    } catch (error) {
      console.error('Quick fix error:', error);
      toast.error('Storage limitleri düzeltilemedi');
    } finally {
      setLoading(false);
    }
  };

  if (!userProfile || userProfile.role !== 'yönetici') {
    return (
      <div className="p-8 max-w-2xl mx-auto">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-2">Erişim Reddedildi</h1>
          <p className="text-gray-600">Bu sayfa sadece yöneticiler içindir.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">⚡ Quick Storage Fix</h1>
        <p className="text-gray-600">
          Enterprise planında 5GB yerine 500GB göstermek için hızlı düzeltme
        </p>
      </div>

      {/* Current Problem */}
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
        <h3 className="text-red-800 font-medium mb-2">🚨 Mevcut Sorun</h3>
        <ul className="text-red-700 text-sm space-y-1">
          <li>• Manager sayfa: <strong>0.01 GB / 5 GB</strong> (Yanlış!)</li>
          <li>• SuperAdmin sayfa: <strong>0.0 GB / 5 GB</strong> (Yanlış!)</li>
          <li>• Enterprise plan: <strong>500GB</strong> olması gerekiyor</li>
          <li>• Company veritabanında <code>storageLimit</code> field'ı eksik</li>
        </ul>
      </div>

      {/* Company Info */}
      {company && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-blue-800">{company.name}</h4>
              <p className="text-sm text-blue-600">
                Plan: <strong>{company.subscriptionPlan || 'N/A'}</strong>
              </p>
            </div>
            <Button
              onClick={handleQuickFix}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? 'Düzeltiliyor...' : '⚡ Hızlı Düzelt'}
            </Button>
          </div>
        </div>
      )}

      {/* Results */}
      {results && (
        <div className={`border rounded-lg p-6 ${
          results.updated ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200'
        }`}>
          <h3 className={`font-medium mb-4 ${
            results.updated ? 'text-green-800' : 'text-blue-800'
          }`}>
            {results.updated ? '✅ Düzeltme Tamamlandı' : 'ℹ️ Durum Raporu'}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Eski Limitler</h4>
              <div className="bg-white rounded p-3 text-sm">
                <p>Storage: {results.oldLimits?.storage || 'N/A'}</p>
                <p>StorageLimit: {results.oldLimits?.storageLimit || 'Eksik!'} MB</p>
                <p>Users: {results.oldLimits?.users || 'N/A'}</p>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Yeni Limitler</h4>
              <div className="bg-white rounded p-3 text-sm">
                <p>Storage: <strong>{results.newLimits?.storage}</strong></p>
                <p>StorageLimit: <strong>{results.newLimits?.storageLimit} MB</strong> 
                   ({(results.newLimits?.storageLimit / 1024).toFixed(2)} GB)</p>
                <p>Users: <strong>{results.newLimits?.users}</strong></p>
              </div>
            </div>
          </div>
          
          {results.updated && (
            <div className="mt-4 p-3 bg-green-100 rounded">
              <p className="text-green-800 text-sm">
                🎉 Sayfa 2 saniye içinde otomatik yenilenecek ve doğru limitler gösterilecek!
              </p>
            </div>
          )}
        </div>
      )}

      {/* Instructions */}
      <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h4 className="text-yellow-800 font-medium mb-2">📋 Sonrası</h4>
        <ul className="text-yellow-700 text-sm space-y-1">
          <li>1. ⚡ "Hızlı Düzelt" butonuna tık</li>
          <li>2. Sayfa otomatik yenilenecek</li>
          <li>3. Manager sayfa: <strong>0.01 GB / 500 GB</strong> gösterecek</li>
          <li>4. SuperAdmin sayfa da güncellenecek</li>
        </ul>
      </div>
    </div>
  );
};

export default QuickStorageFix;
