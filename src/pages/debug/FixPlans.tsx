import React, { useState } from 'react';
import { doc, deleteDoc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { SAAS_CONFIG } from '../../config/saas.config';
import toast from 'react-hot-toast';

const FixPlans: React.FC = () => {
  const [loading, setLoading] = useState(false);

  const clearFirebasePlans = async () => {
    if (!confirm('Firebase\'deki plan verilerini silmek istediğinize emin misiniz?')) {
      return;
    }

    try {
      setLoading(true);
      const ref = doc(db, 'config', 'saas_plans');
      await deleteDoc(ref);
      toast.success('Firebase plan verileri temizlendi');
    } catch (error) {
      console.error('Temizleme hatası:', error);
      toast.error('Temizleme başarısız');
    } finally {
      setLoading(false);
    }
  };

  const resetToDefaults = async () => {
    if (!confirm('Firebase\'e varsayılan planları kaydetmek istediğinize emin misiniz?')) {
      return;
    }

    try {
      setLoading(true);
      const ref = doc(db, 'config', 'saas_plans');
      
      // Sadece temel bilgileri kaydet, tüm config'i değil
      const simplePlans: any = {};
      
      Object.entries(SAAS_CONFIG.PLANS).forEach(([key, plan]) => {
        simplePlans[key] = {
          id: plan.id,
          name: plan.name,
          displayName: plan.displayName,
          price: plan.price,
          yearlyPrice: plan.yearlyPrice || plan.price * 10,
          limits: plan.limits,
          features: plan.features
        };
      });
      
      await setDoc(ref, { 
        PLANS: simplePlans, 
        updatedAt: new Date().toISOString() 
      });
      
      toast.success('Varsayılan planlar Firebase\'e kaydedildi');
    } catch (error) {
      console.error('Kaydetme hatası:', error);
      toast.error('Kaydetme başarısız');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-2xl font-bold">Plan Verileri Düzeltme</h1>
      
      <div className="bg-yellow-50 border border-yellow-200 p-4 rounded">
        <h2 className="font-semibold text-yellow-800 mb-2">Dikkat!</h2>
        <p className="text-yellow-700">
          Bu işlemler Firebase'deki plan verilerini değiştirir. 
          Tüm sistemde etkisi olacaktır.
        </p>
      </div>

      <div className="space-y-4">
        <div className="border rounded p-4">
          <h3 className="font-semibold mb-2">1. Firebase Verilerini Temizle</h3>
          <p className="text-sm text-gray-600 mb-3">
            Firebase'deki tüm plan verilerini siler. Sistem varsayılan config'i kullanmaya başlar.
          </p>
          <button
            onClick={clearFirebasePlans}
            disabled={loading}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
          >
            {loading ? 'İşleniyor...' : 'Firebase Verilerini Temizle'}
          </button>
        </div>

        <div className="border rounded p-4">
          <h3 className="font-semibold mb-2">2. Varsayılana Sıfırla</h3>
          <p className="text-sm text-gray-600 mb-3">
            Config dosyasındaki varsayılan planları Firebase'e kaydeder.
            <br />
            Fiyatlar: Başlangıç ₺999, Profesyonel ₺2.499, Kurumsal ₺4.999
          </p>
          <button
            onClick={resetToDefaults}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'İşleniyor...' : 'Varsayılan Planları Kaydet'}
          </button>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 p-4 rounded">
        <h3 className="font-semibold text-blue-800 mb-2">Önerilen Çözüm:</h3>
        <ol className="list-decimal list-inside text-blue-700 space-y-1">
          <li>Önce "Firebase Verilerini Temizle" butonuna tıklayın</li>
          <li>Sonra "Varsayılan Planları Kaydet" butonuna tıklayın</li>
          <li>SuperAdmin → Planlar sayfasından fiyatları kontrol edin</li>
        </ol>
      </div>
    </div>
  );
};

export default FixPlans;
