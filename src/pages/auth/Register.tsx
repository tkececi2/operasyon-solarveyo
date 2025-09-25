import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Sun, Mail, Lock, Eye, EyeOff, User, Building, Phone, Home } from 'lucide-react';
import Logo from '../../components/ui/Logo';
import { useAuth } from '../../contexts/AuthContext';
import { Button, Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui';

const registerSchema = z.object({
  companyName: z.string().min(2, 'Şirket adı en az 2 karakter olmalıdır'),
  fullName: z.string().min(2, 'Ad soyad en az 2 karakter olmalıdır'),
  email: z.string().email('Geçerli bir email adresi giriniz'),
  phone: z.string().optional(),
  password: z.string().min(6, 'Şifre en az 6 karakter olmalıdır'),
  confirmPassword: z.string().min(6, 'Şifre tekrarı gereklidir'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Şifreler eşleşmiyor",
  path: ["confirmPassword"],
});

type RegisterFormData = z.infer<typeof registerSchema>;

const Register: React.FC = () => {
  const navigate = useNavigate();
  const { register: registerUser } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    try {
      const userData = {
        ad: data.fullName,
        telefon: data.phone,
        rol: 'yonetici' as const, // İlk kullanıcı yönetici olur
        companyName: data.companyName, // Şirket adı
      };

      await registerUser(data.email, data.password, userData);
      navigate('/login');
    } catch (error) {
      // Hata toast ile gösterilecek (AuthContext'te)
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-solar-50 flex items-center justify-center p-4">
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
          <p className="text-gray-600 mt-1">Hesap oluşturun ve başlayın</p>
        </div>

        {/* Kayıt Formu */}
        <Card>
          <CardHeader>
            <CardTitle>Kayıt Ol</CardTitle>
            <CardDescription>
              Yeni hesabınızı oluşturun
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              {/* Şirket Adı */}
              <div>
                <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-1">
                  Şirket Adı
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Building className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    {...register('companyName')}
                    type="text"
                    id="companyName"
                    autoComplete="organization"
                    className={`
                      block w-full pl-10 pr-3 py-2 border rounded-md
                      focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500
                      ${errors.companyName ? 'border-red-500' : 'border-gray-300'}
                    `}
                    placeholder="Şirket adınız"
                  />
                </div>
                {errors.companyName && (
                  <p className="mt-1 text-sm text-red-600">{errors.companyName.message}</p>
                )}
              </div>

              {/* Ad Soyad */}
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                  Ad Soyad
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    {...register('fullName')}
                    type="text"
                    id="fullName"
                    autoComplete="name"
                    className={`
                      block w-full pl-10 pr-3 py-2 border rounded-md
                      focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500
                      ${errors.fullName ? 'border-red-500' : 'border-gray-300'}
                    `}
                    placeholder="Adınız ve soyadınız"
                  />
                </div>
                {errors.fullName && (
                  <p className="mt-1 text-sm text-red-600">{errors.fullName.message}</p>
                )}
              </div>

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

              {/* Telefon (Opsiyonel) */}
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Telefon <span className="text-gray-500">(Opsiyonel)</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    {...register('phone')}
                    type="tel"
                    id="phone"
                    autoComplete="tel"
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="0555 123 45 67"
                  />
                </div>
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
                    autoComplete="new-password"
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

              {/* Şifre Tekrarı */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  Şifre Tekrarı
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    {...register('confirmPassword')}
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    autoComplete="new-password"
                    className={`
                      block w-full pl-10 pr-10 py-2 border rounded-md
                      focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500
                      ${errors.confirmPassword ? 'border-red-500' : 'border-gray-300'}
                    `}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
                )}
              </div>
            </CardContent>

            <CardFooter className="flex flex-col space-y-4">
              <Button
                type="submit"
                fullWidth
                loading={isLoading}
              >
                Hesap Oluştur
              </Button>

              <div className="text-center text-sm">
                <span className="text-gray-600">Zaten hesabınız var mı? </span>
                <Link
                  to="/login"
                  className="font-medium text-primary-600 hover:text-primary-500"
                >
                  Giriş Yapın
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>

        {/* Deneme Süresi Bilgisi */}
        <div className="mt-6 p-4 bg-green-50 rounded-lg">
          <p className="text-sm text-green-800 font-medium mb-2">🎉 30 Gün Ücretsiz Deneme</p>
          <div className="space-y-1 text-sm text-green-700">
            <p>✅ Tüm özellikler dahil</p>
            <p>✅ Kredi kartı gerektirmez</p>
            <p>✅ İstediğiniz zaman iptal edebilirsiniz</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
