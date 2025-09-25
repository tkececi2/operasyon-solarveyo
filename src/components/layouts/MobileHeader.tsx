import React, { useState } from 'react';
import { Menu, Bell, LogOut, User, Settings } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import MobileMenu from './MobileMenu';
import toast from 'react-hot-toast';

const MobileHeader: React.FC = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const { userProfile, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Çıkış yapıldı');
      navigate('/login');
    } catch (error) {
      toast.error('Çıkış yapılırken hata oluştu');
    }
  };

  return (
    <>
      <header className="lg:hidden fixed top-0 left-0 right-0 bg-white border-b z-30">
        <div className="flex items-center justify-between px-4 h-16">
          {/* Menu Button */}
          <button
            onClick={() => setMenuOpen(true)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Menu className="h-6 w-6 text-gray-700" />
          </button>

          {/* Logo */}
          <Link to="/dashboard" className="flex items-center gap-2">
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Solarveyo
            </span>
          </Link>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors relative">
              <Bell className="h-5 w-5 text-gray-700" />
              <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
            </button>

            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <User className="h-5 w-5 text-gray-700" />
            </button>
          </div>
        </div>

        {/* Profile Dropdown */}
        {profileOpen && (
          <>
            <div 
              className="fixed inset-0 z-20" 
              onClick={() => setProfileOpen(false)}
            />
            <div className="absolute top-16 right-4 w-56 bg-white rounded-lg shadow-lg border z-30">
              <div className="p-4 border-b">
                <p className="font-medium text-gray-900">{userProfile?.displayName}</p>
                <p className="text-sm text-gray-500">{userProfile?.email}</p>
              </div>
              
              <div className="p-2">
                <Link
                  to="/settings"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <Settings className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-700">Ayarlar</span>
                </Link>
                
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 rounded-lg transition-colors text-left"
                >
                  <LogOut className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-700">Çıkış Yap</span>
                </button>
              </div>
            </div>
          </>
        )}
      </header>

      {/* Mobile Menu */}
      <MobileMenu 
        isOpen={menuOpen} 
        onClose={() => setMenuOpen(false)} 
      />

      {/* Spacer for fixed header */}
      <div className="lg:hidden h-16" />
    </>
  );
};

export default MobileHeader;
