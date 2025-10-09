# 🔄 FCM Token Yenileme Kılavuzu

## ❌ SORUN
**`messaging/registration-token-not-registered`** hatası - Token geçersiz/eski

## ✅ ÇÖZÜM

### iOS Uygulamasında:

1. **Uygulamayı tamamen kapatın** (çift tıklayıp yukarı kaydırın)

2. **Uygulamayı açın ve giriş yapın**

3. **Settings > Profil sayfasına gidin**

4. **"Token Yenile" butonu ekleyelim** (geçici çözüm için Console'dan yapalım)

### Firebase Console'dan Manuel Token Silme:

1. **Firebase Console > Firestore Database**
2. **`kullanicilar` koleksiyonu**
3. **Kullanıcınızı bulun** (email ile arama yapın)
4. **`pushTokens` alanını silin** (çöp kutusu ikonuna tıklayın)
5. **`fcmToken` alanını silin** (varsa)

### iOS Uygulamasında Tekrar:

1. **Çıkış yapın** (Settings > Çıkış)
2. **Tekrar giriş yapın**
3. **Alert göreceksiniz:** "✅ Push Bildirimleri Aktif!"
4. **Token kaydedildi mesajı**

### Test:

1. **Uygulamayı arka plana alın veya kapatın**
2. **Web'den arıza kaydı oluşturun**
3. **Push bildirimi gelecek!**

## 🔍 DEBUG

### Xcode Console'da Kontrol Edilecekler:
```
🔥 FCM Token alındı (FirebaseMessaging): 
✅ FCM Token Firestore'a kaydedildi
```

### Firebase Functions Logs:
```
✅ FCM mesajı başarıyla gönderildi!
```

## 📱 Alternatif Çözüm - Token Yenileme Butonu

Settings sayfasına bu kodu ekleyin:

```tsx
// Token yenileme butonu
<button
  onClick={async () => {
    try {
      // Token'ı sil
      await updateDoc(doc(db, 'kullanicilar', user.uid), {
        'pushTokens': deleteField(),
        'fcmToken': deleteField()
      });
      
      // Yeni token al
      await PushNotificationService.initialize();
      await PushNotificationService.setUser(user.uid);
      
      alert('Token yenilendi!');
    } catch (error) {
      console.error('Token yenileme hatası:', error);
    }
  }}
  className="bg-blue-500 text-white px-4 py-2 rounded"
>
  🔄 Token Yenile
</button>
```
