# 🔍 FCM Token Kontrol Listesi

## SORUN: 
Functions loglarında `hasPushTokens: false, hasFcm: false` görünüyor ama iOS'ta token kaydedildi diyor.

## KONTROL EDİLECEKLER:

### 1. Firebase Console'dan Kontrol:
1. **Firebase Console > Firestore** açın
2. **`kullanicilar`** koleksiyonuna gidin  
3. Giriş yaptığınız kullanıcıyı bulun (email ile arama)
4. Şu alanları kontrol edin:
   - `pushTokens` → Bu bir OBJE olmalı
   - `pushTokens.fcm` → İçinde token string olmalı
   - `fcmToken` → (eski alan, varsa)

### 2. Token Nerede Kaydediliyor?

**iOS Tarafı (pushNotificationService.ts):**
```javascript
await updateDoc(doc(db, 'kullanicilar', currentUser.uid), {
  'pushTokens.fcm': fcmToken,  // ← BURAYA KAYDEDİYOR
  pushNotificationsEnabled: true,
  pushTokenUpdatedAt: serverTimestamp(),
  platform: Capacitor.getPlatform()
});
```

**Functions Tarafı (index.ts) Nerede Arıyor:**
```javascript
const token = user?.pushTokens?.fcm || user?.fcmToken;
//                   ↑ BURADA ARIYOR
```

### 3. OLASI SORUNLAR:

#### A. Yanlış Kullanıcı ID'si
- iOS'ta başka bir ID ile kaydediyor olabilir
- Functions'ta başka bir ID'ye bakıyor olabilir

#### B. Token Formatı Sorunu  
- `pushTokens` string olarak kaydedilmiş olabilir (obje olmalı)
- `pushTokens.fcm` yerine direkt `pushTokens` olarak kaydedilmiş olabilir

#### C. Timing Sorunu
- Token henüz kaydedilmemiş olabilir
- Bildirim token'dan önce oluşturulmuş olabilir

## ACİL ÇÖZÜM:

### Manuel Token Ekleme (Firebase Console'dan):

1. Kullanıcıyı bulun
2. **"Add field"** tıklayın
3. Field name: `pushTokens`
4. Type: **Map** seçin
5. İçine ekleyin:
   - Key: `fcm`
   - Value: (iOS'tan aldığınız FCM token)

### Örnek Yapı:
```
kullanicilar/
  └── userId/
      ├── email: "user@example.com"
      ├── rol: "yonetici"
      └── pushTokens: {
            fcm: "fJKs9d0E9UAOgHzCgNNJ..."
          }
```

## DEBUG İÇİN:

### Xcode Console'da:
```
✅ FCM Token Firestore'a kaydedildi
Firestore yolu: kullanicilar/USER_ID_HERE
Token: TOKEN_BURAYA_YAZILACAK
```

### Firebase Functions Logs:
```
🔑 FCM Token kontrolü: {
  hasPushTokens: true,  // ← BUNU true OLMALI
  hasFcm: true,         // ← BUNU true OLMALI
  tokenLength: 142      // ← Token uzunluğu
}
```

## TEST ADIMLARI:

1. **Firebase Console'dan token'ları kontrol et**
2. **Yoksa manuel ekle (yukarıdaki format)**
3. **Yeni arıza kaydı oluştur**
4. **Functions loglarını kontrol et**
