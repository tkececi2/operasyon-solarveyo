# 🗺️ Google Maps API Setup Guide

## 1. API Key Oluşturma

### Adımlar:
1. Google Cloud Console > APIs & Services > Credentials
2. "+ Create credentials" > "API Key"
3. API Key'i kopyala ve güvenli yerde sakla

## 2. Gerekli API'leri Etkinleştir

Aşağıdaki API'leri etkinleştirmeniz gerekiyor:

### 🔧 Etkinleştirilmesi Gereken API'ler:
- **Maps JavaScript API** (Harita gösterimi için)
- **Geocoding API** (Adres arama için)
- **Maps Static API** (Statik harita görselleri için)
- **Maps Embed API** (Gömülü harita için)

### 🔗 Hızlı Linkler:
- Maps JavaScript API: https://console.cloud.google.com/apis/library/maps-backend.googleapis.com
- Geocoding API: https://console.cloud.google.com/apis/library/geocoding-backend.googleapis.com
- Maps Static API: https://console.cloud.google.com/apis/library/static-maps-backend.googleapis.com

## 3. API Key Kısıtlamaları (Güvenlik)

### Önerilen Kısıtlamalar:
1. **Application restrictions**: HTTP referrers
   - localhost:*
   - yourdomain.com/*

2. **API restrictions**: Restrict key
   - Maps JavaScript API
   - Geocoding API
   - Maps Static API
   - Maps Embed API

## 4. Projeye Ekleme

### .env dosyası oluştur:
```env
VITE_GOOGLE_MAPS_API_KEY=your_actual_api_key_here
```

### Test etme:
```bash
npm run dev
```

## 5. Kullanım Örnekleri

### Saha Detay Sayfasında:
- ✅ Harita görüntüleme
- ✅ Koordinat kopyalama
- ✅ Yol tarifi alma
- ✅ Adres çözümleme

### Saha Ekleme Formunda:
- ✅ Adres'ten koordinat bulma
- ✅ Şehir seçimi
- ✅ Otomatik koordinat doldurma

## 6. Aylık Kullanım Limitleri

### Ücretsiz Kullanım:
- **Maps JavaScript API**: 28,000 istek/ay
- **Geocoding API**: 40,000 istek/ay
- **Maps Static API**: 28,000 istek/ay

### 💡 İpucu:
Küçük projeler için ücretsiz limitler yeterlidir!
