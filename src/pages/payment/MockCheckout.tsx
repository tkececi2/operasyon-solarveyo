import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CreditCard, Shield, CheckCircle, Loader2 } from 'lucide-react';
import { Button, Card, CardContent, Input } from '../../components/ui';
import { SAAS_CONFIG, getPlanById } from '../../config/saas.config';

const MockCheckout: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentInfo, setPaymentInfo] = useState({
    companyId: '',
    planId: '', // planName -> planId
    planPrice: 0
  });
  const [cardInfo, setCardInfo] = useState({
    cardNumber: '5528 7900 0000 0008',
    expiryDate: '12/30',
    cvv: '123',
    cardHolderName: 'Test User'
  });

  useEffect(() => {
    // URL parametrelerinden ödeme bilgilerini al
    const companyId = searchParams.get('companyId') || '';
    const planId = searchParams.get('planId') || searchParams.get('planName') || 'starter'; // backward compatibility
    
    // SAAS_CONFIG'den plan bilgilerini al
    const plan = getPlanById(planId);
    const planPrice = plan ? plan.price : 299; // varsayılan fiyat
    const planName = plan ? plan.displayName : 'Starter';
    
    setPaymentInfo({ companyId, planId, planPrice });
    
    console.log('Mock ödeme bilgileri (SAAS_CONFIG):', { companyId, planId, planName, planPrice });
  }, [searchParams]);

  const handlePayment = async () => {
    setIsProcessing(true);
    
    // 2-3 saniye ödeme simülasyonu
    await new Promise(resolve => setTimeout(resolve, 2500));
    
    // Başarılı ödeme sonucu ile callback sayfasına yönlendir
    const plan = getPlanById(paymentInfo.planId);
    const planName = plan ? plan.displayName : 'Plan';
    
    navigate(`/payment/callback?token=mock-success-token&status=success&companyId=${paymentInfo.companyId}&planId=${paymentInfo.planId}&planName=${planName}&planPrice=${paymentInfo.planPrice}`);
  };

  const handleCancel = () => {
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <Card className="shadow-xl">
          <CardContent className="p-8">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CreditCard className="h-8 w-8 text-green-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Mock İyzico Ödeme
              </h1>
              <p className="text-gray-600 text-sm">
                Bu test ödeme sayfasıdır. Gerçek para transferi yapılmaz.
              </p>
            </div>

            {/* Güvenlik Bildirimi */}
            <div className="flex items-center space-x-2 p-3 bg-blue-50 rounded-lg mb-6">
              <Shield className="h-5 w-5 text-blue-600" />
              <div className="text-sm">
                <p className="font-medium text-blue-800">Test Modu</p>
                <p className="text-blue-700">256-bit SSL ile korunmaktadır</p>
              </div>
            </div>

            {/* Kart Bilgileri Formu */}
            <div className="space-y-4 mb-6">
              <Input
                label="Kart Numarası"
                value={cardInfo.cardNumber}
                onChange={(e) => setCardInfo(prev => ({ ...prev, cardNumber: e.target.value }))}
                placeholder="5528 7900 0000 0008"
                disabled={isProcessing}
              />

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Son Kullanma"
                  value={cardInfo.expiryDate}
                  onChange={(e) => setCardInfo(prev => ({ ...prev, expiryDate: e.target.value }))}
                  placeholder="MM/YY"
                  disabled={isProcessing}
                />
                <Input
                  label="CVV"
                  value={cardInfo.cvv}
                  onChange={(e) => setCardInfo(prev => ({ ...prev, cvv: e.target.value }))}
                  placeholder="123"
                  disabled={isProcessing}
                />
              </div>

              <Input
                label="Kart Sahibi"
                value={cardInfo.cardHolderName}
                onChange={(e) => setCardInfo(prev => ({ ...prev, cardHolderName: e.target.value }))}
                placeholder="Test User"
                disabled={isProcessing}
              />
            </div>

            {/* Test Kartı Bilgisi */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <h4 className="font-medium text-yellow-800 mb-2">Test Kartı Bilgileri</h4>
              <div className="text-sm text-yellow-700 space-y-1">
                <p><strong>Kart No:</strong> 5528 7900 0000 0008</p>
                <p><strong>CVV:</strong> 123</p>
                <p><strong>Son Kullanma:</strong> 12/30</p>
                <p><strong>Sonuç:</strong> Başarılı ödeme</p>
              </div>
            </div>

            {/* Ödeme Tutarı */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Toplam Tutar:</span>
                <span className="text-2xl font-bold text-gray-900">₺{paymentInfo.planPrice.toLocaleString()}.00</span>
              </div>
              <div className="text-sm text-gray-500 mt-1">
                KDV Dahil - SolarVeyo {getPlanById(paymentInfo.planId)?.displayName || 'Plan'} Plan
              </div>
            </div>

            {/* Ödeme Butonları */}
            <div className="space-y-3">
              <Button
                onClick={handlePayment}
                disabled={isProcessing}
                className="w-full py-3"
                size="lg"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Ödeme İşleniyor...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-5 w-5 mr-2" />
                    Ödemeyi Tamamla
                  </>
                )}
              </Button>

              <Button
                variant="ghost"
                onClick={handleCancel}
                disabled={isProcessing}
                className="w-full"
              >
                İptal Et
              </Button>
            </div>

            {/* İyzico Logo */}
            <div className="text-center mt-6 pt-4 border-t">
              <div className="text-xs text-gray-500">
                Güvenli ödeme altyapısı
              </div>
              <div className="text-sm font-semibold text-green-600 mt-1">
                Mock iyzico
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MockCheckout;
