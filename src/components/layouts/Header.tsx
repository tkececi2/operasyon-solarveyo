import React, { useState, useRef, useEffect } from 'react';
import { 
  Menu, 
  Bell, 
  Search, 
  Sun, 
  User, 
  Settings, 
  LogOut,
  ChevronLeft,
  ChevronRight,
  Shield,
  Grid3x3
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useCompany } from '../../contexts/CompanyContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { Button, Badge } from '../ui';
import { formatRelativeTime } from '../../utils/formatters';
import { useNavigate } from 'react-router-dom';
import Logo from '../ui/Logo';
import ThemeToggle from '../ui/ThemeToggle';
import { platform } from '../../utils/platform';

interface HeaderProps {
  onMenuClick: () => void;
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  onMenuClick, 
  sidebarCollapsed, 
  onToggleSidebar 
}) => {
  const { userProfile, logout } = useAuth();
  const { company } = useCompany();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const navigate = useNavigate();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileImageError, setProfileImageError] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

  // Reset profile image error when user profile changes
  useEffect(() => {
    setProfileImageError(false);
  }, [userProfile?.fotoURL]);

  // Click outside to close menus
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Bildirim tıklama işlevi
  const handleNotificationClick = async (notification: any) => {
    if (!notification.read) {
      await markAsRead(notification.id);
    }
    setNotificationsOpen(false);
    
    // Eğer actionUrl varsa yönlendir
    if (notification.actionUrl) {
      let target: string = notification.actionUrl;
      // Eski format düzeltmesi: /bakim/{id} -> /bakim
      if (target.startsWith('/bakim/') && !['/bakim', '/bakim/elektrik', '/bakim/mekanik', '/bakim/yapilanisler'].includes(target)) {
        target = '/bakim';
      }
      navigate(target);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'error': return '🔴';
      case 'warning': return '⚠️';
      case 'success': return '✅';
      default: return 'ℹ️';
    }
  };

  // iOS native app için minimal header
  const isNative = platform.isNative();

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40 ios-safe-area-top">
      <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
        {/* Left side */}
        <div className="flex items-center space-x-4">
          {/* Mobile menu button - sadece web'de göster */}
          {!isNative && (
            <button
              onClick={onMenuClick}
              className="lg:hidden p-2 rounded-md text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <Menu className="h-6 w-6" />
            </button>
          )}

          {/* Desktop sidebar toggle */}
          <button
            onClick={onToggleSidebar}
            className="hidden lg:flex p-2 rounded-md text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            {sidebarCollapsed ? (
              <ChevronRight className="h-5 w-5" />
            ) : (
              <ChevronLeft className="h-5 w-5" />
            )}
          </button>

          {/* Logo - Web mobilde göster, iOS'ta gizle */}
          {!isNative && (
            <div className="flex items-center space-x-3 lg:hidden">
              <Logo showSubtitle={false} />
            </div>
          )}
          
          {/* iOS için başlık */}
          {isNative && (
            <div>
              <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {company?.name || 'SolarVeyo'}
              </h1>
            </div>
          )}
        </div>

        {/* Center - Search (sadece desktop) */}
        <div className="hidden md:flex flex-1 max-w-lg mx-8">
          <div className="relative w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Santral, arıza veya kullanıcı ara..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
            />
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center space-x-2">
          {/* Theme Toggle - iOS'ta gizle */}
          {!isNative && <ThemeToggle />}
          
          {/* Search button - iOS'ta gizle */}
          {!isNative && (
            <button className="md:hidden p-2 rounded-md text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-700">
              <Search className="h-5 w-5" />
            </button>
          )}

          {/* Notifications */}
          <div className="relative" ref={notificationsRef}>
            <button
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className="relative p-2 rounded-md text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notifications dropdown - Dark mode uyumlu */}
            {notificationsOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50">
                <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Bildirimler</h3>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                      <Bell className="h-8 w-8 mx-auto mb-2 text-gray-400 dark:text-gray-500" />
                      <p className="text-sm">Henüz bildirim yok</p>
                    </div>
                  ) : (
                    notifications.slice(0, 10).map((notification) => (
                      <div
                        key={notification.id}
                        onClick={() => handleNotificationClick(notification)}
                        className={`px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer border-l-4 transition-colors ${
                          !notification.read ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-transparent'
                        }`}
                      >
                        <div className="flex items-start space-x-3">
                          <span className="text-lg">{getNotificationIcon(notification.type)}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start">
                              <p className={`text-sm font-medium text-gray-900 dark:text-gray-100 ${!notification.read ? 'font-semibold' : ''}`}>
                                {notification.title}
                              </p>
                              <span className="text-xs text-gray-500 dark:text-gray-400 ml-2 flex-shrink-0">
                                {formatRelativeTime(notification.createdAt.toDate())}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                              {notification.message}
                            </p>
                            {!notification.read && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full mt-1"></div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                {notifications.length > 0 && (
                  <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700 flex justify-between">
                    {unreadCount > 0 && (
                      <button 
                        onClick={markAllAsRead}
                        className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300"
                      >
                        Tümünü okundu işaretle
                      </button>
                    )}
                    <button 
                      onClick={() => {
                        setNotificationsOpen(false);
                        navigate('/bildirimler');
                      }}
                      className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 ml-auto"
                    >
                      Tümünü görüntüle
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* User menu */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center space-x-2 p-2 rounded-md text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center overflow-hidden">
                {userProfile?.fotoURL && !profileImageError ? (
                  <img
                    src={userProfile.fotoURL}
                    alt={userProfile.ad}
                    className="w-8 h-8 rounded-full object-cover"
                    onError={() => setProfileImageError(true)}
                  />
                ) : (
                  <User className="w-4 h-4 text-white" />
                )}
              </div>
              {/* iOS'ta kullanıcı adını gizle, sadece avatar */}
              {!isNative && (
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{userProfile?.ad}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{userProfile?.rol}</p>
                </div>
              )}
            </button>

            {/* User dropdown - Dark mode uyumlu */}
            {userMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50">
                <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{userProfile?.ad}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{userProfile?.email}</p>
                </div>
                
                <button 
                  onClick={() => {
                    setUserMenuOpen(false);
                    navigate('/profile');
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center space-x-2"
                >
                  <User className="w-4 h-4" />
                  <span>Profil Ayarları</span>
                </button>
                
                <button 
                  onClick={() => {
                    setUserMenuOpen(false);
                    navigate('/settings');
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center space-x-2"
                >
                  <Settings className="w-4 h-4" />
                  <span>Ayarlar</span>
                </button>
                
                <div className="border-t border-gray-200 dark:border-gray-700 mt-2 pt-2">
                  <button
                    onClick={logout}
                    className="w-full px-4 py-2 text-left text-sm text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center space-x-2"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Çıkış Yap</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
