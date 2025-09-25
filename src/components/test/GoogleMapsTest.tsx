import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { 
  getGoogleMapsApiKey, 
  generateGoogleMapsUrls, 
  searchAddress,
  validateCoordinates,
  TURKEY_CITIES
} from '../../utils/googleMaps';
import { MapPin, Search, ExternalLink, CheckCircle, XCircle } from 'lucide-react';

export const GoogleMapsTest: React.FC = () => {
  const [testResults, setTestResults] = useState<{
    apiKey: boolean;
    geocoding: boolean;
    urls: boolean;
  }>({
    apiKey: false,
    geocoding: false,
    urls: false
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [searchResult, setSearchResult] = useState<any>(null);

  // Test API Key
  const testApiKey = () => {
    const apiKey = getGoogleMapsApiKey();
    const hasKey = apiKey && apiKey.length > 0;
    setTestResults(prev => ({ ...prev, apiKey: hasKey }));
    return hasKey;
  };

  // Test URL Generation
  const testUrlGeneration = () => {
    const testCoords = { lat: 39.9334, lng: 32.8597 }; // Ankara
    const urls = generateGoogleMapsUrls(testCoords, 'Test Location');
    const hasUrls = urls && urls.viewUrl && urls.directionsUrl;
    setTestResults(prev => ({ ...prev, urls: hasUrls }));
    return hasUrls;
  };

  // Test Geocoding
  const testGeocoding = async () => {
    setIsLoading(true);
    try {
      const result = await searchAddress('Ankara, Kızılay');
      const success = result !== null;
      setTestResults(prev => ({ ...prev, geocoding: success }));
      setSearchResult(result);
      return success;
    } catch (error) {
      setTestResults(prev => ({ ...prev, geocoding: false }));
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Tüm testleri çalıştır
  const runAllTests = async () => {
    console.log('🧪 Google Maps API Testleri Başlatılıyor...');
    
    // 1. API Key Test
    const apiKeyOk = testApiKey();
    console.log('✅ API Key Test:', apiKeyOk ? 'BAŞARILI' : 'BAŞARISIZ');
    
    // 2. URL Generation Test
    const urlsOk = testUrlGeneration();
    console.log('✅ URL Generation Test:', urlsOk ? 'BAŞARILI' : 'BAŞARISIZ');
    
    // 3. Geocoding Test (sadece API key varsa)
    if (apiKeyOk) {
      const geocodingOk = await testGeocoding();
      console.log('✅ Geocoding Test:', geocodingOk ? 'BAŞARILI' : 'BAŞARISIZ');
    }
  };

  const apiKey = getGoogleMapsApiKey();
  const ankaraCoords = TURKEY_CITIES.Ankara;
  const ankaraUrls = generateGoogleMapsUrls(ankaraCoords, 'Ankara Test');

  return (
    <div className="space-y-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-blue-500" />
            Google Maps API Test Merkezi
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          
          {/* API Key Status */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium">API Key Status</p>
              <p className="text-sm text-gray-600">
                {apiKey ? `Key bulundu: ${apiKey.substring(0, 10)}...` : 'API Key bulunamadı'}
              </p>
            </div>
            {testResults.apiKey ? (
              <CheckCircle className="h-6 w-6 text-green-500" />
            ) : (
              <XCircle className="h-6 w-6 text-red-500" />
            )}
          </div>

          {/* URL Generation Test */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium">URL Generation</p>
              <p className="text-sm text-gray-600">
                {testResults.urls ? 'URL\'ler başarıyla oluşturuldu' : 'URL oluşturma testi yapılmadı'}
              </p>
            </div>
            {testResults.urls ? (
              <CheckCircle className="h-6 w-6 text-green-500" />
            ) : (
              <XCircle className="h-6 w-6 text-red-500" />
            )}
          </div>

          {/* Geocoding Test */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium">Geocoding (Adres Arama)</p>
              <p className="text-sm text-gray-600">
                {isLoading ? 'Test ediliyor...' : 
                 testResults.geocoding ? `Başarılı: ${searchResult?.lat}, ${searchResult?.lng}` : 
                 'Geocoding testi yapılmadı'}
              </p>
            </div>
            {isLoading ? (
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            ) : testResults.geocoding ? (
              <CheckCircle className="h-6 w-6 text-green-500" />
            ) : (
              <XCircle className="h-6 w-6 text-red-500" />
            )}
          </div>

          {/* Test Butonu */}
          <Button 
            onClick={runAllTests}
            disabled={isLoading}
            className="w-full"
          >
            <Search className="h-4 w-4 mr-2" />
            {isLoading ? 'Testler Çalışıyor...' : 'Tüm Testleri Çalıştır'}
          </Button>

          {/* Quick Links */}
          {apiKey && ankaraUrls && (
            <div className="space-y-2 pt-4 border-t">
              <p className="font-medium">Test Linkleri (Ankara):</p>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(ankaraUrls.viewUrl, '_blank')}
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  Haritada Gör
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(ankaraUrls.directionsUrl, '_blank')}
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  Yol Tarifi
                </Button>
              </div>
              
              {/* Embed Test */}
              {ankaraUrls.embedUrl && (
                <div className="mt-4">
                  <p className="text-sm font-medium mb-2">Embed Harita Test:</p>
                  <iframe
                    width="100%"
                    height="200"
                    style={{ border: 0 }}
                    src={ankaraUrls.embedUrl(apiKey, 12, 'roadmap') || ''}
                    allowFullScreen
                    className="rounded-lg"
                    title="Ankara Test Map"
                  />
                </div>
              )}
            </div>
          )}

          {/* Debug Info */}
          <details className="mt-4">
            <summary className="cursor-pointer text-sm font-medium text-gray-600">
              🔧 Debug Bilgileri
            </summary>
            <div className="mt-2 p-3 bg-gray-100 rounded text-xs font-mono">
              <p>API Key: {apiKey ? 'Mevcut' : 'Yok'}</p>
              <p>Ankara Koordinatları: {ankaraCoords.lat}, {ankaraCoords.lng}</p>
              <p>URL Validation: {validateCoordinates(ankaraCoords.lat, ankaraCoords.lng) ? 'Geçerli' : 'Geçersiz'}</p>
              {searchResult && (
                <p>Son Arama Sonucu: {searchResult.lat}, {searchResult.lng}</p>
              )}
            </div>
          </details>

        </CardContent>
      </Card>
    </div>
  );
};
