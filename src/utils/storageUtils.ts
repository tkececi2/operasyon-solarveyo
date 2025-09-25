/**
 * 🗂️ Storage Utilities
 * Centralized storage calculations and formatting for consistent display
 * 
 * Based on project memory: Storage Display Formatting Preference
 * - All storage values should use .toFixed(2) for exactly 2 decimal places
 * - Consistent MB/GB conversions across the application
 */

// Consistent decimal places for all storage displays
export const STORAGE_DECIMAL_PLACES = 2;

/**
 * Convert MB to GB with consistent formatting
 */
export const formatMBtoGB = (mb: number): string => {
  return (mb / 1024).toFixed(STORAGE_DECIMAL_PLACES);
};

/**
 * Convert GB to MB
 */
export const convertGBtoMB = (gb: number): number => {
  return gb * 1024;
};

/**
 * Format storage size with unit (MB or GB)
 */
export const formatStorageSize = (sizeInMB: number, preferGB: boolean = false): string => {
  if (preferGB || sizeInMB >= 1024) {
    return `${formatMBtoGB(sizeInMB)} GB`;
  }
  return `${sizeInMB.toFixed(STORAGE_DECIMAL_PLACES)} MB`;
};

/**
 * Format storage percentage
 */
export const formatStoragePercentage = (percentage: number): string => {
  return `${percentage.toFixed(STORAGE_DECIMAL_PLACES)}%`;
};

/**
 * Calculate storage percentage
 */
export const calculateStoragePercentage = (used: number, limit: number): number => {
  if (limit <= 0) return 0;
  return (used / limit) * 100;
};

/**
 * Get storage status based on usage percentage
 */
export const getStorageStatus = (percentage: number): 'safe' | 'warning' | 'critical' | 'full' => {
  if (percentage >= 100) return 'full';
  if (percentage >= 90) return 'critical';
  if (percentage >= 75) return 'warning';
  return 'safe';
};

/**
 * Format storage display string (used/limit format)
 */
export const formatStorageDisplay = (usedMB: number, limitMB: number): string => {
  const usedGB = formatMBtoGB(usedMB);
  const limitGB = formatMBtoGB(limitMB);
  return `${usedGB} GB / ${limitGB} GB`;
};

/**
 * Calculate remaining storage
 */
export const calculateRemainingStorage = (usedMB: number, limitMB: number): {
  remainingMB: number;
  remainingGB: number;
} => {
  const remainingMB = Math.max(0, limitMB - usedMB);
  return {
    remainingMB: Math.round(remainingMB * 100) / 100,
    remainingGB: Math.round((remainingMB / 1024) * 100) / 100
  };
};

/**
 * Validate storage limit field consistency
 */
export const validateStorageLimits = (subscriptionLimits: any): {
  isValid: boolean;
  issues: string[];
  suggestions: string[];
} => {
  const issues: string[] = [];
  const suggestions: string[] = [];
  
  if (!subscriptionLimits) {
    issues.push('subscriptionLimits is missing');
    suggestions.push('Add subscriptionLimits object to company');
    return { isValid: false, issues, suggestions };
  }
  
  if (!subscriptionLimits.storageLimit) {
    issues.push('storageLimit field is missing');
    suggestions.push('Add storageLimit field (in MB) to subscriptionLimits');
  }
  
  if (subscriptionLimits.storage && subscriptionLimits.storageLimit) {
    // Check if string storage and numeric storageLimit are consistent
    const storageString = subscriptionLimits.storage;
    const storageLimitMB = subscriptionLimits.storageLimit;
    
    let expectedMB = 0;
    if (storageString.includes('GB')) {
      const gbValue = parseFloat(storageString.replace('GB', ''));
      expectedMB = gbValue * 1024;
    } else if (storageString.includes('MB')) {
      expectedMB = parseFloat(storageString.replace('MB', ''));
    }
    
    const difference = Math.abs(expectedMB - storageLimitMB);
    if (difference > 1) { // Allow 1MB tolerance
      issues.push(`Storage mismatch: ${storageString} != ${storageLimitMB}MB`);
      suggestions.push(`Update to consistent values: ${formatStorageSize(storageLimitMB, true)} and ${storageLimitMB}MB`);
    }
  }
  
  return {
    isValid: issues.length === 0,
    issues,
    suggestions
  };
};

/**
 * Get plan storage limits from SAAS_CONFIG
 */
export const getPlanStorageInfo = (planId: string) => {
  // This would need to import SAAS_CONFIG, but avoiding circular imports
  // Instead, accept it as parameter when needed
  const commonPlanLimits: Record<string, { storageGB: number }> = {
    trial: { storageGB: 0.5 }, // 500MB
    starter: { storageGB: 5 },
    professional: { storageGB: 50 },
    enterprise: { storageGB: 500 }
  };
  
  const planInfo = commonPlanLimits[planId];
  if (!planInfo) {
    return null;
  }
  
  return {
    storageGB: planInfo.storageGB,
    storageMB: planInfo.storageGB * 1024,
    displayString: formatStorageSize(planInfo.storageGB * 1024, true)
  };
};