import React, { useState, useEffect } from 'react';
import { Modal, Button, Input, Switch, Card, CardContent } from '../ui';

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

interface EditPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: Plan | null;
  onSave: (updatedPlan: Plan) => void;
}

export const EditPlanModal: React.FC<EditPlanModalProps> = ({
  isOpen,
  onClose,
  plan,
  onSave
}) => {
  console.log('EditPlanModal render ediliyor, isOpen:', isOpen, 'plan:', plan);
  
  const [formData, setFormData] = useState<Plan>(plan || {
    id: '',
    name: '',
    displayName: '',
    description: '',
    price: 0,
    currency: 'TRY',
    billingPeriod: 'monthly',
    popular: false,
    limits: {
      users: 0,
      sahalar: 0,
      santraller: 0,
      storageGB: 0,
      arizaKaydi: 0,
      bakimKaydi: 0,
      monthlyApiCalls: 0
    },
    features: {}
  });
  
  console.log('formData state:', formData);

  useEffect(() => {
    console.log('useEffect çağrıldı, plan:', plan);
    if (plan) {
      setFormData(plan);
    }
  }, [plan]);

  const handleChange = (field: string, value: any) => {
    console.log('handleChange çağrıldı, field:', field, 'value:', value);
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleLimitsChange = (field: string, value: string) => {
    console.log('handleLimitsChange çağrıldı, field:', field, 'value:', value);
    // Boş değer girildiğinde -1 (sınırsız) olarak ayarla
    const numValue = value === '' ? -1 : Number(value);
    setFormData(prev => ({
      ...prev,
      limits: {
        ...prev.limits,
        [field]: numValue
      }
    }));
  };

  // Özellik anahtarları düzenlemeden kaldırıldı

  const handleSubmit = () => {
    onSave(formData);
  };

  if (!plan) {
    console.log('Plan null, modal render edilmiyor');
    return null;
  }

  // Özellikler listesi kullanım dışı

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`${plan.displayName} Paketini Düzenle`}>
      <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
        {/* Temel Bilgiler */}
        <Card>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Paket Adı</label>
                <Input
                  value={formData.displayName}
                  onChange={(e) => handleChange('displayName', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Fiyat (₺)</label>
                <Input
                  type="number"
                  value={formData.price}
                  onChange={(e) => handleChange('price', Number(e.target.value))}
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Açıklama</label>
              <Input
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Popüler Paket</span>
              <Switch
                checked={formData.popular}
                onChange={(checked) => handleChange('popular', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Limitler */}
        <Card>
          <CardContent className="space-y-4">
            <h3 className="font-medium">Limitler</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Kullanıcı Sayısı</label>
                <Input
                  type="number"
                  value={formData.limits.users === -1 ? '' : formData.limits.users}
                  onChange={(e) => handleLimitsChange('users', e.target.value)}
                  placeholder="Sınırsız için boş bırakın"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Saha Sayısı</label>
                <Input
                  type="number"
                  value={formData.limits.sahalar === -1 ? '' : formData.limits.sahalar}
                  onChange={(e) => handleLimitsChange('sahalar', e.target.value)}
                  placeholder="Sınırsız için boş bırakın"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Santral Sayısı</label>
                <Input
                  type="number"
                  value={formData.limits.santraller === -1 ? '' : formData.limits.santraller}
                  onChange={(e) => handleLimitsChange('santraller', e.target.value)}
                  placeholder="Sınırsız için boş bırakın"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Depolama (GB)</label>
                <Input
                  type="number"
                  value={formData.limits.storageGB === -1 ? '' : formData.limits.storageGB}
                  onChange={(e) => handleLimitsChange('storageGB', e.target.value)}
                  placeholder="Sınırsız için boş bırakın"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Özellikler bölümü kaldırıldı */}

        <div className="flex justify-end gap-3 sticky bottom-0 bg-white pt-4">
          <Button variant="outline" onClick={onClose}>
            İptal
          </Button>
          <Button onClick={handleSubmit}>
            Kaydet
          </Button>
        </div>
      </div>
    </Modal>
  );
};