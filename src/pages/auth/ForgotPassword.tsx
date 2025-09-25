import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Sun, Mail, ArrowLeft, Home } from 'lucide-react';
import Logo from '../../components/ui/Logo';
import { useAuth } from '../../contexts/AuthContext';
import { Button, Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui';

const forgotPasswordSchema = z.object({
  email: z.string().email('Geçerli bir email adresi giriniz'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

const ForgotPassword: React.FC = () => {
  const { resetPassword } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);
    try {
      await resetPassword(data.email);
      setEmailSent(true);
    } catch (error) {
      // Hata toast ile gösterilecek (AuthContext'te)
    } finally {
      setIsLoading(false);
    }
  };

  if (emailSent) {
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
            <div className="flex items-center justify-center">
              <Logo />
            </div>
          </div>

          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-4">
                <Mail className="w-6 h-6 text-green-600" />
              </div>
              <CardTitle>Email Gönderildi!</CardTitle>
              <CardDescription>
                <strong>{getValues('email')}</strong> adresine şifre sıfırlama bağlantısı gönderildi.
              </CardDescription>
            </CardHeader>

            <CardContent className="text-center">
              <p className="text-sm text-gray-600 mb-4">
                Email'inizi kontrol edin ve bağlantıya tıklayarak şifrenizi sıfırlayın.
              </p>
              <p className="text-xs text-gray-500">
                Email gelmedi mi? Spam klasörünüzü kontrol edin.
              </p>
            </CardContent>

            <CardFooter>
              <Link to="/login" className="w-full">
                <Button variant="ghost" fullWidth leftIcon={<ArrowLeft className="h-4 w-4" />}>
                  Giriş sayfasına dön
                </Button>
              </Link>
            </CardFooter>
          </Card>
        </div>
      </div>
    );
  }

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
          <p className="text-gray-600 mt-1">Şifrenizi sıfırlayın</p>
        </div>

        {/* Şifre Sıfırlama Formu */}
        <Card>
          <CardHeader>
            <CardTitle>Şifremi Unuttum</CardTitle>
            <CardDescription>
              Email adresinizi girin, size şifre sıfırlama bağlantısı gönderelim
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
            </CardContent>

            <CardFooter className="flex flex-col space-y-4">
              <Button
                type="submit"
                fullWidth
                loading={isLoading}
              >
                Sıfırlama Bağlantısı Gönder
              </Button>

              <Link to="/login" className="w-full">
                <Button variant="ghost" fullWidth leftIcon={<ArrowLeft className="h-4 w-4" />}>
                  Giriş sayfasına dön
                </Button>
              </Link>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default ForgotPassword;
