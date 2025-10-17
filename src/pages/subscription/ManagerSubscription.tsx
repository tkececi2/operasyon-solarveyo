import React, { useState, useEffect, useMemo } from 'react';
import {
  CreditCard,
  Clock,
  AlertTriangle,
  CheckCircle,
  Package,
  Calendar,
  DollarSign,
  Users,
  HardDrive,
  Zap,
  Crown,
  ArrowRight
} from 'lucide-react';
import { Card, CardContent, Button, Badge } from '../../components/ui';
import { UpgradeRequestModal } from '../../components/modals/UpgradeRequestModal';
import { useAuth } from '../../hooks/useAuth';
import { useCompany } from '../../hooks/useCompany';
import { useSubscription } from '../../hooks/useSubscription';
// Merkezi SAAS_CONFIG kullanılıyor
import { getPlanById, getActivePlans } from '../../config/saas.config';
import { getMergedPlans, subscribeToMergedPlans } from '../../services/planConfigService';
import { getCompanyStatistics } from '../../services/statisticsService';
import { recalculateStorageForCompany } from '../../services/recalculateStorageService';
import { getStorageMetrics } from '../../services/storageService';
import { toast } from 'react-hot-toast';
import { platform } from '../../utils/platform';
import { Smartphone, Globe } from 'lucide-react';

// SubscriptionPlan interface
interface SubscriptionPlan {
  id: string;
  name: string;
  displayName: string;
  description: string;
  price: number;
  yearlyPrice?: number;
  currency: string;
  billingPeriod: string;
  color: string;
  isActive: boolean;
  sortOrder: number;
  limits: {
    users: number;
    storage: string;
    sahalar: number;
    santraller: number;
    arizaKaydi: number;
    bakimKaydi: number;
  };
  features: {
    aiFeatures: boolean;
    customReports: boolean;
    apiAccess: boolean;
    support: string;
    exportPDF: boolean;
    exportExcel: boolean;
    mobileApp: boolean;
    whatsappIntegration: boolean;
    smsNotification: boolean;
    advancedAnalytics: boolean;
  };
}

const ManagerSubscription: React.FC = () => {
  const { userProfile } = useAuth(); // user yerine userProfile kullan
  const { company } = useCompany();
  const { 
    subscriptionInfo, 
    getRemainingDays, 
    isTrialing, 
    isActive, 
    isExpired,
    hasFeature,
    checkLimit 
  } = useSubscription();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [currentUsage, setCurrentUsage] = useState<any>(null);
  const [realStorageQuota, setRealStorageQuota] = useState<any>(null);
  const [storageLoading, setStorageLoading] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [effectiveStorageLimitMB, setEffectiveStorageLimitMB] = useState<number | null>(null);
  
  // iOS platform kontrolü
  const isIOS = platform.isIOS();

  useEffect(() => {
    loadData();
  }, [company]);

  // Sayfa yüklendiğinde depolama verilerini de yükle
  useEffect(() => {
    if (company && !storageLoading) {
      loadStorageAnalytics();
    }
  }, [company, effectiveStorageLimitMB]);

  // Plan güncellemelerini dinle
  useEffect(() => {
    const unsubscribe = subscribeToMergedPlans((updatedPlans) => {
      const activePlans = Object.values(updatedPlans).filter((p: any) => p.id !== 'trial') as any[];
      
      // Plan verilerini normalize et
      const normalizedPlans = activePlans.map(plan => ({
        id: plan.id,
        name: plan.name,
        displayName: plan.displayName,
        description: plan.description,
        price: plan.price,
        yearlyPrice: (plan as any).yearlyPrice || plan.price * 10,
        currency: plan.currency,
        billingPeriod: 'monthly',
        color: plan.color,
        isActive: true,
        sortOrder: ['trial','starter','professional','enterprise'].indexOf(plan.id),
        limits: {
          users: plan.limits.users,
          storage: `${plan.limits.storageGB}GB`,
          sahalar: plan.limits.sahalar,
          santraller: plan.limits.santraller,
          arizaKaydi: plan.limits.arizaKaydi,
          bakimKaydi: plan.limits.bakimKaydi,
        },
        features: {
          aiFeatures: plan.features.aiAnomaliTespiti || false,
          customReports: plan.features.customReports || false,
          apiAccess: plan.features.apiAccess || false,
          support: plan.features.support || 'email',
          exportPDF: plan.features.exportPDF || true,
          exportExcel: plan.features.exportExcel || true,
          mobileApp: true,
          whatsappIntegration: plan.features.whatsappIntegration || false,
          smsNotification: plan.features.smsNotification || false,
          advancedAnalytics: plan.features.aiTahminleme || false,
        },
      }));
      
      setPlans(normalizedPlans.sort((a, b) => a.sortOrder - b.sortOrder));
    });

    return () => unsubscribe();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Merkezi planları al (Firestore varsa onu kullan)
      const merged = await getMergedPlans();
      const activePlans = Object.values(merged).filter((p: any) => p.id !== 'trial') as any[];
      const usageData = company ? await getCompanyStatistics(company.id) : null;

      // Plan verilerini normalize et - SAAS_CONFIG kullanarak
      const normalizedPlans = activePlans.map(plan => ({
        id: plan.id,
        name: plan.name,
        displayName: plan.displayName,
        description: plan.description,
        price: plan.price, // SAAS_CONFIG'den gelen gerçek fiyat
        yearlyPrice: (plan as any).yearlyPrice || plan.price * 10,
        currency: plan.currency,
        billingPeriod: 'monthly',
        color: plan.color,
        isActive: true,
        sortOrder: ['trial','starter','professional','enterprise'].indexOf(plan.id),
        limits: {
          users: plan.limits.users,
          storage: `${plan.limits.storageGB}GB`,
          sahalar: plan.limits.sahalar,
          santraller: plan.limits.santraller,
          arizaKaydi: plan.limits.arizaKaydi,
          bakimKaydi: plan.limits.bakimKaydi,
        },
        features: {
          aiFeatures: plan.features.aiAnomaliTespiti || false,
          customReports: plan.features.customReports || false,
          apiAccess: plan.features.apiAccess || false,
          support: plan.features.support || 'email',
          exportPDF: plan.features.exportPDF || true,
          exportExcel: plan.features.exportExcel || true,
          mobileApp: true,
          whatsappIntegration: plan.features.whatsappIntegration || false,
          smsNotification: plan.features.smsNotification || false,
          advancedAnalytics: plan.features.aiTahminleme || false,
        },
      }));

      setPlans(normalizedPlans);
      setCurrentUsage(usageData);

      console.log('Planlar SAAS_CONFIG den yuklendi:', normalizedPlans);
      // Etkin depolama limiti: company override > plan limit (remote merged) > 5GB varsayilan
      try {
        const currentPlanId = (company?.subscriptionPlan || 'starter').toLowerCase();
        const planFromMerged: any = (merged as any)[currentPlanId];
        const planStorageMB = planFromMerged?.limits?.storageGB != null ? Number(planFromMerged.limits.storageGB) * 1024 : 5120;
        const effectiveMB = (company?.subscriptionLimits?.storageLimit != null)
          ? Number(company.subscriptionLimits.storageLimit)
          : planStorageMB;
        setEffectiveStorageLimitMB(effectiveMB);
      } catch (e) {
        setEffectiveStorageLimitMB(5120);
      }

      // Depolama analizi sadece ihtiyaç duyulduğunda yapılacak
    } catch (error) {
      console.error('Veri yükleme hatası:', error);
      toast.error('Veriler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  // SuperAdmin plan güncellemelerini canlı dinle ve anında yansıt
  useEffect(() => {
    const unsubscribe = subscribeToMergedPlans((merged) => {
      try {
        const activePlans = Object.values(merged).filter((p: any) => p.id !== 'trial') as any[];
        const normalizedPlans = activePlans.map((plan: any) => ({
          id: plan.id,
          name: plan.name,
          displayName: plan.displayName,
          description: plan.description,
          price: plan.price,
          yearlyPrice: (plan as any).yearlyPrice || plan.price * 10,
          currency: plan.currency,
          billingPeriod: 'monthly',
          color: plan.color,
          isActive: true,
          sortOrder: ['trial','starter','professional','enterprise'].indexOf(plan.id),
          limits: {
            users: plan.limits.users,
            storage: `${plan.limits.storageGB}GB`,
            sahalar: plan.limits.sahalar,
            santraller: plan.limits.santraller,
            arizaKaydi: plan.limits.arizaKaydi,
            bakimKaydi: plan.limits.bakimKaydi,
          },
          features: {
            aiFeatures: plan.features.aiAnomaliTespiti || false,
            customReports: plan.features.customReports || false,
            apiAccess: plan.features.apiAccess || false,
            support: plan.features.support || 'email',
            exportPDF: plan.features.exportPDF || true,
            exportExcel: plan.features.exportExcel || true,
            mobileApp: true,
            whatsappIntegration: plan.features.whatsappIntegration || false,
            smsNotification: plan.features.smsNotification || false,
            advancedAnalytics: plan.features.aiTahminleme || false,
          },
        }));
        setPlans(normalizedPlans);
      } catch (e) {
        console.warn('Plan normalizasyonu hatası:', e);
      }
    });
    return () => unsubscribe();
  }, []);

  // Modern SaaS yaklaşımı: Cached metrics kullan, yoksa hesapla
  const loadStorageAnalytics = async () => {
    if (!company || realStorageQuota || storageLoading) return;
    
    try {
      setStorageLoading(true);
      let storageMetrics = await getStorageMetrics(company.id);
      
      // Eğer metrics yoksa veya 24 saatten eskiyse yeniden hesapla
      const lastCalculated = storageMetrics.lastCalculated;
      const isStale = !lastCalculated || 
        (lastCalculated instanceof Date && 
         (Date.now() - lastCalculated.getTime()) > 24 * 60 * 60 * 1000);
      
      if (!storageMetrics.isCached || isStale || storageMetrics.storageUsedMB === 0) {
        console.log('📊 Depolama verileri yeniden hesaplanıyor...');
        const recalculated = await recalculateStorageForCompany(company.id);
        storageMetrics = {
          storageUsedMB: recalculated.storageUsedMB,
          fileCount: recalculated.fileCount,
          lastCalculated: new Date(),
          breakdown: recalculated.breakdown,
          isCached: true
        };
      }
      
      const storageLimit = (company.subscriptionLimits?.storageLimit ?? effectiveStorageLimitMB ?? 5 * 1024); // MB
      
      const used = storageMetrics.storageUsedMB;
      const percentage = (used / storageLimit) * 100;
      const remainingMB = Math.max(0, storageLimit - used);
      const remainingGB = remainingMB / 1024;

      let status: 'safe' | 'warning' | 'critical' | 'full' = 'safe';
      if (percentage >= 100) status = 'full';
      else if (percentage >= 90) status = 'critical';
      else if (percentage >= 75) status = 'warning';
      
      const quota = {
        used,
        limit: storageLimit,
        percentage: Math.round(percentage * 100) / 100,
        remainingMB: Math.round(remainingMB * 100) / 100,
        remainingGB: Math.round(remainingGB * 100) / 100,
        status,
        isCached: storageMetrics.isCached,
        lastCalculated: storageMetrics.lastCalculated
      };
      
      setRealStorageQuota(quota);
    } catch (error) {
      console.error('Storage metrics yüklenemedi:', error);
    } finally {
      setStorageLoading(false);
    }
  };


  const getSubscriptionStatus = useMemo(() => {
    const days = getRemainingDays();
    
    if (days <= 0) {
      return { status: 'expired', color: 'red', text: 'Süresi Dolmuş' };
    } else if (days < 5) {
      return { status: 'critical', color: 'red', text: `${days} Gün Kaldı` };
    } else if (days === 5) {
      return { status: 'warning', color: 'yellow', text: `${days} Gün Kaldı` };
    } else {
      return { status: 'active', color: 'green', text: `${days} Gün Kaldı` };
    }
  }, [getRemainingDays]);

  const handleUpgrade = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
    setShowRequestModal(true);
  };

  const handleRequestSent = () => {
    toast.success('Yükseltme talebiniz iletildi!');
    loadData();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const subscriptionStatus = getSubscriptionStatus;
  const currentPlanId = (company?.subscriptionPlan || 'starter').toLowerCase();
  const currentPlanName = plans.find(p => p.id === currentPlanId)?.name || currentPlanId;

  // Limit aşıldı uyarısı için hesaplamalar
  const userLimit = (company?.subscriptionLimits?.users as number | undefined);
  const isUserLimitReached =
    userLimit != null && (currentUsage?.kullanicilar?.toplam || 0) >= userLimit;

  const storageLimitGB = ((company?.subscriptionLimits?.storageLimit ?? effectiveStorageLimitMB ?? 5120) as number) / 1024;
  const storageUsedGB = (currentUsage?.depolama?.kullanilan || 0) as number;
  const isStorageLimitReached = storageLimitGB > 0 ? (storageUsedGB / storageLimitGB) * 100 >= 100 : false;

  // Bir üst planı otomatik öner
  const nextPlan: SubscriptionPlan | null = (() => {
    const idx = plans.findIndex(p => p.id === currentPlanId);
    if (idx >= 0 && idx < plans.length - 1) return plans[idx + 1];
    return null;
  })();

  return (
    <div className="space-y-6">
      {/* Başlık */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Abonelik Yönetimi</h1>
          <p className="text-gray-600 mt-1">
            Aboneliğinizi yönetin ve planınızı yükseltin
          </p>
        </div>
      </div>

      {/* Limit aşıldı uyarısı - Enterprise plan'da gösterme */}
      {(isUserLimitReached || isStorageLimitReached) && currentPlanId !== 'enterprise' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center justify-between">
          <div className="text-sm text-yellow-800">
            <span className="font-medium">Limit aşıldı:</span>
            <span className="ml-2">
              {isUserLimitReached ? `Kullanıcı (${currentUsage?.kullanicilar?.toplam}/${userLimit})` : ''}
              {isUserLimitReached && isStorageLimitReached ? ' • ' : ''}
              {isStorageLimitReached ? `Depolama (${(storageUsedGB * 1024).toFixed(0)}/${(storageLimitGB * 1024).toFixed(0)} MB)` : ''}
            </span>
          </div>
          <Button onClick={() => nextPlan ? handleUpgrade(nextPlan) : window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })}>
            Planı Yükselt
          </Button>
        </div>
      )}

      {/* Mevcut Abonelik Durumu */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <Crown className="h-8 w-8 text-blue-600" />
              <div>
                <h2 className="text-xl font-semibold">Mevcut Planınız</h2>
                <p className="text-gray-600">SolarVeyo {currentPlanName} Plan</p>
              </div>
            </div>
            <Badge 
              variant={subscriptionStatus.status === 'active' ? 'success' : 
                      subscriptionStatus.status === 'warning' ? 'warning' : 
                      subscriptionStatus.status === 'lifetime' ? 'secondary' : 'danger'}
            >
              {subscriptionStatus.text}
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Kalan Süre */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Clock className="h-5 w-5 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">Kalan Süre</span>
              </div>
              <div className={`text-2xl font-bold ${
                subscriptionStatus.status === 'critical' ? 'text-red-600' :
                subscriptionStatus.status === 'warning' ? 'text-yellow-600' : 
                subscriptionStatus.status === 'lifetime' ? 'text-purple-600' : 'text-green-600'
              }`}>
                {getRemainingDays() === null ? '∞' : `${getRemainingDays()} gün`}
              </div>
            </div>

            {/* Kullanıcı Sayısı */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Users className="h-5 w-5 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">Kullanıcılar</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {currentUsage?.kullanicilar?.toplam || 0}
                <span className="text-sm text-gray-500 ml-1">
                  / {company?.subscriptionLimits?.users || 10}
                </span>
              </div>
            </div>

            {/* Depolama */}
            <div 
              className="bg-gray-50 rounded-lg p-4 cursor-pointer transition-colors hover:bg-gray-100" 
              onMouseEnter={loadStorageAnalytics}
            >
              <div className="flex items-center space-x-2 mb-2">
                <HardDrive className="h-5 w-5 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">Depolama</span>
                {storageLoading && <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>}
                {(() => {
                  // Yüzde hesaplama - realStorageQuota varsa kullan, yoksa fallback
                  let percentage = 0;
                  let status = 'success';
                  
                  if (realStorageQuota) {
                    percentage = realStorageQuota.percentage;
                    status = realStorageQuota.status;
                  } else {
                    // Fallback calculation
                    const used = currentUsage?.depolama?.kullanilan || 0;
                    const limit = ((company?.subscriptionLimits?.storageLimit ?? effectiveStorageLimitMB ?? 5120) / 1024); // GB
                    percentage = limit > 0 ? (used / limit) * 100 : 0;
                    
                    if (percentage >= 100) status = 'full';
                    else if (percentage >= 90) status = 'critical';
                    else if (percentage >= 75) status = 'warning';
                    else status = 'success';
                  }
                  
                  return (
                    <Badge 
                      variant={
                        status === 'full' ? 'error' :
                        status === 'critical' ? 'danger' :
                        status === 'warning' ? 'warning' : 'success'
                      }
                      className="text-xs"
                    >
                      %{percentage.toFixed(1)}
                    </Badge>
                  );
                })()}
              </div>
              <div className="text-2xl font-bold text-gray-900 flex items-baseline gap-2">
                <span>
                  {realStorageQuota ? 
                    `${realStorageQuota.used.toFixed(0)} MB` :
                    `${((currentUsage?.depolama?.kullanilan || 0) * 1024).toFixed(0)} MB`
                  }
                  <span className="text-sm text-gray-500 ml-1">
                    / {(company?.subscriptionLimits?.storageLimit ?? effectiveStorageLimitMB ?? 5120).toFixed(0)} MB
                  </span>
                </span>
                {/* Inline yüzde göstergesi */}
                <span className="text-sm text-gray-600">
                  {(() => {
                    let percentage = 0;
                    if (realStorageQuota) {
                      percentage = realStorageQuota.percentage;
                    } else {
                      const usedMB = (currentUsage?.depolama?.kullanilan || 0) * 1024;
                      const limitMB = company?.subscriptionLimits?.storageLimit ?? effectiveStorageLimitMB ?? 5120;
                      percentage = limitMB > 0 ? (usedMB / limitMB) * 100 : 0;
                    }
                    return `( %${percentage.toFixed(1)} )`;
                  })()}
                </span>
              </div>
              <div className="mt-2">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  {(() => {
                    let percentage = 0;
                    let status: 'safe' | 'warning' | 'critical' | 'full' = 'safe';
                    let remainingGB = 0;

                    if (realStorageQuota) {
                      percentage = realStorageQuota.percentage;
                      status = realStorageQuota.status;
                      remainingGB = realStorageQuota.remainingGB;
                    } else {
                      const usedGB = currentUsage?.depolama?.kullanilan || 0;
                      const limitGB = ((company?.subscriptionLimits?.storageLimit ?? effectiveStorageLimitMB ?? 5120) / 1024);
                      percentage = limitGB > 0 ? (usedGB / limitGB) * 100 : 0;
                      const remainingMB = Math.max(0, ((company?.subscriptionLimits?.storageLimit ?? effectiveStorageLimitMB ?? 5120) - usedGB * 1024));
                      remainingGB = remainingMB / 1024;
                      if (percentage >= 100) status = 'full';
                      else if (percentage >= 90) status = 'critical';
                      else if (percentage >= 75) status = 'warning';
                      else status = 'safe';
                    }

                    const barColor =
                      status === 'full' ? 'bg-red-500' :
                      status === 'critical' ? 'bg-red-400' :
                      status === 'warning' ? 'bg-yellow-400' : 'bg-green-500';

                    return (
                      <div
                        className={`h-2 rounded-full transition-all ${barColor}`}
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      />
                    );
                  })()}
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>{realStorageQuota ? 'Gerçek Kullanım' : 'Ön Bellekten'}</span>
                  <span>{(() => {
                    if (realStorageQuota) {
                      return `${(realStorageQuota.remainingGB * 1024).toFixed(0)} MB kaldı`;
                    }
                    const usedMB = (currentUsage?.depolama?.kullanilan || 0) * 1024;
                    const limitMB = company?.subscriptionLimits?.storageLimit ?? effectiveStorageLimitMB ?? 5120;
                    const remaining = Math.max(0, limitMB - usedMB);
                    return `${remaining.toFixed(0)} MB kaldı`;
                  })()}</span>
                </div>
              </div>
            </div>

            {/* Aylık Ücret */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <DollarSign className="h-5 w-5 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">Aylık Ücret</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">
                ₺{(company?.subscriptionPrice || 0).toLocaleString()}
              </div>
            </div>
          </div>

          {/* Uyarı Mesajları */}
          {subscriptionStatus.status === 'expired' && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                <div>
                  <h3 className="font-medium text-red-800">Aboneliğiniz Sona Ermiş</h3>
                  <p className="text-sm text-red-700 mt-1">
                    Hizmetlere erişim kısıtlanmıştır. Lütfen aboneliğinizi yenileyin.
                  </p>
                </div>
              </div>
            </div>
          )}

          {subscriptionStatus.status === 'critical' && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                <div>
                  <h3 className="font-medium text-red-800">Aboneliğiniz Yakında Sona Erecek</h3>
                  <p className="text-sm text-red-700 mt-1">
                    Hizmet kesintisi yaşamamak için lütfen aboneliğinizi yenileyin.
                  </p>
                </div>
              </div>
            </div>
          )}

          {subscriptionStatus.status === 'warning' && (
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start space-x-3">
                <Clock className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <h3 className="font-medium text-yellow-800">Abonelik Yenileme Zamanı Yaklaşıyor</h3>
                  <p className="text-sm text-yellow-700 mt-1">
                    Kesintisiz hizmet için aboneliğinizi yenilemeyi unutmayın.
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Plan Seçenekleri */}
      {loading ? (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="flex flex-col items-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
              <p className="text-gray-600">Abonelik planları yükleniyor...</p>
            </div>
          </CardContent>
        </Card>
      ) : plans.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="flex flex-col items-center space-y-4">
              <AlertTriangle className="h-16 w-16 text-yellow-500" />
              <h3 className="text-xl font-semibold text-gray-900">Abonelik Planları Henüz Tanımlanmamış</h3>
              <p className="text-gray-600 max-w-md">
                Sistem yöneticisi henüz abonelik planlarını oluşturmamış. 
                Lütfen sistem yöneticinizle iletişime geçin.
              </p>
              <div className="mt-6 p-4 bg-blue-50 rounded-lg max-w-md">
                <p className="text-sm text-blue-800">
                  <strong>Sistem Yöneticisi için:</strong> SuperAdmin panelinden 
                  "Planlar" sayfasına giderek abonelik planlarını oluşturabilirsiniz.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
        {/* iOS Bilgilendirme Mesajı */}
        {isIOS && (
          <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 mb-6">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="bg-blue-100 dark:bg-blue-900/40 p-3 rounded-full">
                  <Smartphone className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
                    iOS Uygulama Bilgilendirmesi
                  </h3>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mb-4">
                    Apple Store politikaları gereği, abonelik satın alma işlemleri iOS uygulamasında yapılamamaktadır. 
                    Abonelik yönetimi için lütfen web panelimizi kullanın.
                  </p>
                  <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
                    <Globe className="h-4 w-4" />
                    <a 
                      href="https://solarveyo.com" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="font-medium underline hover:no-underline"
                    >
                      Web Paneline Git →
                    </a>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        
        <div id="plans" className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => {
          const isCurrentPlan = plan.id === currentPlanId;
          const isUpgrade = plans.findIndex(p => p.id === currentPlanId) < plans.findIndex(p => p.id === plan.id);
          
          return (
            <Card key={plan.id} className={`relative ${isCurrentPlan ? 'ring-2 ring-blue-500' : ''}`}>
              <CardContent className="p-6">
                {isCurrentPlan && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge variant="success">Mevcut Plan</Badge>
                  </div>
                )}

                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <div className="text-3xl font-bold text-blue-600">
                    ₺{plan.price.toLocaleString()}
                    <span className="text-lg text-gray-500">/ay</span>
                  </div>
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">{plan.limits.users} Kullanıcı</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <HardDrive className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">{plan.limits.storage} Depolama</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Zap className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">Tüm Özellikler</span>
                  </div>
                </div>

                <div className="space-y-2">
                  {isIOS ? (
                    <Button
                      className="w-full"
                      variant="secondary"
                      disabled
                      title="iOS'ta satın alma yapılamaz. Web panelini kullanın."
                    >
                      <Smartphone className="h-4 w-4 mr-2" />
                      Web Panelini Kullanın
                    </Button>
                  ) : (
                    <>
                      {isCurrentPlan ? (
                        <Button
                          onClick={() => handleUpgrade(plan)}
                          className="w-full"
                          variant="secondary"
                        >
                          <Calendar className="h-4 w-4 mr-2" />
                          Aboneliği Yenile
                        </Button>
                      ) : isUpgrade ? (
                        <Button
                          onClick={() => handleUpgrade(plan)}
                          className="w-full"
                        >
                          <ArrowRight className="h-4 w-4 mr-2" />
                          Yükselt
                        </Button>
                      ) : (
                        <Button
                          onClick={() => handleUpgrade(plan)}
                          className="w-full"
                          variant="ghost"
                        >
                          Seç
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
        </div>
        </>
      )}

      {/* Yükseltme Talep Modalı (Banka Havalesi) - iOS'ta gösterme */}
      {!isIOS && selectedPlan && company && (
        <UpgradeRequestModal
          isOpen={showRequestModal}
          onClose={() => setShowRequestModal(false)}
          planId={selectedPlan.id}
          planName={selectedPlan.displayName || selectedPlan.name}
          planPrice={selectedPlan.price}
          companyId={company.id}
          companyName={(company as any).name || company.id}
          currentPlanId={(company.subscriptionPlan || 'starter').toLowerCase()}
          requester={{ id: userProfile?.id || '', name: userProfile?.ad, email: userProfile?.email }}
        />
      )}
    </div>
  );
};

export default ManagerSubscription;
