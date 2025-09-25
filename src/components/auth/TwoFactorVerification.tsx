/**
 * Two-Factor Verification Component
 * Login sırasında 2FA doğrulaması için
 */

import React, { useState, useEffect } from 'react';
import { Shield, Smartphone, Key } from 'lucide-react';
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui';
import { twoFactorService } from '../../services/twoFactorService';
import toast from 'react-hot-toast';

interface TwoFactorVerificationProps {
  userId: string;
  phoneNumber?: string;
  onVerified: () => void;
  onCancel: () => void;
}

const TwoFactorVerification: React.FC<TwoFactorVerificationProps> = ({
  userId,
  phoneNumber,
  onVerified,
  onCancel
}) => {
  const [verificationCode, setVerificationCode] = useState('');
  const [backupCode, setBackupCode] = useState('');
  const [useBackupCode, setUseBackupCode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [codeSent, setCodeSent] = useState(false);

  useEffect(() => {
    // Component mount olduğunda otomatik SMS gönder
    if (phoneNumber && !codeSent) {
      sendCode();
    }
  }, [phoneNumber]);

  const sendCode = async () => {
    if (!phoneNumber) {
      toast.error('Telefon numarası bulunamadı');
      return;
    }

    setLoading(true);
    try {
      // Recaptcha'yı başlat
      twoFactorService.initializeRecaptcha('recaptcha-2fa-login');
      
      // SMS gönder
      await twoFactorService.sendVerificationCode(phoneNumber);
      setCodeSent(true);
      toast.success('Doğrulama kodu gönderildi');
    } catch (error: any) {
      toast.error(error.message || 'SMS gönderilemedi');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (useBackupCode) {
      // Backup kodu ile doğrula
      if (!backupCode) {
        toast.error('Lütfen yedek kodu girin');
        return;
      }

      setLoading(true);
      try {
        const verified = await twoFactorService.verifyBackupCode(userId, backupCode);
        
        if (verified) {
          toast.success('Giriş başarılı!');
          onVerified();
        } else {
          toast.error('Geçersiz yedek kod');
        }
      } catch (error: any) {
        toast.error(error.message || 'Doğrulama başarısız');
      } finally {
        setLoading(false);
      }
    } else {
      // SMS kodu ile doğrula
      if (!verificationCode || verificationCode.length !== 6) {
        toast.error('Lütfen 6 haneli doğrulama kodunu girin');
        return;
      }

      setLoading(true);
      try {
        const verified = await twoFactorService.verifyCode(verificationCode);
        
        if (verified) {
          toast.success('Giriş başarılı!');
          onVerified();
        } else {
          toast.error('Geçersiz doğrulama kodu');
        }
      } catch (error: any) {
        toast.error(error.message || 'Doğrulama başarısız');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleResendCode = async () => {
    setVerificationCode('');
    await sendCode();
  };

  const formatPhoneDisplay = (phone: string) => {
    if (!phone) return '';
    // Son 2 haneyi göster
    return phone.replace(/(\+90)(\d{3})(\d{3})(\d{2})(\d{2})/, '$1 *** *** ** $5');
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary-600" />
          <CardTitle>İki Faktörlü Doğrulama</CardTitle>
        </div>
        <CardDescription>
          Güvenliğiniz için telefon doğrulaması gerekiyor
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {!useBackupCode ? (
          <>
            {/* SMS Doğrulama */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <Smartphone className="h-5 w-5 text-blue-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-900">
                    SMS ile Doğrulama
                  </p>
                  <p className="text-sm text-blue-700 mt-1">
                    {phoneNumber ? formatPhoneDisplay(phoneNumber) : 'Telefon numarası bulunamadı'}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Doğrulama Kodu
              </label>
              <input
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="123456"
                maxLength={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-center text-lg font-mono"
                disabled={loading}
                autoFocus
              />
              <p className="text-xs text-gray-600 mt-1">
                SMS ile gelen 6 haneli kodu girin
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                variant="primary"
                onClick={handleVerifyCode}
                disabled={loading || verificationCode.length !== 6}
                className="flex-1"
              >
                Doğrula ve Giriş Yap
              </Button>
            </div>

            <div className="flex items-center justify-between text-sm">
              <button
                type="button"
                onClick={handleResendCode}
                disabled={loading || !codeSent}
                className="text-primary-600 hover:text-primary-700 disabled:text-gray-400"
              >
                Kodu Tekrar Gönder
              </button>
              
              <button
                type="button"
                onClick={() => setUseBackupCode(true)}
                className="text-primary-600 hover:text-primary-700"
              >
                Yedek Kod Kullan
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Yedek Kod Doğrulama */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <Key className="h-5 w-5 text-amber-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-amber-900">
                    Yedek Kod ile Doğrulama
                  </p>
                  <p className="text-sm text-amber-700 mt-1">
                    2FA kurulumu sırasında verilen kodlardan birini girin
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Yedek Kod
              </label>
              <input
                type="text"
                value={backupCode}
                onChange={(e) => setBackupCode(e.target.value.toUpperCase())}
                placeholder="ABCD1234"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-center font-mono uppercase"
                disabled={loading}
                autoFocus
              />
              <p className="text-xs text-gray-600 mt-1">
                8 haneli yedek kodunuzu girin
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                variant="primary"
                onClick={handleVerifyCode}
                disabled={loading || !backupCode}
                className="flex-1"
              >
                Doğrula ve Giriş Yap
              </Button>
            </div>

            <button
              type="button"
              onClick={() => {
                setUseBackupCode(false);
                setBackupCode('');
              }}
              className="text-sm text-primary-600 hover:text-primary-700"
            >
              SMS Doğrulamaya Dön
            </button>
          </>
        )}

        <div className="pt-4 border-t">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={loading}
            className="w-full"
          >
            İptal
          </Button>
        </div>

        {/* Recaptcha Container */}
        <div id="recaptcha-2fa-login" className="flex justify-center mt-4"></div>
      </CardContent>
    </Card>
  );
};

export default TwoFactorVerification;
