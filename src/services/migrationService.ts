import { doc, updateDoc, collection, getDocs, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { calculateRealStorageUsage } from './storageAnalyticsService';
import { Company } from '../types';

/**
 * Modern SaaS Migration: Mevcut şirketler için initial storage metrics hesapla
 * Bu one-time işlem sonrası tüm şirketler cached metrics'e sahip olacak
 */

// Tek şirket için initial metrics hesapla ve database'e yaz
export const migrateCompanyStorageMetrics = async (companyId: string): Promise<void> => {
  try {
    console.log(`🔄 Migrating storage metrics for company: ${companyId}`);
    
    // Gerçek depolama kullanımını hesapla
    const storageBreakdown = await calculateRealStorageUsage(companyId);
    
    // Company dokümanını güncelle
    const companyRef = doc(db, 'companies', companyId);
    await updateDoc(companyRef, {
      'metrics.storageUsedMB': storageBreakdown.totalUsed,
      'metrics.fileCount': storageBreakdown.fileCount.total,
      'metrics.lastStorageCalculation': new Date(),
      'metrics.breakdown': storageBreakdown.breakdown
    });
    
    console.log(`✅ Migration completed for ${companyId}:`, {
      totalUsed: `${storageBreakdown.totalUsed.toFixed(2)} MB`,
      fileCount: storageBreakdown.fileCount.total,
      breakdown: storageBreakdown.breakdown
    });
    
  } catch (error) {
    console.error(`❌ Migration failed for ${companyId}:`, error);
    throw error;
  }
};

// Tüm şirketler için migration çalıştır
export const migrateAllCompaniesStorageMetrics = async (): Promise<void> => {
  try {
    console.log('🚀 Starting storage metrics migration for all companies...');
    
    // Tüm şirketleri getir
    const companiesSnap = await getDocs(collection(db, 'companies'));
    const companies = companiesSnap.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() 
    })) as (Company & { id: string })[];
    
    console.log(`📊 Found ${companies.length} companies to migrate`);
    
    // Her şirket için migration çalıştır
    let completed = 0;
    const errors: string[] = [];
    
    for (const company of companies) {
      try {
        // Eğer zaten metrics varsa skip et
        if (company.metrics?.storageUsedMB !== undefined) {
          console.log(`⏭️ Skipping ${company.name} - already has metrics`);
          completed++;
          continue;
        }
        
        await migrateCompanyStorageMetrics(company.id);
        completed++;
        
        // Progress göster
        console.log(`📈 Progress: ${completed}/${companies.length} completed`);
        
        // Rate limiting - Firebase limits için
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`❌ Error migrating ${company.name}:`, error);
        errors.push(`${company.name}: ${error}`);
      }
    }
    
    console.log(`🎉 Migration completed!`);
    console.log(`✅ Successfully migrated: ${completed}/${companies.length} companies`);
    
    if (errors.length > 0) {
      console.log(`❌ Failed migrations: ${errors.length}`);
      errors.forEach(error => console.log(`   ${error}`));
    }
    
  } catch (error) {
    console.error('❌ Migration process failed:', error);
    throw error;
  }
};

// Tek şirket için metrics var mı kontrol et
export const checkCompanyMetrics = async (companyId: string): Promise<boolean> => {
  try {
    const companyDoc = await getDoc(doc(db, 'companies', companyId));
    if (!companyDoc.exists()) return false;
    
    const companyData = companyDoc.data() as Company;
    return companyData.metrics?.storageUsedMB !== undefined;
  } catch (error) {
    console.error('Error checking company metrics:', error);
    return false;
  }
};

// Development için: Mevcut şirketin metrics durumunu göster
export const debugCompanyMetrics = async (companyId: string): Promise<void> => {
  try {
    const companyDoc = await getDoc(doc(db, 'companies', companyId));
    if (!companyDoc.exists()) {
      console.log(`❌ Company not found: ${companyId}`);
      return;
    }
    
    const companyData = companyDoc.data() as Company;
    console.log(`🔍 Debug metrics for company: ${companyData.name}`);
    
    if (companyData.metrics) {
      console.table({
        'Storage Used': `${companyData.metrics.storageUsedMB || 0} MB`,
        'File Count': companyData.metrics.fileCount || 0,
        'Last Calculated': companyData.metrics.lastStorageCalculation?.toDate?.() || 'Never',
        'Has Breakdown': !!companyData.metrics.breakdown
      });
      
      if (companyData.metrics.breakdown) {
        console.log('📂 Storage Breakdown:');
        console.table(companyData.metrics.breakdown);
      }
    } else {
      console.log('❌ No metrics found - migration needed!');
      console.log('💡 Run: migrateCompanyStorageMetrics(companyId)');
    }
    
  } catch (error) {
    console.error('Error debugging company metrics:', error);
  }
};


