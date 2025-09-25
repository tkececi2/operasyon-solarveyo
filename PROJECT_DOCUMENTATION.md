# Solar Enerji Santralı Yönetim Sistemi - KAPSAMLI MULTI-ŞİRKET SaaS PLATFORMU

## 🚀 PROJE KURULUMU

### Tech Stack
- **Frontend:** Vite + React 18 + TypeScript (strict mode)
- **Backend:** Firebase v10+ (Auth, Firestore, Storage, Functions)
- **Styling:** Tailwind CSS v3+ + Headless UI + Tremor (charts)
- **Routing:** React Router v6
- **Forms:** React Hook Form + Zod validation
- **UI Components:** React Hot Toast + Lucide Icons + Framer Motion
- **Utilities:** Date-fns (Turkish locale) + jsPDF + XLSX export
- **State Management:** React Query (cache management)

## 📁 KLASÖR YAPISI

```
src/
├── components/
│   ├── ui/           (Button, Card, Modal, Input, LoadingSpinner)
│   ├── forms/        (ArizaForm, BakimForm, VardiyaForm)
│   ├── layouts/      (Layout, Sidebar, MobileSidebar, Header)
│   ├── charts/       (Dashboard grafikleri, Tremor charts)
│   ├── modals/       (DetailModal, ConfirmModal, InviteModal)
│   └── smart/        (AI components, anomaly detection)
├── pages/
│   ├── auth/         (Login, Register, HomePage)
│   ├── dashboard/    (Dashboard, SuperAdminDashboard)
│   ├── ariza/        (Arizalar, ArizaDetay)
│   ├── bakim/        (MekanikBakim, ElektrikBakim, YapilanIsler)
│   ├── ges/          (GesYonetimi, UretimVerileri, InvertorKontrol)
│   ├── saha/         (Sahalar, GesSahalari, Musteriler)
│   ├── ekip/         (Ekip, InviteUser, Ayarlar)
│   ├── stok/         (StokKontrol)
│   ├── vardiya/      (VardiyaBildirimler, NobetKontrol)
│   ├── raporlar/     (Raporlar, FinansalAnaliz, AylikRapor)
│   └── settings/     (CompanySettings)
├── services/         (authService, storageService, aiService, reportService)
├── hooks/            (useAuth, useCompany, useRealtime, useNotifications)
├── contexts/         (AuthContext, CompanyContext, NotificationContext)
├── types/            (tüm TypeScript interfaces)
├── utils/            (formatters, validators, helpers, exportUtils)
└── lib/              (firebase config, ai helpers)
```

## 👥 ROLLER VE DETAYLI YETKİLER

### 1. SuperAdmin
- Tüm şirketleri görür ve yönetir
- Abonelik durumlarını değiştirir (deneme, ödendi, sürebitti)
- Sistem geneli istatistikleri
- Ödeme takibi ve faturalama
- Şirket silme/dondurma

### 2. Yönetici
- Şirket içi tam erişim
- Ekip üyesi ekleme/çıkarma/rol değiştirme
- Müşteri ve saha yönetimi
- Tüm raporları görüntüleme ve export
- Şirket ayarları ve logo değiştirme
- Finansal analizler

### 3. Mühendis
- Teknik analiz ve planlama
- Bakım programı oluşturma ve onaylama
- Üretim veri analizi ve anomali tespiti
- AI bakım tavsiyeleri görüntüleme
- Detaylı teknik raporlar
- Arıza çözüm onayı

### 4. Tekniker
- Arıza müdahale ve çözüm kaydetme
- Bakım işlemleri gerçekleştirme ve kaydetme
- Fotoğraf yükleme (önce/sonra)
- Saha kontrolleri ve ölçümler
- İnvertör kontrolleri
- Stok kullanım kaydı

### 5. Müşteri
- Sadece atandığı sahaları görüntüleme
- Kendi sahalarının arızalarını takip
- Üretim verilerini ve performansı görme
- Aylık/yıllık raporları indirme
- Finansal analiz (kendi sahaları)

### 6. Bekçi
- Vardiya bildirimleri oluşturma (sabah/akşam)
- Güvenlik raporları ve fotoğraf ekleme
- Nöbet kontrolleri (GPS konum ile)
- Acil durum bildirimleri
- Saha durumu raporlama

## 📊 ANA MODÜLLER VE DETAYLI ÖZELLİKLER

### 1. DASHBOARD & ANALYTICS
- Rol bazlı KPI widget'ları
- Aktif arıza sayısı ve durumları
- Günlük/aylık/yıllık üretim grafikleri
- Bakım programı durumu ve uyarıları
- Finansal özet (gelir, tasarruf)
- Son aktiviteler timeline'ı
- Gerçek zamanlı bildirimler
- Hava durumu entegrasyonu

### 2. ARIZA YÖNETİMİ
- Arıza kaydı (başlık, açıklama, öncelik, konum, fotoğraf)
- Durum takibi (açık, devam ediyor, beklemede, çözüldü)
- Çözüm kaydetme ve fotoğraf ekleme
- Otomatik müşteri email bildirimi
- Arıza geçmişi ve istatistikler
- Kritik arıza uyarıları
- Arıza kategorileri ve filtreleme
- Çözüm süresi analizi

### 3. BAKIM SİSTEMİ

#### Elektrik Bakım:
- OG sistemleri kontrolü (14 kontrol noktası)
- Trafo kontrolleri ve ölçümler
- AG dağıtım panosu kontrolleri
- İnvertör detaylı kontrolleri
- PV modül kontrolleri ve ölçümler
- Kontrol listesi ve sonuç kaydetme

#### Mekanik Bakım:
- Panel temizliği ve kontrolleri
- Yapısal kontroller (çelik konstrüksiyon)
- Kablo kontrolleri ve izolasyon
- Güvenlik ekipmanları kontrolü
- Montaj elemanları kontrolleri

#### Bakım Planlama:
- Periyodik bakım takvimi
- Bakım geçmişi ve raporları
- AI destekli bakım tavsiyeleri
- Bakım maliyeti takibi

### 4. GES YÖNETİMİ
- Santral listesi ve detaylı bilgileri
- Kapasite ve konum bilgileri
- Müşteri atamaları ve izinleri
- Santral performans analizi
- Toplu veri import (Excel)
- Santral karşılaştırma

### 5. ÜRETİM TAKİBİ & ANALİZ
- Günlük üretim veri girişi
- Aylık/yıllık karşılaştırmalar
- Hedef vs gerçekleşen analizi
- Verimlilik analizleri ve grafikler
- Anomali tespit sistemi (AI)
- Hava koşulları etkisi analizi
- CO2 tasarrufu hesaplaması

### 6. SAHA/MÜŞTERİ YÖNETİMİ
- Müşteri kayıtları ve profilleri
- Saha atamaları ve izin yönetimi
- İletişim bilgileri ve notlar
- Sözleşme bilgileri ve dökümanlar
- Müşteri portal erişimi

### 7. EKİP YÖNETİMİ
- Kullanıcı ekleme/çıkarma (email davet)
- Rol atamaları ve yetki yönetimi
- Saha/santral erişim izinleri
- Ekip performans takibi
- Çalışma saatleri kayıtları

### 8. STOK KONTROL & ENVANTER
- Malzeme kayıtları ve kategorileri
- Stok seviyeleri ve minimum uyarıları
- Saha bazlı envanter yönetimi
- Kullanım geçmişi ve hareketler
- Malzeme talep sistemi
- Tedarikçi bilgileri

### 9. VARDİYA & GÜVENLİK
- Bekçi vardiya bildirimleri (sabah/akşam)
- GPS konum doğrulama
- Güvenlik durumu raporları
- Acil durum bildirimleri
- Nöbet kontrol saatleri
- Fotoğraf ekleme zorunluluğu

### 10. RAPORLAMA & EXPORT
- Aylık kapsamlı raporlar (PDF)
- Finansal analiz raporları
- Excel export (tüm veriler)
- Grafik ve çizelge raporları
- Email ile otomatik rapor gönderimi
- Özelleştirilebilir rapor şablonları

### 11. AKILLI ÖZELLİKLER (AI)
- Panel ömür tahmini algoritması
- Üretim anomali tespit sistemi
- Akıllı bakım asistanı (chatbot)
- Performans optimizasyon tavsiyeleri
- Arıza tahmin sistemi
- Maliyet optimizasyon analizi

## 🏢 MULTİ-ŞİRKET YAPISI

### Company Management:
- Şirket kayıt ve onay sistemi
- Abonelik durumu (deneme 30 gün, ödendi, sürebitti)
- Kullanıcı sayısı limitleri
- Özellik kısıtlamaları (abonelik bazlı)
- Şirket ayarları (logo, tema, bildirim tercihleri)

### Data Isolation:
- Her kayıt companyId ile etiketlenir
- Firestore queries companyId filtresi
- Security rules companyId kontrolü
- SuperAdmin bypass yetkisi
- Cross-company veri paylaşımı yasak

### Subscription Features:
- Deneme süresi takibi ve uyarıları
- Ödeme durumu göstergeleri
- Kullanıcı sayısı limiti kontrolü
- Özellik kısıtlamaları (rapor sayısı, storage limiti)

## 🗄️ FİREBASE COLLECTIONS ŞEMASI

### companies
```javascript
{
  id: string,
  name: string,
  logo?: string,
  slogan?: string,
  address?: string,
  phone?: string,
  email?: string,
  website?: string,
  subscriptionStatus: 'active' | 'expired' | 'trial',
  isActive: boolean,
  createdAt: Timestamp,
  createdBy: string,
  settings: {
    theme: string,
    language: string,
    notificationSettings: object
  }
}
```

### kullanicilar
```javascript
{
  id: string,
  companyId: string,
  email: string,
  ad: string,
  telefon?: string,
  rol: 'superadmin' | 'yonetici' | 'muhendis' | 'tekniker' | 'musteri' | 'bekci',
  sahalar: string[] | object, // Atandığı saha ID'leri
  odemeDurumu: 'deneme' | 'odendi' | 'beklemede' | 'surebitti',
  denemeSuresiBaslangic?: Timestamp,
  denemeSuresiBitis?: Timestamp,
  emailVerified: boolean,
  fotoURL?: string,
  olusturmaTarihi: Timestamp,
  guncellenmeTarihi: Timestamp
}
```

### santraller
```javascript
{
  id: string,
  companyId: string,
  musteriId?: string,
  ad: string,
  kapasite: number, // MW
  kurulumTarihi: Timestamp,
  konum: { lat: number, lng: number },
  adres: string,
  yillikHedefUretim: number,
  elektrikFiyati: number,
  dagitimBedeli: number,
  olusturmaTarihi: Timestamp
}
// Alt koleksiyon: aylikUretim/{yil}
```

### arizalar
```javascript
{
  id: string,
  companyId: string,
  santralId: string,
  saha: string,
  baslik: string,
  aciklama: string,
  durum: 'acik' | 'devam-ediyor' | 'beklemede' | 'cozuldu',
  oncelik: 'dusuk' | 'normal' | 'yuksek' | 'kritik',
  konum?: string,
  fotograflar: string[],
  cozumAciklamasi?: string,
  cozumFotograflari?: string[],
  raporlayanId: string,
  atananKisi?: string,
  olusturmaTarihi: Timestamp,
  guncellenmeTarihi: Timestamp,
  cozumTarihi?: Timestamp
}
```

### elektrikBakimlar
```javascript
{
  id: string,
  companyId: string,
  santralId: string,
  sahaId: string,
  tarih: Timestamp,
  yapanKisi: string,
  kontroller: {
    ogSistemleri: object, // 14 kontrol noktası
    trafolar: object,
    agDagitimPanosu: object,
    invertorler: object,
    toplamaKutulari: object,
    pvModulleri: object
  },
  genelDurum: 'iyi' | 'orta' | 'kotu',
  notlar?: string,
  fotograflar: string[],
  olusturmaTarihi: Timestamp
}
```

### mekanikBakimlar
```javascript
{
  id: string,
  companyId: string,
  santralId: string,
  sahaId: string,
  tarih: Timestamp,
  yapanKisi: string,
  kontroller: {
    panelTemizligi: object,
    yapiselKontroller: object,
    kablolar: object,
    guvenlikEkipmanlari: object,
    montajElemanlari: object
  },
  genelDurum: 'iyi' | 'orta' | 'kotu',
  notlar?: string,
  fotograflar: string[],
  olusturmaTarihi: Timestamp
}
```

### uretimVerileri
```javascript
{
  id: string,
  companyId: string,
  santralId: string,
  tarih: Timestamp,
  gunlukUretim: number, // kWh
  anlikGuc: number, // kW
  performansOrani: number, // %
  gelir: number, // TL
  dagitimBedeli: number, // TL
  tasarrufEdilenCO2: number, // kg
  hava: {
    sicaklik: number,
    nem: number,
    radyasyon: number
  },
  olusturanKisi: object,
  olusturmaTarihi: Timestamp
}
```

### stoklar
```javascript
{
  id: string,
  companyId: string,
  sahaId?: string,
  malzemeAdi: string,
  kategori: string,
  birim: string,
  mevcutStok: number,
  minimumStokSeviyesi: number,
  birimFiyat: number,
  tedarikci?: string,
  sonGuncelleme: Timestamp,
  olusturmaTarihi: Timestamp
}
```

### vardiyaBildirimleri
```javascript
{
  id: string,
  companyId: string,
  bekciId: string,
  bekciAdi: string,
  sahaId: string,
  santralId: string,
  tarih: Timestamp,
  vardiyaTipi: 'sabah' | 'aksam',
  durum: 'normal' | 'dikkat' | 'acil',
  acilDurum: boolean,
  aciklama: string,
  fotograflar: string[],
  konum?: { lat: number, lng: number },
  olusturmaTarihi: Timestamp
}
```

### yapilan-isler
```javascript
{
  id: string,
  companyId: string,
  sahaId: string,
  tarih: Timestamp,
  yapanKisi: string,
  isAciklamasi: string,
  kategori: 'bakim' | 'onarim' | 'kurulum' | 'kontrol',
  sure: number, // saat
  malzemeler: string[],
  fotograflar: string[],
  tamamlandiMi: boolean,
  notlar?: string,
  olusturmaTarihi: Timestamp
}
```

## 🤖 AKILLI ÖZELLİKLER (AI)

### Anomali Tespit Sistemi:
- Günlük üretim verilerinde anormal düşüşler
- Performans oranı analizi
- Hava koşulları normalize etme
- Otomatik uyarı sistemi

### Panel Ömür Tahmini:
- Performans degradasyon analizi
- Bakım geçmişi etkisi
- Çevresel faktör analizi
- Değiştirme önerileri

### Akıllı Bakım Asistanı:
- Chatbot arayüzü
- Bakım tavsiye algoritması
- Arıza tahmin sistemi
- Maliyet optimizasyon

### Bakım Tavsiye Sistemi:
- Son bakım tarihlerine göre öneri
- Kritik kontrol noktaları
- Bakım öncelik sıralaması
- Otomatik hatırlatmalar

## 📈 RAPORLAMA SİSTEMİ

### PDF Raporları:
- Aylık kapsamlı raporlar (jsPDF + html2canvas)
- Arıza analiz raporları
- Bakım geçmiş raporları
- Finansal analiz raporları
- Özelleştirilebilir şablonlar

### Excel Export:
- Tüm veri tabloları export
- Grafik ve pivot tablolar
- Finansal analiz sayfaları
- Otomatik formatlama

### Email Bildirimleri:
- Yeni arıza bildirimleri
- Arıza durum güncellemeleri
- Bakım hatırlatmaları
- Aylık rapor gönderimi

## ⚙️ TEKNİK REQ & PERFORMANS

### State Management:
- React Context (Auth, Company, Notifications)
- React Query (server state)
- LocalStorage (offline support)
- Real-time Firestore listeners

### Security:
- Firebase Security Rules (rol tabanlı)
- Email verification zorunlu
- Token refresh mekanizması
- File upload güvenlik kontrolleri
- XSS ve CSRF koruması

### Performance:
- Lazy loading (route ve component)
- Image optimization ve compression
- Infinite scroll (büyük listeler)
- Query optimization (pagination)
- Bundle splitting ve code splitting
- Service Worker (offline cache)

### File Management:
- Firebase Storage entegrasyonu
- Image resize ve compression
- Multiple file upload
- Progress indicators
- CORS konfigürasyonu
- Automatic cleanup (arıza silinince)

## 🎨 UI/UX ÖZELLİKLER

### Design System:
- Consistent card-based layouts
- Modern color palette (blue primary)
- Responsive breakpoints
- Loading skeletons
- Empty states
- Error boundaries

### Navigation:
- Collapsible sidebar
- Mobile responsive menu
- Breadcrumb navigation
- Role-based menu items
- Notification badges
- Quick access buttons

### Forms & Validation:
- React Hook Form + Zod
- Real-time validation
- File upload zones
- Date/time pickers
- Multi-select components
- Form auto-save

### Tables & Lists:
- Sortable columns
- Advanced filtering
- Search functionality
- Pagination
- Bulk operations
- Export buttons

## 🔔 NOTIFICATION SİSTEMİ

### Real-time Notifications:
- Firebase Firestore listeners
- Toast notifications (react-hot-toast)
- Menu badge counters
- Email notifications (Cloud Functions)
- Push notifications (future)

### Notification Types:
- Yeni arıza bildirimleri
- Arıza durum güncellemeleri
- Bakım hatırlatmaları
- Stok uyarıları
- Sistem bildirimleri

## 💾 OFFLINE SUPPORT

### Caching Strategy:
- Critical data offline cache
- Form data localStorage backup
- Image caching
- Offline indicator
- Sync on reconnection

## 🚀 DEPLOYMENT & CONFIG

### Environment Setup:
- Firebase project configuration
- Environment variables
- CORS configuration
- Security rules deployment
- Cloud Functions deployment

### Production Optimizations:
- Bundle size optimization
- Image compression
- CDN configuration
- Performance monitoring
- Error tracking

## 📋 BAŞLANGIÇ MODÜL SIRASI

### Faz 1 - Core System:
1. Firebase setup ve authentication
2. Multi-company infrastructure
3. Role-based routing
4. Basic dashboard

### Faz 2 - Main Features:
1. Arıza yönetimi (CRUD + photos)
2. Saha/santral yönetimi
3. Kullanıcı yönetimi
4. Temel raporlama

### Faz 3 - Advanced Features:
1. Bakım sistemleri
2. Üretim veri yönetimi
3. Stok kontrol
4. Finansal analiz

### Faz 4 - Smart Features:
1. AI bakım tavsiyeleri
2. Anomali tespit sistemi
3. Advanced raporlama
4. Notification sistemi

### Faz 5 - Polish:
1. Vardiya sistemi
2. Mobile optimizations
3. Performance tuning
4. Advanced AI features

## 🎯 PROJE PRENSİPLERİ

Bu sistem modüler, test edilebilir ve ölçeklenebilir şekilde oluşturulmalıdır. Her modül bağımsız çalışabilmeli ve clean architecture prensiplerine uygun olmalıdır.

## 📝 MEVCUT DURUM

### Tamamlanan Özellikler:
- ✅ Firebase Authentication ve Multi-company yapısı
- ✅ Rol bazlı yetkilendirme sistemi
- ✅ Dashboard ve KPI'lar
- ✅ Arıza yönetimi (CRUD, fotoğraf, durum takibi)
- ✅ Bakım sistemleri (Elektrik ve Mekanik) - Alt menü yapısı ile
- ✅ GES Yönetimi ve Santral CRUD
- ✅ Aylık üretim verileri (alt koleksiyon: santraller/{santralId}/aylikUretim/{yil})
- ✅ Saha ve Müşteri yönetimi
- ✅ Ekip yönetimi ve davet sistemi
- ✅ Stok yönetimi sistemi (CRUD, hareket takibi, kritik stok uyarıları)
- ✅ Google Maps API entegrasyonu
- ✅ Firebase Storage fotoğraf yükleme
- ✅ PDF ve Excel export sistemleri (jsPDF, xlsx)
- ✅ Responsive tasarım ve mobil uyumlu tablolar
- ✅ Gerçek zamanlı bildirim sistemi (Firestore listeners)
- ✅ Sidebar alt menü desteği

### Devam Eden Çalışmalar:
- 🔄 TypeScript type hataları düzeltme
- 🔄 Build optimizasyonları

### Bekleyen Özellikler:
- ⏳ SMS bildirimleri
- ⏳ WhatsApp entegrasyonu
- ⏳ Excel import/export
- ⏳ QR kod üretimi
- ⏳ Otomatik yedekleme
- ⏳ Gerçek zamanlı izleme
- ⏳ AI özellikler (anomali tespiti, bakım tavsiyesi)
- ⏳ Advanced charts ve raporlama

## 🔑 ÖNEMLİ NOTLAR

1. **Firebase Yapısı**: Aylık üretim verileri `santraller/{santralId}/aylikUretim/{yil}` alt koleksiyonunda saklanır
2. **Google Maps API Key**: AIzaSyBrlyyV7X54-Ysk338vXmLDdidimSHIeMI
3. **Firebase Project ID**: yenisirket-2ec3b
4. **Kullanıcı Tercihleri**: 
   - Güç girişleri kW cinsinden (MW değil)
   - Türkçe arayüz
   - Adım adım talimatlar

## 📞 İLETİŞİM VE DESTEK

Bu dokümantasyon canlı bir belgedir ve proje geliştikçe güncellenmelidir.

---

*Son Güncelleme: Ocak 2025*
