/**
 * PostHog Event Tracking
 * Kullanıcı davranışlarını takip etmek için
 */

import posthog from 'posthog-js';

// PostHog null kontrolü ile güvenli event tracking
const safeCapture = (eventName: string, properties?: any) => {
  if (typeof posthog?.capture === 'function') {
    posthog.capture(eventName, properties);
  }
};

// Kritik eventler - Bunları takip etmeliyiz
export const trackEvent = {
  // Kullanıcı aksiyonları
  login: (method: 'email' | 'phone') => {
    safeCapture('user_login', { method });
  },
  
  signup: (plan: string) => {
    safeCapture('user_signup', { plan });
  },
  
  // Arıza yönetimi - En önemli özelliğiniz
  arizaCreated: (data?: { oncelik?: string; santralId?: string }) => {
    safeCapture('ariza_created', data || {});
  },
  
  arizaResolved: (duration: number) => {
    safeCapture('ariza_resolved', { duration_hours: duration });
  },
  
  // Plan limitleri - Para kazanma potansiyeli
  limitReached: (type: 'user' | 'santral' | 'saha') => {
    safeCapture('limit_reached', { limit_type: type });
  },
  
  upgradeClicked: (currentPlan: string, targetPlan: string) => {
    safeCapture('upgrade_clicked', { 
      from_plan: currentPlan, 
      to_plan: targetPlan 
    });
  },
  
  // Feature kullanımı
  featureUsed: (feature: string) => {
    safeCapture('feature_used', { feature_name: feature });
  },
  
  // Hatalar
  errorOccurred: (error: string, page: string) => {
    safeCapture('error_occurred', { 
      error_message: error, 
      page 
    });
  }
};

// Kullanıcı özellikleri (bir kere set edilir)
export const identifyUser = (userId: string, properties: {
  email?: string;
  name?: string;
  company?: string;
  plan?: string;
  role?: string;
}) => {
  if (typeof posthog?.identify === 'function') {
    posthog.identify(userId, properties);
  }
};

// Sayfa görüntüleme
export const trackPageView = (pageName: string) => {
  safeCapture('$pageview', { page: pageName });
};

// Session recording başlat/durdur
export const toggleSessionRecording = (enabled: boolean) => {
  if (typeof posthog?.startSessionRecording === 'function' && typeof posthog?.stopSessionRecording === 'function') {
    if (enabled) {
      posthog.startSessionRecording();
    } else {
      posthog.stopSessionRecording();
    }
  }
};
