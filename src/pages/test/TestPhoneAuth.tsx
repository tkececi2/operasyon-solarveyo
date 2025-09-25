import React, { useState } from 'react';
import { testPhoneAuth } from '../../services/testPhoneAuth';
import { Button, Card, CardContent, CardHeader, CardTitle } from '../../components/ui';
import { Phone, Shield, AlertTriangle } from 'lucide-react';

const TestPhoneAuth: React.FC = () => {
  const [phoneNumber, setPhoneNumber] = useState('+905551234567'); // Test numarası
  const [verificationCode, setVerificationCode] = useState('');
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [loading, setLoading] = useState(false);

  const handleSendSMS = async () => {
    setLoading(true);
    try {
      await testPhoneAuth.testSendSMS(phoneNumber, 'recaptcha-test');
      setStep('code');
    } catch (error) {
      console.error('SMS gönderme hatası:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    setLoading(true);
    try {
      const success = await testPhoneAuth.testVerifyCode(verificationCode);
      if (success) {
        alert('Başarılı! 2FA çalışıyor.');
        setStep('phone');
        setVerificationCode('');
      }
    } catch (error) {
      console.error('Kod doğrulama hatası:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-blue-600" />
              Firebase Phone Auth Test
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Uyarı Mesajı */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                <div>
                  <p className="font-medium text-amber-900">Firebase Yapılandırma Kontrol Listesi:</p>
                  <ul className="mt-2 space-y-1 text-sm text-amber-800">
                    <li>✓ Firebase Console'da Phone Auth aktif mi?</li>
                    <li>✓ Test numaraları eklediniz mi? (+905551234567 / 123456)</li>
                    <li>✓ reCAPTCHA ayarları yapıldı mı?</li>
                    <li>✓ Firebase projeniz doğru mu? (yenisirket-2ec3b)</li>
                  </ul>
                </div>
              </div>
            </div>

            {step === 'phone' ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Telefon Numarası
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="+905551234567"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={loading}
                    />
                    <Button
                      onClick={handleSendSMS}
                      disabled={loading || !phoneNumber}
                    >
                      <Phone className="h-4 w-4 mr-2" />
                      SMS Gönder
                    </Button>
                  </div>
                  <p className="text-xs text-gray-600 mt-2">
                    Test için: +905551234567 kullanın (Firebase'de test numarası olarak ekleyin)
                  </p>
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Doğrulama Kodu
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="123456"
                      maxLength={6}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-center text-lg font-mono"
                      disabled={loading}
                    />
                    <Button
                      onClick={handleVerifyCode}
                      disabled={loading || verificationCode.length !== 6}
                    >
                      Doğrula
                    </Button>
                  </div>
                  <p className="text-xs text-gray-600 mt-2">
                    Test kodu: 123456 (Firebase'de ayarladığınız test kodu)
                  </p>
                </div>

                <Button
                  variant="outline"
                  onClick={() => setStep('phone')}
                  disabled={loading}
                >
                  Geri Dön
                </Button>
              </>
            )}

            {/* reCAPTCHA Container */}
            <div id="recaptcha-test" className="flex justify-center"></div>

            {/* Debug Bilgileri */}
            <div className="bg-gray-100 rounded-lg p-4 mt-4">
              <p className="text-xs font-mono text-gray-600">
                Firebase Project: yenisirket-2ec3b<br/>
                Auth Domain: yenisirket-2ec3b.firebaseapp.com<br/>
                Current Step: {step}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Konsol Logları İçin Bilgi */}
        <div className="mt-4 text-center text-sm text-gray-600">
          <p>Hataları görmek için: F12 → Console</p>
        </div>
      </div>
    </div>
  );
};

export default TestPhoneAuth;
