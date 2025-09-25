import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  MapPin, 
  Users, 
  Building2, 
  Phone, 
  Mail,
  Edit,
  Trash2,
  AlertCircle,
  Eye,
  UserPlus,
  Search
} from 'lucide-react';
import { 
  Button, 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  Modal,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHeaderCell,
  TableCell,
  ActionCell,
  Badge,
  DropdownMenu,
  LoadingSpinner
} from '../../components/ui';
import { SahaForm } from '../../components/forms/SahaForm';
import { MusteriForm } from '../../components/forms/MusteriForm';
import { SahaDetailCard } from '../../components/saha/SahaDetailCard';
import { WeatherWidget } from '../../components/weather/WeatherWidget';
import { WeatherCard } from '../../components/weather/WeatherCard';
import { useAuth } from '../../hooks/useAuth';
import { getGoogleMapsApiKey, generateGoogleMapsUrls } from '../../utils/googleMaps';
import { formatNumber } from '../../utils/formatters';
import { deleteSaha } from '../../services/sahaService';
import { checkUsageLimit } from '../../domain/subscription/service';
import { deleteMusteri } from '../../services/musteriService';
import toast from 'react-hot-toast';
import SubscriptionLimitBanner from '../../components/subscription/SubscriptionLimitBanner';

interface Musteri {
  id: string;
  companyId: string;
  ad: string;
  email: string;
  telefon: string;
  adres: string;
  sirket?: string;
  notlar?: string;
  aktif: boolean;
  sahaSayisi: number;
  olusturmaTarihi: any; // Firebase Timestamp
  guncellenmeTarihi: any; // Firebase Timestamp
}

interface Saha {
  id: string;
  companyId: string;
  ad: string;
  musteriId: string;
  musteriAdi: string;
  santralIds: string[];
  konum: {
    lat: number;
    lng: number;
    adres: string;
  };
  toplamKapasite: number; // kW
  aktif: boolean;
  aciklama?: string;
  fotograflar?: string[];
  olusturmaTarihi: { toDate(): Date };
  guncellenmeTarihi: { toDate(): Date };
}

const Sahalar: React.FC = () => {
  const { userProfile, canPerformAction } = useAuth();
  
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
  
  const [activeTab, setActiveTab] = useState<'sahalar' | 'musteriler'>('sahalar');
  const [viewMode, setViewMode] = useState<'table' | 'cards' | 'map'>('cards');
  const [selectedForMap, setSelectedForMap] = useState<Saha | null>(null);
  const [mapType, setMapType] = useState<'roadmap' | 'satellite' | 'terrain' | 'hybrid'>('satellite');
  const [showSahaModal, setShowSahaModal] = useState(false);
  const [showMusteriModal, setShowMusteriModal] = useState(false);
  const [showSahaDetail, setShowSahaDetail] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSaha, setSelectedSaha] = useState<Saha | null>(null);
  const [selectedMusteri, setSelectedMusteri] = useState<Musteri | null>(null);
  const [showWeatherInCards, setShowWeatherInCards] = useState(false);

  // Gerçek veriler - Firebase'den gelecek
  const [musteriler, setMusteriler] = useState<Musteri[]>([]);
  const [sahalar, setSahalar] = useState<Saha[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  // Limit durumu
  const [isSahaLimitReached, setIsSahaLimitReached] = useState(false);
  const [sahaLimit, setSahaLimit] = useState(0);

  // Verileri Firebase'den getir
  const fetchData = async () => {
    try {
      setIsLoading(true);
      if (!userProfile?.companyId) return;

      // Paralel olarak sahalar ve müşterileri getir (müşteri izolasyonu ile)
      const [sahaData, musteriData] = await Promise.all([
        import('../../services/sahaService').then(s => s.getAllSahalar(
          userProfile.companyId,
          userProfile.rol,
          userProfile.sahalar
        )),
        import('../../services/musteriService').then(m => m.getAllMusteriler(userProfile.companyId))
      ]);

      setSahalar(sahaData || []);

      // Saha limit kontrolü
      if (userProfile?.companyId) {
        try {
          const limitCheck = await checkUsageLimit(userProfile.companyId, 'sahalar', (sahaData || []).length);
          setIsSahaLimitReached(!limitCheck.allowed);
          setSahaLimit(limitCheck.limit);
        } catch (e) {
          console.warn('Saha limit kontrolü yapılamadı:', e);
          setIsSahaLimitReached(false);
        }
      }
      setMusteriler(musteriData || []);
    } catch (error) {
      console.error('Veri getirme hatası:', error);
      setSahalar([]);
      setMusteriler([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [userProfile?.companyId, userProfile?.rol, userProfile?.sahalar]);

  const handleSahaAction = async (sahaId: string, action: string) => {
    const saha = sahalar.find(s => s.id === sahaId);
    
    if (action === 'view') {
      setSelectedSaha(saha || null);
      setShowSahaDetail(true);
    } else if (action === 'edit') {
      setSelectedSaha(saha || null);
      setShowSahaModal(true);
    } else if (action === 'delete') {
      if (window.confirm(`"${saha?.ad}" sahasını silmek istediğinizden emin misiniz?`)) {
        try {
          await deleteSaha(sahaId);
          await fetchData(); // Listeyi yenile
        } catch (error) {
          console.error('Saha silme hatası:', error);
        }
      }
    }
  };

  const handleMusteriAction = async (musteriId: string, action: string) => {
    const musteri = musteriler.find(m => m.id === musteriId);
    
    if (action === 'edit') {
      setSelectedMusteri(musteri || null);
      setShowMusteriModal(true);
    } else if (action === 'delete') {
      if (window.confirm(`"${musteri?.ad}" müşterisini silmek istediğinizden emin misiniz?`)) {
        try {
          await deleteMusteri(musteriId);
          await fetchData(); // Listeyi yenile
        } catch (error) {
          console.error('Müşteri silme hatası:', error);
        }
      }
    }
  };

  const handleSahaSubmit = async (newSaha?: any) => {
    try {
      setShowSahaModal(false);
      setSelectedSaha(null);
      
      // Her durumda Firebase'den fresh data çek
      await fetchData();
    } catch (error) {
      console.error('Saha kaydetme hatası:', error);
    }
  };

  const handleMusteriSubmit = async (newMusteri?: any) => {
    try {
      setShowMusteriModal(false);
      setSelectedMusteri(null);
      
      // Her durumda Firebase'den fresh data çek
      await fetchData();
    } catch (error) {
      console.error('Müşteri kaydetme hatası:', error);
    }
  };

  const filteredSahalar = sahalar.filter(saha =>
    saha.ad.toLowerCase().includes(searchTerm.toLowerCase()) ||
    saha.musteriAdi.toLowerCase().includes(searchTerm.toLowerCase()) ||
    saha.konum.adres.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredMusteriler = musteriler.filter(musteri =>
    musteri.ad.toLowerCase().includes(searchTerm.toLowerCase()) ||
    musteri.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    musteri.sirket?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sahaStats = {
    toplam: sahalar.length,
    aktif: sahalar.filter(s => s.aktif).length,
    toplamKapasite: sahalar.reduce((sum, s) => sum + s.toplamKapasite, 0),
    toplamMusteri: musteriler.filter(m => m.aktif).length
  };

  // Giriş kontrolü
  if (!userProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Giriş Yapmanız Gerekiyor
          </h2>
          <p className="text-gray-600 mb-6">
            Sahalar ve müşteriler sayfasını görüntülemek için lütfen giriş yapın.
          </p>
          <Button 
            onClick={() => window.location.href = '/auth/login'}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Giriş Yap
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Saha Yönetimi</h1>
          <p className="text-gray-600">Sahalarınızı yönetin ve takip edin</p>
        </div>
        {canPerformAction('saha_ekle') && (
          <Button 
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => {
              if (isSahaLimitReached) {
                toast.error(`Saha limiti aşıldı (${sahalar.length}/${sahaLimit}). Planınızı yükseltin.`);
              } else {
                setShowSahaModal(true);
              }
            }}
            disabled={isSahaLimitReached}
          >
            Yeni Saha
          </Button>
        )}
      </div>

      <SubscriptionLimitBanner 
        show={isSahaLimitReached}
        message={`${sahalar.length} / ${sahaLimit} saha. Yeni saha eklemek için planınızı yükseltin.`}
      />

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <MapPin className="h-8 w-8 text-blue-500 mr-3" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{sahaStats.toplam}</p>
                <p className="text-sm text-gray-600">Toplam Saha</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Building2 className="h-8 w-8 text-green-500 mr-3" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{sahaStats.aktif}</p>
                <p className="text-sm text-gray-600">Aktif Saha</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-purple-500 mr-3" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{sahaStats.toplamMusteri}</p>
                <p className="text-sm text-gray-600">Aktif Müşteri</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Building2 className="h-8 w-8 text-orange-500 mr-3" />
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {formatNumber(sahaStats.toplamKapasite, 0)} kW
                </p>
                <p className="text-sm text-gray-600">Toplam Kapasite</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('sahalar')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'sahalar'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <MapPin className="h-4 w-4 inline mr-2" />
            Sahalar ({sahalar.length})
          </button>
          <button
            onClick={() => setActiveTab('musteriler')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'musteriler'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Users className="h-4 w-4 inline mr-2" />
            Müşteriler ({musteriler.length})
          </button>
        </nav>
      </div>

      {/* Search + View Mode */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="relative w-full md:w-1/2">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder={activeTab === 'sahalar' ? 'Saha adı, müşteri veya adres ara...' : 'Müşteri adı, email veya şirket ara...'}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            {activeTab === 'sahalar' && (
              <div className="flex items-center gap-2">
                <Button size="sm" variant={viewMode==='cards' ? 'primary':'ghost'} onClick={()=>setViewMode('cards')}>Kart</Button>
                <Button size="sm" variant={viewMode==='table' ? 'primary':'ghost'} onClick={()=>setViewMode('table')}>Tablo</Button>
                <Button size="sm" variant={viewMode==='map' ? 'primary':'ghost'} onClick={()=>setViewMode('map')}>Harita</Button>
                {viewMode === 'cards' && (
                  <Button 
                    size="sm" 
                    variant={showWeatherInCards ? 'primary' : 'ghost'} 
                    onClick={() => setShowWeatherInCards(!showWeatherInCards)}
                    className="ml-2"
                  >
                    ☁️ Hava Durumu
                  </Button>
                )}
                <div className="hidden md:flex items-center gap-1 ml-2">
                  <span className="text-xs text-gray-500 mr-1">Harita türü:</span>
                  <Button size="sm" variant={mapType==='satellite'?'primary':'ghost'} onClick={()=>setMapType('satellite')}>Uydu</Button>
                  <Button size="sm" variant={mapType==='terrain'?'primary':'ghost'} onClick={()=>setMapType('terrain')}>Arazi</Button>
                  <Button size="sm" variant={mapType==='roadmap'?'primary':'ghost'} onClick={()=>setMapType('roadmap')}>Yol</Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Content */}
      {activeTab === 'sahalar' ? (
        viewMode === 'table' ? (
        <Card className="overflow-visible">
          <CardHeader>
            <CardTitle>Sahalar ({filteredSahalar.length})</CardTitle>
          </CardHeader>
          <CardContent className="overflow-visible">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHeaderCell>Saha Adı</TableHeaderCell>
                  <TableHeaderCell>Müşteri</TableHeaderCell>
                  <TableHeaderCell>Konum</TableHeaderCell>
                  <TableHeaderCell>Kapasite</TableHeaderCell>
                  <TableHeaderCell>Durum</TableHeaderCell>
                  <TableHeaderCell>İşlemler</TableHeaderCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSahalar.map((saha) => (
                  <TableRow key={saha.id}>
                    <TableCell>
                      <div>
                        <button
                          onClick={() => {
                            setSelectedSaha(saha);
                            setShowSahaDetail(true);
                          }}
                          className="font-medium text-blue-600 hover:text-blue-800 hover:underline text-left"
                        >
                          {saha.ad}
                        </button>
                        <div className="text-sm text-gray-500">
                          {saha.santralIds?.length || 0} Santral
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Users className="h-4 w-4 text-gray-400 mr-2" />
                        {saha.musteriAdi}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-sm">{saha.konum.adres}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">
                        {(saha.toplamKapasite / 1000).toFixed(1)} MW
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={saha.aktif ? 'success' : 'secondary'}>
                        {saha.aktif ? 'Aktif' : 'Pasif'}
                      </Badge>
                    </TableCell>
                    <ActionCell>
                      <DropdownMenu
                        items={[
                          {
                            label: 'Detayları Görüntüle',
                            onClick: () => handleSahaAction(saha.id, 'view'),
                            icon: <Eye className="h-4 w-4" />
                          },
                          ...(canPerformAction('saha_duzenle') ? [{
                            label: 'Düzenle',
                            onClick: () => handleSahaAction(saha.id, 'edit'),
                            icon: <Edit className="h-4 w-4" />
                          }] : []),
                          ...(canPerformAction('saha_sil') ? [{
                            label: 'Sil',
                            onClick: () => handleSahaAction(saha.id, 'delete'),
                            icon: <Trash2 className="h-4 w-4" />,
                            danger: true
                          }] : [])
                        ]}
                      />
                    </ActionCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        ) : viewMode === 'cards' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
            {filteredSahalar.map((saha) => {
              const key = getGoogleMapsApiKey();
              const mapUrl = generateGoogleMapsUrls({ lat: saha.konum.lat, lng: saha.konum.lng }).staticMapUrl(key, 640, 160, 13, mapType);
              const photo = saha.fotograflar && saha.fotograflar[0];
              return (
                <Card key={saha.id} className="overflow-hidden hover:shadow-md transition">
                  <div className="relative">
                    <img src={photo || mapUrl || ''} alt="Saha görseli" className="w-full h-36 object-cover" />
                    {photo && (
                      <div className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded">Fotoğraf</div>
                    )}
                    {showWeatherInCards && (
                      <WeatherCard lat={saha.konum.lat} lng={saha.konum.lng} sahaAd={saha.ad} />
                    )}
                  </div>
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="font-semibold text-gray-900">{saha.ad}</div>
                      <Badge variant={saha.aktif ? 'success' : 'secondary'}>{saha.aktif ? 'Aktif' : 'Pasif'}</Badge>
                    </div>
                    <div className="text-sm text-gray-600 flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <span className="truncate">{saha.konum.adres}</span>
                    </div>
                    <div className="text-sm text-gray-600 flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      <span>{(saha.santralIds?.length || 0)} Santral • {formatNumber(saha.toplamKapasite,0)} kW</span>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button size="sm" className="flex-1" variant="secondary" onClick={()=>{setSelectedSaha(saha); setShowSahaDetail(true);}}>Görüntüle</Button>
                      {canPerformAction('saha_duzenle') && (
                        <Button size="sm" variant="ghost" onClick={()=>{setSelectedSaha(saha); setShowSahaModal(true);}}>Düzenle</Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Sol: Saha listesi */}
            <div className="lg:col-span-1 space-y-3 max-h-[640px] overflow-y-auto pr-1">
              {filteredSahalar.map((s) => {
                const thumb = (s.fotograflar && s.fotograflar[0]) || generateGoogleMapsUrls({ lat: s.konum.lat, lng: s.konum.lng }).staticMapUrl(getGoogleMapsApiKey(), 640, 120, 13, mapType) || '';
                return (
                  <Card key={s.id} className={`overflow-hidden cursor-pointer ${selectedForMap?.id===s.id ? 'ring-2 ring-primary-500' : ''}`} onClick={()=>setSelectedForMap(s)}>
                    {thumb && <img src={thumb} alt="thumb" className="w-full h-24 object-cover" />}
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="font-medium text-gray-900 truncate">{s.ad}</div>
                        <Badge variant={s.aktif ? 'success':'secondary'}>{s.aktif?'Aktif':'Pasif'}</Badge>
                      </div>
                      <div className="mt-1 text-xs text-gray-600 flex items-center gap-2">
                        <MapPin className="h-3 w-3" />
                        <span className="truncate">{s.konum.adres}</span>
                      </div>
                      <div className="mt-1 text-xs text-gray-700">{(s.santralIds?.length||0)} Santral • {formatNumber(s.toplamKapasite,0)} kW</div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
            {/* Sağ: Harita + detay */}
            <div className="lg:col-span-2 space-y-3">
              {(() => {
                const s = selectedForMap || filteredSahalar[0];
                if (!s) return <Card><CardContent className="p-6 text-gray-600">Gösterilecek saha bulunamadı.</CardContent></Card>;
                const key = getGoogleMapsApiKey();
                const embed = generateGoogleMapsUrls({ lat: s.konum.lat, lng: s.konum.lng }).embedUrl(key, 14, mapType);
                const staticSrc = generateGoogleMapsUrls({ lat: s.konum.lat, lng: s.konum.lng }).staticMapUrl(key, 1280, 420, 14, mapType) || '';
                return (
                  <div className="space-y-3">
                    {/* Hava Durumu Widget'ı */}
                    <WeatherWidget 
                      lat={s.konum.lat} 
                      lng={s.konum.lng} 
                      title={`${s.ad} - Hava Durumu`}
                      compact={true}
                    />
                    
                    {/* Harita */}
                    {embed ? (
                      <iframe title="Saha Haritası" src={embed!} width="100%" height="420" loading="lazy" style={{border:0}} allowFullScreen></iframe>
                    ) : staticSrc ? (
                      <img src={staticSrc} alt="Saha Haritası" className="w-full rounded border" />
                    ) : (
                      <Card><CardContent className="p-6 text-gray-600">Harita için API anahtarı gerekli.</CardContent></Card>
                    )}
                    <div className="mt-2 flex items-center gap-3 text-sm">
                      <a className="text-blue-600 hover:underline" href={generateGoogleMapsUrls({ lat: s.konum.lat, lng: s.konum.lng }).viewUrl} target="_blank" rel="noreferrer">Haritada Aç</a>
                      <a className="text-blue-600 hover:underline" href={generateGoogleMapsUrls({ lat: s.konum.lat, lng: s.konum.lng }).directionsUrl} target="_blank" rel="noreferrer">Yol Tarifi</a>
                      <span className="text-gray-500">• {(s.santralIds?.length||0)} Santral • {formatNumber(s.toplamKapasite,0)} kW</span>
                    </div>
                    {s.fotograflar && s.fotograflar.length > 0 && (
                      <div className="mt-3">
                        <div className="text-sm font-medium text-gray-900 mb-2">Saha Fotoğrafları</div>
                        <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                          {s.fotograflar.slice(0,8).map((url, idx)=> (
                            <img key={idx} src={url} alt={`foto ${idx+1}`} className="w-full h-24 object-cover rounded" onClick={()=>window.open(url,'_blank')} />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        )
      ) : (
        <Card className="overflow-visible">
          <CardHeader>
            <CardTitle>Müşteriler ({filteredMusteriler.length})</CardTitle>
          </CardHeader>
          <CardContent className="overflow-visible">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHeaderCell>Müşteri Bilgileri</TableHeaderCell>
                  <TableHeaderCell>İletişim</TableHeaderCell>
                  <TableHeaderCell>Şirket</TableHeaderCell>
                  <TableHeaderCell>Saha Sayısı</TableHeaderCell>
                  <TableHeaderCell>Durum</TableHeaderCell>
                  <TableHeaderCell>İşlemler</TableHeaderCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMusteriler.map((musteri) => (
                  <TableRow key={musteri.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium text-gray-900">{musteri.ad}</div>
                        <div className="text-sm text-gray-500">
                          Kayıt: {musteri.olusturmaTarihi?.toDate ? musteri.olusturmaTarihi.toDate().toLocaleDateString('tr-TR') : 'N/A'}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center text-sm">
                          <Mail className="h-3 w-3 text-gray-400 mr-1" />
                          {musteri.email}
                        </div>
                        <div className="flex items-center text-sm">
                          <Phone className="h-3 w-3 text-gray-400 mr-1" />
                          {musteri.telefon}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {musteri.sirket || '-'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 text-gray-400 mr-1" />
                        {musteri.sahaSayisi}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={musteri.aktif ? 'success' : 'secondary'}>
                        {musteri.aktif ? 'Aktif' : 'Pasif'}
                      </Badge>
                    </TableCell>
                    <ActionCell>
                      <DropdownMenu
                        items={[
                          {
                            label: 'Profili Görüntüle',
                            onClick: () => handleMusteriAction(musteri.id, 'view'),
                            icon: <Eye className="h-4 w-4" />
                          },
                          ...(canPerformAction('musteri_duzenle') ? [{
                            label: 'Düzenle',
                            onClick: () => handleMusteriAction(musteri.id, 'edit'),
                            icon: <Edit className="h-4 w-4" />
                          }] : []),
                          ...(canPerformAction('musteri_duzenle') ? [{
                            label: 'Saha Ata',
                            onClick: () => handleMusteriAction(musteri.id, 'assign'),
                            icon: <MapPin className="h-4 w-4" />
                          }] : []),
                          ...(canPerformAction('musteri_sil') ? [{
                            label: 'Sil',
                            onClick: () => handleMusteriAction(musteri.id, 'delete'),
                            icon: <Trash2 className="h-4 w-4" />,
                            danger: true
                          }] : [])
                        ]}
                      />
                    </ActionCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Saha Modal */}
      <Modal
        isOpen={showSahaModal}
        onClose={() => {
          setShowSahaModal(false);
          setSelectedSaha(null);
        }}
        title={selectedSaha ? 'Saha Düzenle' : 'Yeni Saha Ekle'}
        size="lg"
      >
        <SahaForm
          saha={selectedSaha}
          onSuccess={handleSahaSubmit}
          onCancel={() => {
            setShowSahaModal(false);
            setSelectedSaha(null);
          }}
        />
      </Modal>

      {/* Müşteri Modal */}
      <Modal
        isOpen={showMusteriModal}
        onClose={() => {
          setShowMusteriModal(false);
          setSelectedMusteri(null);
        }}
        title={selectedMusteri ? 'Müşteri Düzenle' : 'Yeni Müşteri Ekle'}
        size="lg"
      >
        <MusteriForm
          musteri={selectedMusteri}
          onSuccess={handleMusteriSubmit}
          onCancel={() => {
            setShowMusteriModal(false);
            setSelectedMusteri(null);
          }}
        />
      </Modal>

      {/* Saha Detay Modal */}
      {selectedSaha && (
        <Modal
          isOpen={showSahaDetail}
          onClose={() => {
            setShowSahaDetail(false);
            setSelectedSaha(null);
          }}
          title="Saha Detayları"
          size="xl"
        >
          <SahaDetailCard
            saha={selectedSaha}
            companyId={selectedSaha.companyId}
            onEdit={canPerformAction('saha_duzenle') ? () => {
              setShowSahaDetail(false);
              setShowSahaModal(true);
            } : undefined}
            onDelete={canPerformAction('saha_sil') ? () => {
              setShowSahaDetail(false);
              handleSahaAction(selectedSaha.id, 'delete');
            } : undefined}
          />
        </Modal>
      )}
    </div>
  );
};

export default Sahalar;
