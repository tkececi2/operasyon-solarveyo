# 📊 PostHog Kurulum Rehberi - SolarVeyo

## 🚀 Hızlı Başlangıç (10 Dakika)

### 1. PostHog Hesabı Açın
1. [app.posthog.com](https://app.posthog.com/signup) adresine gidin
2. Ücretsiz hesap oluşturun (kredi kartı gerekmez)
3. Proje adı: "SolarVeyo Production"

### 2. API Key'i Alın
1. Settings → Project Settings
2. "Project API Key" değerini kopyalayın (phc_ ile başlar)

### 3. .env Dosyasına Ekleyin
```bash
# .env dosyanıza ekleyin
VITE_POSTHOG_KEY=phc_YOUR_PROJECT_KEY
VITE_POSTHOG_HOST=https://app.posthog.com
```

### 4. Uygulamayı Yeniden Başlatın
```bash
npm run dev
```

## ✅ Entegrasyon Tamamlandı!

PostHog artık şunları otomatik takip ediyor:
- ✅ Sayfa görüntülemeleri
- ✅ Tıklamalar (autocapture)
- ✅ Session recording (%10 örnekleme)
- ✅ Login/logout eventleri
- ✅ Arıza oluşturma/çözme
- ✅ Plan limit aşımları

## 📈 İlk Dashboard'ınızı Oluşturun

1. PostHog'a giriş yapın
2. Dashboards → New Dashboard
3. Aşağıdaki widget'ları ekleyin:

### Widget 1: Günlük Aktif Kullanıcı
- Chart type: Line graph
- Event: $pageview
- Group by: Time (Daily)
- Breakdown: None

### Widget 2: En Çok Kullanılan Özellikler
- Chart type: Bar chart
- Events: 
  - ariza_created
  - user_login
  - feature_used
- Group by: Event name

### Widget 3: Arıza Çözme Süresi
- Chart type: Number
- Event: ariza_resolved
- Property: duration_hours
- Aggregation: Average

### Widget 4: Conversion Funnel
- Chart type: Funnel
- Steps:
  1. user_signup
  2. user_login
  3. ariza_created
  4. limit_reached
  5. upgrade_clicked

## 🎯 Özel Event'ler

Kodda eklediğimiz event'ler:

```typescript
// Login başarılı
trackEvent.login('email');

// Arıza oluşturuldu
trackEvent.arizaCreated({
  oncelik: 'yuksek',
  santralId: 'santral_123'
});

// Arıza çözüldü (süre saat cinsinden)
trackEvent.arizaResolved(24);

// Limit aşıldı
trackEvent.limitReached('user'); // veya 'santral', 'saha'

// Plan yükseltme tıklandı
trackEvent.upgradeClicked('starter', 'professional');
```

## 🔍 Session Recordings

1. PostHog → Session Recordings
2. Kullanıcıların ekran kayıtlarını izleyin
3. Nerede takıldıklarını görün
4. Hataları tespit edin

## 📊 Haftalık Rapor Oluşturma

1. Insights → New Insight
2. "Weekly Active Users" oluştur
3. Email subscription ekle
4. Her Pazartesi otomatik rapor alın

## 🚨 Alert Kurulumu

1. Alerts → New Alert
2. Örnek: "Günlük arıza sayısı 50'yi geçerse"
3. Slack/Email bildirimi ekle

## 💡 İpuçları

1. **İlk hafta sadece veri toplayın** - Hemen değişiklik yapmayın
2. **Session recordings izleyin** - Gerçek kullanıcı davranışını görün
3. **Funnel'ları takip edin** - Nerede kullanıcı kaybediyorsunuz?
4. **A/B Test yapın** - PostHog Experiments özelliği ile

## 🔧 Troubleshooting

### Event'ler görünmüyor?
- Browser console'da `posthog` yazın
- `posthog.capture('test_event')` çalıştırın
- PostHog → Events'te görünmeli

### Session recording çalışmıyor?
- Ad blocker kapalı mı?
- localhost'ta test ediyorsanız normal (production'da çalışır)

### Çok fazla event var?
- Autocapture'ı kapatabilirsiniz
- Sadece özel event'leri takip edin

## 📞 Destek

- PostHog Docs: [posthog.com/docs](https://posthog.com/docs)
- Community: [posthog.com/questions](https://posthog.com/questions)
- SolarVeyo Destek: destek@solarveyo.com

---

**NOT**: PostHog ücretsiz plan 1 milyon event/ay içerir. Normal kullanımda yeterlidir.

