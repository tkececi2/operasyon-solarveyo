# 🔔 BİLDİRİM SİSTEMİ KOMPLE REHBERİ

## 📋 İÇİNDEKİLER
1. [Sistem Mimarisi](#sistem-mimarisi)
2. [Saha Bazlı İzolasyon](#saha-bazlı-izolasyon)
3. [Platform Entegrasyonları](#platform-entegrasyonları)
4. [Kurulum Adımları](#kurulum-adımları)
5. [Test Senaryoları](#test-senaryoları)
6. [Sorun Giderme](#sorun-giderme)

---

## 🏗️ SİSTEM MİMARİSİ

### Bildirim Akışı

```
┌─────────────────────────────────────────────────────────────────┐
│                      İŞLEM YAPILDI                             │
│        (Arıza, Stok, Bakım, Vardiya, Kesinti vb.)              │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  Service Layer: createScopedNotificationClient()                │
│  - sahaId metadata'ya ekleniyor                                 │
│  - santralId metadata'ya ekleniyor                              │
│  - Hedef roller belirleniyor                                    │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  Firebase Functions: sendPushOnNotificationCreate()             │
│  1. Notifications collection'a doküman oluşturuluyor            │
│  2. companyId ile kullanıcılar sorgulanıyor                     │
│  3. SAHA BAZLI FİLTRELEME yapılıyor                            │
│  4. Her kullanıcıya FCM ile bildirim gönderiliyor              │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│              PLATFORMA GÖRE BİLDİRİM TESLİMATI                 │
│                                                                  │
│  iOS Native        Web Browser        Background                │
│  ────────────      ────────────        ──────────────           │
│  APNs (Apple)      Service Worker      Firebase FCM             │
│  Banner + Sound    Browser Notif       Silent Push              │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🎯 SAHA BAZLI İZOLASYON

### Nasıl Çalışır?

#### 1. **Bildirim Oluşturulurken**

```typescript
// Örnek: Arıza oluşturma
await notificationService.createScopedNotificationClient({
  companyId: 'company123',
  title: '🚨 KRİTİK ARIZA - Panel Arızası',
  message: 'A Sahasında panel arızası bildirild',
  type: 'error',
  metadata: {
    faultId: 'fault123',
    sahaId: 'saha_A',        // ✅ ÖNEMLİ: Saha ID'si
    santralId: 'santral_1'    // ✅ Santral ID'si
  },
  roles: ['yonetici', 'muhendis', 'tekniker', 'bekci', 'musteri']
});
```

#### 2. **Firebase Functions Filtresi**

```typescript
// functions/src/index.ts - Satır 91-104
const recipients = snapshot.docs.filter((docSnap) => {
  const u = docSnap.data() as any;
  const userSahalar: string[] = Array.isArray(u.sahalar) ? u.sahalar : [];
  
  // ÖNEMLİ: SAHA BAZLI BİLDİRİM SİSTEMİ
  // Eğer sahaId yoksa, TÜM kullanıcılara gönder
  if (!sahaId) {
    return true; // Tüm kullanıcılara
  }
  
  // SahaId varsa, SADECE o sahaya atanan kullanıcılara gönder
  const sahaOk = userSahalar.includes(sahaId);
  return sahaOk;
});
```

#### 3. **Sonuç**

- **A Sahasında arıza** → Sadece A sahasına atanan kullanıcılar alır
- **B Sahasında stok eksilmesi** → Sadece B sahasına atanan kullanıcılar alır
- **C Sahasında vardiya** → Sadece C sahasına atanan kullanıcılar alır
- **sahaId yok** → Tüm şirket çalışanları alır (örn: genel duyurular)

---

## 📱 PLATFORM ENTEGRASYONLARI

### iOS Native (Capacitor)

#### Kurulu Paketler
```json
{
  "@capacitor-firebase/messaging": "^7.3.1",
  "@capacitor/push-notifications": "^7.0.3"
}
```

#### Yapılandırma

**capacitor.config.ts:**
```typescript
plugins: {
  PushNotifications: {
    presentationOptions: ["badge", "sound", "alert"]
  }
}
```

**ios/App/App/Info.plist:**
```xml
<key>UIBackgroundModes</key>
<array>
  <string>remote-notification</string>
</array>
```

**ios/App/App/GoogleService-Info.plist:**
```xml
<key>IS_GCM_ENABLED</key>
<true></true>
```

#### Token Kaydı
```typescript
// iOS'ta giriş yaptıktan sonra otomatik çalışır
await pushNotificationService.onUserLogin(userId, userProfile);
// → FCM Token alınır ve Firestore'a kaydedilir
```

---

### Web Browser

#### Service Worker

**public/firebase-messaging-sw.js:**
```javascript
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
  self.registration.showNotification(
    payload.notification.title,
    payload.notification.body
  );
});
```

#### VAPID Key Gerekli

1. Firebase Console → Project Settings → Cloud Messaging
2. "Web Push certificates" bölümünden "Generate key pair"
3. Oluşan key'i `.env` dosyasına ekle:

```bash
VITE_FIREBASE_VAPID_KEY=BHxxxxxxxx...
```

---

## 🚀 KURULUM ADIMLARI

### 1. Firebase Functions Deploy

```bash
cd functions
npm install
firebase deploy --only functions:sendPushOnNotificationCreate
```

### 2. iOS Build

```bash
# Paketleri yükle
npm install

# iOS için build
npm run build
npx cap sync ios

# Xcode'da aç
npx cap open ios
```

**Xcode'da Yapılacaklar:**
1. Signing & Capabilities → Push Notifications ekle
2. Background Modes → Remote notifications aktif et
3. GoogleService-Info.plist dosyasının projeye eklendiğinden emin ol

### 3. Web Deploy

```bash
# .env dosyasına VAPID key ekle
echo "VITE_FIREBASE_VAPID_KEY=BHxxxxxxxx..." >> .env

# Build
npm run build

# Deploy
firebase deploy --only hosting
```

### 4. Firebase Indexes (Gerekirse)

```bash
firebase deploy --only firestore:indexes
```

**firestore.indexes.json:**
```json
{
  "indexes": [
    {
      "collectionGroup": "notifications",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "companyId", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    }
  ]
}
```

---

## 🧪 TEST SENARYOLARI

### Test 1: Saha İzolasyonu

**Senaryo:** A sahasına atanan kullanıcı, sadece A sahasındaki bildirimleri almalı

**Adımlar:**
1. İki kullanıcı oluştur:
   - Kullanıcı 1: A sahasına atanmış
   - Kullanıcı 2: B sahasına atanmış

2. A sahasında bir arıza oluştur

3. **Beklenen Sonuç:**
   - ✅ Kullanıcı 1 bildirimi alır
   - ❌ Kullanıcı 2 bildirimi almaz

**Kontrol:**
```bash
# Firebase Console > Cloud Firestore > notifications
# notification dokümanına bak:
{
  metadata: {
    sahaId: "saha_A"
  },
  deliveredTo: ["user1_id"] // Sadece user1
}
```

---

### Test 2: Multi-Saha Kullanıcı

**Senaryo:** Bir kullanıcı birden fazla sahaya atanmışsa

**Adımlar:**
1. Kullanıcı 1'i hem A hem B sahasına ata
2. A sahasında arıza oluştur
3. B sahasında stok hareketi oluştur

**Beklenen Sonuç:**
- ✅ Kullanıcı 1 her iki bildirimi de alır

---

### Test 3: iOS Push Notification

**Senaryo:** iOS cihazda push notification çalışıyor mu?

**Adımlar:**
1. iOS uygulamasını Xcode'dan gerçek cihaza yükle (simulator push desteklemez)
2. Giriş yap
3. Konsola bak:
```
🔔 iOS: Push notification sistemi başlatılıyor...
📱 iOS: Bildirim izni isteniyor...
✅ iOS: Bildirim izni verildi
📱 iOS: FCM Token alınıyor...
✅ iOS FCM Token alındı: cXxx...
💾 Token Firestore'a kaydediliyor (ios)...
✅ Token Firestore'a kaydedildi
```

4. Başka bir cihazdan/web'den o kullanıcının sahasına arıza oluştur
5. iOS cihazda bildirim gelsin

**Kontrol Noktaları:**
- [ ] Foreground'da bildirim banner'ı görünüyor
- [ ] Background'da push notification geliyor
- [ ] Bildirime tıklayınca uygulama açılıyor
- [ ] Sound çalıyor
- [ ] Badge sayısı artıyor

---

### Test 4: Web Browser Push

**Senaryo:** Web tarayıcıda push notification çalışıyor mu?

**Adımlar:**
1. Chrome/Firefox'ta uygulamayı aç
2. Giriş yap
3. "Bildirim izni" popup'ı gelir → İzin ver
4. Konsola bak:
```
🔔 Web: Push notification sistemi başlatılıyor...
🌐 Web: Bildirim izni isteniyor...
✅ Web: Bildirim izni verildi
✅ Service Worker kaydedildi
🌐 Web: FCM Token alınıyor...
✅ Web FCM Token alındı: dYxx...
```

5. Başka bir sekmeden veya cihazdan arıza oluştur
6. Web tarayıcıda bildirim gelsin

**Kontrol Noktaları:**
- [ ] Foreground'da browser notification görünüyor
- [ ] Background'da (sekme kapalı) notification geliyor
- [ ] Service Worker çalışıyor
- [ ] Notification'a tıklayınca sayfa açılıyor

---

### Test 5: Çoklu Modül Bildirimleri

**Senaryo:** Tüm modüllerde bildirim çalışıyor mu?

**Test Edilecek Modüller:**
- [ ] Arıza Yönetimi (createFault)
- [ ] Stok Yönetimi (createStok, addStokHareket)
- [ ] Elektrik Bakım (createElectricalMaintenance)
- [ ] Mekanik Bakım (createMechanicalMaintenance)
- [ ] Vardiya (createVardiyaBildirimi)
- [ ] Elektrik Kesintileri (createPowerOutage)
- [ ] Yapılan İşler (createYapilanIs)

**Her Modül İçin:**
1. İlgili işlemi oluştur (sahaId ile)
2. Firebase Functions log'larına bak:
```bash
firebase functions:log --only sendPushOnNotificationCreate
```

3. Notification koleksiyonunu kontrol et:
```javascript
// Firestore'da:
notifications.where('metadata.sahaId', '==', 'test_saha').get()
```

---

## 🐛 SORUN GİDERME

### Problem 1: iOS'ta Token Alınamıyor

**Belirtiler:**
```
❌ iOS: FCM Token alınamadı
```

**Çözümler:**

1. **Push Notifications Capability**
   - Xcode → Signing & Capabilities
   - "+ Capability" → "Push Notifications" ekle

2. **GoogleService-Info.plist Kontrolü**
   ```bash
   # Dosyanın var olduğunu kontrol et
   ls -la ios/App/App/GoogleService-Info.plist
   
   # GCM enabled mi?
   grep -A1 "IS_GCM_ENABLED" ios/App/App/GoogleService-Info.plist
   ```

3. **Gerçek Cihaz Kullan**
   - iOS Simulator push notification desteklemez
   - Gerçek iPhone/iPad gerekli

4. **Firebase Console Kontrolü**
   - Project Settings → Cloud Messaging
   - APNs Authentication Key veya APNs Certificates yüklenmiş mi?

---

### Problem 2: Web'de Token Alınamıyor

**Belirtiler:**
```
❌ Web: FCM Token alınamadı
```

**Çözümler:**

1. **VAPID Key Kontrolü**
   ```bash
   # .env dosyasında var mı?
   grep VITE_FIREBASE_VAPID_KEY .env
   ```

2. **Service Worker Kaydı**
   ```javascript
   // Browser Console'da
   navigator.serviceWorker.getRegistrations().then(regs => {
     console.log('Registered SWs:', regs);
   });
   ```

3. **HTTPS Gerekli**
   - Localhost hariç, production'da HTTPS zorunlu
   - HTTP'de FCM çalışmaz

4. **Browser Compatibility**
   - Chrome/Firefox/Edge: ✅ Destekleniyor
   - Safari (iOS/macOS): ⚠️ Kısmi destek (iOS 16.4+)

---

### Problem 3: Bildirim Geliyor Ama Yanlış Kişilere

**Belirtiler:**
- A sahasına atanan kullanıcı B sahasının bildirimlerini görüyor

**Çözümler:**

1. **Kullanıcı Sahalar Alanını Kontrol Et**
   ```javascript
   // Firestore'da kullanıcıyı kontrol et
   db.collection('kullanicilar').doc(userId).get().then(doc => {
     console.log('User sahalar:', doc.data().sahalar);
   });
   ```

2. **Notification Metadata Kontrolü**
   ```javascript
   // Notification'da sahaId var mı?
   db.collection('notifications').doc(notifId).get().then(doc => {
     console.log('Notification metadata:', doc.data().metadata);
   });
   ```

3. **Firebase Functions Log**
   ```bash
   # Filtreleme loglarını kontrol et
   firebase functions:log --only sendPushOnNotificationCreate
   
   # Şu logları ara:
   # "✅ Atanmış" veya "❌ Filtrelendi"
   ```

---

### Problem 4: Push Geliyor Ama Sessiz

**iOS için:**
```javascript
// capacitor.config.ts
plugins: {
  PushNotifications: {
    presentationOptions: ["badge", "sound", "alert"] // ✅ Tümü aktif
  }
}
```

**Firebase Functions için:**
```typescript
// functions/src/index.ts
apns: {
  payload: {
    aps: {
      sound: "default", // ✅ Ses ekle
      badge: 1
    }
  }
}
```

---

### Problem 5: Background'da Bildirim Gelmiyor

**iOS:**
```xml
<!-- ios/App/App/Info.plist -->
<key>UIBackgroundModes</key>
<array>
  <string>remote-notification</string> <!-- ✅ Zorunlu -->
</array>
```

**Web:**
```javascript
// public/firebase-messaging-sw.js mevcut olmalı
// Service Worker kaydı yapılmalı
```

---

## 📊 İZLEME VE ANALİTİK

### Firebase Console

**Cloud Messaging:**
- Sent: Gönderilen bildirimler
- Opened: Açılan bildirimler
- Delivery Rate: Teslimat oranı

**Firestore Audit:**
```javascript
// Notification dokümanında meta bilgiler
{
  pushSentAt: Timestamp,
  pushFanoutAt: Timestamp,
  pushFanoutCount: 5,
  deliveredTo: ["user1", "user2", ...],
  pushErrors: [...]
}
```

### Debug Logs

```typescript
// Tüm bildirim akışı loglanıyor
console.log('🔔 Vardiya Bildirimi Debug:', {
  sahaId: vardiyaData.sahaId || 'YOK',
  santralId: vardiyaData.santralId || 'YOK',
  companyId: vardiyaData.companyId
});
```

---

## 🎯 EN İYİ UYGULAMALAR

### 1. Her İşlemde sahaId Ekle

```typescript
// ✅ DOĞRU
await createNotification({
  companyId: company.id,
  title: 'Yeni Arıza',
  metadata: {
    sahaId: ariza.sahaId,      // ✅ Zorunlu
    santralId: ariza.santralId  // ✅ İsteğe bağlı
  }
});

// ❌ YANLIŞ
await createNotification({
  companyId: company.id,
  title: 'Yeni Arıza'
  // sahaId yok → TÜM şirkete gider
});
```

### 2. Santraldan sahaId Al

```typescript
// Santral varsa ama sahaId yoksa
if (!sahaId && santralId) {
  const santralDoc = await getDoc(doc(db, 'santraller', santralId));
  if (santralDoc.exists()) {
    sahaId = santralDoc.data().sahaId; // ✅ Santraldan al
  }
}
```

### 3. Hedef Rolleri Belirle

```typescript
// Genel bildirim
roles: ['yonetici', 'muhendis', 'tekniker', 'bekci', 'musteri']

// Teknik ekip only
roles: ['muhendis', 'tekniker']

// Yönetim only
roles: ['yonetici']
```

---

## 📞 DESTEK

**Sorunlar için:**
1. Firebase Functions log kontrol et: `firebase functions:log`
2. Browser console kontrol et (F12)
3. Xcode console kontrol et (iOS)
4. Firestore `notifications` koleksiyonunu incele

**Yardım:**
- Firebase Support: https://firebase.google.com/support
- Capacitor Docs: https://capacitorjs.com/docs
- Bu dosya: `/BILDIRIM_SISTEMI_REHBERI.md`

---

**Son Güncelleme:** 2025-01-10  
**Versiyon:** 2.0.0  
**Durum:** ✅ Tam Fonksiyonel - iOS & Web Destekli

