import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import type { Company } from '../../types';
import { SAAS_CONFIG, getPlanById } from '../../config/saas.config';
import { calculateRemainingDays, getEffectiveEndDate } from './calc';

export interface SubscriptionInfo {
  plan: string;
  planName: string;
  status: 'trial' | 'active' | 'expired';
  daysRemaining: number;
  monthlyPrice: number;
  endDate: Date | null;
  canUpgrade: boolean;
  isExpired: boolean;
}

export async function getSubscriptionInfo(companyId: string): Promise<SubscriptionInfo> {
  const companyDoc = await getDoc(doc(db, 'companies', companyId));
  if (!companyDoc.exists()) {
    throw new Error('Şirket bulunamadı');
  }

  const company = companyDoc.data() as Company;
  const planId = company.subscriptionPlan || 'trial';
  const plan = getPlanById(planId);

  const endDate = getEffectiveEndDate(company);
  const daysRemaining = calculateRemainingDays(endDate);
  const status: 'trial' | 'active' | 'expired' = daysRemaining > 0
    ? (company.subscriptionStatus === 'trial' ? 'trial' : 'active')
    : 'expired';

  return {
    plan: planId,
    planName: plan?.displayName || planId,
    status,
    daysRemaining,
    monthlyPrice: plan?.price || 0,
    endDate,
    canUpgrade: planId === 'trial' || planId === 'starter',
    isExpired: daysRemaining <= 0,
  };
}

export async function checkUsageLimit(
  companyId: string,
  resource: keyof typeof SAAS_CONFIG.PLANS.basic.limits | 'users' | 'sahalar' | 'santraller',
  currentValue: number
): Promise<{ allowed: boolean; limit: number; remaining: number }>
{
  const companyDoc = await getDoc(doc(db, 'companies', companyId));
  if (!companyDoc.exists()) {
    return { allowed: false, limit: 0, remaining: 0 };
  }
  const company = companyDoc.data() as Company;
  // Öncelik: şirket özel limitleri (subscriptionLimits), yoksa plan limiti
  const companyOverride = (company as any)?.subscriptionLimits?.[resource as string] as number | undefined;
  const plan = getPlanById((company.subscriptionPlan || 'trial').toLowerCase());
  const planLimit = plan?.limits[resource as keyof typeof plan.limits] as number | undefined;
  const limit = typeof companyOverride === 'number' ? companyOverride : planLimit;
  const numericLimit = typeof limit === 'number' ? limit : 0;
  const allowed = numericLimit === -1 || currentValue < numericLimit;
  const remaining = numericLimit === -1 ? -1 : Math.max(0, numericLimit - currentValue);
  return { allowed, limit: numericLimit, remaining };
}


