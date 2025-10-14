# 📋 Product Requirements Document (PRD)
# Solarveyo - Multi-Tenant SaaS Solar Enerji Yönetim Platformu

**Versiyon:** 2.0.0  
**Tarih:** 14 Ekim 2025  
**Proje Durumu:** Production  
**Firebase ID:** yenisirket-2ec3b

---

## 📌 Executive Summary

Solarveyo, güneş enerjisi santrali (GES) işletmelerinin operasyonel süreçlerini dijitalleştiren, multi-tenant SaaS tabanlı bir yönetim platformudur. Platform, arıza takibi, bakım yönetimi, santral izleme, ekip koordinasyonu, stok kontrolü ve performans analitiği gibi kritik işlevleri tek bir çatı altında toplar.

### 🎯 Temel Değer Önerisi
- ⚡ **Operasyonel Verimlilik**: Arıza ve bakım süreçlerinde %60 zaman tasarrufu
- 📊 **Real-time İzleme**: Santral performansını anlık takip
- 👥 **Ekip Koordinasyonu**: Tekniker ve mühendisleri merkezi olarak yönetme
- 💰 **Maliyet Optimizasyonu**: Stok ve kaynak yönetimi
- 📱 **Mobile-First**: Her yerden erişim ve bildirim sistemi

---

## 🏢 1. Product Overview

### 1.1 Problem Statement

**Mevcut Durum:**
- Güneş enerjisi santrali işletmeleri Excel, WhatsApp ve kağıt formlarla çalışıyor
- Arıza takibi manuel ve sistematik değil
- Ekip koordinasyonu zayıf, iletişim kopuklukları yaşanıyor
- Performans ve üretim verileri analiz edilemiyor
- Stok takibi yetersiz, malzeme temini gecikmeli

**Hedef Durum:**
- Tüm operasyonlar tek platformda dijital olarak yönetiliyor
- Arıza anında tespit ediliyor ve otomatik atanıyor
- Ekip mobil cihazlardan anlık bildirim alıyor
- Performans metrikleri gerçek zamanlı izleniyor
- Stok seviyesi otomatik takip ediliyor

### 1.2 Target Audience

**Birincil Hedef Kitle:**
- Güneş enerjisi santrali işletme şirketleri (EPC firmaları)
- 5-50 MW arasında portföyü olan O&M şirketleri
- Çoklu saha yöneten enerji şirketleri

**İkincil Hedef Kitle:**
- Santral sahibi (endüstriyel) şirketler
- Enerji danışmanlık firmaları
- Büyük ölçekli santral yatırımcıları

### 1.3 Market Opportunity

**Türkiye Pazarı (2025):**
- 13 GW+ kurulu GES kapasitesi
- ~1,500+ aktif santral
- Yıllık %25+ büyüme oranı
- $50M+ dijital dönüşüm yatırımı

**Rekabet Durumu:**
- Genel SCADA sistemleri: Pahalı, karmaşık, EPC odaklı değil
- Excel/Manuel: Dominant, ancak verimsiz
- Yabancı SaaS: Türkiye'ye özgü ihtiyaçlara cevap vermiyor

---

## 👥 2. User Personas & Roles

### 2.1 Kullanıcı Rolleri

#### 🔴 SuperAdmin
**Kim:** Platform yöneticisi / Solarveyo ekibi  
**Yetkileri:**
- Tüm şirketleri görüntüleme ve yönetme
- Sistem çapında ayarlar
- Abonelik ve faturalandırma yönetimi
- Analytics ve kullanım raporları
- Tüm verilere okuma erişimi

**Temel İhtiyaçlar:**
- Multi-tenant yönetim paneli
- Kullanım metrikleri (şirket bazlı)
- Hızlı destek için şirket erişimi

---

#### 🟠 Yönetici (Manager)
**Kim:** EPC şirketi genel müdürü/operasyon müdürü  
**Yetkileri:**
- Tüm sahalar ve santrallere erişim
- Ekip üyesi ekleme/çıkarma
- Saha ve santral oluşturma
- Müşteri yönetimi
- Tüm raporları görüntüleme
- Bütçe ve stok onayları

**Temel İhtiyaçlar:**
- Dashboard ile KPI'ları hızlı görmek
- Kritik arızalar için acil bildirimler
- Ekip performans raporları
- Müşteri memnuniyet takibi

**Kullanım Senaryosu:**
> "Pazartesi sabahı dashboard'u açıyorum. 3 kritik arıza görüyorum, hangisinin öncelikli olduğunu anlayıp mühendise atıyorum. Haftalık raporu müşteriye göndermeden önce PDF olarak indiriyorum."

---

#### 🟢 Mühendis (Engineer)
**Kim:** Elektrik/Enerji mühendisi  
**Yetkileri:**
- Santral kurulumu ve teknik parametre girişi
- Arıza analizi ve çözüm önerisi
- Üretim verisi girişi ve validasyonu
- Teknik raporlama
- Ekipman spesifikasyonu

**Temel İhtiyaçlar:**
- Santral teknik detaylarına hızlı erişim
- Arıza geçmişi ve trend analizi
- Üretim performansı karşılaştırma
- Teknik dokümantasyon yönetimi

**Kullanım Senaryosu:**
> "Yeni santral kurulumu için inverter bilgilerini, panel dizilimini ve string yapılandırmasını sisteme giriyorum. Santral devreye alındıktan sonra günlük üretim tahminini hesaplayıp takip ediyorum."

---

#### 🔵 Tekniker (Technician)
**Kim:** Saha teknisyeni / elektrikçi  
**Yetkileri:**
- Atanan arızaları görüntüleme
- Arıza çözüm işlemleri (fotoğraf, not, malzeme)
- Periyodik bakım yapma
- Stok çekme
- Vardiya bildirimi

**Temel İhtiyaçlar:**
- Mobil uygulama ile sahada çalışma
- Offline veri girişi (sınırlı)
- Konum bazlı görev listesi
- Basit ve hızlı arayüz

**Kullanım Senaryosu:**
> "Sabah bildirim geliyor: Ankara Saha 1'de inverter arızası. Detayları açıyorum, konumu Maps'te görüyorum. Sahaya gidip arızayı çözüyorum, fotoğraf çekip notlarımı ekliyorum. Sistemi kapatıyorum."

---

#### 🟡 Müşteri (Customer)
**Kim:** Santral sahibi firma / yatırımcı  
**Yetkileri:**
- Sadece kendi sahası/santralını görüntüleme
- Üretim raporlarına erişim
- Arıza bildirimlerini görme (çözüm detayları hariç)
- Aylık performans raporları

**Temel İhtiyaçlar:**
- Üretim ve gelir takibi
- Arıza/bakım şeffaflığı
- Basit ve anlaşılır raporlar
- WhatsApp/Email bildirimleri

**Kullanım Senaryosu:**
> "Ayın sonunda sistemden rapor alıyorum. Bu ay 15,000 kWh üretim yapmışız, geçen aya göre %5 artış var. 2 küçük arıza olmuş ama hızlı çözülmüş. Memnunum."

---

#### 🟣 Bekçi (Guard)
**Kim:** Santral güvenlik görevlisi  
**Yetkileri:**
- Vardiya bildirimi oluşturma
- Acil durum bildirimi
- Basit arıza bildirimi (kırılma, hırsızlık vb.)
- Saha fotoğrafları yükleme

**Temel İhtiyaçlar:**
- Çok basit arayüz (düşük teknoloji okuryazarlığı)
- Sesli not alma
- Hızlı bildirim oluşturma
- Vardiya takibi

**Kullanım Senaryosu:**
> "Gece vardiyasında iken garip bir ses duyuyorum. Hemen uygulamadan acil bildirim oluşturup fotoğraf ekliyorum. Yönetici hemen görüyor ve aksiyon alıyor."

---

## 🎯 3. Core Features & Requirements

### 3.1 Authentication & Authorization

**Must Have (P0):**
- ✅ Email/şifre ile giriş (Firebase Auth)
- ✅ Role-based access control (6 rol)
- ✅ Multi-tenant veri izolasyonu (company bazlı)
- ✅ Müşteri için saha/santral bazlı izolasyon
- ✅ Şifre sıfırlama
- ✅ Email doğrulama

**Should Have (P1):**
- 📱 2FA (İki faktörlü doğrulama)
- 🔐 SSO (Single Sign-On) desteği
- 📞 Telefon doğrulaması

**Nice to Have (P2):**
- 🔑 OAuth entegrasyonu (Google/Microsoft)
- 👨‍💼 Active Directory entegrasyonu (kurumsal)

---

### 3.2 Dashboard & Analytics

**Must Have (P0):**
- ✅ KPI kartları (aktif arıza, bekleyen bakım, toplam üretim)
- ✅ Günlük üretim grafiği
- ✅ Santral durumu özeti
- ✅ Kritik bildirimler
- ✅ Hızlı erişim aksiyonları
- ✅ Role-based dashboard içeriği

**Should Have (P1):**
- 📊 Karşılaştırmalı performans grafikleri
- 🎯 Hedef vs. Gerçekleşen
- 🔥 Heatmap (arıza yoğunluk haritası)
- ⏱️ Ortalama çözüm süreleri

**Nice to Have (P2):**
- 🤖 AI destekli öngörüler
- 📈 Trend analizi
- 💡 Optimizasyon önerileri

---

### 3.3 Arıza Yönetimi (Fault Management)

**Must Have (P0):**
- ✅ Arıza kartı oluşturma (manuel/otomatik)
- ✅ Kategori: Elektrik, Mekanik, İnverter, Panel, Diğer
- ✅ Öncelik: Düşük, Orta, Yüksek, Kritik
- ✅ Durum: Açık, Devam Ediyor, Çözüldü, İptal
- ✅ Teknisyen atama
- ✅ Fotoğraf yükleme (maksimum 5)
- ✅ Çözüm notu ve malzeme girişi
- ✅ Süre takibi (başlangıç-bitiş)
- ✅ Bildirim sistemi (atama, güncelleme, çözüm)

**Should Have (P1):**
- 🔔 SLA (Service Level Agreement) takibi
- 📊 Arıza analitiği (kategori, tekrar eden arızalar)
- 🗂️ Arıza şablonları
- 📎 Dosya eki (PDF, Excel)
- 🔄 Arıza geçmişi ve pattern tespiti

**Nice to Have (P2):**
- 🤖 Otomatik arıza tespiti (santral verilerinden)
- 🔮 Tahmine dayalı bakım önerisi
- 📞 Müşteri onay akışı

---

### 3.4 Bakım Yönetimi (Maintenance)

**Must Have (P0):**
- ✅ İki bakım tipi: Elektriksel, Mekanik
- ✅ Periyodik bakım planlama
- ✅ Bakım checklist'leri
- ✅ Teknisyen atama
- ✅ Bakım tamamlama formu
- ✅ Fotoğraf ve not ekleme

**Should Have (P1):**
- 📅 Otomatik bakım hatırlatıcıları
- 📋 Özelleştirilebilir checklist
- 📊 Bakım geçmişi raporları
- ⏰ Geciken bakım uyarıları

**Nice to Have (P2):**
- 📈 Bakım maliyeti analizi
- 🔄 Bakım şablon kütüphanesi
- 📱 QR kod ile ekipman takibi

---

### 3.5 Santral Yönetimi (GES Management)

**Must Have (P0):**
- ✅ Santral bilgileri (kapasite, konum, sahip)
- ✅ Inverter listesi ve detayları
- ✅ Panel bilgileri (sayı, güç, marka)
- ✅ String konfigürasyonu
- ✅ Üretim verisi girişi (günlük/aylık)
- ✅ Günlük üretim grafiği
- ✅ Aylık üretim özeti

**Should Have (P1):**
- 🗺️ Google Maps entegrasyonu
- 📸 Santral fotoğraf galerisi
- 📄 Teknik dokümantasyon yükleme
- 🔌 Elektrik kesintisi kaydı
- 💰 Finansal bilgiler (gelir, kazanç)

**Nice to Have (P2):**
- ☀️ Hava durumu entegrasyonu
- 🎯 Tahmini üretim karşılaştırması
- 🏆 Santral performans puanı
- 📊 String seviyesinde monitoring

---

### 3.6 Ekip Yönetimi (Team Management)

**Must Have (P0):**
- ✅ Kullanıcı ekleme/silme
- ✅ Rol atama
- ✅ Müşteriler için saha/santral ataması
- ✅ Kullanıcı profil yönetimi
- ✅ Aktif/pasif durum

**Should Have (P1):**
- 📊 Ekip performans metrikleri
- 📅 Görev yük dağılımı
- 🎯 Bireysel KPI takibi
- 📞 İletişim bilgileri

**Nice to Have (P2):**
- 🗓️ Vardiya planlama
- 📍 Konum takibi (GPS)
- ⏱️ Çalışma saati takibi
- 📈 Eğitim ve sertifika yönetimi

---

### 3.7 Stok Kontrol (Inventory)

**Must Have (P0):**
- ✅ Stok kartı (malzeme adı, miktar, birim)
- ✅ Kategori yönetimi
- ✅ Stok giriş/çıkış
- ✅ Minimum stok seviyesi
- ✅ Stok uyarıları
- ✅ Arıza/bakım ile ilişkilendirme

**Should Have (P1):**
- 📊 Stok hareket raporu
- 💰 Malzeme maliyet takibi
- 📍 Depo yönetimi (çoklu depo)
- 🔔 Otomatik sipariş önerisi

**Nice to Have (P2):**
- 🏭 Tedarikçi yönetimi
- 📦 Barkod/QR kod okuma
- 📈 Stok optimizasyon analitiği
- 🔄 Tedarik zinciri entegrasyonu

---

### 3.8 Saha & Müşteri Yönetimi

**Must Have (P0):**
- ✅ Saha kartı (isim, konum, müşteri)
- ✅ Müşteri bilgileri (firma, yetkili, iletişim)
- ✅ Saha-santral ilişkilendirme
- ✅ Müşteri kullanıcı ataması

**Should Have (P1):**
- 🗺️ Harita görünümü
- 📊 Saha bazlı raporlama
- 📞 Müşteri portal erişimi
- 💼 Sözleşme bilgileri

**Nice to Have (P2):**
- 💰 Faturalandırma entegrasyonu
- 📧 Otomatik müşteri raporları
- 🎯 SLA yönetimi
- ⭐ Müşteri memnuniyet anketi

---

### 3.9 Bildirimleri & Raporlama

**Must Have (P0):**
- ✅ In-app bildirimler
- ✅ Email bildirimleri
- ✅ Push notification (web/mobile)
- ✅ Bildirim tercihleri
- ✅ PDF rapor export
- ✅ Excel export

**Should Have (P1):**
- 📲 WhatsApp Business entegrasyonu
- 📊 Özelleştirilebilir raporlar
- 📅 Otomatik periyodik raporlar
- 📧 Toplu email gönderimi

**Nice to Have (P2):**
- 📱 SMS bildirimleri
- 🤖 AI destekli rapor önerileri
- 📊 BI araçları entegrasyonu (Power BI, Tableau)
- 🎨 Marka özelleştirmeli raporlar

---

### 3.10 Vardiya Bildirimleri

**Must Have (P0):**
- ✅ Vardiya kartı oluşturma
- ✅ Bekçi/güvenlik notu
- ✅ Olaylar ve gözlemler
- ✅ Fotoğraf ekleme
- ✅ Tarih/saat kaydı

**Should Have (P1):**
- 📅 Vardiya takvimi
- 👥 Vardiya değişim takibi
- 🔔 Vardiya hatırlatıcı
- 📊 Vardiya raporu

**Nice to Have (P2):**
- 📍 Konum doğrulama
- ⏰ Geç kalma takibi
- 🎙️ Sesli not
- 🌡️ Çevresel veri kaydı (sıcaklık, nem)

---

## 🏗️ 4. Technical Architecture

### 4.1 Technology Stack

**Frontend:**
- ⚛️ React 18
- 📘 TypeScript (Strict mode)
- ⚡ Vite
- 🎨 TailwindCSS
- 🧩 Lucide React Icons
- 🎭 Framer Motion
- 📊 Recharts
- 📝 React Hook Form + Zod

**Backend:**
- 🔥 Firebase Firestore (Database)
- 🔐 Firebase Authentication
- ☁️ Firebase Cloud Functions
- 📦 Firebase Storage
- 📬 Firebase Cloud Messaging

**Infrastructure:**
- 🌐 Netlify (Hosting)
- 🗺️ Google Maps API
- 📊 PostHog (Analytics)
- 📱 Capacitor (Mobile wrapper)

### 4.2 Database Schema

**Core Collections:**
```
companies/
  - id: string
  - name: string
  - plan: 'trial' | 'starter' | 'professional' | 'enterprise'
  - trialEndDate: timestamp
  - subscriptionStatus: 'active' | 'expired' | 'cancelled'
  - limits: { users, sites, storage }
  - createdAt: timestamp

kullanicilar/
  - id: string (auth.uid)
  - email: string
  - displayName: string
  - rol: 'superadmin' | 'yonetici' | 'muhendis' | 'tekniker' | 'musteri' | 'bekci'
  - companyId: string
  - sahalar: string[] (müşteri için)
  - santraller: string[] (müşteri için)
  - photoURL: string
  - fcmTokens: string[]

santraller/
  - id: string
  - companyId: string
  - sahaId: string
  - ad: string
  - kapasite: number (kW)
  - konum: { lat, lng, adres }
  - inverterler: Inverter[]
  - panelBilgileri: {...}
  - durum: 'aktif' | 'bakim' | 'devre-disi'
  
  /aylikUretim/{yil} (subcollection)
    - ocak: number
    - subat: number
    - ...
  
  /uretimVerileri/{id} (subcollection)
    - tarih: timestamp
    - uretim: number (kWh)
    - gelir: number

arizalar/
  - id: string
  - companyId: string
  - sahaId: string
  - santralId: string
  - kategori: string
  - oncelik: string
  - durum: string
  - baslik: string
  - aciklama: string
  - atananKullanici: string
  - olusturan: string
  - fotograflar: string[]
  - olusturmaTarihi: timestamp
  - cozumTarihi: timestamp
  - cozumNotu: string
  - kullanilanMalzemeler: {...}

[Diğer collections: elektrikBakimlar, mekanikBakimlar, stoklar, sahalar, musteriler, vardiyaBildirimleri, auditLogs, notifications]
```

### 4.3 Security & Access Control

**Firestore Rules (Kritik):**

```javascript
// Müşteri izolasyonu
match /arizalar/{arizaId} {
  allow read: if isAuthenticated() 
    && (request.auth.token.rol != 'musteri' 
      || resource.data.sahaId in request.auth.token.sahalar);
}

// Company izolasyonu
match /santraller/{santralId} {
  allow read: if isAuthenticated() 
    && (request.auth.token.rol == 'superadmin' 
      || resource.data.companyId == request.auth.token.companyId);
}
```

**Query-Level Filtering:**
```typescript
// Her servis fonksiyonunda:
if (userProfile.rol === 'musteri') {
  query = query.where('sahaId', 'in', userProfile.sahalar || []);
}
if (userProfile.rol !== 'superadmin') {
  query = query.where('companyId', '==', userProfile.companyId);
}
```

### 4.4 Performance Requirements

- ⚡ İlk sayfa yüklenme: < 3 saniye
- 🔄 Dashboard veri yenileme: < 2 saniye
- 📱 Mobile app başlatma: < 2 saniye
- 📊 Rapor oluşturma: < 5 saniye
- 🖼️ Görsel yükleme: < 3 saniye
- 💾 Offline çalışma: Kısıtlı (öncelik değil)

### 4.5 Scalability

**Firestore Limits:**
- Maksimum 1M okuma/gün (başlangıç)
- Maksimum 100K yazma/gün
- Her sorgu maksimum 20 sonuç (pagination)
- Cache stratejisi: 5 dakika

**Storage Limits (Plan Bazlı):**
- Trial: 1GB
- Starter: 5GB
- Professional: 50GB
- Enterprise: Sınırsız

---

## 💰 5. Business Model & Pricing

### 5.1 Subscription Plans

| Plan | Fiyat | Kullanıcı | Saha | Depolama | Özellikler |
|------|-------|-----------|------|----------|------------|
| **Trial** | ₺0 (14 gün) | 3 | 2 | 1GB | Tüm özellikler |
| **Starter** | ₺999/ay | 5 | 5 | 5GB | Email destek |
| **Professional** ⭐ | ₺2,499/ay | 20 | 20 | 50GB | WhatsApp destek, API |
| **Enterprise** | ₺4,999/ay | Sınırsız | Sınırsız | Sınırsız | Özel eğitim, SLA |

### 5.2 Revenue Streams

1. **Abonelik Gelirleri** (Birincil)
2. **Ek Kullanıcı/Saha Paketi** (Upsell)
3. **API Entegrasyon Ücreti** (Enterprise)
4. **Özel Geliştirme/Danışmanlık**
5. **Training & Onboarding Hizmetleri**

### 5.3 Target Metrics (12 Months)

- 💼 **Hedef Müşteri:** 50 aktif şirket
- 👥 **Toplam Kullanıcı:** 500+ kullanıcı
- 💰 **MRR (Aylık Gelir):** ₺100,000
- 📈 **Churn Rate:** < %5
- ⭐ **NPS Score:** > 50

---

## 🎨 6. UI/UX Requirements

### 6.1 Design Principles

1. **Mobile-First:** Teknisyenler sahada mobil kullanacak
2. **Türkçe:** Tüm arayüz Türkçe, teknik terimler orijinal
3. **Hız:** Minimum tıklama, hızlı erişim
4. **Görsellik:** İkonlar, renkli durumlar, grafik ağırlıklı
5. **Erişilebilirlik:** WCAG 2.1 AA standardı

### 6.2 UI Components

**Layout:**
- Responsive grid: 1 kolon (mobile), 2 kolon (tablet), 4 kolon (desktop)
- Sidebar navigation (collapsible)
- Header: Logo, profil, bildirimler
- Footer: Minimal

**Colors:**
- Primary: `#3B82F6` (Mavi - Güven)
- Success: `#10B981` (Yeşil - Çözüldü)
- Warning: `#F59E0B` (Sarı - Bekliyor)
- Danger: `#EF4444` (Kırmızı - Kritik)
- Gray Scale: Tailwind default

**Typography:**
- Font: Inter (Google Fonts)
- Heading: 24-32px Bold
- Body: 14-16px Regular
- Caption: 12px Medium

### 6.3 Key User Flows

**Arıza Oluşturma Akışı (Tekniker):**
```
1. Dashboard → "Yeni Arıza" butonu
2. Saha/Santral seçimi (otomatik GPS)
3. Kategori ve öncelik seçimi
4. Fotoğraf çekme (kamera entegrasyonu)
5. Kısa açıklama (sesli not opsiyonel)
6. Gönder → Bildirim sistemi devreye girer
```

**Arıza Çözme Akışı (Tekniker):**
```
1. Bildirim gelir → Arıza detayına git
2. "İşe Başla" butonu (süre başlar)
3. Malzeme seç (stoktan düş)
4. Çözüm fotoğrafları ekle
5. Çözüm notu yaz
6. "Arızayı Kapat" → Yöneticiye bildirim
```

**Rapor İndirme Akışı (Yönetici):**
```
1. Santral detay sayfası
2. "Rapor Al" butonu
3. Tarih aralığı seçimi
4. Rapor tipi seçimi (PDF/Excel)
5. İndir → Otomatik oluşturma
```

---

## 📊 7. Success Metrics & KPIs

### 7.1 Product KPIs

**Kullanım Metrikleri:**
- 📈 Daily Active Users (DAU)
- 📅 Monthly Active Users (MAU)
- ⏱️ Average Session Duration
- 🔄 Feature Adoption Rate

**Operasyonel Metrikler:**
- ⚡ Ortalama Arıza Çözüm Süresi
- ✅ Bakım Tamamlama Oranı
- 📊 Santral Uptime %
- 🎯 SLA Compliance Rate

**İş Metrikleri:**
- 💰 Monthly Recurring Revenue (MRR)
- 📈 Customer Lifetime Value (CLTV)
- 💸 Customer Acquisition Cost (CAC)
- 🔄 Churn Rate
- ⬆️ Upsell Rate

### 7.2 Success Criteria (6 Months)

- ✅ 25+ aktif müşteri şirketi
- ✅ 250+ kayıtlı kullanıcı
- ✅ 100+ aktif santral
- ✅ 1000+ arıza kaydı
- ✅ < 2 saat ortalama arıza çözüm süresi
- ✅ %90+ kullanıcı memnuniyeti

---

## 🚀 8. Development Roadmap

### Phase 1: MVP (Tamamlandı ✅)
**Timeline:** Q1 2025  
**Durum:** Production

- ✅ Authentication & role management
- ✅ Dashboard & KPI cards
- ✅ Arıza yönetimi (CRUD)
- ✅ Santral yönetimi
- ✅ Bakım yönetimi
- ✅ Ekip yönetimi
- ✅ Stok kontrol
- ✅ Temel raporlama (PDF/Excel)
- ✅ Bildirim sistemi

---

### Phase 2: Growth Features (Q4 2025)
**Öncelik:** Kullanıcı deneyimi ve ölçeklenme

**P0 (Must Have):**
- 📱 iOS/Android native app (Capacitor)
- 🔔 WhatsApp Business entegrasyonu
- 📊 Gelişmiş analytics dashboard
- 🎯 SLA yönetimi ve uyarıları
- 💳 Stripe ödeme entegrasyonu
- 📧 Otomatik müşteri raporları

**P1 (Should Have):**
- 🗺️ Harita üzerinde santral görünümü
- 📈 Karşılaştırmalı performans analizi
- 🔄 Arıza pattern tespiti
- 📦 Barkod/QR kod ile stok takibi
- 🎨 White-label özelleştirme

---

### Phase 3: Intelligence & Automation (Q2 2026)
**Öncelik:** AI ve otomasyon

**P1:**
- 🤖 Otomatik arıza tespiti (ML)
- 🔮 Tahmine dayalı bakım
- 📊 Akıllı raporlama önerileri
- ☀️ Hava durumu entegrasyonu
- 🎯 Üretim tahmini vs. gerçekleşen

**P2 (Nice to Have):**
- 🔌 SCADA sistem entegrasyonu
- 📡 IoT sensor entegrasyonu
- 🏭 Tedarik zinciri otomasyonu
- 🎓 AI chatbot destek

---

### Phase 4: Enterprise & Scale (2026+)
**Öncelik:** Kurumsal özellikler

- 🏢 Active Directory / LDAP entegrasyonu
- 📊 BI araçları entegrasyonu (Power BI)
- 🔐 Advanced security (SSO, 2FA)
- 🌍 Çoklu dil desteği
- 📞 CRM entegrasyonları
- 💼 ERP entegrasyonları

---

## 🔒 9. Security & Compliance

### 9.1 Data Security

- 🔐 **Encryption at Rest:** Firebase default
- 🔒 **Encryption in Transit:** HTTPS only
- 🛡️ **Firestore Rules:** Multi-tenant isolation
- 🔑 **API Security:** Firebase Auth tokens
- 📝 **Audit Logging:** Tüm kritik işlemler

### 9.2 Compliance

**KVKK (Kişisel Verilerin Korunması):**
- ✅ Kullanıcı onay metni
- ✅ Veri işleme aydınlatma metni
- ✅ Veri silme hakkı
- ✅ Veri taşınabilirlik

**Diğer:**
- 🇪🇺 GDPR uyumlu (export için)
- 🔒 ISO 27001 hedefi (2026)
- 📜 SOC 2 Type II (gelecek)

### 9.3 Backup & Disaster Recovery

- 💾 Firestore auto-backup (günlük)
- 🔄 Point-in-time recovery
- 📦 Storage backup (Cloud Storage)
- ⏱️ RTO (Recovery Time Objective): 4 saat
- 📊 RPO (Recovery Point Objective): 24 saat

---

## 🤝 10. Support & Onboarding

### 10.1 Customer Onboarding

**Trial Başlangıç:**
1. Email kaydı ve hesap oluşturma
2. Onboarding wizard (5 adım):
   - Şirket bilgileri
   - İlk saha oluşturma
   - İlk santral oluşturma
   - Ekip üyesi davetleri
   - İlk arıza kaydı (demo)
3. Video tutorial (10 dakika)
4. Sample data yükleme (opsiyonel)

**Paid Plan Geçiş:**
1. Telefon onboarding görüşmesi (30 dk)
2. Veri import desteği (Excel/CSV)
3. Ekip eğitimi (2 saat online)
4. İlk 2 hafta özel destek

### 10.2 Support Channels

| Plan | Destek Kanalı | SLA |
|------|---------------|-----|
| Trial | Email + Dokümantasyon | 48 saat |
| Starter | Email | 24 saat |
| Professional | Email + WhatsApp | 8 saat |
| Enterprise | Email + WhatsApp + Telefon | 4 saat |

### 10.3 Documentation

- 📚 Kullanım kılavuzu (Türkçe)
- 🎥 Video eğitimler (YouTube)
- ❓ SSS (Frequently Asked Questions)
- 🔧 API dokümantasyonu (gelecek)
- 📝 Best practices rehberi

---

## 🎯 11. Competitive Analysis

### 11.1 Competitors

**Doğrudan Rakipler:**
- ❌ **Büyük SCADA sistemleri** (Siemens, ABB): Çok pahalı, karmaşık
- ❌ **Genel işletme yazılımları**: GES'e özgü değil
- ❌ **Excel/Manuel**: Hala dominant, dijitalleşme direnci

**Dolaylı Rakipler:**
- 🔧 **Bakım yönetim yazılımları** (Terotam): Genel amaçlı
- 📊 **Monitoring platformları**: Sadece izleme, operasyon yok

### 11.2 Competitive Advantages

1. ✅ **GES'e Özel:** Inverter, string, üretim mantığı built-in
2. ✅ **Türkiye Odaklı:** Yerel destek, Türkçe, yerel ödeme
3. ✅ **Uygun Fiyat:** SCADA sistemlerinin 1/10'u
4. ✅ **Kolay Kullanım:** Tekniker odaklı basit arayüz
5. ✅ **Multi-Tenant SaaS:** Hızlı onboarding, güncel kalma
6. ✅ **Mobile-First:** Sahada kullanım öncelikli

---

## 📝 12. Assumptions & Risks

### 12.1 Key Assumptions

1. ✅ GES işletmeleri dijitalleşmeye hazır
2. ✅ Teknisyenler akıllı telefon kullanabiliyor
3. ✅ Firebase altyapısı ölçeklenebilir
4. ✅ Müşteriler aylık ödeme modelini kabul ediyor
5. ⚠️ SCADA entegrasyonu ihtiyacı sınırlı (Phase 4)

### 12.2 Potential Risks

| Risk | Olasılık | Etki | Mitigation |
|------|----------|------|------------|
| Yavaş müşteri adaptasyonu | Orta | Yüksek | Free trial + eğitim |
| Rakip kopya çıkarma | Yüksek | Orta | Hızlı iterasyon, patent |
| Firebase maliyet artışı | Düşük | Yüksek | Maliyet monitoring, plan B |
| Teknik borç birikimi | Orta | Orta | Refactor sprints, code review |
| Key personel kaybı | Düşük | Yüksek | Dokümantasyon, pair programming |
| Güvenlik açığı | Düşük | Kritik | Security audit, pen test |

### 12.3 Dependencies

- 🔥 Firebase platform stability
- 🗺️ Google Maps API
- 📱 Apple/Google app store approval
- 💳 Ödeme gateway entegrasyonu
- 📞 WhatsApp Business API onayı

---

## 📞 13. Stakeholder Information

### 13.1 Internal Team

- **Product Owner:** [İsim]
- **Lead Developer:** [İsim]
- **UI/UX Designer:** [İsim]
- **QA Engineer:** [İsim]
- **DevOps:** [İsim]

### 13.2 External Stakeholders

- **Pilot Customers:** [Firma 1, Firma 2, Firma 3]
- **Investors:** [Melek/VC]
- **Technical Advisors:** [İsim]
- **Legal Counsel:** KVKK danışmanı

---

## 📚 14. Appendix

### 14.1 Glossary

- **GES:** Güneş Enerjisi Santrali
- **kW:** Kilowatt (güç birimi)
- **kWh:** Kilowatt-saat (enerji birimi)
- **Inverter:** DC/AC dönüştürücü
- **String:** Seri bağlı panel grubu
- **MPPT:** Maximum Power Point Tracker
- **O&M:** Operation & Maintenance
- **EPC:** Engineering, Procurement, Construction
- **SLA:** Service Level Agreement

### 14.2 References

- Firebase Firestore Documentation
- React 18 Documentation
- Tailwind CSS Documentation
- KVKK Kanunu (6698 sayılı)
- EPDK Lisanslama Yönetmelikleri

---

## ✅ 15. Approval & Sign-off

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Product Owner | | | |
| Engineering Lead | | | |
| Design Lead | | | |
| Business Stakeholder | | | |

---

**Doküman Versiyonu:** 1.0  
**Son Güncelleme:** 14 Ekim 2025  
**Sonraki Review:** 14 Ocak 2026

---

## 📧 Contact

**Proje İletişim:**  
Email: [email]  
Website: [website]  
Support: [support email]

---

*Bu PRD, Solarveyo platformunun geliştirilmesi ve iyileştirilmesi için canlı bir dokümandır. Düzenli olarak güncellenecek ve tüm stakeholder'lar tarafından referans alınacaktır.*

