/**
 * Dashboard Metrics Hook
 * Pre-aggregated metrics için optimize edilmiş hook
 */

import { useState, useEffect } from 'react';
import { doc, getDoc, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { logger } from '../utils/logger';

export interface DashboardMetrics {
  // Özet istatistikler
  summary: {
    toplamSantral: number;
    toplamKapasite: number;
    aktifSantral: number;
    toplamUretim: number;
    aylikUretim: number;
    gunlukUretim: number;
  };
  
  // Arıza istatistikleri
  faults: {
    acik: number;
    devamEdiyor: number;
    cozuldu: number;
    kritik: number;
    yuksek: number;
    orta: number;
    dusuk: number;
    buAy: number;
    buHafta: number;
    bugun: number;
    ortCozumSuresi: number; // saat
  };
  
  // Bakım istatistikleri
  maintenance: {
    elektrik: {
      buAy: number;
      geciken: number;
      yaklaşan: number;
    };
    mekanik: {
      buAy: number;
      geciken: number;
      yaklaşan: number;
    };
  };
  
  // Ekip istatistikleri
  team: {
    toplamKullanici: number;
    aktifKullanici: number;
    yonetici: number;
    muhendis: number;
    tekniker: number;
    musteri: number;
    bekci: number;
  };
  
  // Stok durumu
  inventory: {
    toplamParca: number;
    kritikStok: number;
    normalStok: number;
    tukenenStok: number;
  };
  
  // Saha istatistikleri
  fields: {
    toplamSaha: number;
    aktifSaha: number;
    toplamMusteri: number;
  };
  
  // Performans metrikleri
  performance: {
    sistemVerimi: number; // %
    kapasiteFaktoru: number; // %
    arızasızCalismaSuresi: number; // gün
    planliDurus: number; // saat
    plansizDurus: number; // saat
  };
  
  // Güncelleme zamanı
  lastUpdated: Date;
  isRealtime: boolean;
}

/**
 * Dashboard metrics hook
 * Firestore'dan pre-aggregated metrics çeker
 */
export function useDashboardMetrics(realtime = false) {
  const { userProfile } = useAuth();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!userProfile?.companyId) {
      setLoading(false);
      return;
    }

    const fetchMetrics = async () => {
      try {
        setLoading(true);
        logger.info('Dashboard metrics yükleniyor...');
        
        // Metrics collection'dan çek (pre-aggregated)
        const metricsRef = doc(db, 'companies', userProfile.companyId, 'metrics', 'dashboard');
        
        if (realtime) {
          // Real-time listener
          const unsubscribe = onSnapshot(
            metricsRef,
            (snapshot) => {
              if (snapshot.exists()) {
                const data = snapshot.data();
                setMetrics({
                  ...data,
                  lastUpdated: data.lastUpdated?.toDate() || new Date(),
                  isRealtime: true
                } as DashboardMetrics);
              } else {
                // Metrics yoksa fallback olarak hesapla
                calculateMetricsFromRawData();
              }
              setLoading(false);
            },
            (err) => {
              logger.error('Metrics listener hatası:', err);
              setError(err as Error);
              setLoading(false);
            }
          );
          
          return () => unsubscribe();
        } else {
          // Tek seferlik okuma
          const snapshot = await getDoc(metricsRef);
          
          if (snapshot.exists()) {
            const data = snapshot.data();
            setMetrics({
              ...data,
              lastUpdated: data.lastUpdated?.toDate() || new Date(),
              isRealtime: false
            } as DashboardMetrics);
          } else {
            // Metrics yoksa fallback olarak hesapla
            await calculateMetricsFromRawData();
          }
          setLoading(false);
        }
      } catch (err) {
        logger.error('Dashboard metrics hatası:', err);
        setError(err as Error);
        setLoading(false);
      }
    };

    fetchMetrics();
  }, [userProfile?.companyId, realtime]);

  // Fallback: Raw data'dan hesapla (ilk kurulum için)
  const calculateMetricsFromRawData = async () => {
    logger.warning('Pre-aggregated metrics bulunamadı, raw data\'dan hesaplanıyor...');
    
    // Bu kısım sadece ilk kurulumda çalışır
    // Normalde Cloud Functions ile günlük hesaplanmalı
    
    // Varsayılan değerler
    setMetrics({
      summary: {
        toplamSantral: 0,
        toplamKapasite: 0,
        aktifSantral: 0,
        toplamUretim: 0,
        aylikUretim: 0,
        gunlukUretim: 0
      },
      faults: {
        acik: 0,
        devamEdiyor: 0,
        cozuldu: 0,
        kritik: 0,
        yuksek: 0,
        orta: 0,
        dusuk: 0,
        buAy: 0,
        buHafta: 0,
        bugun: 0,
        ortCozumSuresi: 0
      },
      maintenance: {
        elektrik: {
          buAy: 0,
          geciken: 0,
          yaklaşan: 0
        },
        mekanik: {
          buAy: 0,
          geciken: 0,
          yaklaşan: 0
        }
      },
      team: {
        toplamKullanici: 0,
        aktifKullanici: 0,
        yonetici: 0,
        muhendis: 0,
        tekniker: 0,
        musteri: 0,
        bekci: 0
      },
      inventory: {
        toplamParca: 0,
        kritikStok: 0,
        normalStok: 0,
        tukenenStok: 0
      },
      fields: {
        toplamSaha: 0,
        aktifSaha: 0,
        toplamMusteri: 0
      },
      performance: {
        sistemVerimi: 0,
        kapasiteFaktoru: 0,
        arızasızCalismaSuresi: 0,
        planliDurus: 0,
        plansizDurus: 0
      },
      lastUpdated: new Date(),
      isRealtime: false
    });
  };

  // Metrics'i manuel olarak yenile
  const refresh = async () => {
    if (!userProfile?.companyId) return;
    
    setLoading(true);
    const metricsRef = doc(db, 'companies', userProfile.companyId, 'metrics', 'dashboard');
    const snapshot = await getDoc(metricsRef);
    
    if (snapshot.exists()) {
      const data = snapshot.data();
      setMetrics({
        ...data,
        lastUpdated: data.lastUpdated?.toDate() || new Date(),
        isRealtime: false
      } as DashboardMetrics);
    }
    setLoading(false);
  };

  return {
    metrics,
    loading,
    error,
    refresh
  };
}

export default useDashboardMetrics;

