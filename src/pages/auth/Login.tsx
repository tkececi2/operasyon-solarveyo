import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Sun, Mail, Lock, Eye, EyeOff, Home, AlertCircle, CheckCircle } from 'lucide-react';
import Logo from '../../components/ui/Logo';
import { useAuth } from '../../contexts/AuthContext';
import { platform } from '../../utils/platform';
import { IOSAuthService } from '../../services/iosAuthService';
import { Button, Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui';
import toast from 'react-hot-toast';
import TwoFactorVerification from '../../components/auth/TwoFactorVerification';
import { twoFactorService } from '../../services/twoFactorService';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { trackEvent } from '../../lib/posthog-events';
import { getAuth, sendEmailVerification as firebaseSendEmailVerification } from 'firebase/auth';

const loginSchema = z.object({
  email: z.string().email('Geçerli bir email adresi giriniz'),
  password: z.string().min(6, 'Şifre en az 6 karakter olmalıdır'),
});

type LoginFormData = z.infer<typeof loginSchema>;

const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, userProfile } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [registerMessage, setRegisterMessage] = useState<string | null>(null);

  // Register'dan gelen mesajı göster
  useEffect(() => {
    if (location.state?.message) {
      setRegisterMessage(location.state.message);
      // State'i temizle
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  // Login sonrası otomatik redirect
  useEffect(() => {
    if (userProfile && userProfile.id) {
      console.log('✅ UserProfile yüklendi - Dashboard\'a yönlendiriliyor...');
      navigate('/dashboard');
    }
  }, [userProfile, navigate]);
  const [show2FA, setShow2FA] = useState(false);
  const [tempUserId, setTempUserId] = useState<string>('');
  const [temp2FAPhone, setTemp2FAPhone] = useState<string>('');
  const [tempCredentials, setTempCredentials] = useState<LoginFormData | null>(null);

  // Eğer kullanıcı zaten girişliyse dashboard'a gönder
  React.useEffect(() => {
    try {
      const unsub = import('firebase/auth').then(m => {
        return m.onAuthStateChanged(m.getAuth(), (u) => {
          if (u) {
            // Navigate useEffect'te handle ediliyor
          }
        });
      });
      return () => {
        // unsubscribe promise döner, beklemeye gerek yok
      };
    } catch (_) { /* ignore */ }
  }, [navigate]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    
    // Network timeout koruması (30 saniye)
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('TIMEOUT')), 30000);
    });
    
    try {
      // Önce kullanıcının 2FA durumunu kontrol et
      const userQuery = await getDoc(doc(db, 'kullanicilar', data.email));
      
      // Email ile kullanıcı bulunamazsa, normal login dene
      if (!userQuery.exists()) {
        await login(data.email, data.password);
        trackEvent.login('email'); // PostHog event
        // Navigate useEffect'te handle ediliyor
        return;
      }

      const userData = userQuery.data();
      
      // 2FA aktifse, önce doğrulama iste
      if (userData.twoFactorEnabled) {
        setTempUserId(userQuery.id);
        setTemp2FAPhone(userData.twoFactorPhone);
        setTempCredentials(data);
        setShow2FA(true);
      } else {
        // 2FA yoksa normal giriş
        await login(data.email, data.password);
        
        // ✅ EMAIL DOĞRULAMA KONTROLÜ
        const auth = getAuth();
        const currentUser = auth.currentUser;
        
        if (currentUser) {
          // Firebase Auth'tan email doğrulama durumunu kontrol et
          await currentUser.reload(); // En güncel durumu al
          
          if (!currentUser.emailVerified) {
            // Email doğrulanmamış - çıkış yap ve uyar
            await auth.signOut();
            
            // Email doğrulama linki tekrar gönder
            try {
              await firebaseSendEmailVerification(currentUser);
              toast.error(
                'Email adresinizi doğrulamanız gerekiyor. Yeni bir doğrulama linki gönderildi.',
                { duration: 6000 }
              );
            } catch (emailError) {
              toast.error(
                'Email adresinizi doğrulamanız gerekiyor. Lütfen gelen kutunuzu kontrol edin.',
                { duration: 6000 }
              );
            }
            setIsLoading(false);
            return;
          }
          
          // Admin onay kontrolü (Firestore'dan)
          const userDocRef = doc(db, 'kullanicilar', currentUser.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            
            // Admin onayı gerekli mi kontrol et
            if (userData.adminApproved === false) {
              // Admin onayı bekliyor - çıkış yap ve uyar
              await auth.signOut();
              toast.error(
                'Hesabınız henüz yönetici tarafından onaylanmamış. Lütfen yöneticinizle iletişime geçin.',
                { duration: 6000 }
              );
              setIsLoading(false);
              return;
            }
          }
        }
        
        // iOS için bilgileri kaydet
        if (platform.isNative()) {
          await IOSAuthService.saveCredentials(data.email, data.password);
          console.log('📱 iOS: Login bilgileri kaydedildi');
        }
        
        // Login başarılı - AuthContext handle edecek
        console.log('✅ Login başarılı - AuthContext otomatik redirect yapacak');
      }
    } catch (error: any) {
      // Email ile bulunamazsa, auth ile dene
      try {
        await login(data.email, data.password);
        
        // ✅ EMAIL DOĞRULAMA KONTROLÜ (Catch bloğu)
        const auth = getAuth();
        const currentUser = auth.currentUser;
        
        if (currentUser) {
          // Firebase Auth'tan email doğrulama durumunu kontrol et
          await currentUser.reload();
          
          if (!currentUser.emailVerified) {
            await auth.signOut();
            try {
              await firebaseSendEmailVerification(currentUser);
              toast.error(
                'Email adresinizi doğrulamanız gerekiyor. Yeni bir doğrulama linki gönderildi.',
                { duration: 6000 }
              );
            } catch (emailError) {
              toast.error(
                'Email adresinizi doğrulamanız gerekiyor. Lütfen gelen kutunuzu kontrol edin.',
                { duration: 6000 }
              );
            }
            setIsLoading(false);
            return;
          }
          
          // Admin onay kontrolü
          const userDocRef = doc(db, 'kullanicilar', currentUser.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            if (userData.adminApproved === false) {
              await auth.signOut();
              toast.error(
                'Hesabınız henüz yönetici tarafından onaylanmamış. Lütfen yöneticinizle iletişime geçin.',
                { duration: 6000 }
              );
              setIsLoading(false);
              return;
            }
          }
        }
        
        // iOS için bilgileri kaydet
        if (platform.isNative()) {
          await IOSAuthService.saveCredentials(data.email, data.password);
          console.log('📱 iOS: Login bilgileri kaydedildi (catch bloğu)');
        }
        
        // Giriş başarılı, şimdi 2FA kontrolü yap
        const { currentUser: user2FA } = await import('firebase/auth').then(m => ({ currentUser: m.getAuth().currentUser }));
        
        if (user2FA) {
          const status = await twoFactorService.check2FAStatus(user2FA.uid);
          
          if (status.isEnabled) {
            setTempUserId(user2FA.uid);
            setTemp2FAPhone(status.phoneNumber || '');
            setTempCredentials(data);
            setShow2FA(true);
            // Çıkış yap, 2FA sonrası tekrar giriş yapılacak
            await import('firebase/auth').then(m => m.signOut(m.getAuth()));
          } else {
            // Navigate useEffect'te handle ediliyor
          }
        }
      } catch (loginError: any) {
        // Login hatası detaylı göster
        console.error('Login error:', loginError);
        console.error('Login error code:', loginError?.code);
        console.error('Login error message:', loginError?.message);
        
        // Timeout hatası
        if (loginError?.message === 'TIMEOUT') {
          toast.error('Bağlantı zaman aşımına uğradı. Lütfen internet bağlantınızı kontrol edin ve tekrar deneyin.');
          return;
        }
        
        // Firebase hata kodlarına göre özel mesajlar
        if (loginError?.code === 'auth/invalid-email') {
          toast.error('Geçersiz email adresi');
        } else if (loginError?.code === 'auth/user-disabled') {
          toast.error('Bu hesap devre dışı bırakılmış');
        } else if (loginError?.code === 'auth/user-not-found') {
          toast.error('Kullanıcı bulunamadı');
        } else if (loginError?.code === 'auth/wrong-password' || loginError?.code === 'auth/invalid-credential') {
          toast.error('Email veya şifre hatalı. Lütfen kontrol edip tekrar deneyin.');
        } else if (loginError?.code === 'auth/network-request-failed') {
          toast.error('İnternet bağlantısı hatası. Lütfen bağlantınızı kontrol edin.');
        } else if (loginError?.code === 'auth/too-many-requests') {
          toast.error('Çok fazla başarısız deneme. Lütfen birkaç dakika sonra tekrar deneyin.');
        } else if (loginError?.message === 'account-disabled') {
          toast.error('Hesabınız pasif durumda. Yöneticinizle iletişime geçin.');
        } else {
          // Genel hata - detaylı bilgi ver
          const errorMsg = loginError?.message || 'Bilinmeyen hata';
          const errorCode = loginError?.code || 'No error code';
          toast.error(`Giriş başarısız: ${errorMsg} (${errorCode})`);
          console.error('Detailed error:', JSON.stringify(loginError, null, 2));
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handle2FAVerified = async () => {
    if (!tempCredentials) return;
    
    setIsLoading(true);
    try {
      // 2FA doğrulandı, şimdi normal giriş yap
      await login(tempCredentials.email, tempCredentials.password);
      // Navigate useEffect'te handle ediliyor
    } catch (error) {
      toast.error('Giriş başarısız');
    } finally {
      setIsLoading(false);
      setShow2FA(false);
    }
  };

  const handle2FACancel = () => {
    setShow2FA(false);
    setTempUserId('');
    setTemp2FAPhone('');
    setTempCredentials(null);
  };

  // 2FA ekranını göster
  if (show2FA) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <TwoFactorVerification
          userId={tempUserId}
          phoneNumber={temp2FAPhone}
          onVerified={handle2FAVerified}
          onCancel={handle2FACancel}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      {/* Ana Sayfaya Dön Butonu - Sadece Web'de göster */}
      {!platform.isNative() && (
        <Link 
          to="/" 
          className="absolute top-4 left-4 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <Home className="w-5 h-5" />
          <span className="text-sm font-medium">Ana Sayfa</span>
        </Link>
      )}

      <div className="w-full max-w-md">
        {/* Logo ve Başlık */}
        <div className="text-center mb-8">
          <div className="flex flex-col items-center justify-center">
            <Logo showSubtitle={true} />
          </div>
          <p className="text-gray-600 mt-3">Solar Enerji Santralı Yönetim Sistemi</p>
        </div>

        {/* Register Başarı Mesajı */}
        {registerMessage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-green-800">{registerMessage}</p>
            </div>
            <button
              onClick={() => setRegisterMessage(null)}
              className="text-green-600 hover:text-green-800"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Giriş Formu */}
        <Card>
          <CardHeader>
            <CardTitle>Giriş Yap</CardTitle>
            <CardDescription>
              Hesabınıza giriş yaparak devam edin
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Adresi
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    {...register('email')}
                    type="email"
                    id="email"
                    autoComplete="email"
                    className={`
                      block w-full pl-10 pr-3 py-2 border rounded-md
                      focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500
                      ${errors.email ? 'border-red-500' : 'border-gray-300'}
                    `}
                    placeholder="ornek@email.com"
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>

              {/* Şifre */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Şifre
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    {...register('password')}
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    autoComplete="current-password"
                    className={`
                      block w-full pl-10 pr-10 py-2 border rounded-md
                      focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500
                      ${errors.password ? 'border-red-500' : 'border-gray-300'}
                    `}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                )}
              </div>

              {/* Şifremi Unuttum */}
              <div className="flex items-center justify-end">
                <Link
                  to="/forgot-password"
                  className="text-sm text-primary-600 hover:text-primary-500"
                >
                  Şifremi Unuttum
                </Link>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col space-y-4">
              <Button
                type="submit"
                fullWidth
                loading={isLoading}
              >
                Giriş Yap
              </Button>

              <div className="text-center text-sm">
                <span className="text-gray-600">Hesabınız yok mu? </span>
                <Link
                  to="/register"
                  className="font-medium text-primary-600 hover:text-primary-500"
                >
                  Kayıt Olun
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>

        {/* Bilgi kutuları kaldırıldı */}
      </div>
    </div>
  );
};

export default Login;
