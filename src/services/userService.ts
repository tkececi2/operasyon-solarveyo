/**
 * Kullanıcı Yönetimi Servisi
 */

import { 
  collection, 
  query, 
  where, 
  getDocs,
  doc,
  getDoc,
  updateDoc,
  limit
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { User } from '../types';

/**
 * Tüm kullanıcıları getir (company bazlı, müşteri rolü hariç)
 */
export async function getAllUsers(userProfile: User): Promise<User[]> {
  try {
    // SuperAdmin tüm kullanıcıları görebilir, diğerleri sadece kendi şirketini
    const snapshot = await getDocs(collection(db, 'kullanicilar'));
    
    let users = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as User));

    // Company bazlı filtreleme
    if (userProfile.rol !== 'superadmin') {
      users = users.filter(u => u.companyId === userProfile.companyId);
    }
    
    // Müşteri rolündeki kullanıcıları filtrele
    users = users.filter(u => u.rol !== 'musteri');
    
    // Client-side sorting
    return users.sort((a, b) => {
      const nameA = (a.name || a.displayName || a.email || '').toLowerCase();
      const nameB = (b.name || b.displayName || b.email || '').toLowerCase();
      return nameA.localeCompare(nameB);
    }).slice(0, userProfile.rol === 'superadmin' ? 200 : 100);
  } catch (error) {
    console.error('Kullanıcılar getirilemedi:', error);
    return [];
  }
}

/**
 * Şirket kullanıcılarını getir (müşteri rolü hariç)
 */
export async function getCompanyUsers(companyId: string): Promise<User[]> {
  try {
    const q = query(
      collection(db, 'kullanicilar'),
      where('companyId', '==', companyId),
      limit(100)
    );
    
    const snapshot = await getDocs(q);
    const users = snapshot.docs.map(doc => ({
      id: doc.id,
      uid: doc.id,
      ...doc.data()
    } as User));
    
    // Müşteri rolündeki kullanıcıları filtrele
    return users.filter(user => user.rol !== 'musteri');
  } catch (error) {
    console.error('Şirket kullanıcıları getirilemedi:', error);
    return [];
  }
}

/**
 * Belirli bir kullanıcıyı getir
 */
export async function getUserById(userId: string): Promise<User | null> {
  try {
    const userDoc = await getDoc(doc(db, 'kullanicilar', userId));
    if (userDoc.exists()) {
      return {
        id: userDoc.id,
        ...userDoc.data()
      } as User;
    }
    return null;
  } catch (error) {
    console.error('Kullanıcı getirilemedi:', error);
    return null;
  }
}

/**
 * Kullanıcıları role göre getir
 */
export async function getUsersByRole(companyId: string, role: string): Promise<User[]> {
  try {
    const q = query(
      collection(db, 'kullanicilar'),
      where('companyId', '==', companyId),
      where('rol', '==', role)
    );

    const snapshot = await getDocs(q);
    const users = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as User));
    
    // Client-side sorting
    return users.sort((a, b) => {
      const nameA = (a.name || '').toLowerCase();
      const nameB = (b.name || '').toLowerCase();
      return nameA.localeCompare(nameB);
    });
  } catch (error) {
    console.error('Kullanıcılar getirilemedi:', error);
    return [];
  }
}

/**
 * Aktif kullanıcıları getir (müşteri rolü hariç)
 */
export async function getActiveUsers(companyId: string): Promise<User[]> {
  try {
    const q = query(
      collection(db, 'kullanicilar'),
      where('companyId', '==', companyId),
      where('status', '==', 'active')
    );

    const snapshot = await getDocs(q);
    const users = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as User));
    
    // Müşteri rolündeki kullanıcıları filtrele
    const filteredUsers = users.filter(user => user.rol !== 'musteri');
    
    // Client-side sorting
    return filteredUsers.sort((a, b) => {
      const nameA = (a.name || '').toLowerCase();
      const nameB = (b.name || '').toLowerCase();
      return nameA.localeCompare(nameB);
    });
  } catch (error) {
    console.error('Aktif kullanıcılar getirilemedi:', error);
    return [];
  }
}

/**
 * Kullanıcı durumunu güncelle
 */
export async function updateUserStatus(userId: string, status: 'active' | 'inactive'): Promise<void> {
  try {
    await updateDoc(doc(db, 'kullanicilar', userId), {
      status,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Kullanıcı durumu güncellenemedi:', error);
    throw error;
  }
}

/**
 * Kullanıcı bilgilerini güncelle
 */
export async function updateUserProfile(userId: string, data: Partial<User>): Promise<void> {
  try {
    await updateDoc(doc(db, 'kullanicilar', userId), {
      ...data,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Kullanıcı bilgileri güncellenemedi:', error);
    throw error;
  }
}

/**
 * Şirket ekip üyelerini getir (müşteriler hariç - sadece çalışanlar)
 */
export async function getCompanyTeamMembers(companyId: string): Promise<User[]> {
  try {
    const q = query(
      collection(db, 'kullanicilar'),
      where('companyId', '==', companyId),
      limit(100)
    );
    
    const snapshot = await getDocs(q);
    const users = snapshot.docs.map(doc => ({
      id: doc.id,
      uid: doc.id,
      ...doc.data()
    } as User));
    
    // Sadece ekip üyelerini döndür (müşteri rolü hariç)
    const teamMembers = users.filter(user => 
      user.rol !== 'musteri' && 
      ['yonetici', 'muhendis', 'tekniker', 'bekci', 'superadmin'].includes(user.rol || '')
    );
    
    // İsme göre sırala
    return teamMembers.sort((a, b) => {
      const nameA = (a.name || a.displayName || a.email || '').toLowerCase();
      const nameB = (b.name || b.displayName || b.email || '').toLowerCase();
      return nameA.localeCompare(nameB);
    });
  } catch (error) {
    console.error('Ekip üyeleri getirilemedi:', error);
    return [];
  }
}

/**
 * İzin için yerine bakacak kişileri getir (rol ve saha bazlı)
 */
export async function getSubstituteUsers(
  companyId: string, 
  currentUserId: string,
  userRole: string,
  userSahalar?: string[]
): Promise<User[]> {
  try {
    const q = query(
      collection(db, 'kullanicilar'),
      where('companyId', '==', companyId),
      limit(100)
    );
    
    const snapshot = await getDocs(q);
    let users = snapshot.docs.map(doc => ({
      id: doc.id,
      uid: doc.id,
      ...doc.data()
    } as User));
    
    // Kendisini hariç tut
    users = users.filter(u => u.id !== currentUserId);
    
    // Müşteri rolünü hariç tut
    users = users.filter(u => u.rol !== 'musteri');
    
    // Rol bazlı filtreleme
    if (userRole === 'yonetici' || userRole === 'superadmin') {
      // Yönetici tüm çalışanları görebilir
      return users.filter(u => u.rol !== 'musteri');
    } else if (userRole === 'bekci') {
      // Bekçi sadece aynı sahaya atanmış diğer bekçileri görebilir
      users = users.filter(u => u.rol === 'bekci');
      
      // Saha kontrolü
      if (userSahalar && userSahalar.length > 0) {
        users = users.filter(u => {
          const uSahalar = u.sahalar || [];
          // En az bir ortak saha olmalı
          return uSahalar.some(saha => userSahalar.includes(saha));
        });
      }
    } else if (userRole === 'muhendis') {
      // Mühendis sadece diğer mühendisleri görebilir
      users = users.filter(u => u.rol === 'muhendis');
      
      // Saha kontrolü (opsiyonel - mühendisler genelde tüm sahalara erişebilir)
      if (userSahalar && userSahalar.length > 0) {
        users = users.filter(u => {
          const uSahalar = u.sahalar || [];
          return uSahalar.some(saha => userSahalar.includes(saha));
        });
      }
    } else if (userRole === 'tekniker') {
      // Tekniker sadece diğer teknikerleri görebilir
      users = users.filter(u => u.rol === 'tekniker');
      
      // Saha kontrolü
      if (userSahalar && userSahalar.length > 0) {
        users = users.filter(u => {
          const uSahalar = u.sahalar || [];
          return uSahalar.some(saha => userSahalar.includes(saha));
        });
      }
    }
    
    // İsme göre sırala
    return users.sort((a, b) => {
      const nameA = (a.name || a.displayName || a.email || '').toLowerCase();
      const nameB = (b.name || b.displayName || b.email || '').toLowerCase();
      return nameA.localeCompare(nameB);
    });
  } catch (error) {
    console.error('Yerine bakacak kişiler getirilemedi:', error);
    return [];
  }
}
