import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Home, 
  AlertTriangle, 
  Wrench, 
  Sun, 
  Clock
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { platform } from '../../utils/platform';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';

interface TabItem {
  path: string;
  icon: React.ElementType;
  label: string;
  roles?: string[];
  badge?: number;
}

export const BottomTabBar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { userProfile } = useAuth();
  const [activeTab, setActiveTab] = useState('/dashboard');
  const [arizaCount, setArizaCount] = useState(0);
  const [bakimCount, setBakimCount] = useState(0);
  
  // Mobilde gösterilmeyecek
  if (!platform.isNative()) return null;

  useEffect(() => {
    setActiveTab(location.pathname);
  }, [location.pathname]);

  // Arıza ve bakım sayılarını dinle
  useEffect(() => {
    if (!userProfile?.companyId) return;

    // Açık arızaları say
    const arizaQuery = query(
      collection(db, 'arizalar'),
      where('companyId', '==', userProfile.companyId),
      where('durum', 'in', ['acik', 'devam-ediyor'])
    );

    const unsubscribeAriza = onSnapshot(arizaQuery, (snapshot) => {
      setArizaCount(snapshot.size);
    });

    // Bekleyen bakımları say
    const bakimQuery = query(
      collection(db, 'elektrikBakimlar'),
      where('companyId', '==', userProfile.companyId),
      where('durum', '==', 'beklemede')
    );

    const unsubscribeBakim = onSnapshot(bakimQuery, (snapshot) => {
      setBakimCount(snapshot.size);
    });

    return () => {
      unsubscribeAriza();
      unsubscribeBakim();
    };
  }, [userProfile?.companyId]);

  const tabs: TabItem[] = [
    {
      path: '/dashboard',
      icon: Home,
      label: 'Ana Sayfa'
    },
    {
      path: '/arizalar',
      icon: AlertTriangle,
      label: 'Arızalar',
      roles: ['yonetici', 'muhendis', 'tekniker', 'musteri', 'bekci'],
      badge: arizaCount > 0 ? arizaCount : undefined // Dinamik bildirim sayısı
    },
    {
      path: '/bakim',
      icon: Wrench,
      label: 'Bakım',
      roles: ['yonetici', 'muhendis', 'tekniker', 'bekci', 'musteri'],
      badge: bakimCount > 0 ? bakimCount : undefined // Dinamik bildirim sayısı
    },
    {
      path: '/ges',
      icon: Sun,
      label: 'GES',
      roles: ['yonetici', 'muhendis', 'musteri']
    },
    {
      path: '/vardiya',
      icon: Clock,
      label: 'Vardiya',
      roles: ['yonetici', 'muhendis', 'tekniker', 'bekci', 'musteri']
    }
  ];

  // Kullanıcı rolüne göre tabları filtrele
  const visibleTabs = tabs.filter(tab => {
    if (!tab.roles) return true;
    return tab.roles.includes(userProfile?.rol || '');
  });

  const handleTabPress = async (path: string) => {
    // Haptic feedback
    if (platform.isNative()) {
      try {
        await Haptics.impact({ style: ImpactStyle.Light });
      } catch (error) {
        console.log('Haptic feedback not available');
      }
    }
    
    setActiveTab(path);
    navigate(path);
  };

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  return (
    <>      
      {/* Tab Bar Container - iOS için kesinlikle sabitlenmiş */}
      <div 
        className="fixed bottom-0 left-0 right-0"
        style={{
          position: 'fixed !important' as any,
          bottom: '0 !important' as any,
          left: '0 !important' as any,
          right: '0 !important' as any,
          zIndex: 99999,
          transform: 'translate3d(0, 0, 0)',
          WebkitTransform: 'translate3d(0, 0, 0)',
          WebkitBackfaceVisibility: 'hidden',
          backfaceVisibility: 'hidden'
        }}
      >
        <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-t border-gray-200/50 dark:border-gray-700/50">
          {/* Safe area padding for iPhone */}
          <div 
            className="flex items-center justify-around px-2"
            style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
          >
            {visibleTabs.map((tab) => {
              const Icon = tab.icon;
              const active = isActive(tab.path);
              
              return (
                <button
                  key={tab.path}
                  onClick={() => handleTabPress(tab.path)}
                  className="relative flex-1 flex flex-col items-center justify-center py-2 px-1 group"
                >
                  {/* Active Indicator */}
                  {active && (
                    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-12 h-0.5 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full" />
                  )}
                  
                  {/* Icon Container */}
                  <div className="relative">
                    {/* Icon Background (visible when active) */}
                    {active && (
                      <div className="absolute inset-0 bg-blue-100 dark:bg-blue-900/30 rounded-xl scale-150 opacity-30" />
                    )}
                    
                    {/* Icon */}
                    <div className={`relative transition-all duration-200 ${
                      active ? 'scale-110' : 'scale-100 group-active:scale-95'
                    }`}>
                      <Icon 
                        className={`w-6 h-6 transition-colors ${
                          active 
                            ? 'text-blue-600 dark:text-blue-400' 
                            : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300'
                        }`}
                        strokeWidth={active ? 2.5 : 2}
                      />
                    </div>
                    
                    {/* Badge */}
                    {tab.badge && tab.badge > 0 && (
                      <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 shadow-sm">
                        {tab.badge > 99 ? '99+' : tab.badge}
                      </span>
                    )}
                  </div>
                  
                  {/* Label */}
                  <span className={`mt-1 text-[11px] transition-all duration-200 ${
                    active 
                      ? 'text-blue-600 dark:text-blue-400 font-semibold' 
                      : 'text-gray-600 dark:text-gray-400 font-medium'
                  }`}>
                    {tab.label}
                  </span>
                  
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
};