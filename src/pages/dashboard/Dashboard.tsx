import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useCompany } from '../../contexts/CompanyContext';
import { useNavigate } from 'react-router-dom';
import { Button, Card, CardContent, CardHeader, CardTitle, LoadingSpinner, SubscriptionStatusWidget, StorageWarningWidget, PullToRefresh } from '../../components/ui';
import { KPICards, FaultStatusChart } from '../../components/charts';
import { CompactWeatherWidget } from '../../components/weather/CompactWeatherWidget';
import { RecentItemsWidget } from '../../components/dashboard/RecentItemsWidget';
import { arizaService, bakimService } from '../../services';
import { notificationService, Notification } from '../../services/notificationService';
import { getGoogleMapsApiKey, generateGoogleMapsUrls } from '../../utils/googleMaps';
import MiniClusterMap from '../../components/maps/MiniClusterMap';
import { formatNumber } from '../../utils/formatters';
import { getAllEkipUyeleri } from '../../services/ekipService';
import { getAllVardiyaBildirimleri } from '../../services/vardiyaService';
import { getAllMusteriler } from '../../services/musteriService';
import { getAllSahalar } from '../../services/sahaService';
import { getAllSantraller } from '../../services/santralService';
import { getAllStoklar } from '../../services/stokService';
import { checkSubscriptionStatus, getLastNotificationDate } from '../../services/subscriptionNotificationService';
import toast from 'react-hot-toast';
import {
  Sun,
  AlertTriangle,
  Wrench,
  Users,
  TrendingUp,
  Battery,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Building2,
  Map
} from 'lucide-react';
// Removed unused import - SUBSCRIPTION_PLANS not used in this component
import { useSubscription } from '../../hooks/useSubscription';
import { collection, onSnapshot, where, query as fsQuery, Timestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';

const Dashboard: React.FC = () => {
  const { userProfile } = useAuth();
  const { company } = useCompany();
  const navigate = useNavigate();
  const { subscriptionInfo, getRemainingDays, isExpired } = useSubscription();
  
  const [loading, setLoading] = useState(true);
  const [dashboardStats, setDashboardStats] = useState({
    // Bu Ay Özeti
    aylikArizalar: 0,
    aylikBakimlar: 0,
    aylikVardiya: 0,
    aktifStokUyarilari: 0,
    // Genel İstatistikler
    toplamSahalar: 0,
    toplamSantraller: 0,
    toplamEkipUyeleri: 0,
    toplamMusteriler: 0,
    buAyBakimSayisi: 0
  });
  
  const [chartData, setChartData] = useState<{
    faultStatusData: Array<{name: string, value: number, color: string}>;
  }>({
    faultStatusData: []
  });
  const [sahalarList, setSahalarList] = useState<any[]>([]);
  const [santrallerList, setSantrallerList] = useState<any[]>([]);
  const [liveNotifications, setLiveNotifications] = useState<Notification[]>([]);
  const [mapType, setMapType] = useState<'roadmap'|'satellite'|'terrain'|'hybrid'>('terrain');
  const [mapHeight, setMapHeight] = useState<number>(320);

  // Gerçek zamanlı güncellemeler için yerel doküman listeleri
  const [elektrikBakimDocs, setElektrikBakimDocs] = useState<any[]>([]);
  const [mekanikBakimDocs, setMekanikBakimDocs] = useState<any[]>([]);
  const [vardiyaDocs, setVardiyaDocs] = useState<any[]>([]);

  // Saha durum haritası: herhangi bir santrali arızalı ise 'ariza', aksi halde bakımda ise 'bakim', değilse 'normal'
  const sahaStatusMap = useMemo(() => {
    const map: Record<string, 'normal' | 'bakim' | 'ariza'> = {};
    (santrallerList || []).forEach((santral: any) => {
      const id = santral.sahaId;
      if (!id) return;
      const current = map[id];
      if (santral.durum === 'ariza') {
        map[id] = 'ariza';
        return; // En yüksek öncelik
      }
      if (santral.durum === 'bakim') {
        // Yalnızca daha önce arıza atanmamışsa bakım olarak işaretle
        map[id] = current === 'ariza' ? 'ariza' : 'bakim';
        return;
      }
      // Varsayılan normal; yalnız daha önce bir durum atanmadıysa yaz
      if (!current) map[id] = 'normal';
    });
    return map;
  }, [santrallerList]);

  // Dashboard verilerini getir
  const fetchDashboardData = async () => {
    if (!userProfile?.companyId) return;
    
    try {
      setLoading(true);
      
      // Bu ayın başlangıcı ve bir sonraki ayın başlangıcı (ay sonu için < nextMonthStart kullan)
      const now = new Date();
      const ayBaslangic = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      const sonrakiAyBaslangic = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0, 0);

      // Güvenli tarih dönüştürücü (Timestamp | string | Date -> Date | null)
      const toDateSafe = (input: any): Date | null => {
        if (!input) return null;
        try {
          if (typeof input?.toDate === 'function') {
            const d = input.toDate();
            return isNaN(d.getTime()) ? null : d;
          }
          const d = new Date(input);
          return isNaN(d.getTime()) ? null : d;
        } catch {
          return null;
        }
      };

      const isInCurrentMonth = (d: Date | null) => !!d && d >= ayBaslangic && d < sonrakiAyBaslangic;

      // Paralel veri çekme (aylık aktiviteler için)
      let faultData: any, maintenanceStats: any, sahalarData: any[], santrallerData: any[], ekipData: any[], musteriData: any[], stokData: any[], vardiyaData: any[] = [];
      
      // Tüm roller için rol+atama bilgileriyle veri çek (merkezileştirilmiş görünürlük)
      const [faultsResp, sahalarDataResp, santrallerDataResp, stokDataResp, vardiyaDataResp, elektrikBakimlar, mekanikBakimlar, yapilanIsler, ekipDataResp, musteriDataResp] = await Promise.all([
        arizaService.getFaults({ 
          companyId: userProfile.companyId,
          userRole: userProfile.rol,
          userSahalar: userProfile.sahalar as any,
          userSantraller: userProfile.santraller as any,
          userId: userProfile.id,
          pageSize: 50 // Dashboard için son 50 arızayı göster
        }),
        getAllSahalar(userProfile.companyId, userProfile.rol, userProfile.sahalar as any),
        getAllSantraller(userProfile.companyId, userProfile.rol, userProfile.santraller as any),
        getAllStoklar(userProfile.companyId, userProfile.rol, userProfile.sahalar as any, userProfile.santraller as any),
        getAllVardiyaBildirimleri(userProfile.companyId),
        bakimService.getElectricalMaintenances(userProfile.companyId, undefined, undefined, userProfile.rol, userProfile.santraller as any, userProfile.sahalar as any),
        bakimService.getMechanicalMaintenances(userProfile.companyId, undefined, undefined, userProfile.rol, userProfile.santraller as any, userProfile.sahalar as any),
        bakimService.getYapilanIsler(userProfile.companyId, undefined, undefined, userProfile.rol, userProfile.santraller as any, userProfile.sahalar as any),
        getAllEkipUyeleri(userProfile.companyId),
        getAllMusteriler(userProfile.companyId)
      ]);

      faultData = faultsResp;
      sahalarData = sahalarDataResp;
      santrallerData = santrallerDataResp;
      stokData = stokDataResp;
      // Vardiya kayıtlarını da atama bazlı filtrele (saha/santral)
      const allowedSahalar = Array.isArray(userProfile.sahalar) ? userProfile.sahalar as string[] : [];
      const allowedSantraller = Array.isArray(userProfile.santraller) ? userProfile.santraller as string[] : [];
      vardiyaData = (vardiyaDataResp || []).filter((v: any) => {
        if (userProfile.rol === 'yonetici' || userProfile.rol === 'superadmin') return true;
        const sahaMatch = v.sahaId ? allowedSahalar.includes(v.sahaId) : false;
        const santralMatch = v.santralId ? allowedSantraller.includes(v.santralId) : false;
        return sahaMatch || santralMatch;
      });

      // Bu ayın bakımlarını filtrele (tarih yoksa olusturmaTarihi'ne düş)
      const elektrikBakimlarBuAy = elektrikBakimlar.filter((bakim: any) => {
        const bakimTarihi = toDateSafe(bakim.tarih) || toDateSafe(bakim.olusturmaTarihi);
        return isInCurrentMonth(bakimTarihi);
      });
      const mekanikBakimlarBuAy = mekanikBakimlar.filter((bakim: any) => {
        const bakimTarihi = toDateSafe(bakim.tarih) || toDateSafe(bakim.olusturmaTarihi);
        return isInCurrentMonth(bakimTarihi);
      });
      const yapilanIslerBuAy = yapilanIsler.filter((is: any) => {
        const isTarihi = toDateSafe(is.tarih) || toDateSafe(is.olusturmaTarihi);
        return isInCurrentMonth(isTarihi);
      });

      // Not: Dashboard'da "Bakımlar" yalnız elektrik+mekanik toplamıdır (yapılan işler dahil edilmez)
      maintenanceStats = {
        toplamBakim: elektrikBakimlarBuAy.length + mekanikBakimlarBuAy.length,
        elektrikBakim: elektrikBakimlarBuAy.length,
        mekanikBakim: mekanikBakimlarBuAy.length,
        yapilanIs: yapilanIslerBuAy.length
      };

      ekipData = ekipDataResp;
      musteriData = musteriDataResp;
      
      // Bu ayın arızalarını filtrele
      const aylikArizalar = faultData.faults.filter((ariza: any) => {
        const arizaTarihi = ariza.olusturmaTarihi.toDate ? ariza.olusturmaTarihi.toDate() : new Date(ariza.olusturmaTarihi);
        return arizaTarihi >= ayBaslangic && arizaTarihi < sonrakiAyBaslangic;
      }).length;

      // Bu ayın vardiya bildirimlerini filtrele
      let aylikVardiyaBildirimleri = 0;
      try {
        aylikVardiyaBildirimleri = (vardiyaData || []).filter((vardiya: any) => {
          if (!vardiya) return false;
          const vardiyaTarihi = toDateSafe(vardiya.tarih) || toDateSafe(vardiya.olusturmaTarihi);
          return isInCurrentMonth(vardiyaTarihi);
        }).length;
      } catch (e) {
        console.error('Vardiya filtreleme hatası:', e);
        aylikVardiyaBildirimleri = 0;
      }
      
      // Debug - Toplam vardiya sayısı
      console.log('📊 Dashboard Vardiya Debug:', {
        toplam: vardiyaData.length,
        buAy: aylikVardiyaBildirimleri,
        ayBaslangic: ayBaslangic.toISOString(),
        sonrakiAy: sonrakiAyBaslangic.toISOString(),
        ilkVardiya: vardiyaData[0] ? {
          tarih: vardiyaData[0].tarih?.toDate ? vardiyaData[0].tarih.toDate().toISOString() : vardiyaData[0].tarih,
          olusturmaTarihi: vardiyaData[0].olusturmaTarihi?.toDate ? vardiyaData[0].olusturmaTarihi.toDate().toISOString() : vardiyaData[0].olusturmaTarihi
        } : 'YOK'
      });

      // Kritik stok uyarıları - mevcutStok <= minimumStok kontrolü
      let kritikStokUyarilari = 0;
      try {
        kritikStokUyarilari = (stokData || []).filter((stok: any) => {
          if (!stok) return false;
          const mevcutStok = Number(stok.mevcutStok ?? stok.miktar ?? 0);
          const minRaw = (stok.minimumStok ?? stok.minimumStokSeviyesi);
          const minimumStok = minRaw === undefined || minRaw === null ? null : Number(minRaw);
          if (minimumStok === null || !isFinite(minimumStok) || minimumStok <= 0) return false; // Minimum değeri olmayanları sayma
          return mevcutStok <= minimumStok;
        }).length;
        
        // Debug - Stok durumları
        console.log('📦 Dashboard Stok Debug:', {
          toplam: stokData.length,
          kritik: kritikStokUyarilari,
          ilkStok: stokData[0] ? {
            ad: stokData[0].malzemeAdi,
            mevcut: stokData[0].mevcutStok ?? stokData[0].miktar,
            minimum: stokData[0].minimumStok ?? stokData[0].minimumStokSeviyesi
          } : 'YOK'
        });
      } catch (e) {
        console.error('Stok filtreleme hatası:', e);
        kritikStokUyarilari = 0;
      }
      
      // Dashboard istatistiklerini güncelle
      const musteriSayisiFromRole = (ekipDataResp || []).filter((u:any) => u.rol === 'musteri').length;
      setDashboardStats({
        aylikArizalar,
        aylikBakimlar: maintenanceStats.toplamBakim,
        aylikVardiya: aylikVardiyaBildirimleri,
        aktifStokUyarilari: kritikStokUyarilari,
        toplamSahalar: sahalarData.length,
        toplamSantraller: santrallerData.length,
        toplamEkipUyeleri: ekipData.length,
        toplamMusteriler: Math.max(musteriData.length, musteriSayisiFromRole),
        buAyBakimSayisi: maintenanceStats.toplamBakim
      });

      // Saha ve santral listesini kaydet (mini harita için)
      setSahalarList(sahalarDataResp || []);
      setSantrallerList(santrallerDataResp || []);

      // Arıza durumu verisi
      const faultStatusChartData = [
        { name: 'Açık', value: faultData.faults.filter((f: any) => f.durum === 'acik').length, color: '#ef4444' },
        { name: 'Devam Ediyor', value: faultData.faults.filter((f: any) => f.durum === 'devam-ediyor').length, color: '#f59e0b' },
        { name: 'Beklemede', value: faultData.faults.filter((f: any) => f.durum === 'beklemede').length, color: '#6b7280' },
        { name: 'Çözüldü', value: faultData.faults.filter((f: any) => f.durum === 'cozuldu').length, color: '#10b981' }
      ];

      setChartData({
        faultStatusData: faultStatusChartData
      });
      
    } catch (error) {
      console.error('Dashboard verileri getirilemedi:', error);
      toast.error('Dashboard verileri yüklenirken hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [userProfile?.companyId]);

  // Gerçek zamanlı abonelikler (Bakımlar ve Vardiya)
  useEffect(() => {
    if (!userProfile?.companyId) return;
    const allowedSahalar = Array.isArray(userProfile.sahalar) ? (userProfile.sahalar as string[]) : [];
    const allowedSantraller = Array.isArray(userProfile.santraller) ? (userProfile.santraller as string[]) : [];

    const filterByRole = (items: any[]) => {
      if (userProfile.rol === 'yonetici' || userProfile.rol === 'superadmin') return items;
      return (items || []).filter((it: any) => {
        const sahaOk = it.sahaId ? allowedSahalar.includes(it.sahaId) : false;
        const santralOk = it.santralId ? allowedSantraller.includes(it.santralId) : false;
        return sahaOk || santralOk;
      });
    };

    const unsubs: Array<() => void> = [];

    // Elektrik bakım
    try {
      const qElec = fsQuery(
        collection(db, 'elektrikBakimlar'),
        where('companyId', '==', userProfile.companyId)
      );
      unsubs.push(onSnapshot(qElec, (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setElektrikBakimDocs(filterByRole(list));
      }));
    } catch {}

    // Mekanik bakım
    try {
      const qMek = fsQuery(
        collection(db, 'mekanikBakimlar'),
        where('companyId', '==', userProfile.companyId)
      );
      unsubs.push(onSnapshot(qMek, (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setMekanikBakimDocs(filterByRole(list));
      }));
    } catch {}

    // Vardiya bildirimleri (tüm kayıtlar)
    try {
      const qVar = fsQuery(
        collection(db, 'vardiyaBildirimleri'),
        where('companyId', '==', userProfile.companyId)
      );
      unsubs.push(onSnapshot(qVar, (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        const filtered = filterByRole(list);
        setVardiyaDocs(filtered);
        // Aylık sayacı burada da güncelle (fallback ve anında güncelleme)
        try {
          const now = new Date();
          const monthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
          const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0, 0);
          const toDateSafe = (input: any): Date | null => {
            if (!input) return null;
            try {
              if (typeof input?.toDate === 'function') {
                const d = input.toDate();
                return isNaN(d.getTime()) ? null : d;
              }
              const d = new Date(input);
              return isNaN(d.getTime()) ? null : d;
            } catch { return null; }
          };
          const isInMonth = (d: Date | null) => !!d && d >= monthStart && d < nextMonthStart;
          const monthCount = filtered.filter((v: any) => isInMonth(toDateSafe(v.tarih) || toDateSafe(v.olusturmaTarihi))).length;
          setDashboardStats((prev) => ({ ...prev, aylikVardiya: monthCount }));
        } catch {}
      }));
    } catch {}

    // Vardiya bildirimleri (bu ay) - gerçek zamanlı sayaç
    try {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0, 0);
      const qVarMonth = fsQuery(
        collection(db, 'vardiyaBildirimleri'),
        where('companyId', '==', userProfile.companyId),
        where('tarih', '>=', Timestamp.fromDate(monthStart)),
        where('tarih', '<', Timestamp.fromDate(nextMonthStart))
      );
      unsubs.push(onSnapshot(qVarMonth, (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        const filtered = filterByRole(list);
        setDashboardStats((prev) => ({ ...prev, aylikVardiya: filtered.length }));
      }));
    } catch {}

    return () => {
      unsubs.forEach((u) => u && u());
    };
  }, [userProfile?.companyId, userProfile?.rol, userProfile?.sahalar, userProfile?.santraller]);

  // Aboneliklerden gelen dokümanlar değiştiğinde aylık sayaçları hesapla
  useEffect(() => {
    if (!userProfile?.companyId) return;
    const now = new Date();
    const ayBaslangic = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    const sonrakiAyBaslangic = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0, 0);

    const toDateSafe = (input: any): Date | null => {
      if (!input) return null;
      try {
        if (typeof input?.toDate === 'function') {
          const d = input.toDate();
          return isNaN(d.getTime()) ? null : d;
        }
        const d = new Date(input);
        return isNaN(d.getTime()) ? null : d;
      } catch { return null; }
    };
    const isInCurrentMonth = (d: Date | null) => !!d && d >= ayBaslangic && d < sonrakiAyBaslangic;

    const elecCount = (elektrikBakimDocs || []).filter((b: any) => isInCurrentMonth(toDateSafe(b.tarih) || toDateSafe(b.olusturmaTarihi))).length;
    const mekCount  = (mekanikBakimDocs || []).filter((b: any) => isInCurrentMonth(toDateSafe(b.tarih) || toDateSafe(b.olusturmaTarihi))).length;
    const maintTotal = elecCount + mekCount;
    const vardiyaCount = (vardiyaDocs || []).filter((v: any) => isInCurrentMonth(toDateSafe(v.tarih) || toDateSafe(v.olusturmaTarihi))).length;

    setDashboardStats((prev) => ({
      ...prev,
      aylikBakimlar: maintTotal,
      buAyBakimSayisi: maintTotal,
      aylikVardiya: vardiyaCount
    }));
  }, [elektrikBakimDocs, mekanikBakimDocs, vardiyaDocs, userProfile?.companyId]);

  // Canlı bildirim aboneliği (eski gösterim)
  useEffect(() => {
    if (!userProfile?.companyId) return;
    const unsub = notificationService.subscribeToNotifications(
      userProfile.companyId,
      userProfile.id,
      (items) => {
        const role = userProfile.rol;
        const allowedSahalar = Array.isArray(userProfile.sahalar) ? (userProfile.sahalar as string[]) : [];
        const allowedSantraller = Array.isArray(userProfile.santraller) ? (userProfile.santraller as string[]) : [];
        const filtered = items.filter((n:any) => {
          if (role === 'superadmin' || role === 'yonetici') return true;
          const md = n.metadata || {};
          const sahaOk = md.sahaId ? allowedSahalar.includes(md.sahaId) : true;
          const santralOk = md.santralId ? allowedSantraller.includes(md.santralId) : true;
          return sahaOk && santralOk;
        });
        setLiveNotifications(filtered);
      }
    );
    return () => unsub && unsub();
  }, [userProfile?.companyId, userProfile?.id]);

  // Abonelik bildirim kontrolü (sadece yöneticiler için)
  useEffect(() => {
    if (userProfile?.rol === 'yonetici' && subscriptionInfo) {
      const remainingDays = getRemainingDays();
      const lastNotificationDate = getLastNotificationDate();
      
      // Bildirim kontrolü yap
      checkSubscriptionStatus(remainingDays, navigate, lastNotificationDate || undefined);
    }
  }, [subscriptionInfo, userProfile, navigate, getRemainingDays]);

  // KPI verilerini hazırla - Güncel tarih kullan
  const now = new Date();
  const currentMonth = now.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });
  
  const kpiData = [
    {
      title: 'Bu Ay Arızalar',
      value: dashboardStats.aylikArizalar,
      icon: 'alert' as const,
      color: 'red' as const
    },
    {
      title: 'Bu Ay Bakımlar',
      value: dashboardStats.aylikBakimlar,
      icon: 'power' as const,
      color: 'blue' as const
    },
    {
      title: 'Kritik Stok Uyarıları',
      value: dashboardStats.aktifStokUyarilari,
      icon: 'alert' as const,
      color: 'yellow' as const
    }
  ];

  // Pull-to-refresh handler
  const handleRefresh = async () => {
    try {
      await fetchDashboardData();
    } catch (error) {
      console.error('Dashboard yenileme hatası:', error);
      // Sessizce devam et
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  const content = (
    <div className="space-y-3 lg:space-y-4">
      {/* Welcome Section - Kompakt */}
      <div className="mb-4">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
          Hoş Geldiniz, {userProfile?.ad}!
        </h2>
        <p className="text-gray-600 mt-1 text-sm md:text-base">
          {new Date().toLocaleDateString('tr-TR', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })} - Program Durum Özeti
        </p>
      </div>

      {/* Abonelik ve Depolama Durumu Widget'ları (sadece yöneticiler için) */}
      {userProfile?.rol === 'yonetici' && (
        <div className="space-y-3">
          <SubscriptionStatusWidget />
          <StorageWarningWidget />
        </div>
      )}

      {/* Bu Ay Özeti - Sade Tasarım */}
      <Card className="h-full" padding="sm">
        <CardHeader className="mb-2 pb-2">
          <CardTitle className="text-sm md:text-base font-semibold">Bu Ay Özeti</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-3 gap-2">
            {/* Bu Ay Arızalar */}
            <div className="flex items-start gap-2 p-2 rounded-lg border border-gray-200 hover:shadow-md transition-all">
              <div className="text-red-600 flex-shrink-0">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xl font-bold text-gray-900">{dashboardStats.aylikArizalar}</div>
                <div className="text-[10px] text-gray-500">Bu Ay Arızalar</div>
              </div>
            </div>
            
            {/* Bu Ay Bakımlar */}
            <div className="flex items-start gap-2 p-2 rounded-lg border border-gray-200 hover:shadow-md transition-all">
              <div className="text-blue-600 flex-shrink-0">
                <Wrench className="h-6 w-6" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xl font-bold text-gray-900">{dashboardStats.aylikBakimlar}</div>
                <div className="text-[10px] text-gray-500">Bu Ay Bakımlar</div>
              </div>
            </div>
            
            {/* Kritik Stok Uyarıları */}
            <div className="flex items-start gap-2 p-2 rounded-lg border border-gray-200 hover:shadow-md transition-all">
              <div className="text-yellow-600 flex-shrink-0">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xl font-bold text-gray-900">{dashboardStats.aktifStokUyarilari}</div>
                <div className="text-[10px] text-gray-500">Kritik Stok</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Üst Grid - 3 Kolon: Program Özeti, Hava Durumu, Hızlı Erişim */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
        {/* Program Özeti */}
        <Card className="h-full" padding="sm">
          <CardHeader className="mb-2 pb-2">
            <CardTitle className="text-sm md:text-base font-semibold">Program Özeti</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-2 p-2 rounded-lg border border-gray-200 hover:shadow-md transition-all">
                <div className="text-blue-600 flex-shrink-0">
                  <Building2 className="h-6 w-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-lg font-bold text-gray-900">{dashboardStats.toplamSahalar}</div>
                  <div className="text-[10px] text-gray-500 truncate">Toplam Saha</div>
                </div>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg border border-gray-200 hover:shadow-md transition-all">
                <div className="text-green-600 flex-shrink-0">
                  <Sun className="h-6 w-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-lg font-bold text-gray-900">{dashboardStats.toplamSantraller}</div>
                  <div className="text-[10px] text-gray-500 truncate">Toplam Santral</div>
                </div>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg border border-gray-200 hover:shadow-md transition-all">
                <div className="text-purple-600 flex-shrink-0">
                  <Users className="h-6 w-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-lg font-bold text-gray-900">{dashboardStats.toplamEkipUyeleri}</div>
                  <div className="text-[10px] text-gray-500 truncate">Ekip Üyeleri</div>
                </div>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg border border-gray-200 hover:shadow-md transition-all">
                <div className="text-orange-600 flex-shrink-0">
                  <Wrench className="h-6 w-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-lg font-bold text-gray-900">{dashboardStats.buAyBakimSayisi || 0}</div>
                  <div className="text-[10px] text-gray-500 truncate">Bu Ay Bakımlar</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Hava Durumu & Sahalar (Arıza Durumu yerine) */}
        {sahalarList && sahalarList.length > 0 ? (
          <CompactWeatherWidget sahalar={sahalarList} />
        ) : (
          <FaultStatusChart 
            data={chartData.faultStatusData}
            title="Arıza Durumu Özeti"
            height={200}
            compact
          />
        )}

        {/* Canlı Akış */}
        <Card className="h-full" padding="sm">
          <CardHeader className="mb-2 pb-2">
            <CardTitle className="text-sm md:text-base font-semibold flex items-center gap-2">
              <Activity className="h-4 w-4 text-blue-600" />
              Canlı Akış
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2 max-h-48 md:max-h-64 overflow-auto text-xs">
                {liveNotifications.length === 0 ? (
                  <p className="text-xs text-gray-500 text-center py-4">Henüz bildirim yok.</p>
                ) : (
                  liveNotifications.slice(0,8).map(n => {
                    const color = n.type==='error'?'bg-red-500':n.type==='warning'?'bg-amber-500':n.type==='success'?'bg-emerald-500':'bg-blue-500';
                    return (
                    <div key={n.id} className="flex items-start gap-2 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                      <span className="relative mt-1 inline-flex w-2 h-2 flex-shrink-0">
                        <span className={`absolute inline-flex rounded-full ${color} opacity-60 animate-ping w-2 h-2`}></span>
                        <span className={`relative inline-block rounded-full ${color} w-2 h-2`}></span>
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 text-xs truncate">{n.title}</div>
                        <div className="text-gray-600 text-[10px] line-clamp-2">{n.message}</div>
                      </div>
                      <div className="text-gray-500 text-[10px] whitespace-nowrap flex-shrink-0">{new Date((n.createdAt as any).toDate ? (n.createdAt as any).toDate() : (n.createdAt as any)).toLocaleTimeString('tr-TR',{hour:'2-digit',minute:'2-digit'})}</div>
                    </div>
                  );})
                )}
            </div>
          </CardContent>
        </Card>

      </div>

      {/* Grid: Aylık Aktivite Özeti + Yeni Eklenenler */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 lg:gap-4">
        {/* Aylık Aktivite Özeti - Kompakt */}
        <div className="lg:col-span-2">
          <Card padding="sm" className="h-full">
            <CardHeader className="mb-2 pb-2">
              <CardTitle className="text-sm md:text-base font-semibold flex items-center gap-2">
                <Sun className="h-4 w-4 text-blue-600" />
                {currentMonth} Aktivite Özeti
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                <div className="flex items-start gap-2 rounded-lg border border-gray-200 p-2 md:p-3 hover:shadow-md transition-all">
                  <AlertTriangle className="h-6 w-6 text-red-600 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] text-gray-500 font-medium">Bildirilen Arızalar</div>
                    <div className="text-xl md:text-2xl font-bold text-gray-900">{dashboardStats.aylikArizalar}</div>
                  </div>
                </div>
                <div className="flex items-start gap-2 rounded-lg border border-gray-200 p-2 md:p-3 hover:shadow-md transition-all">
                  <Wrench className="h-6 w-6 text-blue-600 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] text-gray-500 font-medium">Yapılan Bakımlar</div>
                    <div className="text-xl md:text-2xl font-bold text-gray-900">{dashboardStats.aylikBakimlar}</div>
                  </div>
                </div>
                <div className="flex items-start gap-2 rounded-lg border border-gray-200 p-2 md:p-3 hover:shadow-md transition-all">
                  <AlertTriangle className="h-6 w-6 text-yellow-600 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] text-gray-500 font-medium">Kritik Stok Uyarıları</div>
                    <div className="text-xl md:text-2xl font-bold text-gray-900">{dashboardStats.aktifStokUyarilari}</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Yeni Eklenenler Widget */}
        <div>
          <RecentItemsWidget 
            companyId={userProfile?.companyId || ''} 
            userRole={userProfile?.rol}
            userSahalar={userProfile?.sahalar}
            userSantraller={userProfile?.santraller}
          />
        </div>
      </div>

      {/* Operasyon Haritası - Tam genişlik */}
      <Card padding="sm">
        <CardHeader className="mb-2 pb-2">
          <CardTitle className="text-sm md:text-base font-semibold flex items-center gap-2">
            <Map className="w-5 h-5 text-blue-600" />
            Operasyon Haritası (Mini)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-gray-600">Harita:</span>
              <select 
                value={mapType} 
                onChange={(e)=>setMapType(e.target.value as any)} 
                className="border rounded px-2 py-1 text-xs w-full sm:w-auto"
              >
                <option value="terrain">Arazi</option>
                <option value="satellite">Uydu</option>
                <option value="roadmap">Yol</option>
                <option value="hybrid">Karma</option>
              </select>
            </div>
            <div className="flex items-center gap-1">
              <button 
                className="text-xs border rounded px-2 py-1" 
                onClick={()=>setMapHeight(h=>Math.max(240, h-60))}
              >
                -
              </button>
              <button 
                className="text-xs border rounded px-2 py-1" 
                onClick={()=>setMapHeight(h=>Math.min(640, h+60))}
              >
                +
              </button>
            </div>
          </div>
          
          {sahalarList.length > 0 ? (
            (() => {
              const validSahalar = sahalarList.filter(s => s.konum && s.konum.lat && s.konum.lng);
              if (validSahalar.length === 0) {
                return (
                  <div className="text-sm text-gray-600">Koordinat bilgisi olan saha bulunamadı.</div>
                );
              }
              
              // Saha başına santral sayısını hesapla
              const sahaPoints = validSahalar.map(saha => {
                const sahaSantraller = santrallerList.filter(s => s.sahaId === saha.id);
                const toplamKapasite = sahaSantraller.reduce((sum, s) => sum + (s.kapasite || 0), 0);
                
                // Saha durumunu belirle
                let status: 'normal' | 'bakim' | 'ariza' = 'normal';
                if (sahaStatusMap[saha.id]) {
                  status = sahaStatusMap[saha.id];
                }
                
                return {
                  lat: saha.konum.lat,
                  lng: saha.konum.lng,
                  title: saha.ad,
                  subtitle: `${sahaSantraller.length} Santral • ${toplamKapasite.toFixed(1)} kW`,
                  status: status,
                  details: [
                    { label: 'Santral Sayısı', value: sahaSantraller.length.toString() },
                    { label: 'Toplam Kapasite', value: `${toplamKapasite.toFixed(1)} kW` }
                  ].filter(d => d.value && d.value !== 'undefined' && d.value !== 'null')
                };
              });
              
              return (
                <MiniClusterMap 
                  points={sahaPoints} 
                  mapType={mapType} 
                  height={mapHeight} 
                />
              );
            })()
          ) : (
            <div className="text-sm text-gray-600">Haritada gösterecek saha bulunamadı.</div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      {content}
    </PullToRefresh>
  );
};

export default Dashboard;
