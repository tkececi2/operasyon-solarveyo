import type { Company } from '../../types';

/**
 * Kalan gün hesabını gün bazında ve saat farklarından etkilenmeden yapar.
 */
export function calculateRemainingDays(endDate: Date | null): number {
  if (!endDate) return 0;
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);
  const dayMs = 1000 * 60 * 60 * 24;
  return Math.max(0, Math.ceil((end.getTime() - start.getTime()) / dayMs));
}

/**
 * Şirket için efektif bitiş tarihini döndürür.
 * Öncelik: nextBillingDate > subscriptionEndDate > trialEndDate
 */
export function getEffectiveEndDate(company: Company): Date | null {
  if (company.subscriptionStatus === 'active') {
    return company.nextBillingDate?.toDate?.() || company.subscriptionEndDate?.toDate?.() || null;
  }
  if (company.subscriptionStatus === 'trial') {
    // Trial ise, trialEndDate yoksa createdAt + 14 gün fallback uygula
    const trial = company.trialEndDate?.toDate?.();
    if (trial) return trial;
    const created = company.createdAt?.toDate?.();
    if (created) {
      const fallback = new Date(created);
      fallback.setDate(fallback.getDate() + 14);
      return fallback;
    }
    return null;
  }
  return null;
}

export function getStatusAndRemaining(company: Company): {
  status: 'trial' | 'active' | 'expired';
  endDate: Date | null;
  daysRemaining: number;
} {
  const endDate = getEffectiveEndDate(company);
  const daysRemaining = calculateRemainingDays(endDate);
  const status: 'trial' | 'active' | 'expired' = daysRemaining > 0
    ? (company.subscriptionStatus === 'trial' ? 'trial' : 'active')
    : 'expired';
  return { status, endDate, daysRemaining };
}


