# 🔍 Bakım Bildirimleri Debug Kılavuzu

## SORUN:
- Arıza bildirimleri geliyorsa sistem çalışıyor ✅
- Bakım, stok, vardiya bildirimleri gelmiyor ❌

## DEBUG ADIMLARI:

### 1. Browser Console Kontrolü:
1. **F12** tuşuna basın (Developer Tools)
2. **Console** sekmesine gidin
3. **Bakım kaydı oluşturun**
4. **Konsola bakın:**

**ARANAN MESAJLAR:**
```
📊 Elektrik Bakım Bildirimi Debug: {sahaId: "...", santralId: "...", companyId: "..."}
✅ Elektrik bakım bildirimi gönderildi - sahaId: ..., santralId: ...
```

**HATA MESAJLARI:**
```
❌ Elektrik bakım bildirimi hatası: ...
```

### 2. Firebase Functions Logs:
**ARANAN MESAJLAR:**
```
🔔 createScopedNotification çağrıldı: {companyId: "...", title: "⚡ Elektrik Bakım Tamamlandı", ...}
📊 Toplam kullanıcı sayısı: X
👤 Kullanıcı kontrolü: ... (yonetici)
✅ SahaId YOK - TÜM kullanıcılara gönderilecek
```

### 3. Firestore Notifications Collection:
1. **Firebase Console > Firestore**
2. **`notifications` koleksiyonu**
3. **Son eklenen kayıtları kontrol edin**
4. **Bakım bildirimi var mı?**

### 4. Test Senaryoları:

#### Test 1: Elektrik Bakım
1. **Bakım > Yeni Bakım**
2. **Elektrik Bakım** seçin
3. **Saha ve Santral** seçin
4. **Kaydet**
5. **Browser Console'da log var mı?**

#### Test 2: Network Tab
1. **F12 > Network** sekmesi
2. **Bakım kaydı oluşturun**
3. **Firebase istekleri var mı?**
4. **createScopedNotification çağrılıyor mu?**

### 5. Olası Sorunlar:

#### A. Form Validation Hatası
- Form gönderilmeden hata oluyor olabilir
- try-catch bloğu hatayı yakalıyor ama bildirmiyor

#### B. sahaId/santralId Boş
- Form'da saha/santral seçilmemiş olabilir
- Bildirim gönderilmiyor

#### C. Firebase Functions Çağrılmıyor
- `createScopedNotificationClient` çağrılmıyor
- Network hatası olabilir

#### D. Role Restriction
- Kullanıcının rolü bildirimleri engelliyor olabilir

### 6. Manuel Test:

Browser Console'da çalıştırın:
```javascript
// Test notification
import { notificationService } from './services/notificationService';

await notificationService.createScopedNotificationClient({
  companyId: 'company_CN2IUZpTVSa2WeuAN9hKo3rrM8H3',
  title: 'Test Bakım Bildirimi',
  message: 'Bu bir test bildirimidir',
  type: 'info',
  actionUrl: '/bakim',
  metadata: { test: true },
  roles: ['yonetici','muhendis','tekniker','bekci','musteri']
});
```

## ACİL ÇÖZÜM:

### Hemen Kontrol Edin:
1. **Bakım kaydı oluştururken browser console açık tutun**
2. **Hangi adımda hata oluyor tespit edin**
3. **Firebase Functions logs'unda createScopedNotification çağrısı var mı bakın**

### Firebase Console:
1. **`notifications` koleksiyonu**
2. **Son 10 dakikada bakım bildirimi oluşturuldu mu?**
3. **Oluşturulduysa pushSentAt var mı?**
