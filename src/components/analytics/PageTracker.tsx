/**
 * PageTracker Component
 * Sayfa değişikliklerini PostHog'a gönderir
 */

import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { trackPageView } from '../../lib/posthog-events';

export const PageTracker = () => {
  const location = useLocation();

  useEffect(() => {
    // Sayfa değiştiğinde PostHog'a bildir
    const pageName = location.pathname.split('/')[1] || 'home';
    trackPageView(pageName);
  }, [location]);

  return null;
};

export default PageTracker;

