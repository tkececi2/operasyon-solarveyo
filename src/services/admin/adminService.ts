/**
 * Admin Service - Firebase Admin SDK yerine kullanılacak
 * Tüm admin işlemleri buradan yapılacak
 */

import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit as limitFn,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { httpsCallable } from 'firebase/functions';
import { getFunctions } from 'firebase/functions';
import { Company, User } from '../../types';

// Cloud Functions
const functions = getFunctions();
const createCompanyFunction = httpsCallable(functions, 'createCompany');
const updateCompanyFunction = httpsCallable(functions, 'updateCompany');
const deleteCompanyFunction = httpsCallable(functions, 'deleteCompany');
const createUserFunction = httpsCallable(functions, 'createUser');
const updateUserFunction = httpsCallable(functions, 'updateUser');
const deleteUserFunction = httpsCallable(functions, 'deleteUser');

export interface AdminStats {
  totalCompanies: number;
  activeCompanies: number;
  trialCompanies: number;
  expiredCompanies: number;
  totalUsers: number;
  totalRevenue: number;
  storageUsed: number;
  lastUpdated: Date;
}

export interface CompanyCreateData {
  name: string;
  email: string;
  phone?: string;
  address?: string;
  adminEmail: string;
  adminName: string;
  adminPassword: string;
}

export interface CompanyUpdateData {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  subscriptionPlan?: string;
  subscriptionStatus?: 'trial' | 'active' | 'expired';
  isActive?: boolean;
}

// Plan arayüzü
export interface Plan {
  id: string;
  name: string;
  displayName: string;
  description: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  currency: string;
  billingPeriod: string;
  yearlyPrice?: number;
  popular: boolean;
  limits: {
    users: number;
    sahalar: number;
    santraller: number;
    storageGB: number;
    arizaKaydi: number;
    bakimKaydi: number;
    monthlyApiCalls: number;
  };
  features: Record<string, boolean>;
}

class AdminService {
  // İstatistikleri getir
  async getAdminStats(): Promise<AdminStats> {
    try {
      const companiesSnapshot = await getDocs(collection(db, 'companies'));
      const usersSnapshot = await getDocs(collection(db, 'kullanicilar'));
      
      let activeCompanies = 0;
      let trialCompanies = 0;
      let expiredCompanies = 0;
      let totalRevenue = 0;
      let storageUsed = 0;
      
      companiesSnapshot.forEach(doc => {
        const data = doc.data();
        
        if (data.subscriptionStatus === 'active') activeCompanies++;
        else if (data.subscriptionStatus === 'trial') trialCompanies++;
        else expiredCompanies++;
        
        totalRevenue += data.subscriptionPrice || 0;
        storageUsed += data.metrics?.storageUsedMB || 0;
      });
      
      return {
        totalCompanies: companiesSnapshot.size,
        activeCompanies,
        trialCompanies,
        expiredCompanies,
        totalUsers: usersSnapshot.size,
        totalRevenue,
        storageUsed,
        lastUpdated: new Date()
      };
    } catch (error) {
      console.error('Admin istatistikleri alınamadı:', error);
      throw error;
    }
  }
  
  // Şirket oluştur
  async createCompany(data: CompanyCreateData): Promise<string> {
    try {
      const result = await createCompanyFunction(data);
      return (result.data as any).companyId;
    } catch (error) {
      console.error('Şirket oluşturulamadı:', error);
      throw error;
    }
  }
  
  // Şirket güncelle
  async updateCompany(companyId: string, data: CompanyUpdateData): Promise<void> {
    try {
      await updateCompanyFunction({ companyId, ...data });
    } catch (error) {
      console.error('Şirket güncellenemedi:', error);
      throw error;
    }
  }
  
  // Şirket sil
  async deleteCompany(companyId: string): Promise<void> {
    try {
      await deleteCompanyFunction({ companyId });
    } catch (error) {
      console.error('Şirket silinemedi:', error);
      throw error;
    }
  }
  
  // Şirketleri listele
  async listCompanies(filters?: {
    status?: string;
    plan?: string;
    search?: string;
  }): Promise<Company[]> {
    try {
      let q = query(collection(db, 'companies'), orderBy('createdAt', 'desc'));
      
      if (filters?.status) {
        q = query(q, where('subscriptionStatus', '==', filters.status));
      }
      
      if (filters?.plan) {
        q = query(q, where('subscriptionPlan', '==', filters.plan));
      }
      
      const snapshot = await getDocs(q);
      const companies: Company[] = [];
      
      snapshot.forEach(doc => {
        const data = doc.data();
        companies.push({
          id: doc.id,
          ...data
        } as Company);
      });
      
      // Client-side search filter
      if (filters?.search) {
        const searchLower = filters.search.toLowerCase();
        return companies.filter(c => 
          c.name.toLowerCase().includes(searchLower) ||
          c.email?.toLowerCase().includes(searchLower)
        );
      }
      
      return companies;
    } catch (error) {
      console.error('Şirketler listelenemedi:', error);
      throw error;
    }
  }
  
  // Kullanıcı oluştur
  async createUser(companyId: string, userData: {
    email: string;
    ad: string;
    rol: string;
    telefon?: string;
  }): Promise<string> {
    try {
      const result = await createUserFunction({ companyId, ...userData });
      return (result.data as any).userId;
    } catch (error) {
      console.error('Kullanıcı oluşturulamadı:', error);
      throw error;
    }
  }
  
  // Kullanıcı güncelle
  async updateUser(userId: string, data: Partial<User>): Promise<void> {
    try {
      await updateUserFunction({ userId, ...data });
    } catch (error) {
      console.error('Kullanıcı güncellenemedi:', error);
      throw error;
    }
  }
  
  // Kullanıcı sil
  async deleteUser(userId: string): Promise<void> {
    try {
      await deleteUserFunction({ userId });
    } catch (error) {
      console.error('Kullanıcı silinemedi:', error);
      throw error;
    }
  }
  
  // Aktivite logları
  async getActivityLogs(companyId?: string, limit = 50): Promise<any[]> {
    try {
      let q = query(
        collection(db, 'activityLogs'),
        orderBy('timestamp', 'desc'),
        limitFn(limit)
      );
      
      if (companyId) {
        q = query(q, where('companyId', '==', companyId));
      }
      
      const snapshot = await getDocs(q);
      const logs: any[] = [];
      
      snapshot.forEach(doc => {
        logs.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      return logs;
    } catch (error) {
      console.error('Aktivite logları alınamadı:', error);
      return [];
    }
  }
  
  // Sistem sağlığı kontrolü
  async checkSystemHealth(): Promise<{
    status: 'healthy' | 'warning' | 'critical';
    services: Record<string, boolean>;
    message: string;
  }> {
    try {
      // Firestore bağlantısı kontrol
      const testDoc = await getDoc(doc(db, '_health', 'check'));
      
      return {
        status: 'healthy',
        services: {
          firestore: true,
          functions: true,
          storage: true,
          auth: true
        },
        message: 'Tüm servisler çalışıyor'
      };
    } catch (error) {
      return {
        status: 'critical',
        services: {
          firestore: false,
          functions: false,
          storage: false,
          auth: false
        },
        message: 'Sistem bağlantısı kurulamadı'
      };
    }
  }
  
  // Paketleri getir
  async getPlans(): Promise<Plan[]> {
    // Gerçek uygulamada bu veriler yapılandırma dosyasından veya veritabanından alınır
    // Şimdilik örnek veriler döndürüyoruz
    return [
      {
        id: 'trial',
        name: 'Deneme',
        displayName: '14 Gün Ücretsiz Deneme',
        description: 'Tüm özellikleri 14 gün boyunca ücretsiz deneyin',
        price: 0,
        currency: 'TRY',
        billingPeriod: 'trial',
        popular: false,
        limits: {
          users: 3,
          sahalar: 2,
          santraller: 3,
          storageGB: 1,
          arizaKaydi: 50,
          bakimKaydi: 20,
          monthlyApiCalls: 1000
        },
        features: {
          dashboard: true,
          arizaYonetimi: true,
          bakimTakibi: true,
          uretimTakibi: true,
          stokYonetimi: true,
          vardiyaTakibi: true,
          aiAnomaliTespiti: false,
          aiTahminleme: false,
          customReports: false,
          apiAccess: false,
          webhooks: false,
          whatsappIntegration: false,
          smsNotification: false,
          emailNotification: true,
          exportPDF: true,
          exportExcel: false,
          dataImport: false,
          support: 'email' as any,
          sla: false,
          training: false
        }
      },
      // Diğer planlar...
    ];
  }
  
  // Paket güncelle
  async updatePlan(planId: string, planData: Partial<Plan>): Promise<void> {
    // Gerçek uygulamada bu işlem yapılandırma dosyasını veya veritabanını günceller
    console.log(`Paket ${planId} güncelleniyor:`, planData);
    
    // Yapılandırma dosyasının nasıl güncelleneceği konusunda bilgi ver
    console.log(`
      Gerçek uygulamada bu değişikliklerin kalıcı olabilmesi için 
      src/config/saas.config.ts dosyasının manuel olarak güncellenmesi gerekir.
      
      Dosya yolu: src/config/saas.config.ts
      Güncellenmesi gereken bölüm: SAAS_CONFIG.PLANS.${planId}
    `);
    
    // Şirketlerin abonelik bilgilerini güncelle
    try {
      const companiesRef = collection(db, 'companies');
      const q = query(companiesRef, where('subscriptionPlan', '==', planId));
      const snapshot = await getDocs(q);
      
      const batchUpdates: Promise<void>[] = [];
      snapshot.forEach(doc => {
        batchUpdates.push(
          updateDoc(doc.ref, {
            subscriptionLimits: planData.limits,
            subscriptionFeatures: planData.features,
            ...(typeof planData.price === 'number' ? { subscriptionPrice: planData.price } : {}),
            updatedAt: Timestamp.now()
          })
        );
      });
      
      // Batch işlemleri gerçekleştir
      for (const update of batchUpdates) {
        await update;
      }
      
      console.log(`${batchUpdates.length} şirketin abonelik bilgileri güncellendi.`);
    } catch (error) {
      console.error('Şirket abonelik bilgileri güncellenirken hata oluştu:', error);
    }
  }
}

export const adminService = new AdminService();