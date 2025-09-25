import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  X,
  Home,
  AlertTriangle,
  Wrench,
  Sun,
  Users,
  Package,
  Clock,
  Building,
  TrendingUp,
  Calendar,
  Shield,
  CreditCard,
  BarChart3,
  Zap,
  Cog,
  ClipboardList
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

const MobileMenu: React.FC<MobileMenuProps> = ({ isOpen, onClose }) => {
  const location = useLocation();
  const { userProfile } = useAuth();

  if (!isOpen) return null;

  // Menü öğeleri tanımı
  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: Home, roles: ['yonetici','muhendis','tekniker','musteri','bekci'] },
    { path: '/arizalar', label: 'Arızalar', icon: AlertTriangle, roles: ['yonetici','muhendis','tekniker','musteri','bekci'] },
    { path: '/bakim', label: 'Bakım', icon: Wrench, roles: ['yonetici','muhendis','tekniker','bekci','musteri'] },
    { path: '/ges', label: 'GES Yönetimi', icon: Sun, roles: ['yonetici','muhendis','musteri'] },
    { path: '/uretim', label: 'Üretim Verileri', icon: TrendingUp, roles: ['yonetici','muhendis','tekniker','musteri'] },
    { path: '/sahalar', label: 'Sahalar', icon: Building, roles: ['yonetici','muhendis','musteri'] },
    { path: '/ekip', label: 'Ekip Yönetimi', icon: Users, roles: ['yonetici'] },
    { path: '/izin', label: 'İzin Yönetimi', icon: Calendar, roles: ['yonetici','muhendis','tekniker','bekci'] },
    { path: '/stok', label: 'Stok Kontrol', icon: Package, roles: ['yonetici','muhendis','tekniker','musteri'] },
    { path: '/envanter', label: 'Envanter', icon: Package, roles: ['superadmin','yonetici','muhendis','tekniker','musteri','bekci'] },
    { path: '/vardiya', label: 'Vardiya', icon: Clock, roles: ['yonetici','muhendis','tekniker','bekci','musteri'] },
    { path: '/superadmin', label: 'SuperAdmin', icon: Shield, roles: ['superadmin'] },
    { path: '/analytics', label: 'Analytics', icon: BarChart3, roles: ['superadmin'] },
  ];

  // Rol bazlı menü filtreleme
  const filteredMenuItems = menuItems.filter(item => {
    if (!item.roles) return true;
    return item.roles.includes(userProfile?.rol || '');
  });

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
        onClick={onClose}
      />
      
      {/* Menu Panel */}
      <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-xl z-50 lg:hidden transform transition-transform duration-300">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-800">Menü</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        <nav className="p-4 overflow-y-auto max-h-[calc(100vh-80px)]">
          {filteredMenuItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-lg mb-2
                  transition-all duration-200
                  ${isActive 
                    ? 'bg-blue-50 text-blue-600 font-medium' 
                    : 'text-gray-700 hover:bg-gray-50'
                  }
                `}
              >
                <Icon className={`h-5 w-5 ${isActive ? 'text-blue-600' : 'text-gray-500'}`} />
                <span>{item.label}</span>
                {item.badge && (
                  <span className="ml-auto bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Info */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t bg-gray-50">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
              {userProfile?.displayName?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {userProfile?.displayName}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {userProfile?.rol}
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default MobileMenu;
