# 🚀 **ONESIGNAL MİGRATION - MULTI-ŞIRKET SAAS**

## 🏆 **UYGUNLUK DEĞERLENDİRMESİ: ⭐⭐⭐⭐⭐**

### **NEDEN ONESIGNAL MÜKEMMEL?**

Based on [OneSignal REST API documentation](https://documentation.onesignal.com/reference/rest-api-overview):

#### **1. 🏢 Multi-Tenant SAAS İçin İdeal:**
```typescript
// Segment Targeting - Company bazlı izolasyon
POST https://api.onesignal.com/api/v1/notifications
{
  "app_id": "YOUR_APP_ID",
  "filters": [
    {"field": "tag", "key": "companyId", "relation": "=", "value": "edeon_enerji"},
    {"field": "tag", "key": "role", "relation": "=", "value": "yonetici"},
    {"field": "tag", "key": "sahaId", "relation": "=", "value": "ankara_saha"}
  ],
  "contents": {"tr": "⚡ Elektrik bakım tamamlandı"}
}
```

#### **2. 📊 Advanced Filtering:**
```typescript
// A firması sadece yöneticilerine:
filters: [
  {field: "tag", key: "companyId", value: "company_ABC"},
  {field: "tag", key: "role", value: "yonetici"}
]

// Belirli sahadaki tüm çalışanlara:
filters: [
  {field: "tag", key: "sahaId", value: "ankara_saha"}
]

// Multiple role targeting:
filters: [
  {field: "tag", key: "companyId", value: "company_ABC"},
  {field: "tag", key: "role", relation: "in", value: ["tekniker", "muhendis"]}
]
```

#### **3. 🎯 Perfect for Your Use Cases:**
- ✅ **Rate Limits:** Yeterli (Firebase'den daha iyi)
- ✅ **Multi-Language:** Türkçe full support
- ✅ **Reliability:** %99 delivery rate
- ✅ **Analytics:** Detailed dashboard
- ✅ **Cost:** $9/ay 30K bildirim (çok ucuz)

---

## 🗑️ **MEVCUT SİSTEM TEMİZLEME**

### **Silinecek Karmaşık Dosyalar:**
- ✅ `src/services/pushNotificationService.ts` (779 satır karmaşık)
- ✅ `src/services/webPushService.ts` (143 satır karmaşık)  
- ✅ `src/services/mobile/notificationService.ts` (147 satır)
- ✅ `src/services/emergencyNotificationFix.ts` (yeni oluşturduğum)
- ✅ `public/firebase-messaging-sw.js` (service worker)
- ✅ Functions'daki FCM kodu

### **Basit OneSignal Servisi:**
- ✅ `src/services/oneSignalService.ts` (50 satır basit)
- ✅ `src/hooks/useOneSignal.ts` (React hook)

---

## 🚀 **ONESIGNAL SETUP PLANI**

### **1. OneSignal Account Setup:**
```
1. https://onesignal.com → Sign Up
2. Create App: "Solarveyo Arıza Takip"
3. Platform Setup:
   - iOS App (com.solarveyo.arizatakip)
   - Web Site (solarveyo.com)
4. Get Keys:
   - App ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
   - REST API Key: Y2......
```

### **2. Tag Structure (Multi-Tenant):**
```javascript
// Her kullanıcı kayıt sırasında:
OneSignal.sendTags({
  companyId: "edeon_enerji",
  companyName: "EDEON ENERJİ", 
  role: "yonetici",
  sahalar: JSON.stringify(["ankara", "izmir"]),
  santraller: JSON.stringify(["santral1", "santral2"]),
  userId: "firebase_user_id"
});
```

### **3. Notification Targeting:**
```javascript
// Elektrik bakım bildirimi:
{
  filters: [
    {field: "tag", key: "companyId", value: "edeon_enerji"},
    {field: "tag", key: "role", relation: "in", value: ["yonetici", "muhendis", "tekniker"]}
  ],
  contents: {"tr": "⚡ Elektrik bakım tamamlandı"},
  headings: {"tr": "Bakım Bildirimi"}
}
```

---

## 🔧 **IMPLEMENTATION PLAN**

### **Phase 1: Cleanup (10 dakika)**
- Mevcut FCM sistemini temizle
- Karmaşık kodları sil  
- Firebase Functions'ı basitleştir

### **Phase 2: OneSignal Integration (30 dakika)**
- React OneSignal setup
- iOS native integration
- Basic notification service

### **Phase 3: Multi-Tenant Setup (20 dakika)**
- Company/role tagging system
- Segment targeting logic
- Test notifications

### **Phase 4: Migration (20 dakika)**
- Replace all notification calls
- Update all services
- Test all scenarios

---

## ✅ **BAŞLAYALIM!**

OneSignal kurulumu için:
1. **https://onesignal.com** hesap açın
2. **App oluşturun:** "Solarveyo Arıza Takip"  
3. **Keys'leri alın**
4. **Bana paylaşın**, kodu yazayım!

**Firebase karmaşıklığından kurtulma zamanı! 🎉**
