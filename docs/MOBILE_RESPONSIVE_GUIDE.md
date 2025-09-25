# 📱 SolarVeyo - Mobil Uyumluluk Rehberi

## ✅ Mobil Uyumlu Sayfalar

### 1. Dashboard (`/dashboard`)
- **Grid Yapısı**: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`
- **Kartlar**: Mobilde tek kolon, tablet'te 2, desktop'ta 3 kolon
- **Grafikler**: Responsive container ile otomatik boyutlandırma
- **Hava Durumu**: Mobilde gizlenen detaylar

### 2. Arızalar (`/arizalar`)
- **Tablo**: `overflow-x-auto` ile yatay kaydırma
- **Filtreler**: Mobilde dikey dizilim
- **Kartlar**: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`
- **Modal**: Mobilde tam ekran

### 3. Bakım (`/bakim`)
- **Tab Menü**: Mobilde kaydırılabilir
- **Formlar**: Tek kolon düzeni
- **Listeler**: Mobilde kompakt görünüm
- **Tarih Seçici**: Touch-friendly

### 4. GES Yönetimi (`/ges`)
- **Santral Kartları**: `grid-cols-1 md:grid-cols-2 xl:grid-cols-3`
- **Detay Modal**: Mobilde bottom sheet tarzı
- **Harita**: Tam genişlik, touch kontrolü
- **İstatistikler**: Mobilde dikey dizilim

### 5. İzin Yönetimi (`/izin`)
- **Tablo Optimizasyonu**:
  - Mobilde gizlenen kolonlar (İzin Tipi, Gün sayısı)
  - Kompakt tarih gösterimi
  - Küçük padding ve font
- **İstatistik Kartları**: `grid-cols-1 md:grid-cols-4`
- **Filtreler**: `grid-cols-1 md:grid-cols-4`
- **Excel Butonu**: Sadece yetkili rollerde görünür

### 6. Ekip Yönetimi (`/ekip`)
- **Kullanıcı Kartları**: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`
- **Detay Modal**: Responsive form düzeni
- **Arama**: Mobilde tam genişlik
- **Rol Filtreleri**: Dropdown menü

### 7. Sahalar (`/sahalar`)
- **Harita Görünümü**: Mobilde tam ekran
- **Kart/Tablo Toggle**: Mobilde sadece kart görünümü
- **Müşteri Listesi**: Accordion tarzı

### 8. Stok Kontrol (`/stok`)
- **Stok Kartları**: Responsive grid
- **Hareket Tablosu**: Yatay kaydırma
- **Filtreler**: Mobilde collapsible

### 9. Vardiya Bildirimleri (`/vardiya`)
- **4 Adımlı Form**: Mobilde tek sayfa
- **Fotoğraf Yükleme**: Touch-friendly
- **Konum Seçimi**: Mobil GPS entegrasyonu

### 10. Envanter (`/envanter`)
- **Ekipman Listesi**: Kart görünümü
- **QR Kod**: Mobilde büyük boyut
- **Detaylar**: Bottom sheet

## 🎨 Responsive Design Patterns

### Breakpoint'ler
```css
- sm: 640px   (Küçük tablet)
- md: 768px   (Tablet)
- lg: 1024px  (Küçük laptop)
- xl: 1280px  (Desktop)
- 2xl: 1536px (Büyük ekran)
```

### Grid Sistemleri
```tsx
// Mobil First Yaklaşım
<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">

// Responsive Spacing
<div className="p-4 sm:p-6 lg:p-8">

// Conditional Display
<div className="hidden sm:block"> // Mobilde gizli
<div className="block sm:hidden"> // Sadece mobilde
```

### Tablo Optimizasyonu
```tsx
// Yatay Kaydırma
<div className="overflow-x-auto -mx-4 sm:mx-0">
  <table className="min-w-[640px]">

// Responsive Kolonlar
<th className="hidden sm:table-cell"> // Mobilde gizli kolon
<td className="px-3 sm:px-6"> // Responsive padding
```

### Form Düzenleri
```tsx
// Dikey/Yatay Geçiş
<div className="flex flex-col sm:flex-row gap-4">

// Responsive Input
<input className="w-full text-base" /> // iOS zoom önleme (16px)
```

### Modal/Dialog
```tsx
// Mobilde Bottom Sheet
@media (max-width: 639px) {
  .modal-content {
    position: fixed;
    bottom: 0;
    border-radius: 1rem 1rem 0 0;
  }
}
```

## 📱 Touch Optimizasyonları

### Minimum Touch Target
- **44x44px** minimum dokunma alanı
- Butonlar için `min-h-[44px]` kullanımı
- İkonlar için padding ekleme

### Swipe Desteği
```css
.swipeable {
  scroll-snap-type: x mandatory;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}
```

### Safe Area (iPhone Notch)
```css
.safe-area {
  padding-top: env(safe-area-inset-top);
  padding-bottom: env(safe-area-inset-bottom);
}
```

## 🚀 Performans İyileştirmeleri

### Lazy Loading
- Görseller için `loading="lazy"`
- Büyük listeler için virtual scrolling
- Route-based code splitting

### CSS Optimizasyonu
- Tailwind purge kullanımı
- Critical CSS inline
- Animasyonlar için `will-change`

### Font Optimizasyonu
```css
/* iOS Zoom Önleme */
input, textarea, select {
  font-size: 16px; /* Minimum 16px */
}
```

## 🐛 Bilinen Sorunlar ve Çözümler

### iOS Safari
- Input zoom sorunu → `font-size: 16px`
- Bounce scroll → `overscroll-behavior: none`
- 100vh sorunu → CSS custom properties

### Android Chrome
- Address bar gizlenme → `min-height: 100vh`
- Touch delay → `touch-action: manipulation`

## 📊 Test Edilmiş Cihazlar

### iOS
- ✅ iPhone SE (375px)
- ✅ iPhone 12/13 (390px)
- ✅ iPhone 14 Pro Max (430px)
- ✅ iPad Mini (768px)
- ✅ iPad Pro (1024px)

### Android
- ✅ Samsung Galaxy S21 (384px)
- ✅ Pixel 5 (393px)
- ✅ Samsung Galaxy Tab (800px)

## 🔧 Geliştirici Notları

### Responsive Test Komutları
```bash
# Chrome DevTools Device Mode
# Ctrl+Shift+M (Windows/Linux)
# Cmd+Shift+M (Mac)

# Responsive breakpoint'leri test et
# sm: 640px, md: 768px, lg: 1024px, xl: 1280px
```

### Tailwind Utilities
```tsx
// Mobil öncelikli yaklaşım
className="text-sm md:text-base lg:text-lg"

// Conditional rendering
className="block md:hidden" // Sadece mobil/tablet
className="hidden md:block" // Desktop only

// Responsive spacing
className="p-2 sm:p-4 md:p-6 lg:p-8"
```

## ✅ Checklist

- [ ] Tüm sayfalar 320px genişlikte test edildi
- [ ] Touch target'lar minimum 44px
- [ ] Formlar iOS zoom yapmıyor
- [ ] Tablolar yatay kaydırılabilir
- [ ] Modal'lar mobilde bottom sheet
- [ ] Görseller responsive ve lazy load
- [ ] Font boyutları okunabilir (min 14px)
- [ ] Butonlar touch-friendly
- [ ] Navigation mobilde hamburger menü
- [ ] Safe area padding eklendi

---

**Son Güncelleme**: Ocak 2024
**Versiyon**: 2.0.0
