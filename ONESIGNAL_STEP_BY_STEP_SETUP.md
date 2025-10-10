# 🚀 **ONESIGNAL ADIM ADIM SETUP - ŞİMDİ YAPALIM!**

## 📱 **1. APP OLUŞTURMA**

### **OneSignal Dashboard'da:**

#### **Adım 1: Create App**
```
1. Sol menüde "All Apps" altında "+ Create..." tıklayın
2. App Name: "Solarveyo Arıza Takip"
3. "Create App" butonuna tıklayın
```

#### **Adım 2: Platform Seçimi**
```
📱 iOS App:
   ✅ "Apple iOS" seçin
   Bundle Identifier: com.solarveyo.arizatakip
   App Name: Solarveyo Arıza Takip
   
🌐 Web Push:
   ✅ "Google Chrome & Firefox (Web Push)" seçin  
   Site Name: Solarveyo
   Site URL: https://solarveyo.com
   Default URL: https://app.solarveyo.com
   
📲 Android (opsiyonel):
   Package Name: com.solarveyo.arizatakip
```

---

## 🔑 **2. KEYS ALMA**

### **Dashboard → Settings → Keys & IDs**

#### **İhtiyacımız Olan:**
```
📋 App ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
📋 REST API Key: Y2RlM2ZjZGYtNjk2NS00MjQ4LWE0ODYtZDJhMjMwODE1MzA2

(Bu keys'leri bana verin, koda ekleyeyim!)
```

---

## ⚙️ **3. PLATFORM SETUP**

### **iOS Configuration:**
```
1. iOS platform seçildikten sonra
2. "Apple Push Certificate" upload edilecek
3. Development/Production certificates
4. (Şimdilik skip edebiliriz, sonra hallederiz)
```

### **Web Configuration:**
```
1. Web platform seçildikten sonra  
2. Site URL verification
3. Service Worker automatic setup
4. (OneSignal otomatik halleder)
```

---

## 📊 **4. SEGMENT SETUP (SAAS İÇİN)**

### **Company-Based Segments:**
```
1. Dashboard → Audience → Segments
2. "Create Segment" → "EDEON_YONETICILER"
   Filters:
   - Tag: companyId equals "edeon_enerji"  
   - Tag: role equals "yonetici"

3. "Create Segment" → "EDEON_TEKNIKER"
   Filters:
   - Tag: companyId equals "edeon_enerji"
   - Tag: role equals "tekniker"
```

---

## 🧪 **5. İLK TEST MESSAGE**

### **Dashboard'da Test:**
```
1. Messages → "New Push"
2. Audience: "All Users" 
3. Title: "🧪 OneSignal Test"
4. Message: "Solarveyo sistemi aktif!"
5. "Send Message"
```

---

## 🎯 **BENİM YAPACAKLARIM (KEYS ALDıKTAN SONRA)**

### **1. Code Update (1 dakika):**
```typescript
// src/services/oneSignalService.ts
const ONESIGNAL_APP_ID = 'YOUR_APP_ID_HERE';
const ONESIGNAL_REST_API_KEY = 'YOUR_REST_KEY_HERE';
```

### **2. Test Sistemi (2 dakika):**
```
1. /test/notifications → OneSignal test page
2. Test butonları → Çalışır duruma getir
3. Real test → Elektrik bakım oluştur
```

### **3. iOS Native Setup (5 dakika):**
```
1. AppDelegate.swift güncelle
2. OneSignal iOS SDK entegre
3. Push notification permissions
```

---

## 🚨 **HEMEN YAPIN:**

### **Dashboard'da Yapacaklarınız:**

#### **1. App Creation:**
```
All Apps → + Create → "Solarveyo Arıza Takip"
```

#### **2. Platform Setup:**
```
✅ iOS: com.solarveyo.arizatakip
✅ Web: solarveyo.com  
```

#### **3. Keys Alma:**
```
Settings → Keys & IDs → Copy:
- App ID
- REST API Key
```

#### **4. İlk Test:**
```
Messages → New Push → All Users → "Test Mesajı"
```

---

## 📱 **KEYS'LERİ ALIP BENİM İÇİN KOPYALAYIN:**

```
App ID: [BURAYA_YAPISTIRIN]
REST API Key: [BURAYA_YAPISTIRIN]
```

**Keys'leri aldıktan sonra 2 dakikada sistem %100 çalışır! 🚀**

**Lütfen keys'leri paylaşın, hemen entegre edeyim! 💪**
