import React, { useState } from 'react';
import {
  X,
  CreditCard,
  Shield,
  CheckCircle,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { Modal, Button, Input } from '../ui';
import { createSubscriptionPayment } from '../../services/iyzicoService';
import { SAAS_CONFIG, getPlanById } from '../../config/saas.config';
import { toast } from 'react-hot-toast';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  planId: string; // planName -> planId olarak değişti
  companyId: string;
  onPaymentSuccess: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  planId,
  companyId,
  onPaymentSuccess
}) => {
  // SAAS_CONFIG'den plan bilgilerini al
  const plan = getPlanById(planId);
  if (!plan) {
    console.error('Plan not found:', planId);
    return null;
  }
  
  const planName = plan.displayName;
  const planPrice = plan.price;
  const [isLoading, setIsLoading] = useState(false);
  const [userInfo, setUserInfo] = useState({
    name: '',
    surname: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    identityNumber: ''
  });

  const handleInputChange = (field: string, value: string) => {
    setUserInfo(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = (): boolean => {
    const required = ['name', 'surname', 'email', 'phone', 'address', 'city'];
    for (const field of required) {
      if (!userInfo[field as keyof typeof userInfo].trim()) {
        toast.error(`${getFieldLabel(field)} alanı zorunludur`);
        return false;
      }
    }

    // Email format kontrolü
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userInfo.email)) {
      toast.error('Geçerli bir email adresi giriniz');
      return false;
    }

    // Telefon format kontrolü
    const phoneRegex = /^[0-9]{10,11}$/;
    if (!phoneRegex.test(userInfo.phone.replace(/\s/g, ''))) {
      toast.error('Geçerli bir telefon numarası giriniz');
      return false;
    }

    return true;
  };

  const getFieldLabel = (field: string): string => {
    const labels: Record<string, string> = {
      name: 'Ad',
      surname: 'Soyad',
      email: 'Email',
      phone: 'Telefon',
      address: 'Adres',
      city: 'Şehir',
      identityNumber: 'TC Kimlik No'
    };
    return labels[field] || field;
  };

  const handlePayment = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      // planId'yi kullanarak ödeme isteği oluştur (SAAS_CONFIG entegrasyonu)
      const paymentResponse = await createSubscriptionPayment(
        companyId,
        planId, // SAAS_CONFIG'den plan ID
        userInfo
      );

      if (paymentResponse.status === 'success') {
        // Company ID'yi URL'e ekleyerek mock sayfasına yönlendir
        const paymentUrl = `${paymentResponse.paymentPageUrl}?companyId=${companyId}&planName=${planName}&planPrice=${planPrice}`;
        window.open(paymentUrl, '_blank');
        toast.success('Ödeme sayfası açıldı. Ödeme tamamlandıktan sonra bu sayfaya dönün.');
        
        // Modal'ı kapat ve başarı callback'ini çağır
        onPaymentSuccess();
        onClose();
      } else {
        toast.error('Ödeme sayfası oluşturulamadı');
      }
    } catch (error) {
      console.error('Ödeme hatası:', error);
      toast.error('Ödeme işlemi başlatılamadı');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Ödeme Bilgileri"
      size="lg"
    >
      <div className="space-y-6">
        {/* Plan Özeti */}
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900">
                SolarVeyo {planName} Plan
              </h3>
              <p className="text-sm text-gray-600">Aylık abonelik</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600">
                ₺{planPrice.toLocaleString()}
              </div>
              <div className="text-sm text-gray-500">KDV Dahil</div>
            </div>
          </div>
        </div>

        {/* Güvenlik Bildirimi */}
        <div className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg">
          <Shield className="h-5 w-5 text-green-600 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-green-800">Güvenli Ödeme</p>
            <p className="text-green-700">
              Ödemeniz iyzico güvencesi altında 256-bit SSL ile korunmaktadır.
            </p>
          </div>
        </div>

        {/* Fatura Bilgileri Formu */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">Fatura Bilgileri</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Ad *"
              value={userInfo.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Adınız"
              required
            />
            <Input
              label="Soyad *"
              value={userInfo.surname}
              onChange={(e) => handleInputChange('surname', e.target.value)}
              placeholder="Soyadınız"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Email *"
              type="email"
              value={userInfo.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="email@example.com"
              required
            />
            <Input
              label="Telefon *"
              value={userInfo.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              placeholder="05XX XXX XX XX"
              required
            />
          </div>

          <Input
            label="Adres *"
            value={userInfo.address}
            onChange={(e) => handleInputChange('address', e.target.value)}
            placeholder="Tam adresiniz"
            required
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Şehir *"
              value={userInfo.city}
              onChange={(e) => handleInputChange('city', e.target.value)}
              placeholder="İstanbul"
              required
            />
            <Input
              label="TC Kimlik No (Opsiyonel)"
              value={userInfo.identityNumber}
              onChange={(e) => handleInputChange('identityNumber', e.target.value)}
              placeholder="12345678901"
              maxLength={11}
            />
          </div>
        </div>

        {/* Test Kartı Bilgisi */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <div className="flex items-start space-x-2">
            <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-yellow-800">Test Modu</p>
              <p className="text-yellow-700">
                Test kartı: <code className="bg-yellow-100 px-1 rounded">5528 7900 0000 0008</code>
                <br />CVV: <code className="bg-yellow-100 px-1 rounded">123</code>, 
                Son Kullanma: <code className="bg-yellow-100 px-1 rounded">12/30</code>
              </p>
            </div>
          </div>
        </div>

        {/* Ödeme Butonu */}
        <div className="flex justify-end space-x-3 pt-4 border-t">
          <Button variant="ghost" onClick={onClose} disabled={isLoading}>
            İptal
          </Button>
          <Button 
            onClick={handlePayment}
            disabled={isLoading}
            className="min-w-[150px]"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Yönlendiriliyor...
              </>
            ) : (
              <>
                <CreditCard className="h-4 w-4 mr-2" />
                Ödemeye Geç
              </>
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
