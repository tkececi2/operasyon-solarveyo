import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Sun, Mail, Lock, Eye, EyeOff, User, Building, Phone, Home, Shield, CheckCircle, Zap } from 'lucide-react';
import Logo from '../../components/ui/Logo';
import { useAuth } from '../../contexts/AuthContext';
import { Button, Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui';

const registerSchema = z.object({
  companyName: z.string().min(2, 'Şirket adı en az 2 karakter olmalıdır'),
  fullName: z.string().min(2, 'Ad soyad en az 2 karakter olmalıdır'),
  email: z.string().email('Geçerli bir email adresi giriniz'),
  phone: z.string().min(10, 'Telefon numarası en az 10 haneli olmalıdır'),
  password: z.string().min(6, 'Şifre en az 6 karakter olmalıdır'),
  confirmPassword: z.string().min(6, 'Şifre tekrarı gereklidir'),
  // Honeypot - botları yakalamak için (kullanıcılar görmez)
  website: z.string().max(0, 'Geçersiz').optional(),
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
    // Honeypot kontrolü - bot ise engelle
    if (data.website) {
      console.warn('🤖 Bot tespit edildi - honeypot dolu');
      return;
    }

    setIsLoading(true);
    try {
      const userData = {
        ad: data.fullName,
        telefon: data.phone,
        rol: 'yonetici' as const, // İlk kullanıcı yönetici olur
        companyName: data.companyName,
        emailVerified: false, // Email doğrulanmadı
        adminApproved: true, // İlk kayıt otomatik onaylı (yönetici olduğu için)
        requiresEmailVerification: true, // Email doğrulama gerekli
      };

      await registerUser(data.email, data.password, userData);
      navigate('/login', { 
        state: { 
          message: 'Kayıt başarılı! Email adresinize gönderilen doğrulama linkine tıklayarak hesabınızı aktif edin.' 
        } 
      });
    } catch (error) {
      // Hata toast ile gösterilecek (AuthContext'te)
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-solar-50 flex">
      {/* Ana Sayfaya Dön Butonu */}
      <Link 
        to="/" 
        className="absolute top-6 left-6 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors z-10"
      >
        <Home className="w-5 h-5" />
        <span className="text-sm font-medium">Ana Sayfa</span>
      </Link>

      {/* SOL TARAF - Bilgi ve Özellikler */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-600 to-primary-800 p-12 flex-col justify-center text-white relative overflow-hidden">
        {/* Dekoratif Arka Plan */}
        <div className="absolute inset-0 opacity-10">
          <Sun className="absolute top-20 right-20 w-64 h-64 text-yellow-300" />
          <Sun className="absolute bottom-20 left-20 w-48 h-48 text-yellow-300" />
        </div>

        <div className="relative z-10 max-w-lg">
          <div className="mb-8">
            <Logo variant="white" size="large" />
          </div>

          <h1 className="text-4xl font-bold mb-6">
            Solar Enerji Yönetiminde<br />Yeni Nesil Çözüm
          </h1>
          
          <p className="text-xl text-blue-100 mb-12">
            Tüm santrallerinizi tek platformdan yönetin, arızaları anlık takip edin, verimliliğinizi artırın.
          </p>

          {/* Özellikler */}
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">30 Gün Ücretsiz Deneme</h3>
                <p className="text-blue-100">Tüm özellikler dahil, kredi kartı gerektirmez</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Güvenli ve Hızlı</h3>
                <p className="text-blue-100">Bankacılık seviyesinde güvenlik, bulut tabanlı altyapı</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <Zap className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Anında Başlayın</h3>
                <p className="text-blue-100">5 dakikada kurulum, hiç teknik bilgi gerektirmez</p>
              </div>
            </div>
          </div>

          {/* İstatistikler */}
          <div className="mt-12 pt-12 border-t border-white/20">
            <div className="grid grid-cols-3 gap-8">
              <div>
                <div className="text-3xl font-bold">500+</div>
                <div className="text-blue-100 text-sm">Aktif Santral</div>
              </div>
              <div>
                <div className="text-3xl font-bold">50+</div>
                <div className="text-blue-100 text-sm">Şirket</div>
              </div>
              <div>
                <div className="text-3xl font-bold">99.9%</div>
                <div className="text-blue-100 text-sm">Uptime</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SAĞ TARAF - Kayıt Formu */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          {/* Mobil Logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="flex items-center justify-center mb-2">
              <Logo />
            </div>
            <p className="text-gray-600 mt-1">Hesap oluşturun ve başlayın</p>
          </div>

          {/* Kayıt Formu */}
          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle className="text-2xl">Kayıt Ol</CardTitle>
              <CardDescription>
                Ücretsiz deneme için hesap oluşturun
              </CardDescription>
            </CardHeader>

            <form onSubmit={handleSubmit(onSubmit)}>
              <CardContent className="space-y-4">
                {/* Honeypot - Gizli alan (botlar dolduracak) */}
                <input
                  {...register('website')}
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  style={{
                    position: 'absolute',
                    left: '-9999px',
                    width: '1px',
                    height: '1px',
                  }}
                  aria-hidden="true"
                />

                {/* Şirket Adı */}
                <div>
                  <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-1">
                    Şirket Adı <span className="text-red-500">*</span>
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
                        block w-full pl-10 pr-3 py-2.5 border rounded-lg
                        focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500
                        ${errors.companyName ? 'border-red-500' : 'border-gray-300'}
                      `}
                      placeholder="Örn: ABC Enerji A.Ş."
                    />
                  </div>
                  {errors.companyName && (
                    <p className="mt-1 text-sm text-red-600">{errors.companyName.message}</p>
                  )}
                </div>

                {/* Ad Soyad ve Telefon - Yan Yana */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Ad Soyad */}
                  <div>
                    <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                      Ad Soyad <span className="text-red-500">*</span>
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
                          block w-full pl-10 pr-3 py-2.5 border rounded-lg
                          focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500
                          ${errors.fullName ? 'border-red-500' : 'border-gray-300'}
                        `}
                        placeholder="Ahmet Yılmaz"
                      />
                    </div>
                    {errors.fullName && (
                      <p className="mt-1 text-sm text-red-600">{errors.fullName.message}</p>
                    )}
                  </div>

                  {/* Telefon */}
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                      Telefon <span className="text-red-500">*</span>
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
                        className={`
                          block w-full pl-10 pr-3 py-2.5 border rounded-lg
                          focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500
                          ${errors.phone ? 'border-red-500' : 'border-gray-300'}
                        `}
                        placeholder="0555 123 45 67"
                      />
                    </div>
                    {errors.phone && (
                      <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
                    )}
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    İş Email Adresi <span className="text-red-500">*</span>
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
                        block w-full pl-10 pr-3 py-2.5 border rounded-lg
                        focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500
                        ${errors.email ? 'border-red-500' : 'border-gray-300'}
                      `}
                      placeholder="ahmet@sirket.com"
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    📧 Email doğrulama linki gönderilecektir
                  </p>
                </div>

                {/* Şifre ve Şifre Tekrarı - Yan Yana */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Şifre */}
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                      Şifre <span className="text-red-500">*</span>
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
                          block w-full pl-10 pr-10 py-2.5 border rounded-lg
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
                      Şifre Tekrarı <span className="text-red-500">*</span>
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
                          block w-full pl-10 pr-10 py-2.5 border rounded-lg
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
                </div>

                {/* Güvenlik Bilgisi */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-800">
                      <p className="font-medium mb-1">🔒 Güvenlik Önlemleri</p>
                      <ul className="space-y-1 text-xs">
                        <li>✓ Email doğrulama gereklidir</li>
                        <li>✓ Verileriniz 256-bit şifreleme ile korunur</li>
                        <li>✓ ISO 27001 sertifikalı altyapı</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="flex flex-col space-y-4">
                <Button
                  type="submit"
                  fullWidth
                  loading={isLoading}
                  size="lg"
                >
                  Ücretsiz Hesap Oluştur
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

                <p className="text-xs text-center text-gray-500">
                  Kayıt olarak{' '}
                  <Link to="/terms" className="text-primary-600 hover:underline">
                    Kullanım Şartları
                  </Link>{' '}
                  ve{' '}
                  <Link to="/privacy" className="text-primary-600 hover:underline">
                    Gizlilik Politikası
                  </Link>
                  'nı kabul etmiş olursunuz.
                </p>
              </CardFooter>
            </form>
          </Card>

          {/* Deneme Süresi Bilgisi - Mobil */}
          <div className="lg:hidden mt-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
            <p className="text-sm text-green-800 font-medium mb-2">🎉 30 Gün Ücretsiz Deneme</p>
            <div className="space-y-1 text-xs text-green-700">
              <p>✅ Tüm özellikler dahil</p>
              <p>✅ Kredi kartı gerektirmez</p>
              <p>✅ İstediğiniz zaman iptal edebilirsiniz</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
