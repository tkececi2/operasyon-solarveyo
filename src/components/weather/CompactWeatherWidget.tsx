import React, { useState, useEffect } from 'react';
import { 
  Cloud, 
  AlertTriangle,
  Sun,
  TrendingDown,
  Activity,
  Thermometer,
  Wind
} from 'lucide-react';
import { Card, CardContent, Badge } from '../ui';
import { getMultipleWeatherData, calculateWeatherImpact, getWeatherAlerts } from '../../services/weatherService';
import { formatNumber } from '../../utils/formatters';

interface CompactWeatherWidgetProps {
  sahalar: Array<{
    id: string;
    ad: string;
    konum: {
      lat: number;
      lng: number;
    };
    toplamKapasite?: number;
  }>;
  className?: string;
}

export const CompactWeatherWidget: React.FC<CompactWeatherWidgetProps> = ({ 
  sahalar, 
  className = '' 
}) => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [showSites, setShowSites] = useState(true);

  useEffect(() => {
    const fetchWeatherData = async () => {
      if (!sahalar || sahalar.length === 0) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        const locations = sahalar.map(s => ({
          id: s.id,
          lat: s.konum.lat,
          lng: s.konum.lng
        }));
        
        const weatherData = await getMultipleWeatherData(locations);
        
        let totalTemp = 0, totalWind = 0, totalEfficiency = 0;
        let totalAlerts = 0, criticalCount = 0;
        let estimatedLoss = 0;
        const criticalSites: any[] = [];
        const siteDetails: any[] = [];

        for (const [sahaId, weather] of weatherData.entries()) {
          const saha = sahalar.find(s => s.id === sahaId);
          if (!saha || !weather) continue;

          totalTemp += weather.current.temperature;
          totalWind += weather.current.windSpeed;

          const impact = calculateWeatherImpact(weather.current);
          totalEfficiency += impact.efficiency;

          const alerts = getWeatherAlerts(weather.current);
          totalAlerts += alerts.length;
          if (alerts.length > 0) {
            criticalCount++;
            criticalSites.push({
              ad: saha.ad,
              alerts: alerts[0], // İlk uyarıyı göster
              efficiency: impact.efficiency
            });
          }
          
          // Saha bazlı detay
          siteDetails.push({
            id: saha.id,
            ad: saha.ad,
            temperature: Math.round(weather.current.temperature),
            icon: weather.current.icon,
            description: weather.current.description,
            code: weather.current.weatherCode,
            wind: Math.round(weather.current.windSpeed),
            efficiency: impact.efficiency,
            kapasite: saha.toplamKapasite || 0,
            alerts: alerts.length
          });

          if (saha.toplamKapasite) {
            const loss = saha.toplamKapasite * ((100 - impact.efficiency) / 100);
            estimatedLoss += loss;
          }
        }

        const count = weatherData.size;
        
        setStats({
          avgTemp: count > 0 ? Math.round(totalTemp / count) : 0,
          avgWind: count > 0 ? Math.round(totalWind / count) : 0,
          avgEfficiency: count > 0 ? Math.round(totalEfficiency / count) : 0,
          totalAlerts,
          criticalCount,
          estimatedLoss: Math.round(estimatedLoss),
          sites: siteDetails,
          criticalSites: criticalSites.slice(0, 2) // En fazla 2 kritik saha
        });

      } catch (error) {
        console.error('Hava durumu verisi alınamadı:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchWeatherData();
    const interval = setInterval(fetchWeatherData, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, [sahalar]);

  if (loading || !stats) {
    return (
      <Card className={`${className} bg-gradient-to-r from-blue-50 to-cyan-50`}>
        <CardContent className="p-4">
          <div className="animate-pulse flex items-center gap-4">
            <div className="h-12 w-12 bg-white/50 rounded-lg"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-white/50 rounded w-1/3"></div>
              <div className="h-3 bg-white/50 rounded w-1/2"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`${className} h-full`} padding="sm">
      <div className="p-2">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-base md:text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Cloud className="h-5 w-5 text-blue-600 motion-safe:animate-pulse" />
            Hava Durumu
            <span className="relative inline-flex w-2 h-2 ml-1">
              <span className="absolute inline-flex rounded-full bg-emerald-500 opacity-75 animate-ping w-2 h-2"></span>
              <span className="relative inline-flex rounded-full bg-emerald-500 w-2 h-2"></span>
            </span>
            <span className="text-[10px] text-emerald-600 font-medium motion-safe:animate-pulse">Canlı</span>
            {stats.totalAlerts > 0 && (
              <Badge variant="danger" className="text-xs">
                {stats.totalAlerts}
              </Badge>
            )}
          </h3>
          <button 
            onClick={() => setShowSites(!showSites)}
            className="text-xs text-blue-600 hover:text-blue-800"
          >
            {showSites ? 'Özet' : 'Sahalar'}
          </button>
        </div>

        {/* Saha Listesi veya Özet Görünüm */}
        {showSites ? (
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {stats.sites.map((site: any, i: number) => (
              <div key={site.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-2">
                  <div className={`w-10 h-10 rounded flex items-center justify-center text-2xl ${
                    (site.code === 0) 
                      ? 'animate-[spin_12s_linear_infinite]' 
                      : (site.alerts > 0 ? 'motion-safe:animate-pulse' : '')
                  }`}>
                    {site.icon}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">{site.ad}</div>
                    <div className="text-[11px] text-gray-500">
                      {site.kapasite ? `${formatNumber(site.kapasite, 0)} kW` : 'Kapasite yok'}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-blue-700">{site.temperature}°C</div>
                  <div className="text-[11px] text-gray-600">Rüzgar {site.wind} km/h</div>
                  {([51,53,55,56,57,61,63,65,66,67,80,81,82].includes(site.code)) && (
                    <div className="text-[11px] text-blue-600">🌧️ Yağışlı</div>
                  )}
                  <Badge 
                    variant={site.efficiency >= 70 ? 'success' : site.efficiency >= 40 ? 'warning' : 'danger'}
                    className="text-[10px] mt-0.5"
                  >
                    {site.efficiency}%
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
        {/* Ana Metrikler - Yatay */}
        <div className="grid grid-cols-2 gap-2 mb-2">
          <div className="rounded-lg border p-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-green-100 text-green-700 flex items-center justify-center">
              <Sun className="h-4 w-4 animate-[spin_10s_linear_infinite]" />
            </div>
            <div>
              <div className="text-lg md:text-xl font-bold text-gray-900">{stats.avgEfficiency}%</div>
              <div className="text-[11px] md:text-xs text-gray-600">Ortalama Verim</div>
            </div>
          </div>

          <div className="rounded-lg border p-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center motion-safe:animate-pulse">
              <Thermometer className="h-4 w-4" />
            </div>
            <div>
              <div className="text-lg md:text-xl font-bold text-gray-900">{stats.avgTemp}°C</div>
              <div className="text-[11px] md:text-xs text-gray-600">Sıcaklık</div>
            </div>
          </div>

          <div className="rounded-lg border p-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-cyan-100 text-cyan-700 flex items-center justify-center">
              <Wind className="h-4 w-4 animate-[spin_6s_linear_infinite]" />
            </div>
            <div>
              <div className="text-lg md:text-xl font-bold text-gray-900">{stats.avgWind} <span className="text-xs">km/h</span></div>
              <div className="text-[11px] md:text-xs text-gray-600">Rüzgar</div>
            </div>
          </div>

          <div className="rounded-lg border p-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center motion-safe:animate-pulse">
              <TrendingDown className="h-4 w-4" />
            </div>
            <div>
              <div className="text-lg md:text-xl font-bold text-gray-900">{formatNumber(stats.estimatedLoss, 0)} <span className="text-xs">kW</span></div>
              <div className="text-[11px] md:text-xs text-gray-600">Kayıp</div>
            </div>
          </div>
        </div>

        {/* Kritik Uyarılar - Sadece varsa göster */}
        {stats.criticalSites.length > 0 && (
          <div className="space-y-1 mt-2">
            {stats.criticalSites.map((site: any, i: number) => (
              <div key={i} className="flex items-center justify-between bg-red-50 rounded px-2 py-1">
                <div className="flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3 text-red-600" />
                  <span className="text-xs font-medium text-red-900">{site.ad}</span>
                </div>
                <Badge variant="danger" className="text-xs">{site.efficiency}%</Badge>
              </div>
            ))}
          </div>
        )}
        </>
        )}
      </div>
    </Card>
  );
};
