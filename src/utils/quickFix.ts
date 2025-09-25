/**
 * 🔐 SECURE SYSTEM MAINTENANCE UTILITIES
 * ⚠️  RESTRICTED ACCESS - FOR AUTHORIZED PERSONNEL ONLY
 * 
 * This module contains secure system maintenance utilities.
 * All operations are logged and require proper authorization.
 */

import { doc, updateDoc, getDoc, getDocs, collection, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { getAuth } from 'firebase/auth';
import { logUserAction, logSecurityEvent } from '../services/auditLogService';

/**
 * 🔒 SECURE: System maintenance function with proper authorization
 * Only authorized superadmins can perform system-wide role corrections
 */
export const secureRoleMaintenanceByAuthorizedAdmin = async (authorizationCode: string) => {
  try {
    // Security check: Require special authorization code
    const expectedCode = `SECURE_${new Date().getFullYear()}_${new Date().getMonth() + 1}_ADMIN`;
    if (authorizationCode !== expectedCode) {
      console.error('🚫 SECURITY VIOLATION: Invalid authorization code');
      throw new Error('Geçersiz yetkilendirme kodu');
    }

    const auth = getAuth();
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      throw new Error('Oturum açılmamış');
    }

    // Verify current user is superadmin
    const currentUserDoc = await getDoc(doc(db, 'kullanicilar', currentUser.uid));
    if (!currentUserDoc.exists() || currentUserDoc.data().rol !== 'superadmin') {
      await logSecurityEvent(
        {
          id: currentUser.uid,
          email: currentUser.email || 'unknown',
          name: 'Unknown',
          role: 'unknown',
          companyId: null
        },
        'security.permission_denied',
        { attemptedAction: 'system_maintenance', function: 'secureRoleMaintenanceByAuthorizedAdmin' },
        'critical'
      );
      throw new Error('🚫 Yetkilendirilmemiş erişim denemesi');
    }

    // Find users with problematic roles
    const usersRef = collection(db, 'kullanicilar');
    const problematicUsers = await getDocs(query(usersRef, where('rol', 'in', ['superadmin', '', null, undefined])));
    
    let fixedCount = 0;
    const currentUserData = currentUserDoc.data();
    
    for (const userDoc of problematicUsers.docs) {
      const userData = userDoc.data();
      
      // Skip the current superadmin user (don't change their role)
      if (userDoc.id === currentUser.uid) {
        continue;
      }
      
      // Fix problematic roles
      let newRole = 'yonetici'; // Default to manager
      if (!userData.rol || userData.rol === '' || userData.rol === 'superadmin') {
        await updateDoc(doc(db, 'kullanicilar', userDoc.id), {
          rol: newRole,
          roleFixedBy: currentUser.uid,
          roleFixedAt: new Date(),
          previousRole: userData.rol || 'undefined'
        });
        
        // Log the role fix
        await logUserAction(
          {
            id: currentUser.uid,
            email: currentUser.email || 'unknown',
            name: currentUserData.ad || 'SuperAdmin',
            role: 'superadmin',
            companyId: currentUserData.companyId
          },
          'user.role_change',
          'user',
          userDoc.id,
          { 
            newRole, 
            previousRole: userData.rol || 'undefined',
            reason: 'System maintenance - role normalization',
            targetUserEmail: userData.email
          },
          true
        );
        
        fixedCount++;
        console.log(`✅ Rol düzeltildi: ${userData.email} -> ${newRole}`);
      }
    }
    
    if (fixedCount > 0) {
      console.log(`✅ Sistem bakımı tamamlandı: ${fixedCount} kullanıcı düzeltildi`);
      return { success: true, message: `${fixedCount} kullanıcı güvenli hale getirildi`, fixedCount };
    } else {
      console.log('ℹ️ Hiç sorunlu rol bulunamadı');
      return { success: true, message: 'Tüm roller zaten düzgün durumda', fixedCount: 0 };
    }
    
  } catch (error) {
    console.error('❌ Sistem bakımı hatası:', error);
    return { success: false, message: 'Sistem bakımı başarısız', error: error };
  }
};

/**
 * ⚠️ DEPRECATED: Legacy functions (disabled for security)
 */
export const fixAllSuperAdmins = async () => {
  console.error('🚫 SECURITY: Bu fonksiyon güvenlik nedeniyle devre dışı bırakıldı');
  console.error('🔒 Yeni güvenli fonksiyon kullanın: secureRoleMaintenanceByAuthorizedAdmin(code)');
  throw new Error('Güvenlik nedeniyle devre dışı bırakılan fonksiyon');
};

export const fixMe = async () => {
  console.error('🚫 SECURITY: Bu fonksiyon güvenlik nedeniyle devre dışı bırakıldı');
  console.error('🔒 Rol düzeltmesi için yöneticinize başvurun');
  throw new Error('Güvenlik nedeniyle devre dışı bırakılan fonksiyon');
};

// Remove dangerous global functions and add security warnings
if (typeof window !== 'undefined') {
  // Clear dangerous global functions
  delete (window as any).fixAllSuperAdmins;
  delete (window as any).fixMe;
  
  // Add security warning
  (window as any).SECURITY_WARNING = '🚫 Tehlikeli rol yönetim fonksiyonları güvenlik nedeniyle kaldırıldı';
  
  console.warn('🔒 Güvenlik: Sistem güvenli hale getirildi');
  console.info('🔍 Rol düzeltmesi gerekiyorsa SuperAdmin paneli kullanın');
}

export default { 
  secureRoleMaintenanceByAuthorizedAdmin,
  // Legacy functions (disabled)
  fixAllSuperAdmins, 
  fixMe 
};

