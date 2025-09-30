import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Plus, Wrench, Zap, Cog, Calendar, Clock, CheckCircle, Eye, Edit, List, Grid3X3, Download, Search, Filter, Building2, MapPin, User, X, ChevronRight, Image as ImageIcon, FileText } from 'lucide-react';
import { Button, Card, CardContent, CardHeader, CardTitle, Modal, LoadingSpinner, Badge, Input, Select, LazyImage } from '../../components/ui';
import { ResponsiveDetailModal } from '../../components/modals/ResponsiveDetailModal';
import { BakimForm } from '../../components/forms/BakimForm';
import { YapilanIsForm } from '../../components/forms/YapilanIsForm';
import { useAuth } from '../../contexts/AuthContext';
import { bakimService } from '../../services';
import { getAllSahalar } from '../../services/sahaService';
import { getAllSantraller } from '../../services/santralService';
import type { ElectricalMaintenance, MechanicalMaintenance } from '../../types';
import { formatDate, formatDateTime, formatRelativeTime, translateStatus } from '../../utils/formatters';
import toast from 'react-hot-toast';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';

const Bakim: React.FC = () => {
  const { userProfile, canPerformAction } = useAuth();
  const location = useLocation();
  
  // URL'e göre aktif tab'ı belirle
  const getInitialTab = () => {
    if (location.pathname.includes('/bakim/elektrik')) return 'elektrik';
    if (location.pathname.includes('/bakim/mekanik')) return 'mekanik';
    if (location.pathname.includes('/bakim/yapilanisler')) return 'yapilanisler';
    return 'elektrik'; // varsayılan
  };
  
  const [activeTab, setActiveTab] = useState<'elektrik' | 'mekanik' | 'yapilanisler'>(getInitialTab());
  const [showBakimModal, setShowBakimModal] = useState(false);
  const [showYapilanIsModal, setShowYapilanIsModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedMaintenance, setSelectedMaintenance] = useState<(ElectricalMaintenance | MechanicalMaintenance) & { type?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [elektrikBakimlar, setElektrikBakimlar] = useState<ElectricalMaintenance[]>([]);
  const [mekanikBakimlar, setMekanikBakimlar] = useState<MechanicalMaintenance[]>([]);
  const [yapilanIsler, setYapilanIsler] = useState<any[]>([]);
  
  // URL değiştiğinde tab'ı güncelle
  useEffect(() => {
    setActiveTab(getInitialTab());
  }, [location.pathname]);
  
  // View mode
  const [viewMode, setViewMode] = useState<'list' | 'cards'>('cards');
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSaha, setSelectedSaha] = useState<string>('');
  const [filterYear, setFilterYear] = useState<number | 'all'>('all');
  const [filterMonth, setFilterMonth] = useState<number | 'all'>('all');
  const [sahaOptions, setSahaOptions] = useState<{ value: string; label: string }[]>([]);
  const [santralMap, setSantralMap] = useState<Record<string, { id: string; ad: string }>>({});
  const [sahaMap, setSahaMap] = useState<Record<string, { id: string; ad: string }>>({});
  const [showMobileFilters, setShowMobileFilters] = useState<boolean>(false);
  const [userMap, setUserMap] = useState<Record<string, { ad: string; email?: string }>>({});
  
  const contentRef = useRef<HTMLDivElement>(null);

  const tabs = [
    { id: 'elektrik' as const, label: 'Elektrik Bakım', icon: Zap },
    { id: 'mekanik' as const, label: 'Mekanik Bakım', icon: Cog },
    { id: 'yapilanisler' as const, label: 'Yapılan İşler', icon: FileText },
  ];

  // Year options
  const currentYear = new Date().getFullYear();
  const yearOptions = [
    { value: 'all', label: 'Tüm Yıllar' },
    ...Array.from({ length: 5 }, (_, i) => ({
      value: currentYear - i,
      label: (currentYear - i).toString()
    }))
  ];

  // Month options
  const monthOptions = [
    { value: 'all', label: 'Tüm Aylar' },
    { value: 1, label: 'Ocak' },
    { value: 2, label: 'Şubat' },
    { value: 3, label: 'Mart' },
    { value: 4, label: 'Nisan' },
    { value: 5, label: 'Mayıs' },
    { value: 6, label: 'Haziran' },
    { value: 7, label: 'Temmuz' },
    { value: 8, label: 'Ağustos' },
    { value: 9, label: 'Eylül' },
    { value: 10, label: 'Ekim' },
    { value: 11, label: 'Kasım' },
    { value: 12, label: 'Aralık' }
  ];

  // Load saha and santral data
  useEffect(() => {
    const loadData = async () => {
      try {
        if (!userProfile?.companyId) return;
        
        // Load sahalar (müşteri izolasyonu ile)
        const sahas = await getAllSahalar(
          userProfile.companyId,
          userProfile.rol,
          userProfile.sahalar
        );
        setSahaOptions([{ value: '', label: 'Tüm Sahalar' }, ...sahas.map(s => ({ value: s.id, label: s.ad }))]);
        const sm: Record<string, { id: string; ad: string }> = {};
        sahas.forEach(s => { sm[s.id] = { id: s.id, ad: s.ad }; });
        setSahaMap(sm);
        
        // Load santraller (müşteri izolasyonu ile)
        const santrals = await getAllSantraller(
          userProfile.companyId,
          userProfile.rol,
          userProfile.santraller
        );
        const santMap: Record<string, { id: string; ad: string }> = {};
        santrals.forEach(s => { santMap[s.id] = { id: s.id, ad: s.ad }; });
        setSantralMap(santMap);
      } catch (error) {
        console.error('Veri yükleme hatası:', error);
      }
    };
    loadData();
  }, [userProfile?.companyId, userProfile?.rol, userProfile?.sahalar, userProfile?.santraller]);

  // Bakım verilerini getir
  const fetchMaintenanceData = async () => {
    if (!userProfile?.companyId) return;
    
    try {
      setLoading(true);
      const [electrical, mechanical] = await Promise.all([
        bakimService.getElectricalMaintenances(
          userProfile.companyId,
          undefined,
          undefined,
          userProfile.rol,
          userProfile.santraller,
          userProfile.sahalar as any
        ),
        bakimService.getMechanicalMaintenances(
          userProfile.companyId,
          undefined,
          undefined,
          userProfile.rol,
          userProfile.santraller,
          userProfile.sahalar as any
        )
      ]);
      
      setElektrikBakimlar(electrical);
      setMekanikBakimlar(mechanical);
      
      // Yapılan işler verilerini getir (müşteri izolasyonu ile)
      const yapilanIslerData = await bakimService.getYapilanIsler?.(
        userProfile.companyId,
        undefined,
        undefined,
        userProfile.rol,
        userProfile.santraller,
        userProfile.sahalar as any
      ) || [];
      setYapilanIsler(yapilanIslerData);
      
      // Kullanıcı bilgilerini çek (benzersiz kullanıcı ID'leri için)
      const uniqueUserIds = new Set<string>();
      [...electrical, ...mechanical, ...yapilanIslerData].forEach(bakim => {
        if (bakim.yapanKisiId) {
          uniqueUserIds.add(bakim.yapanKisiId);
        }
      });
      
      // Kullanıcı bilgilerini toplu çek
      const userMapData: Record<string, { ad: string; email?: string }> = {};
      for (const userId of uniqueUserIds) {
        try {
          const userDoc = await getDoc(doc(db, 'kullanicilar', userId));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            userMapData[userId] = {
              ad: userData.ad || 'Bilinmiyor',
              email: userData.email
            };
          }
        } catch (err) {
          console.error(`Kullanıcı bilgisi alınamadı: ${userId}`, err);
        }
      }
      setUserMap(userMapData);
    } catch (error) {
      console.error('Bakım verileri getirilemedi:', error);
      toast.error('Bakım verileri yüklenirken hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMaintenanceData();
  }, [userProfile?.companyId, userProfile?.rol, userProfile?.santraller]);

  // Filter maintenance data
  const filterMaintenanceData = (data: any[]) => {
    return data.filter(bakim => {
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const santralAdi = santralMap[bakim.santralId]?.ad || '';
        const sahaAdi = sahaMap[bakim.sahaId]?.ad || '';
        
        if (!santralAdi.toLowerCase().includes(searchLower) &&
            !sahaAdi.toLowerCase().includes(searchLower) &&
            !bakim.yapanKisi?.toLowerCase().includes(searchLower) &&
            !(bakim.notlar && bakim.notlar.toLowerCase().includes(searchLower)) &&
            !(bakim.baslik && bakim.baslik.toLowerCase().includes(searchLower))) {
          return false;
        }
      }
      
      // Saha filter
      if (selectedSaha && bakim.sahaId !== selectedSaha) {
        return false;
      }
      
      // Year filter
      if (filterYear !== 'all') {
        const bakimYear = bakim.tarih?.toDate ? bakim.tarih.toDate().getFullYear() : new Date(bakim.tarih).getFullYear();
        if (bakimYear !== filterYear) {
          return false;
        }
      }
      
      // Month filter
      if (filterMonth !== 'all') {
        const bakimMonth = bakim.tarih?.toDate ? bakim.tarih.toDate().getMonth() + 1 : new Date(bakim.tarih).getMonth() + 1;
        if (bakimMonth !== filterMonth) {
          return false;
        }
      }
      
      return true;
    });
  };

  // Bakım başarıyla oluşturulduğunda
  const handleMaintenanceCreated = () => {
    setShowBakimModal(false);
    fetchMaintenanceData();
    toast.success('Bakım kaydı başarıyla oluşturuldu!');
  };

  // Yapılan iş başarıyla oluşturulduğunda
  const handleYapilanIsCreated = () => {
    setShowYapilanIsModal(false);
    fetchMaintenanceData();
    toast.success('Yapılan iş raporu başarıyla oluşturuldu!');
  };

  // Detay modalını aç
  const handleViewDetails = (maintenance: any, type: string) => {
    // Kartta gösterilen kontrol etiketlerini aynen taşı
    // Eski ve yeni kayıt formatları için ham veriyi koruyoruz
    setSelectedMaintenance({ ...maintenance, type });
    setShowDetailModal(true);
  };

  // Düzenleme modalını aç
  const handleEdit = (maintenance: any, type: string) => {
    setSelectedMaintenance({ ...maintenance, type });
    if (type === 'yapilanisler') {
      setShowYapilanIsModal(true);
    } else {
      setShowBakimModal(true);
    }
  };

  // Handle delete
  const handleDelete = async (maintenanceId: string, type: 'elektrik' | 'mekanik' | 'yapilanis') => {
    if (!window.confirm('Bu kaydı silmek istediğinizden emin misiniz?')) {
      return;
    }
    
    try {
      if (type === 'yapilanis') {
        await bakimService.deleteYapilanIs?.(maintenanceId);
      } else {
        await bakimService.deleteMaintenance(maintenanceId, type);
      }
      toast.success('Kayıt başarıyla silindi');
      fetchMaintenanceData();
    } catch (error) {
      console.error('Silme hatası:', error);
      toast.error('Kayıt silinemedi');
    }
  };

  // Export PDF - Arızalar sayfası ile uyumlu (clamp kaldırma + başlık)
  const exportPDF = async () => {
    if (!contentRef.current) {
      toast.error('PDF oluşturulamadı - içerik bulunamadı');
      return;
    }
    
    const loadingToast = toast.loading('PDF oluşturuluyor...');
    
    try {
      // Önce içeriğin yüklenmesini bekle
      await new Promise(resolve => setTimeout(resolve, 300));

      // PDF'e dahil edilmeyecek elemanları geçici gizle
      const toHide = document.querySelectorAll('[data-pdf-exclude="true"]') as NodeListOf<HTMLElement>;
      const prevDisplays: string[] = [];
      toHide.forEach((el) => { prevDisplays.push(el.style.display); el.style.display = 'none'; });

      // Geçici başlık bloğu ekle (Türkçe karakterler için html2canvas üzerinden render)
      const title =
        activeTab === 'elektrik'
          ? 'Elektrik Bakım Raporu'
          : activeTab === 'mekanik'
          ? 'Mekanik Bakım Raporu'
          : 'Yapılan İşler Raporu';
      const header = document.createElement('div');
      header.setAttribute('data-pdf-temp', 'true');
      header.style.textAlign = 'center';
      header.style.margin = '12px 0 16px 0';
      header.innerHTML = `<div style="font-size:20px;font-weight:700;color:#111827;">${title}</div><div style="font-size:12px;color:#374151;">Tarih: ${new Date().toLocaleDateString('tr-TR')}</div>`;
      contentRef.current.insertBefore(header, contentRef.current.firstChild);

      // PDF öncesi: metin kısaltmalarını geçici kaldır
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
      
      const canvas = await html2canvas(contentRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: contentRef.current.scrollWidth,
        windowHeight: contentRef.current.scrollHeight
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

      // Çok sayfalı destek
      let heightLeft = imgHeight - (pdfHeight - topMargin);
      while (heightLeft > 0) {
        const position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
      }

      const fileName = `bakim-raporu-${activeTab}-${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
      
      toast.dismiss(loadingToast);
      toast.success('PDF başarıyla indirildi');
    } catch (error) {
      console.error('PDF export hatası:', error);
      toast.dismiss(loadingToast);
      toast.error('PDF oluşturulamadı');
    } finally {
      // Başlık bloğunu kaldır
      const temp = contentRef.current?.querySelector('[data-pdf-temp="true"]');
      if (temp && temp.parentElement) temp.parentElement.removeChild(temp);

      // Gizlenen butonları geri getir
      const toHide = document.querySelectorAll('[data-pdf-exclude="true"]') as NodeListOf<HTMLElement>;
      const prevDisplays: string[] = [];
      // Not: prevDisplays üstte tanımlıydı; burada yoksa default görünür yap
      toHide.forEach((el) => { el.style.display = ''; });

      // Stil ve sınıfları geri al
      if (contentRef.current) {
        const root = contentRef.current;
        const clampedEls = root.querySelectorAll('[style]') as NodeListOf<HTMLElement>;
        clampedEls.forEach((el) => {
          // PDF öncesi eklediğimiz stil ipuçlarını temizleyelim
          if (el.style.whiteSpace === 'normal' || el.style.overflow === 'visible') {
            el.style.whiteSpace = '';
            el.style.overflow = '';
            (el.style as any).WebkitLineClamp = '';
          }
        });
      }
    }
  };

  // Excel export
  const exportExcel = () => {
    try {
      const base = activeTab === 'elektrik'
        ? filteredElektrik
        : activeTab === 'mekanik'
        ? filteredMekanik
        : filteredYapilanIsler;

      const rows = base.map((b: any) => {
        const tarih = b.tarih?.toDate ? b.tarih.toDate() : new Date(b.tarih || Date.now());
        if (activeTab === 'yapilanisler') {
          return {
            Baslik: b.baslik || '',
            Saha: sahaMap[b.sahaId]?.ad || santralMap[b.santralId]?.ad || '-',
            Personel: b.yapanKisi || b.personel || '-',
            Tarih: formatDate(tarih),
            Durum: 'Tamamlandı',
            Aciklama: b.notlar || b.aciklama || b.yapilanIsler || ''
          };
        }
        return {
          Santral: santralMap[b.santralId]?.ad || '-',
          Saha: sahaMap[b.sahaId]?.ad || '-',
          YapanKisi: b.yapanKisi || b.personel || '-',
          Tarih: formatDate(tarih),
          Durum: b.genelDurum ? translateStatus(b.genelDurum) : '-',
          Notlar: b.notlar || b.aciklama || ''
        };
      });

      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Rapor');
      XLSX.writeFile(wb, `bakim-raporu-${activeTab}-${new Date().toISOString().split('T')[0]}.xlsx`);
      toast.success('Excel başarıyla indirildi');
    } catch (e) {
      console.error('Excel export hatası:', e);
      toast.error('Excel indirilemedi');
    }
  };

  // Render maintenance card
  const renderMaintenanceCard = (bakim: any, type: string) => (
    <Card 
      key={bakim.id} 
      className="hover:shadow-md transition-all duration-200 overflow-hidden cursor-pointer"
      onClick={() => handleViewDetails(bakim, type)}
    >
      {/* Image section - ilk 3 fotoğraf kolaj */}
      {bakim.fotograflar && bakim.fotograflar.length > 0 && (() => {
        const photos = (bakim.fotograflar as string[]).slice(0, 3);
        const extra = (bakim.fotograflar as string[]).length - 3;
        return (
          <div className="h-32 bg-gray-100 relative grid grid-cols-2 grid-rows-2 gap-1">
            <LazyImage
              src={photos[0]}
              alt="Fotoğraf 1"
              className="col-span-1 row-span-2 w-full h-full object-cover"
            />
            {photos[1] && (
              <LazyImage
                src={photos[1]}
                alt="Fotoğraf 2"
                className="w-full h-full object-cover"
              />
            )}
            {photos[2] && (
              <LazyImage
                src={photos[2]}
                alt="Fotoğraf 3"
                className="w-full h-full object-cover"
              />
            )}
            {extra > 0 && (
              <div className="absolute bottom-1 right-1 bg-black/70 text-white px-2 py-0.5 rounded text-xs">
                +{extra} fotoğraf
              </div>
            )}
          </div>
        );
      })()}
      
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-2">
            {type === 'elektrik' ? (
              <Zap className="h-5 w-5 text-yellow-500" />
            ) : type === 'mekanik' ? (
              <Cog className="h-5 w-5 text-blue-500" />
            ) : (
              <FileText className="h-5 w-5 text-green-500" />
            )}
            <h3 className="font-semibold text-gray-900">
              {type === 'yapilanis' ? bakim.baslik : santralMap[bakim.santralId]?.ad || 'Santral'}
            </h3>
          </div>
          {bakim.genelDurum && (
            <Badge className={getDurumBadge(bakim.genelDurum)}>
              {translateStatus(bakim.genelDurum)}
            </Badge>
          )}
        </div>

        {/* Info */}
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <MapPin className="h-3.5 w-3.5" />
            <span>{sahaMap[bakim.sahaId]?.ad || santralMap[bakim.santralId]?.ad || '-'}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <User className="h-3.5 w-3.5" />
            <span>
              {bakim.yapanKisiId && userMap[bakim.yapanKisiId] 
                ? userMap[bakim.yapanKisiId].ad 
                : bakim.yapanKisi || bakim.personel || '-'}
            </span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Calendar className="h-3.5 w-3.5" />
            <span>{bakim.tarih?.toDate ? formatDate(bakim.tarih.toDate()) : formatDate(new Date(bakim.tarih || Date.now()))}</span>
          </div>
        </div>

        {/* Kontrol Listesi */}
        {type !== 'yapilanis' && bakim.kontroller && (
          <div className="mt-3">
            <div className="text-xs font-medium text-gray-700 mb-1">Kontrol Listesi</div>
            <div className="flex flex-wrap gap-1.5 text-[11px]">
              {Object.keys(bakim.kontroller).map((key) => {
                const labelMap: Record<string, string> = {
                  // Elektrik
                  ogSistemleri: 'OG Sistemleri',
                  trafolar: 'Trafolar',
                  agDagitimPanosu: 'AG Dağıtım Panosu',
                  invertorler: 'İnvertörler',
                  toplamaKutulari: 'Toplama Kutuları',
                  pvModulleri: 'PV Modülleri',
                  // Mekanik
                  panelTemizligi: 'Panel Temizliği',
                  yapiselKontroller: 'Yapısal Kontroller',
                  kablolar: 'Kablolar',
                  guvenlikEkipmanlari: 'Güvenlik Ekipmanları',
                  montajElemanlari: 'Montaj Elemanları'
                };
                const label = labelMap[key] || key;
                return (
                  <span key={key} className="px-2 py-0.5 rounded-full bg-gray-50 text-gray-700 inline-flex items-center gap-1">
                    <CheckCircle className={`h-3 w-3 ${controlIconClass}`} />
                    {label}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        

        {/* Yapılan İşler kartı için malzemeler + detay + açıklama */}
        {type === 'yapilanis' ? (
          <>
            {/* Kullanılan Malzemeler */}
            {((bakim.kullanilanMalzemeler && bakim.kullanilanMalzemeler.length > 0) || (bakim.malzemeler && bakim.malzemeler.length > 0)) && (
              <div className="mt-3">
                <div className="text-xs font-medium text-gray-700 mb-1">Kullanılan Malzemeler</div>
                <div className="flex flex-wrap gap-1.5 text-[11px] text-gray-700">
                  {(
                    (bakim.kullanilanMalzemeler && bakim.kullanilanMalzemeler.length > 0)
                      ? bakim.kullanilanMalzemeler.map((m: any) => (m?.ad ? `${m.ad}${m.miktar ? ` x${m.miktar}` : ''}${m.birim ? ` ${m.birim}` : ''}` : ''))
                      : (bakim.malzemeler as string[])
                  ).filter(Boolean).slice(0, 6).map((txt: string, i: number) => (
                    <span key={i} className="px-2 py-0.5 rounded-full bg-gray-50">{txt}</span>
                  ))}
                  {(
                    (bakim.kullanilanMalzemeler && bakim.kullanilanMalzemeler.length) || (bakim.malzemeler && bakim.malzemeler.length)
                  ) > 6 && (
                    <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">+ daha fazla</span>
                  )}
                </div>
              </div>
            )}

            {/* Yapılan İş Detayı */}
            {bakim.yapilanIsler && (
              <div className="mt-3">
                <div className="text-xs font-medium text-gray-700 mb-1">Yapılan İş</div>
                <p className="text-sm text-gray-700 line-clamp-3">{bakim.yapilanIsler}</p>
              </div>
            )}

            {/* Açıklama / Notlar */}
            {(bakim.aciklama || bakim.notlar) && (
              <div className="mt-2">
                <div className="text-xs font-medium text-gray-700 mb-1">Açıklama</div>
                <p className="text-sm text-gray-600 line-clamp-4">{bakim.aciklama || bakim.notlar}</p>
              </div>
            )}
          </>
        ) : (
          // Diğer kartlar için sadece açıklama/notlar
          (bakim.notlar || bakim.aciklama) ? (
            <p className="text-sm text-gray-600 mt-3 line-clamp-4">{bakim.notlar || bakim.aciklama}</p>
          ) : null
        )}

        {/* Actions */}
        <div className="flex gap-2 mt-4">
          <Button
            size="sm"
            variant="secondary"
            className="flex-1"
            onClick={(e) => {
              e.stopPropagation();
              handleViewDetails(bakim, type);
            }}
          >
            <Eye className="h-4 w-4 mr-1" />
            Görüntüle
          </Button>
          {canPerformAction('bakim_duzenle') && (
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                handleEdit(bakim, type);
              }}
              title="Düzenle"
            >
              <Edit className="h-4 w-4" />
            </Button>
          )}
          {canPerformAction('bakim_sil') && (
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(bakim.id, type === 'yapilanisler' ? 'yapilanis' as any : type as any);
              }}
            >
              Sil
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  // Render maintenance list item
  const renderMaintenanceListItem = (bakim: any, type: string) => (
    <tr key={bakim.id} className="hover:bg-gray-50">
      <td className="px-4 py-3">
        {bakim.fotograflar && bakim.fotograflar.length > 0 ? (
          <LazyImage
            src={bakim.fotograflar[0]}
            alt="Fotoğraf"
            className="w-10 h-10 rounded object-cover"
          />
        ) : (
          <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center">
            <ImageIcon className="h-5 w-5 text-gray-400" />
          </div>
        )}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          {type === 'elektrik' ? (
            <Zap className="h-4 w-4 text-yellow-500" />
          ) : type === 'mekanik' ? (
            <Cog className="h-4 w-4 text-blue-500" />
          ) : (
            <FileText className="h-4 w-4 text-green-500" />
          )}
          <span className="font-medium">
            {type === 'yapilanis' ? bakim.baslik : santralMap[bakim.santralId]?.ad || '-'}
          </span>
        </div>
      </td>
      <td className="px-4 py-3">{sahaMap[bakim.sahaId]?.ad || santralMap[bakim.santralId]?.ad || '-'}</td>
      <td className="px-4 py-3">
        {bakim.yapanKisiId && userMap[bakim.yapanKisiId] 
          ? userMap[bakim.yapanKisiId].ad 
          : bakim.yapanKisi || bakim.personel || '-'}
      </td>
      <td className="px-4 py-3">{bakim.tarih?.toDate ? formatDate(bakim.tarih.toDate()) : formatDate(new Date(bakim.tarih || Date.now()))}</td>
      <td className="px-4 py-3">
        {bakim.genelDurum ? (
          <Badge className={getDurumBadge(bakim.genelDurum)}>
            {translateStatus(bakim.genelDurum)}
          </Badge>
        ) : type === 'yapilanis' ? (
          <Badge variant="success">Tamamlandı</Badge>
        ) : null}
      </td>
      <td className="px-4 py-3">
        <div className="flex gap-2" data-pdf-exclude="true">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleViewDetails(bakim, type)}
          >
            <Eye className="h-4 w-4" />
          </Button>
          {canPerformAction('bakim_duzenle') && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleEdit(bakim, type)}
              title="Düzenle"
            >
              <Edit className="h-4 w-4" />
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleDelete(bakim.id, type === 'yapilanisler' ? 'yapilanis' as any : type as any)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </td>
    </tr>
  );

  const getDurumBadge = (durum: string) => {
    const badges = {
      'iyi': 'bg-green-100 text-green-800',
      'orta': 'bg-yellow-100 text-yellow-800',
      'kotu': 'bg-red-100 text-red-800',
    };
    return badges[durum as keyof typeof badges] || 'bg-gray-100 text-gray-800';
  };

  // Kartlarda hızlı özet: kontrol başarı oranı, foto sayısı, süre/malzeme sayısı
  const getKontrolOzet = (bakim: any, type: string) => {
    if (type === 'yapilanis') {
      return { toplam: 0, ok: 0 };
    }
    const groups = bakim?.kontroller ? Object.values(bakim.kontroller) as any[] : [];
    let toplam = 0; let ok = 0;
    groups.forEach((grp) => {
      if (grp && typeof grp === 'object') {
        Object.values(grp).forEach((val: any) => {
          toplam += 1;
          if (val === true) ok += 1;
        });
      }
    });
    return { toplam, ok };
  };

  // Kontrol listesi onay ikon rengi: 'green' veya 'black'
  const CONTROL_ICON_COLOR: 'green' | 'black' = 'green';
  const controlIconClass = CONTROL_ICON_COLOR === 'green' ? 'text-green-600' : 'text-gray-900';

  const filteredElektrik = filterMaintenanceData(elektrikBakimlar);
  const filteredMekanik = filterMaintenanceData(mekanikBakimlar);
  const filteredYapilanIsler = filterMaintenanceData(yapilanIsler);

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bakım Yönetimi</h1>
          <p className="text-gray-600">Bakım ve yapılan iş kayıtlarını yönetin</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Masaüstü: metinli butonlar */}
          <Button 
            variant="secondary"
            onClick={exportPDF}
            className="hidden sm:inline-flex"
          >
            <Download className="h-4 w-4 mr-2" />
            Rapor İndir
          </Button>
          <Button 
            variant="secondary"
            onClick={exportExcel}
            className="hidden sm:inline-flex"
          >
            <FileText className="h-4 w-4 mr-2" />
            Excel İndir
          </Button>
          {activeTab === 'yapilanisler'
            ? (canPerformAction('bakim_ekle') && (
                <Button className="hidden sm:inline-flex" leftIcon={<Plus className="h-4 w-4" />} onClick={() => setShowYapilanIsModal(true)}>
                  Yeni İş Raporu
                </Button>
              ))
            : (canPerformAction('bakim_ekle') && (
                <Button className="hidden sm:inline-flex" leftIcon={<Plus className="h-4 w-4" />} onClick={() => setShowBakimModal(true)}>
                  Yeni Bakım Kaydı
                </Button>
              ))}

          {/* Mobil: ikon butonlar (Arızalar sayfası ile aynı yaklaşım) */}
          <div className="flex sm:hidden items-center gap-2" data-pdf-exclude="true">
            <Button variant="secondary" size="sm" className="px-2 py-1 text-xs" onClick={exportPDF} title="Rapor indir">
              <Download className="w-4 h-4" />
            </Button>
            <Button variant="secondary" size="sm" className="px-2 py-1 text-xs" onClick={exportExcel} title="Excel indir">
              <FileText className="w-4 h-4" />
            </Button>
            {canPerformAction('bakim_ekle') && (
              activeTab === 'yapilanisler' ? (
                <Button size="sm" className="px-2 py-1 text-xs" onClick={() => setShowYapilanIsModal(true)} title="Yeni İş Raporu">
                  <Plus className="w-4 h-4" />
                </Button>
              ) : (
                <Button size="sm" className="px-2 py-1 text-xs" onClick={() => setShowBakimModal(true)} title="Yeni Bakım Kaydı">
                  <Plus className="w-4 h-4" />
                </Button>
              )
            )}
          </div>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-3">
            {/* Üst satır: Arama + (mobil) Filtreler butonu */}
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <Input
                  placeholder="Ara..."
                  leftIcon={<Search className="h-4 w-4" />}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button
                variant="secondary"
                size="sm"
                className="md:hidden"
                onClick={() => setShowMobileFilters(v => !v)}
                leftIcon={<Filter className="h-4 w-4" />}
              >
                Filtreler
              </Button>
            </div>

            {/* Orta ve üzeri ekranlar: yatay filtreler */}
            <div className="hidden md:grid grid-cols-5 gap-4">
              <Select
                placeholder="Saha"
                options={sahaOptions}
                value={selectedSaha}
                onChange={(e) => setSelectedSaha(e.target.value)}
              />
              <Select
                placeholder="Yıl"
                options={yearOptions}
                value={filterYear}
                onChange={(e) => setFilterYear(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
              />
              <Select
                placeholder="Ay"
                options={monthOptions}
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
              />
              <div className="flex gap-2">
                <Button
                  variant={viewMode === 'list' ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'cards' ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('cards')}
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Mobil filtre paneli */}
            {showMobileFilters && (
              <div className="md:hidden space-y-2 border-t pt-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <Select
                    placeholder="Saha"
                    options={sahaOptions}
                    value={selectedSaha}
                    onChange={(e) => setSelectedSaha(e.target.value)}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <Select
                      placeholder="Yıl"
                      options={yearOptions}
                      value={filterYear}
                      onChange={(e) => setFilterYear(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
                    />
                    <Select
                      placeholder="Ay"
                      options={monthOptions}
                      value={filterMonth}
                      onChange={(e) => setFilterMonth(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={viewMode === 'list' ? 'primary' : 'ghost'}
                    className="flex-1"
                    size="sm"
                    onClick={() => setViewMode('list')}
                  >
                    <List className="h-4 w-4 mr-1" /> Liste
                  </Button>
                  <Button
                    variant={viewMode === 'cards' ? 'primary' : 'ghost'}
                    className="flex-1"
                    size="sm"
                    onClick={() => setViewMode('cards')}
                  >
                    <Grid3X3 className="h-4 w-4 mr-1" /> Kart
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center py-2 px-1 border-b-2 font-medium text-sm
                ${activeTab === tab.id
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              <tab.icon className="h-4 w-4 mr-2" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      )}

      {/* Content - PDF için referans */}
      <div ref={contentRef}>
        {/* Elektrik Bakım */}
      {!loading && activeTab === 'elektrik' && (
        <div className="space-y-4">
            {filteredElektrik.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Zap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Elektrik bakım kaydı bulunamadı</h3>
                  <p className="text-gray-600 mb-4">Arama kriterlerinize uygun kayıt yok.</p>
              </CardContent>
            </Card>
            ) : viewMode === 'cards' ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredElektrik.map(bakim => renderMaintenanceCard(bakim, 'elektrik'))}
              </div>
            ) : (
              <Card>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Foto</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Santral</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Saha</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Yapan Kişi</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tarih</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Durum</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">İşlemler</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredElektrik.map(bakim => renderMaintenanceListItem(bakim, 'elektrik'))}
                    </tbody>
                  </table>
                    </div>
              </Card>
            )}
                  </div>
                )}

        {/* Mekanik Bakım */}
      {!loading && activeTab === 'mekanik' && (
        <div className="space-y-4">
            {filteredMekanik.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Cog className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Mekanik bakım kaydı bulunamadı</h3>
                  <p className="text-gray-600 mb-4">Arama kriterlerinize uygun kayıt yok.</p>
              </CardContent>
            </Card>
            ) : viewMode === 'cards' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredMekanik.map(bakim => renderMaintenanceCard(bakim, 'mekanik'))}
              </div>
            ) : (
              <Card>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Foto</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Santral</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Saha</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Yapan Kişi</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tarih</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Durum</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">İşlemler</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredMekanik.map(bakim => renderMaintenanceListItem(bakim, 'mekanik'))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
                  </div>
                )}

        {/* Yapılan İşler */}
        {!loading && activeTab === 'yapilanisler' && (
          <div className="space-y-4">
            {filteredYapilanIsler.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Yapılan iş kaydı bulunamadı</h3>
                  <p className="text-gray-600 mb-4">İlk iş raporunuzu oluşturmak için yukarıdaki butonu kullanın.</p>
              </CardContent>
            </Card>
            ) : viewMode === 'cards' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredYapilanIsler.map(is => renderMaintenanceCard(is, 'yapilanis'))}
              </div>
            ) : (
              <Card>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Foto</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Başlık</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Saha</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Personel</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tarih</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Durum</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">İşlemler</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredYapilanIsler.map(is => renderMaintenanceListItem(is, 'yapilanis'))}
                    </tbody>
                  </table>
                </div>
            </Card>
            )}
        </div>
      )}
      </div>

      {/* Bakım Modal */}
      <Modal
        isOpen={showBakimModal}
        onClose={() => {
          setShowBakimModal(false);
          setSelectedMaintenance(null);
        }}
        title={selectedMaintenance && selectedMaintenance.type !== 'yapilanis' ? 'Bakım Kaydı Düzenle' : 'Yeni Bakım Kaydı'}
        size="xl"
      >
        <BakimForm
          initialData={selectedMaintenance && selectedMaintenance.type !== 'yapilanis' ? (selectedMaintenance as any) : undefined}
          onSuccess={() => {
            handleMaintenanceCreated();
            setShowBakimModal(false);
            setSelectedMaintenance(null);
          }}
          onCancel={() => {
            setShowBakimModal(false);
            setSelectedMaintenance(null);
          }}
        />
      </Modal>

      {/* Yapılan İş Modal */}
      <Modal
        isOpen={showYapilanIsModal}
        onClose={() => {
          setShowYapilanIsModal(false);
          setSelectedMaintenance(null);
        }}
        title={selectedMaintenance && selectedMaintenance.type === 'yapilanis' ? 'İş Raporu Düzenle' : 'Yeni İş Raporu'}
        size="xl"
      >
        <YapilanIsForm
          initialData={selectedMaintenance && selectedMaintenance.type === 'yapilanis' ? (selectedMaintenance as any) : undefined}
          onSuccess={() => {
            handleYapilanIsCreated();
            setShowYapilanIsModal(false);
            setSelectedMaintenance(null);
          }}
          onCancel={() => {
            setShowYapilanIsModal(false);
            setSelectedMaintenance(null);
          }}
        />
      </Modal>

      {/* Detail Modal - Responsive for Mobile */}
      {selectedMaintenance && (
        <ResponsiveDetailModal
          isOpen={showDetailModal}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedMaintenance(null);
          }}
          title={
            selectedMaintenance.type === 'yapilanis' 
              ? selectedMaintenance.baslik || 'İş Raporu' 
              : `${selectedMaintenance.type === 'elektrik' ? 'Elektrik' : 'Mekanik'} Bakım`
          }
          subtitle={`${santralMap[selectedMaintenance.santralId]?.ad || ''} • ${sahaMap[selectedMaintenance.sahaId]?.ad || ''}`}
          status={selectedMaintenance.genelDurum ? {
            label: translateStatus(selectedMaintenance.genelDurum),
            variant: selectedMaintenance.genelDurum === 'tamamlandi' ? 'success' : 
                    selectedMaintenance.genelDurum === 'devam-ediyor' ? 'warning' : 'default'
          } : undefined}
          details={[
            // Temel Bilgiler
            {
              label: selectedMaintenance.type === 'yapilanis' ? 'Saha/Santral' : 'Santral',
              value: santralMap[selectedMaintenance.santralId]?.ad || sahaMap[selectedMaintenance.sahaId]?.ad || '-',
              icon: Building2
            },
            ...(selectedMaintenance.saha ? [{
              label: 'Saha',
              value: selectedMaintenance.saha,
              icon: MapPin as any
            }] : []),
            {
              label: 'Personel',
              value: selectedMaintenance.yapanKisiId && userMap[selectedMaintenance.yapanKisiId] 
                ? userMap[selectedMaintenance.yapanKisiId].ad 
                : selectedMaintenance.yapanKisi || selectedMaintenance.personel || '-',
              icon: User
            },
            {
              label: 'Tarih',
              value: selectedMaintenance.tarih?.toDate 
                ? formatDate(selectedMaintenance.tarih.toDate()) 
                : formatDate(new Date(selectedMaintenance.tarih || Date.now())),
              icon: Calendar
            },
            ...(selectedMaintenance.baslangicSaati ? [{
              label: 'Başlangıç Saati',
              value: selectedMaintenance.baslangicSaati,
              icon: Clock as any
            }] : []),
            ...(selectedMaintenance.bitisSaati ? [{
              label: 'Bitiş Saati',
              value: selectedMaintenance.bitisSaati,
              icon: Clock as any
            }] : []),
            
            // Açıklama ve Notlar
            ...(selectedMaintenance.aciklama ? [{
              label: 'Açıklama',
              value: selectedMaintenance.aciklama,
              fullWidth: true
            }] : []),
            ...(selectedMaintenance.notlar ? [{
              label: 'Notlar',
              value: selectedMaintenance.notlar,
              fullWidth: true
            }] : []),
            
            // Yapılan İşler (Yapılan İş formu için)
            ...(selectedMaintenance.type === 'yapilanis' && selectedMaintenance.yapilanIsler ? [{
              label: 'Yapılan İşler',
              value: selectedMaintenance.yapilanIsler,
              fullWidth: true
            }] : []),
            
            // Kullanılan Malzemeler
            ...(selectedMaintenance.kullanilanMalzemeler && selectedMaintenance.kullanilanMalzemeler.length > 0 ? [{
              label: 'Kullanılan Malzemeler',
              value: selectedMaintenance.kullanilanMalzemeler.join(', '),
              fullWidth: true
            }] : []),
            
            // Kontrol Listesi - Kartla bire bir aynı etiketler
            ...(selectedMaintenance.kontroller ? [{
              label: 'Kontrol Listesi',
              fullWidth: true,
              value: (
                <div className="flex flex-wrap gap-1.5">
                  {(() => {
                    const raw = selectedMaintenance.kontroller || {} as Record<string, any>;
                    const entries = Object.entries(raw);
                    // Eğer değerler boolean ise sadece true olanları al
                    const labels = (entries.length > 0 && typeof entries[0][1] === 'boolean')
                      ? entries.filter(([, v]) => v === true).map(([k]) => k)
                      : Object.keys(raw);
                    return labels.map((label: string, i: number) => (
                      <span key={`${label}-${i}`} className="px-2 py-0.5 rounded-full bg-gray-50 text-gray-700">
                        {label}
                      </span>
                    ));
                  })()}
                </div>
              )
            }] : [])
          ]}
          images={selectedMaintenance.fotograflar || []}
          actions={[
            ...(canPerformAction('maintenance', 'update') && selectedMaintenance.genelDurum !== 'tamamlandi' ? [{
              label: 'Tamamlandı İşaretle',
              onClick: async () => {
                try {
                  await bakimService.updateMaintenanceStatus(
                    selectedMaintenance.id,
                    selectedMaintenance.type,
                    'tamamlandi'
                  );
                  toast.success('Bakım tamamlandı olarak işaretlendi');
                  setShowDetailModal(false);
                  fetchMaintenanceData();
                } catch (error) {
                  toast.error('Güncelleme başarısız');
                }
              },
              variant: 'primary' as const,
              icon: CheckCircle
            }] : [])
          ]}
        />
      )}

      {/* Eski modal içeriği - artık kullanılmıyor */}
      {false && (
          <div className="space-y-6">
            {/* Status and Date Badges */}
            <div className="flex flex-wrap gap-2">
              {selectedMaintenance.genelDurum && (
                <Badge className={getDurumBadge(selectedMaintenance.genelDurum)}>
                  {translateStatus(selectedMaintenance.genelDurum)}
                </Badge>
              )}
              <Badge variant="secondary">
                {selectedMaintenance.tarih?.toDate 
                  ? formatDateTime(selectedMaintenance.tarih.toDate()) 
                  : formatDateTime(new Date(selectedMaintenance.tarih || Date.now()))}
              </Badge>
            </div>

            {/* Main Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                  <h3 className="font-medium text-gray-900 flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    {selectedMaintenance.type === 'yapilanis' ? 'İş Bilgileri' : 'Santral Bilgileri'}
                  </h3>
                  <div className="space-y-2 text-sm">
                    {selectedMaintenance.type === 'yapilanis' ? (
                      <>
                        <div>
                          <span className="text-gray-500">Başlık:</span>
                          <span className="ml-2 text-gray-900 font-medium">
                            {selectedMaintenance.baslik || '-'}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">Saha:</span>
                          <span className="ml-2 text-gray-900 font-medium">
                            {santralMap[selectedMaintenance.santralId]?.ad || sahaMap[selectedMaintenance.sahaId]?.ad || '-'}
                          </span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                          <span className="text-gray-500">Santral:</span>
                          <span className="ml-2 text-gray-900 font-medium">
                            {santralMap[selectedMaintenance.santralId]?.ad || '-'}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">Saha:</span>
                          <span className="ml-2 text-gray-900 font-medium">
                            {sahaMap[selectedMaintenance.sahaId]?.ad || '-'}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                  <h3 className="font-medium text-gray-900 flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Personel Bilgileri
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-gray-500">
                        {selectedMaintenance.type === 'yapilanis' ? 'Personel:' : 'Yapan Kişi:'}
                      </span>
                      <span className="ml-2 text-gray-900 font-medium">
                        {selectedMaintenance.yapanKisiId && userMap[selectedMaintenance.yapanKisiId] 
                          ? userMap[selectedMaintenance.yapanKisiId].ad 
                          : selectedMaintenance.yapanKisi || selectedMaintenance.personel || '-'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Tarih:</span>
                      <span className="ml-2 text-gray-900 font-medium">
                        {selectedMaintenance.tarih?.toDate 
                          ? formatDate(selectedMaintenance.tarih.toDate()) 
                          : formatDate(new Date(selectedMaintenance.tarih || Date.now()))}
                      </span>
                    </div>
                    {selectedMaintenance.baslangicSaati && (
                      <div>
                        <span className="text-gray-500">Başlangıç:</span>
                        <span className="ml-2 text-gray-900 font-medium">
                          {selectedMaintenance.baslangicSaati}
                        </span>
                      </div>
                    )}
                    {selectedMaintenance.bitisSaati && (
                      <div>
                        <span className="text-gray-500">Bitiş:</span>
                        <span className="ml-2 text-gray-900 font-medium">
                          {selectedMaintenance.bitisSaati}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column */}
              {selectedMaintenance.type === 'yapilanis' ? (
                <div className="space-y-4">
                  {/* Yapılan İşler */}
                  {selectedMaintenance.yapilanIsler && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="font-medium text-gray-900 mb-3">Yapılan İşler</h3>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">
                        {selectedMaintenance.yapilanIsler}
                      </p>
                    </div>
                  )}
                  
                  {/* Kullanılan Malzemeler */}
                  {selectedMaintenance.kullanilanMalzemeler && selectedMaintenance.kullanilanMalzemeler.length > 0 && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="font-medium text-gray-900 mb-3">Kullanılan Malzemeler</h3>
                      <div className="space-y-2">
                        {selectedMaintenance.kullanilanMalzemeler.map((malzeme: any, index: number) => (
                          <div key={index} className="flex justify-between text-sm">
                            <span className="text-gray-700">{malzeme.ad}</span>
                            <span className="text-gray-900 font-medium">
                              {malzeme.miktar} {malzeme.birim}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                    {selectedMaintenance.type === 'elektrik' ? (
                      <Zap className="h-4 w-4" />
                    ) : (
                      <Cog className="h-4 w-4" />
                    )}
                    Kontrol Listesi
                  </h3>
                  {selectedMaintenance.kontroller && Object.keys(selectedMaintenance.kontroller).length > 0 ? (
                    <div className="space-y-2">
                      {Object.entries(selectedMaintenance.kontroller).map(([key, value]) => (
                        <div key={key} className="flex items-center gap-2 text-sm">
                          <div className={`w-4 h-4 rounded ${value ? 'bg-green-500' : 'bg-gray-300'}`}>
                            {value && (
                              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                          <span className={value ? 'text-gray-900' : 'text-gray-500'}>{key}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">Kontrol listesi bilgisi yok</p>
                  )}
                </div>
              )}
            </div>

            {/* Notes/Description */}
            {(selectedMaintenance.notlar || selectedMaintenance.aciklama) && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-medium text-blue-900 mb-2">
                  {selectedMaintenance.type === 'yapilanis' ? 'Açıklama' : 'Bakım Notları'}
                </h3>
                <p className="text-sm text-blue-800 whitespace-pre-wrap">
                  {selectedMaintenance.notlar || selectedMaintenance.aciklama}
                </p>
              </div>
            )}

            {/* Photos */}
            {selectedMaintenance.fotograflar && selectedMaintenance.fotograflar.length > 0 && (
              <div>
                <h3 className="font-medium text-gray-900 mb-3">Fotoğraflar</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {selectedMaintenance.fotograflar.map((photo: string, index: number) => (
                    <div key={index} className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                      <LazyImage
                        src={photo}
                        alt={`Fotoğraf ${index + 1}`}
                        className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => window.open(photo, '_blank')}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
      )}
    </div>
  );
};

export default Bakim;
