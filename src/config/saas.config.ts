/**
 * SolarVeyo SaaS Platform Yapılandırması
 * Tek doğruluk kaynağı - Tüm abonelik ve plan bilgileri
 */

export const SAAS_CONFIG = {
  // Platform Bilgileri
  PLATFORM: {
    name: 'SolarVeyo',
    version: '2.0.0',
    domain: 'solarveyo.com',
    support_email: 'destek@solarveyo.com',
    support_phone: '+90 850 123 4567'
  },

  // Abonelik Planları - Artık Firebase'den gelecek
  // Varsayılan planlar sadece yapı için, fiyatlar SuperAdmin tarafından belirlenir
  PLANS: {
    // Trial planı sabit kalabilir
    trial: {
      id: 'trial',
      name: 'Deneme',
      displayName: '14 Gün Ücretsiz Deneme',
      description: 'Tüm özellikleri 14 gün boyunca ücretsiz deneyin',
      price: 0,
      currency: 'TRY',
      billingPeriod: 'trial',
      duration: 14, // gün
      color: '#F59E0B',
      icon: '🎯',
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
        // Temel Özellikler
        dashboard: true,
        arizaYonetimi: true,
        bakimTakibi: true,
        uretimTakibi: true,
        stokYonetimi: true,
        vardiyaTakibi: true,
        
        // Gelişmiş Özellikler
        aiAnomaliTespiti: false,
        aiTahminleme: false,
        customReports: false,
        apiAccess: false,
        webhooks: false,
        
        // Entegrasyonlar
        whatsappIntegration: false,
        smsNotification: false,
        emailNotification: true,
        
        // Export/Import
        exportPDF: true,
        exportExcel: false,
        dataImport: false,
        
        // Destek
        support: 'email',
        sla: false,
        training: false
      }
    }
    // Diğer planlar (starter, professional, enterprise) Firebase'den gelecek
    // SuperAdmin tarafından yönetilecek
  },

  // Özellik Açıklamaları
  FEATURE_DESCRIPTIONS: {
    dashboard: 'Gerçek zamanlı kontrol paneli',
    arizaYonetimi: 'Arıza kayıt ve takip sistemi',
    bakimTakibi: 'Periyodik bakım yönetimi',
    uretimTakibi: 'Üretim verileri ve analizleri',
    stokYonetimi: 'Stok ve malzeme takibi',
    vardiyaTakibi: 'Vardiya ve personel yönetimi',
    
    aiAnomaliTespiti: 'Yapay zeka ile anomali tespiti',
    aiTahminleme: 'AI destekli üretim tahmini',
    customReports: 'Özelleştirilebilir raporlar',
    apiAccess: 'REST API erişimi',
    webhooks: 'Webhook entegrasyonları',
    
    whatsappIntegration: 'WhatsApp bildirimleri',
    smsNotification: 'SMS bildirimleri',
    emailNotification: 'E-posta bildirimleri',
    
    exportPDF: 'PDF olarak dışa aktarma',
    exportExcel: 'Excel olarak dışa aktarma',
    dataImport: 'Toplu veri aktarımı',
    
    sso: 'Tek oturum açma (SSO)',
    audit: 'Detaylı denetim kayıtları',
    customIntegration: 'Özel entegrasyonlar',
    whiteLabel: 'White-label çözümü',
    multiTenant: 'Çoklu kiracı desteği'
  },

  // Destek Seviyeleri
  SUPPORT_LEVELS: {
    email: {
      name: 'E-posta Desteği',
      responseTime: '24-48 saat',
      availability: 'Hafta içi 09:00-18:00'
    },
    priority: {
      name: 'Öncelikli Destek',
      responseTime: '4-8 saat',
      availability: '7/24',
      phone: true
    },
    dedicated: {
      name: 'Özel Destek',
      responseTime: '1 saat',
      availability: '7/24',
      phone: true,
      dedicatedManager: true,
      onsite: true
    }
  },

  // Ödeme Seçenekleri
  PAYMENT: {
    methods: ['credit_card', 'bank_transfer', 'wire_transfer'],
    currencies: ['TRY', 'USD', 'EUR'],
    taxRate: 20, // KDV %20
    bankTransfer: {
      bankName: 'SolarVeyo Bank',
      accountName: 'SolarVeyo Teknoloji A.Ş.',
      iban: 'TR00 0000 0000 0000 0000 0000 00',
      instructions: 'Havale/EFT açıklamasına şirket adınızı ve plan adını yazınız.'
    },
    discounts: {
      yearly: 17, // Yıllık ödemede %17 indirim
      biennial: 25, // 2 yıllık ödemede %25 indirim
      referral: 10, // Referans indirimi %10
      nonprofit: 20 // STK indirimi %20
    }
  },

  // Sistem Limitleri
  SYSTEM_LIMITS: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    maxPhotosPerRecord: 10,
    maxExportRows: 10000,
    apiRateLimit: 100, // requests per minute
    sessionTimeout: 30 * 60 * 1000, // 30 dakika
    passwordMinLength: 8,
    trialExtensionDays: 7 // Deneme süresi uzatma limiti
  },

  // Metrikler ve KPI'lar
  METRICS: {
    targetChurnRate: 5, // Hedef churn oranı %5
    targetGrowthRate: 20, // Hedef büyüme oranı %20
    targetNPS: 50, // Hedef NPS skoru
    targetUptime: 99.9, // Hedef uptime %99.9
    targetResponseTime: 200 // Hedef API yanıt süresi (ms)
  },

  // Bildirim Ayarları
  NOTIFICATIONS: {
    trialEnding: [7, 3, 1], // Deneme bitimine X gün kala
    paymentDue: [7, 3, 1], // Ödeme tarihine X gün kala
    usageLimitWarning: [90, 95, 99], // Kullanım limiti %X'e ulaşınca
    systemMaintenance: [7, 1], // Bakıma X gün kala
    newFeature: true, // Yeni özellik bildirimleri
    newsletter: true // Haber bülteni
  }
};

// Helper Fonksiyonlar
export const getPlanById = (planId: string) => {
  return SAAS_CONFIG.PLANS[planId as keyof typeof SAAS_CONFIG.PLANS];
};

export const getActivePlans = () => {
  return Object.values(SAAS_CONFIG.PLANS).filter(plan => plan.id !== 'trial');
};

export const calculateMonthlyRevenue = (planId: string, count: number): number => {
  const plan = getPlanById(planId);
  return plan ? plan.price * count : 0;
};

export const calculateYearlyRevenue = (planId: string, count: number): number => {
  const plan = getPlanById(planId);
  if (!plan) return 0;
  
  const yearlyPrice = (plan as any).yearlyPrice || (plan.price * 12);
  return yearlyPrice * count;
};

export const formatPrice = (price: number, currency = 'TRY'): string => {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(price);
};

export const getPlanFeatures = (planId: string): string[] => {
  const plan = getPlanById(planId);
  if (!plan) return [];
  
  return Object.entries(plan.features)
    .filter(([_, enabled]) => enabled === true)
    .map(([feature]) => SAAS_CONFIG.FEATURE_DESCRIPTIONS[feature as keyof typeof SAAS_CONFIG.FEATURE_DESCRIPTIONS] || feature);
};

export const comparePlans = (planId1: string, planId2: string) => {
  const plan1 = getPlanById(planId1);
  const plan2 = getPlanById(planId2);
  
  if (!plan1 || !plan2) return null;
  
  return {
    priceDiff: plan2.price - plan1.price,
    usersDiff: (plan2.limits.users === -1 ? Infinity : plan2.limits.users) - 
               (plan1.limits.users === -1 ? Infinity : plan1.limits.users),
    features: {
      added: Object.keys(plan2.features).filter(f => 
        plan2.features[f as keyof typeof plan2.features] && 
        !plan1.features[f as keyof typeof plan1.features]
      ),
      removed: Object.keys(plan1.features).filter(f => 
        plan1.features[f as keyof typeof plan1.features] && 
        !plan2.features[f as keyof typeof plan2.features]
      )
    }
  };
};

export default SAAS_CONFIG;
