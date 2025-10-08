import React, { useState, useEffect, useRef } from 'react';
import { Plus, Package, AlertTriangle, TrendingDown, Search, Download, Building2, Sun, Edit, Trash2, Eye, ArrowUpDown, MapPin, Upload, X, Image as ImageIcon, History, FileText, Filter } from 'lucide-react';
import { Button, Card, CardContent, CardHeader, CardTitle, Modal, Input, Select, LoadingSpinner, Badge, LazyImage } from '../../components/ui';
import { stokService, getStokDurumu, type StokItem, type StokHareket } from '../../services/stokService';
import { getAllSahalar } from '../../services/sahaService';
import { getAllSantraller } from '../../services/santralService';
import { storageService } from '../../services/storageService';
import { useCompany } from '../../hooks/useCompany';
import { useAuth } from '../../hooks/useAuth';
import { formatDate, formatCurrency } from '../../utils/formatters';
import { exportToExcel } from '../../utils/exportUtils';
import { exportStokToPDF } from '../../utils/pdfReportUtils';
import toast from 'react-hot-toast';

interface Saha {
  id: string;
  ad: string;
  konum?: {
    adres?: string;
  };
}

interface Santral {
  id: string;
  ad: string;
  sahaId: string;
  sahaAdi?: string;
}

const StokKontrol: React.FC = () => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showHareketModal, setShowHareketModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [showHareketGecmisiModal, setShowHareketGecmisiModal] = useState(false);
  const [selectedStok, setSelectedStok] = useState<StokItem | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sahaFilter, setSahaFilter] = useState<string>('all');

  // Gerçek veriler
  const [stoklar, setStoklar] = useState<(StokItem & { durum: 'normal' | 'dusuk' | 'kritik' })[]>([]);
  const [sahalar, setSahalar] = useState<Saha[]>([]);
  const [santraller, setSantraller] = useState<Santral[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const { company } = useCompany();
  const { userProfile, canPerformAction } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showMobileFilters, setShowMobileFilters] = useState<boolean>(false);

  // Form states
  const [formData, setFormData] = useState({
    malzemeAdi: '',
    kategori: '',
    birim: '',
    mevcutStok: 0,
    minimumStokSeviyesi: 0,
    birimFiyat: 0,
    tedarikci: '',
    sahaId: '',
    santralId: '',
    konum: '',
    notlar: '',
    resimler: [] as string[]
  });

  // Resim yükleme state'leri
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // Hareket geçmişi state'leri
  const [stokHareketleri, setStokHareketleri] = useState<StokHareket[]>([]);
  const [hareketLoading, setHareketLoading] = useState(false);

  const [hareketForm, setHareketForm] = useState({
    hareketTipi: 'giris' as 'giris' | 'cikis' | 'transfer',
    miktar: 0,
    aciklama: ''
  });

  // Verileri getir
  const fetchData = async () => {
    if (!company?.id) return;
    
    try {
      setIsLoading(true);
      
      // Paralel olarak verileri getir
      const [stokData, sahaData, santralData] = await Promise.all([
        stokService.getAllStoklar(
          company.id,
          userProfile?.rol,
          userProfile?.sahalar as any,
          userProfile?.santraller as any
        ),
        getAllSahalar(company.id, userProfile?.rol, userProfile?.sahalar),
        getAllSantraller(company.id, userProfile?.rol, userProfile?.santraller)
      ]);
      
      // Müşteri izolasyonu: sadece atanan saha/santrallerin stokları
      let visibleStoklar = stokData;
      if (['musteri', 'tekniker', 'muhendis', 'bekci'].includes(userProfile?.rol || '')) {
        const allowedSahalar = (userProfile.sahalar as string[]) || [];
        const allowedSantraller = userProfile.santraller || [];
        visibleStoklar = stokData.filter(s => {
          const sahaMatch = s.sahaId ? allowedSahalar.includes(s.sahaId) : false;
          const santralMatch = s.santralId ? allowedSantraller.includes(s.santralId) : false;
          // Eğer stok bir sahaya/santrale bağlı değilse müşteri görmesin
          return sahaMatch || santralMatch;
        });
      }

      // Durumları hesapla
      const stokWithStatus = visibleStoklar.map(stok => ({
        ...stok,
        durum: getStokDurumu(
          Number(stok.mevcutStok || 0),
          Number((stok.minimumStokSeviyesi ?? (stok as any).minimumStok) || 0),
          stok.maximumStok
        )
      })) as (StokItem & { durum: 'normal' | 'dusuk' | 'kritik' })[];
      
      setStoklar(stokWithStatus);
      setSahalar(sahaData);
      setSantraller(santralData);
    } catch (error) {
      console.error('Veri getirme hatası:', error);
      toast.error('Veriler yüklenemedi');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (company?.id && userProfile?.companyId) {
      fetchData();
    }
  }, [company?.id, userProfile?.companyId, userProfile?.rol, userProfile?.sahalar, userProfile?.santraller]);

  // Resim seçme
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length === 0) {
      toast.error('Lütfen sadece resim dosyası seçin');
      return;
    }
    
    if (imageFiles.length + selectedFiles.length > 5) {
      toast.error('En fazla 5 resim yükleyebilirsiniz');
      return;
    }
    
    setSelectedFiles([...selectedFiles, ...imageFiles]);
  };

  // Resim silme
  const handleRemoveImage = (index: number, isUploaded: boolean = false) => {
    if (isUploaded) {
      setUploadedImages(uploadedImages.filter((_, i) => i !== index));
      setFormData({ ...formData, resimler: uploadedImages.filter((_, i) => i !== index) });
    } else {
      setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
    }
  };

  // Resimleri yükle
  const uploadImages = async (): Promise<string[]> => {
    if (selectedFiles.length === 0) return uploadedImages;
    if (!company?.id) {
      toast.error('Şirket bilgisi bulunamadı');
      return uploadedImages;
    }
    
    setIsUploading(true);
    
    try {
      const urls = await storageService.uploadStokPhotos(selectedFiles, company.id);
      
      const allUrls = [...uploadedImages, ...urls];
      setUploadedImages(allUrls);
      setSelectedFiles([]);
      return allUrls;
    } catch (error) {
      console.error('Resim yükleme hatası:', error);
      toast.error('Resimler yüklenirken hata oluştu');
      return uploadedImages;
    } finally {
      setIsUploading(false);
    }
  };

  // Yeni stok ekle
  const handleAddStok = async () => {
    if (!company?.id || !userProfile?.id) return;
    
    try {
      if (!formData.malzemeAdi || !formData.kategori || !formData.birim) {
        toast.error('Lütfen zorunlu alanları doldurun');
        return;
      }

      // Resimleri yükle
      const imageUrls = await uploadImages();

      const stokData = {
        ...formData,
        companyId: company.id,
        mevcutStok: Number(formData.mevcutStok),
        minimumStokSeviyesi: Number(formData.minimumStokSeviyesi),
        birimFiyat: Number(formData.birimFiyat),
        resimler: imageUrls
      };

      await stokService.createStok(stokData);
      
      toast.success('Stok başarıyla eklendi');
      setShowAddModal(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Stok ekleme hatası:', error);
      toast.error('Stok eklenirken hata oluştu');
    }
  };

  // Stok güncelle
  const handleUpdateStok = async () => {
    if (!selectedStok) return;
    
    try {
      // Resimleri yükle
      const imageUrls = await uploadImages();
      
      const updateData = {
        ...formData,
        mevcutStok: Number(formData.mevcutStok),
        minimumStokSeviyesi: Number(formData.minimumStokSeviyesi),
        birimFiyat: Number(formData.birimFiyat),
        resimler: imageUrls
      };

      await stokService.updateStok(selectedStok.id, updateData);
      
      toast.success('Stok güncellendi');
      setShowEditModal(false);
      setSelectedStok(null);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Güncelleme hatası:', error);
      toast.error('Güncelleme sırasında hata oluştu');
    }
  };

  // Stok sil
  const handleDeleteStok = async (stokId: string) => {
    if (!window.confirm('Bu stok kaydını silmek istediğinize emin misiniz?')) return;
    
    try {
      await stokService.deleteStok(stokId);
      toast.success('Stok silindi');
      fetchData();
    } catch (error) {
      console.error('Silme hatası:', error);
      toast.error('Stok silinirken hata oluştu');
    }
  };

  // Stok hareketi ekle
  const handleStokHareket = async () => {
    if (!selectedStok || !company?.id || !userProfile?.id) return;
    
    try {
      await stokService.addStokHareket(selectedStok.id, {
        ...hareketForm,
        miktar: Number(hareketForm.miktar),
        yapanKisi: userProfile.ad,
        companyId: company.id
      });
      
      toast.success('Stok hareketi kaydedildi');
      setShowHareketModal(false);
      setSelectedStok(null);
      setHareketForm({
        hareketTipi: 'giris',
        miktar: 0,
        aciklama: ''
      });
      fetchData();
    } catch (error: any) {
      console.error('Hareket hatası:', error);
      toast.error(error.message || 'Stok hareketi eklenirken hata oluştu');
    }
  };

  // Hareket geçmişini getir
  const fetchStokHareketleri = async (stokId: string) => {
    if (!stokId || !company?.id) return;
    
    setHareketLoading(true);
    try {
      const hareketler = await stokService.getStokHareketleri(stokId, company.id);
      setStokHareketleri(hareketler);
    } catch (error) {
      console.error('Stok hareketleri getirme hatası:', error);
      toast.error('Hareket geçmişi yüklenemedi');
    } finally {
      setHareketLoading(false);
    }
  };

  // Hareket geçmişi modalını aç
  const handleShowHareketGecmisi = (stok: StokItem) => {
    setSelectedStok(stok);
    setShowHareketGecmisiModal(true);
    fetchStokHareketleri(stok.id!);
  };

  // Form sıfırlama
  const resetForm = () => {
    setFormData({
      malzemeAdi: '',
      kategori: '',
      birim: '',
      mevcutStok: 0,
      minimumStokSeviyesi: 0,
      birimFiyat: 0,
      tedarikci: '',
      sahaId: '',
      santralId: '',
      konum: '',
      notlar: '',
      resimler: []
    });
    setSelectedFiles([]);
    setUploadedImages([]);
  };

  // Sahaya göre santralleri filtrele
  const getSantrallerBySaha = (sahaId: string): Santral[] => {
    if (!sahaId) return [];
    return santraller.filter(santral => santral.sahaId === sahaId);
  };

  // Saha ve santral isimlerini getir
  const getSahaName = (sahaId?: string): string => {
    if (!sahaId) return 'Genel Depo';
    const saha = sahalar.find(s => s.id === sahaId);
    return saha?.ad || 'Bilinmeyen Saha';
  };

  const getSantralName = (santralId?: string): string => {
    if (!santralId) return '-';
    const santral = santraller.find(s => s.id === santralId);
    return santral?.ad || 'Bilinmeyen Santral';
  };

  // Excel export
  const handleExcelExport = () => {
    const exportData = stoklar.map(stok => ({
      'Malzeme Adı': stok.malzemeAdi,
      'Kategori': stok.kategori,
      'Saha': getSahaName(stok.sahaId),
      'Santral': getSantralName(stok.santralId),
      'Mevcut Stok': stok.mevcutStok,
      'Birim': stok.birim,
      'Min. Seviye': stok.minimumStokSeviyesi,
      'Birim Fiyat': stok.birimFiyat,
      'Toplam Değer': stok.mevcutStok * stok.birimFiyat,
      'Tedarikçi': stok.tedarikci || '-',
      'Konum': stok.konum || '-',
      'Durum': getDurumText(stok.durum),
      'Son Güncelleme': formatDate(stok.sonGuncelleme)
    }));

    exportToExcel(exportData, 'stok-raporu');
    toast.success('Excel dosyası indirildi');
  };

  // PDF export - Profesyonel (Arızalar/Bakım ile aynı sistem)
  const handlePdfExport = async () => {
    const loadingToast = toast.loading('PDF raporu indiriliyor...', {
      duration: Infinity
    });

    try {
      // Saha ve santral map'lerini oluştur
      const sahaMap: Record<string, { id: string; ad: string }> = {};
      sahalar.forEach(saha => {
        sahaMap[saha.id] = { id: saha.id, ad: saha.ad };
      });

      const santralMapForPDF: Record<string, { id: string; ad: string }> = {};
      santraller.forEach(santral => {
        santralMapForPDF[santral.id] = { id: santral.id, ad: santral.ad };
      });

      // Profesyonel PDF oluştur
      await exportStokToPDF({
        stoklar: filteredStoklar,
        company: company,
        sahaMap: sahaMap,
        santralMap: santralMapForPDF,
        filters: {
          category: categoryFilter !== 'all' ? categoryFilter : undefined,
          status: statusFilter !== 'all' ? statusFilter : undefined,
          saha: sahaFilter !== 'all' && sahaFilter !== '' ? sahaFilter : undefined
        }
      });

      // PDF indirme işleminin tamamlanması için bekle
      await new Promise(resolve => setTimeout(resolve, 2500));
      
      // Toast'ı kapat ve başarı mesajı göster
      toast.dismiss(loadingToast);
      toast.success('PDF raporu indirildi');
    } catch (error) {
      console.error('PDF oluşturma hatası:', error);
      toast.dismiss(loadingToast);
      toast.error('PDF oluşturulamadı');
    }
  };

  // Kategori seçenekleri
  const categoryOptions = [
    { value: 'all', label: 'Tüm Kategoriler' },
    { value: 'Elektrik', label: 'Elektrik Malzemeleri' },
    { value: 'Mekanik', label: 'Mekanik Parçalar' },
    { value: 'Temizlik', label: 'Temizlik Malzemeleri' },
    { value: 'Güvenlik', label: 'Güvenlik Ekipmanları' },
    { value: 'Yedek Parça', label: 'Yedek Parça' },
    { value: 'Sarf', label: 'Sarf Malzeme' },
    { value: 'Diğer', label: 'Diğer' }
  ];

  const statusOptions = [
    { value: 'all', label: 'Tüm Durumlar' },
    { value: 'normal', label: 'Normal' },
    { value: 'dusuk', label: 'Düşük Stok' },
    { value: 'kritik', label: 'Kritik Stok' }
  ];

  const birimOptions = [
    { value: 'Adet', label: 'Adet' },
    { value: 'Metre', label: 'Metre' },
    { value: 'Kg', label: 'Kilogram' },
    { value: 'Litre', label: 'Litre' },
    { value: 'Paket', label: 'Paket' },
    { value: 'Kutu', label: 'Kutu' },
    { value: 'Rulo', label: 'Rulo' }
  ];

  // Filtrelenmiş stoklar
  const filteredStoklar = stoklar.filter(stok => {
    const matchesSearch = stok.malzemeAdi.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (stok.tedarikci?.toLowerCase().includes(searchTerm.toLowerCase()) || false);
    const matchesCategory = categoryFilter === 'all' || stok.kategori === categoryFilter;
    const matchesStatus = statusFilter === 'all' || stok.durum === statusFilter;
    const matchesSaha = sahaFilter === 'all' || stok.sahaId === sahaFilter || (!sahaFilter && !stok.sahaId);
    return matchesSearch && matchesCategory && matchesStatus && matchesSaha;
  });

  const getDurumBadge = (durum: 'normal' | 'dusuk' | 'kritik') => {
    const badges = {
      'normal': 'bg-green-100 text-green-800',
      'dusuk': 'bg-yellow-100 text-yellow-800',
      'kritik': 'bg-red-100 text-red-800'
    };
    return badges[durum];
  };

  const getDurumText = (durum: 'normal' | 'dusuk' | 'kritik') => {
    const texts = {
      'normal': 'Normal',
      'dusuk': 'Düşük Stok',
      'kritik': 'Kritik Stok'
    };
    return texts[durum];
  };

  const getDurumIcon = (durum: 'normal' | 'dusuk' | 'kritik') => {
    switch (durum) {
      case 'kritik':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'dusuk':
        return <TrendingDown className="h-4 w-4 text-yellow-500" />;
      default:
        return <Package className="h-4 w-4 text-green-500" />;
    }
  };

  // İstatistikler
  const stats = {
    toplam: stoklar.length,
    normal: stoklar.filter(s => s.durum === 'normal').length,
    dusuk: stoklar.filter(s => s.durum === 'dusuk').length,
    kritik: stoklar.filter(s => s.durum === 'kritik').length,
    toplamDeger: stoklar.reduce((sum, stok) => sum + (stok.mevcutStok * stok.birimFiyat), 0)
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Stok Kontrol</h1>
          <p className="text-sm sm:text-base text-gray-600">Malzeme envanterini yönetin ve takip edin</p>
        </div>
        <div className="flex items-center gap-2" data-pdf-exclude="true">
          {/* Masaüstü */}
          <Button 
            variant="secondary" 
            className="hidden sm:inline-flex"
            leftIcon={<Download className="h-4 w-4" />}
            onClick={handlePdfExport}
          >
            Rapor İndir
          </Button>
          <Button 
            variant="secondary" 
            className="hidden sm:inline-flex"
            leftIcon={<FileText className="h-4 w-4" />}
            onClick={handleExcelExport}
          >
            Excel İndir
          </Button>
          {canPerformAction('stok_ekle') && (
            <Button 
              className="hidden sm:inline-flex"
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={() => setShowAddModal(true)}
            >
              Yeni Malzeme
            </Button>
          )}
          {/* Mobil ikonlar */}
          <div className="flex sm:hidden items-center gap-2">
            <Button variant="secondary" size="sm" className="px-2 py-1 text-xs" onClick={handlePdfExport} title="Rapor indir">
              <Download className="w-4 h-4" />
            </Button>
            <Button variant="secondary" size="sm" className="px-2 py-1 text-xs" onClick={handleExcelExport} title="Excel indir">
              <FileText className="w-4 h-4" />
            </Button>
            {canPerformAction('stok_ekle') && (
              <Button size="sm" className="px-2 py-1 text-xs" onClick={() => setShowAddModal(true)} title="Yeni Malzeme">
                <Plus className="w-4 h-4" />
              </Button>
            )}
            <Button variant="secondary" size="sm" className="px-2 py-1 text-xs" onClick={()=>setShowMobileFilters(v=>!v)} title="Filtreler">
              <Filter className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* İstatistikler - Mobilde 2 sütun */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="text-center">
              <div className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">{stats.toplam}</div>
              <div className="text-[10px] sm:text-xs lg:text-sm text-gray-600">Toplam Malzeme</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="text-center">
              <div className="text-lg sm:text-xl lg:text-2xl font-bold text-green-600">{stats.normal}</div>
              <div className="text-[10px] sm:text-xs lg:text-sm text-gray-600">Normal Stok</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="text-center">
              <div className="text-lg sm:text-xl lg:text-2xl font-bold text-yellow-600">{stats.dusuk}</div>
              <div className="text-[10px] sm:text-xs lg:text-sm text-gray-600">Düşük Stok</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="text-center">
              <div className="text-lg sm:text-xl lg:text-2xl font-bold text-red-600">{stats.kritik}</div>
              <div className="text-[10px] sm:text-xs lg:text-sm text-gray-600">Kritik Stok</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="text-center">
              <div className="text-lg sm:text-xl lg:text-2xl font-bold text-primary-600">
                {formatCurrency(stats.toplamDeger)}
              </div>
              <div className="text-[10px] sm:text-xs lg:text-sm text-gray-600">Toplam Değer</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className={`grid grid-cols-1 lg:grid-cols-5 gap-4 ${showMobileFilters ? '' : 'hidden md:grid lg:grid'}`}>
            <div className="lg:col-span-2">
              <Input
                placeholder="Malzeme adı veya tedarikçi ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                leftIcon={<Search className="h-4 w-4 text-gray-400" />}
              />
            </div>
            <Select
              options={categoryOptions}
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            />
            <Select
              options={statusOptions}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            />
            <Select
              options={[
                { value: 'all', label: 'Tüm Sahalar' },
                { value: '', label: 'Genel Depo' },
                ...sahalar.map(s => ({ value: s.id, label: s.ad }))
              ]}
              value={sahaFilter}
              onChange={(e) => setSahaFilter(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Stok Listesi */}
      <Card>
        <CardHeader>
          <CardTitle>Malzeme Listesi ({filteredStoklar.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredStoklar.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Stok bulunamadı</h3>
              <p className="text-gray-600">Yeni malzeme ekleyerek başlayın</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <div className="inline-block min-w-full align-middle">
                <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-2 sm:px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      Resim
                    </th>
                    <th className="px-2 sm:px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      Malzeme
                    </th>
                    <th className="px-2 sm:px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      Konum
                    </th>
                    <th className="px-2 sm:px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      Stok Durumu
                    </th>
                    <th className="px-2 sm:px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      Değer
                    </th>
                    <th className="px-2 sm:px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      Durum
                    </th>
                    <th className="px-2 sm:px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      İşlemler
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredStoklar.map((stok) => (
                    <tr key={stok.id} className="hover:bg-gray-50">
                      <td className="px-2 sm:px-3 py-2 sm:py-3">
                        <div className="flex justify-center">
                          {stok.resimler && stok.resimler.length > 0 ? (
                            <div 
                              className="relative group cursor-pointer"
                              onClick={() => {
                                setSelectedStok(stok);
                                setShowImageModal(true);
                              }}
                            >
                              <img 
                                src={stok.resimler[0]} 
                                alt={stok.malzemeAdi}
                                className="h-12 w-12 object-cover rounded-lg border border-gray-200 group-hover:border-blue-500 transition-colors"
                              />
                              {stok.resimler.length > 1 && (
                                <div className="absolute -bottom-1 -right-1 bg-blue-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                                  +{stok.resimler.length - 1}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="h-12 w-12 bg-gray-100 rounded-lg flex items-center justify-center">
                              <ImageIcon className="h-6 w-6 text-gray-400" />
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-2 sm:px-3 py-2 sm:py-3">
                        <div>
                          <div className="text-xs sm:text-sm font-medium text-gray-900">
                            {stok.malzemeAdi}
                          </div>
                          <div className="text-xs text-gray-500">
                            {stok.kategori} • {stok.tedarikci || 'Tedarikçi belirtilmemiş'}
                          </div>
                        </div>
                      </td>
                      <td className="px-2 sm:px-3 py-2 sm:py-3">
                        <div className="text-xs sm:text-sm">
                          <div className="flex items-center text-gray-900">
                            <Building2 className="h-3 w-3 mr-1" />
                            {getSahaName(stok.sahaId)}
                          </div>
                          {stok.santralId && (
                            <div className="flex items-center text-xs text-gray-500 mt-1">
                              <Sun className="h-3 w-3 mr-1" />
                              {getSantralName(stok.santralId)}
                            </div>
                          )}
                          {stok.konum && (
                            <div className="flex items-center text-xs text-gray-500 mt-1">
                              <MapPin className="h-3 w-3 mr-1" />
                              {stok.konum}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-2 sm:px-3 py-2 sm:py-3 text-center">
                        <div>
                          <div className="text-xs sm:text-sm font-semibold text-gray-900">
                            {stok.mevcutStok} {stok.birim}
                          </div>
                          <div className="text-xs text-gray-500">
                            Min: {stok.minimumStokSeviyesi} {stok.birim}
                          </div>
                        </div>
                      </td>
                      <td className="px-2 sm:px-3 py-2 sm:py-3 text-right">
                        <div>
                          <div className="text-xs sm:text-sm font-semibold text-gray-900">
                            {formatCurrency(stok.mevcutStok * stok.birimFiyat)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {formatCurrency(stok.birimFiyat)}/{stok.birim}
                          </div>
                        </div>
                      </td>
                      <td className="px-2 sm:px-3 py-2 sm:py-3">
                        <div className="flex justify-center items-center">
                          {getDurumIcon(stok.durum)}
                          <span className={`ml-1 sm:ml-2 px-1 sm:px-2 py-1 text-xs font-medium rounded-full ${getDurumBadge(stok.durum)}`}>
                            {getDurumText(stok.durum)}
                          </span>
                        </div>
                      </td>
                      <td className="px-2 sm:px-3 py-2 sm:py-3">
                        <div className="flex justify-center flex-wrap gap-1">
                          {stok.resimler && stok.resimler.length > 0 && (
                            <button
                              className="p-1 hover:bg-gray-100 rounded"
                              onClick={() => {
                                setSelectedStok(stok);
                                setShowImageModal(true);
                              }}
                              title="Resim"
                            >
                              <ImageIcon className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            className="p-1 hover:bg-gray-100 rounded"
                            onClick={() => {
                              setSelectedStok(stok);
                              setShowHareketModal(true);
                            }}
                            title="Hareket"
                          >
                            <ArrowUpDown className="h-4 w-4" />
                          </button>
                          <button
                            className="p-1 hover:bg-gray-100 rounded hidden sm:block"
                            onClick={() => handleShowHareketGecmisi(stok)}
                            title="Geçmiş"
                          >
                            <History className="h-4 w-4" />
                          </button>
                          {canPerformAction('stok_duzenle') && (
                            <button
                              className="p-1 hover:bg-gray-100 rounded"
                              onClick={() => {
                                setSelectedStok(stok);
                                setFormData({
                                  malzemeAdi: stok.malzemeAdi,
                                  kategori: stok.kategori,
                                  birim: stok.birim,
                                  mevcutStok: stok.mevcutStok,
                                  minimumStokSeviyesi: stok.minimumStokSeviyesi,
                                  birimFiyat: stok.birimFiyat,
                                  tedarikci: stok.tedarikci || '',
                                  sahaId: stok.sahaId || '',
                                  santralId: stok.santralId || '',
                                  konum: stok.konum || '',
                                  notlar: stok.notlar || '',
                                  resimler: stok.resimler || []
                                });
                                setUploadedImages(stok.resimler || []);
                                setShowEditModal(true);
                              }}
                              title="Düzenle"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                          )}
                          {canPerformAction('stok_sil') && (
                            <button
                              className="p-1 hover:bg-red-100 rounded text-red-600"
                              onClick={() => handleDeleteStok(stok.id)}
                              title="Sil"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                </table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Kritik Stok Uyarıları */}
      {stoklar.filter(s => s.durum === 'kritik' || s.durum === 'dusuk').length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-red-600">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Stok Uyarıları
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stoklar
                .filter(s => s.durum === 'kritik' || s.durum === 'dusuk')
                .map((stok) => (
                  <div key={stok.id} className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                    <div className="flex items-center">
                      {getDurumIcon(stok.durum)}
                      <div className="ml-3">
                        <div className="font-medium text-gray-900">
                          {stok.malzemeAdi}
                          <span className="text-sm text-gray-600 ml-2">
                            ({getSahaName(stok.sahaId)})
                          </span>
                        </div>
                        <div className="text-sm text-gray-600">
                          Mevcut: {stok.mevcutStok} {stok.birim} | 
                          Minimum: {stok.minimumStokSeviyesi} {stok.birim}
                        </div>
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      variant="danger"
                      onClick={() => {
                        setSelectedStok(stok);
                        setHareketForm({ ...hareketForm, hareketTipi: 'giris' });
                        setShowHareketModal(true);
                      }}
                    >
                      Stok Ekle
                    </Button>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Yeni Malzeme Ekleme Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          resetForm();
        }}
        title="Yeni Malzeme Ekle"
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Malzeme Adı"
              placeholder="Örn: MC4 Konnektör"
              value={formData.malzemeAdi}
              onChange={(e) => setFormData({ ...formData, malzemeAdi: e.target.value })}
              required
            />

            <Select
              label="Kategori"
              options={categoryOptions.filter(c => c.value !== 'all')}
              value={formData.kategori}
              onChange={(e) => setFormData({ ...formData, kategori: e.target.value })}
              placeholder="Kategori seçiniz"
              required
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <Select
              label="Birim"
              options={birimOptions}
              value={formData.birim}
              onChange={(e) => setFormData({ ...formData, birim: e.target.value })}
              placeholder="Birim seçiniz"
              required
            />

            <Input
              label="Mevcut Stok"
              type="number"
              placeholder="0"
              value={formData.mevcutStok}
              onChange={(e) => setFormData({ ...formData, mevcutStok: Number(e.target.value) })}
              required
            />

            <Input
              label="Minimum Seviye"
              type="number"
              placeholder="10"
              value={formData.minimumStokSeviyesi}
              onChange={(e) => setFormData({ ...formData, minimumStokSeviyesi: Number(e.target.value) })}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Birim Fiyat (₺)"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={formData.birimFiyat}
              onChange={(e) => setFormData({ ...formData, birimFiyat: Number(e.target.value) })}
              required
            />

            <Input
              label="Tedarikçi"
              placeholder="Tedarikçi firma adı"
              value={formData.tedarikci}
              onChange={(e) => setFormData({ ...formData, tedarikci: e.target.value })}
            />
          </div>

          {/* Saha ve Santral Seçimi */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Saha"
              options={[
                { value: '', label: 'Genel Depo (Saha Yok)' },
                ...sahalar.map(s => ({ value: s.id, label: s.ad }))
              ]}
              value={formData.sahaId}
              onChange={(e) => setFormData({ 
                ...formData, 
                sahaId: e.target.value,
                santralId: '' // Saha değişince santral sıfırla
              })}
              placeholder="Saha seçiniz"
            />

            {formData.sahaId && (
              <Select
                label="Santral (Opsiyonel)"
                options={[
                  { value: '', label: 'Santral Seçilmedi' },
                  ...getSantrallerBySaha(formData.sahaId).map(s => ({ 
                    value: s.id, 
                    label: s.ad 
                  }))
                ]}
                value={formData.santralId}
                onChange={(e) => setFormData({ ...formData, santralId: e.target.value })}
                placeholder="Santral seçiniz"
              />
            )}
          </div>

          <Input
            label="Depo Konumu"
            placeholder="Örn: Raf A-12, Depo 2"
            value={formData.konum}
            onChange={(e) => setFormData({ ...formData, konum: e.target.value })}
            leftIcon={<MapPin className="h-4 w-4 text-gray-400" />}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notlar
            </label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Ek notlar..."
              value={formData.notlar}
              onChange={(e) => setFormData({ ...formData, notlar: e.target.value })}
            />
          </div>

          {/* Resim Yükleme Alanı */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ürün Resimleri (Maks. 5 adet)
            </label>
            
            {/* Yüklenen Resimler */}
            {uploadedImages.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 mb-3">
                {uploadedImages.map((url, index) => (
                  <div key={index} className="relative group">
                    <LazyImage
                      src={url}
                      alt={`Resim ${index + 1}`}
                      className="w-full h-20 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(index, true)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            {/* Seçilen Resimler */}
            {selectedFiles.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 mb-3">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={`Seçilen ${index + 1}`}
                      className="w-full h-20 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(index, false)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            {/* Resim Seçme Butonu */}
            {uploadedImages.length + selectedFiles.length < 5 && (
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="secondary"
                  leftIcon={<Upload className="h-4 w-4" />}
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                >
                  {isUploading ? 'Yükleniyor...' : 'Resim Ekle'}
                </Button>
              </div>
            )}
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">💡 Stok Takip İpucu</p>
              <p>Minimum stok seviyesi, ortalama aylık tüketiminizin 2 katı olarak ayarlanması önerilir.</p>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button 
              variant="ghost" 
              onClick={() => {
                setShowAddModal(false);
                resetForm();
              }}
            >
              İptal
            </Button>
            <Button onClick={handleAddStok}>
              Malzeme Ekle
            </Button>
          </div>
        </div>
      </Modal>

      {/* Düzenleme Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedStok(null);
          resetForm();
        }}
        title="Malzeme Düzenle"
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Malzeme Adı"
              value={formData.malzemeAdi}
              onChange={(e) => setFormData({ ...formData, malzemeAdi: e.target.value })}
              required
            />

            <Select
              label="Kategori"
              options={categoryOptions.filter(c => c.value !== 'all')}
              value={formData.kategori}
              onChange={(e) => setFormData({ ...formData, kategori: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <Select
              label="Birim"
              options={birimOptions}
              value={formData.birim}
              onChange={(e) => setFormData({ ...formData, birim: e.target.value })}
              required
            />

            <Input
              label="Mevcut Stok"
              type="number"
              value={formData.mevcutStok}
              onChange={(e) => setFormData({ ...formData, mevcutStok: Number(e.target.value) })}
              required
            />

            <Input
              label="Minimum Seviye"
              type="number"
              value={formData.minimumStokSeviyesi}
              onChange={(e) => setFormData({ ...formData, minimumStokSeviyesi: Number(e.target.value) })}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Birim Fiyat (₺)"
              type="number"
              step="0.01"
              value={formData.birimFiyat}
              onChange={(e) => setFormData({ ...formData, birimFiyat: Number(e.target.value) })}
              required
            />

            <Input
              label="Tedarikçi"
              value={formData.tedarikci}
              onChange={(e) => setFormData({ ...formData, tedarikci: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Saha"
              options={[
                { value: '', label: 'Genel Depo (Saha Yok)' },
                ...sahalar.map(s => ({ value: s.id, label: s.ad }))
              ]}
              value={formData.sahaId}
              onChange={(e) => setFormData({ 
                ...formData, 
                sahaId: e.target.value,
                santralId: ''
              })}
            />

            {formData.sahaId && (
              <Select
                label="Santral"
                options={[
                  { value: '', label: 'Santral Seçilmedi' },
                  ...getSantrallerBySaha(formData.sahaId).map(s => ({ 
                    value: s.id, 
                    label: s.ad 
                  }))
                ]}
                value={formData.santralId}
                onChange={(e) => setFormData({ ...formData, santralId: e.target.value })}
              />
            )}
          </div>

          <Input
            label="Depo Konumu"
            value={formData.konum}
            onChange={(e) => setFormData({ ...formData, konum: e.target.value })}
            leftIcon={<MapPin className="h-4 w-4 text-gray-400" />}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notlar
            </label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              value={formData.notlar}
              onChange={(e) => setFormData({ ...formData, notlar: e.target.value })}
            />
          </div>

          {/* Resim Yükleme Alanı */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ürün Resimleri (Maks. 5 adet)
            </label>
            
            {/* Yüklenen Resimler */}
            {uploadedImages.length > 0 && (
              <div className="grid grid-cols-5 gap-2 mb-3">
                {uploadedImages.map((url, index) => (
                  <div key={index} className="relative group">
                    <LazyImage
                      src={url}
                      alt={`Resim ${index + 1}`}
                      className="w-full h-20 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(index, true)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            {/* Seçilen Resimler */}
            {selectedFiles.length > 0 && (
              <div className="grid grid-cols-5 gap-2 mb-3">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={`Seçilen ${index + 1}`}
                      className="w-full h-20 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(index, false)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            {/* Resim Seçme Butonu */}
            {uploadedImages.length + selectedFiles.length < 5 && (
              <div>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="edit-file-input"
                />
                <label htmlFor="edit-file-input">
                  <Button
                    type="button"
                    variant="secondary"
                    leftIcon={<Upload className="h-4 w-4" />}
                    onClick={(e) => {
                      e.preventDefault();
                      document.getElementById('edit-file-input')?.click();
                    }}
                    disabled={isUploading}
                  >
                    {isUploading ? 'Yükleniyor...' : 'Resim Ekle'}
                  </Button>
                </label>
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button 
              variant="ghost" 
              onClick={() => {
                setShowEditModal(false);
                setSelectedStok(null);
                resetForm();
              }}
            >
              İptal
            </Button>
            <Button onClick={handleUpdateStok}>
              Güncelle
            </Button>
          </div>
        </div>
      </Modal>

      {/* Stok Hareketi Modal */}
      <Modal
        isOpen={showHareketModal}
        onClose={() => {
          setShowHareketModal(false);
          setSelectedStok(null);
          setHareketForm({
            hareketTipi: 'giris',
            miktar: 0,
            aciklama: ''
          });
        }}
        title={`Stok Hareketi - ${selectedStok?.malzemeAdi}`}
        size="md"
      >
        <div className="space-y-4">
          {selectedStok && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Mevcut Stok:</span>
                  <span className="ml-2 font-semibold">
                    {selectedStok.mevcutStok} {selectedStok.birim}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Konum:</span>
                  <span className="ml-2 font-semibold">
                    {getSahaName(selectedStok.sahaId)}
                  </span>
                </div>
              </div>
            </div>
          )}

          <Select
            label="Hareket Tipi"
            options={[
              { value: 'giris', label: 'Stok Girişi' },
              { value: 'cikis', label: 'Stok Çıkışı' },
              { value: 'transfer', label: 'Transfer' }
            ]}
            value={hareketForm.hareketTipi}
            onChange={(e) => setHareketForm({ 
              ...hareketForm, 
              hareketTipi: e.target.value as 'giris' | 'cikis' | 'transfer' 
            })}
            required
          />

          <Input
            label="Miktar"
            type="number"
            placeholder="0"
            value={hareketForm.miktar}
            onChange={(e) => setHareketForm({ 
              ...hareketForm, 
              miktar: Number(e.target.value) 
            })}
            helperText={
              hareketForm.hareketTipi === 'cikis' && selectedStok
                ? `Maksimum: ${selectedStok.mevcutStok} ${selectedStok.birim}`
                : undefined
            }
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Açıklama
            </label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Hareket sebebi..."
              value={hareketForm.aciklama}
              onChange={(e) => setHareketForm({ ...hareketForm, aciklama: e.target.value })}
              required
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button 
              variant="ghost" 
              onClick={() => {
                setShowHareketModal(false);
                setSelectedStok(null);
                setHareketForm({
                  hareketTipi: 'giris',
                  miktar: 0,
                  aciklama: ''
                });
              }}
            >
              İptal
            </Button>
            <Button onClick={handleStokHareket}>
              Hareketi Kaydet
            </Button>
          </div>
        </div>
      </Modal>

      {/* Resim Görüntüleme Modal */}
      <Modal
        isOpen={showImageModal}
        onClose={() => {
          setShowImageModal(false);
          setSelectedStok(null);
        }}
        title={`Ürün Resimleri - ${selectedStok?.malzemeAdi}`}
        size="lg"
      >
        {selectedStok?.resimler && selectedStok.resimler.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {selectedStok.resimler.map((url, index) => (
              <div key={index} className="relative">
                <LazyImage
                  src={url}
                  alt={`${selectedStok.malzemeAdi} - Resim ${index + 1}`}
                  className="w-full h-64 object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => window.open(url, '_blank')}
                />
                <div className="absolute bottom-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
                  {index + 1} / {selectedStok.resimler!.length}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">Bu ürün için resim bulunmamaktadır.</p>
          </div>
        )}
      </Modal>

      {/* Stok Hareket Geçmişi Modal */}
      <Modal
        isOpen={showHareketGecmisiModal}
        onClose={() => {
          setShowHareketGecmisiModal(false);
          setSelectedStok(null);
          setStokHareketleri([]);
        }}
        title={`Hareket Geçmişi - ${selectedStok?.malzemeAdi}`}
        size="lg"
      >
        <div className="space-y-4">
          {selectedStok && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Mevcut Stok:</span>
                  <span className="ml-2 font-semibold">
                    {selectedStok.mevcutStok} {selectedStok.birim}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Konum:</span>
                  <span className="ml-2 font-semibold">
                    {getSahaName(selectedStok.sahaId)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Durum:</span>
                  <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${getDurumBadge(getStokDurumu(selectedStok.mevcutStok, selectedStok.minimumStokSeviyesi))}`}>
                    {getDurumText(getStokDurumu(selectedStok.mevcutStok, selectedStok.minimumStokSeviyesi))}
                  </span>
                </div>
              </div>
            </div>
          )}

          {hareketLoading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner size="md" />
            </div>
          ) : stokHareketleri.length > 0 ? (
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">Hareket Kayıtları ({stokHareketleri.length})</h4>
              <div className="max-h-96 overflow-y-auto space-y-2">
                {stokHareketleri.map((hareket) => (
                  <div key={hareket.id} className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <Badge 
                            variant={
                              hareket.hareketTipi === 'giris' ? 'success' :
                              hareket.hareketTipi === 'cikis' ? 'destructive' :
                              hareket.hareketTipi === 'sayim' ? 'warning' : 'secondary'
                            }
                          >
                            {hareket.hareketTipi === 'giris' ? '+ Giriş' :
                             hareket.hareketTipi === 'cikis' ? '- Çıkış' :
                             hareket.hareketTipi === 'sayim' ? '📊 Sayım' : 'Transfer'}
                          </Badge>
                          <span className="font-medium">
                            {hareket.hareketTipi === 'giris' ? '+' : hareket.hareketTipi === 'cikis' ? '-' : ''}
                            {hareket.miktar} {selectedStok?.birim}
                          </span>
                        </div>
                        
                        <div className="mt-2 text-sm text-gray-600 space-y-1">
                          <div className="flex items-center space-x-4">
                            <span>
                              <strong>Eski:</strong> {hareket.eskiMiktar} {selectedStok?.birim}
                            </span>
                            <span>→</span>
                            <span>
                              <strong>Yeni:</strong> {hareket.yeniMiktar} {selectedStok?.birim}
                            </span>
                          </div>
                          
                          {hareket.aciklama && (
                            <div>
                              <strong>Açıklama:</strong> {hareket.aciklama}
                            </div>
                          )}
                          
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <span>
                              <strong>Yapan:</strong> {hareket.yapanKisi}
                            </span>
                            <span>
                              <strong>Tarih:</strong> {formatDate(hareket.tarih, 'dd.MM.yyyy HH:mm')}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <History className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">Bu malzeme için henüz hareket kaydı bulunmamaktadır.</p>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default StokKontrol;
