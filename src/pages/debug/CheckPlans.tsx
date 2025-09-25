import React, { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { SAAS_CONFIG } from '../../config/saas.config';
import { getMergedPlans } from '../../services/planConfigService';

const CheckPlans: React.FC = () => {
  const [firebasePlans, setFirebasePlans] = useState<any>(null);
  const [mergedPlans, setMergedPlans] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPlans = async () => {
      try {
        // Firebase'den direkt oku
        const ref = doc(db, 'config', 'saas_plans');
        const snap = await getDoc(ref);
        if (snap.exists()) {
          setFirebasePlans(snap.data());
        } else {
          setFirebasePlans({ message: 'Firebase\'de plan verisi yok' });
        }

        // Merged planları al
        const merged = await getMergedPlans();
        setMergedPlans(merged);
      } catch (error) {
        console.error('Plan yükleme hatası:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPlans();
  }, []);

  if (loading) return <div className="p-8">Yükleniyor...</div>;

  return (
    <div className="p-8 space-y-8">
      <h1 className="text-2xl font-bold">Plan Verileri Debug</h1>
      
      <div>
        <h2 className="text-xl font-semibold mb-2">1. Config'deki Varsayılan Planlar</h2>
        <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-96">
          {JSON.stringify(SAAS_CONFIG.PLANS, null, 2)}
        </pre>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-2">2. Firebase'deki Planlar</h2>
        <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-96">
          {JSON.stringify(firebasePlans, null, 2)}
        </pre>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-2">3. Merged (Birleştirilmiş) Planlar</h2>
        <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-96">
          {JSON.stringify(mergedPlans, null, 2)}
        </pre>
      </div>

      <div className="bg-yellow-50 p-4 rounded">
        <h3 className="font-semibold">Analiz:</h3>
        {firebasePlans?.PLANS?.professional && (
          <div className="mt-2">
            <p>Firebase Professional Plan Fiyatı: {firebasePlans.PLANS.professional.price}</p>
            <p>Config Professional Plan Fiyatı: {SAAS_CONFIG.PLANS.professional.price}</p>
            <p>Merged Professional Plan Fiyatı: {mergedPlans?.professional?.price}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CheckPlans;
