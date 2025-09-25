# Temiz SaaS Mimarisi Önerisi - SolarVeyo

## 1. Firebase Native Özellikler

### A. Firebase Authentication ile Rol Yönetimi
```javascript
// Custom Claims ile rol yönetimi
{
  email: "user@company.com",
  customClaims: {
    companyId: "abc123",
    role: "yonetici",
    permissions: ["read", "write", "manage_users"]
  }
}
```

### B. Firestore Security Rules ile Veri İzolasyonu
```javascript
// firestore.rules
match /companies/{companyId} {
  allow read: if request.auth.token.companyId == companyId;
  allow write: if request.auth.token.role == 'yonetici' 
    && request.auth.token.companyId == companyId;
}
```

### C. Firebase Extensions
- **Stripe Subscriptions Extension**: Otomatik abonelik yönetimi
- **Send Email Extension**: Otomatik email bildirimleri
- **Resize Images Extension**: Fotoğraf optimizasyonu

## 2. Abonelik Yönetimi

### A. Tek Doğruluk Kaynağı: Stripe
```javascript
// Stripe'da plan oluştur
const plans = {
  trial: { price: 0, duration: 14, features: {...} },
  basic: { price: 199, duration: 30, features: {...} },
  professional: { price: 499, duration: 30, features: {...} }
};

// Firebase'de sadece Stripe referansı tut
companies/companyId {
  stripeCustomerId: "cus_xxx",
  stripeSubscriptionId: "sub_xxx",
  // Diğer şirket verileri...
}
```

### B. Webhook ile Senkronizasyon
```javascript
// Firebase Function - Stripe Webhook Handler
exports.stripeWebhook = functions.https.onRequest(async (req, res) => {
  const event = stripe.webhooks.constructEvent(req.rawBody, sig, endpointSecret);
  
  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
      await updateCompanySubscription(event.data.object);
      break;
    case 'customer.subscription.deleted':
      await handleSubscriptionCancellation(event.data.object);
      break;
  }
});
```

## 3. Yönetim Paneli Yerine API

### A. Firebase Admin SDK
```javascript
// admin-api/index.js
const admin = require('firebase-admin');

// Şirket oluştur
async function createCompany(data) {
  // 1. Stripe'da müşteri oluştur
  const customer = await stripe.customers.create({
    email: data.email,
    name: data.companyName,
    metadata: { companyId: data.id }
  });
  
  // 2. Trial subscription başlat
  const subscription = await stripe.subscriptions.create({
    customer: customer.id,
    items: [{ price: 'price_trial' }],
    trial_period_days: 14
  });
  
  // 3. Firebase'e kaydet
  await admin.firestore().collection('companies').doc(data.id).set({
    ...data,
    stripeCustomerId: customer.id,
    stripeSubscriptionId: subscription.id,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });
}
```

### B. REST API Endpoints
```javascript
// Cloud Functions API
exports.api = functions.https.onRequest(app);

app.post('/companies', authenticateAdmin, createCompany);
app.get('/companies', authenticateAdmin, listCompanies);
app.patch('/companies/:id', authenticateAdmin, updateCompany);
app.delete('/companies/:id', authenticateAdmin, deleteCompany);

app.post('/subscriptions/upgrade', authenticateManager, upgradeSubscription);
app.post('/subscriptions/cancel', authenticateManager, cancelSubscription);
```

## 4. Otomatik İşlemler

### A. Scheduled Functions
```javascript
// Her gün çalışan fonksiyon
exports.dailyTasks = functions.pubsub.schedule('every 24 hours').onRun(async (context) => {
  // Trial süresi dolan şirketleri kontrol et
  await checkExpiredTrials();
  
  // Storage limitlerini kontrol et
  await checkStorageLimits();
  
  // Otomatik raporları gönder
  await sendDailyReports();
});
```

### B. Triggered Functions
```javascript
// Yeni arıza eklendiğinde
exports.onFaultCreated = functions.firestore
  .document('arizalar/{faultId}')
  .onCreate(async (snap, context) => {
    const fault = snap.data();
    
    // SMS/Email bildirimi gönder
    await sendNotification(fault);
    
    // İstatistikleri güncelle
    await updateStatistics(fault.companyId);
    
    // AI analizi başlat
    await startAIAnalysis(fault);
  });
```

## 5. Kullanıcı Deneyimi

### A. Self-Service Portal
```javascript
// Yönetici kendisi yapabilir:
- Planını yükseltme/düşürme
- Ödeme yöntemi güncelleme
- Kullanıcı ekleme/çıkarma (limit dahilinde)
- Fatura görüntüleme/indirme
- API key oluşturma
```

### B. Otomatik Bildirimler
```javascript
// Email Templates
- Trial süresi bitimine 3 gün kala
- Ödeme başarısız olduğunda
- Storage limiti %80'e ulaştığında
- Yeni özellikler eklendiğinde
```

## 6. Monitoring & Analytics

### A. Firebase Performance Monitoring
- API yanıt süreleri
- Sayfa yükleme süreleri
- Hata oranları

### B. Firebase Analytics
- Kullanıcı davranışları
- Feature kullanım oranları
- Conversion funnel

### C. BigQuery Export
- Detaylı raporlama
- ML modelleri için veri
- Custom dashboards

## 7. Implementasyon Adımları

1. **Phase 1: Stripe Entegrasyonu (1 hafta)**
   - Stripe Extension kurulumu
   - Webhook handler
   - Payment UI

2. **Phase 2: Admin API (1 hafta)**
   - REST API endpoints
   - Authentication
   - Rate limiting

3. **Phase 3: Otomasyonlar (1 hafta)**
   - Scheduled functions
   - Triggered functions
   - Email templates

4. **Phase 4: Monitoring (3 gün)**
   - Performance setup
   - Analytics setup
   - Alerting

5. **Phase 5: Migration (3 gün)**
   - Data migration script
   - Testing
   - Rollout

## 8. Maliyet Optimizasyonu

- **Firebase Blaze Plan**: Pay-as-you-go
- **Stripe**: %2.9 + 30¢ per transaction
- **Cloud Functions**: İlk 2M invocation ücretsiz
- **Firestore**: İlk 50K okuma/20K yazma ücretsiz/gün

## 9. Güvenlik

- **2FA zorunlu**: Tüm yöneticiler için
- **API rate limiting**: DDoS koruması
- **Audit logs**: Tüm işlemler loglanır
- **GDPR uyumlu**: Veri silme/export

