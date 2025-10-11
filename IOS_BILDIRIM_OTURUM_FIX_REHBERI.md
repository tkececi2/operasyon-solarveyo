# 🔧 iOS Bildirim ve Oturum Sorunları - Çözüm Rehberi

## 🎯 Çözülen Sorunlar

### 1. Bildirim Yetkilendirme Hatası ✅
**Problem**: Müşteri rolündeki kullanıcı, kendi sahası dışındaki arızalar için bildirim alıyordu.

**Çözüm**: 
- FCM token'ların kullanıcı değişiminde Firestore'dan tamamen temizlenmesi
- Logout sırasında iOS Capacitor Preferences'tan push bilgilerinin silinmesi
- Rol bazlı güvenlik kontrolünün güçlendirilmesi

### 2. Oturum Devamlılığı Hatası ✅  
**Problem**: Kullanıcı logout yaptıktan sonra app tekrar açıldığında otomatik giriş oluyordu.

**Çözüm**:
- Firebase Auth persistence ayarının `browserSessionPersistence` olarak değiştirilmesi
- iOS auto-login için kaydedilen email/password'ın logout sırasında temizlenmesi
- **YENİ**: `user_logged_out` flag mekanizması ile logout kontrolü
- Kapsamlı Capacitor Preferences temizliği

### 3. Auto-Login Persistence Sorunu ✅ (YENİ FİX)
**Problem**: Logout sonrası app restart'ta auto-login hala çalışıyordu.

**Çözüm**:
- `user_logged_out` flag'i ile logout durumu kontrolü
- Auto-login öncesi flag kontrolü - logout yapılmışsa atla
- Login sırasında flag temizleme
- Credentials temizlendiğinde flag'i de temizle

---

## 🧪 Test Senaryoları

### Test 1: Bildirim İzolasyonu
1. **iOS uygulamasına YÖNETİCİ hesabıyla giriş yap**
2. **Web panelden A Sahası'nda arıza kaydet**
3. **Bildirimin iOS'ta geldiğini doğrula**
4. **iOS'tan YÖNETİCİ hesabından çıkış yap** ✅
5. **Aynı iOS uygulamasına MÜŞTERİ hesabıyla giriş yap**
6. **Web panelden B Sahası'nda arıza kaydet (müşterinin erişimi yok)**
7. **İOS'ta bildirim GELMEMESİ gerekir** ✅

### Test 2: Oturum Temizliği
1. **iOS uygulamasına herhangi bir hesapla giriş yap**
2. **Uygulamadan LOGOUT yap** ✅
3. **iOS uygulamasını tamamen kapat**
4. **iOS uygulamasını tekrar aç**
5. **LOGIN ekranının gelmesi gerekir (otomatik giriş olmamalı)** ✅

### Test 3: Token Temizliği
1. **iOS uygulamasına giriş yap**
2. **Web panelden bildirim test et - geldiğini doğrula**
3. **iOS'tan logout yap** 
4. **Başka hesapla giriş yap**
5. **Web panelden ilk hesaba özel bildirim gönder**
6. **İOS'ta eski hesabın bildiriminin GELMEMESİ gerekir** ✅

---

## 🔍 Debug Konsolu

iOS uygulamasında Safari Developer Console'da şu logları görebilirsin:

### Başarılı Logout Logları:
```
🔔 PushNotificationService: Kullanıcı çıkış yapıyor, tokenlar temizleniyor...
🗑️ Firestore FCM token temizleniyor...
✅ Firestore FCM token temizlendi
✅ iOS: FCM token Preferences'tan temizlendi
📱 iOS: Logout - Logout flag set edildi, tüm bilgiler temizlendi
🎉 Push notification logout temizliği tamamlandı
```

### Başarılı Auto-Login Engelleme Logları:
```
📱 iOS: Kaydedilmiş bilgiler kontrol ediliyor...
📱 iOS: Kullanıcı çıkış yapmış, otomatik giriş atlanıyor
```

### Başarılı Login Logları:
```
📱 iOS: Kullanıcı bilgileri kaydediliyor...
✅ Logout flag temizlendi
✅ Email kaydedildi
✅ Password kaydedildi
✅ UID kaydedildi
```

### Güvenlik Filtresi Logları:
```
🔒 Güvenlik kontrolü başlıyor (rol: musteri)...
🔒 Access denied: User not assigned to saha ABC123
🔒 Güvenlik filtresi sonrası: 5 -> 2
```

### Session Persistence Logları:
```
🔧 Firebase iOS modunda başlatıldı - Session persistence aktif
```

---

## ⚙️ Teknik Değişiklikler

### 1. pushNotificationService.ts
- `onUserLogout()` metoduna userId parametresi eklendi
- Firestore'dan FCM token temizliği eklendi
- iOS Preferences temizliği güçlendirildi

### 2. AuthContext.tsx  
- Logout sırasında kapsamlı Capacitor Preferences temizliği
- Auto-login credentials'larının temizlenmesi
- Force authentication state reset

### 3. firebase.ts
- iOS için `browserSessionPersistence` kullanımı
- Multi-persistence sisteminin kaldırılması

### 4. notificationService.ts
- `validateUserAccess()` güvenlik fonksiyonu eklendi
- Rol bazlı erişim kontrolünün güçlendirilmesi
- Real-time ve static sorgular için unified güvenlik

---

## 📱 iOS Test Komutları

```bash
# iOS build ve test
npm run build
npx cap copy ios
npx cap open ios

# Safari Developer Console ile debug
# iOS Simulator -> Safari -> Developer -> [Device] -> localhost
```

---

## 🚨 Potansiyel Sorunlar

1. **Firebase Functions Gecikme**: Server-side bildirim filtrelemesi 1-2 saniye gecikebilir
2. **Token Refresh**: Yeni giriş sonrası FCM token'ının güncellenmesi birkaç saniye sürebilir
3. **Cache Persistence**: Bazı bildirimler app cache'inde kalabilir - app restart gerekebilir

---

## ✅ Test Checklist

- [ ] Müşteri yanlış sahadan bildirim almıyor
- [ ] Logout sonrası otomatik giriş olmuyor  
- [ ] **YENİ**: Logout flag auto-login'i engelliyor
- [ ] FCM token'ları temizleniyor
- [ ] iOS Preferences tamamen temizleniyor
- [ ] Manuel login logout flag'ini temizliyor
- [ ] Credentials temizlendiğinde logout flag'i de gidiyor
- [ ] Güvenlik logları düzgün çalışıyor
- [ ] App performance etkilenmemiş

---

**Önemli**: Bu değişiklikler production'a deploy edildiğinde, mevcut kullanıcıların app'i yeniden başlatması gerekebilir.
