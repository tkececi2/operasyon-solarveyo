# 🔔 Push Bildirim Sistemi Düzeltme Raporu

## 📅 Tarih: 9 Ocak 2025

## ❌ SORUN
- **Arıza kayıtları** için push bildirimleri çalışıyordu ✅
- **Bakım, Stok, Vardiya** bildirimleri uygulama içinde geliyordu ama push (uygulama dışı) gelmiyordu ❌

## 🔍 SORUNUN SEBEBİ

### 1. **SahaId Eksikliği**
- Bakım, stok ve vardiya kayıtlarında `sahaId` bazen boş veya undefined oluyordu
- Firebase Functions'ta saha bazlı filtreleme yapılırken, sahaId yoksa bildirim gönderilmiyordu

### 2. **Debug Log Eksikliği** 
- Firebase Functions'ta yeterli log yoktu, sorun tespit edilemiyordu

## ✅ YAPILAN DÜZELTMELER

### 1. **Servis Dosyalarında Düzeltmeler**

#### 📁 `src/services/bakimService.ts`
```javascript
// ÖNCE: Sadece sahaId kontrolü
let bildirimSahaId = maintenanceData.sahaId;
if (!bildirimSahaId) {
  // Santral'dan al
}

// SONRA: Detaylı kontrol ve debug
let bildirimSahaId = maintenanceData.sahaId;
let santralAdi = '';

if (maintenanceData.santralId) {
  const santralDoc = await getDoc(doc(db, 'santraller', maintenanceData.santralId));
  if (santralDoc.exists()) {
    const santralData = santralDoc.data();
    santralAdi = santralData.name || santralData.adi || maintenanceData.santralId;
    
    // sahaId yoksa santral'dan al
    if (!bildirimSahaId || bildirimSahaId === '') {
      bildirimSahaId = santralData.sahaId;
    }
  }
}

// Debug log eklendi
console.log(`📊 Bakım Bildirimi Debug:`, {
  sahaId: bildirimSahaId || 'YOK',
  santralId: maintenanceData.santralId || 'YOK',
  companyId: maintenanceData.companyId
});

// metadata'da sadece var olan değerleri gönder
const metadata: any = { 
  maintenanceId: docRef.id, 
  maintenanceType: 'elektrik'
};

if (bildirimSahaId) {
  metadata.sahaId = bildirimSahaId;
}
if (maintenanceData.santralId) {
  metadata.santralId = maintenanceData.santralId;
}
```

#### 📁 `src/services/stokService.ts`
- Stok ekleme/güncelleme sırasında sahaId kontrolü iyileştirildi
- Saha adı bilgisi eklendi
- Debug loglar eklendi

#### 📁 `src/services/vardiyaService.ts`  
- Vardiya bildirimi metadata kontrolü eklendi
- Sadece mevcut sahaId/santralId değerleri metadata'ya ekleniyor

### 2. **Firebase Functions Düzeltmeleri**

#### 📁 `functions/src/index.ts`

**Fan-out bildirimlerde debug log eklendi:**
```javascript
console.log("🎯 Fan-out Bildirim Hedefleme:", {
  sahaId: sahaId || "YOK",
  santralId: santralId || "YOK", 
  targetRoles: targetRoles || "TÜM ROLLER",
  companyId: companyId
});

// Her kullanıcı için detaylı log
console.log(`👤 Kullanıcı: ${u.email || u.ad || uDoc.id} (${u.rol})`);
console.log(`   - Atandığı sahalar: [${userSahalar.join(', ')}]`);
console.log(`   - Hedef sahaId: ${sahaId || 'YOK'}`);

// Önemli: sahaId/santralId yoksa tüm kullanıcılara gönder
if (!sahaId && !santralId) {
  console.log(`   ✅ Saha/santral filtresi YOK - Bildirim gönderilecek`);
  return true;
}
```

## 🎯 BİLDİRİM MANTIĞI

### Kimler Bildirim Alır?

1. **Yönetici, Mühendis, Tekniker**: 
   - TÜM bildirimleri alırlar (saha/santral fark etmez)

2. **Bekçi ve Müşteri**:
   - SADECE atandıkları saha/santraldaki bildirimleri alırlar
   - Kullanıcının `sahalar` veya `santraller` array'inde ilgili ID olmalı

3. **Saha/Santral Belirtilmemişse**:
   - Tüm rol bazlı kullanıcılara gönderilir
   - Bu yüzden metadata'da sahaId/santralId yoksa bildirim yine de gönderilir

## 📋 TEST KONTROL LİSTESİ

### ✅ Arıza Bildirimleri
- [x] Yeni arıza oluşturulduğunda push geliyor
- [x] Arıza çözüldüğünde push geliyor
- [x] Arıza güncellendi push geliyor

### 🔧 Bakım Bildirimleri  
- [ ] Elektrik bakım kaydı → Push bildirimi
- [ ] Mekanik bakım kaydı → Push bildirimi
- [ ] Yapılan işler kaydı → Push bildirimi

### 📦 Stok Bildirimleri
- [ ] Yeni stok (kritik seviye) → Push bildirimi
- [ ] Stok hareketi → Push bildirimi
- [ ] Düşük stok uyarısı → Push bildirimi

### 🔔 Vardiya Bildirimleri
- [ ] Yeni vardiya → Push bildirimi
- [ ] Acil vardiya → Push bildirimi
- [ ] Vardiya güncelleme → Push bildirimi

## 🚀 DEPLOYMENT

```bash
# Firebase Functions deploy edildi
npx firebase deploy --only functions

✅ Başarıyla deploy edildi:
- testFunction
- sendPushOnNotificationCreate
- createScopedNotification
```

## 📱 TEST TALİMATLARI

1. **iOS Uygulamasını Aç**
2. **Giriş Yap** (FCM token kaydedilecek)
3. **Uygulamayı Arka Plana Al veya Kapat**
4. **Test Et:**
   - Yeni bakım kaydı oluştur
   - Yeni stok kaydı oluştur (düşük stok)
   - Yeni vardiya bildirimi oluştur
5. **Kontrol Et:**
   - Push bildirimi telefona geldi mi?
   - Firebase Console > Functions > Logs'ta debug logları kontrol et

## 🐛 DEBUG İPUÇLARI

### Firebase Console'dan Log Kontrolü:
1. Firebase Console > Functions > Logs
2. Filtrele: `sendPushOnNotificationCreate` veya `createScopedNotification`
3. Arama: "Fan-out Bildirim Hedefleme" veya "Kullanıcı:"

### Sorun Devam Ederse:
1. Kullanıcının `sahalar` array'ini kontrol et
2. Kullanıcının FCM token'ı var mı kontrol et
3. Firebase Functions loglarında hata var mı bak
4. Notification collection'da `pushError` alanını kontrol et

## 📞 DESTEK
Sorun devam ederse lütfen şu bilgilerle birlikte bildirin:
- Kullanıcı email/ID
- Hangi modül (bakım/stok/vardiya)
- Firebase Functions log screenshot
- Kullanıcının atandığı sahalar
