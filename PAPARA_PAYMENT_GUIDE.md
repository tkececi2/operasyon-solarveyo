# 💳 Papara Business ile Ödeme Alma Rehberi

## 🚀 Hızlı Başlangıç (Şirket Gerekmez!)

### ✅ Neden Papara?
- **Şirket kurmaya gerek yok** - TC kimlik yeterli
- **%1.99 komisyon** - Türkiye'nin en düşüğü
- **5 dakikada onay** - Hemen başlayın
- **750.000 TL/ay limit** - Yeterli kapasite
- **Anında para çekme** - T+0 (aynı gün)

## 📱 1. PAPARA HESABI AÇMA

### Adım 1: Bireysel Hesap
```bash
1. papara.com veya Papara mobil uygulama
2. "Hesap Aç" → TC Kimlik No + Telefon
3. E-posta doğrulama
4. Selfie ile kimlik doğrulama
5. 5 dakikada onay ✅
```

### Adım 2: Business'a Yükseltme
```bash
Papara App → Profil → İşletme Hesabı
├── Faaliyet Alanı: "Yazılım/Teknoloji"
├── Aylık Ciro: Tahmini girin
├── Vergi Levhası: Opsiyonel (şahıs için)
└── Otomatik Onay → API Keys
```

## 🔑 2. API ENTEGRASYONU

### API Anahtarlarını Alın
```javascript
// Papara Panel → Ayarlar → API
API_KEY: "live_afXhZPW0MQlE4dCU..."
SECRET_KEY: "live_wbwpzKIiplZxI3hh..."
```

### .env Dosyasına Ekleyin
```env
# Papara API Keys
VITE_PAPARA_API_KEY=live_afXhZPW0MQlE4dCU...
VITE_PAPARA_SECRET_KEY=live_wbwpzKIiplZxI3hh...
VITE_PAPARA_WEBHOOK_URL=https://yourdomain.com/api/papara/webhook
```

## 💻 3. TEST VE CANLI ORTAM

### Test Kartları
```javascript
// Başarılı Ödeme
Kart No: 4508 0345 3456 7894
SKT: 12/25
CVV: 123

// 3D Secure Test
Kart No: 5406 6704 0041 5603
SKT: 12/25
CVV: 123
SMS: 123456

// Başarısız Ödeme
Kart No: 4508 0345 3456 7895
```

### Canlı Ortama Geçiş
```javascript
// paparaService.ts içinde değiştirin
const PAPARA_CONFIG = {
  // Test → Canlı
  apiKey: process.env.VITE_PAPARA_API_KEY,
  secretKey: process.env.VITE_PAPARA_SECRET_KEY,
  baseUrl: 'https://merchant-api.papara.com', // Test: merchant-test-api
};
```

## 📊 4. KOMİSYON VE MALİYETLER

### Papara Komisyon Oranları
| İşlem Tipi | Komisyon | Örnek (₺1000) |
|------------|----------|---------------|
| **Kredi/Banka Kartı** | %1.99 | ₺19.90 |
| **Papara Cüzdan** | %1.49 | ₺14.90 |
| **QR Kod** | %1.49 | ₺14.90 |
| **Taksitli** | %1.99 + %0.25/taksit | ₺22.40 (3 taksit) |
| **Yurtdışı Kart** | %3.49 | ₺34.90 |

### Gelir Hesaplaması
```
100 Müşteri × ₺2,499 = ₺249,900/ay
Papara Komisyonu (%1.99): -₺4,973
────────────────────────────────
Net Gelir: ₺244,927/ay

Vergi (Basit Usul %15): -₺36,739
────────────────────────────────
Elinize Geçen: ₺208,188/ay
```

## 🎯 5. ÖDEME ALMA YÖNTEMLERİ

### 1. Link ile Ödeme
```javascript
// paparaService.createPaymentLink()
const paymentLink = await createPaymentLink({
  amount: 2499,
  description: "SolarVeyo Pro - Aylık",
  customerEmail: "musteri@email.com"
});

// Müşteriye gönder:
// https://payment.papara.com/pay/abc123
```

### 2. QR Kod Ödeme
```javascript
// paparaService.createQRPayment()
const qrCode = await createQRPayment({
  amount: 2499,
  description: "SolarVeyo Pro"
});

// QR kodu göster → Müşteri telefonla okutup öder
```

### 3. Abonelik (Otomatik Ödeme)
```javascript
// paparaService.createSubscription()
const subscription = await createSubscription({
  planId: "professional",
  billingCycle: "monthly",
  trialDays: 14
});

// Her ay otomatik tahsilat
```

## 📱 6. PAPARA UYGULAMASI

### Mobil Özellikleri
- **Anlık Bildirimler**: Her ödemede push notification
- **Bakiye Kontrolü**: Anlık bakiye görüntüleme
- **Para Çekme**: Banka hesabına transfer
- **Raporlama**: Detaylı işlem geçmişi
- **Fatura**: Otomatik e-Arşiv fatura

### Para Çekme
```bash
Papara App → Bakiye → Para Çek
├── Banka Hesabı Seç
├── Tutar Gir
├── T+0 (Aynı gün) veya T+1 (Ertesi gün)
└── Ücretsiz (ayda 3 kez)
```

## 🔒 7. GÜVENLİK

### Güvenlik Özellikleri
- ✅ PCI DSS Level 1 Sertifikası
- ✅ 256-bit SSL Şifreleme
- ✅ 3D Secure Zorunlu
- ✅ Fraud Detection (Dolandırıcılık Koruması)
- ✅ IP Kısıtlama
- ✅ Webhook İmzalama

### Webhook Doğrulama
```javascript
// Gelen webhook'u doğrula
const isValid = verifyWebhookSignature(
  request.body,
  request.headers['x-papara-signature'],
  PAPARA_CONFIG.secretKey
);

if (!isValid) {
  throw new Error('Invalid webhook signature');
}
```

## 📋 8. VERGİ VE MUHASEBE

### Vergi Durumu
```
Gelir < ₺77,000/yıl → Vergi yok
Gelir > ₺77,000/yıl → Gelir vergisi

KDV Muafiyeti:
- Yazılım hizmetleri: ₺230,000/yıl'a kadar KDV yok
- Üzerinde: KDV mükellefi olunur
```

### Fatura/Makbuz
- **Papara otomatik e-Arşiv fatura keser**
- Müşteriye otomatik gönderilir
- Muhasebe entegrasyonu mevcut

## 🚀 9. BÜYÜME STRATEJİSİ

### Aşamalı Büyüme Planı
```
0-6 Ay: Papara Business (Bireysel)
  ↓ (₺30K/ay gelir)
6-12 Ay: Şahıs Şirketi + Papara
  ↓ (₺100K/ay gelir)
1+ Yıl: Limited Şirket + Iyzico/PayTR
```

## ❓ 10. SIKÇA SORULAN SORULAR

**S: Şirket olmadan fatura kesebilir miyim?**
C: Evet, Papara otomatik e-Arşiv fatura keser.

**S: Vergi ödemem gerekir mi?**
C: Yıllık ₺77,000 üzeri gelirde evet.

**S: Taksit yapabilir miyim?**
C: Evet, 12 aya kadar taksit imkanı var.

**S: Para ne zaman hesabıma geçer?**
C: T+0 (aynı gün) veya T+1 (ertesi gün).

**S: Limit var mı?**
C: Aylık ₺750,000 limit (artırılabilir).

## 📞 DESTEK

### Papara Destek
- **Telefon**: 0850 340 0 340
- **WhatsApp**: 0850 340 0 340
- **E-posta**: destek@papara.com
- **Canlı Destek**: 7/24 (App içinde)

### Acil Durumlar
- **Kart Bloke**: 0850 340 0 340
- **Şüpheli İşlem**: guvenlik@papara.com
- **Teknik Sorun**: api-support@papara.com

## ✅ KONTROL LİSTESİ

- [ ] Papara hesabı açıldı
- [ ] Business'a yükseltildi
- [ ] API anahtarları alındı
- [ ] Test ödemeleri yapıldı
- [ ] Webhook'lar ayarlandı
- [ ] Güvenlik önlemleri alındı
- [ ] Muhasebeci bilgilendirildi
- [ ] Canlıya geçiş yapıldı

---

## 🎉 TEBRİKLER!

Artık **şirket kurmadan** Papara ile ödeme alabilirsiniz!

**İlk müşterinizi bekleyin ve büyümeye başlayın!** 🚀

---

*Son Güncelleme: Aralık 2024*
*Papara API v2.0*
