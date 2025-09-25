import React, { useState } from 'react';
import { devPhoneAuth, TEST_PHONE_NUMBERS, getTestInfo } from '../../services/devPhoneAuthService';
import { Button, Card, CardContent, CardHeader, CardTitle } from '../../components/ui';
import { Phone, Shield, AlertTriangle, Info } from 'lucide-react';

const DevPhoneAuthTest: React.FC = () => {
  const [phoneNumber, setPhoneNumber] = useState(TEST_PHONE_NUMBERS.tr1.phone);
  const [verificationCode, setVerificationCode] = useState('');
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [loading, setLoading] = useState(false);

  const handleSendSMS = async () => {
    setLoading(true);
    try {
      await devPhoneAuth.sendTestSMS(phoneNumber, 'recaptcha-dev-test');
      setStep('code');
    } catch (error) {
      console.error('Test SMS hatası:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    setLoading(true);
    try {
      const success = await devPhoneAuth.verifyTestCode(verificationCode);
      if (success) {
        alert('✅ Test başarılı! 2FA çalışıyor.');
        // Reset
        setStep('phone');
        setVerificationCode('');
        devPhoneAuth.cleanup();
      }
    } catch (error) {
      console.error('Kod doğrulama hatası:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectTestNumber = (testKey: keyof typeof TEST_PHONE_NUMBERS) => {
    const testData = TEST_PHONE_NUMBERS[testKey];
    setPhoneNumber(testData.phone);
    setVerificationCode(testData.code);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Test Bilgileri */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-6 w-6 text-blue-600" />
              Development Mode - Test Numaraları
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <pre className="text-sm font-mono text-blue-900 whitespace-pre-wrap">
                {getTestInfo()}
              </pre>
            </div>
            
            <div className="mt-4 flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => selectTestNumber('tr1')}
              >
                Test 1 Kullan
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => selectTestNumber('tr2')}
              >
                Test 2 Kullan
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => selectTestNumber('tr3')}
              >
                Test 3 Kullan
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Test Formu */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-green-600" />
              Test Mode Phone Auth (appVerificationDisabledForTesting)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Firebase Dokümantasyon Linki */}
            <div className="bg-gray-100 rounded-lg p-3">
              <p className="text-xs text-gray-600">
                📖 Firebase Dokümantasyonu:{' '}
                <a 
                  href="https://firebase.google.com/docs/auth/web/phone-auth?hl=tr#integration-testing"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  Integration Testing
                </a>
              </p>
            </div>

            {step === 'phone' ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Test Telefon Numarası
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="+905551234567"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      disabled={loading}
                    />
                    <Button
                      onClick={handleSendSMS}
                      disabled={loading || !phoneNumber}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Phone className="h-4 w-4 mr-2" />
                      Test SMS
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Test Doğrulama Kodu
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      placeholder="123456"
                      maxLength={6}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-center text-lg font-mono"
                      disabled={loading}
                    />
                    <Button
                      onClick={handleVerifyCode}
                      disabled={loading || verificationCode.length !== 6}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Doğrula
                    </Button>
                  </div>
                </div>

                <Button
                  variant="outline"
                  onClick={() => {
                    setStep('phone');
                    devPhoneAuth.cleanup();
                  }}
                  disabled={loading}
                >
                  Geri Dön
                </Button>
              </>
            )}

            {/* Invisible reCAPTCHA Container (Test modunda fake olacak) */}
            <div id="recaptcha-dev-test"></div>

            {/* Konsol Bilgisi */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium mb-1">Test Modu Aktif!</p>
                  <ul className="space-y-1 text-xs">
                    <li>• appVerificationDisabledForTesting = true</li>
                    <li>• Gerçek SMS gönderilmez</li>
                    <li>• Fake reCAPTCHA kullanılır</li>
                    <li>• Sadece test numaraları çalışır</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DevPhoneAuthTest;
