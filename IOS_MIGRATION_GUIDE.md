# 📱 Solarveyo iOS Uygulaması - Capacitor Dönüşüm Kılavuzu

## ✅ Tamamlanan İşlemler

### 1. ✅ Capacitor Kurulumu
- Capacitor Core, CLI ve iOS platform kuruldu
- Temel konfigürasyon dosyası oluşturuldu
- iOS native proje yapısı eklendi

### 2. ✅ Native Plugin Entegrasyonu
Aşağıdaki Capacitor pluginleri kuruldu:
- **@capacitor/camera**: Arıza fotoğrafları için
- **@capacitor/geolocation**: Saha konum doğrulama
- **@capacitor/push-notifications**: Bildirimler
- **@capacitor/filesystem**: Dosya yönetimi
- **@capacitor/share**: PDF paylaşımı
- **@capacitor/network**: Offline desteği
- **@capacitor/preferences**: Local storage
- **@capacitor/splash-screen**: Açılış ekranı
- **@capacitor/status-bar**: Status bar yönetimi
- **@capacitor/app**: App lifecycle
- **@capacitor/haptics**: Haptic feedback
- **@capacitor/device**: Device bilgileri

### 3. ✅ Platform Detection Utility
`src/utils/platform.ts` dosyası oluşturuldu:
- Native/Web platform ayrımı
- iOS/Android kontrolü
- Device info erişimi

### 4. ✅ Mobile Servisler
Aşağıdaki servisler oluşturuldu:
- **NotificationService** (`src/services/mobile/notificationService.ts`)
  - Push notification yönetimi
  - Token Firebase'e kaydetme
  - In-app notification gösterimi
  - Badge yönetimi

- **CameraService** (`src/services/mobile/cameraService.ts`)
  - Kamera erişimi ve fotoğraf çekimi
  - Galeri erişimi
  - Firebase Storage'a yükleme
  - Çoklu fotoğraf desteği

- **LocationService** (`src/services/mobile/locationService.ts`)
  - GPS konum alma
  - Konum takibi
  - Mesafe hesaplama
  - Yakınlık kontrolü

### 5. ✅ Firebase iOS Entegrasyonu
- GoogleService-Info.plist dosyası iOS projesine eklendi
- Firebase Web SDK kullanımı devam ediyor (Native SDK değil)

### 6. ✅ Authentication Hook Güncelleme
- Login sonrası push notification otomatik başlatma eklendi
- Platform kontrolü ile sadece mobile'da çalışacak şekilde ayarlandı

### 7. ✅ Build Scripts
Package.json'a iOS build scriptleri eklendi:
```bash
npm run build:ios    # Build ve sync
npm run open:ios     # Xcode'da aç
npm run run:ios      # iOS simulator'de çalıştır
npm run ios:dev      # Build, sync ve Xcode aç
```

### 8. ✅ Helper Utilities
- `src/utils/mobileHelpers.ts`: Platform bazlı yardımcı fonksiyonlar
- `src/styles/ios.css`: iOS özel stilleri

## 🚀 Kullanım

### iOS Uygulamasını Çalıştırma

1. **Build ve Sync:**
```bash
npm run build:ios
```

2. **Xcode'da Açma:**
```bash
npm run open:ios
```

3. **Simulator'de Test:**
- Xcode'da projeyi aç
- Target device seç (iPhone 14 Pro öneriliyor)
- ▶️ Run butonuna bas

### Platform Kontrolü Kullanımı

```typescript
import { platform } from '@/utils/platform';

// Component içinde
if (platform.isNative()) {
  // Native özellikler
  if (platform.isIOS()) {
    // iOS özel kod
  }
} else {
  // Web fallback
}
```

### Kamera Kullanımı

```typescript
import { MobileCameraService } from '@/services/mobile/cameraService';

// Fotoğraf çek
const photoUrl = await MobileCameraService.takePhoto('arizalar/2024');

// Galeriden seç
const galleryUrl = await MobileCameraService.selectFromGallery('arizalar/2024');

// Çoklu fotoğraf
const photos = await MobileCameraService.takeMultiplePhotos('arizalar/2024', 5);
```

### Konum Servisi Kullanımı

```typescript
import { MobileLocationService } from '@/services/mobile/locationService';

// Mevcut konum
const location = await MobileLocationService.getCurrentPosition();

// Yakınlık kontrolü
const isNear = await MobileLocationService.isNearLocation(
  targetLat, 
  targetLon, 
  0.1 // 100 metre
);
```

## 📋 Yapılacaklar Listesi

### Xcode Ayarları (Manuel)
- [ ] Team seçimi (Signing & Capabilities)
- [ ] Bundle Identifier doğrulama: `com.solarveyo.arizatakip`
- [ ] Deployment Target: iOS 13.0
- [ ] Device Orientation: Portrait only
- [ ] Status Bar Style: Light Content

### Info.plist İzinleri (Manuel)
`ios-permissions.plist` dosyasındaki içeriği `ios/App/App/Info.plist` dosyasına ekleyin:
- [ ] Kamera izinleri
- [ ] Konum izinleri
- [ ] Galeri izinleri
- [ ] Push notification ayarları
- [ ] Background modes

### App Store Hazırlıkları
- [ ] App Icon (1024x1024) hazırlama
- [ ] Launch Screen tasarımı
- [ ] Screenshots (6.5" ve 5.5")
- [ ] App Store description
- [ ] Privacy Policy URL
- [ ] Terms of Service URL

### Push Notification Setup
- [ ] Apple Developer Account'ta Push Notification capability
- [ ] Push Notification certificate oluşturma
- [ ] Firebase Cloud Messaging entegrasyonu

### Testing Checklist
- [ ] Login/Logout flow
- [ ] Firebase Auth çalışıyor mu?
- [ ] Firestore read/write
- [ ] Storage upload
- [ ] Kamera açılıyor mu?
- [ ] Konum alınabiliyor mu?
- [ ] Push notifications
- [ ] Offline mode
- [ ] Deep linking

## 🐛 Sorun Giderme

### Build Hataları
```bash
# Capacitor doctor
npx cap doctor

# Pod kurulumu (macOS)
cd ios/App && pod install

# Clean build
rm -rf ios/App/build
rm -rf ~/Library/Developer/Xcode/DerivedData
```

### Firebase Bağlantı Sorunları
1. GoogleService-Info.plist dosyasının doğru yerleştirildiğinden emin olun
2. Bundle ID'nin Firebase'deki ile aynı olduğunu kontrol edin
3. Firebase Console'da iOS app'in eklendiğinden emin olun

### Simulator Sorunları
1. Xcode → Preferences → Locations → Command Line Tools seçili olmalı
2. Simulator → Device → Erase All Content and Settings
3. Xcode'u yeniden başlatın

## 📱 Deployment

### TestFlight Beta Testing
1. Archive oluştur (Product → Archive)
2. App Store Connect'e yükle
3. TestFlight'ta test kullanıcıları ekle
4. Beta test linkini paylaş

### App Store Yayınlama
1. App Store Connect'te app bilgilerini doldur
2. Screenshots ve açıklamaları ekle
3. Build seç ve review'e gönder
4. Apple review sürecini bekle (2-7 gün)

## 🔧 Optimizasyon İpuçları

### Performans
- Lazy loading kullan
- Image optimization (WebP desteği)
- Bundle size < 50MB tut
- Firebase query limitleri

### Güvenlik
- SSL pinning ekle
- Jailbreak detection
- Code obfuscation
- Sensitive data encryption

### UX İyileştirmeleri
- Haptic feedback kullan
- Native transitions
- Pull to refresh (iOS)
- Swipe gestures

## 📞 Destek

Sorun yaşarsanız:
1. GitHub Issues açın
2. Discord kanalına yazın
3. tolga@solarveyo.com adresine mail atın

---

**Güncelleme Tarihi:** 27 Eylül 2025
**Versiyon:** 1.0.0
**Maintainer:** Tolga Keçeci
