import React, { useState } from 'react';
import { Card, CardContent, Button, LoadingSpinner } from '../../components/ui';
import { runSubscriptionMigration } from '../../utils/migrateSubscriptions';
import { useAuth } from '../../contexts/AuthContext';

const SubscriptionMigration: React.FC = () => {
  const { userProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ updated: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRun = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await runSubscriptionMigration();
      setResult(res);
    } catch (e: any) {
      setError(e?.message || 'Hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const canRun = userProfile?.rol === 'superadmin';

  return (
    <div className="p-6 max-w-xl mx-auto">
      <Card>
        <CardContent className="p-6 space-y-4">
          <h1 className="text-xl font-bold">Abonelik Migrasyonu</h1>
          <p className="text-sm text-gray-600">
            Tüm şirketlerde `nextBillingDate` alanını doldurur, denemeden çıkanlarda `trialEndDate` temizlenir ve statüler güncellenir.
          </p>
          {!canRun && (
            <div className="text-red-600 text-sm">Bu işlemi yalnızca SuperAdmin çalıştırabilir.</div>
          )}
          <Button onClick={handleRun} disabled={!canRun || loading}>
            {loading ? <LoadingSpinner size="sm" /> : 'Migrasyonu Çalıştır'}
          </Button>
          {result && (
            <div className="text-green-700 text-sm">Güncellenen şirket sayısı: {result.updated}</div>
          )}
          {error && (
            <div className="text-red-700 text-sm">{error}</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SubscriptionMigration;


