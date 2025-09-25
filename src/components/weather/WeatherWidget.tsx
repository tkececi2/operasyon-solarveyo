import React, { useState, useEffect } from 'react';
import { 
  Cloud, 
  Droplets, 
  Wind, 
  Thermometer,
  Eye,
  Gauge,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Sun
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, Badge, LoadingSpinner } from '../ui';
import { getWeatherData, calculateWeatherImpact, getWeatherAlerts } from '../../services/weatherService';
import type { ForecastData } from '../../services/weatherService';

interface WeatherWidgetProps {
  lat: number;
  lng: number;
  title?: string;
  showForecast?: boolean;
  showImpact?: boolean;
  compact?: boolean;
  className?: string;
}

export const WeatherWidget: React.FC<WeatherWidgetProps> = ({
  lat,
  lng,
  title = 'Hava Durumu',
  showForecast = true,
  showImpact = true,
  compact = false,
  className = ''
}) => {
  const [weather, setWeather] = useState<ForecastData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getWeatherData(lat, lng);
        setWeather(data);
      } catch (err) {
        console.error('Hava durumu yüklenemedi:', err);
        setError('Hava durumu bilgisi alınamadı');
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
    
    // Her 10 dakikada bir güncelle
    const interval = setInterval(fetchWeather, 10 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [lat, lng]);

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6 flex items-center justify-center">
          <LoadingSpinner />
        </CardContent>
      </Card>
    );
  }

  if (error || !weather) {
    return (
      <Card className={className}>
        <CardContent className="p-6 text-center text-gray-500">
          {error || 'Hava durumu yüklenemedi'}
        </CardContent>
      </Card>
    );
  }

  const impact = showImpact ? calculateWeatherImpact(weather.current) : null;
  const alerts = getWeatherAlerts(weather.current);

  if (compact) {
    // Kompakt görünüm - sadece temel bilgiler
    return (
      <div className={`flex items-center gap-3 p-3 bg-white rounded-lg border ${className}`}>
        <span className="text-2xl">{weather.current.icon}</span>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold">{weather.current.temperature}°C</span>
            <span className="text-sm text-gray-600">{weather.current.description}</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
            <span className="flex items-center gap-1">
              <Wind className="h-3 w-3" />
              {weather.current.windSpeed} km/h
            </span>
            <span className="flex items-center gap-1">
              <Droplets className="h-3 w-3" />
              {weather.current.humidity}%
            </span>
            {impact && (
              <span className={`flex items-center gap-1 font-medium ${
                impact.efficiency > 70 ? 'text-green-600' : 
                impact.efficiency > 40 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                <Sun className="h-3 w-3" />
                {impact.efficiency}% verim
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{title}</span>
          <span className="text-3xl">{weather.current.icon}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Uyarılar */}
        {alerts.length > 0 && (
          <div className="space-y-2">
            {alerts.map((alert, i) => (
              <div key={i} className="flex items-start gap-2 p-2 bg-yellow-50 text-yellow-800 rounded-lg text-sm">
                <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>{alert}</span>
              </div>
            ))}
          </div>
        )}

        {/* Mevcut Hava Durumu */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Thermometer className="h-5 w-5 text-gray-400" />
              <div>
                <div className="text-2xl font-bold">{weather.current.temperature}°C</div>
                <div className="text-sm text-gray-500">{weather.current.description}</div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Wind className="h-5 w-5 text-gray-400" />
              <div>
                <div className="font-semibold">{weather.current.windSpeed} km/h</div>
                <div className="text-sm text-gray-500">Rüzgar</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Droplets className="h-5 w-5 text-gray-400" />
              <div>
                <div className="font-semibold">{weather.current.humidity}%</div>
                <div className="text-sm text-gray-500">Nem</div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Cloud className="h-5 w-5 text-gray-400" />
              <div>
                <div className="font-semibold">{weather.current.cloudCover}%</div>
                <div className="text-sm text-gray-500">Bulut</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Gauge className="h-5 w-5 text-gray-400" />
              <div>
                <div className="font-semibold">{weather.current.pressure} hPa</div>
                <div className="text-sm text-gray-500">Basınç</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Eye className="h-5 w-5 text-gray-400" />
              <div>
                <div className="font-semibold">{weather.current.visibility} km</div>
                <div className="text-sm text-gray-500">Görüş</div>
              </div>
            </div>
          </div>
        </div>

        {/* Panel Üretim Etkisi */}
        {showImpact && impact && (
          <div className="pt-4 border-t">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-gray-900">Panel Üretim Etkisi</h4>
              <Badge variant={
                impact.efficiency > 70 ? 'success' : 
                impact.efficiency > 40 ? 'warning' : 'danger'
              }>
                {impact.efficiency}% Verimlilik
              </Badge>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Sıcaklık Etkisi</span>
                <span className={`font-medium ${
                  impact.factors.temperature > 80 ? 'text-green-600' : 
                  impact.factors.temperature > 60 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {impact.factors.temperature > 90 ? <TrendingUp className="h-4 w-4 inline" /> : <TrendingDown className="h-4 w-4 inline" />}
                  {' '}{impact.factors.temperature}%
                </span>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Bulut Etkisi</span>
                <span className={`font-medium ${
                  impact.factors.clouds > 80 ? 'text-green-600' : 
                  impact.factors.clouds > 60 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {impact.factors.clouds > 90 ? <TrendingUp className="h-4 w-4 inline" /> : <TrendingDown className="h-4 w-4 inline" />}
                  {' '}{impact.factors.clouds}%
                </span>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Yağış Etkisi</span>
                <span className={`font-medium ${
                  impact.factors.precipitation > 80 ? 'text-green-600' : 
                  impact.factors.precipitation > 60 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {impact.factors.precipitation > 90 ? <TrendingUp className="h-4 w-4 inline" /> : <TrendingDown className="h-4 w-4 inline" />}
                  {' '}{impact.factors.precipitation}%
                </span>
              </div>
            </div>
          </div>
        )}

        {/* 7 Günlük Tahmin */}
        {showForecast && (
          <div className="pt-4 border-t">
            <h4 className="font-medium text-gray-900 mb-3">7 Günlük Tahmin</h4>
            <div className="grid grid-cols-7 gap-2">
              {weather.daily.slice(0, 7).map((day, i) => (
                <div key={i} className="text-center space-y-1">
                  <div className="text-xs text-gray-500">
                    {i === 0 ? 'Bugün' : 
                     i === 1 ? 'Yarın' : 
                     day.date.toLocaleDateString('tr-TR', { weekday: 'short' })}
                  </div>
                  <div className="text-lg">{day.icon}</div>
                  <div className="text-xs font-medium">
                    {day.tempMax}°
                  </div>
                  <div className="text-xs text-gray-500">
                    {day.tempMin}°
                  </div>
                  {day.precipitation > 0 && (
                    <div className="text-xs text-blue-600">
                      {day.precipitation}mm
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
