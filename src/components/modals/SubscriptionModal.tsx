import React, { useState, useEffect } from 'react';
import {
  X,
  Calendar,
  DollarSign,
  Package,
  Clock,
  CheckCircle,
  AlertTriangle,
  CreditCard
} from 'lucide-react';
import { Modal, Button, Input } from '../ui';
// import { CompanyStats } from '../../services/superAdminService';
// import { updateCompanySubscription } from '../../services/superAdminService';
import { getPlansArray } from '../../config/subscriptionPlans.config';
import { toast } from 'react-hot-toast';
import { addDays, addMonths, addYears } from 'date-fns';
import { PaymentModal } from './PaymentModal';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  company: CompanyStats | null;
  onUpdate: () => void;
}



export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
  isOpen,
  onClose,
  company,
  onUpdate
}) => {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState(company?.subscriptionPlan || 'Basic');
  const [customPrice, setCustomPrice] = useState(company?.monthlyRevenue || 0);
  const [extensionDays, setExtensionDays] = useState(30);
  const [isLoading, setIsLoading] = useState(false);
  const [plansLoading, setPlansLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  useEffect(() => {
    loadPlans();
  }, []);

  useEffect(() => {
    if (company?.subscriptionPlan) {
      setSelectedPlan(company.subscriptionPlan);
    }
  }, [company]);

  const loadPlans = async () => {
    try {
      const subscriptionPlans = await getAllSubscriptionPlans();
      console.log('Yüklenen planlar:', subscriptionPlans);
      setPlans(subscriptionPlans);
    } catch (error) {
      console.error('Planlar yüklenemedi:', error);
      toast.error('Abonelik planları yüklenemedi');
    } finally {
      setPlansLoading(false);
    }
  };

  if (!company) return null;

  const handleUpdateSubscription = async () => {
    setIsLoading(true);
    try {
      const plan = plans.find(p => p.name === selectedPlan);
      if (!plan) return;

      // Storage string'ini MB'a çevir
      const convertStorageToMB = (storage: string): number => {
        if (typeof storage === 'number') return storage;
        const match = storage.match(/(\d+)(GB|MB)/);
        if (!match) return 5120; // Varsayılan 5GB
        const value = parseInt(match[1]);
        const unit = match[2];
        return unit === 'GB' ? value * 1024 : value;
      };

      const now = new Date();
      const updates: any = {
        subscriptionPlan: selectedPlan,
        subscriptionPrice: customPrice || plan.price,
        subscriptionLimits: {
          ...plan.limits,
          storageLimit: convertStorageToMB(plan.limits.storage),
          users: plan.limits.users
        },
        subscriptionFeatures: plan.features,
        billingCycle: plan.billingPeriod,
        autoRenewal: true,
        lastPaymentDate: now, // Son ödeme tarihi olarak şimdi
        subscriptionStartDate: company.subscriptionStartDate || now, // İlk kez ayarlanıyorsa şimdi
        updatedAt: now
      };

      // Eğer deneme süresi varsa uzat
      if (company.subscriptionStatus === 'trial') {
        updates.trialEndDate = addDays(new Date(), extensionDays);
      } else {
        // Normal abonelik süresini uzat
        const currentEndDate = company.subscriptionEndDate || new Date();
        updates.subscriptionEndDate = addDays(currentEndDate, extensionDays);
      }

      await updateCompanySubscription(company.id, updates);
      toast.success('Abonelik başarıyla güncellendi!');
      onUpdate();
      onClose();
    } catch (error) {
      console.error('Abonelik güncelleme hatası:', error);
      toast.error('Abonelik güncellenemedi');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExtendTrial = async () => {
    setIsLoading(true);
    try {
      const newTrialEndDate = addDays(new Date(), extensionDays);
      await updateCompanySubscription(company.id, {
        trialEndDate: newTrialEndDate
      });
      toast.success(`Deneme süresi ${extensionDays} gün uzatıldı!`);
      onUpdate();
      onClose();
    } catch (error) {
      console.error('Deneme süresi uzatma hatası:', error);
      toast.error('Deneme süresi uzatılamadı');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Abonelik Yönetimi"
      size="lg"
    >
      <div className="space-y-6">
        {/* Mevcut Durum */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-medium text-gray-900 mb-3">Mevcut Abonelik</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Şirket:</span>
              <span className="ml-2 font-medium">{company.name}</span>
            </div>
            <div>
              <span className="text-gray-500">Mevcut Plan:</span>
              <span className="ml-2 font-medium">{company.subscriptionPlan}</span>
            </div>
            <div>
              <span className="text-gray-500">Durum:</span>
              <span className="ml-2 font-medium">
                {company.subscriptionStatus === 'active' && 'Aktif'}
                {company.subscriptionStatus === 'trial' && 'Deneme'}
                {company.subscriptionStatus === 'expired' && 'Süresi Dolmuş'}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Aylık Ücret:</span>
              <span className="ml-2 font-medium text-green-600">₺{company.monthlyRevenue}</span>
            </div>
          </div>
        </div>

        {/* Plan Seçimi */}
        <div>
          <h3 className="font-medium text-gray-900 mb-3">Plan Seçimi</h3>
          {plansLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative border-2 rounded-xl p-4 cursor-pointer transition-all ${
                  selectedPlan === plan.name
                    ? plan.color === 'orange' ? 'border-orange-500 bg-orange-50' :
                      plan.color === 'blue' ? 'border-blue-500 bg-blue-50' :
                      plan.color === 'purple' ? 'border-purple-500 bg-purple-50' :
                      plan.color === 'green' ? 'border-green-500 bg-green-50' :
                      'border-gray-500 bg-gray-50'
                    : 'border-gray-200 hover:border-gray-300'
                } ${plan.recommended ? 'ring-2 ring-green-500 ring-offset-2' : ''}`}
                onClick={() => {
                  setSelectedPlan(plan.name);
                  setCustomPrice(plan.price);
                }}
              >
                {plan.recommended && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-green-500 text-white text-xs px-3 py-1 rounded-full">
                      Önerilen
                    </span>
                  </div>
                )}
                
                <div className="text-center mb-3">
                  <h4 className="font-semibold text-gray-900">{plan.displayName}</h4>
                  <div className="text-3xl font-bold text-gray-900 mt-2">
                    {plan.price === 0 ? 'Ücretsiz' : `₺${plan.price}`}
                    {plan.price > 0 && <span className="text-sm font-normal text-gray-500">/ay</span>}
                  </div>
                  {plan.trial?.enabled && (
                    <p className="text-xs text-gray-500 mt-1">{plan.trial.duration} gün deneme</p>
                  )}
                </div>

                <div className="space-y-3">
                  {/* Limitler */}
                  <div className="border-t pt-3">
                    <h5 className="text-xs font-semibold text-gray-700 mb-2">Limitler</h5>
                    <ul className="space-y-1 text-xs text-gray-600">
                      <li>• {plan.limits.users === -1 ? 'Sınırsız' : plan.limits.users} kullanıcı</li>
                      <li>• {plan.limits.storage} depolama</li>
                      <li>• {plan.limits.sahalar === -1 ? 'Sınırsız' : plan.limits.sahalar} saha</li>
                      <li>• {plan.limits.santraller === -1 ? 'Sınırsız' : plan.limits.santraller} santral</li>
                      <li>• {plan.limits.arizaKaydi === -1 ? 'Sınırsız' : plan.limits.arizaKaydi} arıza/ay</li>
                      <li>• {plan.limits.bakimKaydi === -1 ? 'Sınırsız' : plan.limits.bakimKaydi} bakım/ay</li>
                    </ul>
                  </div>

                  {/* Özellikler */}
                  <div className="border-t pt-3">
                    <h5 className="text-xs font-semibold text-gray-700 mb-2">Özellikler</h5>
                    <ul className="space-y-1 text-xs">
                      <li className={plan.features.exportPDF ? 'text-green-600' : 'text-gray-400'}>
                        {plan.features.exportPDF ? '✓' : '✗'} PDF Export
                      </li>
                      <li className={plan.features.exportExcel ? 'text-green-600' : 'text-gray-400'}>
                        {plan.features.exportExcel ? '✓' : '✗'} Excel Export
                      </li>
                      <li className={plan.features.mobileApp ? 'text-green-600' : 'text-gray-400'}>
                        {plan.features.mobileApp ? '✓' : '✗'} Mobil Uygulama
                      </li>
                      <li className={plan.features.aiFeatures ? 'text-green-600' : 'text-gray-400'}>
                        {plan.features.aiFeatures ? '✓' : '✗'} AI Özellikleri
                      </li>
                      <li className={plan.features.whatsappIntegration ? 'text-green-600' : 'text-gray-400'}>
                        {plan.features.whatsappIntegration ? '✓' : '✗'} WhatsApp
                      </li>
                      <li className={plan.features.smsNotification ? 'text-green-600' : 'text-gray-400'}>
                        {plan.features.smsNotification ? '✓' : '✗'} SMS Bildirim
                      </li>
                    </ul>
                  </div>

                  {/* Destek */}
                  <div className="border-t pt-3">
                    <p className="text-xs text-gray-700">
                      <span className="font-semibold">Destek:</span> {plan.features.support}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          )}
        </div>

        {/* Özel Fiyat ve İndirimler */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Özel Fiyat (₺/ay)
            </label>
            <Input
              type="number"
              value={customPrice}
              onChange={(e) => setCustomPrice(Number(e.target.value))}
              placeholder="Özel fiyat girin"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              İndirim Oranı (%)
            </label>
            <div className="flex items-center space-x-2">
              <Input
                type="number"
                min="0"
                max="100"
                value={(() => {
                  const plan = plans.find(p => p.name === selectedPlan);
                  if (!plan || plan.price === 0) return 0;
                  return Math.round(((plan.price - customPrice) / plan.price) * 100);
                })()}
                onChange={(e) => {
                  const discount = Number(e.target.value);
                  const plan = plans.find(p => p.name === selectedPlan);
                  if (plan && plan.price > 0) {
                    setCustomPrice(Math.round(plan.price * (1 - discount / 100)));
                  }
                }}
                placeholder="İndirim %"
              />
              <span className="text-sm text-gray-500">indirim</span>
            </div>
          </div>
        </div>

        {/* Kampanya ve Notlar */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Kampanya / Özel Notlar
          </label>
          <textarea
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            rows={3}
            placeholder="Örn: Yıllık ödeme indirimi, özel kampanya, vb."
          />
        </div>

        {/* Süre Uzatma */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Abonelik Süresi
          </label>
          <div className="space-y-3">
            {/* Hızlı Seçimler */}
            <div className="grid grid-cols-4 gap-2">
              <Button
                variant={extensionDays === 30 ? "primary" : "secondary"}
                onClick={() => setExtensionDays(30)}
                size="sm"
              >
                1 Ay
              </Button>
              <Button
                variant={extensionDays === 90 ? "primary" : "secondary"}
                onClick={() => setExtensionDays(90)}
                size="sm"
              >
                3 Ay
              </Button>
              <Button
                variant={extensionDays === 180 ? "primary" : "secondary"}
                onClick={() => setExtensionDays(180)}
                size="sm"
              >
                6 Ay
              </Button>
              <Button
                variant={extensionDays === 365 ? "primary" : "secondary"}
                onClick={() => setExtensionDays(365)}
                size="sm"
              >
                1 Yıl
              </Button>
            </div>
            
            {/* Özel Gün Girişi */}
            <div className="flex items-center space-x-2">
              <Input
                type="number"
                value={extensionDays}
                onChange={(e) => setExtensionDays(Number(e.target.value))}
                placeholder="Özel gün sayısı"
                className="w-32"
              />
              <span className="text-sm text-gray-500">gün</span>
            </div>
            
            {/* Yeni Bitiş Tarihi */}
            {company && (
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-700">
                  <strong>Mevcut Bitiş:</strong>{' '}
                  {company.subscriptionStatus === 'trial' 
                    ? company.trialEndDate?.toLocaleDateString('tr-TR') || 'Belirtilmemiş'
                    : company.subscriptionEndDate?.toLocaleDateString('tr-TR') || 'Belirtilmemiş'
                  }
                </p>
                <p className="text-sm text-green-700 mt-1">
                  <strong>Yeni Bitiş:</strong>{' '}
                  {addDays(
                    company.subscriptionStatus === 'trial' 
                      ? company.trialEndDate || new Date()
                      : company.subscriptionEndDate || new Date(),
                    extensionDays
                  ).toLocaleDateString('tr-TR')}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* İşlem Butonları */}
        <div className="flex justify-end space-x-3 pt-4 border-t">
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={isLoading}
          >
            İptal
          </Button>
          {company.subscriptionStatus === 'trial' && (
            <Button
              variant="warning"
              onClick={handleExtendTrial}
              disabled={isLoading}
            >
              <Clock className="h-4 w-4 mr-2" />
              Deneme Süresini Uzat
            </Button>
          )}
          <Button
            onClick={handleUpdateSubscription}
            disabled={isLoading}
            variant="secondary"
            className="mr-2"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Ücretsiz Güncelle
          </Button>
          <Button
            onClick={() => setShowPaymentModal(true)}
            variant="primary"
          >
            <CreditCard className="h-4 w-4 mr-2" />
            Ödeme ile Güncelle
          </Button>
        </div>
      </div>
      
      {/* Ödeme Modal */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        planName={selectedPlan}
        planPrice={customPrice || plans.find(p => p.name === selectedPlan)?.price || 0}
        companyId={company?.id || ''}
        onPaymentSuccess={() => {
          handleUpdateSubscription();
          setShowPaymentModal(false);
        }}
      />
    </Modal>
  );
};
