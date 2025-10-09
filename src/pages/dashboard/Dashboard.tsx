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
  Activity,
  Building2
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

      {/* KPI Cards - Modern, Kompakt Tasarım */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
        {kpiData.map((kpi, index) => {
          const getIconBg = (color: string) => {
            switch(color) {
              case 'red': return 'bg-red-50 border border-red-100';
              case 'blue': return 'bg-blue-50 border border-blue-100';
              case 'green': return 'bg-green-50 border border-green-100';
              case 'yellow': return 'bg-amber-50 border border-amber-100';
              default: return 'bg-gray-50 border border-gray-100';
            }
          };
          
          const getIconColor = (color: string) => {
            switch(color) {
              case 'red': return 'text-red-600';
              case 'blue': return 'text-blue-600';
              case 'green': return 'text-green-600';
              case 'yellow': return 'text-amber-600';
              default: return 'text-gray-600';
            }
          };
          
          return (
            <Card key={index} className="p-3 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${getIconBg(kpi.color)} flex-shrink-0`}>
                  {kpi.icon === 'alert' && <AlertTriangle className={`h-5 w-5 ${getIconColor(kpi.color)}`} />}
                  {kpi.icon === 'power' && <Wrench className={`h-5 w-5 ${getIconColor(kpi.color)}`} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xl md:text-2xl font-bold text-gray-900">{kpi.value}</p>
                  <p className="text-xs text-gray-600 truncate">{kpi.title}</p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Üst Grid - 3 Kolon: Program Özeti, Hava Durumu, Hızlı Erişim */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
        {/* Program Özeti */}
        <Card className="h-full" padding="sm">
          <CardHeader className="mb-2 pb-2">
            <CardTitle className="text-sm md:text-base font-semibold">Program Özeti</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-2 p-2 rounded-lg bg-blue-50 border border-blue-100 hover:bg-blue-100 transition-colors">
                <div className="text-blue-700">
                  <Building2 className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-lg font-bold text-gray-900">{dashboardStats.toplamSahalar}</div>
                  <div className="text-[10px] text-gray-600 truncate">Toplam Saha</div>
                </div>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-green-50 border border-green-100 hover:bg-green-100 transition-colors">
                <div className="text-green-700">
                  <Sun className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-lg font-bold text-gray-900">{dashboardStats.toplamSantraller}</div>
                  <div className="text-[10px] text-gray-600 truncate">Toplam Santral</div>
                </div>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-purple-50 border border-purple-100 hover:bg-purple-100 transition-colors">
                <div className="text-purple-700">
                  <Users className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-lg font-bold text-gray-900">{dashboardStats.toplamEkipUyeleri}</div>
                  <div className="text-[10px] text-gray-600 truncate">Ekip Üyeleri</div>
                </div>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-orange-50 border border-orange-100 hover:bg-orange-100 transition-colors">
                <div className="text-orange-700">
                  <Wrench className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-lg font-bold text-gray-900">{dashboardStats.buAyBakimSayisi || 0}</div>
                  <div className="text-[10px] text-gray-600 truncate">Bu Ay Bakımlar</div>
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

      {/* Aylık Aktivite Özeti - Kompakt */}
      <Card padding="sm">
        <CardHeader className="mb-2 pb-2">
          <CardTitle className="text-sm md:text-base font-semibold flex items-center gap-2">
            <Sun className="h-4 w-4 text-blue-600" />
            {currentMonth} Aktivite Özeti
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <div className="rounded-lg border border-red-100 bg-red-50 p-2 md:p-3 hover:bg-red-100 transition-colors">
              <div className="text-[10px] text-red-700 font-medium">Bildirilen Arızalar</div>
              <div className="text-xl md:text-2xl font-bold text-red-900">{dashboardStats.aylikArizalar}</div>
            </div>
            <div className="rounded-lg border border-blue-100 bg-blue-50 p-2 md:p-3 hover:bg-blue-100 transition-colors">
              <div className="text-[10px] text-blue-700 font-medium">Yapılan Bakımlar</div>
              <div className="text-xl md:text-2xl font-bold text-blue-900">{dashboardStats.aylikBakimlar}</div>
            </div>
            <div className="rounded-lg border border-green-100 bg-green-50 p-2 md:p-3 hover:bg-green-100 transition-colors">
              <div className="text-[10px] text-green-700 font-medium">Vardiya Bildirimleri</div>
              <div className="text-xl md:text-2xl font-bold text-green-900">{dashboardStats.aylikVardiya}</div>
            </div>
            <div className="rounded-lg border border-amber-100 bg-amber-50 p-2 md:p-3 hover:bg-amber-100 transition-colors">
              <div className="text-[10px] text-amber-700 font-medium">Kritik Stok Uyarıları</div>
              <div className="text-xl md:text-2xl font-bold text-amber-900">{dashboardStats.aktifStokUyarilari}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Operasyon Haritası - Tam genişlik */}
      <Card padding="sm">
        <CardHeader className="mb-2 pb-2">
          <CardTitle className="text-sm md:text-base font-semibold">Operasyon Haritası (Mini)</CardTitle>
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
                    { label: 'İl/İlçe', value: `${saha.il}, ${saha.ilce}` },
                    { label: 'Santral Sayısı', value: sahaSantraller.length.toString() },
                    { label: 'Toplam Kapasite', value: `${toplamKapasite.toFixed(1)} kW` },
                    { label: 'Durum', value: saha.durum === 'aktif' ? 'Aktif' : 'Pasif' }
                  ]
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

  return content;
};

export default Dashboard;
