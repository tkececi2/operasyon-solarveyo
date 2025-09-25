import React, { useState, useEffect } from 'react';
import { doc, getDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import toast from 'react-hot-toast';

const ClearFirebasePlans: React.FC = () => {
  const [hasFirebaseData, setHasFirebaseData] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    checkFirebaseData();
  }, []);

  const checkFirebaseData = async () => {
    try {
      setChecking(true);
      const ref = doc(db, 'config', 'saas_plans');
      const snap = await getDoc(ref);
      setHasFirebaseData(snap.exists());
    } catch (error) {
      console.error('Firebase kontrol hatası:', error);
      setHasFirebaseData(false);
    } finally {
      setChecking(false);
    }
  };

  const clearFirebase = async () => {
    if (!confirm('Firebase\'deki tüm plan verilerini silmek istediğinize emin misiniz?\n\nBu işlem geri alınamaz!')) {
      return;
    }

    try {
      setLoading(true);
      const ref = doc(db, 'config', 'saas_plans');
      await deleteDoc(ref);
      toast.success('Firebase plan verileri temizlendi!');
      setHasFirebaseData(false);
    } catch (error) {
      console.error('Temizleme hatası:', error);
      toast.error('Temizleme başarısız');
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="p-8">
        <div className="animate-pulse">Firebase kontrol ediliyor...</div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Firebase Plan Temizleme</h1>
      
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Durum</h2>
        
        {hasFirebaseData ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
              <span className="text-yellow-700">Firebase'de plan verileri bulundu</span>
            </div>
            
            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded">
              <p className="text-sm text-yellow-800">
                Firebase'deki plan verileri, config dosyasındaki varsayılan değerleri eziyor olabilir.
                Eğer fiyatlar yanlış görünüyorsa, bu verileri temizlemeniz gerekebilir.
              </p>
            </div>

            <button
              onClick={clearFirebase}
              disabled={loading}
              className="w-full px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 font-medium"
            >
              {loading ? 'Temizleniyor...' : '🗑️ Firebase Verilerini Temizle'}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-green-700">Firebase'de plan verisi yok (Temiz)</span>
            </div>
            
            <div className="bg-green-50 border border-green-200 p-4 rounded">
              <p className="text-sm text-green-800">
                ✅ Sistem şu an config dosyasındaki varsayılan fiyatları kullanıyor:
              </p>
              <ul className="mt-2 space-y-1 text-sm">
                <li>• Başlangıç: ₺999/ay</li>
                <li>• Profesyonel: ₺2.499/ay</li>
                <li>• Kurumsal: ₺4.999/ay</li>
              </ul>
            </div>
          </div>
        )}
      </div>

      <div className="bg-blue-50 border border-blue-200 p-4 rounded">
        <h3 className="font-semibold text-blue-800 mb-2">📝 Not:</h3>
        <p className="text-sm text-blue-700">
          Firebase'deki verileri temizledikten sonra, tüm kullanıcılar config dosyasındaki 
          varsayılan fiyatları görecektir. Süper admin isterse "Planlar" sayfasından 
          fiyatları tekrar güncelleyebilir.
        </p>
      </div>
    </div>
  );
};

export default ClearFirebasePlans;
