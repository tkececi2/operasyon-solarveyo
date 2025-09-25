import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Sun, Mail, Lock, Eye, EyeOff, Home } from 'lucide-react';
import Logo from '../../components/ui/Logo';
import { useAuth } from '../../contexts/AuthContext';
import { Button, Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui';
import toast from 'react-hot-toast';
import TwoFactorVerification from '../../components/auth/TwoFactorVerification';
import { twoFactorService } from '../../services/twoFactorService';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { trackEvent } from '../../lib/posthog-events';

const loginSchema = z.object({
  email: z.string().email('Geçerli bir email adresi giriniz'),
  password: z.string().min(6, 'Şifre en az 6 karakter olmalıdır'),
});

type LoginFormData = z.infer<typeof loginSchema>;

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [show2FA, setShow2FA] = useState(false);
  const [tempUserId, setTempUserId] = useState<string>('');
  const [temp2FAPhone, setTemp2FAPhone] = useState<string>('');
  const [tempCredentials, setTempCredentials] = useState<LoginFormData | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      // Önce kullanıcının 2FA durumunu kontrol et
      const userQuery = await getDoc(doc(db, 'kullanicilar', data.email));
      
      // Email ile kullanıcı bulunamazsa, normal login dene
      if (!userQuery.exists()) {
        await login(data.email, data.password);
        trackEvent.login('email'); // PostHog event
        navigate('/dashboard');
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
        navigate('/dashboard');
      }
    } catch (error: any) {
      // Email ile bulunamazsa, auth ile dene
      try {
        await login(data.email, data.password);
        
        // Giriş başarılı, şimdi 2FA kontrolü yap
        const { currentUser } = await import('firebase/auth').then(m => ({ currentUser: m.getAuth().currentUser }));
        
        if (currentUser) {
          const status = await twoFactorService.check2FAStatus(currentUser.uid);
          
          if (status.isEnabled) {
            setTempUserId(currentUser.uid);
            setTemp2FAPhone(status.phoneNumber || '');
            setTempCredentials(data);
            setShow2FA(true);
            // Çıkış yap, 2FA sonrası tekrar giriş yapılacak
            await import('firebase/auth').then(m => m.signOut(m.getAuth()));
          } else {
            navigate('/dashboard');
          }
        }
      } catch (loginError) {
        // Login hatası toast ile gösterilecek
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
      navigate('/dashboard');
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
      {/* Ana Sayfaya Dön Butonu */}
      <Link 
        to="/" 
        className="absolute top-4 left-4 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
      >
        <Home className="w-5 h-5" />
        <span className="text-sm font-medium">Ana Sayfa</span>
      </Link>

      <div className="w-full max-w-md">
        {/* Logo ve Başlık */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-2">
            <Logo />
          </div>
          <p className="text-gray-600 mt-1">Solar Enerji Santralı Yönetim Sistemi</p>
        </div>

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
