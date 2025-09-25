# 🚀 Abonelik Sistemi Migrasyonu

## ❌ Problem
Sistemde **6 farklı** abonelik paket tanımı vardı ve her biri farklı fiyatlar içeriyordu:

| Dosya | Starter Fiyat | Professional Fiyat | Enterprise Fiyat |
|-------|---------------|-------------------|------------------|
| `saas.config.ts` | 299₺ | - | - |
| `subscriptionService.ts` | 999₺ | 2499₺ | 4999₺ |
| `superAdminService.ts` | 999₺ | 2499₺ | 4999₺ |
| `subscriptionManagementService.ts` | 199₺ | 499₺ | 999₺ |
| `subscription.config.ts` | 199₺ | 499₺ | - |
| `stripe/stripeService.ts` | 199₺ | 499₺ | null |

## ✅ Çözüm

### 🎯 Tek Merkezi Kaynak
Yeni sistem: `src/config/subscriptionPlans.config.ts`

```typescript
import { 
  SUBSCRIPTION_PLANS,
  getPlanById,
  getPlanPrice,
  formatPrice 
} from '../config/subscriptionPlans.config';
```

### 📊 Güncel Fiyatlar
| Plan | Aylık Fiyat | Yıllık Fiyat | İndirim |
|------|-------------|--------------|---------|
| **Trial** | 0₺ | 0₺ | - |
| **Starter** | 999₺ | 9.990₺ | %17 |
| **Professional** | 2.499₺ | 24.990₺ | %17 |
| **Enterprise** | 4.999₺ | 49.990₺ | %17 |

## 🔄 Migrasyon Durumu

### ✅ Tamamlanan
- [x] Merkezi konfigürasyon oluşturuldu
- [x] SuperAdminService güncellendi
- [x] SubscriptionService güncellendi  
- [x] CompanyManagementModal fiyatları güncellendi
- [x] Eski dosyalar deprecated olarak işaretlendi

### ⏳ Yapılacaklar
- [ ] ManagerSubscription.tsx güncellenmesi
- [ ] Dashboard.tsx güncellenmesi
- [ ] Stripe entegrasyonu güncellenmesi
- [ ] Test edilmesi

## 🛠️ Kullanım Örnekleri

### Plan Fiyatı Alma
```typescript
import { getPlanPrice, formatPrice } from '../config/subscriptionPlans.config';

const starterPrice = getPlanPrice('starter'); // 999
const formattedPrice = formatPrice(starterPrice); // "999₺"
```

### Plan Özellikleri Kontrol
```typescript
import { hasFeature, checkLimit } from '../config/subscriptionPlans.config';

const hasAI = hasFeature('professional', 'aiAnomaliTespiti'); // true
const canAddUser = checkLimit('starter', 'users', 5); // true (limit: 10)
```

### Plan Bilgisi Alma
```typescript
import { getPlanById } from '../config/subscriptionPlans.config';

const plan = getPlanById('professional');
console.log(plan.displayName); // "Profesyonel Paket"
console.log(plan.limits.users); // 50
```

## 🚨 Önemli Notlar

1. **Backward Compatibility**: Eski interface'ler korundu
2. **Gradual Migration**: Dosyalar tek tek güncellenecek
3. **Single Source of Truth**: Artık sadece `subscriptionPlans.config.ts` kullanılacak
4. **Type Safety**: TypeScript ile tam tip güvenliği sağlandı

## 📝 Sonraki Adımlar

1. Kalan dosyaları güncelle
2. Test senaryolarını çalıştır
3. Eski dosyaları sil
4. Dokümantasyonu güncelle
