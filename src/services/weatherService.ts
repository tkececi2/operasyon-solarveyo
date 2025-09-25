/**
 * Open-Meteo Weather API Service
 * Tamamen ücretsiz, API key gerektirmez
 * https://open-meteo.com/
 */

interface WeatherData {
  temperature: number; // °C
  humidity: number; // %
  windSpeed: number; // km/h
  weatherCode: number; // WMO Weather interpretation codes
  description: string; // Türkçe açıklama
  icon: string; // Hava durumu ikonu
  pressure: number; // hPa
  cloudCover: number; // %
  uvIndex: number;
  visibility: number; // km
  precipitation: number; // mm
  timestamp: Date;
}

interface ForecastData {
  current: WeatherData;
  hourly: WeatherData[]; // 24 saatlik tahmin
  daily: {
    date: Date;
    tempMin: number;
    tempMax: number;
    weatherCode: number;
    description: string;
    icon: string;
    precipitation: number;
    windSpeed: number;
  }[]; // 7 günlük tahmin
}

// WMO Weather interpretation codes to Turkish descriptions
const weatherDescriptions: Record<number, { description: string; icon: string }> = {
  0: { description: 'Açık', icon: '☀️' },
  1: { description: 'Az Bulutlu', icon: '🌤️' },
  2: { description: 'Parçalı Bulutlu', icon: '⛅' },
  3: { description: 'Bulutlu', icon: '☁️' },
  45: { description: 'Sisli', icon: '🌫️' },
  48: { description: 'Kırağı Sis', icon: '🌫️' },
  51: { description: 'Hafif Çisenti', icon: '🌦️' },
  53: { description: 'Orta Çisenti', icon: '🌦️' },
  55: { description: 'Yoğun Çisenti', icon: '🌧️' },
  56: { description: 'Dondurucu Çisenti', icon: '🌨️' },
  57: { description: 'Yoğun Dondurucu Çisenti', icon: '🌨️' },
  61: { description: 'Hafif Yağmur', icon: '🌧️' },
  63: { description: 'Orta Yağmur', icon: '🌧️' },
  65: { description: 'Şiddetli Yağmur', icon: '🌧️' },
  66: { description: 'Dondurucu Yağmur', icon: '🌨️' },
  67: { description: 'Şiddetli Dondurucu Yağmur', icon: '🌨️' },
  71: { description: 'Hafif Kar', icon: '🌨️' },
  73: { description: 'Orta Kar', icon: '❄️' },
  75: { description: 'Yoğun Kar', icon: '❄️' },
  77: { description: 'Kar Taneleri', icon: '❄️' },
  80: { description: 'Hafif Sağanak', icon: '🌦️' },
  81: { description: 'Orta Sağanak', icon: '🌧️' },
  82: { description: 'Şiddetli Sağanak', icon: '⛈️' },
  85: { description: 'Hafif Kar Sağanağı', icon: '🌨️' },
  86: { description: 'Yoğun Kar Sağanağı', icon: '❄️' },
  95: { description: 'Gök Gürültülü Fırtına', icon: '⛈️' },
  96: { description: 'Hafif Dolu ile Fırtına', icon: '⛈️' },
  99: { description: 'Şiddetli Dolu ile Fırtına', icon: '⛈️' }
};

// Cache için basit bir store
const weatherCache = new Map<string, { data: ForecastData; timestamp: number }>();
const CACHE_DURATION = 10 * 60 * 1000; // 10 dakika

/**
 * Koordinatlara göre hava durumu bilgisini getirir
 * @param lat Enlem
 * @param lng Boylam
 * @param useCache Cache kullanılsın mı (varsayılan: true)
 */
export async function getWeatherData(
  lat: number, 
  lng: number, 
  useCache: boolean = true
): Promise<ForecastData> {
  const cacheKey = `${lat.toFixed(2)},${lng.toFixed(2)}`;
  
  // Cache kontrolü
  if (useCache && weatherCache.has(cacheKey)) {
    const cached = weatherCache.get(cacheKey)!;
    if (Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log('Hava durumu cache\'den alındı:', cacheKey);
      return cached.data;
    }
  }

  try {
    // Open-Meteo API URL
    const url = new URL('https://api.open-meteo.com/v1/forecast');
    
    // Parametreler
    url.searchParams.append('latitude', lat.toString());
    url.searchParams.append('longitude', lng.toString());
    url.searchParams.append('current', 'temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,pressure_msl,cloud_cover,uv_index,visibility,precipitation');
    url.searchParams.append('hourly', 'temperature_2m,weather_code,wind_speed_10m,precipitation_probability');
    url.searchParams.append('daily', 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max');
    url.searchParams.append('timezone', 'Europe/Istanbul');
    url.searchParams.append('forecast_days', '7');

    const response = await fetch(url.toString());
    
    if (!response.ok) {
      throw new Error(`Hava durumu servisi hatası: ${response.status}`);
    }

    const data = await response.json();

    // Veriyi işle ve formatla
    const forecast: ForecastData = {
      current: {
        temperature: Math.round(data.current.temperature_2m),
        humidity: data.current.relative_humidity_2m,
        windSpeed: Math.round(data.current.wind_speed_10m),
        weatherCode: data.current.weather_code,
        description: weatherDescriptions[data.current.weather_code]?.description || 'Bilinmiyor',
        icon: weatherDescriptions[data.current.weather_code]?.icon || '❓',
        pressure: Math.round(data.current.pressure_msl),
        cloudCover: data.current.cloud_cover,
        uvIndex: data.current.uv_index || 0,
        visibility: data.current.visibility ? data.current.visibility / 1000 : 10, // metre to km
        precipitation: data.current.precipitation || 0,
        timestamp: new Date(data.current.time)
      },
      hourly: data.hourly.time.slice(0, 24).map((time: string, i: number) => ({
        temperature: Math.round(data.hourly.temperature_2m[i]),
        humidity: 0, // Open-Meteo saatlik nem vermiyor
        windSpeed: Math.round(data.hourly.wind_speed_10m[i]),
        weatherCode: data.hourly.weather_code[i],
        description: weatherDescriptions[data.hourly.weather_code[i]]?.description || 'Bilinmiyor',
        icon: weatherDescriptions[data.hourly.weather_code[i]]?.icon || '❓',
        pressure: 0,
        cloudCover: 0,
        uvIndex: 0,
        visibility: 10,
        precipitation: data.hourly.precipitation_probability[i] || 0,
        timestamp: new Date(time)
      })),
      daily: data.daily.time.map((time: string, i: number) => ({
        date: new Date(time),
        tempMin: Math.round(data.daily.temperature_2m_min[i]),
        tempMax: Math.round(data.daily.temperature_2m_max[i]),
        weatherCode: data.daily.weather_code[i],
        description: weatherDescriptions[data.daily.weather_code[i]]?.description || 'Bilinmiyor',
        icon: weatherDescriptions[data.daily.weather_code[i]]?.icon || '❓',
        precipitation: data.daily.precipitation_sum[i] || 0,
        windSpeed: Math.round(data.daily.wind_speed_10m_max[i])
      }))
    };

    // Cache'e kaydet
    weatherCache.set(cacheKey, {
      data: forecast,
      timestamp: Date.now()
    });

    console.log('Hava durumu API\'den alındı:', cacheKey);
    return forecast;

  } catch (error) {
    console.error('Hava durumu verisi alınamadı:', error);
    throw error;
  }
}

/**
 * Birden fazla lokasyon için hava durumu bilgilerini paralel olarak getirir
 * @param locations Lokasyon listesi
 */
export async function getMultipleWeatherData(
  locations: Array<{ id: string; lat: number; lng: number }>
): Promise<Map<string, ForecastData>> {
  const results = new Map<string, ForecastData>();
  
  // Paralel olarak tüm lokasyonlar için veri çek
  const promises = locations.map(async (loc) => {
    try {
      const data = await getWeatherData(loc.lat, loc.lng);
      results.set(loc.id, data);
    } catch (error) {
      console.error(`${loc.id} için hava durumu alınamadı:`, error);
    }
  });

  await Promise.all(promises);
  return results;
}

/**
 * Cache'i temizle
 */
export function clearWeatherCache(): void {
  weatherCache.clear();
  console.log('Hava durumu cache temizlendi');
}

/**
 * Hava durumuna göre panel üretimi etkisini hesapla
 * @param weather Hava durumu verisi
 * @returns Üretim etki yüzdesi (0-100)
 */
export function calculateWeatherImpact(weather: WeatherData): {
  efficiency: number;
  factors: {
    temperature: number;
    clouds: number;
    precipitation: number;
  };
} {
  // Sıcaklık etkisi (25°C optimal)
  let tempEfficiency = 100;
  const optimalTemp = 25;
  if (weather.temperature > optimalTemp) {
    // Her 1°C artış için %0.5 kayıp
    tempEfficiency = Math.max(70, 100 - (weather.temperature - optimalTemp) * 0.5);
  } else if (weather.temperature < 10) {
    // Düşük sıcaklıkta verim düşer
    tempEfficiency = Math.max(80, 100 - (10 - weather.temperature) * 2);
  }

  // Bulut etkisi
  const cloudEfficiency = Math.max(30, 100 - weather.cloudCover * 0.7);

  // Yağış etkisi
  let precipitationEfficiency = 100;
  if (weather.precipitation > 0) {
    if (weather.precipitation < 5) {
      precipitationEfficiency = 90; // Hafif yağmur panelleri temizler
    } else if (weather.precipitation < 20) {
      precipitationEfficiency = 70; // Orta yağmur
    } else {
      precipitationEfficiency = 50; // Yoğun yağmur
    }
  }

  // Kar durumu
  if ([71, 73, 75, 77, 85, 86].includes(weather.weatherCode)) {
    precipitationEfficiency = 20; // Kar panelleri kaplar
  }

  // Toplam etki
  const totalEfficiency = Math.round(
    (tempEfficiency * 0.3 + cloudEfficiency * 0.5 + precipitationEfficiency * 0.2)
  );

  return {
    efficiency: totalEfficiency,
    factors: {
      temperature: Math.round(tempEfficiency),
      clouds: Math.round(cloudEfficiency),
      precipitation: Math.round(precipitationEfficiency)
    }
  };
}

/**
 * Hava durumu uyarılarını kontrol et
 * @param weather Hava durumu verisi
 * @returns Uyarı mesajları
 */
export function getWeatherAlerts(weather: WeatherData): string[] {
  const alerts: string[] = [];

  // Yüksek sıcaklık uyarısı
  if (weather.temperature > 40) {
    alerts.push('⚠️ Aşırı sıcaklık! Panel verimliliği düşebilir.');
  }

  // Fırtına uyarısı
  if (weather.windSpeed > 50) {
    alerts.push('⚠️ Kuvvetli rüzgar! Panel hasarı riski var.');
  }

  // Dolu uyarısı
  if ([96, 99].includes(weather.weatherCode)) {
    alerts.push('🚨 Dolu uyarısı! Paneller risk altında.');
  }

  // Kar uyarısı
  if ([73, 75, 86].includes(weather.weatherCode)) {
    alerts.push('❄️ Yoğun kar! Paneller karla kaplanabilir.');
  }

  // UV uyarısı
  if (weather.uvIndex > 8) {
    alerts.push('☀️ Yüksek UV indeksi. Bakım personeli korunmalı.');
  }

  return alerts;
}
