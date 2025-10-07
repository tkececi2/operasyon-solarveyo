# 📄 Profesyonel PDF Rapor Sistemi

## 🎯 Genel Bakış

Arızalar, bakım, elektrik kesintileri, üretim verileri ve stok kontrol için profesyonel, sayfalanmış ve detaylı PDF export sistemi.

## ✨ Özellikler

### 1. **Profesyonel Tasarım**
- ✅ Şirket logolu header
- ✅ Sayfa numaralandırma
- ✅ Tarih damgası footer
- ✅ Renkli durum ve öncelik badge'leri
- ✅ Modern ve temiz görünüm

### 2. **Sayfalama Sistemi**
- ✅ Her arıza ayrı sayfada
- ✅ İçerik ortadan kesilmez
- ✅ Otomatik sayfa geçişi
- ✅ Dinamik yükseklik hesaplaması

### 3. **Detaylı İçerik**
- ✅ Özet istatistikler sayfası
  - Durum dağılımı (Açık, Devam Ediyor, Beklemede, Çözüldü)
  - Öncelik dağılımı (Kritik, Yüksek, Normal, Düşük)
  - Toplam arıza sayısı
  - Aktif filtreler
- ✅ Arıza detayları
  - Başlık ve numara
  - Durum ve öncelik badge'leri
  - Santral ve saha bilgisi
  - Raporlayan kişi
  - Tarih bilgileri
  - Açıklama (word wrap)
  - Çözüm açıklaması (varsa)
  - Fotoğraf placeholder'ları

### 4. **Akıllı Filtreler**
- ✅ Yıl ve ay filtreleme
- ✅ Durum filtreleme
- ✅ Öncelik filtreleme
- ✅ Saha filtreleme
- ✅ Filtre özeti PDF'e dahil

## 📁 Dosya Yapısı

```
src/
├── utils/
│   └── pdfReportUtils.ts      # Ana PDF utility (tüm modüller için)
└── pages/
    ├── ariza/
    │   ├── Arizalar.tsx                # Arıza entegrasyonu
    │   └── ElektrikKesintileri.tsx     # Elektrik kesinti entegrasyonu
    ├── bakim/
    │   └── Bakim.tsx                   # Bakım entegrasyonu
    ├── ges/
    │   └── UretimVerileri.tsx          # Üretim verileri entegrasyonu
    └── stok/
        └── StokKontrol.tsx             # Stok kontrol entegrasyonu
```

## 🔧 Kullanım

### 1. Arıza Sayfasından Export

```typescript
// Arizalar.tsx içinde
const handleExportPdf = async () => {
  await exportArizalarToPDF({
    arizalar: items,              // Arıza listesi
    company: company,             // Şirket bilgisi
    santralMap: santralMap,       // Santral mapping
    raporlayanMap: raporlayanMap, // Raporlayan mapping
    filters: {                    // Aktif filtreler
      year: filterYear,
      month: filterMonth,
      status: durumFilter,
      priority: oncelikFilter,
      saha: selectedSaha
    }
  });
};
```

### 2. Stok Kontrol Sayfasından Export

```typescript
// StokKontrol.tsx içinde
const handlePdfExport = async () => {
  const loadingToast = toast.loading('PDF raporu indiriliyor...', {
    duration: Infinity
  });

  try {
    // Saha ve santral map'lerini oluştur
    const sahaMap: Record<string, { id: string; ad: string }> = {};
    sahalar.forEach(saha => {
      sahaMap[saha.id] = { id: saha.id, ad: saha.ad };
    });

    const santralMapForPDF: Record<string, { id: string; ad: string }> = {};
    santraller.forEach(santral => {
      santralMapForPDF[santral.id] = { id: santral.id, ad: santral.ad };
    });

    // Profesyonel PDF oluştur
    await exportStokToPDF({
      stoklar: filteredStoklar,
      company: company,
      sahaMap: sahaMap,
      santralMap: santralMapForPDF,
      filters: {
        category: categoryFilter !== 'all' ? categoryFilter : undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        saha: sahaFilter !== 'all' && sahaFilter !== '' ? sahaFilter : undefined
      }
    });

    // PDF indirme işleminin tamamlanması için bekle
    await new Promise(resolve => setTimeout(resolve, 2500));
    
    toast.dismiss(loadingToast);
    toast.success('PDF raporu indirildi');
  } catch (error) {
    console.error('PDF oluşturma hatası:', error);
    toast.dismiss(loadingToast);
    toast.error('PDF oluşturulamadı');
  }
};
```

### Parametreler

```typescript
interface PDFReportOptions {
  arizalar: Fault[];                    // ZORUNLU: Arıza listesi
  company?: Company | null;             // Şirket bilgisi (logo, ad)
  santralMap?: Record<string, {         // Santral ID -> Ad mapping
    id: string;
    ad: string;
  }>;
  raporlayanMap?: Record<string, {      // Raporlayan ID -> Ad mapping
    ad: string;
    fotoURL?: string;
  }>;
  filters?: {                           // Filtre bilgileri (özet için)
    year?: number | 'all';
    month?: number | 'all';
    status?: string;
    priority?: string;
    saha?: string;
  };
}
```

## 🎨 Özelleştirme

### Renkler

```typescript
const COLORS = {
  primary: '#2563EB',      // Ana renk (header, vurgular)
  secondary: '#64748B',    // İkincil renk (metinler)
  success: '#10B981',      // Başarı (çözülmüş)
  warning: '#F59E0B',      // Uyarı (devam ediyor)
  danger: '#EF4444',       // Hata (açık, kritik)
  gray: '#94A3B8',         // Gri (beklemede, düşük)
  lightGray: '#F1F5F9',    // Açık gri (arka plan)
  dark: '#1E293B',         // Koyu (başlıklar)
};
```

### Sayfa Boyutları

```typescript
const PAGE_WIDTH = 210;        // A4 genişlik (mm)
const PAGE_HEIGHT = 297;       // A4 yükseklik (mm)
const MARGIN = 15;             // Sayfa kenar boşluğu (mm)
const HEADER_HEIGHT = 25;      // Header yüksekliği (mm)
const FOOTER_HEIGHT = 10;      // Footer yüksekliği (mm)
```

## 🖼️ Sayfa Düzeni

### 1. Özet Sayfası
```
┌─────────────────────────────┐
│   HEADER (Şirket Logosu)    │
├─────────────────────────────┤
│                             │
│   Özet İstatistikler        │
│   ┌───┬───┬───┬───┐         │
│   │ A │ D │ B │ Ç │         │ Durum kutuları
│   └───┴───┴───┴───┘         │
│                             │
│   Öncelik Dağılımı          │
│   ┌───┬───┬───┬───┐         │
│   │ K │ Y │ N │ D │         │ Öncelik kutuları
│   └───┴───┴───┴───┘         │
│                             │
│   ┌─────────────────────┐   │
│   │ Toplam: 45 Arıza    │   │ Toplam kutusu
│   └─────────────────────┘   │
│                             │
│   Filtreler: ...            │ Aktif filtreler
│                             │
├─────────────────────────────┤
│   FOOTER (Tarih, Sayfa)     │
└─────────────────────────────┘
```

### 2. Arıza Detay Sayfası
```
┌─────────────────────────────┐
│   HEADER (Şirket Logosu)    │
├─────────────────────────────┤
│                             │
│ ┌─────────────────────────┐ │
│ │ Arıza Başlığı       #12 │ │ Başlık çubuğu
│ └─────────────────────────┘ │
│                             │
│ [Açık] [Kritik]             │ Badge'ler
│                             │
│ Santral: Santral 1          │
│ Saha: Saha A                │
│ Raporlayan: Mehmet Yılmaz   │
│ Tarih: 05.10.2025 14:30     │
│ Çözüm Tarihi: 06.10.2025    │
│                             │
│ Açıklama:                   │
│ Lorem ipsum dolor sit...    │ Word-wrapped metin
│ amet consectetur...         │
│                             │
│ Çözüm:                      │
│ Problem çözüldü...          │
│                             │
│ Fotoğraflar:                │
│ ┌───┬───┬───┐               │
│ │ 1 │ 2 │ 3 │               │ Fotoğraf grid
│ └───┴───┴───┘               │
│                             │
├─────────────────────────────┤
│   FOOTER (Tarih, Sayfa)     │
└─────────────────────────────┘
```

## 🚀 Performans Optimizasyonları

1. **Raporlayan Mapping**: 
   - Her arıza için ayrı ayrı sorgulamak yerine
   - Tek seferde tüm raporlayanları map'e dönüştürüp cache'ler

2. **Fotoğraf Yükleme**: 
   - Performans için şimdilik placeholder kullanılıyor
   - Gerçek fotoğraf yüklemek isterseniz `loadImage()` fonksiyonunu aktive edin

3. **Sayfa Hesaplaması**:
   - Dinamik yükseklik hesaplaması
   - Sayfa taşmalarını otomatik yönetir

## 📊 Örnek Çıktı

**Dosya Adı**: `ariza_raporu_20251005_143022.pdf`

**İçerik**:
- Sayfa 1: Özet İstatistikler
- Sayfa 2+: Her arıza ayrı sayfa(lar)da

## 🔄 Güncelleme Notları

### v2.0.0 (2025-10-07)
- ✅ Stok kontrol raporu eklendi
- ✅ Tüm modüller için unified sistem
- ✅ Elektrik kesintileri desteği
- ✅ Bakım raporları (Elektrik, Mekanik, Yapılan İşler)
- ✅ Üretim verileri raporları

### v1.0.0 (2025-10-05)
- ✅ İlk sürüm
- ✅ Özet istatistikler sayfası
- ✅ Arıza detay sayfaları
- ✅ Sayfalama sistemi
- ✅ Filtre desteği
- ✅ Türkçe karakter desteği
- ✅ Renkli badge'ler

## 🎯 Gelecek Özellikler

- [ ] Gerçek fotoğraf yükleme (optional)
- [ ] Grafik/Chart desteği
- [ ] Excel export ile entegrasyon
- [ ] Email gönderimi
- [ ] Toplu PDF export (birden fazla rapor)
- [ ] PDF preview (indirmeden önce görüntüleme)
- [ ] Özel şablon desteği
- [ ] Logo upload ve kullanımı

## 🐛 Bilinen Sorunlar

1. **Fotoğraf Yükleme**: Şu anda placeholder kullanılıyor, gerçek fotoğraf yükleme performans için kapalı
2. **Sayfa Numarası**: İlk sayfa için toplam sayfa sayısı tahmini (yaklaşık)

## 💡 İpuçları

1. **Büyük Veri Setleri**: 100+ arıza için PDF oluşturma 5-10 saniye sürebilir
2. **Filtreler**: PDF'i indirmeden önce filtreleri uygulayın
3. **Tarih Formatı**: Türkçe tarih formatı kullanılır (dd.MM.yyyy HH:mm)
4. **Renkler**: Brand renklerinize göre COLORS sabitlerini düzenleyin

## 📞 Destek

Sorun veya öneriniz varsa proje README'sine bakın veya issue açın.

---

**Geliştirici**: Solarveyo Ekibi  
**Versiyon**: 2.0.0  
**Tarih**: 7 Ekim 2025


