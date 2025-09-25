/**
 * Gelişmiş İzin Yönetimi Servisi
 * 
 * Bu servis şunları sağlar:
 * - Yıllık izin hakediş hesaplamaları
 * - Otomatik dönem yenileme
 * - Geçmiş yıllar takibi
 * - Detaylı raporlama
 * - İzin politikası yönetimi
 */

import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  writeBatch,
  runTransaction
} from 'firebase/firestore';
import { db } from '../config/firebase';
import {
  ILeaveYear,
  ILeaveTransaction,
  ILeaveAccrualRule,
  IEmployeeLeaveProfile,
  ILeaveReport,
  ILeavePolicy,
  ILeaveSettings,
  ILeaveAccrualCalculation
} from '../types/leave-management.types';
import { differenceInMonths, startOfYear, endOfYear, addYears, format, isAfter, isBefore } from 'date-fns';

/**
 * İzin Kuralı Yönetimi
 */
export async function createLeaveRule(rule: Omit<ILeaveAccrualRule, 'id'>): Promise<string> {
  try {
    const docRef = doc(collection(db, 'leaveRules'));
    await setDoc(docRef, {
      ...rule,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    return docRef.id;
  } catch (error) {
    console.error('İzin kuralı oluşturma hatası:', error);
    throw error;
  }
}

export async function getCompanyLeaveRules(companyId: string): Promise<ILeaveAccrualRule[]> {
  try {
    const q = query(
      collection(db, 'leaveRules'),
      where('companyId', '==', companyId),
      where('isActive', '==', true),
      orderBy('minServiceMonths', 'asc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as ILeaveAccrualRule));
  } catch (error) {
    console.error('İzin kuralları getirme hatası:', error);
    throw error;
  }
}

/**
 * Çalışan İzin Profili Yönetimi
 */
export async function createEmployeeProfile(profile: Omit<IEmployeeLeaveProfile, 'id'>): Promise<string> {
  try {
    const docRef = doc(collection(db, 'employeeLeaveProfiles'));
    await setDoc(docRef, {
      ...profile,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    
    // İlk yıl kaydını oluştur
    await initializeLeaveYear(profile.userId, profile.companyId);
    
    return docRef.id;
  } catch (error) {
    console.error('Çalışan profili oluşturma hatası:', error);
    throw error;
  }
}

export async function getEmployeeProfile(userId: string): Promise<IEmployeeLeaveProfile | null> {
  try {
    const q = query(
      collection(db, 'employeeLeaveProfiles'),
      where('userId', '==', userId),
      limit(1)
    );
    
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    
    return {
      id: snapshot.docs[0].id,
      ...snapshot.docs[0].data()
    } as IEmployeeLeaveProfile;
  } catch (error) {
    console.error('Çalışan profili getirme hatası:', error);
    throw error;
  }
}

/**
 * İzin Yılı Yönetimi
 */
export async function initializeLeaveYear(
  userId: string, 
  companyId: string,
  year: number = new Date().getFullYear()
): Promise<string> {
  try {
    // Çalışan profilini al
    const profile = await getEmployeeProfile(userId);
    if (!profile) throw new Error('Çalışan profili bulunamadı');
    
    // Hakediş hesapla
    const accrual = await calculateLeaveAccrual(userId, companyId);
    
    // Önceki yıl bilgisini al (devir için)
    const previousYear = await getLeaveYear(userId, year - 1);
    const carryOver = previousYear?.balance.annual || 0;
    
    const leaveYear: Omit<ILeaveYear, 'id'> = {
      companyId,
      userId,
      year,
      startDate: startOfYear(new Date(year, 0, 1)),
      endDate: endOfYear(new Date(year, 11, 31)),
      isCurrent: year === new Date().getFullYear(),
      
      entitlements: {
        annual: accrual.final.annual,
        sick: accrual.final.sick,
        carryOver: Math.min(carryOver, 10), // Max 10 gün devir
        adjustment: 0,
        total: accrual.final.annual + Math.min(carryOver, 10)
      },
      
      usage: {
        annual: 0,
        sick: 0,
        unpaid: 0,
        other: 0,
        total: 0
      },
      
      balance: {
        annual: accrual.final.annual + Math.min(carryOver, 10),
        sick: accrual.final.sick,
        total: accrual.final.total + Math.min(carryOver, 10)
      },
      
      yearEndProcessed: false,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };
    
    const docRef = doc(collection(db, 'leaveYears'));
    await setDoc(docRef, leaveYear);
    
    // İşlem kaydı oluştur
    await createLeaveTransaction({
      companyId,
      userId,
      leaveYearId: docRef.id,
      transactionType: 'hakkedis',
      transactionDate: new Date(),
      leaveType: 'yillik',
      days: leaveYear.entitlements.total,
      balanceBefore: 0,
      balanceAfter: leaveYear.entitlements.total,
      description: `${year} yılı izin hakkı tanımlandı`,
      createdBy: 'system',
      createdByName: 'Sistem'
    });
    
    return docRef.id;
  } catch (error) {
    console.error('İzin yılı başlatma hatası:', error);
    throw error;
  }
}

export async function getLeaveYear(userId: string, year: number): Promise<ILeaveYear | null> {
  try {
    const q = query(
      collection(db, 'leaveYears'),
      where('userId', '==', userId),
      where('year', '==', year),
      limit(1)
    );
    
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    
    return {
      id: snapshot.docs[0].id,
      ...snapshot.docs[0].data()
    } as ILeaveYear;
  } catch (error) {
    console.error('İzin yılı getirme hatası:', error);
    throw error;
  }
}

export async function getCurrentLeaveBalance(userId: string): Promise<ILeaveYear | null> {
  const currentYear = new Date().getFullYear();
  let leaveYear = await getLeaveYear(userId, currentYear);
  
  // Eğer mevcut yıl kaydı yoksa oluştur
  if (!leaveYear) {
    const profile = await getEmployeeProfile(userId);
    if (profile) {
      await initializeLeaveYear(userId, profile.companyId, currentYear);
      leaveYear = await getLeaveYear(userId, currentYear);
    }
  }
  
  return leaveYear;
}

/**
 * İzin Kullanım İşlemleri
 */
export async function useLeaveBalance(
  userId: string,
  leaveType: 'yillik' | 'hastalik' | 'ucretsiz' | 'diger',
  days: number,
  referenceId?: string,
  description?: string
): Promise<void> {
  try {
    const currentYear = await getCurrentLeaveBalance(userId);
    if (!currentYear) throw new Error('İzin yılı bulunamadı');
    
    await runTransaction(db, async (transaction) => {
      const yearRef = doc(db, 'leaveYears', currentYear.id!);
      const yearDoc = await transaction.get(yearRef);
      const yearData = yearDoc.data() as ILeaveYear;
      
      // Bakiye kontrolü
      if (leaveType === 'yillik' && yearData.balance.annual < days) {
        throw new Error('Yetersiz yıllık izin bakiyesi');
      }
      if (leaveType === 'hastalik' && yearData.balance.sick < days) {
        throw new Error('Yetersiz hastalık izni bakiyesi');
      }
      
      // Güncelleme
      const updates: any = {
        updatedAt: Timestamp.now()
      };
      
      if (leaveType === 'yillik') {
        updates['usage.annual'] = yearData.usage.annual + days;
        updates['balance.annual'] = yearData.balance.annual - days;
      } else if (leaveType === 'hastalik') {
        updates['usage.sick'] = yearData.usage.sick + days;
        updates['balance.sick'] = yearData.balance.sick - days;
      } else if (leaveType === 'ucretsiz') {
        updates['usage.unpaid'] = yearData.usage.unpaid + days;
      } else {
        updates['usage.other'] = yearData.usage.other + days;
      }
      
      updates['usage.total'] = yearData.usage.total + days;
      updates['balance.total'] = yearData.balance.total - days;
      
      transaction.update(yearRef, updates);
      
      // İşlem kaydı
      const transactionRef = doc(collection(db, 'leaveTransactions'));
      transaction.set(transactionRef, {
        companyId: yearData.companyId,
        userId,
        leaveYearId: currentYear.id,
        transactionType: 'kullanim',
        transactionDate: Timestamp.now(),
        leaveType,
        days: -days,
        balanceBefore: yearData.balance.total,
        balanceAfter: yearData.balance.total - days,
        referenceType: 'leave_request',
        referenceId,
        description: description || `${days} gün ${leaveType} izin kullanıldı`,
        createdBy: userId,
        createdByName: 'Kullanıcı',
        createdAt: Timestamp.now()
      });
    });
  } catch (error) {
    console.error('İzin kullanım hatası:', error);
    throw error;
  }
}

/**
 * İzin İşlem Geçmişi
 */
export async function createLeaveTransaction(
  transaction: Omit<ILeaveTransaction, 'id' | 'createdAt'>
): Promise<string> {
  try {
    const docRef = doc(collection(db, 'leaveTransactions'));
    await setDoc(docRef, {
      ...transaction,
      createdAt: Timestamp.now()
    });
    return docRef.id;
  } catch (error) {
    console.error('İşlem kaydı oluşturma hatası:', error);
    throw error;
  }
}

export async function getUserLeaveTransactions(
  userId: string,
  year?: number
): Promise<ILeaveTransaction[]> {
  try {
    let q = query(
      collection(db, 'leaveTransactions'),
      where('userId', '==', userId),
      orderBy('transactionDate', 'desc')
    );
    
    if (year) {
      const startDate = startOfYear(new Date(year, 0, 1));
      const endDate = endOfYear(new Date(year, 11, 31));
      q = query(q, 
        where('transactionDate', '>=', startDate),
        where('transactionDate', '<=', endDate)
      );
    }
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as ILeaveTransaction));
  } catch (error) {
    console.error('İşlem geçmişi getirme hatası:', error);
    throw error;
  }
}

/**
 * Hakediş Hesaplama
 */
export async function calculateLeaveAccrual(
  userId: string,
  companyId: string
): Promise<ILeaveAccrualCalculation> {
  try {
    const profile = await getEmployeeProfile(userId);
    if (!profile) throw new Error('Çalışan profili bulunamadı');
    
    const rules = await getCompanyLeaveRules(companyId);
    const serviceMonths = differenceInMonths(new Date(), new Date(profile.hireDate));
    
    // Uygun kuralı bul
    let appliedRule: ILeaveAccrualRule | undefined;
    for (const rule of rules) {
      if (
        serviceMonths >= rule.minServiceMonths &&
        (!rule.maxServiceMonths || serviceMonths <= rule.maxServiceMonths) &&
        (rule.employmentType === 'tum' || rule.employmentType === profile.employmentType)
      ) {
        appliedRule = rule;
      }
    }
    
    // Varsayılan değerler
    let annual = 14; // Minimum yasal hak
    let sick = 10;
    
    if (appliedRule) {
      annual = appliedRule.annualLeaveDays;
      sick = appliedRule.sickLeaveDays;
    }
    
    // Kıdem bazlı artış (her 5 yıl için 1 gün)
    const serviceYears = Math.floor(serviceMonths / 12);
    const seniorityBonus = Math.floor(serviceYears / 5);
    annual += seniorityBonus;
    
    // Özel haklar varsa ekle
    if (profile.customAnnualDays) {
      annual += profile.customAnnualDays;
    }
    if (profile.customSickDays) {
      sick += profile.customSickDays;
    }
    
    return {
      userId,
      calculationDate: new Date(),
      serviceMonths,
      appliedRule,
      calculated: {
        annual: appliedRule?.annualLeaveDays || 14,
        sick: appliedRule?.sickLeaveDays || 10,
        total: (appliedRule?.annualLeaveDays || 14) + (appliedRule?.sickLeaveDays || 10)
      },
      adjustments: [
        ...(seniorityBonus > 0 ? [{
          reason: `Kıdem artışı (${serviceYears} yıl)`,
          amount: seniorityBonus
        }] : []),
        ...(profile.customAnnualDays ? [{
          reason: 'Özel hak tanımlaması',
          amount: profile.customAnnualDays
        }] : [])
      ],
      final: {
        annual,
        sick,
        total: annual + sick
      }
    };
  } catch (error) {
    console.error('Hakediş hesaplama hatası:', error);
    throw error;
  }
}

/**
 * Detaylı İzin Raporu
 */
export async function generateLeaveReport(userId: string): Promise<ILeaveReport> {
  try {
    const profile = await getEmployeeProfile(userId);
    if (!profile) throw new Error('Çalışan profili bulunamadı');
    
    const currentYear = new Date().getFullYear();
    const currentBalance = await getCurrentLeaveBalance(userId);
    
    // Geçmiş yıllar
    const history: ILeaveReport['history'] = [];
    for (let year = currentYear - 3; year < currentYear; year++) {
      const yearData = await getLeaveYear(userId, year);
      if (yearData) {
        history.push({
          year,
          entitlement: yearData.entitlements.total,
          used: yearData.usage.total,
          carryOver: yearData.carryOverToNextYear || 0,
          expired: yearData.expiredDays || 0
        });
      }
    }
    
    // İşlem geçmişinden analiz
    const transactions = await getUserLeaveTransactions(userId);
    const usageByType: Record<string, number> = {};
    const usageByMonth: Record<string, number> = {};
    let totalDuration = 0;
    let requestCount = 0;
    
    transactions.forEach(t => {
      if (t.transactionType === 'kullanim') {
        const absdays = Math.abs(t.days);
        usageByType[t.leaveType] = (usageByType[t.leaveType] || 0) + absdays;
        
        const monthKey = format(new Date(t.transactionDate), 'yyyy-MM');
        usageByMonth[monthKey] = (usageByMonth[monthKey] || 0) + absdays;
        
        totalDuration += absdays;
        requestCount++;
      }
    });
    
    const mostUsedType = Object.entries(usageByType)
      .sort(([, a], [, b]) => b - a)[0]?.[0] || 'yillik';
    
    return {
      userId,
      userName: profile.userName,
      companyId: profile.companyId,
      reportDate: new Date(),
      
      currentYear: {
        year: currentYear,
        entitlement: currentBalance?.entitlements.total || 0,
        used: currentBalance?.usage.total || 0,
        remaining: currentBalance?.balance.total || 0,
        pending: 0 // TODO: Bekleyen talepleri say
      },
      
      history,
      
      usageAnalysis: {
        byType: usageByType,
        byMonth: usageByMonth,
        averageDuration: requestCount > 0 ? Math.round(totalDuration / requestCount) : 0,
        mostUsedType
      },
      
      projections: {
        estimatedYearEndBalance: currentBalance?.balance.total || 0,
        recommendedUsage: currentBalance && currentBalance.balance.annual > 10 
          ? 'Yıl sonuna kadar izinlerinizi kullanmanız önerilir' 
          : undefined
      }
    };
  } catch (error) {
    console.error('Rapor oluşturma hatası:', error);
    throw error;
  }
}

/**
 * Yıl Sonu İşlemleri
 */
export async function processYearEnd(companyId: string, year: number): Promise<void> {
  try {
    const batch = writeBatch(db);
    
    // Tüm çalışanların o yılki kayıtlarını al
    const q = query(
      collection(db, 'leaveYears'),
      where('companyId', '==', companyId),
      where('year', '==', year),
      where('yearEndProcessed', '==', false)
    );
    
    const snapshot = await getDocs(q);
    const settings = await getCompanyLeaveSettings(companyId);
    
    for (const doc of snapshot.docs) {
      const yearData = doc.data() as ILeaveYear;
      
      // Devreden izin hesapla
      let carryOver = 0;
      if (settings?.automation.autoCarryOver) {
        // Max 10 gün veya kuralda belirtilen miktar
        carryOver = Math.min(yearData.balance.annual, 10);
      }
      
      // Süresi dolan izinler
      const expired = Math.max(0, yearData.balance.annual - carryOver);
      
      batch.update(doc.ref, {
        yearEndProcessed: true,
        carryOverToNextYear: carryOver,
        expiredDays: expired,
        processedAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      
      // İşlem kaydı oluştur
      if (carryOver > 0) {
        const transRef = doc(collection(db, 'leaveTransactions'));
        batch.set(transRef, {
          companyId,
          userId: yearData.userId,
          leaveYearId: doc.id,
          transactionType: 'devir',
          transactionDate: Timestamp.now(),
          leaveType: 'yillik',
          days: carryOver,
          balanceBefore: yearData.balance.annual,
          balanceAfter: 0,
          description: `${year} yılından ${carryOver} gün izin devredildi`,
          createdBy: 'system',
          createdByName: 'Sistem',
          createdAt: Timestamp.now()
        });
      }
      
      if (expired > 0) {
        const expireRef = doc(collection(db, 'leaveTransactions'));
        batch.set(expireRef, {
          companyId,
          userId: yearData.userId,
          leaveYearId: doc.id,
          transactionType: 'sureli_dolma',
          transactionDate: Timestamp.now(),
          leaveType: 'yillik',
          days: -expired,
          balanceBefore: yearData.balance.annual,
          balanceAfter: 0,
          description: `${expired} gün kullanılmayan izin süresi doldu`,
          createdBy: 'system',
          createdByName: 'Sistem',
          createdAt: Timestamp.now()
        });
      }
    }
    
    await batch.commit();
    console.log(`${year} yılı için yıl sonu işlemleri tamamlandı`);
  } catch (error) {
    console.error('Yıl sonu işlemleri hatası:', error);
    throw error;
  }
}

/**
 * Şirket İzin Ayarları
 */
export async function getCompanyLeaveSettings(companyId: string): Promise<ILeaveSettings | null> {
  try {
    const docRef = doc(db, 'leaveSettings', companyId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) return null;
    
    return docSnap.data() as ILeaveSettings;
  } catch (error) {
    console.error('İzin ayarları getirme hatası:', error);
    throw error;
  }
}

export async function updateCompanyLeaveSettings(
  companyId: string,
  settings: Partial<ILeaveSettings>
): Promise<void> {
  try {
    const docRef = doc(db, 'leaveSettings', companyId);
    await setDoc(docRef, {
      ...settings,
      companyId,
      updatedAt: Timestamp.now()
    }, { merge: true });
  } catch (error) {
    console.error('İzin ayarları güncelleme hatası:', error);
    throw error;
  }
}

/**
 * Otomatik İşlemler (Cron job veya scheduled function olarak çalıştırılabilir)
 */
export async function runDailyLeaveJobs(companyId: string): Promise<void> {
  try {
    const settings = await getCompanyLeaveSettings(companyId);
    if (!settings) return;
    
    const today = new Date();
    const currentYear = today.getFullYear();
    
    // 1. Yıl sonu işlemleri (Ocak ayının belirtilen günü)
    if (
      settings.automation.autoCarryOver &&
      today.getMonth() === 0 &&
      today.getDate() === settings.automation.yearEndProcessDay
    ) {
      await processYearEnd(companyId, currentYear - 1);
    }
    
    // 2. Yeni yıl başlatma (işe giriş yıl dönümünde)
    if (settings.leaveYearStart === 'ise_giris') {
      const profiles = await getCompanyEmployeeProfiles(companyId);
      
      for (const profile of profiles) {
        const hireDate = new Date(profile.hireDate);
        if (
          hireDate.getMonth() === today.getMonth() &&
          hireDate.getDate() === today.getDate()
        ) {
          await initializeLeaveYear(profile.userId, companyId, currentYear);
        }
      }
    }
    
    // 3. Kullanılmayan izin hatırlatması
    if (settings.notifications.reminderDays > 0) {
      // TODO: Bildirim gönderme implementasyonu
    }
    
  } catch (error) {
    console.error('Günlük izin işlemleri hatası:', error);
    throw error;
  }
}

async function getCompanyEmployeeProfiles(companyId: string): Promise<IEmployeeLeaveProfile[]> {
  try {
    const q = query(
      collection(db, 'employeeLeaveProfiles'),
      where('companyId', '==', companyId)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as IEmployeeLeaveProfile));
  } catch (error) {
    console.error('Çalışan profilleri getirme hatası:', error);
    throw error;
  }
}
