/**
 * Two-Factor Authentication Setup Component
 * Kullanıcı ayarlarında 2FA kurulumu için
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Shield, Phone, Copy, RefreshCw, Check, X, AlertTriangle } from 'lucide-react';
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Badge } from '../ui';
import { twoFactorService, TwoFactorStatus } from '../../services/twoFactorService';
import { devPhoneAuth } from '../../services/devPhoneAuthService';
// Development modunda test servisini kullan
const isDevelopment = import.meta.env.DEV;
import toast from 'react-hot-toast';

const TwoFactorSetup: React.FC = () => {
  const { currentUser, userProfile } = useAuth();
  const [status, setStatus] = useState<TwoFactorStatus>({ isEnabled: false });
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [step, setStep] = useState<'setup' | 'verify' | 'complete'>('setup');
  const [loading, setLoading] = useState(false);
  const [isRequired, setIsRequired] = useState(false);

  // 2FA durumunu kontrol et
  useEffect(() => {
    if (currentUser) {
      loadStatus();
      checkIfRequired();
    }
  }, [currentUser]);

  const loadStatus = async () => {
    if (!currentUser) return;
    
    try {
      const currentStatus = await twoFactorService.check2FAStatus(currentUser.uid);
      setStatus(currentStatus);
      
      if (currentStatus.phoneNumber) {
        setPhoneNumber(currentStatus.phoneNumber);
      }
      
      if (currentStatus.backupCodes) {
        setBackupCodes(currentStatus.backupCodes);
      }
    } catch (error) {
      console.error('2FA durumu yüklenemedi:', error);
    }
  };

  const checkIfRequired = async () => {
    if (!userProfile) return;
    
    const required = await twoFactorService.isRequired2FA(userProfile.rol);
    setIsRequired(required);
  };

  // Telefon numarasına SMS gönder
  const handleSendCode = async () => {
    if (!phoneNumber) {
      toast.error('Lütfen telefon numaranızı girin');
      return;
    }

    // Telefon formatını kontrol et
    const cleanPhone = phoneNumber.replace(/\s/g, '').replace(/-/g, '');
    if (!cleanPhone.match(/^(\+90|0)?5[0-9]{9}$/)) {
      toast.error('Geçerli bir Türkiye telefon numarası girin (05XX XXX XX XX)');
      return;
    }

    setLoading(true);
    try {
      // Telefonu formatla
      let formattedPhone = cleanPhone;
      if (formattedPhone.startsWith('0')) {
        formattedPhone = '+90' + formattedPhone.substring(1); // 0'ı kaldır ve +90 ekle
      } else if (!formattedPhone.startsWith('+')) {
        formattedPhone = '+90' + formattedPhone;
      }
      
      // Recaptcha'yı başlat - normal (görünür) modda
      const recaptchaVerifier = twoFactorService.initializeRecaptcha('recaptcha-container');
      
      // Recaptcha'yı render et
      await recaptchaVerifier.render();
      
      // SMS gönder
      await twoFactorService.sendVerificationCode(formattedPhone);
      setStep('verify');
    } catch (error: any) {
      console.error('SMS gönderme hatası:', error);
      toast.error(error.message || 'SMS gönderilemedi');
    } finally {
      setLoading(false);
    }
  };

  // Doğrulama kodunu kontrol et
  const handleVerifyCode = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      toast.error('Lütfen 6 haneli doğrulama kodunu girin');
      return;
    }

    setLoading(true);
    try {
      const verified = await twoFactorService.verifyCode(verificationCode);
      
      if (verified && currentUser) {
        // 2FA'yı etkinleştir
        await twoFactorService.enable2FA(currentUser.uid, phoneNumber);
        
        // Backup kodları al
        const codes = await twoFactorService.regenerateBackupCodes(currentUser.uid);
        setBackupCodes(codes);
        
        setStep('complete');
        setStatus({ ...status, isEnabled: true, phoneNumber });
      }
    } catch (error: any) {
      toast.error(error.message || 'Doğrulama başarısız');
    } finally {
      setLoading(false);
    }
  };

  // 2FA'yı devre dışı bırak
  const handleDisable2FA = async () => {
    if (!currentUser) return;

    if (isRequired) {
      toast.error('Rolünüz gereği 2FA devre dışı bırakılamaz');
      return;
    }

    if (!confirm('2FA devre dışı bırakılacak. Emin misiniz?')) {
      return;
    }

    setLoading(true);
    try {
      await twoFactorService.disable2FA(currentUser.uid);
      setStatus({ isEnabled: false });
      setStep('setup');
      setVerificationCode('');
      setBackupCodes([]);
      toast.success('2FA devre dışı bırakıldı');
    } catch (error: any) {
      toast.error(error.message || 'İşlem başarısız');
    } finally {
      setLoading(false);
    }
  };

  // Backup kodları yenile
  const handleRegenerateBackupCodes = async () => {
    if (!currentUser) return;

    if (!confirm('Mevcut backup kodları geçersiz olacak. Yeni kodlar oluşturulsun mu?')) {
      return;
    }

    setLoading(true);
    try {
      const codes = await twoFactorService.regenerateBackupCodes(currentUser.uid);
      setBackupCodes(codes);
      setShowBackupCodes(true);
      toast.success('Yeni backup kodları oluşturuldu');
    } catch (error: any) {
      toast.error(error.message || 'İşlem başarısız');
    } finally {
      setLoading(false);
    }
  };

  // Backup kodlarını kopyala
  const copyBackupCodes = () => {
    const codesText = backupCodes.join('\n');
    navigator.clipboard.writeText(codesText);
    toast.success('Backup kodları kopyalandı');
  };

  // Telefon numarası formatla
  const formatPhoneDisplay = (phone: string) => {
    if (!phone) return '';
    // Son 4 haneyi göster
    return phone.replace(/(\+90)(\d{3})(\d{3})(\d{2})(\d{2})/, '$1 $2 *** ** $5');
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary-600" />
            <CardTitle>İki Faktörlü Doğrulama (2FA)</CardTitle>
          </div>
          {status.isEnabled ? (
            <Badge variant="success">Aktif</Badge>
          ) : (
            <Badge variant="secondary">Pasif</Badge>
          )}
        </div>
        <CardDescription>
          Hesabınızı daha güvenli hale getirmek için telefon doğrulaması ekleyin
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Zorunluluk uyarısı */}
        {isRequired && !status.isEnabled && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-900">
                2FA Zorunlu
              </p>
              <p className="text-sm text-amber-700 mt-1">
                {userProfile?.rol === 'superadmin' ? 'Süper Admin' : 'Yönetici'} rolünüz gereği 
                2FA etkinleştirmeniz gerekmektedir.
              </p>
            </div>
          </div>
        )}

        {/* 2FA Aktif Durumu */}
        {status.isEnabled && step !== 'complete' && (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <Check className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-green-900">
                    2FA Aktif
                  </p>
                  <p className="text-sm text-green-700 mt-1">
                    Telefon: {formatPhoneDisplay(status.phoneNumber || '')}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowBackupCodes(!showBackupCodes)}
                disabled={loading}
              >
                {showBackupCodes ? 'Kodları Gizle' : 'Backup Kodları Göster'}
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleRegenerateBackupCodes}
                disabled={loading}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Kodları Yenile
              </Button>

              {!isRequired && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDisable2FA}
                  disabled={loading}
                >
                  <X className="h-4 w-4 mr-2" />
                  2FA Kapat
                </Button>
              )}
            </div>

            {/* Backup Kodları */}
            {showBackupCodes && backupCodes.length > 0 && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium text-gray-900">
                    Yedek Kodlar
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={copyBackupCodes}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {backupCodes.map((code, index) => (
                    <code key={index} className="text-xs bg-white px-2 py-1 rounded border">
                      {code}
                    </code>
                  ))}
                </div>
                <p className="text-xs text-gray-600 mt-3">
                  Bu kodları güvenli bir yerde saklayın. Telefonunuza erişemezseniz bu kodlarla giriş yapabilirsiniz.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Setup Adımı */}
        {!status.isEnabled && step === 'setup' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Telefon Numarası
              </label>
              <div className="flex gap-2">
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="05XX XXX XX XX"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  disabled={loading}
                />
                <Button
                  onClick={handleSendCode}
                  disabled={loading || !phoneNumber}
                >
                  <Phone className="h-4 w-4 mr-2" />
                  SMS Gönder
                </Button>
              </div>
              <p className="text-xs text-gray-600 mt-1">
                Türkiye telefon numaranızı başında 0 ile girin
              </p>
            </div>
          </div>
        )}

        {/* Doğrulama Adımı */}
        {step === 'verify' && (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-900">
                {phoneNumber} numarasına SMS ile doğrulama kodu gönderildi.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Doğrulama Kodu
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="123456"
                  maxLength={6}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-center text-lg font-mono"
                  disabled={loading}
                />
                <Button
                  onClick={handleVerifyCode}
                  disabled={loading || verificationCode.length !== 6}
                >
                  Doğrula
                </Button>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setStep('setup')}
              disabled={loading}
            >
              Geri Dön
            </Button>
          </div>
        )}

        {/* Tamamlama Adımı */}
        {step === 'complete' && (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <Check className="h-6 w-6 text-green-600" />
                <div>
                  <p className="font-medium text-green-900">
                    2FA Başarıyla Etkinleştirildi!
                  </p>
                  <p className="text-sm text-green-700 mt-1">
                    Artık hesabınız daha güvenli.
                  </p>
                </div>
              </div>
            </div>

            {/* Backup Kodları Göster */}
            {backupCodes.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="font-medium text-amber-900">
                    Yedek Kodlarınız (Güvenli bir yerde saklayın!)
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={copyBackupCodes}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {backupCodes.map((code, index) => (
                    <code key={index} className="text-sm bg-white px-3 py-2 rounded border border-amber-300 font-mono">
                      {code}
                    </code>
                  ))}
                </div>
              </div>
            )}

            <Button
              onClick={() => {
                setStep('setup');
                loadStatus();
              }}
            >
              Tamam
            </Button>
          </div>
        )}

        {/* Recaptcha Container - Görünür olmalı */}
        <div id="recaptcha-container" className="flex justify-center mt-4"></div>
      </CardContent>
    </Card>
  );
};

export default TwoFactorSetup;
