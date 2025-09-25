/**
 * İzin/Tatil Yönetimi Servisi
 */

import { 
  collection, 
  doc, 
  addDoc,
  setDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc,
  query, 
  where,
  Timestamp,
  serverTimestamp,
  limit,
  startAfter
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { ILeaveRequest, ILeaveBalance, IHoliday, IShiftSchedule } from '../types/leave.types';
import { User } from '../types';

/**
 * Manuel izin kaydı oluştur (Yöneticiler için)
 */
export async function createManualLeaveEntry(
  data: any,
  userProfile: User
): Promise<string> {
  try {
    // Yetki kontrolü
    if (userProfile.rol !== 'yonetici' && userProfile.rol !== 'superadmin') {
      throw new Error('Bu işlem için yetkiniz yok');
    }

    const docRef = doc(collection(db, 'leaveRequests'));
    
    // Undefined değerleri temizle
    const cleanData = {
      ...data,
      status: 'onaylandi', // Manuel kayıtlar direkt onaylı
      isManualEntry: true,
      manualEntryDate: serverTimestamp(),
      createdBy: userProfile.uid || userProfile.id || 'system',
      createdByName: userProfile.displayName || userProfile.email || 'Yönetici',
      approvedBy: userProfile.uid || userProfile.id || 'system',
      approverName: userProfile.displayName || userProfile.email || 'Yönetici',
      approvalDate: serverTimestamp(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    // Undefined alanları sil
    Object.keys(cleanData).forEach(key => {
      if (cleanData[key] === undefined) {
        delete cleanData[key];
      }
    });
    
    await setDoc(docRef, cleanData);

    return docRef.id;
  } catch (error) {
    console.error('Manuel izin kaydı oluşturma hatası:', error);
    throw error;
  }
}

/**
 * İzin bakiyesini güncelle
 */
export async function updateLeaveBalance(
  userId: string,
  year: number,
  leaveType: string,
  days: number,
  operation: 'use' | 'add' | 'refund'
): Promise<void> {
  try {
    const balance = await getLeaveBalance(userId, year);
    
    if (!balance) {
      throw new Error('İzin bakiyesi bulunamadı');
    }

    const updates: any = {
      updatedAt: serverTimestamp()
    };

    if (leaveType === 'yillik') {
      if (operation === 'use') {
        // Kullanım
        updates.annualLeaveUsed = (balance.annualLeaveUsed || 0) + days;
        updates.annualLeaveRemaining = Math.max(0, (balance.annualLeaveRemaining || 0) - days);
      } else if (operation === 'add') {
        // Ekleme
        updates.annualLeaveTotal = (balance.annualLeaveTotal || 0) + days;
        updates.annualLeaveRemaining = (balance.annualLeaveRemaining || 0) + days;
      } else if (operation === 'refund') {
        // İade
        updates.annualLeaveUsed = Math.max(0, (balance.annualLeaveUsed || 0) - days);
        updates.annualLeaveRemaining = (balance.annualLeaveRemaining || 0) + days;
      }
    } else if (leaveType === 'hastalik') {
      if (operation === 'use') {
        updates.sickLeaveUsed = (balance.sickLeaveUsed || 0) + days;
        updates.sickLeaveRemaining = Math.max(0, (balance.sickLeaveRemaining || 0) - days);
      }
    }

    if (balance.id) {
      await updateDoc(doc(db, 'leaveBalances', balance.id), updates);
    }
  } catch (error) {
    console.error('Bakiye güncelleme hatası:', error);
    throw error;
  }
}

/**
 * İzin talebi oluştur
 */
export async function createLeaveRequest(
  data: Omit<ILeaveRequest, 'id' | 'createdAt' | 'status'>,
  userProfile: User
): Promise<string> {
  try {
    // Yetki kontrolü
    if (!userProfile) {
      throw new Error('Kullanıcı bilgisi bulunamadı');
    }

    // İzin bakiyesi kontrolü
    const balance = await getLeaveBalance(data.userId, new Date(data.startDate).getFullYear());
    if (data.leaveType === 'yillik' && balance) {
      if (balance.annualLeaveRemaining < data.totalDays) {
        throw new Error(`Yetersiz yıllık izin bakiyesi. Kalan: ${balance.annualLeaveRemaining} gün`);
      }
    }

    // undefined değerleri temizle
    const cleanData: any = {
      userId: data.userId,
      userName: data.userName || 'İsimsiz Kullanıcı',
      userRole: data.userRole,
      userPhotoUrl: data.userPhotoUrl || userProfile.fotoURL,
      companyId: userProfile.companyId,
      leaveType: data.leaveType,
      startDate: data.startDate,
      endDate: data.endDate,
      totalDays: data.totalDays,
      reason: data.reason,
      status: 'beklemede',
      createdAt: serverTimestamp()
    };

    // Opsiyonel alanları ekle (undefined değilse)
    if (data.substituteUserId && data.substituteUserId !== 'undefined') {
      cleanData.substituteUserId = data.substituteUserId;
    }
    if (data.substituteUserName) {
      cleanData.substituteUserName = data.substituteUserName;
    }
    if (data.notes) {
      cleanData.notes = data.notes;
    }

    const docRef = await addDoc(collection(db, 'leaveRequests'), cleanData);

    // Bildirim gönder (yöneticilere) - şimdilik console.log
    console.log(`Yeni izin talebi: ${data.userName} - ${docRef.id}`);

    return docRef.id;
  } catch (error) {
    console.error('İzin talebi oluşturma hatası:', error);
    throw error;
  }
}

/**
 * İzin taleplerini getir
 */
export async function getLeaveRequests(
  userProfile: User,
  filters?: {
    userId?: string;
    status?: string;
    startDate?: Date;
    endDate?: Date;
    year?: number;
  }
): Promise<ILeaveRequest[]> {
  try {
    let q = query(
      collection(db, 'leaveRequests'),
      where('companyId', '==', userProfile.companyId),
      limit(100)
    );

    // Kullanıcı kendi izinlerini görebilir, yönetici hepsini
    if (userProfile.rol !== 'yonetici' && userProfile.rol !== 'superadmin') {
      q = query(
        collection(db, 'leaveRequests'),
        where('companyId', '==', userProfile.companyId),
        where('userId', '==', userProfile.id),
        limit(100)
      );
    } else if (filters?.userId) {
      q = query(
        collection(db, 'leaveRequests'),
        where('companyId', '==', userProfile.companyId),
        where('userId', '==', filters.userId),
        limit(100)
      );
    }

    if (filters?.status) {
      q = query(
        collection(db, 'leaveRequests'),
        where('companyId', '==', userProfile.companyId),
        where('status', '==', filters.status),
        limit(100)
      );
    }

    const snapshot = await getDocs(q);
    let requests = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as ILeaveRequest));
    
    // Yıl filtresi (client-side)
    if (filters?.year) {
      requests = requests.filter(request => {
        const requestYear = new Date(request.startDate).getFullYear();
        return requestYear === filters.year;
      });
    }
    
    // Client-side sorting
    return requests.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return dateB - dateA; // Desc order
    });
  } catch (error) {
    console.error('İzin talepleri getirme hatası:', error);
    return []; // Hata durumunda boş array dön
  }
}

/**
 * İzin talebini onayla/reddet
 */
export async function updateLeaveRequestStatus(
  requestId: string,
  status: 'onaylandi' | 'reddedildi',
  userProfile: User,
  rejectionReason?: string
): Promise<void> {
  try {
    // Yetki kontrolü
    if (userProfile.rol !== 'yonetici' && userProfile.rol !== 'superadmin') {
      throw new Error('Bu işlem için yetkiniz yok');
    }

    const updateData: any = {
      status,
      approvedBy: userProfile.id || userProfile.uid,
      approverName: userProfile.name || userProfile.displayName || userProfile.email || 'Yönetici',
      approvalDate: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    if (status === 'reddedildi' && rejectionReason) {
      updateData.rejectionReason = rejectionReason;
    }

    await updateDoc(doc(db, 'leaveRequests', requestId), updateData);

    // Onaylandıysa bakiyeyi güncelle
    if (status === 'onaylandi') {
      const request = await getDoc(doc(db, 'leaveRequests', requestId));
      const data = request.data() as ILeaveRequest;
      await updateLeaveBalance(data.userId, new Date(data.startDate).getFullYear(), data.leaveType, data.totalDays, 'use');
    }

    // Bildirim gönder - şimdilik console.log
    console.log(`İzin talebi güncellendi: ${requestId} - ${status} - ${userProfile.name || userProfile.displayName || userProfile.email}`);
  } catch (error) {
    console.error('İzin durumu güncelleme hatası:', error);
    throw error;
  }
}

/**
 * İzin talebini sil
 */
export async function deleteLeaveRequest(
  requestId: string,
  userProfile: User
): Promise<void> {
  try {
    // Yetki kontrolü - sadece yönetici ve superadmin silebilir
    if (userProfile.rol !== 'yonetici' && userProfile.rol !== 'superadmin') {
      throw new Error('Bu işlem için yetkiniz yok');
    }

    // İzin talebini getir
    const requestDoc = await getDoc(doc(db, 'leaveRequests', requestId));
    if (!requestDoc.exists()) {
      throw new Error('İzin talebi bulunamadı');
    }

    const requestData = requestDoc.data() as ILeaveRequest;

    // Eğer onaylanmış bir izinse, bakiyeyi geri yükle
    if (requestData.status === 'onaylandi') {
      await updateLeaveBalance(
        requestData.userId, 
        new Date(requestData.startDate).getFullYear(), 
        requestData.leaveType, 
        requestData.totalDays, 
        'refund'
      );
    }

    // İzin talebini sil
    await deleteDoc(doc(db, 'leaveRequests', requestId));

    console.log(`İzin talebi silindi: ${requestId} - Silen: ${userProfile.ad || userProfile.displayName || userProfile.email}`);
  } catch (error) {
    console.error('İzin silme hatası:', error);
    throw error;
  }
}

/**
 * İzin istatistiklerini getir
 */
export async function getLeaveStatistics(
  companyId: string,
  year: number = new Date().getFullYear()
): Promise<any> {
  try {
    const q = query(
      collection(db, 'leaveRequests'),
      where('companyId', '==', companyId),
      limit(1000)
    );

    const snapshot = await getDocs(q);
    const requests = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as ILeaveRequest));

    // Yıl filtresi
    const yearRequests = requests.filter(r => {
      const startYear = new Date(r.startDate).getFullYear();
      return startYear === year;
    });

    const stats = {
      totalRequests: yearRequests.length,
      approvedRequests: yearRequests.filter(r => r.status === 'onaylandi').length,
      pendingRequests: yearRequests.filter(r => r.status === 'beklemede').length,
      rejectedRequests: yearRequests.filter(r => r.status === 'reddedildi').length,
      averageLeaveDays: yearRequests.length > 0 
        ? Math.round(yearRequests.reduce((sum, r) => sum + r.totalDays, 0) / yearRequests.length)
        : 0,
      byType: {
        yillik: yearRequests.filter(r => r.leaveType === 'yillik').length,
        hastalik: yearRequests.filter(r => r.leaveType === 'hastalik').length,
        ucretsiz: yearRequests.filter(r => r.leaveType === 'ucretsiz').length,
        dogum: yearRequests.filter(r => r.leaveType === 'dogum').length,
        evlilik: yearRequests.filter(r => r.leaveType === 'evlilik').length,
        vefat: yearRequests.filter(r => r.leaveType === 'vefat').length,
        diger: yearRequests.filter(r => r.leaveType === 'diger').length,
      }
    };

    return stats;
  } catch (error) {
    console.error('İstatistik getirme hatası:', error);
    return {
      totalRequests: 0,
      approvedRequests: 0,
      pendingRequests: 0,
      rejectedRequests: 0,
      averageLeaveDays: 0,
      byType: {}
    };
  }
}

/**
 * İzin bakiyesini getir
 */
export async function getLeaveBalance(
  userId: string,
  year: number
): Promise<ILeaveBalance | null> {
  try {
    // Parametre kontrolü
    if (!userId || !year) {
      console.warn('getLeaveBalance: Eksik parametreler', { userId, year });
      return null;
    }
    
    const q = query(
      collection(db, 'leaveBalances'),
      where('userId', '==', userId),
      where('year', '==', year)
    );

    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      // Yoksa varsayılan oluştur
      return await createDefaultLeaveBalance(userId, year);
    }

    return {
      id: snapshot.docs[0].id,
      ...snapshot.docs[0].data()
    } as ILeaveBalance;
  } catch (error) {
    console.error('İzin bakiyesi getirme hatası:', error);
    return null;
  }
}

/**
 * Varsayılan izin bakiyesi oluştur
 */
async function createDefaultLeaveBalance(
  userId: string,
  year: number
): Promise<ILeaveBalance> {
  try {
    // Parametre kontrolü
    if (!userId || !year) {
      throw new Error('createDefaultLeaveBalance: Eksik parametreler');
    }
    
    const userDoc = await getDoc(doc(db, 'kullanicilar', userId));
    const userData = userDoc.data();

    const defaultBalance = {
      userId,
      companyId: userData?.companyId || '',
      year,
      annualLeaveTotal: 14, // Varsayılan yıllık izin
      annualLeaveUsed: 0,
      annualLeaveRemaining: 14,
      sickLeaveTotal: 10,
      sickLeaveUsed: 0,
      sickLeaveRemaining: 10,
      unpaidLeaveUsed: 0,
      maternityLeaveUsed: 0,
      marriageLeaveUsed: 0,
      bereavementLeaveUsed: 0,
      otherLeaveUsed: 0,
      carryOverDays: 0,
      updatedAt: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, 'leaveBalances'), defaultBalance);
    return {
      id: docRef.id,
      ...defaultBalance
    } as ILeaveBalance;
  } catch (error) {
    console.error('Varsayılan bakiye oluşturma hatası:', error);
    throw error;
  }
}

/**
 * İzin bakiyesini manuel güncelle (Yöneticiler için)
 */
export async function updateLeaveBalanceManual(
  userId: string,
  year: number,
  balanceData: {
    annualLeaveTotal?: number;
    sickLeaveTotal?: number;
    carryOverDays?: number;
  },
  userProfile: User
): Promise<void> {
  try {
    // Yetki kontrolü
    if (userProfile.rol !== 'yonetici' && userProfile.rol !== 'superadmin') {
      throw new Error('Bu işlem için yetkiniz yok');
    }

    // Parametre kontrolü
    if (!userId || !year) {
      throw new Error('Kullanıcı ID ve yıl parametreleri zorunludur');
    }
    
    const balance = await getLeaveBalance(userId, year);
    
    if (!balance || !balance.id) {
      // Yoksa yeni oluştur
      let userData: any = {};
      try {
        const userDoc = await getDoc(doc(db, 'kullanicilar', userId));
        userData = userDoc.data() || {};
      } catch (err) {
        console.warn('Kullanıcı bilgisi alınamadı:', err);
      }
      
      await addDoc(collection(db, 'leaveBalances'), {
        userId,
        companyId: userData?.companyId || userProfile.companyId,
        year,
        annualLeaveTotal: balanceData.annualLeaveTotal || 14,
        annualLeaveUsed: 0,
        annualLeaveRemaining: balanceData.annualLeaveTotal || 14,
        sickLeaveTotal: balanceData.sickLeaveTotal || 10,
        sickLeaveUsed: 0,
        sickLeaveRemaining: balanceData.sickLeaveTotal || 10,
        unpaidLeaveUsed: 0,
        maternityLeaveUsed: 0,
        marriageLeaveUsed: 0,
        bereavementLeaveUsed: 0,
        otherLeaveUsed: 0,
        carryOverDays: balanceData.carryOverDays || 0,
        updatedAt: serverTimestamp()
      });
    } else {
      // Var olanı güncelle - balance.id kontrolü
      if (!balance.id) {
        throw new Error('Bakiye ID bulunamadı');
      }
      
      const updateData: any = {
        updatedAt: serverTimestamp()
      };
      
      if (balanceData.annualLeaveTotal !== undefined) {
        updateData.annualLeaveTotal = balanceData.annualLeaveTotal;
        updateData.annualLeaveRemaining = balanceData.annualLeaveTotal - (balance.annualLeaveUsed || 0);
      }
      
      if (balanceData.sickLeaveTotal !== undefined) {
        updateData.sickLeaveTotal = balanceData.sickLeaveTotal;
        updateData.sickLeaveRemaining = balanceData.sickLeaveTotal - (balance.sickLeaveUsed || 0);
      }
      
      if (balanceData.carryOverDays !== undefined) {
        updateData.carryOverDays = balanceData.carryOverDays;
      }
      
      await updateDoc(doc(db, 'leaveBalances', balance.id), updateData);
    }
  } catch (error) {
    console.error('İzin bakiyesi güncelleme hatası:', error);
    throw error;
  }
}

/**
 * Resmi tatilleri getir
 */
export async function getHolidays(
  companyId: string,
  year?: number
): Promise<IHoliday[]> {
  try {
    const q = query(
      collection(db, 'holidays'),
      where('companyId', '==', companyId)
    );

    const snapshot = await getDocs(q);
    let holidays = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as IHoliday));

    // Yıl filtresi
    if (year) {
      holidays = holidays.filter(h => {
        const holidayYear = new Date(h.date).getFullYear();
        return holidayYear === year;
      });
    }

    // Client-side sorting
    return holidays.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return dateA - dateB; // Asc order
    });
  } catch (error) {
    console.error('Tatil günleri getirme hatası:', error);
    return [];
  }
}

/**
 * Resmi tatil ekle
 */
export async function addHoliday(
  data: Omit<IHoliday, 'id' | 'createdAt'>,
  userProfile: User
): Promise<string> {
  try {
    if (userProfile.rol !== 'yonetici' && userProfile.rol !== 'superadmin') {
      throw new Error('Bu işlem için yetkiniz yok');
    }

    const docRef = await addDoc(collection(db, 'holidays'), {
      ...data,
      companyId: userProfile.companyId,
      createdAt: serverTimestamp()
    });

    return docRef.id;
  } catch (error) {
    console.error('Tatil ekleme hatası:', error);
    throw error;
  }
}

/**
 * Vardiya programını getir
 */
export async function getShiftSchedule(
  companyId: string,
  startDate: Date,
  endDate: Date,
  userId?: string
): Promise<IShiftSchedule[]> {
  try {
    let q = query(
      collection(db, 'shiftSchedules'),
      where('companyId', '==', companyId)
    );

    if (userId) {
      q = query(
        collection(db, 'shiftSchedules'),
        where('companyId', '==', companyId),
        where('userId', '==', userId)
      );
    }

    const snapshot = await getDocs(q);
    const schedules = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as IShiftSchedule));
    
    // Client-side filtering and sorting
    return schedules
      .filter(s => {
        const scheduleDate = new Date(s.date);
        return scheduleDate >= startDate && scheduleDate <= endDate;
      })
      .sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return dateA - dateB; // Asc order
      });
  } catch (error) {
    console.error('Vardiya programı getirme hatası:', error);
    return [];
  }
}

/**
 * Vardiya ata
 */
export async function assignShift(
  data: Omit<IShiftSchedule, 'id' | 'createdAt'>,
  userProfile: User
): Promise<string> {
  try {
    if (userProfile.rol !== 'yonetici' && userProfile.rol !== 'superadmin') {
      throw new Error('Bu işlem için yetkiniz yok');
    }

    const docRef = await addDoc(collection(db, 'shiftSchedules'), {
      ...data,
      companyId: userProfile.companyId,
      createdBy: userProfile.id,
      createdAt: serverTimestamp()
    });

    return docRef.id;
  } catch (error) {
    console.error('Vardiya atama hatası:', error);
    throw error;
  }
}

/**
 * Toplu vardiya ataması
 */
export async function bulkAssignShifts(
  assignments: Array<Omit<IShiftSchedule, 'id' | 'createdAt' | 'companyId' | 'createdBy'>>,
  userProfile: User
): Promise<void> {
  try {
    if (userProfile.rol !== 'yonetici' && userProfile.rol !== 'superadmin') {
      throw new Error('Bu işlem için yetkiniz yok');
    }

    const batch = assignments.map(assignment => 
      addDoc(collection(db, 'shiftSchedules'), {
        ...assignment,
        companyId: userProfile.companyId,
        createdBy: userProfile.id,
        createdAt: serverTimestamp()
      })
    );

    await Promise.all(batch);
  } catch (error) {
    console.error('Toplu vardiya atama hatası:', error);
    throw error;
  }
}

/**
 * İzin bildirimi gönder (placeholder)
 */
async function sendLeaveNotification(
  requestId: string,
  userName: string,
  type: 'yeni_talep' | 'onaylandi' | 'reddedildi'
): Promise<void> {
  // TODO: Bildirim sistemi entegrasyonu
  console.log(`Bildirim: ${userName} - ${type} - ${requestId}`);
}

