import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { SAAS_CONFIG, getPlanById } from '../config/saas.config';
import { Company } from '../types';

// Company verilerini debug et ve düzelt
export const debugAndFixCompanyLimits = async (companyId: string) => {
  try {
    const companyRef = doc(db, 'companies', companyId);
    const companyDoc = await getDoc(companyRef);
    
    if (!companyDoc.exists()) {
      console.error('Company not found:', companyId);
      return;
    }
    
    const company = companyDoc.data() as Company;
    console.log('🔍 Current Company Data:');
    console.log('Company Name:', company.name);
    console.log('Subscription Plan:', company.subscriptionPlan);
    console.log('Subscription Price:', company.subscriptionPrice);
    console.log('Current Limits:', company.subscriptionLimits);
    
    // Storage limit kontrolü
    console.log('\n🔍 Storage Limit Debugging:');
    console.log('storage (string):', company.subscriptionLimits?.storage);
    console.log('storageLimit (MB):', company.subscriptionLimits?.storageLimit);
    
    if (!company.subscriptionLimits?.storageLimit) {
      console.log('⚠️ storageLimit field missing! This is the problem.');
    } else {
      console.log('✅ storageLimit exists:', company.subscriptionLimits.storageLimit, 'MB =', (company.subscriptionLimits.storageLimit / 1024).toFixed(2), 'GB');
    }
    
    // Plan limitleri SAAS_CONFIG'den çek
    const planId = company.subscriptionPlan || 'trial';
    const plan = getPlanById(planId);
    
    if (!plan) {
      console.error(`Plan bulunamadı: ${planId}`);
      return;
    }
    
    const correctLimits = {
      users: plan.limits.users,
      storage: `${plan.limits.storageGB.toFixed(2)}GB`,
      storageLimit: plan.limits.storageGB * 1024, // MB cinsinden
      sahalar: plan.limits.sahalar,
      santraller: plan.limits.santraller,
      arizaKaydi: plan.limits.arizaKaydi,
      bakimKaydi: plan.limits.bakimKaydi
    };
    
    console.log('\n✅ Correct Limits Should Be:');
    console.table(correctLimits);
    
    // Limits yanlışsa veya storageLimit eksikse düzelt
    const needsUpdate = JSON.stringify(company.subscriptionLimits) !== JSON.stringify(correctLimits) ||
      !company.subscriptionLimits?.storageLimit;
    
    if (needsUpdate) {
      await updateDoc(companyRef, {
        subscriptionLimits: correctLimits
      });
      
      console.log('\n🎉 Company limits updated successfully!');
      console.log('From:', company.subscriptionLimits);
      console.log('To:', correctLimits);
    } else {
      console.log('\n✓ Company limits are already correct');
    }
    
    return {
      companyName: company.name,
      plan: company.subscriptionPlan,
      oldLimits: company.subscriptionLimits,
      newLimits: correctLimits,
      updated: needsUpdate
    };
    
  } catch (error) {
    console.error('Error debugging company:', error);
    throw error;
  }
};

// Tüm şirketlerin limitlerini kontrol et ve düzelt
export const fixAllCompanyLimits = async () => {
  console.log('🚀 Starting company limits migration...');
  // Bu fonksiyon gerekirse implement edilebilir
};
