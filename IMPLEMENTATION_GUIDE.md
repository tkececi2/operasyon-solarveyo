# 🚀 Multi-Device Token - Hızlı Uygulama Rehberi

## 📋 ÖNCELİK SIRASI

### 1️⃣ HEMEN YAPILACAKLAR (KRİTİK)
- [ ] `multiDeviceTokenService.ts` dosyası eklendi ✅
- [ ] `pushNotificationService.ts` güncelle (multi-device desteği)
- [ ] `AuthContext.tsx` güncelle (logout'ta token sil)
- [ ] `functions/src/index.ts` güncelle (multi-device token okuma)

### 2️⃣ TEST EDİLECEKLER
- [ ] iOS'tan login → Token kaydedildi mi?
- [ ] Web'den login → Her iki token da mevcut mu?
- [ ] iOS'tan logout → Sadece iOS token silindi mi?
- [ ] Bildirim gönder → Her iki cihaza gitti mi?

### 3️⃣ OPSİYONEL İYİLEŞTİRMELER
- [ ] Eski token'ları temizleme scheduler (Cloud Function)
- [ ] Kullanıcı profil sayfasına "Aktif Cihazlar" bölümü
- [ ] Admin paneline cihaz istatistikleri

---

## 🔧 KOD DEĞİŞİKLİKLERİ

### DOSYA 1: `src/services/pushNotificationService.ts`

**DEĞİŞTİR: saveTokenToFirestore() fonksiyonu**

```typescript
// ❌ ESKİ KOD (TEK TOKEN)
async saveTokenToFirestore(userId: string, userProfile?: any): Promise<boolean> {
  // ...
  await updateDoc(doc(db, 'kullanicilar', userId), {
    pushTokens: pushTokensUpdate,  // ← TEK TOKEN
    fcmToken: this.currentToken,
    pushNotificationsEnabled: true,
    tokenUpdatedAt: serverTimestamp()
  });
}

// ✅ YENİ KOD (MULTI-DEVICE)
import { registerDevice } from './multiDeviceTokenService';

async saveTokenToFirestore(userId: string, userProfile?: any): Promise<boolean> {
  if (!this.currentToken) {
    console.log('❌ Token bulunamadı');
    return false;
  }

  try {
    // Yeni multi-device servisi kullan
    const success = await registerDevice(userId, this.currentToken, true);
    
    if (success) {
      console.log('✅ Token multi-device sistemine kaydedildi');
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('❌ Token kaydetme hatası:', error);
    return false;
  }
}
```

---

### DOSYA 2: `src/contexts/AuthContext.tsx`

**EKLE: Logout sırasında token temizliği**

```typescript
import { unregisterDevice } from '../services/multiDeviceTokenService';
import { PushNotificationService } from '../services/pushNotificationService';

// Logout fonksiyonuna ekle
const logout = async () => {
  try {
    // 1. Mevcut token'ı al
    const pushService = PushNotificationService.getInstance();
    const currentToken = pushService.getCurrentToken();
    
    // 2. Token varsa Firestore'dan sil
    if (currentToken && currentUser) {
      console.log('🗑️ Logout: Cihaz token\'ı kaldırılıyor...');
      await unregisterDevice(currentUser.uid, currentToken);
    }
    
    // 3. Firebase logout
    await firebaseLogout(auth);
    
    console.log('✅ Logout başarılı');
  } catch (error) {
    console.error('❌ Logout hatası:', error);
  }
};
```

---

### DOSYA 3: `functions/src/index.ts`

**DEĞİŞTİR: Token okuma mantığı**

```typescript
// ❌ ESKİ KOD (TEK TOKEN)
const user = userDoc.data() as any;
const token: string | undefined = user?.pushTokens?.fcm || user?.fcmToken;

if (!token) {
  console.log('❌ Kullanıcının FCM token\'ı yok');
  return null;
}

// Tek token'a gönder
await admin.messaging().send({
  token: token,
  notification: { title, body }
});

// ✅ YENİ KOD (MULTI-DEVICE)
const user = userDoc.data() as any;
const devices = user?.devices || {};

// Tüm cihaz token'larını al
const tokens: string[] = Object.values(devices)
  .map((d: any) => d?.token)
  .filter(Boolean);

if (tokens.length === 0) {
  console.log('❌ Kullanıcının hiç cihazı yok');
  
  // Fallback: Eski format token varsa kullan
  const oldToken = user?.pushTokens?.fcm || user?.fcmToken;
  if (oldToken) {
    console.log('⚠️ Eski format token bulundu, kullanılıyor');
    tokens.push(oldToken);
  } else {
    return null;
  }
}

console.log(`📤 ${tokens.length} cihaza bildirim gönderiliyor`);

// Multi-device gönderim
const response = await admin.messaging().sendEachForMulticast({
  tokens: tokens,
  notification: { title, body: message },
  data: {
    type: String(type || "info"),
    companyId: String(companyId),
    userId: String(userId),
    screen: String(screen),
    notificationId: String(context.params.notificationId),
  },
  apns: {
    headers: { "apns-push-type": "alert", "apns-priority": "10" },
    payload: {
      aps: {
        sound: "default",
        badge: 1,
        alert: { title, body: message }
      }
    }
  }
});

console.log(`✅ Başarılı: ${response.successCount}/${tokens.length}`);
console.log(`❌ Başarısız: ${response.failureCount}/${tokens.length}`);

// Başarısız token'ları temizle
if (response.failureCount > 0) {
  const failedTokens: string[] = [];
  response.responses.forEach((resp, idx) => {
    if (!resp.success) {
      const errorCode = (resp.error as any)?.code;
      console.log(`❌ Token başarısız: ${tokens[idx].substring(0, 20)}... - Hata: ${errorCode}`);
      
      // Kalıcı hatalar (invalid token, unregistered)
      if (errorCode === 'messaging/invalid-registration-token' || 
          errorCode === 'messaging/registration-token-not-registered') {
        failedTokens.push(tokens[idx]);
      }
    }
  });
  
  // Başarısız token'ları sil (temizlik)
  if (failedTokens.length > 0) {
    console.log(`🧹 ${failedTokens.length} geçersiz token temizleniyor...`);
    
    for (const token of failedTokens) {
      // Token'ı bul ve sil
      const deviceKey = Object.keys(devices).find(key => devices[key].token === token);
      if (deviceKey) {
        await admin.firestore().collection('kullanicilar').doc(userId).update({
          [`devices.${deviceKey}`]: admin.firestore.FieldValue.delete()
        });
      }
    }
  }
}

// Bildirim durumunu güncelle
await snap.ref.update({ 
  pushTriedAt: admin.firestore.FieldValue.serverTimestamp(),
  pushSentToDevices: response.successCount,
  pushFailedDevices: response.failureCount
});
```

---

## 🧪 TEST SENARYOLARI

### Test 1: Çoklu Cihaz Login
```bash
1. iOS uygulamasından login yap
   → Firebase Console'da kontrol et: devices.ios_XXXXX var mı?

2. Aynı hesapla Chrome'dan login yap
   → Firebase Console'da kontrol et: 
     - devices.ios_XXXXX hala var mı? ✅
     - devices.web_YYYYY eklendi mi? ✅

3. Arıza bildirimi oluştur
   → Her iki cihaza da bildirim geldi mi? ✅
```

### Test 2: Logout Token Temizliği
```bash
1. iOS'tan logout yap
   → Firebase Console'da kontrol et: devices.ios_XXXXX silindi mi? ✅
   → Chrome token hala var mı? ✅

2. Chrome'a bildirim gönder
   → Sadece Chrome'a geldi mi? ✅
   → iOS'a gelmedi mi? ✅
```

### Test 3: Mobile Safari (iOS 16.4+)
```bash
1. Safari'de siteyi aç
   → "Add to Home Screen" yap
   → Bildirim izni iste
   → Token alındı mı? ✅

2. Firebase Console'da kontrol et
   → devices.mobile-web_ZZZZZ var mı? ✅

3. Toplam 3 cihaz olmalı:
   - devices.ios_XXXXX (Native app)
   - devices.web_YYYYY (Chrome desktop)
   - devices.mobile-web_ZZZZZ (Safari mobile)
```

### Test 4: Eski Token Migration
```bash
1. Eski formattaki bir kullanıcı login yapsın
   → migrateOldTokenFormat() otomatik çalışır
   → Eski token (pushTokens.fcm) → Yeni format (devices.XXX) taşınır ✅

2. Firebase Console'da kontrol et:
   → devices.web_XXXXX.migrated = true olmalı ✅
```

---

## 📊 FİREBASE CONSOLE KONTROLÜ

### Kullanıcı Dokümanı Yapısı:

```json
kullanicilar/{userId} {
  "email": "ahmet@example.com",
  "ad": "Ahmet Yılmaz",
  "rol": "yonetici",
  "companyId": "company_ABC123",
  
  // ✅ YENİ FORMAT (Multi-device)
  "devices": {
    "ios_fJKs9d0E9UAO": {
      "token": "fJKs9d0E9UAOgHzCgNNJ...",
      "platform": "ios",
      "os": "iOS",
      "browser": "Safari",
      "lastUsed": Timestamp(2025-10-12 14:30:00),
      "addedAt": Timestamp(2025-10-11 09:15:00)
    },
    "web_dH7pLm3Q5Ks2": {
      "token": "dH7pLm3Q5Ks2nVbCxWqY...",
      "platform": "web",
      "os": "macOS",
      "browser": "Chrome",
      "lastUsed": Timestamp(2025-10-12 16:45:00),
      "addedAt": Timestamp(2025-10-12 08:00:00)
    }
  },
  
  // ⚠️ ESKİ FORMAT (Geriye dönük uyumluluk)
  "pushTokens": {
    "fcm": "son-giriş-yapan-token",  // ← Artık kullanılmıyor
    "platform": "web",
    "updatedAt": Timestamp(...)
  }
}
```

---

## ⏱️ ZAMAN PLANI

### Gün 1: Temel Implementasyon (2-3 saat)
- ✅ `multiDeviceTokenService.ts` ekle
- [ ] `pushNotificationService.ts` güncelle
- [ ] `AuthContext.tsx` güncelle
- [ ] Test et (iOS + Web)

### Gün 2: Functions Güncelleme (1-2 saat)
- [ ] `functions/src/index.ts` güncelle
- [ ] Deploy et: `firebase deploy --only functions`
- [ ] Test et: Multi-device bildirimler

### Gün 3: Temizlik ve İyileştirmeler (1 saat)
- [ ] Eski token migration script
- [ ] Scheduled function (30 günlük temizlik)
- [ ] Cihaz listesi UI (opsiyonel)

**TOPLAM SÜRE: ~5 saat**

---

## 🎯 BAŞARI KRİTERLERİ

✅ **Başarılı sayılır:**
1. Bir kullanıcı 3 farklı cihazdan login yapabilir
2. Her 3 cihaza da bildirim gider
3. Logout yapılan cihaza bildirim gitmez
4. Diğer cihazlara bildirim gitmeye devam eder

❌ **Başarısız sayılır:**
1. Son login yapan cihaz önceki token'ı siler
2. Logout sonrası token Firestore'da kalır
3. Geçersiz token'lara bildirim gönderilmeye çalışılır

---

## 📞 DESTEK

**Sorun yaşarsan:**
1. Firebase Console → Functions → Logs kontrol et
2. Browser Console → Network tab kontrol et
3. Xcode Console (iOS) kontrol et

**Debug komutları:**
```typescript
// Kullanıcının tüm cihazlarını göster
import { getUserDevices, getDeviceStats } from './services/multiDeviceTokenService';

const devices = await getUserDevices(userId);
console.log('Aktif cihazlar:', devices);

const stats = await getDeviceStats(userId);
console.log('İstatistikler:', stats);
```

---

**Son Güncelleme:** 12 Ekim 2025  
**Hazırlayan:** Cursor AI + Solarveyo Team  
**Durum:** Kod hazır, implementasyon bekliyor 🚀

