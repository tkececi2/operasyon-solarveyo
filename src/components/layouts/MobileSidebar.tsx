import React, { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  X,
  Home,
  AlertTriangle,
  Wrench,
  Sun as SunIcon,
  Users,
  Package,
  Clock,
  Building,
  TrendingUp,
  Shield,
  CreditCard,
  BarChart3,
  Zap,
  Cog,
  ClipboardList,
  Calendar
} from 'lucide-react';
import Logo from '../ui/Logo';
import { useAuth } from '../../contexts/AuthContext';
import { useCompany } from '../../contexts/CompanyContext';
import { canAccessPage } from '../../services/permissionService';
import { arizaService } from '../../services/arizaService';

interface MobileSidebarProps {
  open: boolean;
  onClose: () => void;
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

export const MobileSidebar: React.FC<MobileSidebarProps> = ({ open, onClose }) => {
  const { userProfile } = useAuth();
  const { company } = useCompany();
  const [faultBadge, setFaultBadge] = useState<number | undefined>(undefined);
  const location = useLocation();
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

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
      } catch {
        setFaultBadge(undefined);
      }
    };
    load();
  }, [company?.id, userProfile?.id, userProfile?.rol]);

  const navigation: NavItem[] = [
    { name: 'Dashboard', href: '/dashboard', icon: Home, roles: ['yonetici','muhendis','tekniker','musteri','bekci'] },
    {
      name: 'Arızalar',
      icon: AlertTriangle,
      roles: ['yonetici','muhendis','tekniker','musteri','bekci'],
      badge: faultBadge,
      subItems: [
        { name: 'Arıza Kayıtları', href: '/arizalar', icon: AlertTriangle },
        { name: 'Elektrik Kesintileri', href: '/arizalar/elektrik-kesintileri', icon: Zap }
      ]
    },
    {
      name: 'Bakım',
      icon: Wrench,
      roles: ['yonetici','muhendis','tekniker','bekci','musteri'],
      subItems: [
        { name: 'Elektrik Bakım', href: '/bakim/elektrik', icon: Zap },
        { name: 'Mekanik Bakım', href: '/bakim/mekanik', icon: Cog },
        { name: 'Yapılan İşler', href: '/bakim/yapilanisler', icon: ClipboardList }
      ]
    },
    { name: 'GES Yönetimi', href: '/ges', icon: SunIcon, roles: ['yonetici','muhendis','musteri'] },
    { name: 'Üretim Verileri', href: '/uretim', icon: TrendingUp, roles: ['yonetici','muhendis','tekniker','musteri'] },
    { name: 'Sahalar', href: '/sahalar', icon: Building, roles: ['yonetici','muhendis','musteri'] },
    { name: 'Ekip Yönetimi', href: '/ekip', icon: Users, roles: ['yonetici'] },
    { name: 'İzin Yönetimi', href: '/izin', icon: Calendar, roles: ['yonetici','muhendis','tekniker','bekci'] },
    { name: 'Stok Kontrol', href: '/stok', icon: Package, roles: ['yonetici','muhendis','tekniker','musteri'] },
    { name: 'Envanter', href: '/envanter', icon: Package, roles: ['superadmin','yonetici','muhendis','tekniker','musteri','bekci'] },
    { name: 'Vardiya', href: '/vardiya', icon: Clock, roles: ['yonetici','muhendis','tekniker','bekci','musteri'] },
    { name: 'SuperAdmin', href: '/superadmin', icon: Shield, roles: ['superadmin'] },
    { name: 'Planlar', href: '/admin', icon: CreditCard, roles: ['superadmin'] },
    { name: 'Analytics', href: '/analytics', icon: BarChart3, roles: ['superadmin'] },
  ];

  const yonetimNavigation: NavItem[] = [
    { name: 'Abonelik', href: '/subscription', icon: CreditCard, roles: ['yonetici'] },
    { name: 'Ayarlar', href: '/settings', icon: Cog, roles: ['yonetici'] },
  ];

  const filterByRole = (items: NavItem[]) => {
    if (!userProfile) return [];
    return items.filter(item => {
      const hasRole = item.roles.includes(userProfile.rol);
      const hasPageAccess = item.href ? canAccessPage(userProfile.rol, item.href) : true;
      return hasRole && hasPageAccess;
    });
  };

  const filteredNavigation = filterByRole(navigation);
  const filteredYonetim = filterByRole(yonetimNavigation);

  // Aktif route'a göre ilgili grup açık başlasın
  useEffect(() => {
    const currentPath = location.pathname;
    const newExpanded = new Set<string>();
    filteredNavigation.forEach((item) => {
      if (item.subItems?.some((s) => currentPath.startsWith(s.href))) {
        newExpanded.add(item.name);
      }
    });
    setExpanded(newExpanded);
  }, [location.pathname]);

  const toggleExpanded = (name: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name); else next.add(name);
      return next;
    });
  };

  if (!open) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-gray-600 bg-opacity-75 z-40 lg:hidden"
        onClick={onClose}
      />

      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 flex flex-col w-64 bg-white border-r border-gray-200 z-50 lg:hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            {company?.logo ? (
              <>
                <img
                  src={company.logo}
                  alt={company.name}
                  className="w-8 h-8 rounded-lg object-cover"
                />
                <div>
                  <p className="text-sm font-medium text-gray-900">{company?.name}</p>
                  <p className="text-xs text-gray-500">{company?.subscriptionStatus === 'trial' ? 'Deneme Sürümü' : 'Aktif'}</p>
                </div>
              </>
            ) : (
              <>
                <Logo />
                <div>
                  <p className="text-sm font-medium text-gray-900">SolarVeyo</p>
                  <p className="text-xs text-gray-500">Operasyon</p>
                </div>
              </>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation - Mobile optimized */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {filteredNavigation.map((item) => {
            const Icon = item.icon;
            const hasSub = item.subItems && item.subItems.length > 0;
            const isExpanded = hasSub ? expanded.has(item.name) : false;
            return (
              <div key={item.name} className="mb-1">
                {item.href ? (
                  <NavLink
                    to={item.href}
                    onClick={onClose}
                    className={({ isActive }) => `flex items-center justify-between px-3 py-2 rounded-md text-sm ${isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'}`}
                  >
                    <span className="flex items-center gap-3">
                      <Icon className="h-5 w-5" />
                      {item.name}
                    </span>
                    {item.badge && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">{item.badge}</span>
                    )}
                  </NavLink>
                ) : (
                  <button
                    type="button"
                    onClick={() => toggleExpanded(item.name)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <span className="flex items-center gap-3">
                      <Icon className="h-5 w-5" />
                      {item.name}
                    </span>
                    <svg className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707A1 1 0 118.707 5.293l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"/></svg>
                  </button>
                )}

                {hasSub && isExpanded && (
                  <div className="ml-8 mt-1 space-y-1">
                    {item.subItems!.map((sub) => {
                      const SubIcon = sub.icon;
                      return (
                        <NavLink
                          key={sub.href}
                          to={sub.href}
                          onClick={onClose}
                          className={({ isActive }) => `flex items-center px-3 py-2 text-sm rounded-md ${isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}
                        >
                          {SubIcon && <SubIcon className="h-4 w-4 mr-2" />}
                          <span>{sub.name}</span>
                        </NavLink>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          {filteredYonetim.length > 0 && (
            <div className="mt-4">
              <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Yönetim</div>
              {filteredYonetim.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.name}
                    to={item.href!}
                    onClick={onClose}
                    className={({ isActive }) => `flex items-center px-3 py-2 text-sm rounded-md ${isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'}`}
                  >
                    <Icon className="h-5 w-5 mr-3" />
                    <span>{item.name}</span>
                  </NavLink>
                );
              })}
            </div>
          )}
        </nav>

        {/* User info */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-white">
                {userProfile?.ad?.charAt(0) || 'U'}
              </span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">
                {userProfile?.ad}
              </p>
              <p className="text-xs text-gray-500">
                {userProfile?.rol}
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
