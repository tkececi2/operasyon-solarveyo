import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  Home,
  AlertTriangle,
  Wrench,
  Sun,
  Users,
  Package,
  Clock,
  FileText,
  Settings,
  Building,
  TrendingUp,
  Shield,
  Calendar,
  ChevronDown,
  ChevronRight,
  Zap,
  Cog,
  ClipboardList,
  CreditCard,
  BarChart3,
  Database
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useCompany } from '../../contexts/CompanyContext';
import { canAccessPage } from '../../services/permissionService';
import { arizaService } from '../../services/arizaService';
import Logo from '../ui/Logo';

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
}

interface SubMenuItem {
  name: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface NavItem {
  name: string;
  href?: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: string[];
  badge?: string | number;
  subItems?: SubMenuItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed }) => {
  const { userProfile } = useAuth();
  const { company } = useCompany();
  const location = useLocation();
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [faultBadge, setFaultBadge] = useState<number | undefined>(undefined);

  const toggleExpanded = (name: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(name)) {
      newExpanded.delete(name);
    } else {
      newExpanded.add(name);
    }
    setExpandedItems(newExpanded);
  };

  // Arızalar rozeti: rol bazlı görünür arızaların (çözülmemiş) sayısı
  useEffect(() => {
    const load = async () => {
      if (!company?.id || !userProfile?.id) {
        setFaultBadge(undefined);
        return;
      }
      try {
        const list = await arizaService.getUserFaults(
          company.id,
          userProfile.id,
          userProfile.rol,
          (userProfile.sahalar as string[] | undefined),
          (userProfile.santraller as string[] | undefined)
        );
        const count = list.filter(a => a.durum !== 'cozuldu').length;
        setFaultBadge(count > 0 ? count : undefined);
      } catch (e) {
        setFaultBadge(undefined);
      }
    };
    load();
  }, [company?.id, userProfile?.id, userProfile?.rol]);

  const navigation: NavItem[] = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: Home,
      roles: ['yonetici', 'muhendis', 'tekniker', 'musteri', 'bekci'],
    },
    {
      name: 'Arızalar',
      icon: AlertTriangle,
      roles: ['yonetici', 'muhendis', 'tekniker', 'musteri', 'bekci'],
      badge: faultBadge,
      subItems: [
        {
          name: 'Arıza Kayıtları',
          href: '/arizalar',
          icon: AlertTriangle,
        },
        {
          name: 'Elektrik Kesintileri',
          href: '/arizalar/elektrik-kesintileri',
          icon: Zap,
        },
      ],
    },
    {
      name: 'Bakım',
      icon: Wrench,
      roles: ['yonetici', 'muhendis', 'tekniker', 'bekci', 'musteri'],
      subItems: [
        {
          name: 'Elektrik Bakım',
          href: '/bakim/elektrik',
          icon: Zap,
        },
        {
          name: 'Mekanik Bakım',
          href: '/bakim/mekanik',
          icon: Cog,
        },
        {
          name: 'Yapılan İşler',
          href: '/bakim/yapilanisler',
          icon: ClipboardList,
        },
      ],
    },
    {
      name: 'GES Yönetimi',
      href: '/ges',
      icon: Sun,
      roles: ['yonetici', 'muhendis', 'musteri'],
    },
    {
      name: 'Üretim Verileri',
      href: '/uretim',
      icon: TrendingUp,
      roles: ['yonetici', 'muhendis', 'tekniker', 'musteri'],
    },
    {
      name: 'Sahalar',
      href: '/sahalar',
      icon: Building,
      roles: ['yonetici', 'muhendis', 'musteri'],
    },
    {
      name: 'Ekip Yönetimi',
      href: '/ekip',
      icon: Users,
      roles: ['yonetici'],
    },
    {
      name: 'İzin Yönetimi',
      href: '/izin',
      icon: Calendar,
      roles: ['yonetici', 'muhendis', 'tekniker', 'bekci'],
    },
    {
      name: 'Stok Kontrol',
      href: '/stok',
      icon: Package,
      roles: ['yonetici', 'muhendis', 'tekniker', 'musteri'],
    },
    {
      name: 'Envanter',
      href: '/envanter',
      icon: Package,
      roles: ['superadmin', 'yonetici', 'muhendis', 'tekniker', 'musteri', 'bekci'],
    },
    {
      name: 'Vardiya',
      href: '/vardiya',
      icon: Clock,
      roles: ['yonetici', 'muhendis', 'tekniker', 'bekci', 'musteri'],
    },

    // SuperAdmin Paneli
    {
      name: 'SuperAdmin',
      icon: Shield,
      roles: ['superadmin'],
      subItems: [
        {
          name: 'Şirketler',
          href: '/superadmin',
          icon: Building,
        },
        {
          name: 'Planlar',
          href: '/superadmin/plans',
          icon: CreditCard,
        },
        {
          name: 'Talepler',
          href: '/superadmin/requests',
          icon: ClipboardList,
        },
      ],
    },
    {
      name: 'Analytics',
      href: '/analytics',
      icon: BarChart3,
      roles: ['superadmin'],
    },

  ];

  // Development modunda test sayfalarını ekle
  // Email Test kaldırıldı

  const yonetimNavigation: NavItem[] = [
    {
      name: 'Abonelik',
      href: '/subscription',
      icon: CreditCard,
      roles: ['yonetici'],
    },
    {
      name: 'Ayarlar',
      href: '/settings',
      icon: Settings,
      roles: ['yonetici'],
    },
    {
      name: 'Yedekleme',
      href: '/backup',
      icon: Database,
      roles: ['yonetici', 'superadmin'],
    },
  ];

  const filteredNavigation = navigation.filter(item => {
    if (!userProfile) return false;
    
    // Hem eski rol sistemi hem yeni izin sistemi kontrolü
    const hasRole = item.roles.includes(userProfile.rol);
    const hasPageAccess = item.href ? canAccessPage(userProfile.rol, item.href) : true;
    
    return hasRole && hasPageAccess;
  });

  const filteredYonetim = yonetimNavigation.filter(item => {
    if (!userProfile) return false;
    
    const hasRole = item.roles.includes(userProfile.rol);
    const hasPageAccess = item.href ? canAccessPage(userProfile.rol, item.href) : true;
    
    return hasRole && hasPageAccess;
  });

  const isActiveRoute = (href: string) => {
    return location.pathname === href || location.pathname.startsWith(href + '/');
  };

  const isSubItemActive = (subItems?: SubMenuItem[]) => {
    if (!subItems) return false;
    return subItems.some(item => isActiveRoute(item.href));
  };

  return (
    <div className={`${collapsed ? 'w-16' : 'w-64'} bg-white dark:bg-gray-800 shadow-lg h-screen sticky top-0 flex flex-col transition-all duration-300`}>
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center space-x-3">
          {collapsed ? (
            <Logo showText={false} />
          ) : (
            <>
              <Logo />
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">{company?.name || 'Yükleniyor...'}</p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        {filteredNavigation.map((item) => {
          const Icon = item.icon;
          const isExpanded = expandedItems.has(item.name);
          const hasSubItems = item.subItems && item.subItems.length > 0;
          const isActive = item.href ? isActiveRoute(item.href) : isSubItemActive(item.subItems);

          if (hasSubItems) {
            return (
              <div key={item.name}>
                <button
                  onClick={() => toggleExpanded(item.name)}
                  className={`
                    w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-md
                    ${isActive
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:text-gray-100 dark:hover:text-gray-100'
                    }
                  `}
                >
                  <div className="flex items-center">
                    <Icon className={`${collapsed ? 'h-6 w-6' : 'h-5 w-5 mr-3'}`} />
                    {!collapsed && <span>{item.name}</span>}
                  </div>
                  {!collapsed && (
                    <div className="flex items-center">
                      {item.badge && (
                        <span className="mr-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          {item.badge}
                        </span>
                      )}
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </div>
                  )}
                </button>

                {/* Sub Items */}
                {!collapsed && isExpanded && (
                  <div className="ml-8 mt-1 space-y-1">
                    {item.subItems?.map((subItem) => {
                      const SubIcon = subItem.icon;
                      return (
                        <NavLink
                          key={subItem.href}
                          to={subItem.href}
                          className={({ isActive }) =>
                            `flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                              isActive
                                ? 'bg-blue-50 text-blue-700'
                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:text-gray-100 dark:hover:text-gray-100'
                            }`
                          }
                        >
                          {SubIcon && <SubIcon className="h-4 w-4 mr-2" />}
                          <span>{subItem.name}</span>
                        </NavLink>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          return (
            <NavLink
              key={item.name}
              to={item.href!}
              className={({ isActive }) =>
                `flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                  isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:text-gray-100 dark:hover:text-gray-100'
                }`
              }
            >
              <Icon className={`${collapsed ? 'h-6 w-6' : 'h-5 w-5 mr-3'}`} />
              {!collapsed && (
                <>
                  <span className="flex-1">{item.name}</span>
                  {item.badge && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          );
        })}

        {/* Yönetim Section */}
        {filteredYonetim.length > 0 && (
          <>
            <div className="my-4 border-t border-gray-200 dark:border-gray-700" />
            <div className={`${collapsed ? '' : 'px-3'} text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2`}>
              {!collapsed && 'YÖNETİM'}
            </div>
            {filteredYonetim.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.name}
                  to={item.href!}
                  className={({ isActive }) =>
                    `flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                      isActive
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:text-gray-100 dark:hover:text-gray-100'
                    }`
                  }
                >
                  <Icon className={`${collapsed ? 'h-6 w-6' : 'h-5 w-5 mr-3'}`} />
                  {!collapsed && <span>{item.name}</span>}
                </NavLink>
              );
            })}
          </>
        )}
      </nav>

      {/* Footer - User Profile */}
      <div className="border-t p-4">
        <div className="flex items-center">
          {userProfile?.fotoURL ? (
            <img
              src={userProfile.fotoURL}
              alt={userProfile.ad}
              className="w-8 h-8 rounded-full object-cover border"
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
            />
          ) : (
            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-gray-700">
                {userProfile?.ad?.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          {!collapsed && (
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{userProfile?.ad}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{userProfile?.rol}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};