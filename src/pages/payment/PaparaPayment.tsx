import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, Smartphone, QrCode, Shield, Clock, TrendingUp, CheckCircle } from 'lucide-react';
import { Card, Button } from '../../components/ui';
import { useAuth } from '../../hooks/useAuth';
import { useCompany } from '../../hooks/useCompany';
import paparaService from '../../services/payment/paparaService';
import { SAAS_CONFIG } from '../../config/saas.config';
import toast from 'react-hot-toast';

const PaparaPayment: React.FC = () => {
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const { company } = useCompany();
  const [selectedPlan, setSelectedPlan] = useState<string>('professional');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [paymentMethod, setPaymentMethod] = useState<'link' | 'qr'>('link');
  const [loading, setLoading] = useState(false);
  const [paymentLink, setPaymentLink] = useState<string>('');
  const [qrCode, setQrCode] = useState<string>('');
  const [commission, setCommission] = useState<any>(null);

  // Plan seçildiğinde komisyon hesapla
  useEffect(() => {
    const plan = SAAS_CONFIG.PLANS[selectedPlan as keyof typeof SAAS_CONFIG.PLANS];
    if (plan) {
      const amount = billingCycle === 'yearly' 
        ? (plan as any).yearlyPrice || plan.price * 12
        : plan.price;
      
      const calc = paparaService.calculateCommission(amount);
      setCommission(calc);
    }
  }, [selectedPlan, billingCycle]);

  const handleCreatePayment = async () => {
    if (!userProfile || !company) return;

    setLoading(true);
    try {
      const plan = SAAS_CONFIG.PLANS[selectedPlan as keyof typeof SAAS_CONFIG.PLANS];
      const amount = billingCycle === 'yearly' 
        ? (plan as any).yearlyPrice || plan.price * 12
        : plan.price;

      if (paymentMethod === 'link') {
        // Ödeme linki oluştur
        const result = await paparaService.createPaymentLink({
          planId: selectedPlan,
          companyId: company.id,
          amount,
          description: `SolarVeyo ${plan.displayName} - ${billingCycle === 'yearly' ? 'Yıllık' : 'Aylık'}`,
          customerEmail: userProfile.email,
          customerPhone: userProfile.telefon || ''
        });

        if (result.success) {
          setPaymentLink(result.paymentLink);
          toast.success('Ödeme linki oluşturuldu!');
        }
      } else {
        // QR kod oluştur
        const result = await paparaService.createQRPayment({
          amount,
          description: `SolarVeyo ${plan.displayName}`,
          companyId: company.id
        });

        if (result.success) {
          setQrCode(result.qrCodeUrl);
          toast.success('QR kod oluşturuldu!');
        }
      }
    } catch (error) {
      console.error('Ödeme hatası:', error);
      toast.error('Ödeme işlemi başlatılamadı');
    } finally {
      setLoading(false);
    }
  };

  const plans = Object.values(SAAS_CONFIG.PLANS).filter(p => p.id !== 'trial');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Papara ile Güvenli Ödeme
          </h1>
          <p className="text-xl text-gray-600">
            Şirket kurmadan, TC kimliğinizle hemen ödeme alın
          </p>
          
          {/* Papara Avantajları */}
          <div className="flex flex-wrap justify-center gap-6 mt-8">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-green-600" />
              <span className="text-sm text-gray-700">256-bit Güvenlik</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600" />
              <span className="text-sm text-gray-700">Anında Onay</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-purple-600" />
              <span className="text-sm text-gray-700">%1.99 Komisyon</span>
            </div>
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-orange-600" />
              <span className="text-sm text-gray-700">12 Taksit İmkanı</span>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Sol: Plan Seçimi */}
          <div className="lg:col-span-2 space-y-6">
            {/* Faturalama Periyodu */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Faturalama Periyodu</h3>
              <div className="flex gap-4">
                <button
                  onClick={() => setBillingCycle('monthly')}
                  className={`flex-1 py-3 px-4 rounded-lg border-2 transition-all ${
                    billingCycle === 'monthly'
                      ? 'border-blue-600 bg-blue-50 text-blue-600'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-semibold">Aylık Ödeme</div>
                  <div className="text-sm opacity-75">Her ay yenilenir</div>
                </button>
                <button
                  onClick={() => setBillingCycle('yearly')}
                  className={`flex-1 py-3 px-4 rounded-lg border-2 transition-all ${
                    billingCycle === 'yearly'
                      ? 'border-green-600 bg-green-50 text-green-600'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-semibold">Yıllık Ödeme</div>
                  <div className="text-sm opacity-75">%17 indirimli</div>
                </button>
              </div>
            </Card>

            {/* Plan Kartları */}
            <div className="space-y-4">
              {plans.map((plan) => {
                const price = billingCycle === 'yearly' 
                  ? (plan as any).yearlyPrice || plan.price * 12
                  : plan.price;
                
                return (
                  <Card
                    key={plan.id}
                    className={`p-6 cursor-pointer transition-all ${
                      selectedPlan === plan.id
                        ? 'ring-2 ring-blue-600 bg-blue-50'
                        : 'hover:shadow-lg'
                    }`}
                    onClick={() => setSelectedPlan(plan.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{plan.icon}</span>
                          <div>
                            <h3 className="text-xl font-semibold">{plan.displayName}</h3>
                            <p className="text-gray-600">{plan.description}</p>
                          </div>
                        </div>
                        
                        {/* Özellikler */}
                        <div className="mt-4 grid grid-cols-2 gap-2">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            <span>{plan.limits.users === -1 ? 'Sınırsız' : plan.limits.users} kullanıcı</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            <span>{plan.limits.sahalar === -1 ? 'Sınırsız' : plan.limits.sahalar} saha</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            <span>{plan.limits.santraller === -1 ? 'Sınırsız' : plan.limits.santraller} santral</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            <span>{plan.limits.storageGB}GB depolama</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Fiyat */}
                      <div className="text-right">
                        <div className="text-3xl font-bold">₺{price.toLocaleString('tr-TR')}</div>
                        <div className="text-sm text-gray-600">
                          {billingCycle === 'yearly' ? '/yıl' : '/ay'}
                        </div>
                        {plan.popular && (
                          <span className="inline-block mt-2 px-3 py-1 bg-green-600 text-white text-xs font-semibold rounded-full">
                            EN POPÜLER
                          </span>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>

            {/* Ödeme Yöntemi */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Ödeme Yöntemi</h3>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setPaymentMethod('link')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    paymentMethod === 'link'
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <CreditCard className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                  <div className="font-semibold">Link ile Ödeme</div>
                  <div className="text-sm text-gray-600">Kart / Cüzdan</div>
                </button>
                <button
                  onClick={() => setPaymentMethod('qr')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    paymentMethod === 'qr'
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <QrCode className="w-8 h-8 mx-auto mb-2 text-purple-600" />
                  <div className="font-semibold">QR Kod</div>
                  <div className="text-sm text-gray-600">Mobil Ödeme</div>
                </button>
              </div>
            </Card>
          </div>

          {/* Sağ: Özet ve Ödeme */}
          <div className="space-y-6">
            {/* Sipariş Özeti */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Sipariş Özeti</h3>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Plan</span>
                  <span className="font-semibold">
                    {SAAS_CONFIG.PLANS[selectedPlan as keyof typeof SAAS_CONFIG.PLANS]?.displayName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Periyot</span>
                  <span className="font-semibold">
                    {billingCycle === 'yearly' ? 'Yıllık' : 'Aylık'}
                  </span>
                </div>
                
                <div className="border-t pt-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tutar</span>
                    <span>₺{commission?.grossAmount.toLocaleString('tr-TR')}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Papara Komisyonu ({commission?.commissionRate})</span>
                    <span className="text-red-600">-₺{commission?.commission.toLocaleString('tr-TR')}</span>
                  </div>
                </div>
                
                <div className="border-t pt-3">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Toplam</span>
                    <span className="text-blue-600">₺{commission?.grossAmount.toLocaleString('tr-TR')}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    KDV dahil fiyattır. 14 gün ücretsiz deneme hakkınız vardır.
                  </p>
                </div>
              </div>

              {/* Ödeme Butonu */}
              <Button
                variant="primary"
                size="lg"
                className="w-full mt-6"
                onClick={handleCreatePayment}
                disabled={loading}
              >
                {loading ? 'İşleniyor...' : 'Ödemeyi Başlat'}
              </Button>

              {/* Ödeme Linki/QR Kod */}
              {paymentLink && (
                <div className="mt-4 p-4 bg-green-50 rounded-lg">
                  <p className="text-sm font-semibold text-green-800 mb-2">
                    Ödeme linki oluşturuldu!
                  </p>
                  <a
                    href={paymentLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline text-sm break-all"
                  >
                    {paymentLink}
                  </a>
                </div>
              )}

              {qrCode && (
                <div className="mt-4 text-center">
                  <p className="text-sm font-semibold text-gray-700 mb-2">
                    QR kodu telefonunuzla okutun
                  </p>
                  <img src={qrCode} alt="QR Kod" className="mx-auto" />
                  <p className="text-xs text-gray-500 mt-2">
                    5 dakika içinde geçerlidir
                  </p>
                </div>
              )}
            </Card>

            {/* Güvenlik Bilgisi */}
            <Card className="p-6 bg-blue-50">
              <div className="flex items-start gap-3">
                <Shield className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold text-blue-900 mb-2">
                    Güvenli Ödeme
                  </h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• 256-bit SSL şifreleme</li>
                    <li>• PCI DSS uyumlu</li>
                    <li>• 3D Secure koruması</li>
                    <li>• Kart bilgileriniz saklanmaz</li>
                  </ul>
                </div>
              </div>
            </Card>

            {/* Papara Bilgisi */}
            <Card className="p-6 bg-purple-50">
              <div className="flex items-start gap-3">
                <Smartphone className="w-6 h-6 text-purple-600 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold text-purple-900 mb-2">
                    Neden Papara?
                  </h4>
                  <ul className="text-sm text-purple-800 space-y-1">
                    <li>• Şirket kurmaya gerek yok</li>
                    <li>• TC kimlik yeterli</li>
                    <li>• En düşük komisyon (%1.99)</li>
                    <li>• Anında para çekme</li>
                    <li>• 7/24 müşteri desteği</li>
                  </ul>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Alt Bilgi */}
        <div className="mt-12 text-center text-sm text-gray-600">
          <p>
            Ödeme işleminiz Papara güvencesi altındadır. 
            Sorularınız için: <a href="tel:08501234567" className="text-blue-600 hover:underline">0850 123 45 67</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaparaPayment;
