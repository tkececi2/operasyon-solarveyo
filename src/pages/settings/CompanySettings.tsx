import React, { useState } from 'react';
import { 
  Building2, 
  Users, 
  Globe, 
  CreditCard,
  Upload,
  Save,
  X,
  RefreshCw,
  Shield
} from 'lucide-react';
import { 
  Button, 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  Input,
  Textarea,
  Select,
  Badge
} from '../../components/ui';
import { useAuth } from '../../contexts/AuthContext';
import { useCompany } from '../../contexts/CompanyContext';
import { uploadCompanyLogo } from '../../services/storageService';
import { getCompanyStatistics, getSubscriptionUsageStats } from '../../services/statisticsService';
import { analyzeStorageQuota } from '../../services/storageAnalyticsService';
import { createDemoData } from '../../utils/demoData';
import { getMergedPlans } from '../../services/planConfigService';
import toast from 'react-hot-toast';

const CompanySettings: React.FC = () => {
  const { userProfile } = useAuth();
  const { company, updateCompany, refreshCompany, loading: companyLoading } = useCompany();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedLogo, setSelectedLogo] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [statistics, setStatistics] = useState<any>(null);
  const [realStorageQuota, setRealStorageQuota] = useState<any>(null);
  const [usageStats, setUsageStats] = useState<any>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [effectiveStorageLimitMB, setEffectiveStorageLimitMB] = useState<number>(5120);

  // Form state
  const [companyInfo, setCompanyInfo] = useState({
    name: company?.name || '',
    slogan: company?.slogan || '',
    address: company?.address || '',
    phone: company?.phone || '',
    email: company?.email || '',
    website: company?.website || '',
  });

  // Company verileri değiştiğinde form state'ini güncelle
  React.useEffect(() => {
    if (company) {
      setCompanyInfo({
        name: company.name || '',
        slogan: company.slogan || '',
        address: company.address || '',
        phone: company.phone || '',
        email: company.email || '',
        website: company.website || '',
      });
    }
  }, [company]);

  // İstatistikleri yükle
  React.useEffect(() => {
    const loadStatistics = async () => {
      if (!company?.id) return;
      
      setIsLoadingStats(true);
      try {
        // Şirket bilgilerini yenile (güncel abonelik limitleri için)
        await refreshCompany();
        
        // Plan config'den gerçek limiti al (abonelik sayfasıyla aynı mantık)
        const merged = await getMergedPlans();
        const currentPlanId = (company?.subscriptionPlan || 'starter').toLowerCase();
        const planFromMerged: any = (merged as any)[currentPlanId];
        const planStorageMB = planFromMerged?.limits?.storageGB != null ? Number(planFromMerged.limits.storageGB) * 1024 : 5120;
        const effectiveMB = (company?.subscriptionLimits?.storageLimit != null)
          ? Number(company.subscriptionLimits.storageLimit)
          : planStorageMB;
        setEffectiveStorageLimitMB(effectiveMB);
        
        const [stats, usage, realStorage] = await Promise.all([
          getCompanyStatistics(company.id),
          getSubscriptionUsageStats(company.id),
          analyzeStorageQuota(company.id, effectiveMB)
        ]);
        
        // Debug: Şirket Ayarları istatistikleri
        console.log(`⚙️ Settings - ${company.name}:`);
        console.table({
          'Kullanıcı Toplam': stats.kullanicilar?.toplam || 0,
          'Kullanıcı Limit': company.subscriptionLimits?.users || 'N/A',
          'Kullanıcı Aktif': stats.kullanicilar?.aktif || 0,
          'Depolama Kullanılan': `${stats.depolama?.kullanilan || 0} GB`,
          'Depolama Limit (MB)': company.subscriptionLimits?.storageLimit || 'N/A',
          'Depolama Limit (GB)': `${(((company?.subscriptionLimits?.storageLimit ?? 5120) / 1024)).toFixed(0)} GB`,
          'Plan': company.subscriptionPlan || 'N/A'
        });
        if (realStorage) {
          console.table({
            'Gerçek Kullanım': `${(realStorage.used/1024).toFixed(2)}GB`,
            'Gerçek Limit': `${(realStorage.limit/1024).toFixed(2)}GB`,
            'Gerçek %': `${realStorage.percentage.toFixed(2)}%`
          });
        }
        console.log('📋 subscriptionLimits:', company.subscriptionLimits);

        setStatistics(stats);
        setUsageStats(usage);
        setRealStorageQuota(realStorage);
      } catch (error) {
        console.error('İstatistikler yüklenemedi:', error);
        // Hata durumunda varsayılan değerler kullan
      } finally {
        setIsLoadingStats(false);
      }
    };

    loadStatistics();
  }, [company?.id]);

  const handleLogoSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Sadece resim dosyaları yükleyebilirsiniz.');
        return;
      }
      
      if (file.size > 2 * 1024 * 1024) { // 2MB
        toast.error('Logo dosyası 2MB\'dan büyük olamaz.');
        return;
      }

      setSelectedLogo(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const removeLogo = () => {
    setSelectedLogo(null);
    setLogoPreview('');
  };

  // Demo veri ekleme
  const handleAddDemoData = async () => {
    if (!company?.id) return;
    
    try {
      const confirmed = window.confirm('Demo veriler eklenecek. Devam etmek istiyor musunuz?');
      if (!confirmed) return;
      
      toast.loading('Demo veriler ekleniyor...', { id: 'demo-data' });
      await createDemoData(company.id);
      toast.success('Demo veriler başarıyla eklendi!', { id: 'demo-data' });
      
      // İstatistikleri yeniden yükle
      const [stats, usage] = await Promise.all([
        getCompanyStatistics(company.id),
        getSubscriptionUsageStats(company.id)
      ]);
      
      setStatistics(stats);
      setUsageStats(usage);
    } catch (error) {
      console.error('Demo veri ekleme hatası:', error);
      toast.error('Demo veriler eklenirken hata oluştu', { id: 'demo-data' });
    }
  };

  const handleSaveCompanyInfo = async () => {
    if (!company) return;

    setIsLoading(true);
    try {
      // Logo upload işlemi
      let logoUrl = company.logo;
      if (selectedLogo) {
        try {
          toast.loading('Logo yükleniyor...', { id: 'logo-upload' });
          logoUrl = await uploadCompanyLogo(selectedLogo, company.id);
          toast.success('Logo başarıyla yüklendi!', { id: 'logo-upload' });
          
          // Upload başarılı olduktan sonra state'leri temizle
          setSelectedLogo(null);
          setLogoPreview('');
        } catch (logoError) {
          console.error('Logo yükleme hatası:', logoError);
          toast.error('Logo yüklenirken hata oluştu', { id: 'logo-upload' });
          throw logoError; // Ana try-catch'e düşsün
        }
      }

      // Firebase için undefined değerleri filtrele
      const updateData: any = {
        ...companyInfo,
        settings: {
          ...company.settings
        }
      };

      // Logo URL'i sadece tanımlıysa ekle
      if (logoUrl !== undefined && logoUrl !== null) {
        updateData.logo = logoUrl;
      }

      await updateCompany(updateData);

      toast.success('Şirket bilgileri güncellendi!');
    } catch (error) {
      console.error('Güncelleme hatası:', error);
      toast.error('Güncelleme başarısız oldu.');
    } finally {
      setIsLoading(false);
    }
  };

  // Company değiştiğinde subscriptionInfo'yu güncelle
  const subscriptionInfo = React.useMemo(() => {
    // Abonelik sayfasıyla aynı mantık
    const storageLimitGB = (effectiveStorageLimitMB / 1024).toFixed(effectiveStorageLimitMB < 1024 ? 1 : 0);
    
    console.log('📊 SubscriptionInfo güncellendi:', {
      companyId: company?.id,
      effectiveStorageLimitMB,
      storageLimitGB: storageLimitGB + ' GB',
      subscriptionLimits: company?.subscriptionLimits
    });
    
    return {
      plan: company?.subscriptionPlan || 'Premium',
      status: company?.subscriptionStatus || 'trial',
      usersLimit: company?.subscriptionLimits?.users || 50,
      currentUsers: statistics?.kullanicilar?.toplam || 0,
      storageLimit: `${storageLimitGB} GB`,
      currentStorage: realStorageQuota ? 
        `${(realStorageQuota.used / 1024).toFixed(2)} GB` : 
        `${(statistics?.depolama?.kullanilan || 0).toFixed(2)} GB`,
      nextBillingDate: company?.nextBillingDate?.toDate() || new Date(),
      monthlyPrice: company?.subscriptionPrice || 2500
    };
  }, [company, statistics, realStorageQuota, effectiveStorageLimitMB]);

  // Company verileri yüklenirken loading göster
  if (companyLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Şirket bilgileri yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Şirket Ayarları</h1>
          <p className="text-gray-600">
            Şirket bilgilerinizi ve tercihlerinizi yönetin
            {userProfile?.rol && (
              <span className="ml-2 text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                {userProfile.rol === 'yonetici' ? 'Yönetici' : 
                 userProfile.rol}
              </span>
            )}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={async () => {
            setIsLoadingStats(true);
            try {
              await refreshCompany();
              
              // Kısa bir gecikme ekle - state güncellensin
              await new Promise(resolve => setTimeout(resolve, 100));
              
              // Güncel company verisini kullan
              if (company?.id) {
                // Plan config'den gerçek limiti al
                const merged = await getMergedPlans();
                const currentPlanId = (company?.subscriptionPlan || 'starter').toLowerCase();
                const planFromMerged: any = (merged as any)[currentPlanId];
                const planStorageMB = planFromMerged?.limits?.storageGB != null ? Number(planFromMerged.limits.storageGB) * 1024 : 5120;
                const effectiveMB = (company?.subscriptionLimits?.storageLimit != null)
                  ? Number(company.subscriptionLimits.storageLimit)
                  : planStorageMB;
                setEffectiveStorageLimitMB(effectiveMB);
                
                const [stats, usage, realStorage] = await Promise.all([
                  getCompanyStatistics(company.id),
                  getSubscriptionUsageStats(company.id),
                  analyzeStorageQuota(company.id, effectiveMB)
                ]);
                
                console.log('🔄 Yenileme sonrası limit:', {
                  planStorageMB,
                  effectiveMB,
                  effectiveGB: (effectiveMB / 1024).toFixed(2) + ' GB'
                });
                
                setStatistics(stats);
                setUsageStats(usage);
                setRealStorageQuota(realStorage);
                toast.success('Bilgiler yenilendi');
              }
            } catch (error) {
              console.error('Yenileme hatası:', error);
              toast.error('Yenileme başarısız');
            } finally {
              setIsLoadingStats(false);
            }
          }}
          loading={isLoadingStats}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Yenile
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sol Kolon - Ana Bilgiler */}
        <div className="lg:col-span-2 space-y-6">
          {/* Şirket Bilgileri */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Building2 className="h-5 w-5 mr-2" />
                Şirket Bilgileri
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Şirket Adı"
                  value={companyInfo.name}
                  onChange={(e) => setCompanyInfo(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
                <Input
                  label="Slogan"
                  placeholder="Şirket sloganı"
                  value={companyInfo.slogan}
                  onChange={(e) => setCompanyInfo(prev => ({ ...prev, slogan: e.target.value }))}
                />
              </div>

              <Textarea
                label="Adres"
                placeholder="Şirket adresi"
                value={companyInfo.address}
                onChange={(e) => setCompanyInfo(prev => ({ ...prev, address: e.target.value }))}
                rows={2}
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  label="Telefon"
                  placeholder="0532 123 45 67"
                  value={companyInfo.phone}
                  onChange={(e) => setCompanyInfo(prev => ({ ...prev, phone: e.target.value }))}
                />
                <Input
                  label="Email"
                  type="email"
                  placeholder="info@sirket.com"
                  value={companyInfo.email}
                  onChange={(e) => setCompanyInfo(prev => ({ ...prev, email: e.target.value }))}
                />
                <Input
                  label="Website"
                  placeholder="www.sirket.com"
                  value={companyInfo.website}
                  onChange={(e) => setCompanyInfo(prev => ({ ...prev, website: e.target.value }))}
                />
              </div>
            </CardContent>
          </Card>

          {/* Logo Yükleme */}
          <Card>
            <CardHeader>
              <CardTitle>Şirket Logosu</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-6">
                {/* Logo Preview */}
                <div className="flex-shrink-0">
                  <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                    {logoPreview || company?.logo ? (
                      <img
                        src={logoPreview || company?.logo}
                        alt="Logo"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Building2 className="h-8 w-8 text-gray-400" />
                    )}
                  </div>
                </div>

                {/* Upload Controls */}
                <div className="flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoSelect}
                    className="hidden"
                    id="logo-upload"
                  />
                  <div className="space-y-2">
                    <label
                      htmlFor="logo-upload"
                      className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Logo Seç
                    </label>
                    
                    {selectedLogo && (
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">{selectedLogo.name}</span>
                        <button
                          type="button"
                          onClick={removeLogo}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                    
                    <p className="text-xs text-gray-500">
                      PNG, JPG veya GIF. Maksimum 2MB. Önerilen boyut: 200x200px
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>


        </div>

        {/* Sağ Kolon - Abonelik Bilgileri */}
        <div className="space-y-6">
          {/* Abonelik Durumu */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CreditCard className="h-5 w-5 mr-2" />
                Abonelik Bilgileri
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <Badge 
                  variant={subscriptionInfo.status === 'active' ? 'success' : 
                          subscriptionInfo.status === 'trial' ? 'warning' : 'danger'}
                  className="text-lg px-4 py-2"
                >
                  {subscriptionInfo.plan} Plan
                </Badge>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Durum:</span>
                  <Badge variant={subscriptionInfo.status === 'active' ? 'success' : 'warning'}>
                    {subscriptionInfo.status === 'active' ? 'Aktif' : 
                     subscriptionInfo.status === 'trial' ? 'Deneme' : 'Süresi Dolmuş'}
                  </Badge>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Kullanıcı Limiti:</span>
                  <span>{subscriptionInfo.currentUsers}/{subscriptionInfo.usersLimit}</span>
                </div>
                
                {/* Kullanıcı kullanım çubuğu */}
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, (subscriptionInfo.currentUsers / subscriptionInfo.usersLimit) * 100)}%` }}
                  />
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Depolama:</span>
                  <span>{subscriptionInfo.currentStorage}/{subscriptionInfo.storageLimit}</span>
                </div>
                
                {/* Depolama kullanım çubuğu */}
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${
                      (() => {
                        let percentage = 0;
                        if (realStorageQuota) {
                          percentage = realStorageQuota.percentage;
                        } else {
                          const usedGB = statistics?.depolama?.kullanilan || 0;
                          const limitGB = (effectiveStorageLimitMB / 1024);
                          percentage = limitGB > 0 ? (usedGB / limitGB) * 100 : 0;
                        }
                        return percentage > 90 ? 'bg-red-500' : percentage > 70 ? 'bg-yellow-500' : 'bg-green-500';
                      })()
                    }`}
                    style={{ 
                      width: `${Math.min((() => {
                        if (realStorageQuota) return realStorageQuota.percentage;
                        const usedGB = statistics?.depolama?.kullanilan || 0;
                        const limitGB = (effectiveStorageLimitMB / 1024);
                        return limitGB > 0 ? (usedGB / limitGB) * 100 : 0;
                      })(), 100)}%` 
                    }}
                  />
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Aylık Ücret:</span>
                  <span className="font-semibold">₺{subscriptionInfo.monthlyPrice}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Sonraki Ödeme:</span>
                  <span>{subscriptionInfo.nextBillingDate.toLocaleDateString('tr-TR')}</span>
                </div>
              </div>

              <div className="pt-4 border-t">
                <Button fullWidth variant="secondary">
                  <CreditCard className="h-4 w-4 mr-2" />
                  Planı Yükselt
                </Button>
              </div>
            </CardContent>
          </Card>


          {/* Kullanım İstatistikleri */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Bu Ay İstatistikleri
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {isLoadingStats ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-sm text-gray-500 mt-2">Yükleniyor...</p>
                </div>
              ) : (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Toplam Kullanıcı:</span>
                    <span className="font-semibold">{statistics?.kullanicilar?.toplam || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Bu Ay Arıza:</span>
                    <span className="font-semibold">{statistics?.arizalar?.buAy || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Aktif Santral:</span>
                    <span className="font-semibold">{statistics?.santraller?.aktif || 0} / {statistics?.santraller?.toplam || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Toplam Kapasite:</span>
                    <span className="font-semibold">{statistics?.santraller?.toplamKapasite || 0} kW</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Aylık Üretim:</span>
                    <span className="font-semibold">{statistics?.santraller?.aylikUretim || 0} kWh</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Kritik Stok:</span>
                    <Badge variant={statistics?.stok?.kritik > 0 ? 'danger' : 'success'} className="text-xs">
                      {statistics?.stok?.kritik || 0} ürün
                    </Badge>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

      </div>

      {/* Kaydet Butonu */}
      <div className="flex justify-end space-x-3 pt-6 border-t">
        <Button variant="ghost">
          İptal
        </Button>
        <Button 
          onClick={handleSaveCompanyInfo}
          loading={isLoading}
          leftIcon={<Save className="h-4 w-4" />}
        >
          Değişiklikleri Kaydet
        </Button>
      </div>
    </div>
  );
};

export default CompanySettings;
