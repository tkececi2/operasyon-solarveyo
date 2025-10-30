# 📺 Video Rehber Bölümü Kullanım Kılavuzu

## ✨ Eklenen Özellikler

Home sayfanıza (Marketing) **profesyonel video rehber bölümü** eklendi!

### 🎯 Özellikler

✅ **10 Kategorize Video** - Başlangıç, İşlemler, İleri Seviye
✅ **Filtreleme Sistemi** - Kategoriye göre video gösterimi
✅ **YouTube Entegrasyonu** - Modal ile video oynatma
✅ **Responsive Tasarım** - Mobil ve desktop uyumlu
✅ **Animasyonlar** - Framer Motion ile smooth geçişler
✅ **Modern UI** - Gradient renkler ve hover efektleri

---

## 🎬 Video ID'lerini Güncelleme

### 1. YouTube Video ID'sini Bulma

YouTube'da videonuzu açın. URL'den ID'yi alın:
```
https://www.youtube.com/watch?v=dQw4w9WgXcQ
                                 ↑↑↑↑↑↑↑↑↑↑↑
                                Bu kısım Video ID
```

### 2. Home.tsx Dosyasını Düzenleme

**Dosya:** `src/pages/marketing/Home.tsx`

**Satırlar:** 970-1051 (VideoGuide bölümünde)

```typescript
const videos = [
  {
    id: 'YOUR_VIDEO_ID_1', // ← Buraya kendi video ID'nizi yazın
    title: 'Platform Tanıtımı ve Genel Bakış',
    description: 'SolarVeyo platformunu keşfedin, temel özellikleri öğrenin',
    duration: '3:45', // ← Video süresini güncelleyin
    category: 'basics',
    thumbnail: 'https://img.youtube.com/vi/YOUR_VIDEO_ID_1/maxresdefault.jpg'
  },
  // ... diğer videolar
];
```

### 3. Her Video İçin Güncelleme

10 video için şu alanları güncelleyin:

| Alan | Açıklama | Örnek |
|------|----------|-------|
| `id` | YouTube video ID'si | `dQw4w9WgXcQ` |
| `title` | Video başlığı | `Arıza Kaydı Nasıl Açılır?` |
| `description` | Kısa açıklama | `Adım adım arıza bildirimi...` |
| `duration` | Video süresi | `4:15` |
| `category` | Kategori (`basics`, `operations`, `advanced`) | `operations` |

---

## 📂 Video Kategorileri

### 1. Başlangıç (basics)
- Platform Tanıtımı
- İlk Giriş ve Kullanıcı Ayarları
- Mobil Uygulama Kullanımı

### 2. İşlemler (operations)
- Arıza Kaydı Açma
- Bakım Kaydı Oluşturma
- Santral Yönetimi
- Vardiya Bildirimi

### 3. İleri Seviye (advanced)
- Ekip Yönetimi
- Rapor Oluşturma
- Stok Yönetimi

---

## 🎨 Tasarım Detayları

### Renkler
- **Aktif Kategori:** Blue-Sky Gradient
- **Video Kartları:** Beyaz arka plan, gölge efektli
- **Play Butonu:** YouTube kırmızısı (#FF0000)
- **Hover:** Shadow ve transform animasyonları

### Layout
- **Desktop:** 3 kolon grid
- **Tablet:** 2 kolon grid
- **Mobil:** 1 kolon

### Animasyonlar
- Scroll-triggered fade-in
- Hover transform ve scale
- Modal smooth açılma/kapanma

---

## 🔧 Teknik Detaylar

### VideoModal Güncellemeleri
```typescript
<VideoModal 
  open={showVideo} 
  onClose={() => setShowVideo(false)} 
  videoId={currentVideoId}      // ← Dinamik video ID
  title={currentVideoTitle}      // ← Dinamik başlık
/>
```

### State Yönetimi
```typescript
const [showVideo, setShowVideo] = useState(false);
const [currentVideoId, setCurrentVideoId] = useState<string>('dQw4w9WgXcQ');
const [currentVideoTitle, setCurrentVideoTitle] = useState<string>('Demo Video');

const handleVideoClick = (videoId: string, title: string) => {
  setCurrentVideoId(videoId);
  setCurrentVideoTitle(title);
  setShowVideo(true);
};
```

---

## 📍 Bölüm Konumu

Video rehber bölümü **Stats** ve **SectorFit** arasına eklendi:

```
<Hero />
<ProductsShowcase />
<Stats />
<VideoGuide /> ← Yeni eklenen bölüm
<SectorFit />
<FeatureShowcase />
...
```

---

## ✅ Hızlı Başlangıç

1. **Video ID'lerini Değiştirin:**
   - `src/pages/marketing/Home.tsx` dosyasını açın
   - Satır 970-1051 arası `videos` array'ini bulun
   - Her video için `id` alanını güncelleyin

2. **Video Bilgilerini Düzenleyin:**
   - `title`: Görünen başlık
   - `description`: Alt açıklama
   - `duration`: Video süresi (ör: "3:45")

3. **Test Edin:**
   - Tarayıcıda home sayfasını açın
   - Video kartlarına tıklayın
   - Modal'da video oynatılmasını kontrol edin

---

## 🎯 Örnek Video Listesi

İşte platformunuz için önerilen 10 video:

1. ✨ **Platform Tanıtımı** (3-5 dk) - Genel bakış
2. 🔐 **İlk Giriş** (2-3 dk) - Kayıt ve login
3. ⚠️ **Arıza Kaydı** (4-5 dk) - Arıza açma süreci
4. 🔧 **Bakım Kaydı** (3-4 dk) - Bakım planlama
5. ⚡ **Santral Yönetimi** (5-6 dk) - GES ekleme/düzenleme
6. 👥 **Ekip Yönetimi** (4-5 dk) - Kullanıcı ve rol yönetimi
7. 🕐 **Vardiya Sistemi** (3-4 dk) - Vardiya oluşturma
8. 📊 **Rapor Oluşturma** (4-5 dk) - PDF export ve raporlar
9. 📦 **Stok Kontrolü** (3-4 dk) - Malzeme yönetimi
10. 📱 **Mobil Uygulama** (5-6 dk) - iOS/Android kullanımı

---

## 🚀 Sonraki Adımlar

- [ ] YouTube'da 10 eğitim videosu çekin
- [ ] Video ID'lerini güncelleyin
- [ ] Video sürelerini kontrol edin
- [ ] Başlık ve açıklamaları optimize edin
- [ ] SEO için video meta bilgilerini ekleyin
- [ ] Google Analytics ile video izleme trackleyin

---

## 💡 İpuçları

### Video Çekimi İçin
- ✅ Kısa ve öz tutun (3-5 dakika)
- ✅ Net ses kalitesi kullanın
- ✅ Ekran kaydı + sesli anlatım
- ✅ Intro/outro ekleyin
- ✅ Thumbnail'ları özelleştirin

### YouTube Optimizasyonu
- ✅ Açıklama kısmına zaman damgaları ekleyin
- ✅ İlgili hashtag'ler kullanın (#SolarVeyo #GES)
- ✅ Playlist oluşturun
- ✅ Altyazı ekleyin (Türkçe + İngilizce)

---

## 🎨 Özelleştirme

### Kategori Ekleme
```typescript
const videoCategories = [
  { id: 'all', label: 'Tümü', icon: <Grid3X3 /> },
  { id: 'basics', label: 'Başlangıç', icon: <BookOpen /> },
  { id: 'operations', label: 'İşlemler', icon: <Settings /> },
  { id: 'advanced', label: 'İleri Seviye', icon: <Monitor /> },
  // Yeni kategori ekleyin:
  { id: 'reports', label: 'Raporlar', icon: <BarChart3 /> },
];
```

### Renk Değiştirme
Tailwind sınıflarını güncelleyin:
- `from-blue-600 to-sky-500` → Gradient renkler
- `bg-red-600` → Play button rengi
- `text-blue-600` → Hover renkleri

---

## 📞 Destek

Sorularınız için:
- 📧 Email: support@solarveyo.com
- 💬 WhatsApp: +90 XXX XXX XXXX
- 🌐 Website: www.solarveyo.com

---

**Son Güncelleme:** 30 Ekim 2025
**Versiyon:** 2.0.0
**Durum:** ✅ Aktif ve Kullanıma Hazır


