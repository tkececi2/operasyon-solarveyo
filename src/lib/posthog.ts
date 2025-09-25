/**
 * PostHog Analytics Initialization
 * Kullanıcı davranışlarını takip etmek için
 */

import posthog from 'posthog-js';

// PostHog'u başlat - Geçerli bir API key alana kadar devre dışı
if (typeof window !== 'undefined' && import.meta.env.VITE_POSTHOG_KEY) {
  // PostHog Cloud API Key (ücretsiz hesap açın: app.posthog.com)
  const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_KEY;
  const POSTHOG_HOST = import.meta.env.VITE_POSTHOG_HOST || 'https://eu.i.posthog.com';
  
  // Sadece geçerli bir key varsa başlat
  if (POSTHOG_KEY && POSTHOG_KEY !== 'your_posthog_api_key_here') {
    posthog.init(POSTHOG_KEY, {
      api_host: POSTHOG_HOST,
      // Özellikler
      capture_pageview: true, // Sayfa görüntülemelerini otomatik takip et
      capture_pageleave: true, // Sayfa terk etmeleri takip et
      autocapture: true, // Tüm tıklamaları otomatik takip et
      session_recording: {
        enabled: true, // Session recording (kullanıcı ekran kaydı)
        sample_rate: 0.1, // %10 oranında kaydet (performans için)
      },
      // Privacy
      mask_all_text: false, // Metinleri gizleme
      mask_all_element_attributes: false,
      // Performance
      loaded: (posthog) => {
        // Development'ta debug mode
        if (import.meta.env.DEV) {
          posthog.debug();
        }
      }
    });
  }
}

export default posthog;
