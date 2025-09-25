import React, { useState, useEffect } from 'react';
import { 
  Cloud, 
  AlertTriangle,
  TrendingDown,
  MapPin,
  Sun
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, Badge, LoadingSpinner } from '../ui';
import { getMultipleWeatherData, calculateWeatherImpact, getWeatherAlerts } from '../../services/weatherService';

interface WeatherSummaryProps {
  sahalar: Array<{
    id: string;
    ad: string;
    konum: {
      lat: number;
      lng: number;
    };
  }>;
  className?: string;
}

export const WeatherSummary: React.FC<WeatherSummaryProps> = ({ sahalar, className = '' }) => {
  const [weatherData, setWeatherData] = useState<Map<string, any>>(new Map());
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({
    avgTemp: 0,
    avgEfficiency: 0,
    alertCount: 0,
    lowestEfficiencySite: null as any,
    criticalSites: [] as any[]
  });

  useEffect(() => {
    const fetchWeatherData = async () => {
      if (!sahalar || sahalar.length === 0) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Tüm sahalar için hava durumu verilerini çek
        const locations = sahalar.map(s => ({
          id: s.id,
          lat: s.konum.lat,
          lng: s.konum.lng
        }));
        
        const data = await getMultipleWeatherData(locations);
        setWeatherData(data);

        // Özet hesapla
        let totalTemp = 0;
        let totalEfficiency = 0;
        let alertCount = 0;
        let lowestEfficiency = 100;
        let lowestSite = null;
        const criticalSites = [];

        for (const [sahaId, weather] of data.entries()) {
          const saha = sahalar.find(s => s.id === sahaId);
          if (!saha || !weather) continue;

          totalTemp += weather.current.temperature;
          
          const impact = calculateWeatherImpact(weather.current);
          totalEfficiency += impact.efficiency;
          
          if (impact.efficiency < lowestEfficiency) {
            lowestEfficiency = impact.efficiency;
            lowestSite = { ...saha, efficiency: impact.efficiency, weather: weather.current };
          }

          const alerts = getWeatherAlerts(weather.current);
          if (alerts.length > 0) {
            alertCount += alerts.length;
            criticalSites.push({
              ...saha,
              alerts,
              weather: weather.current,
              efficiency: impact.efficiency
            });
          }
        }

        const count = data.size;
        setSummary({
          avgTemp: count > 0 ? Math.round(totalTemp / count) : 0,
          avgEfficiency: count > 0 ? Math.round(totalEfficiency / count) : 0,
          alertCount,
          lowestEfficiencySite: lowestSite,
          criticalSites: criticalSites.slice(0, 3) // En fazla 3 kritik saha göster
        });

      } catch (error) {
        console.error('Hava durumu özeti yüklenemedi:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchWeatherData();
    
    // Her 15 dakikada bir güncelle
    const interval = setInterval(fetchWeatherData, 15 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [sahalar]);

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cloud className="h-5 w-5" />
            Hava Durumu Özeti
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 flex items-center justify-center">
          <LoadingSpinner />
        </CardContent>
      </Card>
    );
  }

  if (!sahalar || sahalar.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cloud className="h-5 w-5" />
            Hava Durumu Özeti
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 text-center text-gray-500">
          Saha bulunamadı
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Cloud className="h-5 w-5" />
          Hava Durumu Özeti
          {summary.alertCount > 0 && (
            <Badge variant="danger" className="ml-auto">
              <AlertTriangle className="h-3 w-3 mr-1" />
              {summary.alertCount} Uyarı
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Genel Özet */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="text-sm text-gray-600">Ortalama Sıcaklık</div>
            <div className="text-2xl font-bold">{summary.avgTemp}°C</div>
          </div>
          <div className="space-y-1">
            <div className="text-sm text-gray-600 flex items-center gap-1">
              <Sun className="h-4 w-4" />
              Ortalama Verimlilik
            </div>
            <div className={`text-2xl font-bold ${
              summary.avgEfficiency > 70 ? 'text-green-600' : 
              summary.avgEfficiency > 40 ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {summary.avgEfficiency}%
            </div>
          </div>
        </div>

        {/* En Düşük Verimli Saha */}
        {summary.lowestEfficiencySite && (
          <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
            <div className="flex items-start gap-2">
              <TrendingDown className="h-4 w-4 text-yellow-600 mt-0.5" />
              <div className="flex-1">
                <div className="text-sm font-medium text-yellow-900">
                  En Düşük Verimlilik
                </div>
                <div className="text-sm text-yellow-700 mt-1">
                  <span className="font-medium">{summary.lowestEfficiencySite.ad}</span>
                  {' - '}
                  <span className="font-bold">{summary.lowestEfficiencySite.efficiency}%</span>
                  {' ('}
                  {summary.lowestEfficiencySite.weather.icon} {summary.lowestEfficiencySite.weather.description}
                  {')'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Kritik Sahalar */}
        {summary.criticalSites.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-medium text-gray-900">Kritik Durumlar</div>
            {summary.criticalSites.map((site, i) => (
              <div key={i} className="p-2 bg-red-50 rounded-lg border border-red-200">
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-red-600 mt-0.5" />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-red-900">
                      {site.ad}
                    </div>
                    <div className="text-xs text-red-700 mt-0.5">
                      {site.alerts.join(' • ')}
                    </div>
                  </div>
                  <Badge variant="danger" className="text-xs">
                    {site.efficiency}%
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tüm Sahalar Özeti */}
        <div className="pt-3 border-t">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="text-xs text-gray-500">Toplam Saha</div>
              <div className="text-lg font-semibold">{sahalar.length}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">İzlenen</div>
              <div className="text-lg font-semibold text-green-600">{weatherData.size}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Kritik</div>
              <div className="text-lg font-semibold text-red-600">{summary.criticalSites.length}</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
