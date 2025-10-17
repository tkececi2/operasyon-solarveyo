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
  List,
  Trash2
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
import { vardiyaService, type VardiyaBildirimi, addVardiyaYorum, toggleVardiyaReaction } from '../../services/vardiyaService';
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
  const [quickRange, setQuickRange] = useState<'none' | 'today' | 'yesterday' | '7d' | 'month'>('today');
  const [showMobileFilters, setShowMobileFilters] = useState<boolean>(false);
  const [brokenImages, setBrokenImages] = useState<Set<string>>(new Set());
  const [mapStatus, setMapStatus] = useState<{ normal: boolean; dikkat: boolean; acil: boolean }>({ normal: true, dikkat: true, acil: true });
  const [mapType, setMapType] = useState<'roadmap' | 'satellite' | 'terrain' | 'hybrid'>('satellite');
  const [mapHeight, setMapHeight] = useState<number>(360);

  // Gerçek veriler - Firebase'den gelecek
  const [vardiyaBildirimleri, setVardiyaBildirimleri] = useState<VardiyaBildirimi[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Yorum ve Reaction state - Her kart için ayrı
  const [yorumInputs, setYorumInputs] = useState<Record<string, string>>({});
  const [isAddingYorum, setIsAddingYorum] = useState<string | null>(null); // Hangi kart için yorum ekleniyor
  const [expandedSahalar, setExpandedSahalar] = useState<Set<string>>(new Set());

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

  // Hızlı tarih aralığı değiştiğinde tarih filtrelerini otomatik ayarla
  useEffect(() => {
    const today = new Date();
    // Yerel zamana göre tarih formatla (timezone sorunlarını önlemek için)
    const formatDate = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    switch (quickRange) {
      case 'today':
        setStartDate(formatDate(today));
        setEndDate(formatDate(today));
        break;
      case 'yesterday':
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        setStartDate(formatDate(yesterday));
        setEndDate(formatDate(yesterday));
        break;
      case '7d':
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        setStartDate(formatDate(weekAgo));
        setEndDate(formatDate(today));
        break;
      case 'month':
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        setStartDate(formatDate(monthStart));
        setEndDate(formatDate(today));
        break;
      case 'none':
        setStartDate('');
        setEndDate('');
        break;
    }
  }, [quickRange]);

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
      case 'sabah': return '08:00 - 10:00';
      case 'ogle': return '15:00 - 17:00';
      case 'aksam': return '20:00 - 22:00';
      case 'gece': return '03:00 - 05:00';
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

  // Yorum ekleme
  const handleAddYorum = async (vardiyaId: string) => {
    const yorum = yorumInputs[vardiyaId];
    if (!yorum?.trim() || !userProfile) return;
    
    setIsAddingYorum(vardiyaId);
    try {
      await addVardiyaYorum(
        vardiyaId,
        userProfile.id,
        userProfile.ad,
        userProfile.rol,
        yorum.trim()
      );
      
      const newYorum = {
        id: `${Date.now()}-${Math.random()}`,
        userId: userProfile.id,
        userAdi: userProfile.ad,
        userRol: userProfile.rol,
        yorum: yorum.trim(),
        tarih: new Date() as any // Timestamp olarak gönderilir
      };
      
      // State'i direkt güncelle - sayfayı yenileme
      setVardiyaBildirimleri(prev => prev.map(v => {
        if (v.id === vardiyaId) {
          return {
            ...v,
            yorumlar: [...(v.yorumlar || []), newYorum]
          } as VardiyaBildirimi;
        }
        return v;
      }));
      
      // Modal açıksa selectedVardiya'yı da güncelle
      if (selectedVardiya?.id === vardiyaId) {
        setSelectedVardiya(prev => prev ? {
          ...prev,
          yorumlar: [...(prev.yorumlar || []), newYorum]
        } : null);
      }
      
      // Bu kart için input'u temizle
      setYorumInputs(prev => ({...prev, [vardiyaId]: ''}));
      toast.success('Yorum eklendi');
    } catch (error) {
      console.error('Yorum ekleme hatası:', error);
      toast.error('Yorum eklenemedi');
    } finally {
      setIsAddingYorum(null);
    }
  };

  // Reaction toggle - sayfayı yenileme yapma, state'i direkt güncelle
  const handleToggleReaction = async (vardiyaId: string, reactionType: 'tamam' | 'tamamlandi') => {
    if (!userProfile) return;
    
    try {
      await toggleVardiyaReaction(vardiyaId, userProfile.id, reactionType);
      
      // State'i direkt güncelle
      setVardiyaBildirimleri(prev => prev.map(v => {
        if (v.id === vardiyaId) {
          const reactions = v.reactions || { tamam: [], tamamlandi: [] };
          const userIds = reactions[reactionType] || [];
          const hasReacted = userIds.includes(userProfile.id);
          
          return {
            ...v,
            reactions: {
              ...reactions,
              [reactionType]: hasReacted 
                ? userIds.filter(id => id !== userProfile.id)
                : [...userIds, userProfile.id]
            }
          } as VardiyaBildirimi;
        }
        return v;
      }));
    } catch (error) {
      console.error('Reaction hatası:', error);
      toast.error('İşlem başarısız');
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
      if (!startDate && !endDate) return true;
      
      // Firebase Timestamp'i güvenli şekilde Date'e çevir
      let d: Date;
      try {
        if (typeof (bildirim.tarih as any)?.toDate === 'function') {
          d = (bildirim.tarih as any).toDate();
        } else if (bildirim.tarih instanceof Date) {
          d = bildirim.tarih;
        } else if (typeof (bildirim.tarih as any)?.seconds === 'number') {
          d = new Date((bildirim.tarih as any).seconds * 1000);
        } else {
          return true; // Tarih çevrilemezse filtreleme
        }
      } catch {
        return true; // Hata durumunda filtreleme
      }
      
      // Tarihi sadece yıl-ay-gün olarak normalize et (timezone sorunlarını önlemek için)
      const normalizeDate = (date: Date) => {
        return new Date(date.getFullYear(), date.getMonth(), date.getDate());
      };
      
      const normalizedBildirimDate = normalizeDate(d);
      
      if (startDate) {
        const [year, month, day] = startDate.split('-').map(Number);
        const startDateNormalized = new Date(year, month - 1, day);
        if (normalizedBildirimDate < startDateNormalized) return false;
      }
      
      if (endDate) {
        const [year, month, day] = endDate.split('-').map(Number);
        const endDateNormalized = new Date(year, month - 1, day);
        if (normalizedBildirimDate > endDateNormalized) return false;
      }
      
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

  // Son 8 saatte eklenen vardiyaları kontrol et
  const isNewVardiya = (olusturmaTarihi: any) => {
    try {
      let createdDate: Date;
      if (typeof olusturmaTarihi?.toDate === 'function') {
        createdDate = olusturmaTarihi.toDate();
      } else if (olusturmaTarihi instanceof Date) {
        createdDate = olusturmaTarihi;
      } else if (typeof olusturmaTarihi?.seconds === 'number') {
        createdDate = new Date(olusturmaTarihi.seconds * 1000);
      } else {
        return false;
      }
      
      const now = new Date();
      const eightHoursAgo = new Date(now.getTime() - 8 * 60 * 60 * 1000);
      return createdDate >= eightHoursAgo;
    } catch {
      return false;
    }
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
      <div className="space-y-4 pb-20 md:pb-0 overflow-x-hidden">
      {/* Modern Header - Mobil Uyumlu */}
      <div className="flex flex-col gap-3 sm:gap-4">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Shield className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-blue-500 flex-shrink-0" />
              <span className="truncate">Vardiya Bildirimleri</span>
            </h1>
            <p className="text-xs sm:text-sm md:text-base text-gray-600 mt-1">
              {filteredBildirimler.length} bildirim • {sahalar.length} saha
            </p>
          </div>
          {/* Buton - Responsive */}
          {canPerformAction('vardiya_ekle') && (
            <Button
              onClick={() => setShowCreateModal(true)}
              size="sm"
              className="bg-green-500 text-white hover:bg-green-600 flex-shrink-0 ml-2"
            >
              <Plus className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Yeni Vardiya</span>
            </Button>
          )}
        </div>
      </div>

      {/* Filtreler - Mobil ve Desktop Uyumlu */}
      <Card>
        <CardContent className="p-3 sm:p-4">
          <div className="space-y-3">
            {/* Arama ve Mobil Filtre Butonu */}
            <div className="flex items-center gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Vardiya ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              {/* Mobilde Filtre Butonu */}
              <Button
                variant="secondary"
                size="sm"
                className="md:hidden"
                onClick={() => setShowMobileFilters(v => !v)}
              >
                <Filter className="w-4 h-4 mr-2" />
                Filtreler
              </Button>
            </div>

            {/* Desktop Filtreler (md ve üzeri) */}
                    <div className="hidden md:block space-y-3 overflow-x-hidden">
              {/* Tarih Filtreleri */}
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setQuickRange('today')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium whitespace-nowrap transition-all ${
                    quickRange === 'today'
                      ? 'bg-blue-500 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  📅 Bugün
                </button>
                <button
                  onClick={() => setQuickRange('yesterday')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium whitespace-nowrap transition-all ${
                    quickRange === 'yesterday'
                      ? 'bg-blue-500 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  📆 Dün
                </button>
                <button
                  onClick={() => setQuickRange('7d')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium whitespace-nowrap transition-all ${
                    quickRange === '7d'
                      ? 'bg-blue-500 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  📊 Son 7 Gün
                </button>
                <button
                  onClick={() => setQuickRange('month')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium whitespace-nowrap transition-all ${
                    quickRange === 'month'
                      ? 'bg-blue-500 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  📈 Bu Ay
                </button>
                <button
                  onClick={() => setQuickRange('none')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium whitespace-nowrap transition-all ${
                    quickRange === 'none'
                      ? 'bg-blue-500 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  🗂️ Tümü
                </button>
              </div>

              {/* Diğer Filtreler */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={sahaFilter}
                  onChange={(e) => setSahaFilter(e.target.value)}
                >
                  <option value="all">Tüm Sahalar</option>
                  {sahalar.map(s => (
                    <option key={s.id} value={s.id}>{s.ad}</option>
                  ))}
                </select>

                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">Tüm Durumlar</option>
                  <option value="normal">✓ Normal</option>
                  <option value="dikkat">⚠️ Dikkat</option>
                  <option value="acil">🚨 Acil</option>
                </select>

                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                <div className="grid grid-cols-3 gap-1 border rounded-md overflow-hidden h-10">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`text-sm font-medium transition-colors ${
                      viewMode === 'grid'
                        ? 'bg-blue-500 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Grid
                  </button>
                  <button
                    onClick={() => setViewMode('timeline')}
                    className={`text-sm font-medium transition-colors ${
                      viewMode === 'timeline'
                        ? 'bg-blue-500 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Liste
                  </button>
                  <button
                    onClick={() => setViewMode('map')}
                    className={`text-sm font-medium transition-colors ${
                      viewMode === 'map'
                        ? 'bg-blue-500 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Harita
                  </button>
                </div>
              </div>
            </div>

            {/* Mobil Filtre Paneli (showMobileFilters true ise) */}
            {showMobileFilters && (
              <div className="md:hidden border-t pt-3 space-y-2">
                {/* Tarih Filtreleri - Kompakt Grid */}
                <div className="grid grid-cols-3 gap-1">
                  <button
                    onClick={() => setQuickRange('today')}
                    className={`px-2 py-1.5 rounded text-[10px] font-medium transition-all ${
                      quickRange === 'today'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    Bugün
                  </button>
                  <button
                    onClick={() => setQuickRange('7d')}
                    className={`px-2 py-1.5 rounded text-[10px] font-medium transition-all ${
                      quickRange === '7d'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    7 Gün
                  </button>
                  <button
                    onClick={() => setQuickRange('month')}
                    className={`px-2 py-1.5 rounded text-[10px] font-medium transition-all ${
                      quickRange === 'month'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    Bu Ay
                  </button>
                </div>

                {/* Filtreler - Kompakt */}
                <div className="space-y-2">
                  <select
                    className="w-full px-2.5 py-2 border border-gray-300 rounded text-xs"
                    value={sahaFilter}
                    onChange={(e) => setSahaFilter(e.target.value)}
                  >
                    <option value="all">Tüm Sahalar</option>
                    {sahalar.map(s => (
                      <option key={s.id} value={s.id}>{s.ad}</option>
                    ))}
                  </select>

                  <div className="grid grid-cols-2 gap-2">
                    <select
                      className="w-full px-2.5 py-2 border border-gray-300 rounded text-xs"
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                    >
                      <option value="all">Tüm Durumlar</option>
                      <option value="normal">✓ Normal</option>
                      <option value="dikkat">⚠️ Dikkat</option>
                      <option value="acil">🚨 Acil</option>
                    </select>

                    <select
                      className="w-full px-2.5 py-2 border border-gray-300 rounded text-xs"
                      value={shiftTypeFilter}
                      onChange={(e) => setShiftTypeFilter(e.target.value)}
                    >
                      <option value="all">Tüm Vardiyalar</option>
                      <option value="sabah">☀️ Sabah</option>
                      <option value="ogle">🌤️ Öğle</option>
                      <option value="aksam">🌆 Akşam</option>
                      <option value="gece">🌙 Gece</option>
                    </select>
                  </div>

                  {/* Görünüm Seçimi - Mobil */}
                  <div className="grid grid-cols-3 gap-1 border rounded overflow-hidden">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`py-2 text-xs font-medium transition-colors ${
                        viewMode === 'grid'
                          ? 'bg-blue-500 text-white'
                          : 'bg-white text-gray-700'
                      }`}
                    >
                      Grid
                    </button>
                    <button
                      onClick={() => setViewMode('timeline')}
                      className={`py-2 text-xs font-medium transition-colors ${
                        viewMode === 'timeline'
                          ? 'bg-blue-500 text-white'
                          : 'bg-white text-gray-700'
                      }`}
                    >
                      Liste
                    </button>
                    <button
                      onClick={() => setViewMode('map')}
                      className={`py-2 text-xs font-medium transition-colors ${
                        viewMode === 'map'
                          ? 'bg-blue-500 text-white'
                          : 'bg-white text-gray-700'
                      }`}
                    >
                      Harita
                    </button>
                  </div>
                </div>
              </div>
            )}
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
          // Grid Görünümü - Kompakt
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-3">
            {filteredBildirimler.map((bildirim) => {
              const isNew = isNewVardiya(bildirim.olusturmaTarihi);
              const jsd = toJsDate((bildirim as any).tarih);

              return (
                <Card
                  key={bildirim.id}
                  className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                    isNew ? 'ring-1 ring-blue-400' : ''
                  }`}
                  onClick={() => { setSelectedVardiya(bildirim); setShowDetailModal(true); }}
                >
                  <CardContent className="p-2 sm:p-2.5 md:p-3 space-y-1.5 sm:space-y-2">
                    {/* Header: Vardiya Tipi + Durum + YENİ Badge */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 flex-1 min-w-0">
                        <span className="text-lg sm:text-xl flex-shrink-0">
                          {bildirim.vardiyaTipi === 'sabah' ? '☀️' :
                           bildirim.vardiyaTipi === 'ogle' ? '🌤️' :
                           bildirim.vardiyaTipi === 'aksam' ? '🌇' : '🌙'}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1">
                            <span className="font-semibold text-xs sm:text-sm text-gray-900 truncate">
                              {getVardiyaLabel(bildirim.vardiyaTipi)}
                            </span>
                            {isNew && (
                              <span className="px-1 py-0.5 bg-blue-500 text-white text-[7px] sm:text-[8px] font-bold rounded animate-pulse flex-shrink-0">
                                YENİ
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] sm:text-xs text-gray-500 truncate">
                            {bildirim.vardiyaSaatleri?.baslangic}-{bildirim.vardiyaSaatleri?.bitis}
                          </div>
                        </div>
                      </div>
                      <StatusBadge status={bildirim.durum} className="flex-shrink-0 text-[10px] sm:text-xs" />
                    </div>

                    {/* Bilgiler */}
                    <div className="space-y-0.5 sm:space-y-1 text-[10px] sm:text-xs text-gray-600">
                      <div className="flex items-center gap-1">
                        <User className="w-2.5 h-2.5 sm:w-3 sm:h-3 flex-shrink-0" />
                        <span className="truncate">{bildirim.olusturanAdi}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Building2 className="w-2.5 h-2.5 sm:w-3 sm:h-3 flex-shrink-0" />
                        <span className="truncate">{bildirim.sahaAdi}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3 flex-shrink-0" />
                        <span className="truncate">{jsd ? formatDate(jsd) : '-'}</span>
                      </div>
                    </div>

                    {/* Alt: İşler & Fotoğraflar */}
                    <div className="flex items-center justify-between text-[10px] sm:text-xs pt-1 border-t border-gray-100">
                      {bildirim.yapılanIsler && bildirim.yapılanIsler.length > 0 && (
                        <span className="text-green-600 font-semibold flex items-center gap-0.5">
                          <CheckCircle className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                          {bildirim.yapılanIsler.length} iş
                        </span>
                      )}
                      {bildirim.fotograflar && bildirim.fotograflar.length > 0 && (
                        <span className="text-gray-500 flex items-center gap-0.5">
                          <Camera className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                          {bildirim.fotograflar.length}
                        </span>
                      )}
                    </div>

                    {/* Yorumlar - Grid Görünümü */}
                    {bildirim.yorumlar && bildirim.yorumlar.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-gray-100 space-y-1" onClick={(e) => e.stopPropagation()}>
                        <div className="text-[9px] sm:text-[10px] font-semibold text-gray-700 mb-1">
                          💬 Yorumlar ({bildirim.yorumlar.length})
                        </div>
                        <div className="space-y-1 max-h-16 overflow-y-auto">
                          {bildirim.yorumlar.slice(-2).map((yorum) => (
                            <div key={yorum.id} className="bg-gray-50 rounded p-1">
                              <div className="flex items-start gap-1">
                                <div className="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full bg-blue-500 flex items-center justify-center text-white text-[6px] sm:text-[7px] font-bold flex-shrink-0">
                                  {yorum.userAdi.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1">
                                    <span className="text-[9px] sm:text-[10px] font-semibold text-gray-900 truncate">{yorum.userAdi}</span>
                                  </div>
                                  <p className="text-[9px] sm:text-[10px] text-gray-700 mt-0.5 break-words">{yorum.yorum}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                        {bildirim.yorumlar.length > 2 && (
                          <div className="text-[8px] sm:text-[9px] text-blue-600 text-center">
                            +{bildirim.yorumlar.length - 2} yorum daha
                          </div>
                        )}
                      </div>
                    )}

                    {/* Yorum Ekleme - Grid Görünümü */}
                    {['yonetici', 'muhendis', 'tekniker', 'musteri'].includes(userProfile?.rol || '') && (
                      <div className="mt-2 pt-2 border-t border-gray-100" onClick={(e) => e.stopPropagation()}>
                        <div className="flex gap-1">
                          <input
                            type="text"
                            autoComplete="off"
                            autoCorrect="off"
                            autoCapitalize="off"
                            spellCheck={false}
                            value={yorumInputs[bildirim.id!] || ''}
                            onChange={(e) => {
                              e.stopPropagation();
                              setYorumInputs(prev => ({...prev, [bildirim.id!]: e.target.value}));
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && isAddingYorum !== bildirim.id) {
                                e.stopPropagation();
                                handleAddYorum(bildirim.id!);
                              }
                            }}
                            placeholder="Yorum yaz..."
                            className="flex-1 px-1.5 py-1 text-[9px] sm:text-[10px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 resize-none"
                            style={{ fontSize: '16px', WebkitUserSelect: 'text' }}
                            disabled={isAddingYorum === bildirim.id}
                          />
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAddYorum(bildirim.id!);
                            }}
                            disabled={!yorumInputs[bildirim.id!]?.trim() || isAddingYorum === bildirim.id}
                            className="px-1.5 py-1 bg-blue-500 hover:bg-blue-600 text-white text-[9px] sm:text-[10px] font-medium rounded disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isAddingYorum === bildirim.id ? '...' : '➤'}
                          </button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : viewMode === 'timeline' ? (
          // Saha + Vardiya Tipi Gruplu Görünüm - Kompakt
          <div className="space-y-3 sm:space-y-4 overflow-x-hidden">
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

                  // Her vardiya grubunu tarihe göre sırala (en yeni önce)
                  Object.keys(vardiyaTipGroups).forEach(tip => {
                    vardiyaTipGroups[tip].sort((a, b) => {
                      const dateA = toJsDate((a as any).tarih);
                      const dateB = toJsDate((b as any).tarih);
                      if (!dateA || !dateB) return 0;
                      return dateB.getTime() - dateA.getTime(); // En yeni önce
                    });
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
                    <div key={sahaKey} className="bg-white rounded-lg p-2 sm:p-3 md:p-4 shadow-sm">
                      {/* Saha Başlığı - Kompakt - Accordion */}
                      <div 
                        onClick={() => {
                          setExpandedSahalar(prev => {
                            const newSet = new Set(prev);
                            if (newSet.has(sahaKey)) {
                              newSet.delete(sahaKey);
                            } else {
                              newSet.add(sahaKey);
                            }
                            return newSet;
                          });
                        }}
                        className="flex items-center justify-between mb-2 pb-2 border-b border-gray-200 cursor-pointer hover:bg-gray-50 px-2 py-1.5 rounded transition-colors"
                      >
                        <div className="flex items-center gap-1.5 sm:gap-2 flex-1 min-w-0">
                          <div className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Building2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 text-white" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="text-xs sm:text-sm md:text-base font-bold text-gray-900 truncate">{sahaAdi}</h3>
                            <p className="text-[9px] sm:text-[10px] md:text-xs text-gray-600">{sahaVardiyalar.length} vardiya</p>
                          </div>
                        </div>

                        {/* İstatistikler + Chevron */}
                        <div className="flex gap-1 flex-shrink-0 items-center">
                          {sahaStats.normal > 0 && (
                            <span className="px-1 sm:px-1.5 md:px-2 py-0.5 rounded bg-gray-200 text-gray-700 text-[9px] sm:text-[10px] md:text-xs font-medium">
                              {sahaStats.normal}
                            </span>
                          )}
                          {sahaStats.dikkat > 0 && (
                            <span className="px-1 sm:px-1.5 md:px-2 py-0.5 rounded bg-gray-300 text-gray-800 text-[9px] sm:text-[10px] md:text-xs font-medium">
                              {sahaStats.dikkat}
                            </span>
                          )}
                          {sahaStats.acil > 0 && (
                            <span className="px-1 sm:px-1.5 md:px-2 py-0.5 rounded bg-gray-600 text-white text-[9px] sm:text-[10px] md:text-xs font-medium">
                              {sahaStats.acil}
                            </span>
                          )}
                          <ChevronRight 
                            className={`h-4 w-4 text-gray-500 transition-transform ml-1 flex-shrink-0 ${
                              expandedSahalar.has(sahaKey) ? 'rotate-90' : ''
                            }`}
                          />
                        </div>
                      </div>

                      {/* Vardiya Grupları - Yan Yana Grid - Açılı olunca göster */}
                      {expandedSahalar.has(sahaKey) && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 min-w-0 mt-2"
                      >
                        {vardiyaTipKeys.map((vardiyaTip) => {
                          const vardiyalar = vardiyaTipGroups[vardiyaTip];
                          const vardiyaLabel = getVardiyaLabel(vardiyaTip);
                          const vardiyaEmoji = vardiyaTip === 'sabah' ? '☀️' :
                                              vardiyaTip === 'ogle' ? '🌤️' :
                                              vardiyaTip === 'aksam' ? '🌇' : '🌙';

                          return (
                            <div key={vardiyaTip} className="bg-gradient-to-br from-white to-gray-50 rounded-lg shadow-sm overflow-hidden border border-gray-200 min-w-0">
                              {/* Vardiya Başlık - Kompakt */}
                              <div className="flex flex-col items-center justify-center px-2 py-2 bg-white border-b border-gray-200">
                                <span className="text-2xl sm:text-3xl mb-1">
                                  {vardiyaEmoji}
                                </span>
                                <span className="text-xs sm:text-sm font-bold text-gray-900 text-center">{vardiyaLabel}</span>
                                <span className="text-[10px] sm:text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full mt-1">
                                  {vardiyalar.length} vardiya
                                </span>
                              </div>

                              {/* Timeline Kartları - Kompakt */}
                              <div className="relative pl-4 sm:pl-5 space-y-2 py-2 pr-2 min-w-0 w-full">
                                {/* Dikey Timeline Çizgisi */}
                                <div className="absolute left-2 sm:left-2.5 top-2 bottom-2 w-0.5 bg-gradient-to-b from-gray-300 via-gray-200 to-transparent"></div>
                                
                                {vardiyalar.map((v, idx) => {
                                  const s = getSecurityScore(v);
                                  const isNew = isNewVardiya(v.olusturmaTarihi);
                                  const jsd = toJsDate((v as any).tarih);
                                  // Vardiya başlangıç saatini kullan
                                  const timeStr = v.vardiyaSaatleri?.baslangic || (jsd ? jsd.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) : '');
                                  
                                  // Reactions count
                                  const tamamCount = v.reactions?.tamam?.length || 0;
                                  const tamamlandiCount = v.reactions?.tamamlandi?.length || 0;
                                  const yorumCount = v.yorumlar?.length || 0;
                                  
                                  // Kullanıcının reactionları
                                  const userLikedTamam = v.reactions?.tamam?.includes(userProfile?.id || '') || false;
                                  const userLikedTamamlandi = v.reactions?.tamamlandi?.includes(userProfile?.id || '') || false;

                                  return (
                                    <div key={v.id} className="relative min-w-0">
                                      {/* Timeline Avatar - Kompakt */}
                                      <div className={`absolute -left-4 sm:-left-5 top-2 w-5 sm:w-6 h-5 sm:h-6 rounded-full border border-white overflow-hidden shadow-sm ${
                                        v.durum === 'acil' ? 'ring-1 ring-red-400' :
                                        v.durum === 'dikkat' ? 'ring-1 ring-yellow-400' :
                                        'ring-1 ring-green-400'
                                      }`}>
                                        {v.olusturanFotoUrl && !brokenImages.has(v.olusturanId) ? (
                                          <img 
                                            src={v.olusturanFotoUrl}
                                            alt={v.olusturanAdi}
                                            className="w-full h-full object-cover"
                                            onError={() => setBrokenImages(prev => new Set(prev).add(v.olusturanId))}
                                          />
                                        ) : (
                                          <div className="w-full h-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                                            <User className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-white" />
                                          </div>
                                        )}
                                      </div>
                                      
                                      {/* Kart - Ultra Kompakt */}
                                      <div 
                                        role="button" 
                                        tabIndex={0} 
                                        onClick={(e)=>onCardClick(e, v)} 
                                        onKeyDown={(e)=>{ if(e.key==='Enter'){ setSelectedVardiya(v); setShowDetailModal(true);} }} 
                                        className={`
                                          cursor-pointer bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 
                                          ${isNew ? 'ring-1 ring-blue-400' : ''}
                                        `}
                                      >
                                        <div className="p-1.5 sm:p-2 space-y-1 min-w-0 w-full">
                                          {/* Header: Zaman + Durum + Badge - Ultra Kompakt */}
                                          <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-1 flex-1 min-w-0">
                                              <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-gray-400 flex-shrink-0" />
                                              <span className="text-[9px] sm:text-[10px] font-semibold text-gray-700 truncate">
                                                {timeStr}
                                              </span>
                                              {isNew && (
                                                <span className="px-1 py-0.5 bg-blue-500 text-white text-[7px] sm:text-[8px] font-bold rounded animate-pulse flex-shrink-0">
                                                  YENİ
                                                </span>
                                              )}
                                            </div>
                                            <div className={`
                                              px-1 py-0.5 rounded text-[7px] sm:text-[8px] font-medium flex-shrink-0
                                              ${v.durum === 'acil' ? 'bg-red-500 text-white' :
                                                v.durum === 'dikkat' ? 'bg-yellow-500 text-white' :
                                                'bg-green-500 text-white'
                                              }
                                            `}>
                                              ●
                                            </div>
                                          </div>

                                          {/* Bekçi İsmi - Kompakt */}
                                          <div className="text-[8px] sm:text-[9px] font-medium text-gray-900 truncate">
                                            {v.olusturanAdi}
                                          </div>

                                           {/* Mini Harita - Sadece konum varsa ve kompakt */}
                                           {(v as any).konum && (
                                            <div className="rounded overflow-hidden w-full max-w-full">
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

                                          {/* Mini Fotoğraflar - Kompakt */}
                                          {v.fotograflar && v.fotograflar.length > 0 && (
                                            <div className="flex gap-0.5 w-full max-w-full">
                                              {v.fotograflar.slice(0, 3).map((foto, idx) => (
                                                <div key={idx} className="w-7 h-7 sm:w-8 sm:h-8 rounded overflow-hidden border border-gray-200">
                                                  <img 
                                                    src={foto} 
                                                    alt={`${idx + 1}`}
                                                    className="w-full h-full object-cover"
                                                  />
                                                </div>
                                              ))}
                                              {v.fotograflar.length > 3 && (
                                                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded bg-gray-100 flex items-center justify-center text-[7px] sm:text-[8px] font-medium text-gray-600 border border-gray-200">
                                                  +{v.fotograflar.length - 3}
                                                </div>
                                              )}
                                            </div>
                                          )}

                                          {/* Bilgi Satırı - Kompakt */}
                                          <div className="flex items-center gap-1.5 text-[8px] sm:text-[9px] text-gray-600 w-full max-w-full">
                                            {(v as any).konum && (
                                              <span className="flex items-center gap-0.5">
                                                <MapPin className="w-2 h-2 sm:w-2.5 sm:h-2.5 text-blue-500" />
                                                <span className="hidden sm:inline">Konum</span>
                                              </span>
                                            )}
                                            {v.fotograflar && v.fotograflar.length > 0 && (
                                              <span className="flex items-center gap-0.5">
                                                <Camera className="w-2 h-2 sm:w-2.5 sm:h-2.5" />
                                                {v.fotograflar.length}
                                              </span>
                                            )}
                                            {v.yapılanIsler && v.yapılanIsler.length > 0 && (
                                              <span className="flex items-center gap-0.5">
                                                <CheckCircle className="w-2 h-2 sm:w-2.5 sm:h-2.5 text-green-500" />
                                                {v.yapılanIsler.length}
                                              </span>
                                            )}
                                          </div>

                                          {/* Reactions - Ultra Kompakt */}
                                          <div className="flex items-center gap-0.5 pt-1 border-t border-gray-100">
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleToggleReaction(v.id!, 'tamam');
                                              }}
                                              className={`flex items-center gap-0.5 text-[8px] sm:text-[9px] px-1 py-0.5 rounded font-medium transition-all ${
                                                userLikedTamam
                                                  ? 'bg-blue-500 text-white'
                                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                              }`}
                                            >
                                              👍 {tamamCount > 0 && <span className="text-[7px] sm:text-[8px]">{tamamCount}</span>}
                                            </button>
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleToggleReaction(v.id!, 'tamamlandi');
                                              }}
                                              className={`flex items-center gap-0.5 text-[8px] sm:text-[9px] px-1 py-0.5 rounded font-medium transition-all ${
                                                userLikedTamamlandi
                                                  ? 'bg-green-500 text-white'
                                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                              }`}
                                            >
                                              ✅ {tamamlandiCount > 0 && <span className="text-[7px] sm:text-[8px]">{tamamlandiCount}</span>}
                                            </button>
                                            {yorumCount > 0 && (
                                              <span className="flex items-center gap-0.5 text-[8px] sm:text-[9px] bg-gray-100 text-gray-600 px-1 py-0.5 rounded font-medium ml-auto">
                                                💬 <span className="text-[7px] sm:text-[8px]">{yorumCount}</span>
                                              </span>
                                            )}
                                          </div>

                                          {/* Yorumlar Bölümü */}
                                          {v.yorumlar && v.yorumlar.length > 0 && (
                                            <div className="mt-1 pt-1 border-t border-gray-100 space-y-1" onClick={(e) => e.stopPropagation()}>
                                              <div className="text-[8px] sm:text-[9px] font-semibold text-gray-700 mb-1">
                                                💬 Yorumlar ({v.yorumlar.length})
                                              </div>
                                              <div className="space-y-0.5 max-h-20 overflow-y-auto">
                                                {v.yorumlar.slice(-2).map((yorum) => (
                                                  <div key={yorum.id} className="bg-gray-50 rounded p-1">
                                                    <div className="flex items-start gap-1">
                                                      <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-blue-500 flex items-center justify-center text-white text-[6px] sm:text-[7px] font-bold flex-shrink-0">
                                                        {yorum.userAdi.charAt(0).toUpperCase()}
                                                      </div>
                                                      <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-1">
                                                          <span className="text-[8px] sm:text-[9px] font-semibold text-gray-900 truncate">{yorum.userAdi}</span>
                                                          <span className="text-[7px] sm:text-[8px] text-gray-500">{yorum.userRol}</span>
                                                        </div>
                                                        <p className="text-[8px] sm:text-[9px] text-gray-700 mt-0.5 break-words">{yorum.yorum}</p>
                                                      </div>
                                                    </div>
                                                  </div>
                                                ))}
                                              </div>
                                              {v.yorumlar.length > 2 && (
                                                <div className="text-[7px] sm:text-[8px] text-blue-600 text-center">
                                                  +{v.yorumlar.length - 2} yorum daha
                                                </div>
                                              )}
                                            </div>
                                          )}

                                          {/* Yorum Ekleme Input */}
                                          {['yonetici', 'muhendis', 'tekniker', 'musteri'].includes(userProfile?.rol || '') && (
                                            <div className="mt-1 pt-1 border-t border-gray-100" onClick={(e) => e.stopPropagation()}>
                                              <div className="flex gap-0.5">
                                                <input
                                                  type="text"
                                                  autoComplete="off"
                                                  autoCorrect="off"
                                                  autoCapitalize="off"
                                                  spellCheck={false}
                                                  value={yorumInputs[v.id!] || ''}
                                                  onChange={(e) => {
                                                    e.stopPropagation();
                                                    setYorumInputs(prev => ({...prev, [v.id!]: e.target.value}));
                                                  }}
                                                  onKeyPress={(e) => {
                                                    if (e.key === 'Enter' && isAddingYorum !== v.id) {
                                                      e.stopPropagation();
                                                      handleAddYorum(v.id!);
                                                    }
                                                  }}
                                                  placeholder="Yorum yaz..."
                                                  className="flex-1 px-1 py-0.5 text-[8px] sm:text-[9px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 resize-none"
                                                  style={{ fontSize: '16px', WebkitUserSelect: 'text' }}
                                                  disabled={isAddingYorum === v.id}
                                                />
                                                <button
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleAddYorum(v.id!);
                                                  }}
                                                  disabled={!yorumInputs[v.id!]?.trim() || isAddingYorum === v.id}
                                                  className="px-1 py-0.5 bg-blue-500 hover:bg-blue-600 text-white text-[8px] sm:text-[9px] font-medium rounded disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                  {isAddingYorum === v.id ? '...' : '➤'}
                                                </button>
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      )}
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
                  {/* Harita Kontrol Paneli - Ultra Kompakt */}
                  <div className="bg-white rounded-lg shadow-sm p-2 border border-gray-200">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <div className="p-1 bg-gradient-to-br from-red-500 to-pink-500 rounded-lg">
                          <MapPin className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-white" />
                        </div>
                        <div>
                          <h3 className="text-[10px] sm:text-xs font-bold text-gray-900">Harita Görünümü</h3>
                          <p className="text-[9px] sm:text-[10px] text-gray-600">{filteredCoords.length} konum</p>
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
                      status: (v.durum === 'acil' ? 'ariza' : v.durum === 'dikkat' ? 'bakim' : 'normal') as 'normal' | 'ariza' | 'bakim',
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

                  {/* Lokasyon Listesi - Ultra Kompakt */}
                  <div>
                    <div className="bg-gray-50 rounded-lg p-1.5 mb-2 border border-gray-200">
                      <h3 className="text-[10px] sm:text-xs font-bold text-gray-900 flex items-center gap-1">
                        <Building2 className="h-3 w-3 text-blue-600" />
                        Vardiya Lokasyonları ({filteredCoords.length})
                      </h3>
                    </div>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-1.5 sm:gap-2">
                      {filteredCoords.map((v, idx) => {
                        const isNew = isNewVardiya(v.olusturmaTarihi);
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
                            }`}
                          >
                            {/* Üst Renkli Çizgi */}
                            <div className={`h-0.5 ${
                              v.durum === 'acil' ? 'bg-red-500' :
                              v.durum === 'dikkat' ? 'bg-yellow-500' : 'bg-green-500'
                            }`} />
                            
                            <div className="p-1.5">
                              {/* Header Ultra Kompakt */}
                              <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-0.5">
                                  <p className="text-[8px] sm:text-[9px] text-gray-500 truncate">{getVardiyaLabel(v.vardiyaTipi)}</p>
                                  {isNew && (
                                    <span className="px-0.5 py-0.5 bg-blue-500 text-white text-[6px] sm:text-[7px] font-bold rounded animate-pulse">
                                      YENİ
                                    </span>
                                  )}
                                </div>
                                <div className={`px-1 py-0.5 rounded text-[8px] font-bold ${
                                  v.durum === 'acil' ? 'bg-red-500 text-white' :
                                  v.durum === 'dikkat' ? 'bg-yellow-500 text-white' :
                                  'bg-green-500 text-white'
                                }`}>
                                  {v.durum === 'acil' ? '🚨' : v.durum === 'dikkat' ? '⚠️' : '✓'}
                                </div>
                              </div>

                              {/* Saha - Kompakt */}
                              <div className="p-1 bg-gray-50 rounded mb-1 flex items-center gap-1">
                                <Building2 className="h-2.5 w-2.5 text-blue-600 flex-shrink-0" />
                                <p className="text-[9px] sm:text-[10px] font-semibold text-gray-900 truncate flex-1">{v.sahaAdi}</p>
                              </div>

                              {/* Fotoğraflar Mini */}
                              {v.fotograflar && v.fotograflar.length > 0 && (
                                <div className="flex gap-0.5 mb-1">
                                  {v.fotograflar.slice(0, 2).map((foto, idx) => (
                                    <div key={idx} className="w-6 h-6 sm:w-7 sm:h-7 rounded overflow-hidden border border-gray-200">
                                      <img 
                                        src={foto} 
                                        alt={`${idx + 1}`}
                                        className="w-full h-full object-cover"
                                      />
                                    </div>
                                  ))}
                                  {v.fotograflar.length > 2 && (
                                    <div className="w-6 h-6 sm:w-7 sm:h-7 rounded bg-gray-100 flex items-center justify-center text-[7px] sm:text-[8px] font-bold text-gray-600 border border-gray-200">
                                      +{v.fotograflar.length - 2}
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Konum Link - Kompakt */}
                              <a 
                                href={generateGoogleMapsUrls({ 
                                  lat: (v as any).konum.lat, 
                                  lng: (v as any).konum.lng 
                                }).viewUrl}
                                target="_blank" 
                                rel="noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="w-full flex items-center justify-center gap-0.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-[9px] sm:text-[10px] font-semibold"
                              >
                                <MapPin className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
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
        size="xl"
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

      {/* Detay Modal - Modern & Kompakt */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedVardiya(null);
        }}
        title="Vardiya Detayları"
        size="xl"
      >
        {selectedVardiya && (
          <div className="space-y-4">
            {/* Modern Header - Kompakt */}
            <div className="flex items-start justify-between gap-3 pb-3 border-b">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-lg">
                  {getVardiyaIcon(selectedVardiya.vardiyaTipi)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-900 text-lg">
                    {getVardiyaLabel(selectedVardiya.vardiyaTipi)} Vardiyası
                  </h3>
                  <p className="text-xs text-gray-500 flex items-center gap-2 mt-0.5">
                    <Clock className="w-3 h-3" />
                    {`${formatDate((selectedVardiya as any).tarih, 'dd.MM.yyyy')} • ${selectedVardiya.vardiyaSaatleri?.baslangic || ''}-${selectedVardiya.vardiyaSaatleri?.bitis || ''}`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={getDurumBadgeVariant(selectedVardiya.durum)}>
                  {selectedVardiya.durum === 'acil' ? '🚨' : selectedVardiya.durum === 'dikkat' ? '⚠️' : '✓'}
                  {' '}{selectedVardiya.durum.charAt(0).toUpperCase() + selectedVardiya.durum.slice(1)}
                </Badge>
                {userProfile && (
                  (userProfile.id === selectedVardiya.olusturanId || 
                   ['yonetici', 'muhendis', 'tekniker', 'superadmin'].includes(userProfile.rol)) &&
                  canPerformAction('vardiya_sil')
                ) && (
                  <button
                    onClick={() => {
                      if (window.confirm('Bu vardiya bildirimini silmek istediğinizden emin misiniz?')) {
                        handleDelete(selectedVardiya.id!);
                        setShowDetailModal(false);
                        setSelectedVardiya(null);
                      }
                    }}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Sil"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* İçerik - Mobil Uyumlu */}
            <div className="space-y-3">
              {/* Lokasyon & Konum */}
              <div className="bg-white rounded-lg p-3 shadow-md">
                <div className="flex items-center gap-2 mb-2">
                  <Building2 className="w-4 h-4 text-blue-600" />
                  <h4 className="text-sm font-semibold text-gray-900">Lokasyon</h4>
                </div>
                <p className="text-sm font-medium text-gray-900">{selectedVardiya.sahaAdi}</p>
                {selectedVardiya.santralAdi && (
                  <p className="text-xs text-gray-600 mb-2">{selectedVardiya.santralAdi}</p>
                )}
                
                {/* Uydu Harita Görünümü - Çerçevesiz */}
                {selectedVardiya.konum && (
                  <div className="space-y-2">
                    <div className="rounded-lg overflow-hidden">
                      <MiniLocationMap 
                        lat={selectedVardiya.konum.lat}
                        lng={selectedVardiya.konum.lng}
                        status={selectedVardiya.durum === 'acil' ? 'ariza' : selectedVardiya.durum === 'dikkat' ? 'bakim' : 'normal'}
                        variant="guard"
                        shiftType={selectedVardiya.vardiyaTipi as any}
                        mapType="satellite"
                        height={120}
                      />
                    </div>
                    
                    {/* Konum Butonları - Mobil Uyumlu */}
                    <div className="flex flex-col sm:flex-row gap-2">
                      <a
                        href={generateGoogleMapsUrls({ lat: selectedVardiya.konum.lat, lng: selectedVardiya.konum.lng }).viewUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 px-2 py-1.5 bg-gray-700 hover:bg-gray-800 text-white rounded text-xs font-medium flex items-center justify-center gap-1 transition-colors"
                      >
                        <MapPin className="w-3 h-3" />
                        Konumuna Bak
                      </a>
                      <a
                        href={generateGoogleMapsUrls({ lat: selectedVardiya.konum.lat, lng: selectedVardiya.konum.lng }).directionsUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 px-2 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded text-xs font-medium flex items-center justify-center gap-1 transition-colors"
                      >
                        <MapPin className="w-3 h-3" />
                        Yol Tarifi
                      </a>
                    </div>
                  </div>
                )}
              </div>

              {/* Sorumlu */}
              <div className="bg-white rounded-lg p-3 shadow-md">
                <div className="flex items-center gap-2 mb-2">
                  <User className="w-4 h-4 text-blue-600" />
                  <h4 className="text-sm font-semibold text-gray-900">Sorumlu</h4>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {selectedVardiya.olusturanFotoUrl && !brokenImages.has(selectedVardiya.olusturanId) ? (
                      <img 
                        src={selectedVardiya.olusturanFotoUrl}
                        alt={selectedVardiya.olusturanAdi}
                        className="w-full h-full object-cover"
                        onError={() => setBrokenImages(prev => new Set(prev).add(selectedVardiya.olusturanId))}
                      />
                    ) : (
                      <User className="h-4 w-4 text-blue-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{selectedVardiya.olusturanAdi}</p>
                    <p className="text-xs text-gray-600">{selectedVardiya.olusturanRol}</p>
                  </div>
                </div>
              </div>

              {/* Güvenlik Kontrolleri */}
              {selectedVardiya.guvenlikKontrolleri && (
                <div className="bg-white rounded-lg p-3 shadow-md">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="w-4 h-4 text-blue-600" />
                    <h4 className="text-sm font-semibold text-gray-900">Güvenlik</h4>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-2 gap-1.5">
                    {[
                      { key: 'kameraKontrol', label: 'Kamera', icon: '📹' },
                      { key: 'telOrguKontrol', label: 'Çit', icon: '🏗️' },
                      { key: 'aydinlatmaKontrol', label: 'Aydınlatma', icon: '💡' },
                      { key: 'girisKontrol', label: 'Giriş', icon: '🚪' }
                    ].map(({ key, label, icon }) => (
                      <div key={key} className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs ${
                        (selectedVardiya.guvenlikKontrolleri as any)?.[key] 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-gray-100 text-gray-500'
                      }`}>
                        <span>{icon}</span>
                        <span className="font-medium">{label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Yapılan İşler */}
              {selectedVardiya.yapılanIsler && selectedVardiya.yapılanIsler.length > 0 && (
                <div className="bg-white rounded-lg p-3 shadow-md">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-4 h-4 text-blue-600" />
                    <h4 className="text-sm font-semibold text-gray-900">İşler ({selectedVardiya.yapılanIsler.length})</h4>
                  </div>
                  <div className="space-y-1">
                    {selectedVardiya.yapılanIsler.map((is, index) => (
                      <div key={index} className="flex items-start gap-1.5 text-xs text-gray-700">
                        <span className="text-blue-600 mt-0.5">✓</span>
                        <span>{is}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Notlar */}
              {selectedVardiya.aciklama && (
                <div className="bg-white rounded-lg p-3 shadow-md">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-4 h-4 text-blue-600" />
                    <h4 className="text-sm font-semibold text-gray-900">Notlar</h4>
                  </div>
                  <p className="text-xs text-gray-700 italic">{selectedVardiya.aciklama}</p>
                </div>
              )}

              {/* Fotoğraflar */}
              {selectedVardiya.fotograflar && selectedVardiya.fotograflar.length > 0 && (
                <div className="bg-white rounded-lg p-3 shadow-md">
                  <div className="flex items-center gap-2 mb-2">
                    <Camera className="w-4 h-4 text-blue-600" />
                    <h4 className="text-sm font-semibold text-gray-900">Fotoğraflar ({selectedVardiya.fotograflar.length})</h4>
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {selectedVardiya.fotograflar.map((foto, index) => (
                      <img
                        key={index}
                        src={foto}
                        alt={`${index + 1}`}
                        className="w-full h-20 object-cover rounded cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => window.open(foto, '_blank')}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Reactions & Yorumlar */}
              <div className="bg-white rounded-lg p-3 shadow-md">
                {/* Reactions Butonları - Mobil Uyumlu */}
                <div className="flex flex-wrap items-center gap-2 mb-3 pb-3 border-b border-gray-200">
                  <button
                    onClick={() => handleToggleReaction(selectedVardiya.id!, 'tamam')}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded text-xs font-medium transition-all ${
                      selectedVardiya.reactions?.tamam?.includes(userProfile?.id || '')
                        ? 'bg-blue-500 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                    }`}
                  >
                    👍 Tamam
                    {selectedVardiya.reactions?.tamam && selectedVardiya.reactions.tamam.length > 0 && (
                      <span className="ml-1">{selectedVardiya.reactions.tamam.length}</span>
                    )}
                  </button>
                  <button
                    onClick={() => handleToggleReaction(selectedVardiya.id!, 'tamamlandi')}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded text-xs font-medium transition-all ${
                      selectedVardiya.reactions?.tamamlandi?.includes(userProfile?.id || '')
                        ? 'bg-blue-500 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                    }`}
                  >
                    ✅ Tamamlandı
                    {selectedVardiya.reactions?.tamamlandi && selectedVardiya.reactions.tamamlandi.length > 0 && (
                      <span className="ml-1">{selectedVardiya.reactions.tamamlandi.length}</span>
                    )}
                  </button>
                </div>

                {/* Yorumlar Listesi */}
                {selectedVardiya.yorumlar && selectedVardiya.yorumlar.length > 0 && (
                  <div className="space-y-2 mb-3 max-h-40 overflow-y-auto">
                    {selectedVardiya.yorumlar.map((yorum) => (
                      <div key={yorum.id} className="bg-white rounded-lg p-2 border border-gray-200">
                        <div className="flex items-start gap-2">
                          <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                            {yorum.userAdi.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold text-gray-900">{yorum.userAdi}</span>
                              <span className="text-[10px] text-gray-500">{yorum.userRol}</span>
                            </div>
                            <p className="text-xs text-gray-700 mt-0.5">{yorum.yorum}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Yorum Ekleme */}
                {['yonetici', 'muhendis', 'tekniker', 'musteri'].includes(userProfile?.rol || '') && (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      autoComplete="off"
                      autoCorrect="off"
                      autoCapitalize="off"
                      spellCheck={false}
                      value={yorumInputs[selectedVardiya.id!] || ''}
                      onChange={(e) => setYorumInputs(prev => ({...prev, [selectedVardiya.id!]: e.target.value}))}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && isAddingYorum !== selectedVardiya.id) {
                          handleAddYorum(selectedVardiya.id!);
                        }
                      }}
                      placeholder="Yorum yazın..."
                      className="flex-1 px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                      style={{ fontSize: '16px', WebkitUserSelect: 'text' }}
                      disabled={isAddingYorum === selectedVardiya.id}
                    />
                    <Button
                      onClick={() => handleAddYorum(selectedVardiya.id!)}
                      disabled={!yorumInputs[selectedVardiya.id!]?.trim() || isAddingYorum === selectedVardiya.id}
                      className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-xs font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isAddingYorum === selectedVardiya.id ? '...' : 'Gönder'}
                    </Button>
                  </div>
                )}
              </div>
            </div>

          </div>
        )}
      </Modal>
    </div>
    </PullToRefresh>
  );
};

export default VardiyaBildirimleri;
