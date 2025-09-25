/**
 * 🚀 Modern SuperAdmin Service
 * SolarVeyo - Platform Yönetimi
 * 
 * Özellikler:
 * ✅ Şirket yönetimi
 * ✅ Abonelik operasyonları
 * ✅ Platform analytics
 * ✅ Type-safe operations
 * ✅ SAAS_CONFIG entegrasyonu
 */

import { 
  collection, 
  getDocs, 
  doc, 
  getDoc, 
  updateDoc, 
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
  addDoc
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { SAAS_CONFIG, getPlanById } from '../config/saas.config';
import { getMergedPlans } from './planConfigService';
import type { Company } from '../types';
import { deleteCompanyCompletely, getCompanyDeletionSummary } from './companyDeletionService';

// ===== TYPES =====

export interface CompanyStats {
  id: string;
  name: string;
  email: string;
  phone?: string;
  subscriptionStatus: 'trial' | 'active' | 'expired' | 'cancelled' | 'suspended';
  subscriptionPlan: string;
  planDisplayName: string;
  subscriptionPrice: number;
  daysRemaining: number;
  userCount: number;
  sahaCount: number;
  santralCount: number;
  arizaCount: number;
  bakimCount: number;
  storageUsed: number;
  storageLimit: number;
  isActive: boolean;
  createdAt: Date;
  lastActivity?: Date;
  // Detaylı istatistikler
  monthlyStats: {
    arizalar: number;
    bakimlar: number;
    yeniKullanicilar: number;
  };
  users: Array<{
    id: string;
    ad: string;
    email: string;
    rol: string;
    sonGiris?: Date;
  }>;
  sahalar: Array<{
    id: string;
    ad: string;
    musteriAdi?: string;
    santralSayisi: number;
  }>;
}

export interface PlatformStats {
  totalCompanies: number;
  activeCompanies: number;
  trialCompanies: number;
  paidCompanies: number;
  expiredCompanies: number;
  totalRevenue: number;
  monthlyRevenue: number;
  averageRevenuePerUser: number;
  planDistribution: Record<string, number>;
  recentSignups: number;
}

export interface AdminActivityLog {
  id: string;
  adminId: string;
  adminName: string;
  action: string;
  targetCompanyId?: string;
  targetCompanyName?: string;
  details: string;
  timestamp: Date;
}

// ===== MODERN SUPERADMIN SERVICE =====

class ModernSuperAdminService {

  /**
   * Tüm şirketleri istatistiklerle birlikte getir
   */
  async getAllCompaniesWithStats(): Promise<CompanyStats[]> {
    try {
      const companiesSnapshot = await getDocs(collection(db, 'companies'));
      const companies: CompanyStats[] = [];
      
      // Güncel planları al (Firebase'deki güncellemelerle birlikte)
      const mergedPlans = await getMergedPlans();

      for (const companyDoc of companiesSnapshot.docs) {
        const companyData = companyDoc.data() as Company;
        const companyId = companyDoc.id;

        // Plan bilgilerini al
        const planId = companyData.subscriptionPlan || 'trial';
        const plan = mergedPlans[planId] || getPlanById(planId);
        
        // Kalan gün hesapla (gün bazlı, saat farklarını etkisizleştir)
        let daysRemaining = 0;
        const todayMidnight = new Date();
        todayMidnight.setHours(0, 0, 0, 0);

        // Öncelik: nextBillingDate > subscriptionEndDate > trialEndDate
        let effectiveEndDate: Date | null = null;
        if (companyData.nextBillingDate && companyData.subscriptionStatus === 'active') {
          effectiveEndDate = companyData.nextBillingDate.toDate();
        } else if (companyData.subscriptionEndDate && companyData.subscriptionStatus === 'active') {
          effectiveEndDate = companyData.subscriptionEndDate.toDate();
        } else if (companyData.trialEndDate && companyData.subscriptionStatus === 'trial') {
          effectiveEndDate = companyData.trialEndDate.toDate();
        }

        if (effectiveEndDate) {
          const endMidnight = new Date(effectiveEndDate);
          endMidnight.setHours(0, 0, 0, 0);
          const diffTime = endMidnight.getTime() - todayMidnight.getTime();
          const dayMs = 1000 * 60 * 60 * 24;
          daysRemaining = Math.max(0, Math.ceil(diffTime / dayMs));
        }

        // Gerçek verileri çek (paralel)
        const [
          usersSnapshot,
          sahalarSnapshot,
          santrallerSnapshot,
          arizalarSnapshot,
          bakimlarSnapshot
        ] = await Promise.all([
          getDocs(query(collection(db, 'kullanicilar'), where('companyId', '==', companyId))),
          getDocs(query(collection(db, 'sahalar'), where('companyId', '==', companyId))),
          getDocs(query(collection(db, 'santraller'), where('companyId', '==', companyId))),
          getDocs(query(collection(db, 'arizalar'), where('companyId', '==', companyId))),
          getDocs(query(collection(db, 'elektrikBakimlar'), where('companyId', '==', companyId)))
        ]);

        // Kullanıcı listesi
        const users = usersSnapshot.docs.map(doc => {
          const userData = doc.data();
          return {
            id: doc.id,
            ad: userData.ad || 'Bilinmiyor',
            email: userData.email || '',
            rol: userData.rol || 'bilinmiyor',
            sonGiris: userData.lastLogin?.toDate()
          };
        });

        // Saha listesi ve santral sayısı
        const sahalar = await Promise.all(
          sahalarSnapshot.docs.map(async (sahaDoc) => {
            const sahaData = sahaDoc.data();
            // Bu sahaya ait santralleri say
            const sahaId = sahaDoc.id;
            const santrallerOfSaha = santrallerSnapshot.docs.filter(
              santralDoc => santralDoc.data().sahaId === sahaId
            );
            
            return {
              id: sahaDoc.id,
              ad: sahaData.ad || 'Bilinmiyor',
              musteriAdi: sahaData.musteriAdi || 'Atanmamış',
              santralSayisi: santrallerOfSaha.length
            };
          })
        );

        // Bu ayın verilerini filtrele
        const thisMonth = new Date();
        const monthStart = new Date(thisMonth.getFullYear(), thisMonth.getMonth(), 1);
        const monthEnd = new Date(thisMonth.getFullYear(), thisMonth.getMonth() + 1, 0);

        const monthlyArizalar = arizalarSnapshot.docs.filter(doc => {
          const arizaData = doc.data();
          const olusturmaTarihi = arizaData.olusturmaTarihi?.toDate();
          return olusturmaTarihi && olusturmaTarihi >= monthStart && olusturmaTarihi <= monthEnd;
        }).length;

        const monthlyBakimlar = bakimlarSnapshot.docs.filter(doc => {
          const bakimData = doc.data();
          const tarih = bakimData.tarih?.toDate();
          return tarih && tarih >= monthStart && tarih <= monthEnd;
        }).length;

        const monthlyUsers = users.filter(user => {
          return user.sonGiris && user.sonGiris >= monthStart && user.sonGiris <= monthEnd;
        }).length;

        // Kullanım istatistikleri
        const userCount = users.length;
        const sahaCount = sahalar.length;
        const santralCount = santrallerSnapshot.docs.length;
        const arizaCount = arizalarSnapshot.docs.length;
        const bakimCount = bakimlarSnapshot.docs.length;
        const storageUsed = companyData.metrics?.storageUsedMB || 0;
        const storageLimit = plan?.limits.storageGB ? plan.limits.storageGB * 1024 : 500;

        companies.push({
          id: companyId,
          name: companyData.name || 'Bilinmiyor',
          email: companyData.email || '',
          phone: companyData.phone,
          subscriptionStatus: companyData.subscriptionStatus || 'trial',
          subscriptionPlan: planId,
          planDisplayName: plan?.displayName || 'Bilinmiyor',
          subscriptionPrice: plan?.price || 0,
          daysRemaining,
          userCount,
          sahaCount,
          santralCount,
          arizaCount,
          bakimCount,
          storageUsed,
          storageLimit,
          isActive: companyData.isActive !== false,
          createdAt: companyData.createdAt?.toDate() || new Date(),
          lastActivity: (companyData as any).lastActivity?.toDate(),
          monthlyStats: {
            arizalar: monthlyArizalar,
            bakimlar: monthlyBakimlar,
            yeniKullanicilar: monthlyUsers
          },
          users,
          sahalar
        });
      }

      // En son oluşturulanlara göre sırala
      return companies.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    } catch (error) {
      console.error('Şirket istatistikleri alınamadı:', error);
      throw error;
    }
  }

  /**
   * Platform geneli istatistikleri getir
   */
  async getPlatformStats(): Promise<PlatformStats> {
    try {
      const companies = await this.getAllCompaniesWithStats();
      
      const totalCompanies = companies.length;
      const activeCompanies = companies.filter(c => c.isActive).length;
      const trialCompanies = companies.filter(c => c.subscriptionStatus === 'trial').length;
      const paidCompanies = companies.filter(c => c.subscriptionStatus === 'active').length;
      const expiredCompanies = companies.filter(c => c.subscriptionStatus === 'expired').length;
      
      const totalRevenue = companies
        .filter(c => c.subscriptionStatus === 'active')
        .reduce((sum, c) => sum + c.subscriptionPrice, 0);
      
      const monthlyRevenue = totalRevenue; // Bu ay için
      const averageRevenuePerUser = paidCompanies > 0 ? totalRevenue / paidCompanies : 0;
      
      // Plan dağılımı
      const planDistribution: Record<string, number> = {};
      companies.forEach(c => {
        planDistribution[c.subscriptionPlan] = (planDistribution[c.subscriptionPlan] || 0) + 1;
      });
      
      // Son 7 gündeki kayıtlar
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const recentSignups = companies.filter(c => c.createdAt >= sevenDaysAgo).length;

      return {
        totalCompanies,
        activeCompanies,
        trialCompanies,
        paidCompanies,
        expiredCompanies,
        totalRevenue,
        monthlyRevenue,
        averageRevenuePerUser,
        planDistribution,
        recentSignups
      };

    } catch (error) {
      console.error('Platform istatistikleri alınamadı:', error);
      throw error;
    }
  }

  /**
   * Şirket abonelik planını güncelle
   */
  async updateCompanySubscription(
    companyId: string, 
    newPlanId: string,
    adminId: string,
    adminName: string
  ): Promise<void> {
    try {
      // Güncel planları al
      const mergedPlans = await getMergedPlans();
      const plan = mergedPlans[newPlanId] || getPlanById(newPlanId);
      if (!plan) {
        throw new Error(`Geçersiz plan: ${newPlanId}`);
      }

      const now = new Date();
      const endDate = new Date(now);
      endDate.setMonth(endDate.getMonth() + 1); // 1 aylık süre

      await updateDoc(doc(db, 'companies', companyId), {
        subscriptionStatus: newPlanId === 'trial' ? 'trial' : 'active',
        subscriptionPlan: newPlanId,
        subscriptionPrice: plan.price,
        subscriptionStartDate: Timestamp.fromDate(now),
        subscriptionEndDate: Timestamp.fromDate(endDate),
        nextBillingDate: Timestamp.fromDate(endDate),
        // Aktife geçerken deneme tarihi gereksiz hale gelir
        ...(newPlanId !== 'trial' ? { trialEndDate: null as any } : {}),
        subscriptionLimits: {
          users: plan.limits.users,
          storage: `${plan.limits.storageGB.toFixed(2)}GB`,
          storageLimit: plan.limits.storageGB * 1024, // MB cinsinden
          sahalar: plan.limits.sahalar,
          santraller: plan.limits.santraller
        },
        updatedAt: Timestamp.now(),
        lastModifiedBy: adminId
      });

      // Activity log ekle
      await this.logAdminActivity(
        adminId,
        adminName,
        'subscription_update',
        companyId,
        undefined,
        `Plan güncellendi: ${newPlanId} (${plan.displayName})`
      );

      console.log(`✅ Abonelik güncellendi: ${companyId} -> ${newPlanId}`);
    } catch (error) {
      console.error('Abonelik güncelleme hatası:', error);
      throw error;
    }
  }

  /**
   * Şirket durumunu değiştir (aktif/pasif)
   */
  async toggleCompanyStatus(
    companyId: string, 
    isActive: boolean,
    adminId: string,
    adminName: string
  ): Promise<void> {
    try {
      // Mevcut durumu oku ve uygun subscriptionStatus ata
      const ref = doc(db, 'companies', companyId);
      const snap = await getDoc(ref);
      const current = snap.exists() ? (snap.data() as any) : {};
      const nextIsActive = !isActive;
      const nextStatus = nextIsActive
        ? (current.subscriptionStatus === 'suspended' ? 'active' : (current.subscriptionStatus || 'active'))
        : 'suspended';

      await updateDoc(ref, {
        isActive: nextIsActive,
        subscriptionStatus: nextStatus,
        updatedAt: Timestamp.now(),
        lastModifiedBy: adminId
      });

      await this.logAdminActivity(
        adminId,
        adminName,
        'company_status_change',
        companyId,
        undefined,
        `Şirket durumu: ${nextIsActive ? 'Aktif' : 'Pasif'}`
      );

      console.log(`✅ Şirket durumu değiştirildi: ${companyId} -> ${nextIsActive ? 'Aktif' : 'Pasif'}`);
    } catch (error) {
      console.error('Şirket durumu değiştirme hatası:', error);
      throw error;
    }
  }

  /**
   * Şirketi sil
   */
  async deleteCompany(
    companyId: string,
    adminId: string,
    adminName: string
  ): Promise<void> {
    try {
      // Şirket bilgilerini al
      const companyDoc = await getDoc(doc(db, 'companies', companyId));
      const companyName = companyDoc.exists() ? companyDoc.data()?.name : 'Bilinmiyor';

      // 1) Bağlı koleksiyonlar: toplu silme (client tarafında sınırlı ama yeterli)
      const collectionsToDelete = [
        'kullanicilar',
        'sahalar',
        'santraller',
        'arizalar',
        'elektrikBakimlar',
        'mekanikBakimlar',
        'stoklar',
        'stokHareketleri',
        'vardiyaBildirimleri',
        'elektrikKesintileri',
        'notifications',
        'auditLogs'
      ] as const;

      for (const col of collectionsToDelete) {
        const qSnap = await getDocs(query(collection(db, col), where('companyId', '==', companyId)));
        for (const d of qSnap.docs) {
          // santrallerin alt koleksiyonlarını da temizle
          if (col === 'santraller') {
            // aylikUretim (yıllar doküman olarak alt koleksiyon)
            const yearsSnap = await getDocs(collection(db, 'santraller', d.id, 'aylikUretim'));
            for (const yearDoc of yearsSnap.docs) {
              await deleteDoc(doc(db, 'santraller', d.id, 'aylikUretim', yearDoc.id));
            }
            // uretimVerileri
            const uretimSnap = await getDocs(collection(db, 'santraller', d.id, 'uretimVerileri'));
            for (const uDoc of uretimSnap.docs) {
              await deleteDoc(doc(db, 'santraller', d.id, 'uretimVerileri', uDoc.id));
            }
          }
          await deleteDoc(doc(db, col, d.id));
        }
      }

      // En sonda şirket dokümanını sil
      await deleteDoc(doc(db, 'companies', companyId));

      await this.logAdminActivity(
        adminId,
        adminName,
        'company_delete',
        companyId,
        companyName,
        'Şirket silindi'
      );

      console.log(`✅ Şirket silindi: ${companyId}`);
    } catch (error) {
      console.error('Şirket silme hatası:', error);
      throw error;
    }
  }

  /**
   * Ek güvenlikli şirket silme (önerilen)
   * 1) Özet döndür (dry-run)
   * 2) Onay metni şirket adı ile eşleşirse tam silme yap
   */
  async secureDeleteCompany(
    params: {
      companyId: string;
      adminId: string;
      adminName: string;
      confirmCompanyName: string; // tam eşleşme gerekli
    }
  ): Promise<{ summary: any; result: any }>{
    const { companyId, adminId, adminName, confirmCompanyName } = params;
    // 1) Şirket bilgisini oku
    const ref = doc(db, 'companies', companyId);
    const snap = await getDoc(ref);
    if (!snap.exists()) throw new Error('Şirket bulunamadı');
    const name = (snap.data() as any)?.name || companyId;

    // 2) Ek güvenlik: onay metni şirket adıyla birebir eşleşmeli (trim/case-insensitive)
    const norm = (s: string) => String(s || '').trim().toLowerCase();
    if (norm(confirmCompanyName) !== norm(name)) {
      throw new Error('Onay metni şirket adıyla eşleşmiyor');
    }

    // 3) Dry-run özet
    const summary = await getCompanyDeletionSummary(companyId);

    // 4) Tam silme
    const result = await deleteCompanyCompletely(companyId, { userId: adminId, userEmail: '', userName: adminName });

    return { summary, result };
  }

  /**
   * Admin aktivite logu ekle
   */
  private async logAdminActivity(
    adminId: string,
    adminName: string,
    action: string,
    targetCompanyId?: string,
    targetCompanyName?: string,
    details?: string
  ): Promise<void> {
    try {
      await addDoc(collection(db, 'adminActivityLogs'), {
        adminId,
        adminName,
        action,
        targetCompanyId: targetCompanyId || null, // undefined yerine null kullan
        targetCompanyName: targetCompanyName || null, // undefined yerine null kullan
        details: details || null, // undefined yerine null kullan
        timestamp: Timestamp.now()
      });
    } catch (error) {
      console.error('Admin log hatası:', error);
      // Log hatası ana işlemi etkilemesin
    }
  }

  /**
   * Admin aktivite loglarını getir
   */
  async getAdminActivityLogs(limit: number = 50): Promise<AdminActivityLog[]> {
    try {
      const logsQuery = query(
        collection(db, 'adminActivityLogs'),
        orderBy('timestamp', 'desc')
      );
      
      const logsSnapshot = await getDocs(logsQuery);
      const logs: AdminActivityLog[] = [];

      logsSnapshot.docs.slice(0, limit).forEach(doc => {
        const data = doc.data();
        logs.push({
          id: doc.id,
          adminId: data.adminId,
          adminName: data.adminName,
          action: data.action,
          targetCompanyId: data.targetCompanyId,
          targetCompanyName: data.targetCompanyName,
          details: data.details,
          timestamp: data.timestamp.toDate()
        });
      });

      return logs;
    } catch (error) {
      console.error('Admin logları alınamadı:', error);
      throw error;
    }
  }
}

// Singleton instance
export const superAdminService = new ModernSuperAdminService();

// Convenience functions
export const getAllCompaniesWithStats = () => superAdminService.getAllCompaniesWithStats();
export const getPlatformStats = () => superAdminService.getPlatformStats();
export const updateCompanySubscription = (companyId: string, planId: string, adminId: string, adminName: string) => 
  superAdminService.updateCompanySubscription(companyId, planId, adminId, adminName);
export const toggleCompanyStatus = (companyId: string, isActive: boolean, adminId: string, adminName: string) =>
  superAdminService.toggleCompanyStatus(companyId, isActive, adminId, adminName);
export const deleteCompany = (companyId: string, adminId: string, adminName: string) =>
  superAdminService.deleteCompany(companyId, adminId, adminName);
export const getAdminActivityLogs = (limit?: number) => superAdminService.getAdminActivityLogs(limit);
export const secureDeleteCompany = (params: { companyId: string; adminId: string; adminName: string; confirmCompanyName: string; }) =>
  superAdminService.secureDeleteCompany(params);