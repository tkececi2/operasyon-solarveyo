# 🔔 Bildirim Sistemi İyileştirmeleri

## ✅ Çözülen Sorunlar

### 1. Bildirim Yönlendirme Sorunu
**Problem**: Bildirime tıklandığında ilgili detay sayfasına yönlendirilmiyordu.

**Çözüm**:
- Her bildirim metadata'sına `targetType` ve `targetId` eklendi
- Bildirim tıklama handler'ı güçlendirildi
- Bildirim tipine göre doğru sayfaya yönlendirme yapılıyor

**Desteklenen Yönlendirmeler:**
- ✅ **Arıza** → `/arizalar` + faultId metadata
- ✅ **Bakım** → `/bakim/elektrik` + maintenanceId metadata  
- ✅ **Vardiya** → `/vardiya-bildirimleri` + vardiyaId metadata
- ✅ **Stok** → `/stok-kontrol` + stokId metadata
- ✅ **Elektrik Kesintisi** → `/arizalar/elektrik-kesintileri` + outageId metadata

### 2. Bakım Bildiriminde ID Gösterme Sorunu
**Problem**: Elektrik bakım bildirimlerinde santral ID'si gösteriliyordu.

**Önce**:
```
⚡ Elektrik Bakım Tamamlandı
S3u8dPjl6fcFMMjxUPun için elektrik bakım işlemi tamamlandı.
```

**Şimdi**:
```
⚡ Elektrik Bakım Tamamlandı
VOYAG NECATİ santralinde elektrik bakım işlemi tamamlandı.
```

**Çözüm**:
- Santral adı Firestore'dan çekiliyor
- Santral adı yoksa saha adı kullanılıyor
- Fallback: "Saha - Elektrik bakım işlemi tamamlandı"

---

## 🔧 Teknik Değişiklikler

### 1. Bildirim Metadata Standardı
Tüm bildirimlere şu alanlar eklendi:
```typescript
metadata: {
  targetType: 'fault' | 'maintenance' | 'vardiya' | 'outage' | 'stock',
  targetId: string,
  sahaAdi?: string,
  santralAdi?: string,
  // ... diğer bilgiler
}
```

### 2. Değiştirilen Dosyalar
- ✅ `src/pages/bildirimler/Bildirimler.tsx` - Tıklama handler'ı
- ✅ `src/services/arizaService.ts` - Arıza bildirimleri
- ✅ `src/services/bakimService.ts` - Bakım bildirimleri
- ✅ `src/services/vardiyaService.ts` - Vardiya bildirimleri
- ✅ `src/services/elektrikKesintiService.ts` - Kesinti bildirimleri

### 3. Örnek Bildirim Metadata
```typescript
// Yeni Arıza
{
  faultId: "abc123",
  targetType: "fault",
  targetId: "abc123",
  sahaId: "saha1",
  santralId: "santral1",
  oncelik: "kritik"
}

// Elektrik Bakım
{
  maintenanceId: "maint123",
  targetType: "maintenance",
  targetId: "maint123",
  santralAdi: "VOYAG NECATİ",
  sahaAdi: "VOYAG ISPARTA",
  maintenanceType: "elektrik"
}

// Vardiya
{
  vardiyaId: "vardiya123",
  targetType: "vardiya",
  targetId: "vardiya123",
  sahaAdi: "VOYAG ISPARTA"
}
```

---

## 🧪 Test Senaryoları

### Arıza Bildirimi Testi
1. **Web panelden arıza oluştur**
2. **iOS/Web'de bildirim gelir**
3. **Bildirime tıkla**
4. **Arızalar sayfasına yönlendirilir** ✅

### Bakım Bildirimi Testi
1. **Web panelden elektrik bakım kaydet**
2. **Bildirim:**
   ```
   ⚡ Elektrik Bakım Tamamlandı
   [SANTRAL ADI] santralinde elektrik bakım işlemi tamamlandı.
   ```
3. **Bildirime tıkla** → Elektrik bakım sayfasına git

### Vardiya Bildirimi Testi
1. **Bekçi vardiya bildirimi oluştur**
2. **Bildirim:**
   ```
   🔔 Vardiya Bildirimi
   [SAHA ADI] - SABAH vardiyası (08:00-16:00)
   ```
3. **Bildirime tıkla** → Vardiya bildirimleri sayfasına git

---

## 📱 Deployment

### Web (Netlify/Firebase Hosting)
```bash
npm run build
# Deploy to production
```

### iOS
```bash
npm run build
npx cap copy ios
# Xcode'da build & run
```

---

## 🔍 Console Logları

Bildirim yönlendirmesi çalıştığında:
```
📍 Arıza sayfasına yönlendirildi - faultId: abc123
📍 Elektrik bakım sayfasına yönlendirildi
📍 Vardiya bildirimleri sayfasına yönlendirildi
```

Santral adı çekildiğinde:
```
🔍 SahaId santral'dan alındı: saha123
✅ Elektrik bakım bildirimi gönderildi - sahaId: saha123, santralId: santral123
```

---

## ⚠️ Notlar

1. **Eski Bildirimler**: Mevcut bildirimlerde targetType olmayabilir - sadece actionUrl kullanılır
2. **Detay Modal**: Arıza detayı şu an modal ile açılıyor, URL parametresi kullanılmıyor
3. **Saha/Santral Adları**: Metadata'ya eklendi, gelecekte daha zengin bildirimler için kullanılabilir

---

**Son Güncelleme**: 11 Ekim 2025
**Versiyon**: 2.0.1
