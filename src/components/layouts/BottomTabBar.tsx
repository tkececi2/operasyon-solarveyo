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
  const [arizaCount, setArizaCount] = useState(0);
  const [bakimCount, setBakimCount] = useState(0);
  
  // Sadece mobilde göster
  if (!platform.isNative()) return null;

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
      badge: arizaCount > 0 ? arizaCount : undefined
    },
    {
      path: '/bakim',
      icon: Wrench,
      label: 'Bakım',
      roles: ['yonetici', 'muhendis', 'tekniker', 'bekci', 'musteri'],
      badge: bakimCount > 0 ? bakimCount : undefined
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
    
    navigate(path);
  };

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  return (
    <div 
      className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700"
      style={{
        zIndex: 9999,
        paddingBottom: 'env(safe-area-inset-bottom)'
      }}
    >
      <div className="flex items-center justify-around h-12">
        {visibleTabs.map((tab) => {
          const Icon = tab.icon;
          const active = isActive(tab.path);
          
          return (
            <button
              key={tab.path}
              onClick={() => handleTabPress(tab.path)}
              className="relative flex-1 flex flex-col items-center justify-center py-1"
            >
              <div className="relative">
                <Icon 
                  className={`w-6 h-6 ${
                    active 
                      ? 'text-blue-600 dark:text-blue-400' 
                      : 'text-gray-500 dark:text-gray-400'
                  }`}
                  strokeWidth={active ? 2.5 : 2}
                />
                
                {tab.badge && tab.badge > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-0.5">
                    {tab.badge > 99 ? '99+' : tab.badge}
                  </span>
                )}
              </div>
              
              <span className={`text-[10px] mt-0.5 ${
                active 
                  ? 'text-blue-600 dark:text-blue-400 font-semibold' 
                  : 'text-gray-600 dark:text-gray-400'
              }`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

