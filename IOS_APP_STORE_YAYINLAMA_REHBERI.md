# 📱 iOS App Store Yayınlama Rehberi - Solarveyo

## ✅ Ön Hazırlık Kontrol Listesi

### 1. 🍎 Apple Developer Program
- [ ] **Apple Developer hesabı** (99$/yıl)
  - https://developer.apple.com/programs/
  - Şirket hesabı veya bireysel hesap seçimi
  - Ödeme bilgileri tamamlandı mı?

### 2. 📋 Yasal Gereksinimler
- [ ] **KVKK Gizlilik Politikası** URL'i hazır
- [ ] **Kullanım Koşulları** URL'i hazır
- [ ] **Destek sayfası** URL'i hazır
- [ ] **İletişim bilgileri** (email, telefon)

### 3. 🎨 Görsel Materyaller

#### App Store Ekran Görüntüleri (Gerekli)
```bash
iPhone 6.7" (iPhone 14 Pro Max, 15 Plus)
- 1290 x 2796 px (3-10 adet)

iPhone 6.5" (iPhone 11 Pro Max, XS Max)
- 1284 x 2778 px (3-10 adet)

iPad Pro 12.9" (3. nesil)
- 2048 x 2732 px (3-10 adet)
```

#### Uygulama İkonu
- [✅] 1024x1024 px PNG (alpha channel yok)
- [✅] Mevcut: `/ios/App/App/Assets.xcassets/AppIcon.appiconset/`

#### İsteğe Bağlı
- [ ] **App Preview Video** (15-30 saniye, .mov formatı)
- [ ] **Tanıtım metni** (170 karakter)

---

## 🔧 Teknik Hazırlık

### 1. Bundle ID ve Versiyon Kontrolü

#### Bundle ID Belirleme
```bash
# Önerilen format
com.solarveyo.operasyon
# veya
com.[sirketadi].solarveyo
```

**Düzenlenecek dosyalar:**
```typescript
// capacitor.config.ts
{
  appId: 'com.solarveyo.operasyon', // ✅ Bundle ID
  appName: 'Solarveyo',
  bundledWebRuntime: false
}
```

```json
// package.json
{
  "name": "solarveyo-operasyon",
  "version": "1.0.0", // ✅ App versiyonu
}
```

**Xcode'de kontrol:**
1. `App.xcworkspace` aç
2. **TARGETS > App > General**
3. **Bundle Identifier**: `com.solarveyo.operasyon`
4. **Version**: `1.0.0`
5. **Build**: `1`

### 2. Firebase Push Notification Sertifikaları

#### APNs Auth Key Oluşturma
```bash
1. Apple Developer Console → Certificates, Identifiers & Profiles
2. Keys → + (Yeni Key)
3. Key Name: "Solarveyo APNs Auth Key"
4. Apple Push Notifications service (APNs) ✅
5. İndir (.p8 dosyası)
6. Key ID'yi kaydet
```

#### Firebase'e APNs Key Yükleme
```bash
1. Firebase Console → Project Settings
2. Cloud Messaging sekmesi
3. iOS app configuration
4. APNs Authentication Key → Upload
5. Key ID, Team ID, .p8 dosyası yükle
```

### 3. Capabilities (Yetenekler) Kontrolü

**Xcode'de:**
```
TARGETS > App > Signing & Capabilities
```

Gerekli yetenekler:
- [✅] **Push Notifications**
- [✅] **Background Modes**
  - Remote notifications
  - Background fetch
- [ ] **Associated Domains** (Deep linking için - isteğe bağlı)
- [ ] **Sign in with Apple** (eğer kullanılıyorsa ZORUNLU)

### 4. Info.plist Ayarları

```xml
<!-- /ios/App/App/Info.plist -->

<!-- Konum izni (eğer kullanılıyorsa) -->
<key>NSLocationWhenInUseUsageDescription</key>
<string>Saha konumlarını haritada göstermek için konum izni gereklidir.</string>

<!-- Kamera izni (fotoğraf yükleme için) -->
<key>NSCameraUsageDescription</key>
<string>Arıza fotoğrafı çekmek için kamera izni gereklidir.</string>

<!-- Fotoğraf kütüphanesi -->
<key>NSPhotoLibraryUsageDescription</key>
<string>Arıza fotoğrafı yüklemek için fotoğraf kütüphanesi izni gereklidir.</string>

<!-- Push Notifications -->
<key>UIBackgroundModes</key>
<array>
    <string>remote-notification</string>
</array>
```

---

## 🏗️ Build ve Archive

### 1. Proje Güncellemeleri

```bash
cd /Users/tolgakececi/Desktop/operasyon-solarveyo

# 1. Bağımlılıkları güncelle
npm install

# 2. Production build
npm run build

# 3. Capacitor sync
npx cap sync ios

# 4. Xcode'u aç
npx cap open ios
```

### 2. Xcode Build Ayarları

**Signing & Capabilities:**
```
1. Automatically manage signing ✅
2. Team: [Apple Developer Team seçin]
3. Signing Certificate: Apple Distribution
4. Provisioning Profile: Automatic
```

**Build Configuration:**
```
1. Toolbar → Scheme: App
2. Device: Any iOS Device (arm64)
3. Build Configuration: Release
```

### 3. Archive Oluşturma

```bash
# Xcode'de:
1. Product → Scheme → Edit Scheme
2. Archive → Build Configuration → Release
3. Product → Archive

# Archive tamamlandıktan sonra:
4. Window → Organizer
5. Archives sekmesi
6. Son archive'ı seç
7. "Distribute App" butonuna tıkla
```

### 4. App Store Upload

**Distribute seçenekleri:**
```
1. App Store Connect ✅ seç
2. Upload ✅ seç
3. Next
4. Distribution certificate ve provisioning profile seç
5. Upload
```

**Alternatif - Xcode Command Line:**
```bash
# Archive export (optional)
xcodebuild -exportArchive \
  -archivePath App.xcarchive \
  -exportPath ./build \
  -exportOptionsPlist exportOptions.plist
```

---

## 🌐 App Store Connect Ayarları

### 1. App Oluşturma

```bash
https://appstoreconnect.apple.com

1. My Apps → + → New App
2. Platform: iOS ✅
3. Name: Solarveyo Operasyon
4. Primary Language: Turkish
5. Bundle ID: com.solarveyo.operasyon
6. SKU: SOLARVEYO-OPS-001
7. User Access: Full Access
```

### 2. App Bilgileri

#### Genel Bilgiler
```
Name: Solarveyo Operasyon Yönetimi
Subtitle: GES Arıza ve Bakım Takip Sistemi (30 karakter)
Category: 
  Primary: Business
  Secondary: Utilities
```

#### Açıklama (4000 karakter)
```
🌞 Solarveyo - Güneş Enerji Santrali Operasyon Yönetimi

Güneş Enerji Santralleri (GES) için profesyonel arıza takip, bakım yönetimi ve operasyonel izleme platformu.

📊 ÖZELLİKLER

✅ Arıza Yönetimi
• Real-time arıza bildirimi ve takibi
• Fotoğraflı arıza kaydı
• Öncelik seviyesi yönetimi
• Arıza geçmişi ve raporları

🔧 Bakım Yönetimi
• Periyodik bakım takvimleri
• Mekanik ve elektrik bakım kayıtları
• Bakım ekibi ataması
• PDF rapor çıktıları

⚡ GES İzleme
• Santral performans takibi
• Üretim verileri analizi
• Inverter monitoring
• String bazlı izleme

👥 Ekip Yönetimi
• Çoklu kullanıcı rolleri
• Tekniker ve mühendis atamaları
• İzin ve yetki yönetimi

📍 Saha Yönetimi
• Harita üzerinde saha konumları
• Saha bazlı raporlama
• Müşteri atama sistemi

📦 Stok Kontrol
• Malzeme takibi
• Stok hareketleri
• Düşük stok uyarıları

🔔 Anlık Bildirimler
• Push notification desteği
• Arıza ve bakım bildirimleri
• Vardiya bilgilendirmeleri

🎯 KİMLER İÇİN?
• GES işletme firmaları
• Enerji şirketleri
• Bakım ekipleri
• Santral yöneticileri

💼 ROLLER
• Yönetici: Tam yetki
• Mühendis: Teknik işlemler
• Tekniker: Saha operasyonları
• Müşteri: İzleme ve raporlar
• Bekçi: Vardiya bildirimleri

🔒 GÜVENLİK
• Firebase Authentication
• Rol bazlı erişim kontrolü
• Veri şifreleme
• KVKK uyumlu

📈 RAPORLAMA
• PDF ve Excel export
• Detaylı analitik
• Performans grafikleri
• Özelleştirilebilir raporlar

🌍 ÇOK PLATFORMLU
• iOS ve Web desteği
• Responsive tasarım
• Offline çalışma desteği

İletişim: info@solarveyo.com
Destek: support@solarveyo.com
```

#### Anahtar Kelimeler (100 karakter, virgülle ayrılmış)
```
ges,güneş enerjisi,arıza takip,bakım,santral,enerji,operasyon,scada,monitoring
```

#### Destek URL
```
https://solarveyo.com/support
# veya
https://app.solarveyo.com/help
```

#### Marketing URL (isteğe bağlı)
```
https://solarveyo.com
```

#### Gizlilik Politikası URL (ZORUNLU)
```
https://solarveyo.com/privacy-policy
```

### 3. Fiyatlandırma ve Erişilebilirlik

```
Price: Free (Ücretsiz)
# veya
Price: Paid - In-App Purchases

Availability: 
- [✅] Turkey
- [ ] All countries (isteğe bağlı)

In-App Purchases (Abonelik varsa):
1. Product ID: com.solarveyo.starter
   Name: Starter Plan
   Price: ₺999/month

2. Product ID: com.solarveyo.professional
   Name: Professional Plan
   Price: ₺2499/month
```

### 4. App Store Review Bilgileri

```
Demo Account (Test için):
Username: demo@solarveyo.com
Password: Demo123456!

Notes for Review:
"Bu uygulama güneş enerjisi santralleri için operasyonel yönetim platformudur.
Test için demo hesap bilgileri sağlanmıştır.

Temel özellikler:
- Arıza kayıt ve takip sistemi
- Bakım yönetimi
- GES izleme
- Ekip yönetimi

Uygulama şirket içi kullanım için tasarlanmıştır ve
halihazırda aktif müşterilerimiz tarafından kullanılmaktadır."

Contact:
Name: [İsminiz]
Phone: +90 XXX XXX XX XX
Email: support@solarveyo.com
```

---

## 📱 TestFlight Test Süreci

### 1. Internal Testing (İç Test)

```bash
1. App Store Connect → TestFlight
2. Internal Testing Group oluştur
3. Test kullanıcıları ekle (email ile)
4. Build otomatik dağıtılır
5. Testerlar TestFlight uygulamasından yükler
```

### 2. External Testing (Dış Test)

```bash
1. TestFlight → External Testing
2. Test grubu oluştur
3. Build seç ve Apple review'a gönder
4. Review onayından sonra (1-2 gün)
5. Test kullanıcılarına link gönder
```

**Test için public link:**
```
https://testflight.apple.com/join/XXXXXX
```

---

## 🚀 App Store Review ve Yayınlama

### 1. Submit for Review

```bash
App Store Connect:
1. Version → App Store sekmesi
2. Tüm metadata tamamlandı mı? ✅
3. Ekran görüntüleri yüklendi mi? ✅
4. Build seçildi mi? ✅
5. "Submit for Review" butonu
```

### 2. Review Süresi

```
Ortalama süre: 24-48 saat
Maximum: 7 gün

Status takibi:
- Waiting for Review
- In Review
- Pending Developer Release
- Ready for Sale
```

### 3. Yaygın Red Nedenleri ve Çözümleri

#### ❌ 2.1 - App Completeness
**Sorun:** Uygulama çöküyor veya çalışmıyor
**Çözüm:** 
- TestFlight'ta kapsamlı test
- Crash-free rate > 99.5%
- Demo hesap çalışıyor olmalı

#### ❌ 4.2 - Minimum Functionality
**Sorun:** Uygulama çok basit
**Çözüm:**
- Web view'dan fazlası sunun
- Native özellikler ekleyin
- Değer katın

#### ❌ 5.1.1 - Privacy
**Sorun:** Gizlilik politikası eksik/yetersiz
**Çözüm:**
- KVKK uyumlu politika
- Veri kullanım açıklaması
- İzin metinleri (Info.plist)

#### ❌ 2.3.10 - Accurate Metadata
**Sorun:** Ekran görüntüleri gerçeği yansıtmıyor
**Çözüm:**
- Güncel ekran görüntüleri
- Gerçek veriler
- Yanıltıcı olmayan içerik

---

## 📋 Yayınlama Öncesi Checklist

### Teknik
- [ ] Bundle ID doğru
- [ ] Version ve Build number set
- [ ] Firebase APNs sertifikaları yüklendi
- [ ] Push notification test edildi
- [ ] All capabilities eklendi
- [ ] Info.plist izinleri tamamlandı
- [ ] Release build test edildi
- [ ] Crash analytics entegre (PostHog/Firebase)
- [ ] Deep linking test edildi (varsa)
- [ ] TestFlight'ta beta test tamamlandı

### İçerik
- [ ] App icon 1024x1024
- [ ] Ekran görüntüleri (3+ adet, her boyut)
- [ ] App Store açıklama
- [ ] Anahtar kelimeler
- [ ] Gizlilik politikası URL
- [ ] Destek URL
- [ ] Demo account bilgileri

### Yasal
- [ ] Apple Developer üyeliği aktif
- [ ] KVKK/GDPR uyumu
- [ ] Kullanım koşulları
- [ ] Telif hakları temiz
- [ ] Marka kullanım izinleri

### İş
- [ ] Pazarlama materyalleri hazır
- [ ] Sosyal medya duyuruları planlandı
- [ ] Müşteri bilgilendirmesi yapıldı
- [ ] Destek ekibi eğitildi

---

## 🔄 Güncelleme Süreci

### Version Bump
```bash
# package.json
"version": "1.0.1"  # Bug fix
"version": "1.1.0"  # New features
"version": "2.0.0"  # Breaking changes

# Xcode → General
Version: 1.0.1
Build: 2 (her submit'te artır)
```

### Güncelleme Notu (What's New)
```
Versiyon 1.0.1 - Bug Fixes

Bu güncellemede:
✅ Bildirim sistemi iyileştirmeleri
✅ Arıza fotoğraf yükleme hata düzeltmesi
✅ Performans optimizasyonları
🐛 Küçük hata düzeltmeleri
```

---

## 🆘 Sorun Giderme

### Build Hataları

#### Signing Error
```bash
Çözüm:
1. Xcode → Preferences → Accounts
2. Download Manual Profiles
3. Clean Build Folder (Cmd+Shift+K)
4. Rebuild
```

#### Missing Provisioning Profile
```bash
Çözüm:
1. Apple Developer → Certificates
2. Yeni provisioning profile oluştur
3. Xcode'da refresh
```

#### Firebase Issues
```bash
Çözüm:
1. GoogleService-Info.plist güncel mi?
2. Bundle ID eşleşiyor mu?
3. Firebase Console'da iOS app kayıtlı mı?
```

### Upload Hataları

#### Missing Compliance
```bash
App Store Connect → My Apps → App Information
Export Compliance Information → No (şifreleme kullanmıyorsanız)
```

#### Invalid Binary
```bash
Çözüm:
1. Validate App (Xcode Organizer)
2. Hata mesajını oku
3. Düzelt ve yeniden archive
```

---

## 📞 İletişim ve Destek

### Apple Developer Support
- https://developer.apple.com/contact/
- Phone: 1-800-633-2152

### Capacitor Documentation
- https://capacitorjs.com/docs/ios

### Firebase iOS Setup
- https://firebase.google.com/docs/ios/setup

---

## 📈 Launch Sonrası

### 1. Analytics Takibi
```typescript
// PostHog events
posthog.capture('app_launched');
posthog.capture('feature_used', {
  feature: 'ariza_olustur'
});
```

### 2. Crash Monitoring
```bash
Firebase Crashlytics kontrol et
PostHog session recordings
```

### 3. User Feedback
```bash
App Store reviews cevapla
In-app feedback topla
```

### 4. Performance Monitoring
```bash
- Crash-free rate > 99%
- App launch time < 2s
- API response times
- Memory usage
```

---

## ✅ Özet Adımlar

1. ✅ **Apple Developer hesabı** (99$/yıl)
2. ✅ **Bundle ID belirle** ve ayarla
3. ✅ **Firebase APNs** sertifikaları
4. ✅ **Xcode signing** ayarları
5. ✅ **Info.plist** izinleri
6. ✅ **Production build** ve sync
7. ✅ **Archive** oluştur
8. ✅ **App Store Connect** ayarları
9. ✅ **Ekran görüntüleri** ve metinler
10. ✅ **TestFlight** beta test
11. ✅ **Submit for Review**
12. ✅ **Yayınlama** 🎉

---

**Son Güncelleme:** Ekim 2025
**Proje:** Solarveyo Operasyon Yönetimi
**Platform:** iOS 14.0+

İyi şanslar! 🚀

