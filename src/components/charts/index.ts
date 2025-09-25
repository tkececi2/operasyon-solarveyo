import { lazy } from 'react';

// Lazy loaded chart components
export const ProductionChart = lazy(() => import('./ProductionChart').then(m => ({ default: m.ProductionChart })));
export const PerformanceChart = lazy(() => import('./PerformanceChart').then(m => ({ default: m.PerformanceChart })));
export const KPICards = lazy(() => import('./KPICards').then(m => ({ default: m.KPICards })));
export const FaultStatusChart = lazy(() => import('./FaultStatusChart').then(m => ({ default: m.FaultStatusChart })));
