# 📱 iOS MULTI-DEVICE TEST ADIMLARI

## ✅ Git Push Tamamlandı!

Commit: `f51fcd1` - Multi-device FCM token sistemi

---

## 🚀 ŞİMDİ YAPILACAKLAR

### ADIM 1: Firebase Functions Deploy Et ⚡️

```bash
cd /Users/tolgakececi/Desktop/operasyon-solarveyo/functions

# Build (zaten yapıldı ama emin olmak için)
npm run build

# Deploy et
firebase deploy --only functions
```

**ÖNEMLI:** Functions deploy süresi 2-3 dakika. Bekle!

---

### ADIM 2: Xcode'dan iOS'a Run Et 📱

```bash
# iOS klasörüne git
cd /Users/tolgakececi/Desktop/operasyon-solarveyo/ios

# Xcode workspace'i aç
open App/App.xcworkspace
```

Xcode açıldıktan sonra:
1. ✅ iPhone cihazı seç (simülatör DEĞİL!)
2. ✅ Run (⌘R) tıkla
3. ✅ Uygulamanın açılmasını bekle

---

### ADIM 3: Test Senaryosu 🧪

#### Test 1: iOS Login ve Token Kontrolü
```
1. iOS'ta uygulamayı aç
2. Giriş yap (email/şifre)
3. Firebase Console'a git:
   https://console.firebase.google.com/project/yenisirket-2ec3b/firestore

4. Firestore > kullanicilar > {senin userId}
5. Kontrol et:
   ✅ devices objesi var mı?
   ✅ devices.ios_XXXXX içinde token var mı?
   ✅ platform: "ios" yazıyor mu?
   ✅ lastUsed timestamp güncel mi?
```

#### Test 2: Web'den Login (Aynı Hesap)
```
1. Chrome'da https://operasyon-solarveyo.web.app aç
2. AYNI HESAPLA giriş yap
3. Firebase Console'a git
4. Kontrol et:
   ✅ devices.ios_XXXXX hala VAR MI? (ÖNEMLİ!)
   ✅ devices.web_YYYYY eklendi mi?
   ✅ İki token da var mı?
```

#### Test 3: Bildirim Gönder
```
1. Web'den veya başka hesaptan test arızası oluştur
2. Kontrol et:
   ✅ iOS'a bildirim geldi mi?
   ✅ Web'e bildirim geldi mi?
   
3. Firebase Console > Functions > Logs:
   Arama: "cihaza FCM mesajı"
   ✅ "📤 2 cihaza FCM mesajı gönderiliyor..." görmeli
   ✅ "✅ FCM mesajı gönderildi: 2/2 cihaz" görmeli
```

#### Test 4: iOS Logout
```
1. iOS'tan çıkış yap (Logout)
2. Firebase Console'a git
3. Kontrol et:
   ✅ devices.ios_XXXXX silindi mi?
   ✅ devices.web_YYYYY hala VAR MI?

4. Test arızası oluştur
5. Kontrol et:
   ✅ iOS'a bildirim GELMEDİ mi? (logout yaptın!)
   ✅ Web'e bildirim GELDİ mi?
```

---

## 🔍 DEBUGGING

### Xcode Console'da Göreceğin Loglar:

**Login sırasında:**
```
🔔 PushNotificationService: Kullanıcı giriş yaptı
📱 iOS: FCM Token alınıyor (fresh)...
✅ iOS FCM Token alındı: fJKs9d0E9UAO...
💾 Token multi-device sistemine kaydediliyor (ios)...
🔄 Migration: Eski token formatı kontrol ediliyor...
✅ Token multi-device sistemine kaydedildi
   Platform: ios
   Token preview: fJKs9d0E9UAO...
   📱 Kullanıcının tüm cihazları artık bildirim alacak!
```

**Logout sırasında:**
```
🔔 PushNotificationService: Kullanıcı çıkış yapıyor...
🗑️ MULTI-DEVICE: Bu cihazın token'ı kaldırılıyor...
   Token preview: fJKs9d0E9UAO...
   Platform: ios
✅ Bu cihazın token'ı başarıyla kaldırıldı
   📱 Kullanıcının diğer cihazları hala bildirim alacak!
```

### Firebase Functions Logs:

```bash
# Terminal'de:
firebase functions:log --only sendPushOnNotificationCreate

# Göreceğin:
🔑 FCM Token kontrolü:
   hasDevices: true
   deviceCount: 2
   tokenCount: 2

📤 2 cihaza FCM mesajı gönderiliyor...
✅ FCM mesajı gönderildi: 2/2 cihaz
```

---

## ⚠️ SORUN ÇIKARSA

### Sorun 1: "No token" Hatası
```
Çözüm:
1. iOS'tan logout yap
2. Uygulamayı kapat (swipe up)
3. Yeniden aç ve login yap
4. Bildirim izni ver
```

### Sorun 2: Web'den Login Yapınca iOS Token Siliniyor
```
Çözüm:
1. Firebase Functions deploy edildi mi kontrol et:
   firebase functions:list
   
2. Deployed değilse:
   cd functions
   firebase deploy --only functions
```

### Sorun 3: Bildirim Gelmiyor
```
Kontrol Et:
1. Firebase Console > kullanicilar > devices objesi var mı?
2. iOS Settings > Solarveyo > Notifications AÇIK mı?
3. Functions logs'da hata var mı?
   firebase functions:log
```

---

## ✅ BAŞARI KRİTERLERİ

Sistem çalışıyor demek:

1. ✅ iOS login → devices.ios_XXXXX kaydedildi
2. ✅ Web login → devices.web_YYYYY eklendi, iOS korundu
3. ✅ Bildirim → Her iki cihaza geldi
4. ✅ iOS logout → Sadece iOS token silindi
5. ✅ Bildirim → Sadece Web'e geldi

---

## 🎯 ÖZET

```bash
# 1. Functions deploy
cd functions
firebase deploy --only functions

# 2. iOS Run
open ios/App/App.xcworkspace
# Xcode'da Run (⌘R)

# 3. Test et
- iOS login ✅
- Web login ✅
- Bildirim gönder ✅
- iOS logout ✅
- Bildirim tekrar gönder ✅
```

---

**Hazırsın! iOS'ta test et! 🚀**

**Sorun çıkarsa Xcode Console'u ve Firebase Functions logs'u kontrol et!**

