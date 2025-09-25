import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2, ArrowLeft } from 'lucide-react';
import { Button, Card, CardContent } from '../../components/ui';
import { retrievePaymentResult } from '../../services/iyzicoService';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../lib/firebase';
import { toast } from 'react-hot-toast';

const PaymentCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [paymentStatus, setPaymentStatus] = useState<'loading' | 'success' | 'failed'>('loading');
  const [paymentDetails, setPaymentDetails] = useState<any>(null);

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setPaymentStatus('failed');
      toast.error('Ödeme token\'i bulunamadı');
      return;
    }

    checkPaymentResult(token);
  }, [searchParams]);

  const checkPaymentResult = async (token: string) => {
    try {
      const result = await retrievePaymentResult(token);
      
      if (result.status === 'success' && result.paymentStatus === 'SUCCESS') {
        setPaymentStatus('success');
        setPaymentDetails(result);
        
        // Başarılı ödeme durumunda aboneliği güncelle
        await updateSubscriptionAfterPayment(result);
        
        toast.success('Ödeme başarılı! Aboneliğiniz güncellenmiştir.');
        
        // 3 saniye sonra dashboard'a yönlendir
        setTimeout(() => {
          navigate('/dashboard');
        }, 3000);
      } else {
        setPaymentStatus('failed');
        setPaymentDetails(result);
        toast.error('Ödeme başarısız: ' + (result.errorMessage || 'Bilinmeyen hata'));
      }
    } catch (error) {
      console.error('Ödeme kontrolü hatası:', error);
      setPaymentStatus('failed');
      toast.error('Ödeme durumu kontrol edilemedi');
    }
  };

  const updateSubscriptionAfterPayment = async (paymentResult: any) => {
    try {
      // URL parametrelerinden şirket bilgilerini al (mock ödeme için)
      const companyId = searchParams.get('companyId') || paymentResult.buyer?.id;
      const planName = searchParams.get('planName') || 'Professional';
      const planPrice = parseFloat(searchParams.get('planPrice') || paymentResult.paidPrice || '99');
      
      if (!companyId) {
        throw new Error('Şirket ID bulunamadı');
      }

      console.log('Abonelik güncellenecek:', { companyId, planName, planPrice });
      
      // Yeni dönem başlat (1 ay)
      const startFn = httpsCallable(functions, 'subscriptionStartNewPeriod');
      await startFn({ companyId, months: 1 });

    } catch (error) {
      console.error('Abonelik güncelleme hatası:', error);
      // Ödeme başarılı ama abonelik güncellenemedi - manuel kontrol gerekli
      toast.error('Ödeme başarılı ancak abonelik güncelleme sırasında hata oluştu. Destek ile iletişime geçin.');
    }
  };

  const renderContent = () => {
    switch (paymentStatus) {
      case 'loading':
        return (
          <div className="text-center py-12">
            <Loader2 className="h-12 w-12 text-blue-600 animate-spin mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              Ödeme Kontrol Ediliyor
            </h2>
            <p className="text-gray-600">
              Ödeme durumunuz kontrol edilmektedir, lütfen bekleyiniz...
            </p>
          </div>
        );

      case 'success':
        return (
          <div className="text-center py-12">
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-6" />
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Ödeme Başarılı!
            </h2>
            <p className="text-lg text-gray-600 mb-6">
              Aboneliğiniz başarıyla güncellenmiştir.
            </p>
            
            {paymentDetails && (
              <div className="bg-green-50 rounded-lg p-6 mb-6 text-left max-w-md mx-auto">
                <h3 className="font-semibold text-green-800 mb-3">Ödeme Detayları</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-green-700">Tutar:</span>
                    <span className="font-medium">₺{paymentDetails.paidPrice}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-700">Ödeme ID:</span>
                    <span className="font-medium">{paymentDetails.paymentId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-700">Tarih:</span>
                    <span className="font-medium">
                      {new Date().toLocaleDateString('tr-TR')}
                    </span>
                  </div>
                </div>
              </div>
            )}
            
            <p className="text-sm text-gray-500 mb-4">
              3 saniye içinde ana sayfaya yönlendirileceksiniz...
            </p>
            
            <Button onClick={() => navigate('/dashboard')}>
              Ana Sayfaya Dön
            </Button>
          </div>
        );

      case 'failed':
        return (
          <div className="text-center py-12">
            <XCircle className="h-16 w-16 text-red-600 mx-auto mb-6" />
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Ödeme Başarısız
            </h2>
            <p className="text-lg text-gray-600 mb-6">
              Ödemeniz gerçekleştirilemedi.
            </p>
            
            {paymentDetails?.errorMessage && (
              <div className="bg-red-50 rounded-lg p-4 mb-6 max-w-md mx-auto">
                <p className="text-sm text-red-700">
                  <strong>Hata:</strong> {paymentDetails.errorMessage}
                </p>
              </div>
            )}
            
            <div className="space-x-3">
              <Button 
                variant="secondary" 
                onClick={() => navigate('/dashboard')}
                leftIcon={<ArrowLeft className="h-4 w-4" />}
              >
                Ana Sayfaya Dön
              </Button>
              <Button onClick={() => window.location.reload()}>
                Tekrar Dene
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-2xl w-full">
        <Card>
          <CardContent className="p-8">
            {renderContent()}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PaymentCallback;
