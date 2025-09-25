/**
 * 📋 Plan Yönetimi - SuperAdmin
 * Abonelik planlarının fiyat ve özelliklerini düzenleme
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  getDefaultPlans, 
  getMergedPlans, 
  updateSinglePlan, 
  subscribeToMergedPlans,
  savePlans 
} from '../../services/planConfigService';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  Button,
  Input,
  Switch,
  LoadingSpinner,
  Badge
} from '../../components/ui';
import { 
  Save, 
  RefreshCw, 
  DollarSign, 
  Users, 
  HardDrive,
  Building2,
  Zap,
  Crown
} from 'lucide-react';
import toast from 'react-hot-toast';

const PlanManagement: React.FC = () => {
  const { userProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [plans, setPlans] = useState<Record<string, any>>({});
  const [editedPlans, setEditedPlans] = useState<Record<string, any>>({});

  // Yetki kontrolü
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

  // Planları yükle ve dinle
  useEffect(() => {
    const loadPlans = async () => {
      try {
        const merged = await getMergedPlans();
        setPlans(merged);
        setEditedPlans(merged);
      } catch (error) {
        console.error('Planlar yüklenemedi:', error);
        toast.error('Planlar yüklenirken hata oluştu');
      } finally {
        setLoading(false);
      }
    };

    loadPlans();

    // Gerçek zamanlı güncelleme dinleyicisi
    const unsubscribe = subscribeToMergedPlans((updatedPlans) => {
      setPlans(updatedPlans);
      setEditedPlans(updatedPlans);
    });

    return () => unsubscribe();
  }, []);

  // Plan güncelleme
  const handleUpdatePlan = async (planId: string) => {
    try {
      setSaving(planId);
      const planData = editedPlans[planId];
      await updateSinglePlan(planId, planData);
      toast.success(`${planData.displayName} güncellendi`);
    } catch (error) {
      console.error('Plan güncelleme hatası:', error);
      toast.error('Plan güncellenemedi');
    } finally {
      setSaving(null);
    }
  };

  // İlk planları oluştur ve kaydet
  const handleCreateInitialPlans = async () => {
    try {
      setSaving('all');
    const initialPlans = {
      trial: {
        id: 'trial',
        name: 'Deneme',
        displayName: '14 Gün Ücretsiz Deneme',
        description: 'Tüm özellikleri 14 gün boyunca ücretsiz deneyin',
        price: 0,
        currency: 'TRY',
        billingPeriod: 'trial',
        duration: 14,
        color: '#F59E0B',
        icon: '🎯',
        popular: false,
        limits: { users: 3, sahalar: 2, santraller: 3, storageGB: 1, arizaKaydi: 50, bakimKaydi: 20 },
        features: {
          dashboard: true, arizaYonetimi: true, bakimTakibi: true, uretimTakibi: true,
          stokYonetimi: true, vardiyaTakibi: true, emailNotification: true, exportPDF: true,
          support: 'email'
        }
      },
      starter: {
        id: 'starter',
        name: 'Başlangıç',
        displayName: 'Başlangıç Paketi',
        description: 'Küçük işletmeler için',
        price: 999,
        currency: 'TRY',
        billingPeriod: 'monthly',
        yearlyPrice: 9990,
        color: '#3B82F6',
        icon: '⚡',
        popular: false,
        limits: { users: 5, sahalar: 5, santraller: 10, storageGB: 5, arizaKaydi: 200, bakimKaydi: 100 },
        features: {
          dashboard: true, arizaYonetimi: true, bakimTakibi: true, uretimTakibi: true,
          stokYonetimi: true, vardiyaTakibi: true, customReports: true, emailNotification: true,
          exportPDF: true, exportExcel: true, support: 'email'
        }
      },
      professional: {
        id: 'professional',
        name: 'Profesyonel',
        displayName: 'Profesyonel Paket',
        description: 'Orta ölçekli işletmeler için',
        price: 2499,
        currency: 'TRY',
        billingPeriod: 'monthly',
        yearlyPrice: 24990,
        color: '#10B981',
        icon: '🚀',
        popular: true,
        limits: { users: 20, sahalar: 20, santraller: 50, storageGB: 50, arizaKaydi: 1000, bakimKaydi: 500 },
        features: {
          dashboard: true, arizaYonetimi: true, bakimTakibi: true, uretimTakibi: true,
          stokYonetimi: true, vardiyaTakibi: true, aiAnomaliTespiti: true, aiTahminleme: true,
          customReports: true, apiAccess: true, webhooks: true, whatsappIntegration: true,
          smsNotification: true, emailNotification: true, exportPDF: true, exportExcel: true,
          dataImport: true, support: 'priority', sla: '24 saat', training: 'online'
        }
      },
      enterprise: {
        id: 'enterprise',
        name: 'Kurumsal',
        displayName: 'Kurumsal Paket',
        description: 'Büyük işletmeler için',
        price: 4999,
        currency: 'TRY',
        billingPeriod: 'monthly',
        yearlyPrice: 49990,
        color: '#8B5CF6',
        icon: '👑',
        popular: false,
        limits: { users: -1, sahalar: -1, santraller: -1, storageGB: 500, arizaKaydi: -1, bakimKaydi: -1 },
        features: {
          dashboard: true, arizaYonetimi: true, bakimTakibi: true, uretimTakibi: true,
          stokYonetimi: true, vardiyaTakibi: true, aiAnomaliTespiti: true, aiTahminleme: true,
          customReports: true, apiAccess: true, webhooks: true, whatsappIntegration: true,
          smsNotification: true, emailNotification: true, exportPDF: true, exportExcel: true,
          dataImport: true, support: 'dedicated', sla: '4 saat', training: 'on-site',
          sso: true, audit: true, customIntegration: true, whiteLabel: true, multiTenant: true
        }
      }
    };
    
    // Direkt kaydet
    await savePlans(initialPlans);
    setPlans(initialPlans);
    setEditedPlans(initialPlans);
    toast.success('✅ Planlar başarıyla oluşturuldu!');
    } catch (error) {
      console.error('Plan oluşturma hatası:', error);
      toast.error('Plan oluşturulamadı');
    } finally {
      setSaving(null);
    }
  };

  // Varsayılana sıfırla
  const handleResetToDefault = () => {
    const defaults = getDefaultPlans();
    setEditedPlans(defaults);
    toast.success('Varsayılan değerlere sıfırlandı (henüz kaydedilmedi)');
  };

  // Input değişikliği
  const handleInputChange = (planId: string, field: string, value: any) => {
    setEditedPlans(prev => ({
      ...prev,
      [planId]: {
        ...prev[planId],
        [field]: value
      }
    }));
  };

  // Limit değişikliği
  const handleLimitChange = (planId: string, limitField: string, value: any) => {
    setEditedPlans(prev => ({
      ...prev,
      [planId]: {
        ...prev[planId],
        limits: {
          ...prev[planId].limits,
          [limitField]: value
        }
      }
    }));
  };

  // Özellik değişikliği
  const handleFeatureChange = (planId: string, feature: string, value: boolean) => {
    setEditedPlans(prev => ({
      ...prev,
      [planId]: {
        ...prev[planId],
        features: {
          ...prev[planId].features,
          [feature]: value
        }
      }
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  const planOrder = ['starter', 'professional', 'enterprise'];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Crown className="h-8 w-8 text-yellow-500" />
            Plan Yönetimi
          </h1>
          <p className="text-gray-600 mt-1">Abonelik planlarını düzenle</p>
        </div>
        <Button 
          onClick={handleResetToDefault}
          variant="outline"
          className="flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Varsayılana Sıfırla
        </Button>
      </div>

      {/* Planlar yoksa oluşturma butonu */}
      {(!plans || Object.keys(plans).length <= 1) && (
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="p-8 text-center">
            <div className="space-y-4">
              <Crown className="h-16 w-16 text-yellow-500 mx-auto" />
              <h2 className="text-xl font-bold text-gray-900">Henüz Plan Oluşturulmamış</h2>
              <p className="text-gray-600">Müşterileriniz için abonelik planları oluşturun</p>
              <Button 
                onClick={handleCreateInitialPlans}
                className="bg-yellow-500 hover:bg-yellow-600"
              >
                <Zap className="h-4 w-4 mr-2" />
                İlk Planları Oluştur
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Plan Kartları */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {planOrder.map(planId => {
          const plan = editedPlans[planId];
          if (!plan) return null;

          const hasChanges = JSON.stringify(plan) !== JSON.stringify(plans[planId]);

          return (
            <Card key={planId} className={`${plan.popular ? 'ring-2 ring-blue-500' : ''}`}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl">{plan.displayName}</CardTitle>
                    {plan.popular && (
                      <Badge variant="primary" className="mt-2">En Popüler</Badge>
                    )}
                  </div>
                  {hasChanges && (
                    <Badge variant="warning">Değiştirildi</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Fiyat */}
                <div>
                  <label className="block text-sm font-medium mb-1">Aylık Fiyat (₺)</label>
                  <Input
                    type="number"
                    value={plan.price}
                    onChange={(e) => handleInputChange(planId, 'price', parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>

                {/* Yıllık Fiyat */}
                <div>
                  <label className="block text-sm font-medium mb-1">Yıllık Fiyat (₺)</label>
                  <Input
                    type="number"
                    value={plan.yearlyPrice || plan.price * 10}
                    onChange={(e) => handleInputChange(planId, 'yearlyPrice', parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>

                {/* Limitler */}
                <div className="space-y-3 border-t pt-3">
                  <h4 className="font-medium text-sm">Limitler</h4>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        Kullanıcı
                      </label>
                      <Input
                        type="number"
                        value={plan.limits.users === -1 ? '' : plan.limits.users}
                        placeholder="Sınırsız"
                        onChange={(e) => handleLimitChange(planId, 'users', e.target.value ? parseInt(e.target.value) : -1)}
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <label className="text-xs flex items-center gap-1">
                        <Building2 className="h-3 w-3" />
                        Saha
                      </label>
                      <Input
                        type="number"
                        value={plan.limits.sahalar === -1 ? '' : plan.limits.sahalar}
                        placeholder="Sınırsız"
                        onChange={(e) => handleLimitChange(planId, 'sahalar', e.target.value ? parseInt(e.target.value) : -1)}
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <label className="text-xs flex items-center gap-1">
                        <Zap className="h-3 w-3" />
                        Santral
                      </label>
                      <Input
                        type="number"
                        value={plan.limits.santraller === -1 ? '' : plan.limits.santraller}
                        placeholder="Sınırsız"
                        onChange={(e) => handleLimitChange(planId, 'santraller', e.target.value ? parseInt(e.target.value) : -1)}
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <label className="text-xs flex items-center gap-1">
                        <HardDrive className="h-3 w-3" />
                        Depolama (GB)
                      </label>
                      <Input
                        type="number"
                        value={plan.limits.storageGB === -1 ? '' : plan.limits.storageGB}
                        placeholder="Sınırsız"
                        onChange={(e) => handleLimitChange(planId, 'storageGB', e.target.value ? parseInt(e.target.value) : -1)}
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>

                {/* Özellikler */}
                <div className="space-y-2 border-t pt-3">
                  <h4 className="font-medium text-sm mb-2">Özellikler</h4>
                  
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {Object.entries(plan.features).slice(0, 10).map(([feature, enabled]) => (
                      <div key={feature} className="flex items-center justify-between">
                        <label className="text-xs">{feature}</label>
                        <Switch
                          checked={enabled as boolean}
                          onCheckedChange={(checked) => handleFeatureChange(planId, feature, checked)}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Kaydet Butonu */}
                <Button 
                  onClick={() => handleUpdatePlan(planId)}
                  disabled={!hasChanges || saving === planId}
                  className="w-full"
                >
                  {saving === planId ? (
                    <>
                      <LoadingSpinner className="h-4 w-4 mr-2" />
                      Kaydediliyor...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Değişiklikleri Kaydet
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Bilgi Notu */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <DollarSign className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Plan Güncelleme Hakkında</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Değişiklikler kaydedildiğinde tüm sistemde anında yansır</li>
                <li>Mevcut müşterilerin planları etkilenmez, sadece yeni satışlar için geçerlidir</li>
                <li>Sınırsız değerler için alanı boş bırakın veya -1 girin</li>
                <li>Yıllık fiyat genelde aylık x 10 (2 ay indirimli) olarak hesaplanır</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PlanManagement;
