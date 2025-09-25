import React, { useEffect, useState } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Button, Card, CardContent, CardHeader, CardTitle, Input } from '../../components/ui';
import { useAuth } from '../../contexts/AuthContext';
import { SAAS_CONFIG } from '../../config/saas.config';
import { updateSinglePlan, getMergedPlans } from '../../services/planConfigService';
import { EditPlanModal } from '../../components/modals';
import { Link } from 'react-router-dom';
import { adminService } from '../../services/admin/adminService';

interface CompanyLite {
  id: string;
  name: string;
  isActive: boolean;
}

// Plan arayüzü
interface Plan {
  id: string;
  name: string;
  displayName: string;
  description: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  currency: string;
  billingPeriod: string;
  yearlyPrice?: number;
  popular: boolean;
  limits: {
    users: number;
    sahalar: number;
    santraller: number;
    storageGB: number;
    arizaKaydi: number;
    bakimKaydi: number;
    monthlyApiCalls: number;
  };
  features: Record<string, boolean>;
}

const AdminDashboard: React.FC = () => {
  const { userProfile } = useAuth();
  const [companies, setCompanies] = useState<CompanyLite[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCompanyName, setNewCompanyName] = useState('');
  const [plans, setPlans] = useState<Plan[]>([]);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const loadCompanies = async () => {
    setLoading(true);
    const snap = await getDocs(collection(db, 'companies'));
    const list: CompanyLite[] = snap.docs.map(d => ({ id: d.id, name: (d.data() as any).name || d.id, isActive: (d.data() as any).isActive !== false }));
    setCompanies(list);
    setLoading(false);
  };

  const loadPlans = async () => {
    console.log('loadPlans çağrıldı');
    try {
      // Merkezden (Firestore) + varsayılanlardan planları al
      const merged = await getMergedPlans();
      const planList: Plan[] = Object.values(merged).map((plan: any) => ({
        id: plan.id,
        name: plan.name,
        displayName: plan.displayName,
        description: plan.description,
        price: plan.price,
        originalPrice: plan.originalPrice,
        discount: plan.discount,
        currency: plan.currency,
        billingPeriod: plan.billingPeriod,
        yearlyPrice: plan.yearlyPrice,
        popular: plan.popular,
        limits: plan.limits,
        features: plan.features
      }));
      console.log('Planlar yüklendi:', planList);
      setPlans(planList);
    } catch (error) {
      console.error('Planlar yüklenirken hata oluştu:', error);
    }
  };

  useEffect(() => {
    loadCompanies();
    loadPlans();
  }, []);

  const createCompany = async () => {
    if (!newCompanyName.trim()) return;
    await addDoc(collection(db, 'companies'), { name: newCompanyName, isActive: true, createdAt: new Date() });
    setNewCompanyName('');
    await loadCompanies();
  };

  const toggleCompany = async (id: string, isActive: boolean) => {
    await updateDoc(doc(db, 'companies', id), { isActive: !isActive, updatedAt: new Date() });
    await loadCompanies();
  };

  const removeCompany = async (id: string) => {
    await deleteDoc(doc(db, 'companies', id));
    await loadCompanies();
  };

  const handleEditPlan = (plan: Plan) => {
    console.log('Düzenle butonuna tıklandı, plan:', plan);
    setEditingPlan(plan);
    setIsEditModalOpen(true);
    console.log('isEditModalOpen state güncellendi:', true);
  };

  useEffect(() => {
    console.log('AdminDashboard render edildi, isEditModalOpen:', isEditModalOpen, 'editingPlan:', editingPlan, 'plans:', plans);
  });

  const handleSavePlan = async (updatedPlan: Plan) => {
    console.log('handleSavePlan çağrıldı, updatedPlan:', updatedPlan);
    try {
      // Kalıcı plan güncelleme (Firestore) + şirket limitlerini senkronize et
      await adminService.updatePlan(updatedPlan.id, updatedPlan);
      await updateSinglePlan(updatedPlan.id, updatedPlan as any);
      await loadPlans();
      setIsEditModalOpen(false);
    } catch (error) {
      console.error('Plan güncellenirken hata oluştu:', error);
      alert('Plan güncellenirken bir hata oluştu. Lütfen tekrar deneyin.');
    }
  };

  if (!userProfile || userProfile.rol !== 'superadmin') {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>Yetkisiz</CardTitle>
          </CardHeader>
          <CardContent>Bu sayfa sadece Süper Admin içindir.</CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Yönetim Paneli</h1>
      </div>

      {/* Şirket Yönetimi */}
      <Card>
        <CardHeader>
          <CardTitle>Şirketler</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <Input placeholder="Yeni şirket adı" value={newCompanyName} onChange={(e: any) => setNewCompanyName(e.target.value)} />
            <Button onClick={createCompany}>Ekle</Button>
          </div>
          {loading ? (
            <div>Yükleniyor...</div>
          ) : (
            <div className="space-y-2">
              {companies.map((c) => (
                <div key={c.id} className="flex items-center justify-between border rounded p-3">
                  <div>
                    <div className="font-medium">{c.name}</div>
                    <div className="text-xs text-gray-500">{c.id}</div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="secondary" onClick={() => toggleCompany(c.id, c.isActive)}>{c.isActive ? 'Pasifleştir' : 'Aktifleştir'}</Button>
                    <Button variant="danger" onClick={() => removeCompany(c.id)}>Sil</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Paket Yönetimi */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Paket Yönetimi</CardTitle>
            <Link to="/admin/plan-guide">
              <Button variant="outline" size="sm">
                Rehber
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {plans.map((plan) => (
              <div key={plan.id} className={`border rounded-lg p-4 ${plan.popular ? 'ring-2 ring-blue-500' : ''}`}>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-lg">{plan.displayName}</h3>
                    <p className="text-2xl font-bold mt-2">
                      {plan.price === 0 ? 'Ücretsiz' : `${plan.price}₺`}
                      {plan.id !== 'trial' && plan.id !== 'enterprise' && (
                        <span className="text-sm font-normal text-gray-500">/ay</span>
                      )}
                    </p>
                  </div>
                  {plan.popular && (
                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">Popüler</span>
                  )}
                </div>
                
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Kullanıcı:</span>
                    <span className="font-medium">{plan.limits.users === -1 ? 'Sınırsız' : plan.limits.users}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Saha:</span>
                    <span className="font-medium">{plan.limits.sahalar === -1 ? 'Sınırsız' : plan.limits.sahalar}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Santral:</span>
                    <span className="font-medium">{plan.limits.santraller === -1 ? 'Sınırsız' : plan.limits.santraller}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Depolama:</span>
                    <span className="font-medium">{plan.limits.storageGB === -1 ? 'Sınırsız' : `${plan.limits.storageGB} GB`}</span>
                  </div>
                </div>
                
                <div className="mt-4">
                  <Button variant="outline" className="w-full" onClick={() => handleEditPlan(plan)}>
                    Düzenle
                  </Button>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-bold mb-2">Paket Özellikleri Nasıl Güncellenir?</h4>
            <p className="text-sm text-gray-700">
              Paket özelliklerini güncellemek için "Düzenle" butonuna tıklayabilirsiniz. 
              Ancak bu değişikliklerin kalıcı olabilmesi için <code className="bg-gray-200 px-1 rounded">src/config/saas.config.ts</code> dosyasının 
              manuel olarak güncellenmesi gerekmektedir. Detaylı bilgi için <Link to="/admin/plan-guide" className="text-blue-600 hover:underline">rehber sayfasını</Link> inceleyin.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Plan Düzenleme Modal */}
      <EditPlanModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        plan={editingPlan}
        onSave={handleSavePlan}
      />
    </div>
  );
};

export default AdminDashboard;