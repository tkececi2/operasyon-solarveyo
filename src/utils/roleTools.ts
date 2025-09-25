/**
 * 🔐 SECURE ROLE MANAGEMENT SYSTEM
 * ⚠️  ONLY FOR AUTHORIZED PERSONNEL
 * 
 * This module handles secure role management operations.
 * Access is restricted and logged for security purposes.
 */

import { getAuth } from 'firebase/auth';
import { db } from '../lib/firebase';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { logUserAction } from '../services/auditLogService';

// ===== SECURE ROLE MANAGEMENT =====

/**
 * 🔒 SECURE: Update user role with proper authorization and logging
 * Only authorized superadmins can change roles
 */
async function secureRoleUpdate(targetUserId: string, newRole: 'yonetici' | 'muhendis' | 'tekniker', reason: string) {
  const auth = getAuth();
  const currentUser = auth.currentUser;
  
  if (!currentUser) {
    throw new Error('🚫 Yetkilendirme başarısız: Oturum açılmamış');
  }

  // Verify current user has permission to change roles
  const currentUserDoc = await getDoc(doc(db, 'kullanicilar', currentUser.uid));
  if (!currentUserDoc.exists()) {
    throw new Error('🚫 Kullanıcı profili bulunamadı');
  }

  const currentUserData = currentUserDoc.data();
  if (currentUserData.rol !== 'superadmin') {
    // Log unauthorized access attempt
    await logUserAction(
      {
        id: currentUser.uid,
        email: currentUser.email || 'unknown',
        name: currentUserData.ad || 'Unknown',
        role: currentUserData.rol || 'unknown',
        companyId: currentUserData.companyId
      },
      'security.permission_denied',
      'role_management',
      targetUserId,
      { attemptedAction: 'role_change', newRole, reason },
      false
    );
    
    throw new Error('🚫 YETKİSİZ ERİŞİM: Sadece SuperAdmin rol değiştirebilir');
  }

  // Update target user role
  await updateDoc(doc(db, 'kullanicilar', targetUserId), {
    rol: newRole,
    roleUpdatedBy: currentUser.uid,
    roleUpdatedAt: new Date(),
    roleUpdateReason: reason
  });

  // Log the role change
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
    targetUserId,
    { newRole, reason, previousRole: 'unknown' },
    true
  );

  console.log(`✅ Rol güncellendi: ${targetUserId} -> ${newRole} (${reason})`);
}

/**
 * 🔒 SECURE: Promote user to manager (with authorization check)
 */
export async function promoteToManager(targetUserId: string, reason: string = 'Yönetici terfi') {
  await secureRoleUpdate(targetUserId, 'yonetici', reason);
}

/**
 * 🔒 SECURE: Demote user to engineer (with authorization check)
 */
export async function demoteToEngineer(targetUserId: string, reason: string = 'Rol güncelleme') {
  await secureRoleUpdate(targetUserId, 'muhendis', reason);
}

/**
 * ⚠️ DEPRECATED: Old insecure functions (kept for backwards compatibility but disabled)
 */
export async function promoteToSuperadmin() {
  console.error('🚫 SECURITY VIOLATION: promoteToSuperadmin() function is DISABLED for security');
  throw new Error('Bu fonksiyon güvenlik nedeniyle devre dışı bırakıldı');
}

export async function demoteToYonetici() {
  console.error('🚫 SECURITY VIOLATION: demoteToYonetici() function is DISABLED for security');
  throw new Error('Bu fonksiyon güvenlik nedeniyle devre dışı bırakıldı');
}

// Remove dangerous global functions
if (typeof window !== 'undefined') {
  // Clear any existing dangerous functions
  delete (window as any).promoteToSuperadmin;
  delete (window as any).demoteToYonetici;
  
  console.warn('🔒 Güvenlik: Tehlikeli rol fonksiyonları kaldırıldı');
}

export default { 
  promoteToManager, 
  demoteToEngineer,
  // Legacy functions (disabled)
  promoteToSuperadmin,
  demoteToYonetici
};



