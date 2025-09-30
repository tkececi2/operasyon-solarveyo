import React, { useEffect, useState, useMemo, useRef } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Plus, Search, Edit, Trash2, Zap, Clock, AlertTriangle, TrendingDown, Filter, Calendar, Building2, Download, FileText } from 'lucide-react';
import { 
  Button, 
  Card, 
  CardContent, 
  Modal,
  Input,
  Badge,
  Select
} from '../../components/ui';
import { ElektrikKesintiForm } from '../../components/forms/ElektrikKesintiForm';
import { useAuth } from '../../hooks/useAuth';
import { elektrikKesintiService } from '../../services/elektrikKesintiService';
import { getAllSahalar } from '../../services/sahaService';
import type { PowerOutage } from '../../types';
import { formatDate, formatDateTime } from '../../utils/formatters';
import toast from 'react-hot-toast';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';

const ElektrikKesintileri: React.FC = () => {
  const { userProfile, canPerformAction } = useAuth();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedKesinti, setSelectedKesinti] = useState<PowerOutage | null>(null);
  const [kesintiler, setKesintiler] = useState<PowerOutage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSaha, setFilterSaha] = useState<string>('all');
  const [filterDurum, setFilterDurum] = useState<'all' | 'devam' | 'bitti'>('all');
  const [filterYear, setFilterYear] = useState<number | 'all'>('all');
  const [filterMonth, setFilterMonth] = useState<number | 'all'>('all');
  const [sahalar, setSahalar] = useState<Array<{ id: string; ad: string }>>([]);
  const [istatistikler, setIstatistikler] = useState<any>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [raporlayanMap, setRaporlayanMap] = useState<Record<string, { ad: string; fotoURL?: string }>>({});

  // Export PDF
  const exportPDF = async () => {
    if (!contentRef.current) return;
    const loading = toast.loading('PDF oluşturuluyor...');
    // PDF'e dahil edilmeyecek elemanları gizle
    const toHide = document.querySelectorAll('[data-pdf-exclude="true"]') as NodeListOf<HTMLElement>;
    const prevDisplays: string[] = [];
    toHide.forEach((el) => { prevDisplays.push(el.style.display); el.style.display = 'none'; });
    // Geçici başlık bloğu ekle (Türkçe karakterler için html2canvas üzerinden render)
    const header = document.createElement('div');
    header.setAttribute('data-pdf-temp', 'true');
    header.style.textAlign = 'center';
    header.style.margin = '12px 0 16px 0';
    header.innerHTML = `<div style=\"font-size:20px;font-weight:700;color:#111827;\">Elektrik Kesintileri Raporu</div><div style=\"font-size:12px;color:#374151;\">Tarih: ${new Date().toLocaleDateString('tr-TR')}</div>`;
    contentRef.current.insertBefore(header, contentRef.current.firstChild);
    // geçici olarak metin kısaltmalarını kaldır
    const root = contentRef.current;
    const clampedEls = root.querySelectorAll('.truncate, .line-clamp-1, .line-clamp-2, .line-clamp-3') as NodeListOf<HTMLElement>;
    const removedClassMap: Array<{ el: HTMLElement; classes: string[]; prevStyle: string }> = [];
    clampedEls.forEach((el) => {
      const removed: string[] = [];
      ['truncate', 'line-clamp-1', 'line-clamp-2', 'line-clamp-3'].forEach((cls) => {
        if (el.classList.contains(cls)) {
          el.classList.remove(cls);
          removed.push(cls);
        }
      });
      removedClassMap.push({ el, classes: removed, prevStyle: el.getAttribute('style') || '' });
      el.style.overflow = 'visible';
      el.style.whiteSpace = 'normal';
      (el.style as any).WebkitLineClamp = 'unset';
    });

    try {
      await new Promise((r) => setTimeout(r, 100));
      const canvas = await html2canvas(contentRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        windowWidth: contentRef.current.scrollWidth,
        windowHeight: contentRef.current.scrollHeight,
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const margin = 10; // kenar boşluğu
      const imgWidth = pdfWidth - margin * 2;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const topMargin = 10;

      pdf.addImage(imgData, 'PNG', margin, topMargin, imgWidth, imgHeight);

      let heightLeft = imgHeight - (pdfHeight - topMargin);
      while (heightLeft > 0) {
        const position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
      }
      pdf.save(`elektrik-kesintileri-${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success('PDF indirildi');
    } catch (e) {
      console.error('PDF export hatası', e);
      toast.error('PDF oluşturulamadı');
    } finally {
      // Geçici başlığı kaldır
      const temp = contentRef.current?.querySelector('[data-pdf-temp="true"]');
      if (temp && temp.parentElement) temp.parentElement.removeChild(temp);
      // gizlenenleri geri al
      toHide.forEach((el, i) => { el.style.display = prevDisplays[i]; });
      removedClassMap.forEach(({ el, classes, prevStyle }) => {
        classes.forEach((c) => el.classList.add(c));
        if (prevStyle) el.setAttribute('style', prevStyle);
        else el.removeAttribute('style');
      });
      toast.dismiss(loading);
    }
  };

  // Export Excel
  const exportExcel = () => {
    try {
      const rows = filteredKesintiler.map((k) => {
        const sahaAdi = sahalar.find((s) => s.id === k.sahaId)?.ad || '-';
        return {
          Saha: sahaAdi,
          Baslangic: formatDateTime(k.baslangicTarihi.toDate()),
          Bitis: k.bitisTarihi ? formatDateTime(k.bitisTarihi.toDate()) : '-',
          Sure: k.sure ? `${k.sure} dk` : '-',
          Neden: getNedenLabel(k.neden),
          EtkilenenKapasite_kW: k.etkilenenKapasite,
          KayipUretim_kWh: k.kayilanUretim || 0,
          KayipGelir_TL: k.kayilanGelir || 0,
          Aciklama: k.aciklama || '',
        };
      });
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Rapor');
      XLSX.writeFile(wb, `elektrik-kesintileri-${new Date().toISOString().split('T')[0]}.xlsx`);
      toast.success('Excel indirildi');
    } catch (e) {
      console.error('Excel export hatası', e);
      toast.error('Excel indirilemedi');
    }
  };

  // Kesintileri yükle
  const loadKesintiler = async () => {
    if (!userProfile?.companyId) return;
    
    setIsLoading(true);
    try {
      const data = await elektrikKesintiService.getPowerOutages({
        companyId: userProfile.companyId,
        userRole: userProfile.rol,
        userSahalar: userProfile.sahalar as any,
        userSantraller: userProfile.santraller as any
      });
      
      setKesintiler(data);
      
      // İstatistikleri yükle
      const stats = await elektrikKesintiService.getPowerOutageStatistics(
        userProfile.companyId,
        filterYear === 'all' ? undefined : filterYear
      );
      setIstatistikler(stats);
    } catch (error) {
      console.error('Kesintiler yüklenemedi:', error);
      toast.error('Kesintiler yüklenemedi');
    } finally {
      setIsLoading(false);
    }
  };

  // Sahalar yükle
  const loadSahalar = async () => {
    if (!userProfile?.companyId) return;
    
    try {
      const sahaList = await getAllSahalar(userProfile.companyId, userProfile.rol, userProfile.sahalar as any);
      
      setSahalar(sahaList);
    } catch (error) {
      console.error('Sahalar yüklenemedi:', error);
    }
  };

  useEffect(() => {
    loadKesintiler();
    loadSahalar();
  }, [userProfile, filterYear]);

  // Filtrelenmiş kesintiler
  const filteredKesintiler = useMemo(() => {
    return kesintiler.filter(kesinti => {
      // Metin araması
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        const sahaAdi = sahalar.find(s => s.id === kesinti.sahaId)?.ad || '';
        if (
          !kesinti.neden.toLowerCase().includes(search) &&
          !sahaAdi.toLowerCase().includes(search) &&
          !(kesinti.aciklama && kesinti.aciklama.toLowerCase().includes(search))
        ) {
          return false;
        }
      }

      // Saha filtresi
      if (filterSaha !== 'all' && kesinti.sahaId !== filterSaha) {
        return false;
      }

      // Durum filtresi
      if (filterDurum === 'devam' && kesinti.bitisTarihi) {
        return false;
      }
      if (filterDurum === 'bitti' && !kesinti.bitisTarihi) {
        return false;
      }

      // Tarih filtresi
      if (filterYear !== 'all' || filterMonth !== 'all') {
        const tarih = kesinti.baslangicTarihi.toDate();
        if (filterYear !== 'all' && tarih.getFullYear() !== filterYear) {
          return false;
        }
        if (filterMonth !== 'all' && tarih.getMonth() !== filterMonth - 1) {
          return false;
        }
      }

      return true;
    });
  }, [kesintiler, searchTerm, filterSaha, filterDurum, filterYear, filterMonth, sahalar]);

  // Kesinti oluştur/güncelle
  const handleSubmit = async (data: Partial<PowerOutage>) => {
    try {
      if (selectedKesinti) {
        await elektrikKesintiService.updatePowerOutage(selectedKesinti.id, data);
        toast.success('Kesinti güncellendi');
      } else {
        await elektrikKesintiService.createPowerOutage(data as Omit<PowerOutage, 'id' | 'olusturmaTarihi'>);
        toast.success('Kesinti kaydedildi');
      }
      await loadKesintiler();
      setShowCreateModal(false);
      setSelectedKesinti(null);
    } catch (error) {
      console.error('İşlem hatası:', error);
      toast.error('İşlem başarısız oldu');
    }
  };

  // Kesinti sil
  const handleDelete = async (id: string) => {
    if (!confirm('Bu kesinti kaydını silmek istediğinizden emin misiniz?')) return;
    
    try {
      await elektrikKesintiService.deletePowerOutage(id);
      toast.success('Kesinti silindi');
      await loadKesintiler();
    } catch (error) {
      console.error('Silme hatası:', error);
      toast.error('Silme işlemi başarısız oldu');
    }
  };

  // Neden rengi
  const getNedenColor = (neden: string) => {
    switch (neden) {
      case 'planlı-bakım':
        return 'bg-blue-100 text-blue-800';
      case 'arıza':
      case 'trafo-arızası':
      case 'invertor-arızası':
      case 'kablo-arızası':
        return 'bg-red-100 text-red-800';
      case 'şebeke-kesintisi':
      case 'og-kesintisi':
        return 'bg-orange-100 text-orange-800';
      case 'doğal-afet':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Neden başlığı
  const getNedenLabel = (neden: string) => {
    const labels: Record<string, string> = {
      'planlı-bakım': 'Planlı Bakım',
      'arıza': 'Arıza',
      'şebeke-kesintisi': 'Şebeke Kesintisi',
      'trafo-arızası': 'Trafo Arızası',
      'og-kesintisi': 'OG Kesintisi',
      'invertor-arızası': 'İnvertör Arızası',
      'kablo-arızası': 'Kablo Arızası',
      'doğal-afet': 'Doğal Afet',
      'diğer': 'Diğer'
    };
    return labels[neden] || neden;
  };

  // Süre formatla
  const formatSure = (dakika: number) => {
    if (dakika < 60) {
      return `${dakika} dk`;
    }
    const saat = Math.floor(dakika / 60);
    const dk = dakika % 60;
    return dk > 0 ? `${saat} sa ${dk} dk` : `${saat} saat`;
  };

  // Yıl seçenekleri
  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = currentYear; i >= currentYear - 5; i--) {
      years.push(i);
    }
    return years;
  }, []);

  // Görünen kartlardaki raporlayan kullanıcıları getir (ad + foto)
  useEffect(() => {
    (async () => {
      try {
        const ids = Array.from(new Set(filteredKesintiler.map(k => k.olusturanKisi))).filter(id => id && !raporlayanMap[id]);
        if (ids.length === 0) return;
        const results: Record<string, { ad: string; fotoURL?: string }> = {};
        await Promise.all(ids.map(async (uid) => {
          try {
            const s = await getDoc(doc(db, 'kullanicilar', uid));
            if (s.exists()) {
              const d = s.data() as any;
              results[uid] = { ad: d.ad || uid, fotoURL: d.fotoURL };
            } else {
              results[uid] = { ad: uid };
            }
          } catch {
            results[uid] = { ad: uid };
          }
        }));
        setRaporlayanMap(prev => ({ ...prev, ...results }));
      } catch {
        // sessiz geç
      }
    })();
  }, [filteredKesintiler]);

  return (
    <div className="space-y-6" ref={contentRef}>
      {/* Başlık ve İstatistikler */}
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Zap className="w-7 h-7 text-yellow-500" />
            Elektrik Kesintileri
          </h1>
          {/* Desktop metinli butonlar */}
          <div className="hidden sm:flex gap-2" data-pdf-exclude="true">
            <Button variant="secondary" onClick={exportPDF}>
              <Download className="w-4 h-4 mr-2" />
              Rapor İndir
            </Button>
            <Button variant="secondary" onClick={exportExcel}>
              <FileText className="w-4 h-4 mr-2" />
              Excel İndir
            </Button>
            {userProfile?.rol !== 'musteri' && canPerformAction('ariza', 'create') && (
              <Button onClick={() => setShowCreateModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Yeni Kesinti
              </Button>
            )}
          </div>
          {/* Mobil ikon butonlar */}
          <div className="flex sm:hidden items-center gap-2" data-pdf-exclude="true">
            <Button variant="secondary" size="sm" className="px-2 py-1 text-xs" onClick={exportPDF} title="Rapor indir">
              <Download className="w-4 h-4" />
            </Button>
            <Button variant="secondary" size="sm" className="px-2 py-1 text-xs" onClick={exportExcel} title="Excel indir">
              <FileText className="w-4 h-4" />
            </Button>
            {userProfile?.rol !== 'musteri' && canPerformAction('ariza', 'create') && (
              <Button size="sm" className="px-2 py-1 text-xs" onClick={() => setShowCreateModal(true)} title="Yeni Kesinti">
                <Plus className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        {/* İstatistik Kartları - 5 sütunlu düzen */}
        {istatistikler && (
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Toplam Kesinti</p>
                    <p className="text-2xl font-bold">{istatistikler.toplamKesinti}</p>
                  </div>
                  <Zap className="w-8 h-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Devam Eden</p>
                    <p className="text-2xl font-bold text-orange-600">{istatistikler.devamEdenKesinti}</p>
                  </div>
                  <AlertTriangle className="w-8 h-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Toplam Süre</p>
                    <p className="text-2xl font-bold">{formatSure(istatistikler.toplamSure)}</p>
                  </div>
                  <Clock className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Kayıp Üretim</p>
                    <p className="text-2xl font-bold">{istatistikler.toplamKayipUretim.toFixed(0)} kWh</p>
                  </div>
                  <TrendingDown className="w-8 h-8 text-red-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Kayıp Gelir</p>
                    <p className="text-2xl font-bold text-red-600">₺{istatistikler.toplamKayipGelir.toFixed(0)}</p>
                  </div>
                  <TrendingDown className="w-8 h-8 text-red-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Filtreler */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            {/* Arama */}
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Saha Filtresi */}
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Select 
                value={filterSaha} 
                onChange={(e) => setFilterSaha(e.target.value)}
                className="pl-10"
              >
                <option value="all">Tüm Sahalar</option>
                {sahalar.map((saha) => (
                  <option key={saha.id} value={saha.id}>
                    {saha.ad}
                  </option>
                ))}
              </Select>
            </div>

            {/* Durum Filtresi */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Select 
                value={filterDurum} 
                onChange={(e) => setFilterDurum(e.target.value as any)}
                className="pl-10"
              >
                <option value="all">Tüm Durumlar</option>
                <option value="devam">Devam Eden</option>
                <option value="bitti">Tamamlanan</option>
              </Select>
            </div>

            {/* Yıl Filtresi */}
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Select 
                value={String(filterYear)} 
                onChange={(e) => setFilterYear(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                className="pl-10"
              >
                <option value="all">Tüm Yıllar</option>
                {yearOptions.map((year) => (
                  <option key={year} value={String(year)}>
                    {year}
                  </option>
                ))}
              </Select>
            </div>

            {/* Ay Filtresi */}
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Select 
                value={String(filterMonth)} 
                onChange={(e) => setFilterMonth(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                className="pl-10"
              >
                <option value="all">Tüm Aylar</option>
                <option value="1">Ocak</option>
                <option value="2">Şubat</option>
                <option value="3">Mart</option>
                <option value="4">Nisan</option>
                <option value="5">Mayıs</option>
                <option value="6">Haziran</option>
                <option value="7">Temmuz</option>
                <option value="8">Ağustos</option>
                <option value="9">Eylül</option>
                <option value="10">Ekim</option>
                <option value="11">Kasım</option>
                <option value="12">Aralık</option>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Kesinti Listesi */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {isLoading ? (
          <div className="col-span-full text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          </div>
        ) : filteredKesintiler.length === 0 ? (
          <div className="col-span-full text-center py-8 text-gray-500">
            Kesinti kaydı bulunamadı
          </div>
        ) : (
          filteredKesintiler.map((kesinti) => {
            const sahaAdi = sahalar.find(s => s.id === kesinti.sahaId)?.ad || 'Bilinmeyen Saha';
            const devamEdiyor = !kesinti.bitisTarihi;
            
            return (
              <Card key={kesinti.id} className={devamEdiyor ? 'border-orange-500' : ''}>
                <CardContent className="p-4 space-y-3">
                  {/* Başlık */}
                  <div className="flex justify-between items-start">
                    <h3 className="font-semibold text-lg">{sahaAdi}</h3>
                    {devamEdiyor && (
                      <Badge variant="destructive" className="animate-pulse">
                        Devam Ediyor
                      </Badge>
                    )}
                  </div>

                  {/* Neden */}
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-gray-400" />
                    <Badge className={getNedenColor(kesinti.neden)}>
                      {getNedenLabel(kesinti.neden)}
                    </Badge>
                  </div>

                  {/* Tarih ve Süre */}
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span>Başlangıç: {formatDateTime(kesinti.baslangicTarihi.toDate())}</span>
                    </div>
                    {kesinti.bitisTarihi && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Calendar className="w-4 h-4" />
                        <span>Bitiş: {formatDateTime(kesinti.bitisTarihi.toDate())}</span>
                      </div>
                    )}
                    {kesinti.sure && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Clock className="w-4 h-4" />
                        <span>Süre: {formatSure(kesinti.sure)}</span>
                      </div>
                    )}
                  {/* Raporlayan */}
                  <div className="flex items-center gap-2 text-gray-600">
                    {(() => {
                      const u = raporlayanMap[kesinti.olusturanKisi];
                      const name = u?.ad || kesinti.olusturanKisi;
                      const initial = (name || '').trim().charAt(0).toUpperCase();
                      if (u?.fotoURL) {
                        return <img src={u.fotoURL} alt={name} className="w-5 h-5 rounded-full object-cover" />;
                      }
                      return (
                        <div className="w-5 h-5 rounded-full bg-gray-200 text-[11px] text-gray-700 flex items-center justify-center">
                          {initial}
                        </div>
                      );
                    })()}
                    <span>Raporlayan: <span className="font-medium text-gray-800">{raporlayanMap[kesinti.olusturanKisi]?.ad || '—'}</span></span>
                  </div>
                  </div>

                  {/* Etkilenen Kapasite ve Kayıplar */}
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Etkilenen Kapasite:</span>
                      <span className="font-medium">{kesinti.etkilenenKapasite} kW</span>
                    </div>
                    {kesinti.kayilanUretim && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Kayıp Üretim:</span>
                        <span className="font-medium text-red-600">{kesinti.kayilanUretim.toFixed(0)} kWh</span>
                      </div>
                    )}
                    {kesinti.kayilanGelir && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Kayıp Gelir:</span>
                        <span className="font-medium text-red-600">₺{kesinti.kayilanGelir.toFixed(0)}</span>
                      </div>
                    )}
                  </div>

                  {/* Açıklama */}
                  {kesinti.aciklama && (
                    <p className="text-sm text-gray-600 italic">{kesinti.aciklama}</p>
                  )}

                  {/* İşlemler - Müşteriler için gizle */}
                  {userProfile?.rol !== 'musteri' && canPerformAction('ariza', 'update') && (
                    <div className="flex justify-end gap-2 pt-2 border-t">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedKesinti(kesinti);
                          setShowCreateModal(true);
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      {canPerformAction('ariza', 'delete') && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(kesinti.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Oluşturma/Düzenleme Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setSelectedKesinti(null);
        }}
        title={selectedKesinti ? 'Kesinti Düzenle' : 'Yeni Kesinti'}
      >
        <ElektrikKesintiForm
          initialData={selectedKesinti}
          onSubmit={handleSubmit}
          onCancel={() => {
            setShowCreateModal(false);
            setSelectedKesinti(null);
          }}
        />
      </Modal>
    </div>
  );
};

export default ElektrikKesintileri;
