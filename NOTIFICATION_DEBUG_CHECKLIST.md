# 🔍 Push Notification Debug Checklist

## Durum:
- ✅ Uygulama içi bildirimler geliyor (in-app notifications)
- ❌ Üst ekran bildirimleri gelmiyor (push notifications)

---

## 🎯 ADIM ADIM DEBUG

### 1. Firebase Console - Notifications Koleksiyonu

📍 **Lokasyon**: https://console.firebase.google.com → yenisirket-2ec3b → Firestore Database → notifications

**Kontrol Et:**

#### A) En son oluşturulan bildirimi aç ve şu alanları kontrol et:

```
✅ Olması Gerekenler:
- companyId: "xxxxx" (var)
- userId: "user123" (KRİTİK! Bu olmalı)
- title: "🚨 KRİTİK ARIZA - xxx"
- message: "xxxxx sahasında..."
- type: "error" veya "warning" veya "info"
- createdAt: timestamp
- metadata: { faultId, sahaId, ... }

🔍 Push Durumu (Eklenir):
- pushSentAt: timestamp (✅ Varsa BAŞARILI)
- pushMessageId: "xxx" (FCM message ID)

VEYA

- pushTriedAt: timestamp (❌ Varsa HATA OLUŞTU)
- pushError: "no-token" veya başka hata mesajı
```

#### B) userId Kontrolü

**Senaryo 1: userId YOK** ❌
```
Problem: createScopedNotification fonksiyonu çalışmıyor
Neden: Firebase Functions deploy edilmemiş veya hata veriyor
```

**Senaryo 2: userId VAR ama pushSentAt YOK** ❌
```
Problem: sendPushOnNotificationCreate fonksiyonu çalışmıyor
Neden: 
  - FCM token yok (pushError: "no-token")
  - APNs sertifikası sorunu
  - Network hatası
```

**Senaryo 3: userId VAR ve pushSentAt VAR** ✅
```
Problem: iOS cihaz bildirimi göstermiyor
Neden:
  - iOS notification permissions kapalı
  - Uygulama foreground'da (banner görünmez)
  - Do Not Disturb aktif
```

---

### 2. Firebase Console - Functions Logs

📍 **Lokasyon**: Firebase Console → Functions

#### A) createScopedNotification Logları

1. "createScopedNotification" fonksiyonuna tıkla
2. "Logs" sekmesi
3. Son 1 saat içindeki logları kontrol et

**Aranacak Mesajlar:**
```
✅ Başarılı: "created: 5" (5 kullanıcıya bildirim oluşturuldu)
❌ Hata: "invalid-argument" (Parametre eksik)
❌ Hata: "internal" (Firebase hatası)
```

#### B) sendPushOnNotificationCreate Logları

1. "sendPushOnNotificationCreate" fonksiyonuna tıkla
2. "Logs" sekmesi
3. Son 1 saat içindeki logları kontrol et

**Aranacak Mesajlar:**
```
✅ Başarılı: Hiçbir log olmamalı (başarılıysa log yazılmıyor)
❌ Uyarı: "eksik alan" → userId veya title/message yok
❌ Uyarı: "kullanıcı bulunamadı" → userId yanlış
❌ Uyarı: "kullanıcı token yok" → FCM token alınmamış
❌ Hata: "sendPushOnNotificationCreate error" → FCM gönderim hatası
```

---

### 3. Firebase Console - Kullanıcı Token Kontrolü

📍 **Lokasyon**: Firestore Database → kullanicilar → {senin userId}

**Kontrol Et:**
```
✅ Olması Gereken:
- pushTokens: {
    fcm: "dXXXXXXX..." (Uzun token string)
  }
- pushNotificationsEnabled: true
- pushTokenUpdatedAt: timestamp
- platform: "ios"

❌ Token Yoksa:
Problem: iOS uygulaması token'ı Firestore'a kaydetmemiş
Çözüm: 
  1. iOS uygulamasından çıkış yap
  2. Uygulamayı kapat
  3. Yeniden aç ve giriş yap
  4. 5 saniye bekle
  5. Token kaydedildiğine dair alert gelecek
```

---

### 4. iOS Cihaz Ayarları

📍 **Lokasyon**: iOS Settings → Notifications → Solarveyo

**Kontrol Et:**
```
✅ Olması Gereken:
- Allow Notifications: ON
- Lock Screen: ON
- Notification Center: ON
- Banners: ON
- Banner Style: Temporary veya Persistent
- Sounds: ON

❌ Kapalıysa:
- Ayarları aç
- Uygulamayı kapat-aç
- Test et
```

---

## 🧪 TEST SENARYOLARI

### Test 1: Basit Push Testi
```
1. Firebase Console → Cloud Messaging
2. "Send test message" butonuna tıkla
3. FCM token'ı yapıştır (Firestore'dan al)
4. Title: "Test" / Body: "Test mesajı"
5. Gönder
6. iOS cihazda bildirim geldi mi?

✅ Geldiyse: iOS tarafı çalışıyor, sorun backend'de
❌ Gelmediyse: iOS/APNs konfigürasyonu sorunu
```

### Test 2: Arıza Bildirimi Testi
```
1. iOS uygulamasını kapat (tamamen kapat, arka planda bırakma)
2. Web'den yeni arıza oluştur (kritik öncelik)
3. 5 saniye bekle
4. iOS cihazda bildirim geldi mi?

✅ Geldiyse: Sistem çalışıyor!
❌ Gelmediyse: Yukarıdaki kontrolleri yap
```

### Test 3: Foreground vs Background
```
1. iOS uygulaması AÇIKKEN arıza oluştur
   → In-app bildirim gelir (üst banner gelmez, normal!)

2. iOS uygulamasını KAPATIP arıza oluştur
   → Üst banner bildirim gelmeli

Not: iOS, foreground'daki uygulamalara banner göstermez!
```

---

## 🔧 OLASI SORUNLAR VE ÇÖZÜMLER

### Sorun 1: userId Alanı Yok
```
Neden: createScopedNotification fonksiyonu çalışmıyor
Çözüm:
  1. Firebase Functions deploy edilmiş mi kontrol et
  2. Functions loglarına bak (hata var mı?)
  3. Gerekirse functions'ı yeniden deploy et:
     cd functions && npm run deploy
```

### Sorun 2: FCM Token Yok
```
Neden: iOS uygulaması token'ı kaydetmemiş
Çözüm:
  1. iOS uygulamasından çıkış yap
  2. Yeniden giriş yap
  3. Alert gelene kadar bekle
  4. Firestore'da token'ı kontrol et
```

### Sorun 3: pushError: "no-token"
```
Neden: Kullanıcıda FCM token yok
Çözüm: Yukarıdaki "FCM Token Yok" çözümünü uygula
```

### Sorun 4: pushError: "Unregistered"
```
Neden: Token geçersiz (eski token)
Çözüm:
  1. iOS'ta notification permission'ı kaldır
  2. Uygulamayı sil
  3. Yeniden yükle ve giriş yap
  4. Yeni token alınacak
```

### Sorun 5: Bildirim Geliyor Ama Banner Görünmüyor
```
Neden: Uygulama foreground'da
Çözüm: 
  - Uygulamayı tamamen kapat
  - Home screen'e git
  - Test et
  
Not: Foreground'da in-app notification gelir, banner gelmez!
```

---

## 📋 RAPOR FORMU

Lütfen aşağıdaki bilgileri kontrol et ve paylaş:

### Firebase Console - Notifications Koleksiyonu
- [ ] En son bildirimde `userId` alanı **var**
- [ ] En son bildirimde `pushSentAt` alanı **var**
- [ ] `pushError` alanı **yok**

### Firebase Console - Functions Logs
- [ ] `createScopedNotification` başarıyla çalıştı (created: X)
- [ ] `sendPushOnNotificationCreate` hata vermedi

### Firestore - Kullanıcı Dokümanı
- [ ] `pushTokens.fcm` alanı **var** ve dolu
- [ ] `pushNotificationsEnabled` = **true**

### iOS Ayarları
- [ ] Notifications **izni verilmiş**
- [ ] Banner **açık**

### Test Sonuçları
- [ ] Firebase test push **geldi**
- [ ] Uygulama **kapalıyken** arıza bildirimi **geldi**

---

**Kontrol sonrası hangi senaryoyla karşılaştığını paylaş, ona göre çözüm bulalım!**

