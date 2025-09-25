import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useCompany } from '../../contexts/CompanyContext';
import { useNavigate } from 'react-router-dom';
import { Button, Card, CardContent, CardHeader, CardTitle, LoadingSpinner, SubscriptionStatusWidget, StorageWarningWidget } from '../../components/ui';
import { KPICards, FaultStatusChart } from '../../components/charts';
import { CompactWeatherWidget } from '../../components/weather/CompactWeatherWidget';
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
  Activity
} from 'lucide-react';
// Removed unused import - SUBSCRIPTION_PLANS not used in this component
import { useSubscription } from '../../hooks/useSubscription';

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

      // Paralel veri çekme (aylık aktiviteler için)
      let faultData: any, maintenanceStats: any, sahalarData: any[], santrallerData: any[], ekipData: any[], musteriData: any[], stokData: any[], vardiyaData: any[] = [];
      
      // Tüm roller için rol+atama bilgileriyle veri çek (merkezileştirilmiş görünürlük)
      const [faultsResp, sahalarDataResp, santrallerDataResp, stokDataResp, vardiyaDataResp, elektrikBakimlar, mekanikBakimlar, yapilanIsler, ekipDataResp, musteriDataResp] = await Promise.all([
        arizaService.getFaults({ 
          companyId: userProfile.companyId,
          userRole: userProfile.rol,
          userSahalar: userProfile.sahalar as any,
          userSantraller: userProfile.santraller as any,
          userId: userProfile.id
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

      // Bu ayın bakımlarını filtrele
      const elektrikBakimlarBuAy = elektrikBakimlar.filter((bakim: any) => {
        const bakimTarihi = bakim.tarih?.toDate ? bakim.tarih.toDate() : new Date(bakim.tarih);
        return bakimTarihi >= ayBaslangic && bakimTarihi < sonrakiAyBaslangic;
      });
      const mekanikBakimlarBuAy = mekanikBakimlar.filter((bakim: any) => {
        const bakimTarihi = bakim.tarih?.toDate ? bakim.tarih.toDate() : new Date(bakim.tarih);
        return bakimTarihi >= ayBaslangic && bakimTarihi < sonrakiAyBaslangic;
      });
      const yapilanIslerBuAy = yapilanIsler.filter((is: any) => {
        const isTarihi = is.tarih?.toDate ? is.tarih.toDate() : new Date(is.tarih);
        return isTarihi >= ayBaslangic && isTarihi < sonrakiAyBaslangic;
      });

      maintenanceStats = {
        toplamBakim: elektrikBakimlarBuAy.length + mekanikBakimlarBuAy.length + yapilanIslerBuAy.length,
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
      const aylikVardiyaBildirimleri = vardiyaData.filter((vardiya: any) => {
        // Bazı eski kayıtlarda 'tarih' alanı olmayabilir; olusturmaTarihi'ne düş
        let vardiyaTarihi: Date | null = null;
        if (vardiya.tarih) {
          vardiyaTarihi = vardiya.tarih.toDate ? vardiya.tarih.toDate() : new Date(vardiya.tarih);
        } else if (vardiya.olusturmaTarihi) {
          vardiyaTarihi = vardiya.olusturmaTarihi.toDate ? vardiya.olusturmaTarihi.toDate() : new Date(vardiya.olusturmaTarihi);
        }
        if (!vardiyaTarihi || isNaN(vardiyaTarihi.getTime())) return false;
        return vardiyaTarihi >= ayBaslangic && vardiyaTarihi < sonrakiAyBaslangic;
      }).length;

      // Kritik stok uyarıları
      const kritikStokUyarilari = stokData.filter((stok: any) => stok.durum === 'Kritik').length;
      
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
      title: 'Bu Ay Vardiya',
      value: dashboardStats.aylikVardiya,
      icon: 'power' as const,
      color: 'green' as const
    },
    {
      title: 'Kritik Stok Uyarıları',
      value: dashboardStats.aktifStokUyarilari,
      icon: 'alert' as const,
      color: 'yellow' as const
    }
  ];

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Welcome Section */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900">
          Hoş Geldiniz, {userProfile?.ad}!
        </h2>
        <p className="text-gray-600 mt-2 text-lg">
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
        <div className="space-y-4">
          <SubscriptionStatusWidget />
          <StorageWarningWidget />
        </div>
      )}

      {/* KPI Cards */}
      <KPICards data={kpiData} />

      {/* Üst Grid - 3 Kolon: Program Özeti, Hava Durumu, Hızlı Erişim */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
        {/* Program Özeti */}
        <Card className="h-full" padding="sm">
          <CardHeader className="mb-2">
            <CardTitle className="text-base md:text-lg">Program Özeti</CardTitle>
          </CardHeader>
          <CardContent className="">
            <div className="grid grid-cols-2 md:grid-cols-2 gap-2 md:gap-3">
              <div className="rounded-lg border p-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center">
                  <Sun className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-lg md:text-xl font-bold text-gray-900">{dashboardStats.toplamSahalar}</div>
                  <div className="text-[11px] md:text-xs text-gray-600">Toplam Saha</div>
                </div>
              </div>
              <div className="rounded-lg border p-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-green-100 text-green-700 flex items-center justify-center">
                  <Sun className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-lg md:text-xl font-bold text-gray-900">{dashboardStats.toplamSantraller}</div>
                  <div className="text-[11px] md:text-xs text-gray-600">Toplam Santral</div>
                </div>
              </div>
              <div className="rounded-lg border p-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center">
                  <Users className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-lg md:text-xl font-bold text-gray-900">{dashboardStats.toplamEkipUyeleri}</div>
                  <div className="text-[11px] md:text-xs text-gray-600">Ekip Üyeleri</div>
                </div>
              </div>
              <div className="rounded-lg border p-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center">
                  <Wrench className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-lg md:text-xl font-bold text-gray-900">{dashboardStats.buAyBakimSayisi || 0}</div>
                  <div className="text-[11px] md:text-xs text-gray-600">Bu Ay Bakımlar</div>
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

        {/* Canlı Akış (eski görünüm) */}
        <Card className="h-full" padding="sm">
          <CardHeader className="mb-2">
            <CardTitle className="text-base md:text-lg">Canlı Akış</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1.5 max-h-48 md:max-h-64 overflow-auto text-xs">
                {liveNotifications.length === 0 ? (
                  <p className="text-xs text-gray-600">Henüz bildirim yok.</p>
                ) : (
                  liveNotifications.slice(0,8).map(n => {
                    const color = n.type==='error'?'bg-red-500':n.type==='warning'?'bg-amber-500':n.type==='success'?'bg-emerald-500':'bg-blue-500';
                    return (
                    <div key={n.id} className="flex items-start gap-2">
                      <span className="relative mt-1 inline-flex w-2 h-2">
                        <span className={`absolute inline-flex rounded-full ${color} opacity-60 animate-ping w-2 h-2`}></span>
                        <span className={`relative inline-block rounded-full ${color} w-2 h-2`}></span>
                      </span>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{n.title}</div>
                        <div className="text-gray-600">{n.message}</div>
                      </div>
                      <div className="text-gray-500 whitespace-nowrap">{new Date((n.createdAt as any).toDate ? (n.createdAt as any).toDate() : (n.createdAt as any)).toLocaleTimeString('tr-TR',{hour:'2-digit',minute:'2-digit'})}</div>
                    </div>
                  );})
                )}
            </div>
          </CardContent>
        </Card>

      </div>

      {/* Aylık Aktivite Özeti - Tam genişlik */}
      <Card padding="sm">
        <CardHeader className="mb-2">
          <CardTitle className="text-lg flex items-center">
            <Sun className="h-5 w-5 mr-2 text-blue-500" />
            {currentMonth} Aktivite Özeti
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-3">
            <div className="rounded-lg border p-4">
              <div className="text-xs text-gray-500">Bildirilen Arızalar</div>
              <div className="text-2xl font-bold">{dashboardStats.aylikArizalar}</div>
            </div>
            <div className="rounded-lg border p-4">
              <div className="text-xs text-gray-500">Yapılan Bakımlar</div>
              <div className="text-2xl font-bold">{dashboardStats.aylikBakimlar}</div>
            </div>
            <div className="rounded-lg border p-4">
              <div className="text-xs text-gray-500">Vardiya Bildirimleri</div>
              <div className="text-2xl font-bold">{dashboardStats.aylikVardiya}</div>
            </div>
            <div className="rounded-lg border p-4">
              <div className="text-xs text-gray-500">Kritik Stok Uyarıları</div>
              <div className="text-2xl font-bold">{dashboardStats.aktifStokUyarilari}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Operasyon Haritası - Tam genişlik */}
      <Card padding="sm">
        <CardHeader className="mb-2">
          <CardTitle className="text-lg">Operasyon Haritası (Mini)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-gray-600">Harita:</span>
              <select value={mapType} onChange={(e)=>setMapType(e.target.value as any)} className="border rounded px-2 py-1 text-xs">
                <option value="terrain">Arazi</option>
                <option value="satellite">Uydu</option>
                <option value="roadmap">Yol</option>
                <option value="hybrid">Karma</option>
              </select>
            </div>
            <div className="flex items-center gap-1">
              <button className="text-xs border rounded px-2 py-1" onClick={()=>setMapHeight(h=>Math.max(240, h-60))}>-</button>
              <button className="text-xs border rounded px-2 py-1" onClick={()=>setMapHeight(h=>Math.min(640, h+60))}>+</button>
            </div>
          </div>
          {sahalarList.length > 0 ? (
            <MiniClusterMap 
              mapType={mapType}
              height={mapHeight}
              points={sahalarList
                .filter(s=>s.konum && s.konum.lat && s.konum.lng)
                .map(s => ({
                  lat: s.konum.lat,
                  lng: s.konum.lng,
                  title: s.ad,
                  subtitle: s.konum?.adres,
                  url: '/sahalar',
                  status: (sahaStatusMap[s.id] || 'normal') as any,
                  details: [
                    { label: 'Santral', value: String((santrallerList?.filter((x:any)=>x.sahaId===s.id).length) || 0) },
                    { label: 'Toplam Kapasite', value: `${formatNumber(s.toplamKapasite || 0, 0)} kW` }
                  ]
                }))
              }
            />
          ) : (
            <div className="text-sm text-gray-600">Haritada gösterecek saha bulunamadı.</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
