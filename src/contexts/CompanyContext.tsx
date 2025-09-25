import React, { createContext, useContext, useState, useEffect } from 'react';
import { doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Company } from '../types';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';
import { SAAS_CONFIG } from '../config/saas.config';

interface CompanyContextType {
  company: Company | null;
  loading: boolean;
  updateCompany: (data: Partial<Company>) => Promise<void>;
  refreshCompany: () => Promise<void>;
  checkSubscription: () => boolean;
  isFeatureEnabled: (feature: string) => boolean;
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

export const useCompany = () => {
  const context = useContext(CompanyContext);
  if (!context) {
    throw new Error('useCompany must be used within a CompanyProvider');
  }
  return context;
};

export const CompanyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const { userProfile } = useAuth();

  // Şirket bilgilerini getir
  const fetchCompany = async (companyId: string) => {
    try {
      const companyDoc = await getDoc(doc(db, 'companies', companyId));
      if (companyDoc.exists()) {
        const companyData = { id: companyDoc.id, ...companyDoc.data() } as Company;
        
        // Debug: Firebase'den gelen veriyi logla
        console.log('🔥 Firebase Company Data:', {
          id: companyData.id,
          name: companyData.name,
          subscriptionPlan: companyData.subscriptionPlan,
          subscriptionLimits: companyData.subscriptionLimits,
          storageLimit: companyData.subscriptionLimits?.storageLimit,
          storageLimitGB: companyData.subscriptionLimits?.storageLimit ? 
            (companyData.subscriptionLimits.storageLimit / 1024).toFixed(2) + ' GB' : 'N/A'
        });
        
        setCompany(companyData);
        
        // Abonelik durumu kontrolü (14 gün trial standardı)
        if (companyData.subscriptionStatus === 'trial' && companyData.createdAt) {
          const now = Timestamp.now();
          const createdAt = companyData.createdAt;
          const trialDays = (SAAS_CONFIG.PLANS.trial as any)?.duration || 14;

          // Öncelik: trialEndDate alanı
          const trialEnd = (companyData as any).trialEndDate || null;
          let remainingDays = 0;
          if (trialEnd && typeof (trialEnd as any).seconds === 'number') {
            const diffSec = (trialEnd as any).seconds - now.seconds;
            remainingDays = Math.ceil(diffSec / (24 * 60 * 60));
          } else {
            // Fallback: createdAt + 14 gün
            const daysSinceCreation = Math.floor(
              (now.seconds - createdAt.seconds) / (24 * 60 * 60)
            );
            remainingDays = Math.max(0, trialDays - daysSinceCreation);
          }

          if (remainingDays <= 0) {
            // Deneme süresi bitmiş
            await updateDoc(doc(db, 'companies', companyId), {
              subscriptionStatus: 'expired'
            });
            companyData.subscriptionStatus = 'expired';
            setCompany(companyData);
            toast.error('Deneme süreniz sona ermiştir. Lütfen abonelik satın alın.');
          } else if (remainingDays <= 7) {
            toast(`Deneme süreniz ${remainingDays} gün sonra sona erecek.`, { 
              icon: '⚠️',
              style: { background: '#FEF3C7', color: '#92400E' }
            });
          }
        }
        
        return companyData;
      }
      return null;
    } catch (error) {
      console.error('Şirket bilgileri getirilemedi:', error);
      return null;
    }
  };

  // Kullanıcı değiştiğinde şirket bilgilerini getir
  useEffect(() => {
    const loadCompany = async () => {
      if (userProfile?.companyId) {
        try {
          await fetchCompany(userProfile.companyId);
        } catch (error) {
          console.error('Şirket bilgileri getirilemedi:', error);
          toast.error('Şirket bilgileri yüklenemedi.');
        }
      } else {
        setCompany(null);
      }
      setLoading(false);
    };

    loadCompany();
  }, [userProfile]);

  // Şirket bilgilerini güncelle
  const updateCompany = async (data: Partial<Company>) => {
    if (!company) return;

    try {
      // Firebase için undefined değerleri filtrele
      const cleanData: any = {};
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          cleanData[key] = value;
        }
      });

      await updateDoc(doc(db, 'companies', company.id), cleanData);
      setCompany({ ...company, ...data });
      toast.success('Şirket bilgileri güncellendi.');
    } catch (error) {
      console.error('Şirket güncelleme hatası:', error);
      toast.error('Şirket bilgileri güncellenemedi.');
      throw error;
    }
  };

  // Şirket bilgilerini yeniden getir (plan değişikliği sonrası)
  const refreshCompany = async () => {
    if (!userProfile?.companyId) return;
    
    try {
      console.log('🔄 Şirket bilgileri yenileniyor...');
      const updatedCompany = await fetchCompany(userProfile.companyId);
      console.log('✅ Şirket bilgileri yenilendi');
      return updatedCompany;
    } catch (error) {
      console.error('Şirket bilgileri yenilenemedi:', error);
      toast.error('Bilgiler yenilenemedi');
    }
  };

  // Abonelik kontrolü
  const checkSubscription = (): boolean => {
    if (!company) return false;
    
    
    return company.subscriptionStatus === 'active' || company.subscriptionStatus === 'trial';
  };

  // Özellik kontrolü (abonelik seviyesine göre)
  const isFeatureEnabled = (feature: string): boolean => {
    if (!company) return false;
    
    
    // Aktif veya deneme aboneliği yoksa hiçbir özellik kullanılamaz
    if (!checkSubscription()) return false;
    
    // Deneme sürümünde bazı özellikler kısıtlı olabilir
    if (company.subscriptionStatus === 'trial') {
      const restrictedFeatures = [
        'advanced_ai',
        'unlimited_users',
        'custom_reports',
        'api_access'
      ];
      
      if (restrictedFeatures.includes(feature)) {
        return false;
      }
    }
    
    return true;
  };

  const value = {
    company,
    loading,
    updateCompany,
    refreshCompany,
    checkSubscription,
    isFeatureEnabled,
  };

  return <CompanyContext.Provider value={value}>{children}</CompanyContext.Provider>;
};
