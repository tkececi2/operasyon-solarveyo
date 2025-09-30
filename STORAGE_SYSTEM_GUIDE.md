# 📦 Depolama Sistemi Otomasyonu - Tam Rehber

## 🎯 Otomatik Çalışma Prensibi

Sistem **tamamen otomatik** çalışır. Her dosya eklendiğinde/silindiğinde metrics otomatik güncellenir.

## ✅ Otomatik Çalışan Yerler

### 1. **Arıza Fotoğrafları** (`src/services/arizaService.ts`)
```typescript
// Arıza oluşturulduğunda
await uploadArizaPhotos(photos, arizaId, companyId)
  ↓
// Otomatik olarak:
- Fotoğraflar yüklenir
- metrics.storageUsedMB += boyut
- metrics.breakdown.arizaPhotos += boyut
- metrics.fileCount += sayı
```

**Kullanım Yerleri:**
- ✅ Arıza oluşturma
- ✅ Arıza fotoğraf ekleme
- ✅ Çözüm fotoğrafları
- ✅ Arıza silme (fotoğraflar da silinir)

### 2. **Bakım Fotoğrafları** (`src/services/bakimService.ts`)
```typescript
await uploadBakimPhotos(photos, bakimId, companyId, bakimType)
  ↓
// Otomatik olarak:
- metrics.storageUsedMB += boyut
- metrics.breakdown.bakimPhotos += boyut
```

**Kullanım Yerleri:**
- ✅ Elektrik bakım
- ✅ Mekanik bakım
- ✅ Yapılan iş kayıtları

### 3. **Vardiya Fotoğrafları** (`src/services/storageService.ts`)
```typescript
await uploadVardiyaPhotos(photos, vardiyaId, companyId)
  ↓
// Otomatik olarak:
- metrics.storageUsedMB += boyut
- metrics.breakdown.vardiyaPhotos += boyut
```

### 4. **Santral Fotoğrafları**
```typescript
await uploadSantralPhoto(photo, santralId, companyId, type)
  ↓
// Otomatik olarak:
- metrics.storageUsedMB += boyut
- metrics.breakdown.logos += boyut (eğer logo ise)
```

### 5. **Profil Fotoğrafları** (YENİ - Az Önce Eklendi)
```typescript
await uploadProfilePhoto(userId, file)
  ↓
// Otomatik olarak:
- CompanyId alınır
- companies/{companyId}/profile-photos/ altına yüklenir
- metrics.storageUsedMB += boyut
- metrics.breakdown.other += boyut
```

**Silme İşlemi:**
```typescript
await removeProfilePhoto(userId)
  ↓
// Otomatik olarak:
- Dosya storage'dan silinir
- metrics.storageUsedMB -= boyut
- Veritabanı güncellenir
```

### 6. **Şirket Logoları**
```typescript
await uploadCompanyLogo(photo, companyId)
  ↓
// Otomatik olarak:
- metrics.storageUsedMB += boyut
- metrics.breakdown.logos += boyut
```

### 7. **Stok Fotoğrafları**
```typescript
await uploadStokPhotos(photos, companyId)
  ↓
// Otomatik olarak:
- metrics.storageUsedMB += boyut
- metrics.breakdown.other += boyut
```

## 📊 Metrics Yapısı

Firestore'da her şirket için:

```typescript
companies/{companyId}:
  metrics: {
    storageUsedMB: 245.67,        // Toplam kullanım (MB)
    fileCount: 156,               // Toplam dosya sayısı
    lastStorageCalculation: Timestamp,
    breakdown: {
      logos: 2.5,                 // Logo & santral fotoları
      arizaPhotos: 125.3,         // Arıza fotoğrafları
      bakimPhotos: 89.2,          // Bakım fotoğrafları
      vardiyaPhotos: 15.4,        // Vardiya bildirimleri
      santraller: 8.1,            // Santral görselleri
      sahalar: 3.2,               // Saha görselleri
      stoklar: 0.8,               // Stok fotoları
      documents: 0.5,             // Belgeler
      other: 0.67                 // Diğer (profil fotoları)
    }
  }
```

## 🔧 Geçmiş Veriler İçin (İlk Kurulum)

Eğer eski veriler için metrics hesaplanmamışsa:

### **Yöntem 1: Debug Tool Kullan**
```
http://localhost:5173/debug/recalculate-storage

Adımlar:
1. Sayfayı aç
2. "Tümünü Yeniden Hesapla" butonuna tıkla
3. Tüm şirketler için gerçek depolama hesaplanır
4. Firestore metrics otomatik güncellenir
```

### **Yöntem 2: Manuel Script**
```typescript
import { calculateRealStorageUsage } from './services/statisticsService';

// Tek bir şirket için
const totalMB = await calculateRealStorageUsage('companyId');

// Firestore'u güncelle
await updateDoc(doc(db, 'companies', companyId), {
  'metrics.storageUsedMB': totalMB,
  'metrics.lastStorageCalculation': new Date()
});
```

## 📈 Dashboard Görünümü

### **Kullanıcı Dashboard**
`src/pages/subscription/ManagerSubscription.tsx` veya `Dashboard.tsx`:

```typescript
const storageMetrics = await getStorageMetrics(companyId);

// Gösterim:
Kullanılan: 245.67 MB / 5 GB (4.8%)
```

### **SuperAdmin Dashboard**
`src/pages/superadmin/SuperAdminDashboard.tsx`:

Tüm şirketlerin toplam depolama kullanımı:
```
Toplam Depolama: 12.4 GB
Ortalama Kullanım: %23
En Çok Kullanan: ABC Şirketi (850 MB)
```

## 🚨 Önemli Notlar

### ✅ **Otomatik Çalışanlar:**
1. Her dosya yüklemede metrics güncellenir
2. Her dosya silmede metrics güncellenir
3. Cache kullanılır (O(1) okuma)
4. Gerçek zamanlı takip

### ⚠️ **Manuel Müdahale Gereken Durumlar:**
1. **İlk kurulum**: Eski verileri hesaplamak için RecalculateStorage tool
2. **Veri tutarsızlığı**: Eğer dosya silinmiş ama metrics güncellenmemişse
3. **Migration**: Eski sistemden yeni sisteme geçişte

### 🔄 **Background Job (Opsiyonel)**

Günlük tutarsızlık kontrolü için:
```typescript
// Her gece 03:00'te çalışacak job
cron.schedule('0 3 * * *', async () => {
  const companies = await getAllCompanies();
  
  for (const company of companies) {
    const realStorage = await calculateRealStorageUsage(company.id);
    const cachedStorage = company.metrics?.storageUsedMB || 0;
    
    // Eğer %5'ten fazla fark varsa düzelt
    const diff = Math.abs(realStorage - cachedStorage);
    if (diff / realStorage > 0.05) {
      console.log(`⚠️ Tutarsızlık: ${company.ad} - Gerçek: ${realStorage}MB, Cache: ${cachedStorage}MB`);
      await updateDoc(doc(db, 'companies', company.id), {
        'metrics.storageUsedMB': realStorage,
        'metrics.lastStorageCalculation': new Date()
      });
    }
  }
});
```

## 📱 Mobil Uygulama

Mobil uygulamada da aynı sistem çalışır:
```typescript
// src/services/mobile/cameraService.ts
await uploadArizaPhotos(photos, arizaId, companyId);
  ↓
// Otomatik olarak metrics güncellenir
```

## 🎯 Özet

| Özellik | Durum | Açıklama |
|---------|-------|----------|
| Otomatik Upload Tracking | ✅ | Her dosya yüklemede çalışır |
| Otomatik Delete Tracking | ✅ | Her dosya silmede çalışır |
| Cache Kullanımı | ✅ | O(1) hızlı okuma |
| Kategori Breakdown | ✅ | 9 farklı kategori |
| Profil Fotoğrafları | ✅ | Az önce eklendi |
| Geçmiş Veri Hesaplama | ✅ | Debug tool mevcut |
| SuperAdmin Görünümü | 🔧 | Eklenecek |
| Background Sync | 📝 | Opsiyonel |

## 🚀 Kullanım Örnekleri

### Örnek 1: Arıza Fotoğrafı Yükleme
```typescript
// components/modals/CreateFaultModal.tsx
const photos = [file1, file2, file3];
await createFault({ ...faultData, photos });

// Arka planda otomatik:
// - 3 dosya yüklendi
// - metrics.storageUsedMB += 2.4 MB
// - metrics.fileCount += 3
// - metrics.breakdown.arizaPhotos += 2.4 MB
```

### Örnek 2: Profil Fotoğrafı Değiştirme
```typescript
// pages/ProfileSettings.tsx
await uploadProfilePhoto(userId, newPhoto);

// Arka planda otomatik:
// - Eski fotoğraf silindi → metrics -= eski boyut
// - Yeni fotoğraf yüklendi → metrics += yeni boyut
// - Net değişiklik kaydedildi
```

### Örnek 3: Arıza Silme
```typescript
await deleteFault(faultId);

// Arka planda otomatik:
// - Tüm arıza fotoğrafları silindi
// - Her fotoğraf için metrics güncellendi
// - Toplam storage azaldı
```

## 📞 Destek

Herhangi bir sorun olursa:
1. `http://localhost:5173/debug/recalculate-storage` ile yeniden hesapla
2. Console loglarını kontrol et
3. Firestore'da `metrics` alanını kontrol et

---

**Son Güncelleme**: 30 Eylül 2025
**Durum**: Tamamen Otomatik ✅
