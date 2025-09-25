import React, { useState, useEffect } from 'react';
import { Cloud, Droplets, Wind, Sun, AlertTriangle } from 'lucide-react';
import { getWeatherData, calculateWeatherImpact } from '../../services/weatherService';

interface WeatherCardProps {
  lat: number;
  lng: number;
  sahaAd: string;
}

export const WeatherCard: React.FC<WeatherCardProps> = ({ lat, lng, sahaAd }) => {
  const [weather, setWeather] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const data = await getWeatherData(lat, lng);
        setWeather(data);
      } catch (err) {
        console.error('Hava durumu yüklenemedi:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
  }, [lat, lng]);

  if (loading || !weather) {
    return (
      <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm rounded-lg p-2 shadow-sm">
        <div className="animate-pulse flex items-center gap-2">
          <div className="w-8 h-8 bg-gray-200 rounded"></div>
          <div className="w-16 h-4 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  const impact = calculateWeatherImpact(weather.current);
  const hasAlert = weather.current.windSpeed > 50 || 
                   weather.current.temperature > 40 || 
                   [73, 75, 86, 96, 99].includes(weather.current.weatherCode);

  return (
    <div className="absolute top-2 right-2 bg-white/95 backdrop-blur-sm rounded-lg p-2 shadow-md max-w-[180px]">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xl">{weather.current.icon}</span>
        <span className="text-lg font-bold">{weather.current.temperature}°C</span>
        {hasAlert && <AlertTriangle className="h-4 w-4 text-yellow-500 animate-pulse" />}
      </div>
      
      <div className="text-xs text-gray-600 mb-1">{weather.current.description}</div>
      
      <div className="flex items-center gap-3 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <Wind className="h-3 w-3" />
          {weather.current.windSpeed}km/h
        </span>
        <span className="flex items-center gap-1">
          <Droplets className="h-3 w-3" />
          {weather.current.humidity}%
        </span>
      </div>

      <div className="mt-1 pt-1 border-t border-gray-200">
        <div className="flex items-center justify-between text-xs">
          <span className="flex items-center gap-1 text-gray-600">
            <Sun className="h-3 w-3" />
            Panel Verimi
          </span>
          <span className={`font-medium ${
            impact.efficiency > 70 ? 'text-green-600' : 
            impact.efficiency > 40 ? 'text-yellow-600' : 'text-red-600'
          }`}>
            {impact.efficiency}%
          </span>
        </div>
      </div>
    </div>
  );
};
