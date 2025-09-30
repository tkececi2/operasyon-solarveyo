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
  LoadingSpinner
} from '../../components/ui';
import { ResponsiveDetailModal } from '../../components/modals/ResponsiveDetailModal';
import { VardiyaForm } from '../../components/forms/VardiyaForm';
import { useAuth } from '../../hooks/useAuth';
import { useCompany } from '../../hooks/useCompany';
import { vardiyaService, type VardiyaBildirimi } from '../../services/vardiyaService';
import { getAllSahalar } from '../../services/sahaService';
import { formatDate, formatDateTime, formatRelativeTime } from '../../utils/formatters';
import { generateGoogleMapsUrls, getGoogleMapsApiKey } from '../../utils/googleMaps';
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
  const [viewMode, setViewMode] = useState<'grid' | 'timeline' | 'map'>('grid');
  const [onlyMyAreas, setOnlyMyAreas] = useState(false);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [quickRange, setQuickRange] = useState<'none' | 'today' | 'yesterday' | '7d' | 'month'>('none');
  const [showMobileFilters, setShowMobileFilters] = useState<boolean>(false);
  const [brokenImages, setBrokenImages] = useState<Set<string>>(new Set());

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
        return <Sun className="h-4 w-4 text-amber-500 animate-pulse" />;
      case 'ogle':
        return <Cloud className="h-4 w-4 text-sky-500 animate-pulse" />;
      case 'aksam':
        return <Moon className="h-4 w-4 text-indigo-500 animate-pulse" />;
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

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vardiya Bildirimleri</h1>
          <p className="text-gray-600">Vardiya raporlarını yönetin ve takip edin</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Masaüstü görünüm: görünüm anahtarı */}
          <div className="hidden md:flex bg-gray-100 rounded-lg p-1">
            <button
              className={`px-3 py-1 text-sm rounded-md flex items-center gap-1 ${viewMode==='grid' ? 'bg-white shadow' : 'text-gray-600'}`}
              onClick={() => setViewMode('grid')}
            >
              <LayoutGrid className="h-4 w-4" /> Grid
            </button>
            <button
              className={`px-3 py-1 text-sm rounded-md flex items-center gap-1 ${viewMode==='timeline' ? 'bg-white shadow' : 'text-gray-600'}`}
              onClick={() => setViewMode('timeline')}
            >
              <List className="h-4 w-4" /> Timeline
            </button>
            <button
              className={`px-3 py-1 text-sm rounded-md flex items-center gap-1 ${viewMode==='map' ? 'bg-white shadow' : 'text-gray-600'}`}
              onClick={() => setViewMode('map')}
            >
              <MapPin className="h-4 w-4" /> Harita
            </button>
          </div>
          {/* Mobil: ikon butonlar */}
          <div className="flex md:hidden items-center gap-2">
            <Button variant="ghost" size="sm" onClick={()=>setViewMode('grid')} title="Grid"><LayoutGrid className="h-4 w-4"/></Button>
            <Button variant="ghost" size="sm" onClick={()=>setViewMode('timeline')} title="Timeline"><List className="h-4 w-4"/></Button>
            <Button variant="ghost" size="sm" onClick={()=>setViewMode('map')} title="Harita"><MapPin className="h-4 w-4"/></Button>
            <Button variant="secondary" size="sm" onClick={()=>setShowMobileFilters(v=>!v)} title="Filtreler"><Filter className="h-4 w-4"/></Button>
            {canPerformAction('vardiya_ekle') && (
              <Button size="sm" onClick={() => setShowCreateModal(true)} title="Yeni Vardiya">
                <Plus className="h-4 w-4" />
              </Button>
            )}
          </div>
          {canPerformAction('vardiya_ekle') && (
            <Button className="hidden md:inline-flex" 
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={() => setShowCreateModal(true)}
            >
              Yeni Vardiya Bildirimi
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards - Mobilde 2 sütun */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {[{
          label: 'Toplam Bildirim', value: stats.toplam, icon: <Shield className="h-8 w-8 text-slate-400" />, color: 'slate'
        }, {
          label: 'Normal Durum', value: stats.normal, icon: <CheckCircle className="h-8 w-8 text-green-500" />, color: 'green'
        }, {
          label: 'Dikkat Gerekli', value: stats.dikkat, icon: <AlertTriangle className="h-8 w-8 text-yellow-500" />, color: 'yellow'
        }, {
          label: 'Acil Durum', value: stats.acil, icon: <AlertTriangle className="h-8 w-8 text-red-500" />, color: 'red'
        }].map((k, i) => (
          <div key={i} className="rounded-xl p-4 md:p-5 bg-white border border-slate-200">
            <div className="flex flex-col items-center text-center">
              {k.icon}
              <p className="text-2xl md:text-3xl font-bold text-slate-900 mt-2">{k.value}</p>
              <p className="text-xs md:text-sm text-slate-500 mt-1">{k.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className={`${showMobileFilters ? 'flex' : 'hidden md:flex'} flex-col lg:flex-row gap-4`}>
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Bekçi adı, saha veya açıklama ara..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* Saha Filter */}
            <div className="w-full lg:w-48">
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={sahaFilter}
                onChange={(e) => setSahaFilter(e.target.value)}
              >
                <option value="all">Tüm Sahalar</option>
                {sahalar.map(saha => (
                  <option key={saha.id} value={saha.id}>{saha.ad}</option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="w-full lg:w-48">
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">Tüm Durumlar</option>
                <option value="normal">Normal</option>
                <option value="dikkat">Dikkat</option>
                <option value="acil">Acil</option>
              </select>
            </div>

            {/* Shift Type Filter */}
            <div className="w-full lg:w-48">
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={shiftTypeFilter}
                onChange={(e) => setShiftTypeFilter(e.target.value)}
              >
                <option value="all">Tüm Vardiyalar</option>
                <option value="sabah">Sabah</option>
                <option value="ogle">Öğle</option>
                <option value="aksam">Akşam</option>
                <option value="gece">Gece</option>
              </select>
            </div>

            {/* Sadece benim sahalarım */}
            <div className="w-full lg:w-auto flex items-center">
              <label className="inline-flex items-center gap-2 text-sm cursor-pointer select-none bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                <input type="checkbox" checked={onlyMyAreas} onChange={(e)=>setOnlyMyAreas(e.target.checked)} className="h-4 w-4 text-blue-600" />
                Sadece benim sahalarım
              </label>
            </div>

            {/* Tarih Aralığı */}
            <div className="w-full lg:w-auto flex items-center gap-2">
              <input
                type="date"
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={startDate}
                onChange={(e)=>setStartDate(e.target.value)}
              />
              <span className="text-gray-400">—</span>
              <input
                type="date"
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={endDate}
                onChange={(e)=>setEndDate(e.target.value)}
              />
            </div>
            {/* Hızlı Aralıklar */}
            <div className="w-full lg:w-auto flex items-center gap-2">
              {([
                { key: 'today', label: 'Bugün' },
                { key: 'yesterday', label: 'Dün' },
                { key: '7d', label: 'Son 7 gün' },
                { key: 'month', label: 'Bu ay' }
              ] as const).map((o) => (
                <button
                  key={o.key}
                  className={`text-sm px-3 py-2 rounded-lg border ${quickRange===o.key ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300'}`}
                  onClick={() => {
                    const now = new Date();
                    now.setHours(0,0,0,0);
                    let s = '', e = '';
                    if (o.key === 'today') {
                      s = now.toISOString().split('T')[0];
                      e = s;
                    } else if (o.key === 'yesterday') {
                      const y = new Date(now); y.setDate(now.getDate()-1);
                      s = y.toISOString().split('T')[0];
                      e = s;
                    } else if (o.key === '7d') {
                      const sdt = new Date(now); sdt.setDate(now.getDate()-6);
                      s = sdt.toISOString().split('T')[0];
                      e = now.toISOString().split('T')[0];
                    } else if (o.key === 'month') {
                      const sdt = new Date(now.getFullYear(), now.getMonth(), 1);
                      s = sdt.toISOString().split('T')[0];
                      e = now.toISOString().split('T')[0];
                    }
                    setStartDate(s); setEndDate(e); setQuickRange(o.key);
                  }}
                >{o.label}</button>
              ))}
              <button
                className="text-sm px-3 py-2 rounded-lg border bg-white text-gray-700 border-gray-300"
                onClick={() => { setStartDate(''); setEndDate(''); setQuickRange('none'); }}
              >Temizle</button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bildirimler Listesi - Özel Tasarım */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Vardiya Bildirimleri ({filteredBildirimler.length})
        </h2>
        
        {filteredBildirimler.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Bildirim bulunamadı
              </h3>
              <p className="text-gray-600">
                Arama kriterlerinize uygun vardiya bildirimi bulunmamaktadır.
              </p>
            </CardContent>
          </Card>
        ) : viewMode === 'grid' ? (
          // Gün bazlı kart görünümü
          <div className="space-y-6">
            {(() => {
              const groups: Record<string, VardiyaBildirimi[]> = {};
              filteredBildirimler.forEach((v) => {
                const jsd = toJsDate((v as any).tarih);
                if (!jsd) return;
                const key = `${jsd.getFullYear()}-${String(jsd.getMonth()+1).padStart(2,'0')}-${String(jsd.getDate()).padStart(2,'0')}`;
                if (!groups[key]) groups[key] = [];
                groups[key].push(v);
              });

              const dayKeys = Object.keys(groups).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
              const order: Record<string, number> = { sabah: 1, ogle: 2, aksam: 3, gece: 4 };

              return dayKeys.map((day) => {
                const list = groups[day].slice().sort((a, b) => (order[a.vardiyaTipi] || 99) - (order[b.vardiyaTipi] || 99));
                const dt = new Date(`${day}T12:00:00`);
                const header = dt.toLocaleDateString('tr-TR', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });

                return (
                  <div key={day}>
                    <div className="sticky top-0 z-10 bg-white border-b-2 border-gray-200 px-4 py-3 shadow-sm flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">{header}</h3>
                        <p className="text-sm text-gray-500">Vardiya Bildirimleri ({list.length})</p>
                      </div>
                      <div className="flex items-center gap-3">
                        {(() => { const n=list.filter(v=>v.durum==='normal').length; return n>0? <span className="px-3 py-1.5 rounded-full bg-green-100 text-green-700 font-medium">✅ {n}</span> : null; })()}
                        {(() => { const n=list.filter(v=>v.durum==='dikkat').length; return n>0? <span className="px-3 py-1.5 rounded-full bg-yellow-100 text-yellow-700 font-medium">⚡ {n}</span> : null; })()}
                        {(() => { const n=list.filter(v=>v.durum==='acil').length; return n>0? <span className="px-3 py-1.5 rounded-full bg-red-100 text-red-700 font-medium">🚨 {n}</span> : null; })()}
                        {canPerformAction('vardiya_ekle') && (
                          <Button size="sm" onClick={()=>{ setDraftDate(day); setShowCreateModal(true); }}>
                            <Plus className="h-4 w-4 mr-1" />
                            Ekle
                          </Button>
                        )}
                      </div>
                    </div>
                    <div className="mt-3 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                      {list.map((bildirim) => (
              <div
                key={bildirim.id}
                          role="button"
                          tabIndex={0}
                          onClick={(e)=>onCardClick(e, bildirim)}
                          onKeyDown={(e)=>{ if(e.key==='Enter'){ setSelectedVardiya(bildirim); setShowDetailModal(true);} }}
                          className={`cursor-pointer bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden border ${
                            bildirim.durum==='acil' ? 'border-red-200 bg-red-50/30' : 
                            bildirim.durum==='dikkat' ? 'border-yellow-200 bg-yellow-50/30' : 
                            'border-gray-200'
                          }`}
              >
                {/* Vardiya Başlık */}
                <div className={`px-4 py-3 ${
                  bildirim.vardiyaTipi === 'sabah' ? 'bg-gradient-to-r from-yellow-100 to-orange-100' :
                  bildirim.vardiyaTipi === 'ogle' ? 'bg-gradient-to-r from-blue-100 to-cyan-100' :
                  bildirim.vardiyaTipi === 'aksam' ? 'bg-gradient-to-r from-purple-100 to-pink-100' : 
                  'bg-gradient-to-r from-gray-800 to-gray-700'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getShiftAnimatedIcon(bildirim.vardiyaTipi)}
                      <div>
                        <p className={`font-semibold text-sm ${
                          bildirim.vardiyaTipi === 'gece' ? 'text-white' : 'text-gray-900'
                        }`}>
                          {getVardiyaLabel(bildirim.vardiyaTipi).toUpperCase()}
                        </p>
                        <p className={`text-xs ${
                          bildirim.vardiyaTipi === 'gece' ? 'text-gray-200' : 'text-gray-600'
                        }`}>
                          {bildirim.vardiyaSaatleri?.baslangic || '00:00'} - {bildirim.vardiyaSaatleri?.bitis || '00:00'}
                        </p>
                      </div>
                    </div>
                    {bildirim.durum !== 'normal' && (
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        bildirim.durum === 'acil' ? 'bg-red-500 text-white' : 'bg-yellow-500 text-white'
                      }`}>
                        {bildirim.durum === 'acil' ? '⚠ ACİL' : '⚡ DİKKAT'}
                      </span>
                    )}
                  </div>
                </div>

                {/* İçerik */}
                <div className="p-3 space-y-2.5">
                  {/* Resimler - Üstte küçük önizleme */}
                  {bildirim.fotograflar && bildirim.fotograflar.length > 0 && (
                    <div className="flex gap-1 -mx-3 -mt-3 mb-2">
                      {bildirim.fotograflar.slice(0, 4).map((foto, idx) => (
                        <div key={idx} className="relative flex-1 h-16 overflow-hidden">
                          <img 
                            src={foto} 
                            alt={`Foto ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />
                          {idx === 3 && bildirim.fotograflar.length > 4 && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                              <span className="text-white text-xs font-medium">+{bildirim.fotograflar.length - 4}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Saha ve Santral */}
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-gray-400" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{bildirim.sahaAdi}</p>
                      {bildirim.santralAdi && (
                        <p className="text-xs text-gray-500">{bildirim.santralAdi}</p>
                      )}
                    </div>
                  </div>

                  {/* Personel */}
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                      {bildirim.olusturanFotoUrl && !brokenImages.has(bildirim.olusturanId) ? (
                        <img 
                          src={bildirim.olusturanFotoUrl}
                          alt={bildirim.olusturanAdi}
                          className="w-full h-full object-cover"
                          onError={() => {
                            setBrokenImages(prev => new Set(prev).add(bildirim.olusturanId));
                          }}
                        />
                      ) : (
                        <User className="h-4 w-4 text-gray-400" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-gray-700">{bildirim.olusturanAdi}</p>
                      <p className="text-xs text-gray-500">{bildirim.olusturanRol}</p>
                    </div>
                  </div>

                  {/* Güvenlik Kontrolleri - Kompakt */}
                  {bildirim.guvenlikKontrolleri && (
                    <div className="bg-gray-50 rounded-md p-2">
                      <p className="text-xs font-medium text-gray-700 mb-1">Güvenlik Kontrolleri</p>
                      <div className="grid grid-cols-2 gap-1">
                        <div className="flex items-center gap-1">
                          {bildirim.guvenlikKontrolleri.kameraKontrol ? 
                            <CheckCircle className="h-3 w-3 text-green-500" /> : 
                            <X className="h-3 w-3 text-gray-300" />
                          }
                          <span className="text-xs text-gray-600">Kamera</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {bildirim.guvenlikKontrolleri.telOrguKontrol ? 
                            <CheckCircle className="h-3 w-3 text-green-500" /> : 
                            <X className="h-3 w-3 text-gray-300" />
                          }
                          <span className="text-xs text-gray-600">Tel Örgü</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {bildirim.guvenlikKontrolleri.aydinlatmaKontrol ? 
                            <CheckCircle className="h-3 w-3 text-green-500" /> : 
                            <X className="h-3 w-3 text-gray-300" />
                          }
                          <span className="text-xs text-gray-600">Aydınlatma</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {bildirim.guvenlikKontrolleri.girisKontrol ? 
                            <CheckCircle className="h-3 w-3 text-green-500" /> : 
                            <X className="h-3 w-3 text-gray-300" />
                          }
                          <span className="text-xs text-gray-600">Giriş</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Konum - Küçük gösterim */}
                  {(bildirim as any).konum && (
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <MapPin className="h-3 w-3" />
                      <span>Konum kaydedildi</span>
                      <a 
                        href={generateGoogleMapsUrls({ 
                          lat: (bildirim as any).konum.lat, 
                          lng: (bildirim as any).konum.lng 
                        }).viewUrl} 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-blue-600 hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Haritada Gör
                      </a>
                    </div>
                  )}

                  {/* Yapılan İşler veya Not */}
                  {(bildirim.yapılanIsler && bildirim.yapılanIsler.length > 0) && (
                    <div className="pt-1.5 border-t">
                      <div className="flex items-start gap-1">
                        <CheckCircle className="h-3 w-3 text-green-500 mt-0.5" />
                        <p className="text-xs text-gray-600 line-clamp-1">
                          {bildirim.yapılanIsler.length} iş tamamlandı
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Detay butonu */}
                  <div className="pt-2 flex justify-end">
                    <span className="text-xs text-blue-600 flex items-center gap-1">
                      Detaylar
                      <ChevronRight className="h-3 w-3" />
                    </span>
                  </div>
                </div>
              </div>
            ))}
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        ) : viewMode === 'timeline' ? (
          // Gün bazlı akış görünümü
          <div className="space-y-6">
            {(() => {
              // 1) Tarihe göre grupla
              const groups: Record<string, VardiyaBildirimi[]> = {};
              filteredBildirimler.forEach((v) => {
                const jsd = toJsDate((v as any).tarih);
                if (!jsd) return; // geçersiz tarihli kayıtları atla
                const key = `${jsd.getFullYear()}-${String(jsd.getMonth()+1).padStart(2,'0')}-${String(jsd.getDate()).padStart(2,'0')}`;
                if (!groups[key]) groups[key] = [];
                groups[key].push(v);
              });

              // 2) Günleri yeni→eski sırala
              const dayKeys = Object.keys(groups).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

              // 3) Vardiya tipi sırası
              const order: Record<string, number> = { sabah: 1, ogle: 2, aksam: 3, gece: 4 };

              return dayKeys.map((day) => {
                const list = groups[day]
              .slice()
                  .sort((a, b) => (order[a.vardiyaTipi] || 99) - (order[b.vardiyaTipi] || 99));
                const dt = new Date(`${day}T12:00:00`);
                const header = dt.toLocaleDateString('tr-TR', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });
                return (
                  <div key={day}>
                    {/* Gün başlığı */}
                    <div className="sticky top-0 z-10 bg-gray-50 border-y px-3 py-2 rounded text-sm font-medium text-gray-700 flex items-center justify-between">
                      <span>{header}</span>
                      <div className="flex items-center gap-3 text-xs">
                        {(() => { const n=list.filter(v=>v.durum==='normal').length; return n>0? <span className="px-2 py-1 rounded-full bg-green-100 text-green-700">Normal {n}</span> : null; })()}
                        {(() => { const n=list.filter(v=>v.durum==='dikkat').length; return n>0? <span className="px-2 py-1 rounded-full bg-yellow-100 text-yellow-700">Dikkat {n}</span> : null; })()}
                        {(() => { const n=list.filter(v=>v.durum==='acil').length; return n>0? <span className="px-2 py-1 rounded-full bg-red-100 text-red-700">Acil {n}</span> : null; })()}
                        {canPerformAction('vardiya_ekle') && (
                          <Button size="sm" onClick={()=>{ setDraftDate(day); setShowCreateModal(true); }}>Bu güne ekle</Button>
                        )}
                      </div>
                    </div>

                    {/* Kayıtlar */}
                    <div className="mt-3 space-y-3">
                      {list.map((v) => {
                const s = getSecurityScore(v);
                return (
                          <div key={v.id} role="button" tabIndex={0} onClick={(e)=>onCardClick(e, v)} onKeyDown={(e)=>{ if(e.key==='Enter'){ setSelectedVardiya(v); setShowDetailModal(true);} }} className={`cursor-pointer bg-white border border-gray-100 rounded-2xl p-4 shadow-sm touch-pan-y ${
                            v.durum==='acil' ? 'border-l-4 border-l-red-400' : v.durum==='dikkat' ? 'border-l-4 border-l-yellow-400' : 'border-l-4 border-l-green-400'
                          }`}>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                {getVardiyaIcon(v.vardiyaTipi)}
                                <div>
                                  <div className="font-medium text-gray-900">
                                    {getVardiyaLabel(v.vardiyaTipi)} • {v.vardiyaSaatleri?.baslangic} - {v.vardiyaSaatleri?.bitis}
                    </div>
                                  <div className="text-sm text-gray-600">
                                    {v.sahaAdi} {v.santralAdi && <span className="text-gray-500">/ {v.santralAdi}</span>}
                                  </div>
                                </div>
                              </div>
                              <Badge variant={getDurumBadgeVariant(v.durum)}>
                                {getDurumIcon(v.durum)}
                                <span className="ml-1 capitalize">{v.durum}</span>
                              </Badge>
                            </div>

                            <div className="mt-3 text-xs text-gray-600 flex md:flex-row flex-col md:items-center md:justify-between gap-3">
                              <div className="flex items-center gap-3">
                                <span>{v.olusturanAdi} ({v.olusturanRol})</span>
                      <span className="inline-flex items-center px-2 py-1 bg-gray-100 rounded-full">Güvenlik: {s.score}/{s.total}</span>
                      {v.fotograflar && v.fotograflar.length > 0 && (
                                  <span className="inline-flex items-center gap-1"><Camera className="h-3 w-3" />{v.fotograflar.length}</span>
                      )}
                    </div>
                              <Button size="sm" variant="ghost" className="w-full md:w-auto" onClick={() => { setSelectedVardiya(v); setShowDetailModal(true); }}>Detay</Button>
                    </div>

                            {/* Bekçi Değerlendirmesi */}
                            {(v.aciklama || (v.guvenlikKontrolleri as any)?.notlar) && (
                              <div className="pt-2 border-t">
                                <p className="text-xs font-medium text-gray-700 mb-1">Bekçi Değerlendirmesi</p>
                                <p className="text-xs text-gray-600 line-clamp-2">
                                  {v.aciklama || (v.guvenlikKontrolleri as any)?.notlar}
                                </p>
                  </div>
                            )}

                            {/* Konum Haritası (varsa) */}
                            {(() => {
                              const loc = (v as any).konum;
                              const key = getGoogleMapsApiKey();
                              if (!loc || !loc.lat || !loc.lng || !key) return null;
                              const url = generateGoogleMapsUrls({ lat: loc.lat, lng: loc.lng }).staticMapUrl(key, 640, 120, 13, 'satellite');
                              return url ? (
                                <div className="mt-2" onClick={(e)=>e.stopPropagation()}>
                                  <img src={url} alt="Harita" className="w-full h-32 object-cover rounded-lg border" />
                                  <div className="mt-1 flex items-center gap-3 text-xs">
                                    <a href={generateGoogleMapsUrls({ lat: loc.lat, lng: loc.lng }).viewUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">Haritada Aç</a>
                                    <a href={generateGoogleMapsUrls({ lat: loc.lat, lng: loc.lng }).directionsUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">Yol Tarifi</a>
                </div>
                                </div>
                              ) : null;
                            })()}
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
          // Harita görünümü (Static Map)
          <div className="space-y-3">
            {(() => {
              const withCoords = filteredBildirimler.filter(v => (v as any).konum && (v as any).konum.lat && (v as any).konum.lng);
              if (withCoords.length === 0) {
                return <Card><CardContent className="p-6 text-gray-600">Bu filtrede konumu bulunan kayıt yok.</CardContent></Card>;
              }
              const coords = withCoords.map(v => (v as any).konum);
              const center = {
                lat: coords.reduce((a: number, c: any) => a + c.lat, 0) / coords.length,
                lng: coords.reduce((a: number, c: any) => a + c.lng, 0) / coords.length,
              };
              const key = getGoogleMapsApiKey();
              const zoom = coords.length > 15 ? 6 : coords.length > 8 ? 7 : 9;
              const markers = coords.slice(0, 40).map((c: any) => `${c.lat},${c.lng}`).join('|');
              const src = key ? `https://maps.googleapis.com/maps/api/staticmap?center=${center.lat},${center.lng}&zoom=${zoom}&size=1280x500&maptype=roadmap&markers=color:red%7C${markers}&key=${key}` : '';
              return (
                <div>
                  {src ? (
                    <img src={src} alt="Vardiya haritası" className="w-full rounded-lg border" />
                  ) : (
                    <Card><CardContent className="p-6 text-gray-600">Harita için API anahtarı gerekli.</CardContent></Card>
                  )}
                  <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                    {withCoords.slice(0, 12).map(v => (
                      <div key={v.id} className="flex items-center justify-between bg-white border rounded p-2">
                        <div className="text-gray-800">{v.sahaAdi} {v.santralAdi && <span className="text-gray-500">/ {v.santralAdi}</span>}</div>
                        <Button size="sm" variant="ghost" onClick={() => { setSelectedVardiya(v); setShowDetailModal(true); }}>Detay</Button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>

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
  );
};

export default VardiyaBildirimleri;
