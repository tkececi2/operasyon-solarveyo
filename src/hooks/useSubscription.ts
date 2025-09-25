import { useState, useEffect } from 'react';
import { useCompany } from './useCompany';
import { getSubscriptionInfo, type SubscriptionInfo } from '../domain/subscription/service';
import { SAAS_CONFIG, getPlanById } from '../config/saas.config';

export const useSubscription = () => {
  const { company } = useCompany();
  const [subscriptionInfo, setSubscriptionInfo] = useState<SubscriptionInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!company?.id) {
      setLoading(false);
      return;
    }

    const loadSubscriptionInfo = async () => {
      try {
        setLoading(true);
        const info = await getSubscriptionInfo(company.id);
        setSubscriptionInfo(info);
      } catch (error) {
        console.error('Abonelik bilgisi yüklenemedi:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSubscriptionInfo();
  }, [company?.id]);

  // Kalan gün hesaplama - tek bir yerden
  const getRemainingDays = (): number => {
    return subscriptionInfo?.daysRemaining || 0;
  };

  // Abonelik durumu kontrolü
  const isTrialing = (): boolean => {
    return subscriptionInfo?.status === 'trial';
  };

  const isActive = (): boolean => {
    return subscriptionInfo?.status === 'active';
  };

  const isExpired = (): boolean => {
    return subscriptionInfo?.isExpired || false;
  };

  // Plan özellikleri kontrolü
  const hasFeature = (feature: string): boolean => {
    if (!subscriptionInfo || subscriptionInfo.isExpired) return false;
    
    const plan = getPlanById(subscriptionInfo.plan);
    if (!plan) return false;
    
    return plan.features[feature as keyof typeof plan.features] === true;
  };

  // Limit kontrolü
  const checkLimit = (resource: string, currentValue: number): {
    allowed: boolean;
    limit: number;
    remaining: number;
  } => {
    if (!subscriptionInfo || subscriptionInfo.isExpired) {
      return { allowed: false, limit: 0, remaining: 0 };
    }
    
    const plan = getPlanById(subscriptionInfo.plan);
    if (!plan) {
      return { allowed: false, limit: 0, remaining: 0 };
    }
    
    const limit = plan.limits[resource as keyof typeof plan.limits] as number || 0;
    const allowed = limit === -1 || currentValue < limit;
    const remaining = limit === -1 ? -1 : Math.max(0, limit - currentValue);
    
    return { allowed, limit, remaining };
  };

  // Uyarı durumu kontrolü
  const getWarningLevel = (): 'none' | 'info' | 'warning' | 'danger' => {
    const days = getRemainingDays();
    
    if (days > 7) return 'none';
    if (days > 3) return 'info';
    if (days > 0) return 'warning';
    return 'danger';
  };

  return {
    subscriptionInfo,
    loading,
    getRemainingDays,
    isTrialing,
    isActive,
    isExpired,
    hasFeature,
    checkLimit,
    getWarningLevel
  };
};

