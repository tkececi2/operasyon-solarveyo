/**
 * 🔧 Storage Data Validation and Repair Service
 * Identifies and fixes storage calculation inconsistencies
 */

import { collection, getDocs, doc, updateDoc, writeBatch } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { SAAS_CONFIG, getPlanById } from '../config/saas.config';
import { validateStorageLimits, formatStorageSize, STORAGE_DECIMAL_PLACES } from './storageUtils';
import type { Company } from '../types';

export interface StorageValidationResult {
  companyId: string;
  companyName: string;
  planId: string;
  issues: string[];
  suggestions: string[];
  needsUpdate: boolean;
  currentLimits: any;
  correctLimits: any;
}

export interface StorageRepairSummary {
  totalCompanies: number;
  companiesWithIssues: number;
  companiesFixed: number;
  results: StorageValidationResult[];
  errors: string[];
}

/**
 * Batch fix storage limits for all companies with issues
 */
export const fixAllCompaniesStorage = async (): Promise<StorageRepairSummary> => {
  try {
    console.log('🚀 Starting batch storage repair...');
    
    const companiesSnapshot = await getDocs(collection(db, 'companies'));
    const errors: string[] = [];
    let companiesFixed = 0;
    const results: StorageValidationResult[] = [];
    
    // Use batch operations for better performance
    const batch = writeBatch(db);
    
    for (const companyDoc of companiesSnapshot.docs) {
      try {
        const companyData = companyDoc.data() as Company;
        const planId = companyData.subscriptionPlan || 'trial';
        const plan = getPlanById(planId);
        
        if (!plan) {
          console.warn(`Plan not found for company ${companyDoc.id}: ${planId}`);
          continue;
        }
        
        const correctLimits = {
          users: plan.limits.users,
          storage: `${plan.limits.storageGB.toFixed(STORAGE_DECIMAL_PLACES)}GB`,
          storageLimit: plan.limits.storageGB * 1024,
          sahalar: plan.limits.sahalar,
          santraller: plan.limits.santraller,
          arizaKaydi: plan.limits.arizaKaydi,
          bakimKaydi: plan.limits.bakimKaydi
        };
        
        const validation = validateStorageLimits(companyData.subscriptionLimits);
        const needsUpdate = !validation.isValid || 
          JSON.stringify(companyData.subscriptionLimits) !== JSON.stringify(correctLimits);
        
        const result: StorageValidationResult = {
          companyId: companyDoc.id,
          companyName: companyData.name,
          planId,
          issues: validation.issues,
          suggestions: validation.suggestions,
          needsUpdate,
          currentLimits: companyData.subscriptionLimits,
          correctLimits
        };
        
        results.push(result);
        
        if (needsUpdate) {
          const companyRef = doc(db, 'companies', companyDoc.id);
          batch.update(companyRef, {
            subscriptionLimits: correctLimits,
            updatedAt: new Date()
          });
          companiesFixed++;
          console.log(`📝 Queued fix for ${companyData.name}`);
        }
        
      } catch (error) {
        const errorMsg = `Failed to process company ${companyDoc.id}: ${error}`;
        console.error(errorMsg);
        errors.push(errorMsg);
      }
    }
    
    // Commit all changes
    if (companiesFixed > 0) {
      await batch.commit();
      console.log(`✅ Batch repair completed: ${companiesFixed} companies fixed`);
    }
    
    return {
      totalCompanies: results.length,
      companiesWithIssues: results.filter(r => r.needsUpdate).length,
      companiesFixed,
      results,
      errors
    };
    
  } catch (error) {
    console.error('Batch storage repair failed:', error);
    throw error;
  }
};

/**
 * Generate storage repair report
 */
export const generateStorageReport = async (): Promise<void> => {
  try {
    const repairSummary = await fixAllCompaniesStorage();
    const issueCompanies = repairSummary.results.filter(r => r.needsUpdate);
    
    console.log('\n📊 STORAGE VALIDATION REPORT');
    console.log('================================');
    console.log(`Total companies: ${repairSummary.totalCompanies}`);
    console.log(`Companies with issues: ${repairSummary.companiesWithIssues}`);
    console.log(`Companies fixed: ${repairSummary.companiesFixed}`);
    console.log(`Companies OK: ${repairSummary.totalCompanies - repairSummary.companiesWithIssues}`);
    
    if (issueCompanies.length > 0) {
      console.log('\n❌ COMPANIES THAT HAD ISSUES:');
      issueCompanies.forEach(company => {
        console.log(`\n${company.companyName} (${company.planId}):`);
        company.issues.forEach(issue => console.log(`  - ${issue}`));
      });
    } else {
      console.log('\n✅ All companies have correct storage limits!');
    }
    
    if (repairSummary.errors.length > 0) {
      console.log('\n⚠️ ERRORS:');
      repairSummary.errors.forEach(error => console.log(`  - ${error}`));
    }
    
  } catch (error) {
    console.error('Error generating storage report:', error);
  }
};