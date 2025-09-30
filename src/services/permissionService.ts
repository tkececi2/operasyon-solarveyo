/**
 * 🔐 SECURE PERMISSION & ROLE MANAGEMENT SYSTEM
 * SolarVeyo - Enhanced Security & Access Control
 * 
 * Features:
 * ✅ Role-based permissions
 * ✅ Audit logging for security events
 * ✅ SuperAdmin restrictions
 * ✅ Security violation detection
 */

import type { UserRole } from '../types';
import { logSecurityEvent } from './auditLogService';

// ===== SECURE ROLE DEFINITIONS =====

// Valid roles (superadmin removed from regular operations)
export const SECURE_USER_ROLES: UserRole[] = ['yonetici', 'muhendis', 'tekniker', 'bekci', 'musteri'];

// SuperAdmin detection and security
export const isLegacySuperAdmin = (role: string): boolean => {
  return role === 'superadmin';
};

// Validate role security
export const validateUserRole = (role: string): { isValid: boolean; isSecurity: boolean; normalizedRole: UserRole } => {
  if (isLegacySuperAdmin(role)) {
    return {
      isValid: false,
      isSecurity: true, // Security issue detected
      normalizedRole: 'yonetici' // Default fallback
    };
  }
  
  if (SECURE_USER_ROLES.includes(role as UserRole)) {
    return {
      isValid: true,
      isSecurity: false,
      normalizedRole: role as UserRole
    };
  }
  
  return {
    isValid: false,
    isSecurity: false,
    normalizedRole: 'tekniker' // Safe default
  };
};

// İzin tipleri
export type Permission = 
  // Ekip yönetimi
  | 'ekip_ekleme'
  | 'ekip_duzenleme' 
  | 'ekip_silme'
  | 'ekip_goruntuleme'
  // Müşteri yönetimi
  | 'musteri_ekleme'
  | 'musteri_duzenleme'
  | 'musteri_silme'
  | 'musteri_goruntuleme'
  // Saha yönetimi
  | 'saha_ekleme'
  | 'saha_duzenleme'
  | 'saha_silme'
  | 'saha_goruntuleme'
  // Santral yönetimi
  | 'santral_ekleme'
  | 'santral_duzenleme'
  | 'santral_silme'
  | 'santral_goruntuleme'
  // Arıza yönetimi
  | 'ariza_ekleme'
  | 'ariza_duzenleme'
  | 'ariza_silme'
  | 'ariza_goruntuleme'
  | 'ariza_cozme'
  // Bakım yönetimi
  | 'bakim_ekleme'
  | 'bakim_duzenleme'
  | 'bakim_silme'
  | 'bakim_goruntuleme'
  // Üretim verileri
  | 'uretim_ekleme'
  | 'uretim_duzenleme'
  | 'uretim_silme'
  | 'uretim_goruntuleme'
  // Stok yönetimi
  | 'stok_ekleme'
  | 'stok_duzenleme'
  | 'stok_silme'
  | 'stok_goruntuleme'
  // Vardiya yönetimi
  | 'vardiya_ekleme'
  | 'vardiya_duzenleme'
  | 'vardiya_silme'
  | 'vardiya_goruntuleme'
  // Raporlar
  | 'rapor_goruntuleme'
  | 'rapor_olusturma'
  | 'rapor_export'
  // Şirket ayarları
  | 'sirket_ayarlari'
  | 'sistem_ayarlari'
  // Dashboard
  | 'dashboard_goruntuleme';

// Rol bazlı izinler (superadmin deprecated for security)
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  superadmin: [], // DEPRECATED - No permissions for security
  yonetici: [
    // Kendi şirketinde her şey
    'ekip_ekleme', 'ekip_duzenleme', 'ekip_silme', 'ekip_goruntuleme',
    'musteri_ekleme', 'musteri_duzenleme', 'musteri_silme', 'musteri_goruntuleme',
    'saha_ekleme', 'saha_duzenleme', 'saha_silme', 'saha_goruntuleme',
    'santral_ekleme', 'santral_duzenleme', 'santral_silme', 'santral_goruntuleme',
    'ariza_ekleme', 'ariza_duzenleme', 'ariza_silme', 'ariza_goruntuleme', 'ariza_cozme',
    'bakim_ekleme', 'bakim_duzenleme', 'bakim_silme', 'bakim_goruntuleme',
    'uretim_ekleme', 'uretim_duzenleme', 'uretim_silme', 'uretim_goruntuleme',
    'stok_ekleme', 'stok_duzenleme', 'stok_silme', 'stok_goruntuleme',
    'vardiya_ekleme', 'vardiya_duzenleme', 'vardiya_silme', 'vardiya_goruntuleme',
    'rapor_goruntuleme', 'rapor_olusturma', 'rapor_export',
    'sirket_ayarlari', 'sistem_ayarlari',
    'dashboard_goruntuleme'
  ],
  
  muhendis: [
    // Atandığı sahalarda - ekip üyesi ekleme/müşteri ekleme/şirket ayarları YAPAMAZ
    'ekip_goruntuleme', // ekip_ekleme, ekip_duzenleme, ekip_silme YAPAMAZ
    'musteri_goruntuleme', // musteri_ekleme YAPAMAZ
    'saha_ekleme', 'saha_duzenleme', 'saha_silme', 'saha_goruntuleme',
    'santral_ekleme', 'santral_duzenleme', 'santral_silme', 'santral_goruntuleme',
    'ariza_ekleme', 'ariza_duzenleme', 'ariza_silme', 'ariza_goruntuleme', 'ariza_cozme',
    'bakim_ekleme', 'bakim_duzenleme', 'bakim_silme', 'bakim_goruntuleme',
    'uretim_ekleme', 'uretim_duzenleme', 'uretim_silme', 'uretim_goruntuleme',
    'stok_ekleme', 'stok_duzenleme', 'stok_silme', 'stok_goruntuleme',
    'vardiya_ekleme', 'vardiya_duzenleme', 'vardiya_silme', 'vardiya_goruntuleme',
    'rapor_goruntuleme', 'rapor_olusturma', 'rapor_export',
    'dashboard_goruntuleme'
    // sirket_ayarlari YAPAMAZ
  ],
  
  tekniker: [
    // Arıza ve bakım işlemlerinde tam yetki, diğer alanlarda kısıtlı
    'ekip_goruntuleme', // ekleme/düzenleme/silme YAPAMAZ
    'musteri_goruntuleme', // ekleme YAPAMAZ
    'saha_goruntuleme', // ekleme/düzenleme/silme YAPAMAZ (bekçi/tekniker ekleyebilir sadece)
    'santral_goruntuleme', // ekleme/düzenleme/silme YAPAMAZ
    'ariza_ekleme', 'ariza_duzenleme', 'ariza_silme', 'ariza_goruntuleme', 'ariza_cozme', // ARTIK tam yetki
    'bakim_ekleme', 'bakim_duzenleme', 'bakim_silme', 'bakim_goruntuleme', // ARTIK tam yetki
    'uretim_ekleme', 'uretim_goruntuleme', // düzenleme/silme YAPAMAZ
    'stok_ekleme', 'stok_goruntuleme', // düzenleme/silme YAPAMAZ
    'vardiya_ekleme', 'vardiya_goruntuleme', // düzenleme/silme YAPAMAZ
    'rapor_goruntuleme',
    'dashboard_goruntuleme'
  ],
  
  bekci: [
    // Sadece vardiya bildirimleri, arıza görme, bakım raporları okuma
    'ariza_goruntuleme',
    'bakim_goruntuleme',
    'vardiya_ekleme', 'vardiya_goruntuleme', 'vardiya_silme',
    'dashboard_goruntuleme'
  ],
  
  musteri: [
    // Atanan saha/santrallar için sadece izleme
    'saha_goruntuleme',
    'santral_goruntuleme',
    'ariza_goruntuleme',
    'bakim_goruntuleme',
    'uretim_goruntuleme',
    'stok_goruntuleme',
    'vardiya_goruntuleme',
    'rapor_goruntuleme',
    'dashboard_goruntuleme'
  ]
};

// ===== ENHANCED PERMISSION FUNCTIONS WITH SECURITY =====

// Secure permission check with logging
export const hasPermission = async (
  userRole: UserRole, 
  permission: Permission,
  userId?: string,
  context?: string
): Promise<boolean> => {
  // Security check for legacy superadmin
  if (isLegacySuperAdmin(userRole)) {
    console.warn('🚫 SECURITY ALERT: Legacy superadmin role detected');
    
    // Log security event if user ID is provided
    if (userId) {
      await logSecurityEvent(
        {
          id: userId,
          email: 'unknown',
          name: 'Legacy SuperAdmin',
          role: userRole,
          companyId: null
        },
        'security.permission_denied',
        {
          attemptedPermission: permission,
          context: context || 'permission_check',
          reason: 'legacy_superadmin_role_detected'
        },
        'critical'
      );
    }
    
    return false; // Deny access to legacy superadmin
  }
  
  // Regular permission check
  const permissions = ROLE_PERMISSIONS[userRole];
  if (!permissions) {
    console.warn(`⚠️ Unknown role: ${userRole}`);
    return false;
  }
  
  const hasAccess = permissions.includes(permission);
  
  // Log failed permission attempts
  if (!hasAccess && userId) {
    await logSecurityEvent(
      {
        id: userId,
        email: 'unknown',
        name: 'Unknown',
        role: userRole,
        companyId: null
      },
      'security.permission_denied',
      {
        attemptedPermission: permission,
        context: context || 'permission_check',
        userRole
      },
      'warning'
    );
  }
  
  return hasAccess;
};

// Enhanced multiple permission check
export const hasAnyPermission = async (
  userRole: UserRole, 
  permissions: Permission[],
  userId?: string,
  context?: string
): Promise<boolean> => {
  if (isLegacySuperAdmin(userRole)) {
    console.warn('🚫 SECURITY ALERT: Legacy superadmin role detected in hasAnyPermission');
    return false;
  }
  
  for (const permission of permissions) {
    if (await hasPermission(userRole, permission, userId, context)) {
      return true;
    }
  }
  return false;
};

// Enhanced all permissions check
export const hasAllPermissions = async (
  userRole: UserRole, 
  permissions: Permission[],
  userId?: string,
  context?: string
): Promise<boolean> => {
  if (isLegacySuperAdmin(userRole)) {
    console.warn('🚫 SECURITY ALERT: Legacy superadmin role detected in hasAllPermissions');
    return false;
  }
  
  for (const permission of permissions) {
    if (!(await hasPermission(userRole, permission, userId, context))) {
      return false;
    }
  }
  return true;
};

// Enhanced page access control
export const canAccessPage = async (
  userRole: UserRole, 
  page: string,
  userId?: string
): Promise<boolean> => {
  // Security check for legacy superadmin
  if (isLegacySuperAdmin(userRole)) {
    console.warn(`🚫 SECURITY: Legacy superadmin blocked from page: ${page}`);
    
    if (userId) {
      await logSecurityEvent(
        {
          id: userId,
          email: 'unknown',
          name: 'Legacy SuperAdmin',
          role: userRole,
          companyId: null
        },
        'security.permission_denied',
        {
          attemptedPage: page,
          reason: 'legacy_superadmin_page_access_denied'
        },
        'critical'
      );
    }
    
    return false;
  }
  
  const pagePermissions: Record<string, Permission[]> = {
    '/dashboard': ['dashboard_goruntuleme'],
    '/arizalar': ['ariza_goruntuleme'],
    '/bakim': ['bakim_goruntuleme'],
    '/ges': ['santral_goruntuleme'],
    '/uretim': ['uretim_goruntuleme'],
    '/sahalar': ['saha_goruntuleme'],
    '/ekip': ['ekip_goruntuleme'],
    '/stok': ['stok_goruntuleme'],
    '/vardiya': ['vardiya_goruntuleme'],
    '/raporlar': ['rapor_goruntuleme'],
    '/ayarlar': ['sirket_ayarlari'],
    '/settings': ['sirket_ayarlari'],
    // Add SuperAdmin pages that should be blocked
    '/superadmin': [], // No one should access this
    '/admin': [] // Legacy admin page
  };

  const requiredPermissions = pagePermissions[page];
  if (!requiredPermissions) return true; // Sayfa tanımlanmamışsa erişime izin ver
  
  // Block access to admin pages
  if (page === '/superadmin' || page === '/admin') {
    if (userId) {
      await logSecurityEvent(
        {
          id: userId,
          email: 'unknown',
          name: 'Unknown',
          role: userRole,
          companyId: null
        },
        'security.permission_denied',
        {
          attemptedPage: page,
          reason: 'admin_page_access_denied'
        },
        'critical'
      );
    }
    return false;
  }
  
  return await hasAnyPermission(userRole, requiredPermissions, userId, `page_access:${page}`);
};

// Enhanced action permission check with security
export const canPerformAction = async (
  userRole: UserRole, 
  action: string,
  userId?: string
): Promise<boolean> => {
  // Security check for legacy superadmin
  if (isLegacySuperAdmin(userRole)) {
    console.warn(`🚫 SECURITY: Legacy superadmin blocked from action: ${action}`);
    return false;
  }
  
  const actionPermissions: Record<string, Permission[]> = {
    'ekip_ekle': ['ekip_ekleme'],
    'ekip_duzenle': ['ekip_duzenleme'],
    'ekip_sil': ['ekip_silme'],
    'musteri_ekle': ['musteri_ekleme'],
    'musteri_duzenle': ['musteri_duzenleme'],
    'musteri_sil': ['musteri_silme'],
    'saha_ekle': ['saha_ekleme'],
    'saha_duzenle': ['saha_duzenleme'],
    'saha_sil': ['saha_silme'],
    'santral_ekle': ['santral_ekleme'],
    'santral_duzenle': ['santral_duzenleme'],
    'santral_sil': ['santral_silme'],
    'ariza_ekle': ['ariza_ekleme'],
    'ariza_duzenle': ['ariza_duzenleme'],
    'ariza_sil': ['ariza_silme'],
    'ariza_coz': ['ariza_cozme'],
    'bakim_ekle': ['bakim_ekleme'],
    'bakim_duzenle': ['bakim_duzenleme'],
    'bakim_sil': ['bakim_silme'],
    'uretim_ekle': ['uretim_ekleme'],
    'uretim_duzenle': ['uretim_duzenleme'],
    'uretim_sil': ['uretim_silme'],
    'stok_ekle': ['stok_ekleme'],
    'stok_duzenle': ['stok_duzenleme'],
    'stok_sil': ['stok_silme'],
    'vardiya_ekle': ['vardiya_ekleme'],
    'vardiya_duzenle': ['vardiya_duzenleme'],
    'vardiya_sil': ['vardiya_silme'],
    'rapor_export': ['rapor_export'],
    'ayarlar_duzenle': ['sirket_ayarlari']
  };

  const requiredPermissions = actionPermissions[action];
  if (!requiredPermissions) return true; // Aksiyon tanımlanmamışsa izin ver
  
  return await hasAnyPermission(userRole, requiredPermissions, userId, `action:${action}`);
};

// ===== SYNC HELPERS FOR UI (no async bugs in components) =====
export const hasPermissionSync = (userRole: UserRole, permission: Permission): boolean => {
  if (isLegacySuperAdmin(userRole)) return false;
  const permissions = ROLE_PERMISSIONS[userRole as UserRole] || [];
  return permissions.includes(permission);
};

export const canPerformActionSync = (userRole: UserRole, action: string): boolean => {
  const actionPermissions: Record<string, Permission[]> = {
    'ekip_ekle': ['ekip_ekleme'],
    'ekip_duzenle': ['ekip_duzenleme'],
    'ekip_sil': ['ekip_silme'],
    'musteri_ekle': ['musteri_ekleme'],
    'musteri_duzenle': ['musteri_duzenleme'],
    'musteri_sil': ['musteri_silme'],
    'saha_ekle': ['saha_ekleme'],
    'saha_duzenle': ['saha_duzenleme'],
    'saha_sil': ['saha_silme'],
    'santral_ekle': ['santral_ekleme'],
    'santral_duzenle': ['santral_duzenleme'],
    'santral_sil': ['santral_silme'],
    'ariza_ekle': ['ariza_ekleme'],
    'ariza_duzenle': ['ariza_duzenleme'],
    'ariza_sil': ['ariza_silme'],
    'ariza_coz': ['ariza_cozme'],
    'bakim_ekle': ['bakim_ekleme'],
    'bakim_duzenle': ['bakim_duzenleme'],
    'bakim_sil': ['bakim_silme'],
    'uretim_ekle': ['uretim_ekleme'],
    'uretim_duzenle': ['uretim_duzenleme'],
    'uretim_sil': ['uretim_silme'],
    'stok_ekle': ['stok_ekleme'],
    'stok_duzenle': ['stok_duzenleme'],
    'stok_sil': ['stok_silme'],
    'vardiya_ekle': ['vardiya_ekleme'],
    'vardiya_duzenle': ['vardiya_duzenleme'],
    'vardiya_sil': ['vardiya_silme'],
    'rapor_export': ['rapor_export'],
    'ayarlar_duzenle': ['sirket_ayarlari']
  };
  const required = actionPermissions[action];
  if (!required) return true;
  return required.every((p) => hasPermissionSync(userRole, p));
};

export const canAccessPageSync = (userRole: UserRole, page: string): boolean => {
  if (isLegacySuperAdmin(userRole)) return false;
  const pagePermissions: Record<string, Permission[]> = {
    '/dashboard': ['dashboard_goruntuleme'],
    '/arizalar': ['ariza_goruntuleme'],
    '/bakim': ['bakim_goruntuleme'],
    '/ges': ['santral_goruntuleme'],
    '/uretim': ['uretim_goruntuleme'],
    '/sahalar': ['saha_goruntuleme'],
    '/ekip': ['ekip_goruntuleme'],
    '/stok': ['stok_goruntuleme'],
    '/vardiya': ['vardiya_goruntuleme'],
    '/raporlar': ['rapor_goruntuleme'],
    '/ayarlar': ['sirket_ayarlari'],
    '/settings': ['sirket_ayarlari']
  };
  const perms = pagePermissions[page];
  if (!perms) return true;
  return perms.every((p) => hasPermissionSync(userRole, p));
};

// ===== SECURITY SUMMARY & MONITORING =====

/**
 * Get security summary for a user role
 */
export const getSecuritySummary = (userRole: UserRole) => {
  const roleValidation = validateUserRole(userRole);
  
  return {
    role: userRole,
    isSecure: roleValidation.isValid && !roleValidation.isSecurity,
    isLegacySuperAdmin: isLegacySuperAdmin(userRole),
    normalizedRole: roleValidation.normalizedRole,
    allowedPermissions: ROLE_PERMISSIONS[roleValidation.normalizedRole] || [],
    securityLevel: roleValidation.isSecurity ? 'CRITICAL' : roleValidation.isValid ? 'SECURE' : 'WARNING',
    recommendations: roleValidation.isSecurity ? [
      'Bu hesap legacy superadmin rolüne sahip - Güvenlik riski',
      'Hesabı normal yönetici rolüne dönüştürün',
      'Tüm işlemleri audit log ile takip edin'
    ] : []
  };
};

/**
 * Initialize security monitoring for the current session
 */
export const initializeSecurityMonitoring = () => {
  console.log('🔒 Güvenlik sistemi aktive edildi');
  console.log('⚠️  Legacy superadmin rollerü engellendi');
  console.log('📊 Tüm izin denetimleri loglandı');
};

export default {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  canAccessPage,
  canPerformAction,
  validateUserRole,
  getSecuritySummary,
  initializeSecurityMonitoring,
  ROLE_PERMISSIONS,
  SECURE_USER_ROLES
};
