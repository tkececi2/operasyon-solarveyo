import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, LoadingSpinner, Input, Textarea } from '../../components/ui';
import { listUpgradeRequests, approveUpgradeRequest, rejectUpgradeRequest } from '../../services/subscriptionRequestService';
import { getMergedPlans } from '../../services/planConfigService';
import { toast } from 'react-hot-toast';

interface UpgradeRow {
  id: string;
  companyId: string;
  companyName?: string;
  requestedPlanId: string;
  currentPlanId?: string;
  requestedBy?: { id: string; name?: string; email?: string };
  note?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: { toDate?: () => Date } | Date;
}

const UpgradeRequests: React.FC = () => {
  const { userProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<UpgradeRow[]>([]);
  const [plans, setPlans] = useState<Record<string, any>>({});

  if (!userProfile || userProfile.rol !== 'superadmin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-96">
          <CardHeader>
            <CardTitle className="text-red-600">Yetkisiz Erişim</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">Bu sayfa sadece SuperAdmin kullanıcıları için.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const load = async () => {
    try {
      setLoading(true);
      try {
        const [list, merged] = await Promise.all([
          listUpgradeRequests('pending', 100),
          getMergedPlans()
        ]);
        setRows(list as any);
        setPlans(merged as any);
      } catch (err: any) {
        // Firestore index hatasında client-side fallback kullan
        if (typeof err?.message === 'string' && err.message.includes('requires an index')) {
          const [all, merged] = await Promise.all([
            listUpgradeRequests('all', 200),
            getMergedPlans()
          ]);
          setRows((all as any).filter((r: any) => r.status === 'pending'));
          setPlans(merged as any);
        } else {
          throw err;
        }
      }
    } catch (e) {
      console.error(e);
      toast.error('Talepler yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const approve = async (id: string) => {
    try {
      await approveUpgradeRequest(id, { id: userProfile.id, name: userProfile.ad });
      toast.success('Talep onaylandı');
      await load();
    } catch (e) {
      console.error(e);
      toast.error('Onaylanamadı');
    }
  };

  const reject = async (id: string) => {
    const reason = window.prompt('Red sebebi (opsiyonel):') || '';
    try {
      await rejectUpgradeRequest(id, { id: userProfile.id, name: userProfile.ad }, reason);
      toast.success('Talep reddedildi');
      await load();
    } catch (e) {
      console.error(e);
      toast.error('Reddedilemedi');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Yükseltme Talepleri</h1>
        <Button variant="ghost" onClick={load}>Yenile</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Bekleyen Talepler ({rows.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <div className="p-8 text-center text-gray-600">Bekleyen talep yok.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500">
                    <th className="px-3 py-2">Şirket</th>
                    <th className="px-3 py-2">Talep</th>
                    <th className="px-3 py-2">Not</th>
                    <th className="px-3 py-2">Tarih</th>
                    <th className="px-3 py-2">İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(r => {
                    const plan = plans[r.requestedPlanId] || { displayName: r.requestedPlanId };
                    const date = (r.createdAt as any)?.toDate ? (r.createdAt as any).toDate() : (r.createdAt as Date);
                    return (
                      <tr key={r.id} className="border-t">
                        <td className="px-3 py-2">
                          <div className="font-medium text-gray-900">{r.companyName || r.companyId}</div>
                          <div className="text-xs text-gray-500">{r.requestedBy?.name || r.requestedBy?.email || '-'}</div>
                        </td>
                        <td className="px-3 py-2">
                          <Badge variant="secondary">{r.currentPlanId || 'mevcut'} → {plan.displayName}</Badge>
                        </td>
                        <td className="px-3 py-2 max-w-xs truncate" title={r.note || ''}>{r.note || '-'}</td>
                        <td className="px-3 py-2">{date ? date.toLocaleString('tr-TR') : '-'}</td>
                        <td className="px-3 py-2 flex gap-2">
                          <Button size="sm" onClick={() => approve(r.id)}>Onayla</Button>
                          <Button size="sm" variant="ghost" onClick={() => reject(r.id)}>Reddet</Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UpgradeRequests;


