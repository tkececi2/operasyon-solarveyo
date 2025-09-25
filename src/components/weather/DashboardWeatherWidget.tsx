import React, { useState, useEffect } from 'react';
import { 
  Cloud, 
  Thermometer,
  Wind,
  Droplets,
  AlertTriangle,
  Sun,
  MapPin,
  TrendingUp,
  TrendingDown,
  Activity
} from 'lucide-react';
import { Card, CardContent, Badge } from '../ui';
import { getMultipleWeatherData, calculateWeatherImpact, getWeatherAlerts } from '../../services/weatherService';
import { formatNumber } from '../../utils/formatters';

interface DashboardWeatherWidgetProps {
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

interface WeatherStats {
  avgTemp: number;
  avgHumidity: number;
  avgWindSpeed: number;
  avgEfficiency: number;
  totalAlerts: number;
  criticalCount: number;
  optimalCount: number;
  lowEfficiencyCount: number;
  estimatedLoss: number; // kW cinsinden tahmini kayıp
}

export const DashboardWeatherWidget: React.FC<DashboardWeatherWidgetProps> = ({ 
  sahalar, 
  className = '' 
}) => {
  const [stats, setStats] = useState<WeatherStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMetric, setSelectedMetric] = useState<'efficiency' | 'temperature' | 'alerts'>('efficiency');
  const [topSites, setTopSites] = useState<any[]>([]);

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
        
        // İstatistikleri hesapla
        let totalTemp = 0, totalHumidity = 0, totalWind = 0, totalEfficiency = 0;
        let totalAlerts = 0, criticalCount = 0, optimalCount = 0, lowEfficiencyCount = 0;
        let estimatedLoss = 0;
        const siteDetails = [];

        for (const [sahaId, weather] of weatherData.entries()) {
          const saha = sahalar.find(s => s.id === sahaId);
          if (!saha || !weather) continue;

          const current = weather.current;
          totalTemp += current.temperature;
          totalHumidity += current.humidity;
          totalWind += current.windSpeed;

          const impact = calculateWeatherImpact(current);
          totalEfficiency += impact.efficiency;

          // Verimlilik kategorileri
          if (impact.efficiency >= 80) {
            optimalCount++;
          } else if (impact.efficiency < 50) {
            lowEfficiencyCount++;
          }

          // Uyarıları kontrol et
          const alerts = getWeatherAlerts(current);
          totalAlerts += alerts.length;
          if (alerts.length > 0) {
            criticalCount++;
          }

          // Tahmini kayıp hesapla (100% verimlilikten düşük olan kısım)
          if (saha.toplamKapasite) {
            const loss = saha.toplamKapasite * ((100 - impact.efficiency) / 100);
            estimatedLoss += loss;
          }

          // Detayları sakla
          siteDetails.push({
            id: saha.id,
            ad: saha.ad,
            temperature: current.temperature,
            efficiency: impact.efficiency,
            weather: current,
            alerts: alerts.length,
            icon: current.icon,
            description: current.description,
            kapasite: saha.toplamKapasite || 0
          });
        }

        const count = weatherData.size;
        
        setStats({
          avgTemp: count > 0 ? Math.round(totalTemp / count) : 0,
          avgHumidity: count > 0 ? Math.round(totalHumidity / count) : 0,
          avgWindSpeed: count > 0 ? Math.round(totalWind / count) : 0,
          avgEfficiency: count > 0 ? Math.round(totalEfficiency / count) : 0,
          totalAlerts,
          criticalCount,
          optimalCount,
          lowEfficiencyCount,
          estimatedLoss: Math.round(estimatedLoss)
        });

        // En iyi/kötü performans gösteren sahaları belirle
        const sorted = siteDetails.sort((a, b) => {
          if (selectedMetric === 'efficiency') return b.efficiency - a.efficiency;
          if (selectedMetric === 'temperature') return b.temperature - a.temperature;
          return b.alerts - a.alerts;
        });
        
        setTopSites(sorted.slice(0, 3));

      } catch (error) {
        console.error('Hava durumu verisi alınamadı:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchWeatherData();
    
    // Her 10 dakikada bir güncelle
    const interval = setInterval(fetchWeatherData, 10 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [sahalar, selectedMetric]);

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            <div className="grid grid-cols-4 gap-4">
              {[1,2,3,4].map(i => (
                <div key={i} className="h-20 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!stats || sahalar.length === 0) {
    return null;
  }

  const efficiencyColor = stats.avgEfficiency >= 70 ? 'text-green-600' : 
                          stats.avgEfficiency >= 40 ? 'text-yellow-600' : 'text-red-600';

  return (
    <Card className={`${className} overflow-hidden`}>
      <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-white">
            <Cloud className="h-5 w-5" />
            <h3 className="font-semibold">Hava Durumu & Panel Performansı</h3>
          </div>
          {stats.totalAlerts > 0 && (
            <Badge variant="danger" className="bg-red-600 text-white border-0">
              <AlertTriangle className="h-3 w-3 mr-1" />
              {stats.totalAlerts} Uyarı
            </Badge>
          )}
        </div>

        {/* Ana Metrikler */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-white/10 backdrop-blur rounded-lg p-3">
            <div className="flex items-center gap-2 text-white/80 text-xs mb-1">
              <Sun className="h-3 w-3" />
              Panel Verimi
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-white">{stats.avgEfficiency}%</span>
              {stats.avgEfficiency >= 70 ? (
                <TrendingUp className="h-4 w-4 text-green-300" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-300" />
              )}
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur rounded-lg p-3">
            <div className="flex items-center gap-2 text-white/80 text-xs mb-1">
              <Thermometer className="h-3 w-3" />
              Ortalama Sıcaklık
            </div>
            <div className="text-2xl font-bold text-white">{stats.avgTemp}°C</div>
          </div>

          <div className="bg-white/10 backdrop-blur rounded-lg p-3">
            <div className="flex items-center gap-2 text-white/80 text-xs mb-1">
              <Wind className="h-3 w-3" />
              Rüzgar
            </div>
            <div className="text-2xl font-bold text-white">{stats.avgWindSpeed} <span className="text-sm">km/h</span></div>
          </div>

          <div className="bg-white/10 backdrop-blur rounded-lg p-3">
            <div className="flex items-center gap-2 text-white/80 text-xs mb-1">
              <Activity className="h-3 w-3" />
              Tahmini Kayıp
            </div>
            <div className="text-2xl font-bold text-white">
              {formatNumber(stats.estimatedLoss, 0)} <span className="text-sm">kW</span>
            </div>
          </div>
        </div>
      </div>

      <CardContent className="p-4">
        {/* Durum Özeti */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="text-center p-2 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{stats.optimalCount}</div>
            <div className="text-xs text-green-700">Optimal Verim</div>
            <div className="text-xs text-gray-500 mt-0.5">≥80%</div>
          </div>
          <div className="text-center p-2 bg-yellow-50 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">
              {sahalar.length - stats.optimalCount - stats.lowEfficiencyCount}
            </div>
            <div className="text-xs text-yellow-700">Orta Verim</div>
            <div className="text-xs text-gray-500 mt-0.5">50-79%</div>
          </div>
          <div className="text-center p-2 bg-red-50 rounded-lg">
            <div className="text-2xl font-bold text-red-600">{stats.lowEfficiencyCount}</div>
            <div className="text-xs text-red-700">Düşük Verim</div>
            <div className="text-xs text-gray-500 mt-0.5">&lt;50%</div>
          </div>
        </div>

        {/* Saha Detayları */}
        <div className="space-y-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Saha Durumları</span>
            <div className="flex gap-1">
              <button 
                onClick={() => setSelectedMetric('efficiency')}
                className={`px-2 py-1 text-xs rounded ${
                  selectedMetric === 'efficiency' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                }`}
              >
                Verim
              </button>
              <button 
                onClick={() => setSelectedMetric('temperature')}
                className={`px-2 py-1 text-xs rounded ${
                  selectedMetric === 'temperature' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                }`}
              >
                Sıcaklık
              </button>
              <button 
                onClick={() => setSelectedMetric('alerts')}
                className={`px-2 py-1 text-xs rounded ${
                  selectedMetric === 'alerts' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                }`}
              >
                Uyarı
              </button>
            </div>
          </div>

          {topSites.map((site, i) => (
            <div key={site.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="text-lg">{site.icon}</div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <MapPin className="h-3 w-3 text-gray-400" />
                  <span className="text-sm font-medium text-gray-900">{site.ad}</span>
                </div>
                <div className="text-xs text-gray-600 mt-0.5">
                  {site.description} • {site.temperature}°C
                </div>
              </div>
              <div className="text-right">
                <div className={`text-sm font-bold ${
                  site.efficiency >= 70 ? 'text-green-600' : 
                  site.efficiency >= 40 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {site.efficiency}%
                </div>
                {site.alerts > 0 && (
                  <div className="text-xs text-red-600 flex items-center gap-1 justify-end">
                    <AlertTriangle className="h-3 w-3" />
                    {site.alerts}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Alt Bilgi */}
        <div className="mt-4 pt-3 border-t flex items-center justify-between text-xs text-gray-500">
          <span>Son güncelleme: {new Date().toLocaleTimeString('tr-TR')}</span>
          <span className="flex items-center gap-1">
            <Activity className="h-3 w-3" />
            {sahalar.length} saha izleniyor
          </span>
        </div>
      </CardContent>
    </Card>
  );
};
