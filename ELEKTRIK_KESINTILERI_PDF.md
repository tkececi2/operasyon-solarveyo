# 📄 Elektrik Kesintileri - Profesyonel PDF Rapor Sistemi

## 🎯 Genel Bakış

Elektrik kesintileri için profesyonel, sayfalanmış ve detaylı PDF rapor sistemi.

## ✨ Özellikler

### 1️⃣ **Özet İstatistikler Sayfası**

#### İlk Satır - Kesinti Sayıları
```
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ Toplam       │  │ Devam        │  │ Bitti        │
│ Kesinti      │  │ Ediyor       │  │              │
│     15       │  │      3       │  │      12      │
└──────────────┘  └──────────────┘  └──────────────┘
   (Mavi)           (Açık Mavi)        (Yeşil)
```

#### İkinci Satır - Kayıp Bilgileri
```
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ Kayip Enerji │  │ Toplam Sure  │  │ Gelir Kaybi  │
│  1250 kWh    │  │   820 dk     │  │  3125.00 TL  │
└──────────────┘  └──────────────┘  └──────────────┘
   (Kritik)         (Yüksek)          (Normal)
```

### 2️⃣ **Hesaplamalar**

#### Toplam Kayıp Enerji
```typescript
toplamKayipEnerji = Σ(kesinti.kaybedilenUretim)
// Örnek: 450 + 320 + 480 = 1250 kWh
```

#### Toplam Süre
```typescript
toplamSure = Σ((bitisTarihi - baslangicTarihi) / 60000)
// Örnek: 240 + 180 + 400 = 820 dakika
```

#### Gelir Kaybı
```typescript
gelirKaybi = toplamKayipEnerji × 2.5 TL/kWh
// Örnek: 1250 kWh × 2.5 = 3125.00 TL
```

> **Not**: Elektrik fiyatı varsayılan olarak 2.5 TL/kWh'dir. Bu değer değiştirilebilir.

### 3️⃣ **Kesinti Detay Sayfaları**

Her kesinti için ayrı sayfa:

```
┌─────────────────────────────────┐
│ kablo-arizasi              #2   │
├─────────────────────────────────┤
│ [Bitti]                         │
│                                 │
│ Saha: VOYAG CANKIRI             │
│ Baslangic: 13.09.2025 10:29     │
│ Bitis: 13.09.2025 14:29         │
│ Sure: 240 dakika                │
│ Kaybedilen Uretim: 450 kWh      │
│ Raporlayan: Mehmet Seymen       │
│                                 │
│ Aciklama:                       │
│ Sahanin bagli oldugu hatta YG   │
│ kablo arizasi sebebi ile...     │
└─────────────────────────────────┘
```

### 4️⃣ **Filtre Desteği**

```
Filtreler: Yil: 2025 | Ay: Eylul | Durum: Bitti | Saha: VOYAG CANKIRI
```

## 📊 Örnek Rapor Çıktısı

```
📄 elektrik_kesintileri_20251005_152345.pdf

Sayfa 1: Özet Sayfası
├─ ELEKTRIK KESINTILERI RAPORU
├─ Ozet Istatistikler
│  
├─ Kesinti Sayıları:
│  ├─ Toplam Kesinti: 15
│  ├─ Devam Ediyor: 3
│  └─ Bitti: 12
│
├─ Kayıp Bilgileri:
│  ├─ Kayip Enerji: 1250 kWh
│  ├─ Toplam Sure: 820 dk
│  └─ Gelir Kaybi: 3125.00 TL
│
└─ Filtreler: Yil: 2025

Sayfa 2: Kesinti #1
├─ Trafo Arizasi
├─ Durum: Bitti
├─ Saha: VOYAG BUGDUZ
├─ Baslangic: 25.11.2024 12:30
├─ Bitis: 28.11.2024 14:37
├─ Sure: 240 dakika
├─ Kaybedilen Uretim: 450 kWh
├─ Raporlayan: Mehmet Seymen
└─ Aciklama: ...

Sayfa 3: Kesinti #2
...
```

## 🎨 Renk Paleti

```typescript
// Kesinti sayıları
Toplam Kesinti: #1E40AF (Koyu Mavi)
Devam Ediyor:   #60A5FA (Açık Mavi)
Bitti:          #10B981 (Yeşil)

// Kayıp bilgileri
Kayip Enerji:   #3B82F6 (Mavi - Kritik)
Toplam Sure:    #60A5FA (Açık Mavi - Yüksek)
Gelir Kaybi:    #93C5FD (Açık Mavi - Normal)
```

## 🔧 Kullanım

```typescript
await exportElektrikKesintileriToPDF({
  kesintiler: filteredKesintiler,
  company: company,
  sahalar: sahalar,
  raporlayanMap: raporlayanMap,
  filters: {
    year: filterYear,
    month: filterMonth,
    durum: filterDurum,
    saha: filterSaha
  }
});
```

## 💰 Gelir Kaybı Hesaplama Formülü

### Varsayılan Fiyat
```typescript
const ELEKTRIK_FIYATI = 2.5; // TL/kWh
```

### Hesaplama
```typescript
// Her kesinti için
kesinti.kaybedilenUretim // kWh cinsinden

// Toplam
toplamKayipEnerji = kesintiler.reduce((sum, k) => 
  sum + (k.kaybedilenUretim || 0), 0
);

// Gelir kaybı
gelirKaybi = toplamKayipEnerji × ELEKTRIK_FIYATI;
```

### Özelleştirme

Elektrik fiyatını değiştirmek için:

```typescript
// pdfReportUtils.ts içinde
const gelirKaybi = (toplamKayipEnerji * 2.5).toFixed(2); // Bu satırı değiştir
// Örnek: 3.0 TL/kWh için
const gelirKaybi = (toplamKayipEnerji * 3.0).toFixed(2);
```

## 📈 İstatistikler

### Otomatik Hesaplanan Değerler

1. **Toplam Kesinti Sayısı**: `kesintiler.length`
2. **Devam Eden**: `kesintiler.filter(k => !k.bitisTarihi).length`
3. **Bitenler**: `kesintiler.filter(k => k.bitisTarihi).length`
4. **Kayıp Enerji**: `Σ(kaybedilenUretim)`
5. **Toplam Süre**: `Σ(bitisTarihi - baslangicTarihi)` (dakika)
6. **Gelir Kaybı**: `kayıpEnerji × fiyat` (TL)

## 🎯 Özellikler

- ✅ **Sayfalama**: Her kesinti ayrı sayfa
- ✅ **Türkçe**: Tüm metinler ASCII (ç→c, ş→s)
- ✅ **Header/Footer**: Her sayfada
- ✅ **Sayfa Numarası**: "Sayfa X / Y"
- ✅ **Filtreler**: Özet sayfada gösterilir
- ✅ **Company Bilgisi**: Header'da
- ✅ **Raporlayan**: Her kesinti için
- ✅ **Sade Tasarım**: Minimal ve profesyonel

## 📊 Karşılaştırma

| Özellik | Eski Sistem | Yeni Sistem |
|---------|-------------|-------------|
| Metod | html2canvas | jsPDF native |
| Sayfalama | Manuel | Otomatik |
| Kesinti Sayıları | ❌ | ✅ |
| Kayıp Enerji | ❌ | ✅ |
| Toplam Süre | ❌ | ✅ |
| Gelir Kaybı | ❌ | ✅ |
| Türkçe | Sorunlu | ✅ ASCII |
| Toast | Erken gidiyor | ✅ Infinity |

## 🚀 Gelecek Özellikler

- [ ] Elektrik fiyatı kullanıcı ayarı
- [ ] Grafik/Chart desteği
- [ ] Aylık/Yıllık karşılaştırma
- [ ] Saha bazında analiz
- [ ] Excel export ile entegrasyon
- [ ] Email gönderimi

---

**Geliştirici**: Solarveyo Ekipi  
**Versiyon**: 1.0.0  
**Tarih**: 5 Ekim 2025


