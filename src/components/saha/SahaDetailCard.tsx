import React, { useEffect, useState } from 'react';
import { 
  MapPin, 
  Zap, 
  User, 
  Calendar, 
  Activity, 
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  ExternalLink,
  Navigation,
  Copy
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { 
  generateGoogleMapsUrls, 
  validateCoordinates, 
  getGoogleMapsApiKey
} from '../../utils/googleMaps';
import { getSantrallerBySaha, Santral } from '../../services/santralService';

interface SahaDetailCardProps {
  saha: {
    id: string;
    companyId?: string;
    ad: string;
    musteriAdi: string;
    konum: {
      lat: number;
      lng: number;
      adres: string;
    };
    toplamKapasite: number;
    aktif: boolean;
    aciklama?: string;
    olusturmaTarihi: any;
  };
  companyId?: string;
  onEdit?: () => void;
  onDelete?: () => void;
}

export const SahaDetailCard: React.FC<SahaDetailCardProps> = ({
  saha,
  companyId,
  onEdit,
  onDelete
}) => {
  const [showMap, setShowMap] = useState(true);
  const [santraller, setSantraller] = useState<Santral[]>([]);
  const [santrallerLoading, setSantrallerLoading] = useState<boolean>(false);

  const hasCoordinates = validateCoordinates(saha.konum.lat, saha.konum.lng);
  const googleMapsApiKey = getGoogleMapsApiKey();
  const googleMapsUrls = hasCoordinates ? generateGoogleMapsUrls(saha.konum, saha.ad) : null;

  // Koordinatları kopyalama
  const copyCoordinates = () => {
    const coordText = `${saha.konum.lat}, ${saha.konum.lng}`;
    navigator.clipboard.writeText(coordText);
    alert('Koordinatlar kopyalandı!');
  };

  // Mock durum - gerçek projede saha durum alanından alınabilir
  const sahaStats = {
    sonBakim: '2024-08-15',
    durum: 'normal' as 'normal' | 'uyari' | 'kritik'
  };

  // Bağlı santralleri getir
  useEffect(() => {
    const load = async () => {
      if (!companyId && !saha.companyId) return;
      try {
        setSantrallerLoading(true);
        const list = await getSantrallerBySaha((companyId || saha.companyId) as string, saha.id);
        setSantraller(list);
      } catch (e) {
        console.error('Saha santralleri yüklenemedi', e);
      } finally {
        setSantrallerLoading(false);
      }
    };
    load();
  }, [companyId, saha.companyId, saha.id]);

  const getDurumBadge = () => {
    switch (sahaStats.durum) {
      case 'normal':
        return <Badge variant="success" className="flex items-center gap-1">
          <CheckCircle className="h-3 w-3" />
          Normal
        </Badge>;
      case 'uyari':
        return <Badge variant="warning" className="flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" />
          Dikkat
        </Badge>;
      case 'kritik':
        return <Badge variant="danger" className="flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" />
          Kritik
        </Badge>;
      default:
        return <Badge variant="secondary">Bilinmiyor</Badge>;
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-500" />
              {saha.ad}
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1 flex items-center gap-1">
              <User className="h-4 w-4" />
              {saha.musteriAdi}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {getDurumBadge()}
            <Badge variant={saha.aktif ? "success" : "secondary"}>
              {saha.aktif ? "Aktif" : "Pasif"}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Temel Bilgiler */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <Zap className="h-6 w-6 text-blue-600 mx-auto mb-1" />
            <p className="text-sm text-gray-600">Kapasite</p>
            <p className="font-semibold text-gray-900">
              {saha.toplamKapasite.toLocaleString()} kW
            </p>
          </div>

        </div>

        {/* Konum Bilgisi */}
        <div className="border-t pt-4">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h4 className="font-medium text-gray-900 flex items-center gap-2">
                <MapPin className="h-4 w-4 text-red-500" />
                Konum
              </h4>
              <p className="text-sm text-gray-600 mt-1">{saha.konum.adres}</p>
              {hasCoordinates && (
                <div className="mt-2 space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-gray-500">
                      {saha.konum.lat.toFixed(6)}, {saha.konum.lng.toFixed(6)}
                    </p>
                    <button
                      onClick={copyCoordinates}
                      className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                    >
                      <Copy className="h-3 w-3" />
                      Kopyala
                    </button>
                  </div>

                </div>
              )}
            </div>
            {hasCoordinates && (
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => googleMapsUrls && window.open(googleMapsUrls.viewUrl, '_blank')}
                  className="flex items-center gap-1"
                >
                  <ExternalLink className="h-3 w-3" />
                  Haritada Gör
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => googleMapsUrls && window.open(googleMapsUrls.directionsUrl, '_blank')}
                  className="flex items-center gap-1"
                >
                  <Navigation className="h-3 w-3" />
                  Yol Tarifi
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowMap(!showMap)}
                  className="flex items-center gap-1"
                >
                  <MapPin className="h-3 w-3" />
                  {showMap ? 'Gizle' : 'Göster'}
                </Button>
              </div>
            )}
          </div>

          {/* Google Maps Embed */}
          {showMap && hasCoordinates && (
            <div className="mt-3">
              {googleMapsApiKey && googleMapsUrls ? (
                <iframe
                  width="100%"
                  height="300"
                  style={{ border: 0 }}
                  src={googleMapsUrls.embedUrl(googleMapsApiKey, 15, 'roadmap') || ''}
                  allowFullScreen
                  className="rounded-lg shadow-md"
                  title={`${saha.ad} Konumu`}
                />
              ) : (
                <div className="bg-gray-100 rounded-lg p-6 text-center">
                  <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 mb-2">Google Maps API Key Gerekli</p>
                  <p className="text-xs text-gray-500">
                    .env dosyasında VITE_GOOGLE_MAPS_API_KEY tanımlayın
                  </p>
                  <div className="mt-3 p-2 bg-gray-200 rounded text-xs font-mono">
                  VITE_GOOGLE_MAPS_API_KEY=AIzaSyBrlyyV7X54-Ysk338vXmLDdidimSHIeMI
                  </div>
                </div>
              )}

            </div>
          )}
        </div>

        {/* Bağlı Santraller */}
        <div className="border-t pt-4">
          <h4 className="font-medium text-gray-900 mb-2">Bağlı Santraller</h4>
          {santrallerLoading ? (
            <p className="text-sm text-gray-600">Yükleniyor...</p>
          ) : santraller.length === 0 ? (
            <p className="text-sm text-gray-600">Bu sahaya bağlı santral bulunmuyor.</p>
          ) : (
            <div className="grid sm:grid-cols-2 gap-3">
              {santraller.map((s) => (
                <div key={s.id} className="rounded-lg border bg-white p-3 flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">{s.ad}</div>
                    <div className="text-xs text-gray-600">{s.kapasite.toLocaleString()} kW • {s.durum}</div>
                  </div>
                  <Badge variant={s.durum === 'aktif' ? 'success' : 'secondary'}>{s.durum}</Badge>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Ek Bilgiler */}
        {saha.aciklama && (
          <div className="border-t pt-4">
            <h4 className="font-medium text-gray-900 mb-2">Açıklama</h4>
            <p className="text-sm text-gray-600">{saha.aciklama}</p>
          </div>
        )}

        {/* Son Bakım */}
        <div className="border-t pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600">
                Son Bakım: {new Date(sahaStats.sonBakim).toLocaleDateString('tr-TR')}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600">
                Oluşturulma: {saha.olusturmaTarihi?.toDate ? 
                  saha.olusturmaTarihi.toDate().toLocaleDateString('tr-TR') : 
                  'Bilinmiyor'
                }
              </span>
            </div>
          </div>
        </div>

        {/* Aksiyonlar */}
        {(onEdit || onDelete) && (
          <div className="border-t pt-4 flex gap-2">
            {onEdit && (
              <Button variant="outline" onClick={onEdit} className="flex-1">
                Düzenle
              </Button>
            )}
            {onDelete && (
              <Button variant="outline" onClick={onDelete} className="flex-1 text-red-600 hover:bg-red-50">
                Sil
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
