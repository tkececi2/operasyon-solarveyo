import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Shield, 
  Clock, 
  MapPin, 
  Camera, 
  AlertTriangle,
  CheckCircle,
  Sun,
  Moon,
  Cloud,
  Search,
  Filter,
  Eye,
  Building2,
  Users,
  User,
  FileText,
  Calendar,
  X,
  ChevronRight,
  LayoutGrid,
  List
} from 'lucide-react';
import { 
  Button, 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  Modal,
  StatusBadge,
  Badge,
  LoadingSpinner,
  NewBadge
} from '../../components/ui';
import MiniClusterMap from '../../components/maps/MiniClusterMap';
import MiniLocationMap from '../../components/maps/MiniLocationMap';
import { ResponsiveDetailModal } from '../../components/modals/ResponsiveDetailModal';
import { VardiyaForm } from '../../components/forms/VardiyaForm';
import { useAuth } from '../../hooks/useAuth';
import { useCompany } from '../../hooks/useCompany';
import { vardiyaService, type VardiyaBildirimi } from '../../services/vardiyaService';
import { getAllSahalar } from '../../services/sahaService';
import { formatDate, formatDateTime, formatRelativeTime } from '../../utils/formatters';
import { isNewItem, getNewItemClasses, getNewItemHoverClasses, getTimeAgo } from '../../utils/newItemUtils';
import { generateGoogleMapsUrls, getGoogleMapsApiKey } from '../../utils/googleMaps';
import PullToRefresh from '../../components/ui/PullToRefresh';
import toast from 'react-hot-toast';

const VardiyaBildirimleri: React.FC = () => {
  const { userProfile, canPerformAction } = useAuth();
  const { company } = useCompany();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [draftDate, setDraftDate] = useState<string | undefined>(undefined);
  const [selectedVardiya, setSelectedVardiya] = useState<VardiyaBildirimi | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [shiftTypeFilter, setShiftTypeFilter] = useState<string>('all');
  const [sahaFilter, setSahaFilter] = useState<string>('all');
  const [sahalar, setSahalar] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'timeline' | 'map'>('timeline');
  const [onlyMyAreas, setOnlyMyAreas] = useState(false);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [quickRange, setQuickRange] = useState<'none' | 'today' | 'yesterday' | '7d' | 'month'>('none');
  const [showMobileFilters, setShowMobileFilters] = useState<boolean>(false);
  const [brokenImages, setBrokenImages] = useState<Set<string>>(new Set());
  const [mapStatus, setMapStatus] = useState<{ normal: boolean; dikkat: boolean; acil: boolean }>({ normal: true, dikkat: true, acil: true });
  const [mapType, setMapType] = useState<'roadmap' | 'satellite' | 'terrain' | 'hybrid'>('satellite');
  const [mapHeight, setMapHeight] = useState<number>(360);

  // Gerçek veriler - Firebase'den gelecek
  const [vardiyaBildirimleri, setVardiyaBildirimleri] = useState<VardiyaBildirimi[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Verileri Firebase'den getir
  const fetchData = async () => {
    if (!company?.id) return;
    
    try {
      setIsLoading(true);
      const [vardiyaData, sahaData] = await Promise.all([
        vardiyaService.getAllVardiyaBildirimleri(company.id),
        getAllSahalar(company.id, userProfile?.rol, userProfile?.sahalar as string[] | undefined)
      ]);

      // Rol izolasyonu: müşteri/tekniker/mühendis/bekçi -> yalnız atanan saha/santral kayıtları
      let filtered = vardiyaData;
      if (userProfile && ['musteri','tekniker','muhendis','bekci'].includes(userProfile.rol)) {
        const allowedSahalar = (userProfile.sahalar as string[]) || [];
        const allowedSantraller = userProfile.santraller || [];
        filtered = vardiyaData.filter(v => {
          const sahaMatch = v.sahaId ? allowedSahalar.includes(v.sahaId) : false;
          const santralMatch = v.santralId ? allowedSantraller.includes(v.santralId) : false;
          return sahaMatch || santralMatch;
        });
      }

      setVardiyaBildirimleri(filtered);
      setSahalar(sahaData);
    } catch (error) {
      console.error('Veri getirme hatası:', error);
      toast.error('Veriler yüklenirken hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (company?.id && userProfile?.companyId) {
      fetchData();
    }
  }, [company, userProfile?.companyId, userProfile?.rol, userProfile?.sahalar]);

  const getDurumBadgeVariant = (durum: string) => {
    switch (durum) {
      case 'normal': return 'success';
      case 'dikkat': return 'warning';
      case 'acil': return 'danger';
      default: return 'default';
    }
  };

  const getDurumIcon = (durum: string) => {
    switch (durum) {
      case 'normal': return <CheckCircle className="h-4 w-4" />;
      case 'dikkat': return <AlertTriangle className="h-4 w-4" />;
      case 'acil': return <AlertTriangle className="h-4 w-4" />;
      default: return <Shield className="h-4 w-4" />;
    }
  };

  const getVardiyaIcon = (tip: string) => {
    switch(tip) {
      case 'sabah': return <Sun className="h-5 w-5 text-yellow-500" />;
      case 'ogle': return <Sun className="h-5 w-5 text-orange-500" />;
      case 'aksam': return <Moon className="h-5 w-5 text-indigo-500" />;
      case 'gece': return <Moon className="h-5 w-5 text-purple-500" />;
      default: return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getVardiyaLabel = (tip: string) => {
    switch(tip) {
      case 'sabah': return 'Sabah';
      case 'ogle': return 'Öğle';
      case 'aksam': return 'Akşam';
      case 'gece': return 'Gece';
      default: return 'Vardiya';
    }
  };

  const getVardiyaTime = (tip: string) => {
    switch(tip) {
      case 'sabah': return '08:00 - 16:00';
      case 'ogle': return '12:00 - 20:00';
      case 'aksam': return '16:00 - 00:00';
      case 'gece': return '00:00 - 08:00';
      default: return '';
    }
  };

  // Vardiya silme
  const handleDelete = async (id: string) => {
    if (!window.confirm('Vardiya bildirimini silmek istediğinizden emin misiniz?')) {
      return;
    }
    
    try {
      await vardiyaService.deleteVardiyaBildirimi(id);
      toast.success('Vardiya bildirimi silindi');
      fetchData();
    } catch (error) {
      console.error('Silme hatası:', error);
      toast.error('Vardiya bildirimi silinemedi');
    }
  };

  const filteredBildirimler = vardiyaBildirimleri.filter(bildirim => {
    const matchesSearch = bildirim.olusturanAdi.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         bildirim.sahaAdi.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (bildirim.santralAdi && bildirim.santralAdi.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || bildirim.durum === statusFilter;
    const matchesShiftType = shiftTypeFilter === 'all' || bildirim.vardiyaTipi === shiftTypeFilter;
    const matchesSaha = sahaFilter === 'all' || bildirim.sahaId === sahaFilter;
    const matchesMine = !onlyMyAreas ? true : (() => {
      if (!userProfile) return true;
      const sahalarim = (userProfile.sahalar as string[] | undefined) || [];
      const santrallerim = (userProfile.santraller as string[] | undefined) || [];
      const sahaOk = bildirim.sahaId ? sahalarim.includes(bildirim.sahaId) : false;
      const santralOk = bildirim.santralId ? santrallerim.includes(bildirim.santralId) : false;
      return sahaOk || santralOk;
    })();
    const matchesDate = (() => {
      const d = (bildirim.tarih as any).toDate ? (bildirim.tarih as any).toDate() : (bildirim.tarih as unknown as Date);
      const sd = startDate ? new Date(startDate) : null;
      const ed = endDate ? new Date(endDate) : null;
      if (sd && d < new Date(sd.getFullYear(), sd.getMonth(), sd.getDate())) return false;
      if (ed && d > new Date(ed.getFullYear(), ed.getMonth(), ed.getDate(), 23, 59, 59)) return false;
      return true;
    })();
    
    return matchesSearch && matchesStatus && matchesShiftType && matchesSaha && matchesMine && matchesDate;
  });

  const stats = {
    toplam: vardiyaBildirimleri.length,
    normal: vardiyaBildirimleri.filter(v => v.durum === 'normal').length,
    dikkat: vardiyaBildirimleri.filter(v => v.durum === 'dikkat').length,
    acil: vardiyaBildirimleri.filter(v => v.durum === 'acil').length
  };

  const getSecurityScore = (v: VardiyaBildirimi) => {
    if (!v.guvenlikKontrolleri) return { score: 0, total: 4 };
    const keys: (keyof NonNullable<VardiyaBildirimi['guvenlikKontrolleri']>)[] = ['kameraKontrol','telOrguKontrol','aydinlatmaKontrol','girisKontrol'];
    const total = keys.length;
    const score = keys.reduce((acc, k) => (v.guvenlikKontrolleri && (v.guvenlikKontrolleri as any)[k] ? acc + 1 : acc), 0);
    return { score, total };
  };

  const getShiftAnimatedIcon = (tip: string) => {
    switch (tip) {
      case 'sabah':
        return <Sun className="h-4 w-4 text-amber-500 animate-spin" style={{ animationDuration: '8s' }} />;
      case 'ogle':
        return <Cloud className="h-4 w-4 text-sky-500 animate-bounce" style={{ animationDuration: '3s' }} />;
      case 'aksam':
        return <Moon className="h-4 w-4 text-orange-500 animate-pulse" />;
      case 'gece':
        return <Moon className="h-4 w-4 text-violet-500 animate-pulse" />;
      default:
        return <Clock className="h-4 w-4 text-slate-500" />;
    }
  };

  // Güvenli Timestamp -> Date dönüştürücü
  const toJsDate = (value: any): Date | null => {
    try {
      if (!value) return null;
      if (typeof value?.toDate === 'function') {
        const d = value.toDate();
        return isNaN(d.getTime()) ? null : d;
      }
      if (typeof value?.seconds === 'number') {
        const d = new Date(value.seconds * 1000);
        return isNaN(d.getTime()) ? null : d;
      }
      if (value instanceof Date) {
        return isNaN(value.getTime()) ? null : value;
      }
      if (typeof value === 'number') {
        const d = new Date(value);
        return isNaN(d.getTime()) ? null : d;
      }
      if (typeof value === 'string') {
        const d = new Date(value);
        return isNaN(d.getTime()) ? null : d;
      }
      return null;
    } catch {
      return null;
    }
  };

  // Kart tıklanınca detay aç, ancak buton/link/input tıklamaları hariç
  const onCardClick = (e: React.MouseEvent, v: VardiyaBildirimi) => {
    const target = e.target as HTMLElement;
    if (target && target.closest && target.closest('button, a, input, label, textarea, select')) {
      return;
    }
    setSelectedVardiya(v);
    setShowDetailModal(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  // Pull-to-refresh handler
  const handleRefresh = async () => {
    try {
      await fetchData();
    } catch (error) {
      console.error('Yenileme hatası:', error);
      // Sessizce devam et - kullanıcıya hata gösterme
    }
  };

  // Saha bazlı istatistikler
  const sahaStats = sahalar.map(saha => {
    const sahaVardiyalar = vardiyaBildirimleri.filter(v => v.sahaId === saha.id);
    return {
      sahaId: saha.id,
      sahaAdi: saha.ad,
      toplam: sahaVardiyalar.length,
      normal: sahaVardiyalar.filter(v => v.durum === 'normal').length,
      dikkat: sahaVardiyalar.filter(v => v.durum === 'dikkat').length,
      acil: sahaVardiyalar.filter(v => v.durum === 'acil').length
    };
  });

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="space-y-4 pb-20 md:pb-0">
      {/* Modern Header - Arızalar Tarzı */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Shield className="w-6 h-6 sm:w-7 sm:h-7 text-blue-500" />
              VARDIYA BİLDİRİMLERİ
            </h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">
              {filteredBildirimler.length} bildirim • {sahalar.length} saha
            </p>
          </div>
          {/* Desktop Butonlar */}
          {canPerformAction('vardiya_ekle') && (
            <div className="hidden sm:flex gap-2">
              <Button 
                onClick={() => setShowCreateModal(true)}
                className="bg-green-500 text-white hover:bg-green-600"
              >
                <Plus className="h-4 w-4 mr-2" />
                Yeni Vardiya
              </Button>
            </div>
          )}
          {/* Mobil Buton */}
          {canPerformAction('vardiya_ekle') && (
            <div className="flex sm:hidden">
              <Button 
                onClick={() => setShowCreateModal(true)}
                size="sm"
                className="bg-green-500 text-white hover:bg-green-600 px-3 py-2"
              >
                <Plus className="h-4 w-4 mr-2" />
                Yeni Vardiya
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Filtreler - Arızalar Tarzı */}
      <Card>
        <CardContent className="p-4">
          <div className="space-y-3">
            {/* Mobil: grid-cols-1, Tablet+: grid-cols-2 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                value={sahaFilter}
                onChange={(e) => setSahaFilter(e.target.value)}
              >
                <option value="all">Tüm Sahalar</option>
                {sahalar.map(s => (
                  <option key={s.id} value={s.id}>{s.ad}</option>
                ))}
              </select>

              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">Tüm Durumlar</option>
                <option value="normal">✓ Normal</option>
                <option value="dikkat">⚠️ Dikkat</option>
                <option value="acil">🚨 Acil</option>
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                value={shiftTypeFilter}
                onChange={(e) => setShiftTypeFilter(e.target.value)}
              >
                <option value="all">Tüm Vardiyalar</option>
                <option value="sabah">☀️ Sabah</option>
                <option value="ogle">🌤️ Öğle</option>
                <option value="aksam">🌆 Akşam</option>
                <option value="gece">🌙 Gece</option>
              </select>

              {/* Görünüm Seçimi */}
              <div className="inline-flex rounded-md overflow-hidden border h-10">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-3 py-2 text-sm ${viewMode === 'grid' ? 'bg-gray-100 font-medium' : ''}`}
                >
                  Grid
                </button>
                <button
                  onClick={() => setViewMode('timeline')}
                  className={`px-3 py-2 text-sm ${viewMode === 'timeline' ? 'bg-gray-100 font-medium' : ''}`}
                >
                  Liste
                </button>
                <button
                  onClick={() => setViewMode('map')}
                  className={`px-3 py-2 text-sm ${viewMode === 'map' ? 'bg-gray-100 font-medium' : ''}`}
                >
                  Harita
                </button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
        
        {filteredBildirimler.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                {sahaFilter === 'all' ? 'Henüz vardiya bildirimi yok' : 'Bu sahada bildirim bulunamadı'}
              </h3>
              <p className="text-gray-600 mb-6">
                {sahaFilter === 'all' 
                  ? 'Yeni bir vardiya bildirimi oluşturarak başlayın.'
                  : 'Farklı bir saha seçin veya filtreleri değiştirin.'
                }
              </p>
              {canPerformAction('vardiya_ekle') && (
                <Button onClick={() => setShowCreateModal(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  İlk Vardiya Bildirimini Oluştur
                </Button>
              )}
            </div>
          </div>
        ) : viewMode === 'grid' ? (
          // Basit Kart Görünümü - Arızalar Gibi
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredBildirimler.map((bildirim) => {
              const isNew = isNewItem(bildirim.tarih);
              const jsd = toJsDate((bildirim as any).tarih);
              
              return (
                <Card
                  key={bildirim.id}
                  className={`cursor-pointer transition-all duration-200 ${isNew ? 'ring-2 ring-blue-400' : ''}`}
                  onClick={() => { setSelectedVardiya(bildirim); setShowDetailModal(true); }}
                >
                  <CardContent className="p-3 space-y-2">
                    {/* Header: Vardiya Tipi + Durum */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">
                          {bildirim.vardiyaTipi === 'sabah' ? '☀️' :
                           bildirim.vardiyaTipi === 'ogle' ? '🌤️' :
                           bildirim.vardiyaTipi === 'aksam' ? '🌇' : '🌙'}
                        </span>
                        <div>
                          <div className="font-semibold text-gray-900">{getVardiyaLabel(bildirim.vardiyaTipi)}</div>
                          <div className="text-xs text-gray-500">
                            {bildirim.vardiyaSaatleri?.baslangic}-{bildirim.vardiyaSaatleri?.bitis}
                          </div>
                        </div>
                      </div>
                      <StatusBadge status={bildirim.durum} />
                    </div>

                    {/* Bilgiler */}
                    <div className="space-y-1 text-xs text-gray-600">
                      <div className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5" />
                        <span className="truncate">{bildirim.olusturanAdi}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5" />
                        <span className="truncate">{bildirim.sahaAdi}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{jsd ? formatDate(jsd) : '-'}</span>
                      </div>
                    </div>

                    {/* Alt: İşler & Fotoğraflar */}
                    <div className="flex items-center justify-between text-xs">
                      {bildirim.yapılanIsler && bildirim.yapılanIsler.length > 0 && (
                        <span className="text-green-600 font-semibold">✓ {bildirim.yapılanIsler.length} iş</span>
                      )}
                      {bildirim.fotograflar && bildirim.fotograflar.length > 0 && (
                        <span className="text-gray-500">📷 {bildirim.fotograflar.length}</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : viewMode === 'timeline' ? (
          // Saha + Vardiya Tipi Gruplu Görünüm
          <div className="space-y-6">
              {(() => {
                // Saha bazlı grupla
                const sahaGroups: Record<string, VardiyaBildirimi[]> = {};
                filteredBildirimler.forEach((v) => {
                  const sahaKey = v.sahaId || 'unknown';
                  if (!sahaGroups[sahaKey]) sahaGroups[sahaKey] = [];
                  sahaGroups[sahaKey].push(v);
                });

                // Sahalar alfabetik sırala
                const sahaKeys = Object.keys(sahaGroups).sort((a, b) => {
                  const sahaA = sahaGroups[a][0]?.sahaAdi || '';
                  const sahaB = sahaGroups[b][0]?.sahaAdi || '';
                  return sahaA.localeCompare(sahaB, 'tr');
                });

                return sahaKeys.map((sahaKey) => {
                  const sahaVardiyalar = sahaGroups[sahaKey];
                  const sahaAdi = sahaVardiyalar[0]?.sahaAdi || 'Bilinmeyen Saha';
                  
                  // Vardiya tipine göre grupla
                  const vardiyaTipGroups: Record<string, VardiyaBildirimi[]> = {};
                  sahaVardiyalar.forEach((v) => {
                    if (!vardiyaTipGroups[v.vardiyaTipi]) vardiyaTipGroups[v.vardiyaTipi] = [];
                    vardiyaTipGroups[v.vardiyaTipi].push(v);
                  });

                  // Vardiya tipi sıralaması
                  const vardiyaOrder = ['sabah', 'ogle', 'aksam', 'gece'];
                  const vardiyaTipKeys = Object.keys(vardiyaTipGroups).sort((a, b) => 
                    vardiyaOrder.indexOf(a) - vardiyaOrder.indexOf(b)
                  );

                  // Saha istatistikleri
                  const sahaStats = {
                    normal: sahaVardiyalar.filter(v => v.durum === 'normal').length,
                    dikkat: sahaVardiyalar.filter(v => v.durum === 'dikkat').length,
                    acil: sahaVardiyalar.filter(v => v.durum === 'acil').length
                  };

                  return (
                    <div key={sahaKey} className="bg-gray-50 rounded-xl p-3 sm:p-4 border-2 border-gray-200">
                      {/* Saha Başlığı */}
                      <div className="flex items-center justify-between mb-3 pb-3 border-b-2 border-gray-300">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Building2 className="h-5 w-5 text-white" />
                          </div>
                          <div className="min-w-0">
                            <h3 className="text-base font-black text-gray-900 truncate">{sahaAdi}</h3>
                            <p className="text-xs text-gray-600">{sahaVardiyalar.length} vardiya</p>
                          </div>
                        </div>
                        
                        {/* İstatistikler */}
                        <div className="flex gap-2 flex-shrink-0">
                          {sahaStats.normal > 0 && (
                            <span className="px-2 py-1 rounded-lg bg-green-500 text-white text-xs font-bold">
                              {sahaStats.normal}
                            </span>
                          )}
                          {sahaStats.dikkat > 0 && (
                            <span className="px-2 py-1 rounded-lg bg-yellow-500 text-white text-xs font-bold">
                              {sahaStats.dikkat}
                            </span>
                          )}
                          {sahaStats.acil > 0 && (
                            <span className="px-2 py-1 rounded-lg bg-red-500 text-white text-xs font-bold animate-pulse">
                              {sahaStats.acil}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Vardiya Grupları */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                        {vardiyaTipKeys.map((vardiyaTip) => {
                          const vardiyalar = vardiyaTipGroups[vardiyaTip];
                          const vardiyaLabel = getVardiyaLabel(vardiyaTip);
                          const vardiyaEmoji = vardiyaTip === 'sabah' ? '☀️' :
                                              vardiyaTip === 'ogle' ? '🌤️' :
                                              vardiyaTip === 'aksam' ? '🌇' : '🌙';
                          const vardiyaBg = vardiyaTip === 'sabah' ? 'from-yellow-100 to-amber-100' :
                                           vardiyaTip === 'ogle' ? 'from-orange-100 to-red-100' :
                                           vardiyaTip === 'aksam' ? 'from-indigo-100 to-purple-100' :
                                           'from-purple-100 to-violet-100';

                          return (
                            <div key={vardiyaTip} className="bg-white rounded-lg border-2 border-gray-200 overflow-hidden">
                              {/* Vardiya Başlık */}
                              <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-b border-gray-200">
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  <span className={`text-2xl ${
                                    vardiyaTip === 'sabah' ? 'animate-spin animate-glow' :
                                    vardiyaTip === 'ogle' ? 'animate-float animate-glow' :
                                    vardiyaTip === 'aksam' ? 'animate-pulse' :
                                    'animate-pulse'
                                  }`} style={{
                                    animationDuration: vardiyaTip === 'sabah' ? '10s' : vardiyaTip === 'ogle' ? '3s' : '2s'
                                  }}>
                                    {vardiyaEmoji}
                                  </span>
                                  <span className="text-sm font-bold text-gray-900">{vardiyaLabel}</span>
                                </div>
                                <span className="text-xs font-bold text-gray-700 bg-gray-200 px-2 py-0.5 rounded">
                                  {vardiyalar.length}
                                </span>
                              </div>

                              {/* Kartlar - Dikey Liste */}
                              <div className="p-2 space-y-2">
                                {vardiyalar.map((v, idx) => {
                                  const s = getSecurityScore(v);
                                  const isNew = isNewItem(v.tarih);
                                  const jsd = toJsDate((v as any).tarih);
                                  const timeStr = jsd ? jsd.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) : '';

                                  return (
                                    <div 
                                      key={v.id}
                                      role="button" 
                                      tabIndex={0} 
                                      onClick={(e)=>onCardClick(e, v)} 
                                      onKeyDown={(e)=>{ if(e.key==='Enter'){ setSelectedVardiya(v); setShowDetailModal(true);} }} 
                                      className={`
                                        cursor-pointer bg-gray-50 rounded-lg hover:bg-gray-100
                                        transition-all duration-200 overflow-hidden border-l-4
                                        ${v.durum === 'acil' ? 'border-red-500' :
                                          v.durum === 'dikkat' ? 'border-yellow-500' : 'border-green-500'}
                                        ${isNew ? 'ring-1 ring-blue-400' : ''}
                                        hover:shadow-md
                                      `}
                                    >
                                      <div className="p-2">
                                        {/* Header: Tarih + Durum */}
                                        <div className="flex items-center justify-between mb-1">
                                          <span className="text-[9px] font-medium text-gray-600">
                                            {jsd?.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' })}
                                          </span>
                                          <div className={`
                                            px-1.5 py-0.5 rounded text-[9px] font-bold
                                            ${v.durum === 'acil' ? 'bg-red-500 text-white animate-pulse' :
                                              v.durum === 'dikkat' ? 'bg-yellow-500 text-white' :
                                              'bg-green-500 text-white'
                                            }
                                          `}>
                                            {v.durum === 'acil' ? '🚨' : v.durum === 'dikkat' ? '⚠️' : '✓'}
                                          </div>
                                        </div>

                                        {/* Bekçi */}
                                        <div className="flex items-center gap-1.5 mb-1.5">
                                          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center flex-shrink-0">
                                            {v.olusturanFotoUrl && !brokenImages.has(v.olusturanId) ? (
                                              <img 
                                                src={v.olusturanFotoUrl}
                                                alt={v.olusturanAdi}
                                                className="w-full h-full object-cover rounded-full"
                                                onError={() => setBrokenImages(prev => new Set(prev).add(v.olusturanId))}
                                              />
                                            ) : (
                                              <User className="h-2.5 w-2.5 text-white" />
                                            )}
                                          </div>
                                          <span className="text-[10px] font-semibold text-gray-900 truncate flex-1">{v.olusturanAdi}</span>
                                        </div>

                                          {/* Harita - Küçük */}
                                        {(v as any).konum && (
                                          <div className="rounded overflow-hidden border border-gray-300 mb-1.5">
                                            <MiniLocationMap 
                                              lat={(v as any).konum.lat}
                                              lng={(v as any).konum.lng}
                                              status={v.durum === 'acil' ? 'ariza' : v.durum === 'dikkat' ? 'bakim' : 'normal'}
                                              variant="guard"
                                              shiftType={v.vardiyaTipi as any}
                                              mapType="satellite"
                                              height={60}
                                            />
                                          </div>
                                        )}

                                        {/* Fotoğraflar - Mini */}
                                        {v.fotograflar && v.fotograflar.length > 0 && (
                                          <div className="flex gap-0.5 mb-1">
                                            {v.fotograflar.slice(0, 2).map((foto, idx) => (
                                              <div key={idx} className="w-10 h-10 rounded overflow-hidden border border-gray-300">
                                                <img 
                                                  src={foto} 
                                                  alt={`${idx + 1}`}
                                                  className="w-full h-full object-cover"
                                                />
                                              </div>
                                            ))}
                                            {v.fotograflar.length > 2 && (
                                              <div className="w-10 h-10 rounded bg-gray-200 flex items-center justify-center text-[8px] font-bold text-gray-700">
                                                +{v.fotograflar.length - 2}
                                              </div>
                                            )}
                                          </div>
                                        )}

                                        {/* Güvenlik Kontrolleri */}
                                        {v.guvenlikKontrolleri && (
                                          <div className="flex gap-1 mb-1 flex-wrap">
                                            {v.guvenlikKontrolleri.aydinlatmaKontrol && (
                                              <span className="text-xs" title="Aydınlatma">💡</span>
                                            )}
                                            {v.guvenlikKontrolleri.telOrguKontrol && (
                                              <span className="text-xs" title="Tel Örgü/Çit">🏗️</span>
                                            )}
                                            {v.guvenlikKontrolleri.kameraKontrol && (
                                              <span className="text-xs" title="Kamera">📹</span>
                                            )}
                                            {v.guvenlikKontrolleri.girisKontrol && (
                                              <span className="text-xs" title="Giriş Kontrol">🚪</span>
                                            )}
                                          </div>
                                        )}

                                        {/* Yapılan İşler */}
                                        {v.yapılanIsler && v.yapılanIsler.length > 0 && (
                                          <div className="text-[9px] text-gray-600 mb-1">
                                            <span className="font-semibold">✓</span> {v.yapılanIsler.length} iş yapıldı
                                          </div>
                                        )}

                                        {/* Notlar */}
                                        {v.aciklama && (
                                          <div className="text-[9px] text-gray-600 italic line-clamp-1">
                                            📝 {v.aciklama}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                });
              })()}
          </div>
        ) : (
          // Modern Harita Görünümü
          <div className="space-y-4">
            {(() => {
              // Sadece bugüne ait vardiyalar
              const today = new Date();
              const withCoords = filteredBildirimler.filter(v => {
                const k = (v as any).konum;
                if (!k || !k.lat || !k.lng) return false;
                const d = toJsDate((v as any).tarih);
                if (!d) return false;
                return (
                  d.getFullYear() === today.getFullYear() &&
                  d.getMonth() === today.getMonth() &&
                  d.getDate() === today.getDate()
                );
              });
              if (withCoords.length === 0) {
                return (
                  <Card>
                    <CardContent className="p-12 text-center">
                      <MapPin className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Bugün için konum yok</h3>
                      <p className="text-gray-600">Harita sadece bugünkü vardiyaları gösterir.</p>
                    </CardContent>
                  </Card>
                );
              }
              
              // Duruma göre filtrele
              const filteredCoords = withCoords.filter(v => {
                if (v.durum==='normal' && !mapStatus.normal) return false;
                if (v.durum==='dikkat' && !mapStatus.dikkat) return false;
                if (v.durum==='acil' && !mapStatus.acil) return false;
                return true;
              });
              
              return (
                <div className="space-y-4">
                  {/* Harita Kontrol Paneli - Kompakt - Mobil Uyumlu */}
                  <div className="bg-white rounded-lg shadow-sm p-2 md:p-3 border border-gray-200">
                    <div className="flex items-center justify-between flex-wrap gap-1.5 md:gap-2">
                      <div className="flex items-center gap-1.5 md:gap-2">
                        <div className="p-1 md:p-1.5 bg-gradient-to-br from-red-500 to-pink-500 rounded-lg">
                          <MapPin className="h-3.5 w-3.5 md:h-4 md:w-4 text-white" />
                        </div>
                        <div>
                          <h3 className="text-xs md:text-sm font-bold text-gray-900">Harita Görünümü</h3>
                          <p className="text-[10px] md:text-xs text-gray-600">{filteredCoords.length} konum</p>
                        </div>
                      </div>
                      
                      {/* Filtreler - Kompakt */}
                      <div className="flex items-center gap-1">
                        <button 
                          onClick={()=>setMapStatus(s=>({...s, normal: !s.normal}))} 
                          className={`px-2 py-1 rounded text-xs font-semibold transition-all flex items-center gap-1 ${
                            mapStatus.normal
                              ? 'bg-green-500 text-white' 
                              : 'bg-gray-100 text-gray-400'
                          }`}
                        >
                          <span className={`w-2 h-2 rounded-full ${mapStatus.normal ? 'bg-white' : 'bg-green-500'}`}></span>
                          {stats.normal}
                        </button>
                        <button 
                          onClick={()=>setMapStatus(s=>({...s, dikkat: !s.dikkat}))} 
                          className={`px-2 py-1 rounded text-xs font-semibold transition-all flex items-center gap-1 ${
                            mapStatus.dikkat
                              ? 'bg-yellow-500 text-white' 
                              : 'bg-gray-100 text-gray-400'
                          }`}
                        >
                          <span className={`w-2 h-2 rounded-full ${mapStatus.dikkat ? 'bg-white' : 'bg-yellow-500'}`}></span>
                          {stats.dikkat}
                        </button>
                        <button 
                          onClick={()=>setMapStatus(s=>({...s, acil: !s.acil}))} 
                          className={`px-2 py-1 rounded text-xs font-semibold transition-all flex items-center gap-1 ${
                            mapStatus.acil
                              ? 'bg-red-500 text-white animate-pulse' 
                              : 'bg-gray-100 text-gray-400'
                          }`}
                        >
                          <span className={`w-2 h-2 rounded-full ${mapStatus.acil ? 'bg-white' : 'bg-red-500'}`}></span>
                          {stats.acil}
                        </button>
                        <div className="hidden sm:flex items-center gap-2 ml-2">
                          <span className="text-xs text-gray-500">Harita:</span>
                          <select 
                            value={mapType}
                            onChange={(e)=>setMapType(e.target.value as any)}
                            className="border rounded px-2 py-1 text-xs"
                          >
                            <option value="satellite">Uydu</option>
                            <option value="terrain">Arazi</option>
                            <option value="roadmap">Yol</option>
                            <option value="hybrid">Karma</option>
                          </select>
                          <div className="flex items-center gap-1">
                            <button className="text-xs border rounded px-2 py-1" onClick={()=>setMapHeight(h=>Math.max(240, h-60))}>-</button>
                            <button className="text-xs border rounded px-2 py-1" onClick={()=>setMapHeight(h=>Math.min(640, h+60))}>+</button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Harita - Dashboard MiniClusterMap teması */}
                  {(() => {
                    const points = filteredCoords.map(v => ({
                      lat: (v as any).konum.lat,
                      lng: (v as any).konum.lng,
                      title: v.sahaAdi,
                      subtitle: v.santralAdi ? v.santralAdi : `${getVardiyaLabel(v.vardiyaTipi)} • ${v.vardiyaSaatleri?.baslangic || ''}-${v.vardiyaSaatleri?.bitis || ''}`,
                      status: v.durum === 'acil' ? 'ariza' : v.durum === 'dikkat' ? 'bakim' : 'normal',
                      shiftType: v.vardiyaTipi as any,
                      details: [
                        { label: 'Vardiya', value: getVardiyaLabel(v.vardiyaTipi) },
                        { label: 'Saat', value: `${v.vardiyaSaatleri?.baslangic || ''}-${v.vardiyaSaatleri?.bitis || ''}` },
                        { label: 'Durum', value: v.durum }
                      ]
                    }));
                    return (
                      <MiniClusterMap 
                        points={points}
                        mapType={mapType}
                        height={mapHeight}
                        variant="guard"
                      />
                    );
                  })()}

                  {/* Lokasyon Listesi - Kompakt - Mobil Uyumlu */}
                  <div>
                    <div className="bg-gray-50 rounded-lg p-1.5 md:p-2 mb-2 border border-gray-200">
                      <h3 className="text-[10px] md:text-xs font-bold text-gray-900 flex items-center gap-1 md:gap-1.5">
                        <Building2 className="h-3 w-3 md:h-3.5 md:w-3.5 text-blue-600" />
                        Vardiya Lokasyonları ({filteredCoords.length})
                      </h3>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
                      {filteredCoords.map((v, idx) => {
                        const isNew = isNewItem(v.tarih);
                        const jsd = toJsDate((v as any).tarih);
                        const timeStr = jsd ? jsd.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) : '';
                        
                        return (
                          <div 
                            key={v.id}
                            role="button"
                            tabIndex={0}
                            onClick={(e)=>onCardClick(e, v)}
                            onKeyDown={(e)=>{ if(e.key==='Enter'){ setSelectedVardiya(v); setShowDetailModal(true);} }}
                            className={`cursor-pointer bg-white rounded-lg shadow-sm hover:shadow-md transition-all overflow-hidden ${
                              isNew ? 'ring-1 ring-blue-400' : 'border border-gray-200'
                            } hover:scale-[1.01]`}
                          >
                            {/* Üst Renkli Çizgi */}
                            <div className={`h-1 ${
                              v.durum === 'acil' ? 'bg-red-500' :
                              v.durum === 'dikkat' ? 'bg-yellow-500' : 'bg-green-500'
                            }`} />
                            
                            <div className="p-2">
                              {/* Header Kompakt (saat/emoji kaldırıldı) */}
                              <div className="flex items-center justify-between mb-1.5">
                                <div>
                                  <p className="text-[9px] text-gray-500">{getVardiyaLabel(v.vardiyaTipi)}</p>
                                </div>
                                <div className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                  v.durum === 'acil' ? 'bg-red-500 text-white' :
                                  v.durum === 'dikkat' ? 'bg-yellow-500 text-white' :
                                  'bg-green-500 text-white'
                                }`}>
                                  {v.durum === 'acil' ? '🚨' : v.durum === 'dikkat' ? '⚠️' : '✓'}
                                </div>
                              </div>

                              {/* Saha */}
                              <div className="p-1.5 bg-gray-50 rounded mb-1.5 flex items-center gap-1.5">
                                <Building2 className="h-3 w-3 text-blue-600 flex-shrink-0" />
                                <p className="text-[10px] font-semibold text-gray-900 truncate flex-1">{v.sahaAdi}</p>
                              </div>

                              {/* Fotoğraflar Mini */}
                              {v.fotograflar && v.fotograflar.length > 0 && (
                                <div className="flex gap-1 mb-1.5">
                                  {v.fotograflar.slice(0, 3).map((foto, idx) => (
                                    <div key={idx} className="w-8 h-8 rounded overflow-hidden border border-gray-200">
                                      <img 
                                        src={foto} 
                                        alt={`${idx + 1}`}
                                        className="w-full h-full object-cover"
                                      />
                                    </div>
                                  ))}
                                  {v.fotograflar.length > 3 && (
                                    <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center text-[8px] font-bold text-gray-600">
                                      +{v.fotograflar.length - 3}
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Konum Link */}
                              <a 
                                href={generateGoogleMapsUrls({ 
                                  lat: (v as any).konum.lat, 
                                  lng: (v as any).konum.lng 
                                }).viewUrl}
                                target="_blank" 
                                rel="noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="w-full flex items-center justify-center gap-1 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold"
                              >
                                <MapPin className="h-3 w-3" />
                                Harita
                              </a>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

      {/* Vardiya Oluşturma Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => { setShowCreateModal(false); setDraftDate(undefined); }}
        title="Yeni Vardiya Bildirimi"
        size="lg"
      >
        <VardiyaForm
          onSuccess={() => {
            setShowCreateModal(false);
            fetchData();
          }}
          onCancel={() => { setShowCreateModal(false); setDraftDate(undefined); }}
          initialDate={draftDate}
        />
      </Modal>

      {/* Detay Modal */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedVardiya(null);
        }}
        title="Vardiya Detayları"
        size="lg"
      >
        {selectedVardiya && (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b">
              <div className="flex items-center gap-3">
                {getVardiyaIcon(selectedVardiya.vardiyaTipi)}
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {getVardiyaLabel(selectedVardiya.vardiyaTipi)} Vardiyası
                  </h3>
                  <p className="text-sm text-gray-500">
                    {`${formatDate((selectedVardiya as any).tarih, 'dd.MM.yyyy')} ${selectedVardiya.vardiyaSaatleri?.baslangic || ''} - ${selectedVardiya.vardiyaSaatleri?.bitis || ''}`}
                  </p>
                </div>
              </div>
              <Badge variant={getDurumBadgeVariant(selectedVardiya.durum)}>
                {selectedVardiya.durum.charAt(0).toUpperCase() + selectedVardiya.durum.slice(1)}
              </Badge>
            </div>

            {/* Lokasyon */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Lokasyon</h4>
              <p className="text-gray-900">{selectedVardiya.sahaAdi}</p>
              {selectedVardiya.santralAdi && (
                <p className="text-sm text-gray-600">{selectedVardiya.santralAdi}</p>
              )}
              {selectedVardiya.konum && (
                <div className="mt-2 text-sm text-gray-700 space-y-1">
                  <p>Koordinatlar: {selectedVardiya.konum.lat.toFixed(5)}, {selectedVardiya.konum.lng.toFixed(5)}</p>
                  {selectedVardiya.konum.adres && <p>Adres: {selectedVardiya.konum.adres}</p>}
                  <div className="flex gap-3">
                    <a
                      href={generateGoogleMapsUrls({ lat: selectedVardiya.konum.lat, lng: selectedVardiya.konum.lng }).viewUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 hover:underline"
                    >Haritada Aç</a>
                    <a
                      href={generateGoogleMapsUrls({ lat: selectedVardiya.konum.lat, lng: selectedVardiya.konum.lng }).directionsUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 hover:underline"
                    >Yol Tarifi</a>
                  </div>
                  {(() => {
                    const key = getGoogleMapsApiKey();
                    const urlFactory = generateGoogleMapsUrls({ lat: selectedVardiya.konum.lat, lng: selectedVardiya.konum.lng }).staticMapUrl;
                    const url = urlFactory(key, 640, 240, 15, 'satellite');
                    return url ? (
                      <img src={url} alt="Konum haritası" className="mt-2 rounded border" />
                    ) : null;
                  })()}
                </div>
              )}
            </div>

            {/* Sorumlu */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Vardiya Sorumlusu</h4>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden">
                  {selectedVardiya.olusturanFotoUrl && !brokenImages.has(selectedVardiya.olusturanId) ? (
                    <img 
                      src={selectedVardiya.olusturanFotoUrl}
                      alt={selectedVardiya.olusturanAdi}
                      className="w-full h-full object-cover"
                      onError={() => {
                        setBrokenImages(prev => new Set(prev).add(selectedVardiya.olusturanId));
                      }}
                    />
                  ) : (
                    <User className="h-5 w-5 text-blue-600" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    {selectedVardiya.olusturanAdi}
                  </p>
                  <p className="text-sm text-gray-600">
                    {selectedVardiya.olusturanRol}
                  </p>
                </div>
              </div>
            </div>

            {/* Personeller */}
            {selectedVardiya.personeller && selectedVardiya.personeller.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  Vardiya Personeli ({selectedVardiya.personeller.length})
                </h4>
                <div className="flex flex-wrap gap-2">
                  {selectedVardiya.personeller.map((p, index) => (
                    <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                      {p.ad} ({p.rol})
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Güvenlik Kontrolleri */}
            {selectedVardiya.guvenlikKontrolleri && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Güvenlik Kontrolleri</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {Object.entries(selectedVardiya.guvenlikKontrolleri).map(([key, value]) => {
                    if (key === 'notlar') return null;
                    return (
                      <div key={key} className="flex items-center gap-2">
                        {value ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <X className="h-4 w-4 text-gray-400" />
                        )}
                        <span className="text-sm text-gray-700">
                          {key === 'kameraKontrol' && 'Kamera Sistemleri'}
                          {key === 'telOrguKontrol' && 'Tel Örgü/Çit'}
                          {key === 'aydinlatmaKontrol' && 'Aydınlatma'}
                          {key === 'girisKontrol' && 'Giriş Kontrol'}
                        </span>
                      </div>
                    );
                  })}
                </div>
                {selectedVardiya.guvenlikKontrolleri.notlar && (
                  <p className="text-sm text-gray-600 mt-2">
                    Not: {selectedVardiya.guvenlikKontrolleri.notlar}
                  </p>
                )}
              </div>
            )}

            {/* Yapılan İşler */}
            {selectedVardiya.yapılanIsler && selectedVardiya.yapılanIsler.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Yapılan İşler</h4>
                <ul className="list-disc list-inside space-y-1">
                  {selectedVardiya.yapılanIsler.map((is, index) => (
                    <li key={index} className="text-sm text-gray-600">{is}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Notlar */}
            {selectedVardiya.aciklama && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Notlar</h4>
                <p className="text-sm text-gray-600">{selectedVardiya.aciklama}</p>
              </div>
            )}

            {/* Fotoğraflar */}
            {selectedVardiya.fotograflar && selectedVardiya.fotograflar.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  Fotoğraflar ({selectedVardiya.fotograflar.length})
                </h4>
                <div className="grid grid-cols-3 gap-2">
                  {selectedVardiya.fotograflar.map((foto, index) => (
                    <img
                      key={index}
                      src={foto}
                      alt={`Vardiya ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg cursor-pointer hover:opacity-90"
                      onClick={() => window.open(foto, '_blank')}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* İşlemler */}
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedVardiya(null);
                }}
              >
                Kapat
              </Button>
              {userProfile && (
                // Bekçi sadece kendi oluşturduklarını silebilir, diğer roller hepsini silebilir
                (userProfile.id === selectedVardiya.olusturanId || 
                 ['yonetici', 'muhendis', 'tekniker', 'superadmin'].includes(userProfile.rol)) &&
                canPerformAction('vardiya_sil')
              ) && (
                <Button
                  variant="danger"
                  onClick={() => {
                    handleDelete(selectedVardiya.id!);
                    setShowDetailModal(false);
                    setSelectedVardiya(null);
                  }}
                >
                  Sil
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
    </PullToRefresh>
  );
};

export default VardiyaBildirimleri;
