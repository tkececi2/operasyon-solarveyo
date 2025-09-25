import React, { useState } from 'react';
import { doc, deleteDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import toast from 'react-hot-toast';

const ResetPlans: React.FC = () => {
  const [loading, setLoading] = useState(false);

  const resetEverything = async () => {
    if (!confirm('TÜM plan verilerini sıfırlamak istediğinize emin misiniz?\n\nBu işlem:\n1. Firebase\'deki tüm plan verilerini silecek\n2. Sistem varsayılan fiyatları kullanacak\n\nDevam etmek istiyor musunuz?')) {
      return;
    }

    try {
      setLoading(true);
      
      // Firebase'deki plan verilerini sil
      const ref = doc(db, 'config', 'saas_plans');
      await deleteDoc(ref);
      
      toast.success('✅ Plan verileri sıfırlandı!');
      
      // Sayfayı yenile
      setTimeout(() => {
        window.location.reload();
      }, 1500);
      
    } catch (error) {
      console.error('Sıfırlama hatası:', error);
      toast.error('Sıfırlama başarısız');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            🔄 Plan Fiyatlarını Sıfırla
          </h1>

          <div className="space-y-6">
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">
                    Mevcut Durum
                  </h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <p>Firebase'de özel fiyatlar tanımlı olabilir ve bunlar varsayılan fiyatları eziyor.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-green-50 border-l-4 border-green-400 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-green-800">
                    Sıfırlama Sonrası
                  </h3>
                  <div className="mt-2 text-sm text-green-700">
                    <p>Varsayılan fiyatlar kullanılacak:</p>
                    <ul className="mt-2 list-disc list-inside">
                      <li>Başlangıç: ₺999/ay</li>
                      <li>Profesyonel: ₺2.499/ay</li>
                      <li>Kurumsal: ₺4.999/ay</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">
                    Önemli Not
                  </h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <p>Süper admin daha sonra "Planlar" sayfasından fiyatları tekrar güncelleyebilir.</p>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={resetEverything}
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Sıfırlanıyor...
                </span>
              ) : (
                '🔄 Plan Fiyatlarını Sıfırla'
              )}
            </button>
          </div>
        </div>

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>Sorun devam ederse: Firebase Console → Firestore → config → saas_plans belgesini manuel silin</p>
        </div>
      </div>
    </div>
  );
};

export default ResetPlans;
