import React from 'react';
import { Sun, Moon, Monitor, Check } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui';
import toast from 'react-hot-toast';

const ThemeSettings: React.FC = () => {
  const { theme, setTheme, loading } = useTheme();

  const themes = [
    {
      value: 'light' as const,
      label: 'Açık Tema',
      description: 'Sistem genelinde zorunlu tema',
      icon: Sun,
      preview: 'bg-white border-gray-200'
    }
  ];

  const handleThemeChange = async (_newTheme: 'light' | 'dark' | 'system') => {
    try {
      await setTheme('light');
      toast.success('Tema: Açık (kilitli)');
    } catch (error) {
      toast.error('Tema değiştirilemedi');
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent>
          <div className="animate-pulse">
            <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tema Tercihi</CardTitle>
        <CardDescription>
          Uygulamanın görünümünü kişiselleştirin. Bu ayar sadece sizin hesabınız için geçerlidir.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
          {themes.map(({ value, label, description, icon: Icon, preview }) => (
            <button
              key={value}
              onClick={() => handleThemeChange(value)}
              className={`
                relative p-4 rounded-lg border-2 transition-all
                ${theme === value 
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }
              `}
            >
              {/* Seçili işareti */}
              {theme === value && (
                <div className="absolute top-2 right-2 h-6 w-6 bg-blue-500 rounded-full flex items-center justify-center">
                  <Check className="h-4 w-4 text-white" />
                </div>
              )}

              {/* İkon */}
              <div className="flex justify-center mb-3">
                <Icon className={`h-8 w-8 ${
                  theme === value 
                    ? 'text-blue-500' 
                    : 'text-gray-400 dark:text-gray-500'
                }`} />
              </div>

              {/* Başlık */}
              <h3 className={`font-medium mb-1 ${
                theme === value 
                  ? 'text-blue-900 dark:text-blue-100' 
                  : 'text-gray-900 dark:text-gray-100'
              }`}>
                {label}
              </h3>

              {/* Açıklama */}
              <p className={`text-sm ${
                theme === value 
                  ? 'text-blue-700 dark:text-blue-300' 
                  : 'text-gray-500 dark:text-gray-400'
              }`}>
                {description}
              </p>

              {/* Önizleme */}
              <div className="mt-3 h-2 rounded-full overflow-hidden">
                <div className={`h-full ${preview}`}></div>
              </div>
            </button>
          ))}
        </div>

        {/* Bilgi Notu */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Kişisel Tercih</p>
              <p>
                Koyu tema geçici olarak devre dışı. Sistem açık tema ile çalışır.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ThemeSettings;
