# 🇹🇷 Türkiye'de Ödeme Alma Rehberi - SolarVeyo

## 📋 Hızlı Başlangıç

### 1️⃣ Iyzico Hesap Açma (1-2 gün)
```bash
# Gerekli Evraklar:
✅ Vergi Levhası
✅ İmza Sirküleri
✅ Şirket Kuruluş Gazetesi
✅ Ticaret Sicil Gazetesi
✅ Banka Hesap Bilgileri
```

### 2️⃣ API Anahtarlarını Alma
```javascript
// Test (Sandbox) - Hemen kullanabilirsiniz
API_KEY=sandbox-afXhZPW0MQlE4dCUUlHcEoJPNRKO04Si
SECRET_KEY=sandbox-wbwpzKIiplZxI3hh5ALI4FJyAcZKL6kq

// Canlı (Production) - Onay sonrası
API_KEY=YOUR_LIVE_API_KEY
SECRET_KEY=YOUR_LIVE_SECRET_KEY
```

### 3️⃣ Firebase Functions Kurulumu
```bash
# Functions klasöründe
cd functions
npm install iyzipay

# Webhook endpoint oluştur
firebase functions:config:set iyzico.api_key="YOUR_API_KEY"
firebase functions:config:set iyzico.secret_key="YOUR_SECRET_KEY"
```

## 💳 Ödeme Akışı

### Müşteri Ödeme Süreci:
1. **Plan Seçimi** → Müşteri abonelik planı seçer
2. **Ödeme Formu** → Iyzico güvenli ödeme sayfası açılır
3. **Kart Bilgileri** → Müşteri kart bilgilerini girer
4. **3D Secure** → Banka SMS onayı
5. **Ödeme Onayı** → Başarılı/Başarısız sonuç
6. **Abonelik Aktivasyonu** → Otomatik plan aktivasyonu

## 🎯 Abonelik Fiyatlandırması

| Plan | Aylık | Yıllık (17% İndirim) | Taksit |
|------|-------|---------------------|---------|
| **Başlangıç** | ₺999 | ₺9,990 | 12 aya kadar |
| **Profesyonel** | ₺2,499 | ₺24,990 | 12 aya kadar |
| **Kurumsal** | ₺4,999 | ₺49,990 | 12 aya kadar |

## 📊 Maliyet Hesaplama

### Örnek: ₺2,499 Aylık Abonelik
```
Müşteri Öder:     ₺2,499.00
Iyzico Komisyonu: ₺62.72 (%2.49 + ₺0.49)
Net Kazanç:       ₺2,436.28
KDV (%20):        ₺487.26
---
Elinize Geçen:    ₺1,949.02
```

## 🔧 Test Kartları

```javascript
// Başarılı Ödeme
Kart No: 5528790000000008
SKT: 12/2030
CVV: 123

// 3D Secure Test
Kart No: 4603450000000000
SKT: 12/2025
CVV: 123
SMS Kodu: 283126

// Başarısız Ödeme
Kart No: 4111111111111129
```

## 📱 Mobil Ödeme Seçenekleri

### BKM Express
- Tek tıkla ödeme
- Kart bilgisi saklanır
- Hızlı checkout

### Masterpass
- QR kod ile ödeme
- Temassız ödeme
- Mobil cüzdan

## 🔐 Güvenlik

### PCI DSS Uyumlu
- Kart bilgileri Iyzico'da saklanır
- Tokenization sistemi
- SSL sertifikası zorunlu

### Fraud Protection
- Makine öğrenmesi ile dolandırıcılık tespiti
- Risk skoru analizi
- Şüpheli işlem bildirimi

## 📈 Raporlama

### Dashboard Özellikleri:
- Günlük/Aylık özet
- İşlem detayları
- İptal/İade takibi
- Taksit raporları
- Excel export

## 🚀 Canlıya Geçiş Checklist

- [ ] Iyzico onayı alındı
- [ ] Canlı API anahtarları .env'ye eklendi
- [ ] SSL sertifikası aktif
- [ ] Webhook URL'leri güncellendi
- [ ] Test ödemeleri yapıldı
- [ ] Fatura bilgileri tamamlandı
- [ ] Kullanım şartları/KVKK metinleri hazır
- [ ] Müşteri desteği hazır

## 📞 Destek

### Iyzico Destek:
- Tel: 0850 314 44 99
- Email: destek@iyzico.com
- Canlı Destek: 09:00-18:00

### Teknik Dokümantasyon:
- dev.iyzipay.com
- github.com/iyzico

## 💡 İpuçları

1. **Taksit Komisyonları**: 6+ taksitte ek komisyon alabilirsiniz
2. **Pazarlık**: Yüksek hacimde %2'ye kadar düşebilir
3. **Anında Çekim**: T+1 gün (ertesi gün hesabınızda)
4. **Yurtdışı Kartlar**: %3.49 + ₺0.49 komisyon
5. **Recurring Payment**: Otomatik tekrarlayan ödeme desteği

---

## 🎯 Sonraki Adımlar

1. **Test Ortamında Deneyin**
   ```bash
   npm run dev
   # http://localhost:5175/subscription
   ```

2. **Iyzico Hesabı Açın**
   - iyzico.com/basvuru

3. **Canlı Entegrasyon**
   - API anahtarlarını güncelleyin
   - Webhook'ları ayarlayın

4. **İlk Müşterinizi Alın! 🎉**

---

*Not: PayTR, Param veya diğer ödeme sistemleri için benzer entegrasyon yapılabilir.*
