import React, { useState, useEffect } from 'react';
import { Plus, Sun, MapPin, Zap, Calendar, TrendingUp, Users, Settings, Eye, Image, List, Grid as GridIcon, Layers, AlertCircle, Edit, Trash2 } from 'lucide-react';
import { Button, Card, CardContent, CardHeader, CardTitle, Modal, LoadingSpinner, DropdownMenu } from '../../components/ui';
import { ResponsiveDetailModal } from '../../components/modals/ResponsiveDetailModal';
import { useAuth } from '../../contexts/AuthContext';
import { SantralForm } from '../../components/forms/SantralForm';
import { getAllSantraller, getSantralIstatistikleri, deleteSantral } from '../../services/santralService';
import toast from 'react-hot-toast';
import { checkUsageLimit } from '../../domain/subscription/service';
import SubscriptionLimitBanner from '../../components/subscription/SubscriptionLimitBanner';
import { formatNumber } from '../../utils/formatters';

interface Santral {
  id: string;
  ad: string;
  kapasite: number; // kW
  sahaAdi?: string;
  musteriAdi?: string;
  konum: {
    lat: number;
    lng: number;
    adres: string;
  };
  kurulumTarihi: any; // Firebase Timestamp
  yillikHedefUretim: number; // kWh
  elektrikFiyati: number; // TL/kWh
  dagitimBedeli: number; // TL/kWh
  durum: 'aktif' | 'bakim' | 'ariza' | 'pasif';
  sonUretim: number; // kWh
  performans: number; // %
  musteriSayisi: number;
  companyId: string;
  sahaId?: string;
  // 12 aylık tahmini üretim değerleri
  aylikTahminler?: {
    ocak: number;
    subat: number;
    mart: number;
    nisan: number;
    mayis: number;
    haziran: number;
    temmuz: number;
    agustos: number;
    eylul: number;
    ekim: number;
    kasim: number;
    aralik: number;
  };
  // Santral resimleri
  resimler?: string[];
  kapakResmi?: string;
  olusturmaTarihi: any; // Firebase Timestamp
  guncellenmeTarihi: any; // Firebase Timestamp
  aktif: boolean;
}

const GesYonetimi: React.FC = () => {
  const { userProfile, canPerformAction } = useAuth();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedSantral, setSelectedSantral] = useState<Santral | null>(null);
  const [santraller, setSantraller] = useState<Santral[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');
  // Limit durumu
  const [isSantralLimitReached, setIsSantralLimitReached] = useState(false);
  const [santralLimit, setSantralLimit] = useState(0);

  // Rol kontrolü - Sadece yönetici, mühendis ve müşteri erişebilir
  const allowedRoles = ['yonetici', 'muhendis', 'musteri', 'superadmin'];
  if (userProfile && !allowedRoles.includes(userProfile.rol)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Yetkisiz Erişim</h1>
          <p className="text-gray-600">Bu sayfaya erişim yetkiniz bulunmamaktadır.</p>
        </div>
      </div>
    );
  }

  // Santralları getir (müşteri izolasyonu ile)
  const fetchSantraller = async () => {
    if (!userProfile?.companyId) return;

    setIsLoading(true);
    try {
      const santrallar = await getAllSantraller(
        userProfile.companyId,
        userProfile.rol,
        userProfile.santraller
      );
      setSantraller(santrallar);
      // Santral limit kontrolü
      try {
        const limitCheck = await checkUsageLimit(userProfile.companyId, 'santraller', santrallar.length);
        setIsSantralLimitReached(!limitCheck.allowed);
        setSantralLimit(limitCheck.limit);
      } catch (e) {
        setIsSantralLimitReached(false);
      }
      
      if (santrallar.length === 0) {
        console.log('Henüz santral eklenmemiş veya atanılmamış');
      }
    } catch (error) {
      console.error('Santraller getirme hatası:', error);
      toast.error('Santraller getirilemedi');
      setSantraller([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSantraller();
  }, [userProfile?.companyId]);

  const handleSantralDelete = async (santralId: string, santralAd: string) => {
    if (window.confirm(`"${santralAd}" santralini silmek istediğinizden emin misiniz?`)) {
      try {
        await deleteSantral(santralId);
        toast.success('Santral başarıyla silindi');
        await fetchSantraller(); // Listeyi yenile
      } catch (error) {
        console.error('Santral silme hatası:', error);
        toast.error('Santral silinemedi');
      }
    }
  };

  const getDurumBadge = (durum: string) => {
    const badges = {
      'aktif': 'bg-green-100 text-green-800',
      'bakim': 'bg-yellow-100 text-yellow-800',
      'ariza': 'bg-red-100 text-red-800',
      'pasif': 'bg-gray-100 text-gray-800',
    };
    return badges[durum as keyof typeof badges] || 'bg-gray-100 text-gray-800';
  };

  const getDurumText = (durum: string) => {
    const texts = {
      'aktif': 'Aktif',
      'bakim': 'Bakımda',
      'ariza': 'Arızalı',
      'pasif': 'Pasif',
    };
    return texts[durum as keyof typeof texts] || durum;
  };

  const getDurumIcon = (durum: string) => {
    switch (durum) {
      case 'aktif':
        return <div className="w-2 h-2 bg-green-500 rounded-full"></div>;
      case 'bakim':
        return <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>;
      case 'ariza':
        return <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>;
      default:
        return <div className="w-2 h-2 bg-gray-500 rounded-full"></div>;
    }
  };

  // İstatistikler
  const toplamKapasite = santraller.reduce((total, santral) => total + santral.kapasite, 0);
  const aktifSantraller = santraller.filter(s => s.durum === 'aktif').length;

  // Authentication check
  if (!userProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Giriş Yapmanız Gerekiyor</h2>
          <p className="text-gray-600 mb-6">GES yönetimi sayfasını görüntülemek için lütfen giriş yapın.</p>
          <Button onClick={() => window.location.href = '/auth/login'} className="bg-blue-600 hover:bg-blue-700">
            Giriş Yap
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">GES Yönetimi</h1>
          <p className="text-gray-600">Güneş Enerji Santrallarınızı yönetin ve izleyin</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Masaüstü görünüm: metinli liste/kart anahtarı */}
          <div className="hidden sm:inline-flex rounded-md border border-gray-200 overflow-hidden">
            <button
              className={`px-3 py-2 text-sm flex items-center gap-2 ${viewMode === 'list' ? 'bg-gray-100 text-gray-900' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" /> Liste
            </button>
            <button
              className={`px-3 py-2 text-sm flex items-center gap-2 border-l border-gray-200 ${viewMode === 'grid' ? 'bg-gray-100 text-gray-900' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
              onClick={() => setViewMode('grid')}
            >
              <GridIcon className="h-4 w-4" /> Kart
            </button>
          </div>
          {/* Mobil görünüm: ikon butonlar */}
          <div className="flex sm:hidden items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setViewMode('list')} title="Liste">
              <List className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setViewMode('grid')} title="Kart">
              <GridIcon className="h-4 w-4" />
            </Button>
            {canPerformAction('santral_ekle') && (
              <Button 
                size="sm" 
                onClick={() => {
                  if (isSantralLimitReached) {
                    toast.error(`Santral limiti aşıldı (${santraller.length}/${santralLimit}). Planınızı yükseltin.`);
                  } else {
                    setShowCreateModal(true);
                  }
                }} 
                title="Yeni Santral"
                disabled={isSantralLimitReached}
              >
                <Plus className="h-4 w-4" />
              </Button>
            )}
          </div>
          {/* Masaüstü: yeni santral butonu */}
          {canPerformAction('santral_ekle') && (
            <Button className="hidden sm:inline-flex" 
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={() => {
                if (isSantralLimitReached) {
                  toast.error(`Santral limiti aşıldı (${santraller.length}/${santralLimit}). Planınızı yükseltin.`);
                } else {
                  setShowCreateModal(true);
                }
              }}
              disabled={isSantralLimitReached}
            >
              Yeni Santral Ekle
            </Button>
          )}
        </div>
      </div>

      <SubscriptionLimitBanner 
        show={isSantralLimitReached}
        message={`${santraller.length} / ${santralLimit} santral. Yeni santral eklemek için planınızı yükseltin.`}
      />

      {/* Summary Stats - Sadece 2 kart */}
      <div className="grid grid-cols-2 gap-4 md:gap-6">
        <Card>
          <CardContent className="p-4 md:p-6">
            <div className="flex flex-col items-center text-center">
              <Sun className="h-10 w-10 text-solar-500 mb-2" />
              <p className="text-xl md:text-2xl font-bold text-gray-900">{formatNumber(toplamKapasite, 0)} kW</p>
              <p className="text-xs md:text-sm text-gray-600 mt-1">Toplam Kapasite</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 md:p-6">
            <div className="flex flex-col items-center text-center">
              <Zap className="h-10 w-10 text-green-500 mb-2" />
              <p className="text-xl md:text-2xl font-bold text-gray-900">{aktifSantraller}</p>
              <p className="text-xs md:text-sm text-gray-600 mt-1">Aktif Santral</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Santral Listesi */}
      {santraller.length === 0 ? (
        <div className="grid gap-6">
          <Card>
            <CardContent className="p-12 text-center">
              <Sun className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Henüz Santral Yok</h3>
              <p className="text-gray-500 mb-6">İlk güneş enerji santralınızı ekleyerek başlayın.</p>
              <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setShowCreateModal(true)}>
                İlk Santralı Ekle
              </Button>
            </CardContent>
          </Card>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {santraller.map((santral) => (
            <Card key={santral.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-0">
                {santral.kapakResmi ? (
                  <img src={santral.kapakResmi} alt={santral.ad} className="w-full h-32 object-cover rounded-t-lg" />
                ) : (
                  <div className="w-full h-32 bg-gray-100 rounded-t-lg flex items-center justify-center text-gray-400">
                    <Image className="h-6 w-6" />
                  </div>
                )}
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-900">{santral.ad}</h3>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getDurumBadge(santral.durum)}`}>
                      {getDurumText(santral.durum)}
                    </span>
                  </div>
                  <div className="space-y-2 text-sm text-gray-600 mb-4">
                    <div className="flex items-center">
                      <Zap className="h-4 w-4 mr-2" />
                      <span>{formatNumber(santral.kapasite, 0)} kW</span>
                    </div>
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-2" />
                      <span className="truncate">{santral.konum.adres}</span>
                    </div>
                    {santral.sahaAdi && (
                      <div className="flex items-center">
                        <Layers className="h-4 w-4 mr-2" />
                        <span>Saha: {santral.sahaAdi}</span>
                      </div>
                    )}
                  </div>
                  <div className="border-t pt-3 mb-3">
                    <div className="text-lg font-medium text-gray-900">
                      {santral.yillikHedefUretim?.toLocaleString() || 0} kWh
                    </div>
                    <div className="text-xs text-gray-500">Yıllık Hedef Üretim</div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="secondary" 
                      className="flex-1" 
                      onClick={() => { setSelectedSantral(santral); setShowDetailModal(true); }}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Detay
                    </Button>
                    {(canPerformAction('santral_duzenle') || canPerformAction('santral_sil')) && (
                      <DropdownMenu
                        items={[
                          ...(canPerformAction('santral_duzenle') ? [{
                            label: 'Düzenle',
                            onClick: () => { setSelectedSantral(santral); setShowCreateModal(true); },
                            icon: <Edit className="h-4 w-4" />
                          }] : []),
                          ...(canPerformAction('santral_sil') ? [{
                            label: 'Sil',
                            onClick: () => handleSantralDelete(santral.id, santral.ad),
                            icon: <Trash2 className="h-4 w-4" />,
                            danger: true
                          }] : [])
                        ]}
                      />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-6">
          {santraller.map((santral) => (
            <Card key={santral.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      {getDurumIcon(santral.durum)}
                      <h3 className="text-xl font-semibold text-gray-900">{santral.ad}</h3>
                      <span className={`px-3 py-1 text-sm font-medium rounded-full ${getDurumBadge(santral.durum)}`}>{getDurumText(santral.durum)}</span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                      <div className="flex items-center text-sm text-gray-600"><Zap className="h-4 w-4 mr-2" /><span>{formatNumber(santral.kapasite, 0)} kW</span></div>
                      <div className="flex items-center text-sm text-gray-600"><MapPin className="h-4 w-4 mr-2" /><span>{santral.konum.adres}</span></div>
                      <div className="flex items-center text-sm text-gray-600"><Calendar className="h-4 w-4 mr-2" /><span>{santral.kurulumTarihi?.toDate?.()?.toLocaleDateString?.('tr-TR') || 'Tarih belirtilmemiş'}</span></div>
                      <div className="flex items-center text-sm text-gray-600"><Users className="h-4 w-4 mr-2" /><span>{santral.musteriSayisi} Müşteri</span></div>
                      {santral.sahaAdi && (<div className="flex items-center text-sm text-gray-600"><Layers className="h-4 w-4 mr-2" /><span>Saha: {santral.sahaAdi}</span></div>)}
                    </div>
                    {/* Kompakt gösterim: Yıllık hedef tek satırda, Bugünkü Üretim ve Performans kaldırıldı */}
                    <div className="mt-1">
                      <div className="flex items-center text-sm text-gray-700">
                        <TrendingUp className="h-4 w-4 mr-2 text-primary-500" />
                        <span className="font-medium">Yıllık Hedef:</span>
                        <span className="ml-2">{santral.yillikHedefUretim?.toLocaleString() || 0} kWh</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col space-y-2 ml-6">
                    <Button size="sm" variant="secondary" leftIcon={<Eye className="h-4 w-4" />} onClick={() => { setSelectedSantral(santral); setShowDetailModal(true); }}>Detaylar</Button>
                    {canPerformAction('santral_duzenle') && (
                      <Button size="sm" variant="ghost" leftIcon={<Edit className="h-4 w-4" />} onClick={() => { setSelectedSantral(santral); setShowCreateModal(true); }}>Düzenle</Button>
                    )}
                    {canPerformAction('santral_sil') && (
                      <Button size="sm" variant="ghost" leftIcon={<Trash2 className="h-4 w-4" />} onClick={() => handleSantralDelete(santral.id, santral.ad)} className="text-red-600 hover:text-red-700 hover:bg-red-50">Sil</Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Santral Ekleme Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title={selectedSantral ? "Santral Düzenle" : "Yeni Santral Ekle"}
        size="xl"
      >
        <SantralForm
          santral={selectedSantral}
          onSuccess={(santral) => {
            setShowCreateModal(false);
            setSelectedSantral(null);
            fetchSantraller(); // Listeyi yenile
          }}
          onCancel={() => {
            setShowCreateModal(false);
            setSelectedSantral(null);
          }}
        />
      </Modal>

      {/* Santral Detay Modal */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedSantral(null);
        }}
        title={selectedSantral?.ad || 'Santral Detayları'}
        size="xl"
      >
        {selectedSantral && (
          <div className="space-y-6">
            {/* Santral Resimleri */}
            {selectedSantral.resimler && selectedSantral.resimler.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Image className="h-4 w-4" />
                  Santral Resimleri
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {selectedSantral.resimler.map((resim, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={resim}
                        alt={`${selectedSantral.ad} - Resim ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg border border-gray-200 cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => window.open(resim, '_blank')}
                      />
                      {selectedSantral.kapakResmi === resim && (
                        <div className="absolute bottom-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                          Kapak
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Temel Bilgiler */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Temel Bilgiler</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Kapasite:</span>
                    <span className="font-medium">{formatNumber(selectedSantral.kapasite, 0)} kW</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Kurulum Tarihi:</span>
                    <span className="font-medium">{selectedSantral.kurulumTarihi?.toDate?.()?.toLocaleDateString?.('tr-TR') || 'Tarih belirtilmemiş'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Durum:</span>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getDurumBadge(selectedSantral.durum)}`}>
                      {getDurumText(selectedSantral.durum)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Müşteri Sayısı:</span>
                    <span className="font-medium">{selectedSantral.musteriSayisi}</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Üretim Hedefleri</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Yıllık Hedef:</span>
                    <span className="font-medium">{selectedSantral.yillikHedefUretim?.toLocaleString() || 0} kWh</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Aylık Ortalama:</span>
                    <span className="font-medium">{Math.round((selectedSantral.yillikHedefUretim || 0) / 12).toLocaleString()} kWh</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Günlük Ortalama:</span>
                    <span className="font-medium">{Math.round((selectedSantral.yillikHedefUretim || 0) / 365).toLocaleString()} kWh</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 12 Aylık Tahminler */}
            {selectedSantral.aylikTahminler && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Aylık Üretim Tahminleri
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                  {Object.entries(selectedSantral.aylikTahminler).map(([ay, deger]) => (
                    <div key={ay} className="bg-gray-50 p-3 rounded-lg text-center">
                      <div className="text-xs font-medium text-gray-600 capitalize">{ay}</div>
                      <div className="text-sm font-semibold text-gray-900">{deger?.toLocaleString() || 0} kWh</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Konum Bilgisi */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Konum</h4>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center text-sm text-gray-600">
                  <MapPin className="h-4 w-4 mr-2" />
                  <span>{selectedSantral.konum.adres}</span>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Koordinatlar: {selectedSantral.konum.lat.toFixed(6)}, {selectedSantral.konum.lng.toFixed(6)}
                </div>
              </div>
            </div>

            {/* Performans */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Performans</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-blue-900">
                    {selectedSantral.sonUretim.toLocaleString()}
                  </div>
                  <div className="text-sm text-blue-700">kWh Bugün</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-green-900">
                    %{selectedSantral.performans}
                  </div>
                  <div className="text-sm text-green-700">Performans</div>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-yellow-900">
                    {selectedSantral.yillikHedefUretim ? Math.round(selectedSantral.yillikHedefUretim / 365).toLocaleString() : 0}
                  </div>
                  <div className="text-sm text-yellow-700">Günlük Hedef kWh</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default GesYonetimi;
