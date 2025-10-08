import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { platform } from '../utils/platform';
import { IOSAuthService } from '../services/iosAuthService';
import { 
  ChevronRight,
  Users,
  Package,
  MapPin,
  Shield,
  Bell,
  Settings,
  HelpCircle,
  LogOut,
  User,
  Building,
  Database,
  TrendingUp,
  FileText,
  Clock,
  Zap,
  Archive
} from 'lucide-react';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { platform } from '../utils/platform';

interface MenuItem {
  path: string;
  icon: React.ElementType;
  label: string;
  description?: string;
  roles?: string[];
  badge?: number | string;
  color?: string;
}

export const MoreMenu: React.FC = () => {
  const navigate = useNavigate();
  const { userProfile, logout } = useAuth();

  const handleItemPress = async (path: string) => {
    // Haptic feedback
    if (platform.isNative()) {
      try {
        await Haptics.impact({ style: ImpactStyle.Light });
      } catch (error) {
        console.log('Haptic feedback not available');
      }
    }
    
    if (path === 'logout') {
      // iOS için bilgileri temizle
      if (platform.isNative()) {
        await IOSAuthService.clearCredentials();
        console.log('📱 iOS: Logout - bilgiler temizlendi');
      }
      
      await logout();
      navigate('/login');
    } else {
      navigate(path);
    }
  };

  const menuSections = [
    {
      title: 'Yönetim',
      items: [
        {
          path: '/ekip',
          icon: Users,
          label: 'Ekip Yönetimi',
          description: 'Çalışanları yönet',
          roles: ['yonetici'],
          color: 'blue'
        },
        {
          path: '/stok',
          icon: Package,
          label: 'Stok Kontrol',
          description: 'Stok takibi',
          roles: ['yonetici', 'muhendis', 'tekniker'],
          color: 'green'
        },
        {
          path: '/envanter',
          icon: Archive,
          label: 'Envanter',
          description: 'Ekipman listesi',
          roles: ['yonetici', 'muhendis', 'tekniker'],
          color: 'purple'
        },
        {
          path: '/sahalar',
          icon: MapPin,
          label: 'Sahalar',
          description: 'Saha yönetimi',
          roles: ['yonetici', 'muhendis'],
          color: 'orange'
        },
        {
          path: '/vardiya',
          icon: Clock,
          label: 'Vardiya Bildirimleri',
          description: 'Vardiya takibi',
          roles: ['yonetici', 'muhendis', 'tekniker', 'bekci'],
          color: 'indigo'
        }
      ]
    },
    {
      title: 'Üretim & Analiz',
      items: [
        {
          path: '/uretim',
          icon: TrendingUp,
          label: 'Üretim Verileri',
          description: 'Enerji üretim takibi',
          roles: ['yonetici', 'muhendis', 'tekniker'],
          color: 'emerald'
        },
        {
          path: '/arizalar/elektrik-kesintileri',
          icon: Zap,
          label: 'Elektrik Kesintileri',
          description: 'Kesinti kayıtları',
          roles: ['yonetici', 'muhendis', 'tekniker'],
          color: 'yellow'
        },
        {
          path: '/analytics',
          icon: Database,
          label: 'Analitik',
          description: 'Detaylı raporlar',
          roles: ['superadmin'],
          color: 'cyan'
        }
      ]
    },
    {
      title: 'Ayarlar',
      items: [
        {
          path: '/profile',
          icon: User,
          label: 'Profil',
          description: 'Hesap bilgileri',
          color: 'gray'
        },
        {
          path: '/settings',
          icon: Settings,
          label: 'Şirket Ayarları',
          description: 'Sistem yapılandırması',
          roles: ['yonetici'],
          color: 'slate'
        },
        {
          path: '/subscription',
          icon: Building,
          label: 'Abonelik',
          description: 'Plan yönetimi',
          roles: ['yonetici'],
          color: 'violet'
        },
        {
          path: '/bildirimler',
          icon: Bell,
          label: 'Bildirimler',
          description: 'Bildirim merkezi',
          badge: 3,
          color: 'red'
        }
      ]
    },
    {
      title: 'Destek',
      items: [
        {
          path: '/help',
          icon: HelpCircle,
          label: 'Yardım',
          description: 'Destek ve dokümantasyon',
          color: 'teal'
        },
        {
          path: 'logout',
          icon: LogOut,
          label: 'Çıkış Yap',
          description: 'Güvenli çıkış',
          color: 'red'
        }
      ]
    }
  ];

  // Kullanıcı rolüne göre menü öğelerini filtrele
  const filteredSections = menuSections.map(section => ({
    ...section,
    items: section.items.filter(item => {
      if (!item.roles) return true;
      return item.roles.includes(userProfile?.rol || '');
    })
  })).filter(section => section.items.length > 0);

  const getColorClasses = (color: string = 'blue') => {
    const colors: Record<string, string> = {
      blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
      green: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
      purple: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
      orange: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
      indigo: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400',
      emerald: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
      yellow: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400',
      cyan: 'bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400',
      gray: 'bg-gray-100 text-gray-600 dark:bg-gray-900/30 dark:text-gray-400',
      slate: 'bg-slate-100 text-slate-600 dark:bg-slate-900/30 dark:text-slate-400',
      violet: 'bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400',
      red: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
      teal: 'bg-teal-100 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400'
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-10">
        <div className="px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Menü</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Tüm özellikler ve ayarlar
          </p>
        </div>
      </div>

      {/* Menu Sections */}
      <div className="px-4 py-4 space-y-6">
        {filteredSections.map((section, index) => (
          <div key={index}>
            <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 px-2">
              {section.title}
            </h2>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
              {section.items.map((item, itemIndex) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.path}
                    onClick={() => handleItemPress(item.path)}
                    className={`w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                      itemIndex !== section.items.length - 1 ? 'border-b border-gray-100 dark:border-gray-700' : ''
                    }`}
                  >
                    <div className="flex items-center space-x-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${getColorClasses(item.color)}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="text-left">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {item.label}
                          </p>
                          {item.badge && (
                            <span className="px-2 py-0.5 text-xs font-medium bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 rounded-full">
                              {item.badge}
                            </span>
                          )}
                        </div>
                        {item.description && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            {item.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {/* User Info */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 mt-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
              {userProfile?.ad?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {userProfile?.ad} {userProfile?.soyad}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {userProfile?.email}
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-400 capitalize mt-0.5">
                {userProfile?.rol}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MoreMenu;
