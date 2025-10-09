# 🔍 Tüm Kullanıcı Token'larını Kontrol

## SORUN:
- Arıza: 9 notification → 1+ token'ı olan var → Bildirim geliyor ✅
- Bakım: 5 notification → Hepsinin token'ı yok → Bildirim gelmiyor ❌

## KONTROL EDİLECEK:

### Firebase Console'da:
1. **`kullanicilar` koleksiyonu**
2. **Company: `company_CN2IUZpTVSa2WeuAN9hKo3rrM8H3`**
3. **Her kullanıcı için kontrol:**

| Kullanıcı ID | Email | Rol | pushTokens.fcm |
|--------------|-------|-----|----------------|
| CN2IUZpTVSa2WeuAN9hKo3rrM8H3 | ? | yonetici | ✅ VAR |
| NYA4t03VmDNyYAXO4FbW4iJ3dqJ2 | ? | muhendis | ❌ YOK |
| ... | ... | ... | ? |

## HIZLI ÇÖZÜM:

### Tüm kullanıcılara aynı token'ı verin:

Firebase Console'da her kullanıcı için:
1. **"Add field"** → `pushTokens` (Map)
2. İçine: `fcm` → **Mevcut token değeri**

**Mevcut token:** `en3WMiGNM03QhxkVMSu4sn:APA91bEo2wy8_MsmWZUexvg95W9BPOmCcdtKRJZ772649o...`

### Alternatif - Toplu Script:

Browser Console'da çalıştırın:
```javascript
// F12 > Console
const token = "en3WMiGNM03QhxkVMSu4sn:APA91bEo2wy8_MsmWZUexvg95W9BPOmCcdtKRJZ772649o...";

// Tüm kullanıcılara token ekle
const users = await getDocs(query(collection(db, 'kullanicilar'), where('companyId', '==', 'company_CN2IUZpTVSa2WeuAN9hKo3rrM8H3')));

for (const userDoc of users.docs) {
  await updateDoc(userDoc.ref, {
    pushTokens: { fcm: token },
    pushNotificationsEnabled: true
  });
  console.log('Token eklendi:', userDoc.data().email);
}
```
