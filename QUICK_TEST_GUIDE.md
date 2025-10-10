# 🧪 Hızlı Test Rehberi - Push Bildirimleri

## ✅ ÖN KONTROL

### 1. Firebase Functions Aktif mi?

Firebase Console'da kontrol edin:
```
https://console.firebase.google.com/project/yenisirket-2ec3b/functions
```

**Olması gereken fonksiyonlar:**
- ✅ `sendPushOnNotificationCreate` - Aktif
- ✅ `createScopedNotification` - Aktif

Eğer **yoksa veya pasifse**, önce deploy etmemiz gerekiyor.

### 2. Test Kullanıcıları Hazırlık

**En az 2 kullanıcı gerekli:**

#### Kullanıcı 1 (Kendiniz):
- Rol: **Yönetici** veya **Mühendis**
- İOS cihazda giriş yapmış
- Bildirim izni vermiş
- Token kaydedilmiş

#### Kullanıcı 2 (Test için):
- Rol: **Müşteri** veya **Bekçi**  
- **Belirli bir sahaya atanmış** (örn: "Saha A")
- İOS cihazda giriş yapmış
- Bildirim izni vermiş
- Token kaydedilmiş

---

## 🚀 TEST 1: Basit Arıza Bildirimi

### Adım 1: FCM Token Kontrolü

Her iki kullanıcı da şu sayfaya gitsin:
```
https://solarveyo.com/test/notifications
```

**Kontrol:**
- [ ] Token görünüyor mu? (ddFHW8_... ile başlayan uzun kod)
- [ ] "Token yükleniyor..." yazısı varsa sayfayı yenileyin

### Adım 2: Arıza Oluştur

1. **Web'den giriş yapın** (yönetici olarak)
2. **Arıza sayfasına gidin**: `/arizalar`
3. **"Yeni Arıza Kaydı Oluştur"** butonuna tıklayın
4. **Formu doldurun:**
   - Saha: Bir saha seçin (örn: "Saha A")
   - Santral: Bir santral seçin
   - Başlık: "Test Arızası - Push Bildirimi"
   - Açıklama: "Push bildirimi test ediliyor"
   - Öncelik: **KRİTİK** (daha hızlı fark edersiniz)
   - Durum: Açık
5. **Kaydet**

### Adım 3: Bekle ve Gözle!

**5-10 saniye içinde:**

✅ **Beklenen Sonuç:**
- Her iki iOS cihaza da push bildirimi gelecek
- Bildirim içeriği: "🚨 KRİTİK ARIZA - Test Arızası - Push Bildirimi"

📱 **Bildirim Nasıl Görünecek:**
```
🚨 KRİTİK ARIZA - Test Arızası
Saha A sahasında Santral X için kritik öncelikli arıza bildirildi.
```

### Adım 4: Debug

**Eğer bildirim gelmezse:**

#### A) Console'dan Firebase Functions Log Kontrol

```
https://console.firebase.google.com/project/yenisirket-2ec3b/functions/logs
```

**Arayacağınız mesajlar:**
```
✅ FCM mesajı başarıyla gönderildi!
📱 Gönderilen kullanıcılar: [...]
```

**Hata mesajları:**
```
❌ Firebase Functions hatası: ...
⚠️ Token eksik: ...
```

#### B) Firestore'dan Notification Kontrolü

```
https://console.firebase.google.com/project/yenisirket-2ec3b/firestore
```

**Kontrol edin:**
1. `notifications` koleksiyonu → Son kaydı açın
2. Şunları kontrol edin:
   - `title`: "🚨 KRİTİK ARIZA - Test Arızası" var mı?
   - `userId`: Kullanıcı ID'si doğru mu?
   - `sahaId`: Saha ID'si var mı?
   - `pushTriedAt`: Timestamp var mı? (Push denendi)
   - `pushDeliveredTo`: Array dolu mu? (Push başarılı)
   - `pushError`: Varsa hata mesajı

#### C) Kullanıcı Token Kontrolü

```
Firestore → kullanicilar → {userId}
```

**Kontrol:**
- `pushTokens.fcm`: Token var mı?
- `pushNotificationsEnabled`: true mu?
- `pushTokenUpdatedAt`: Son tarih yakın mı?

---

## 🧪 TEST 2: Saha İzolasyonu Testi

### Hazırlık:

**İki farklı sahaya iki farklı kullanıcı:**

- Kullanıcı A: "Saha 1"e atanmış (Bekçi/Müşteri)
- Kullanıcı B: "Saha 2"ye atanmış (Bekçi/Müşteri)

### Test:

1. **"Saha 1"de arıza oluşturun**
2. **Bekleyin 5-10 saniye**

**Beklenen Sonuç:**
- ✅ Kullanıcı A: Bildirim ALIR
- ❌ Kullanıcı B: Bildirim ALMAZ (farklı saha)

### Firebase Functions Log'da Göreceğiniz:

```
👤 Kullanıcı: kullaniciA@edeonenerji.com (bekci)
   - Atandığı sahalar: [saha1_id]
   - Hedef sahaId: saha1_id
   - Saha kontrolü: ✅ Atanmış
   - SONUÇ: ✅ Bildirim gönderilecek

👤 Kullanıcı: kullaniciB@edeonenerji.com (bekci)
   - Atandığı sahalar: [saha2_id]
   - Hedef sahaId: saha1_id
   - Saha kontrolü: ❌ Atanmamış
   - SONUÇ: ❌ Filtrelendi
```

---

## 🎯 TEST 3: Arıza Çözme Bildirimi

1. **Oluşturduğunuz test arızasını açın**
2. **Durumu "Çözüldü" yapın**
3. **Kaydedin**

**Beklenen Sonuç:**
```
✅ Arıza Çözüldü - Test Arızası
Test Arızası başlıklı arıza çözüldü.
```

---

## 🔧 Troubleshooting

### "Hiç bildirim gelmiyor"

#### 1. Token var mı?
- `/test/notifications` → Token görünüyor mu?

#### 2. Bildirim izni verilmiş mi?
- iOS Ayarlar → Solarveyo → Bildirimler → Aktif mi?

#### 3. Uygulamayı kapattınız mı?
- **Önemli**: Push bildirimleri **arka planda veya kapalı** iken gelir
- Uygulama açıksa foreground notification olur (farklı davranış)

#### 4. Firebase Functions çalışıyor mu?
- Functions Console → Son loglar var mı?

#### 5. Internet bağlantısı var mı?
- Her iki cihaz da online olmalı

---

## ✅ Başarı Kriterleri

Test başarılıysa:

- [x] Web'den arıza oluşturuldu
- [x] 5-10 saniye içinde mobil bildirim geldi
- [x] Bildirim içeriği doğru (başlık + mesaj)
- [x] Bildirime tıklayınca app açıldı
- [x] Arıza detay sayfası açıldı
- [x] Saha izolasyonu çalışıyor (sadece atanan sahalar)
- [x] Firebase Functions logları temiz

**Hepsi ✅ ise sistem mükemmel çalışıyor!** 🎉

---

## 📞 Hata Durumunda

Eğer sorun yaşarsanız, şu bilgileri toplayın:

1. Firebase Functions logs (son 10 satır)
2. Firestore notifications son kayıt (screenshot)
3. kullanicilar/{userId} dokümanı (pushTokens alanı)
4. iOS cihaz bildirim ayarları (screenshot)
5. Console.log çıktısı (browser)

Bu bilgilerle sorunu çözebiliriz!

