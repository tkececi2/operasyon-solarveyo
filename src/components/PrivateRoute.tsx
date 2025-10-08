import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCompany } from '../contexts/CompanyContext';
import { Loader2 } from 'lucide-react';

interface PrivateRouteProps {
  children: React.ReactNode;
  requiredRoles?: string[];
}

export const PrivateRoute: React.FC<PrivateRouteProps> = ({ 
  children, 
  requiredRoles = [] 
}) => {
  const { currentUser, userProfile, loading } = useAuth();
  const { company } = useCompany();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (!currentUser || !userProfile) {
    return <Navigate to="/login" replace />;
  }
  
  // Kullanıcı pasif ise login sayfasına yönlendir
  if (userProfile.aktif === false) {
    return <Navigate to="/login" replace />;
  }

  // Şirket pasif ise erişimi engelle
  if (company && company.isActive === false && userProfile.rol !== 'superadmin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Şirket Pasifleştirildi</h1>
          <p className="text-gray-600">Lütfen şirket yöneticiniz ile iletişime geçin.</p>
        </div>
      </div>
    );
  }

  // Rol kontrolü
  if (requiredRoles.length > 0) {
    const hasRequiredRole = userProfile.rol === 'superadmin' ||
                           requiredRoles.includes(userProfile.rol) || 
                           userProfile.rol === 'yonetici';
    
    if (!hasRequiredRole) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Yetkisiz Erişim</h1>
            <p className="text-gray-600">Bu sayfaya erişim yetkiniz bulunmamaktadır.</p>
          </div>
        </div>
      );
    }
  }

  // ESKİ ÖDEME DURUMU KONTROLÜ KALDIRILDI
  // Abonelik kontrolü artık CompanyContext ve useSubscription hook'u üzerinden yapılıyor
  // odemeDurumu alanı deprecated - kullanılmamalı

  return <>{children}</>;
};
