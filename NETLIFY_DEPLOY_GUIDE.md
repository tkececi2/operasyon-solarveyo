# 🚀 Netlify Deploy Rehberi - VAPID Key

## ❌ SORUN
Netlify'da environment variable eklendi ama kullanıcılar token alamıyor.

## ✅ ÇÖZÜM

### 1. Environment Variable Kontrolü

Netlify Dashboard → Site Settings → Environment Variables

**Kontrol edin:**
```
Key: VITE_FIREBASE_VAPID_KEY
Value: BM_Ye19uN0c4VR8WEFTnTVCIoiF4a4al7mGhm3ZCVaKd26yIh9P-B37A5c8rcqrUoyRyNp3jONqYPWv4SaPKnsk
```

⚠️ **DİKKAT**: `VITE_` prefix'i ÇOK ÖNEMLİ! Yoksa Vite variable'ı göremez.

### 2. Yeni Deploy Tetikle

#### Yöntem A: Dashboard'dan (ÖNERİLEN)
1. Netlify Dashboard'a gidin
2. **Deploys** sekmesine tıklayın
3. **Trigger deploy** → **Clear cache and deploy site** seçin
4. Deploy tamamlanana kadar bekleyin (~2-3 dakika)

#### Yöntem B: Git Push ile
```bash
# Boş commit atarak deploy tetikle
git commit --allow-empty -m "trigger: Netlify rebuild for VAPID key"
git push origin main
```

### 3. Deploy Sonrası Kontrol

Deploy tamamlandıktan sonra:

1. **Netlify site URL'nize gidin** (örn: `https://yoursite.netlify.app`)
2. **Browser Console'u açın** (F12)
3. **Şu mesajları arayın:**

✅ **BAŞARILI** - Görmek istediğiniz:
```
🌐 Web Push: Başlatılıyor...
✅ Web Push: Bildirim izni alındı
🌐 Web FCM Token alındı: eyJhbGci...
```

❌ **BAŞARISIZ** - Bu mesajı görürseniz variable yüklenmemiş:
```
⚠️ Web Push: VAPID key yapılandırılmamış
💡 Firebase Console > Cloud Messaging > Web Push certificates...
```

### 4. Test

1. Test kullanıcı olarak giriş yapın
2. `/test/notifications` sayfasına gidin
3. Token görünüyor mu?
4. "Firebase Test Bildirimi" butonu çalışıyor mu?

## 🐛 Sorun Devam Ederse

### Build Logs Kontrol

Netlify Dashboard → Deploys → Son deploy → **Deploy logs**

Şunu arayın:
```
Building...
✓ built in XXXms
```

### Environment Variable'ın Build'e Dahil Olduğunu Kontrol

Deploy logs'da şunu görmeli:
```
Build environment:
- VITE_FIREBASE_VAPID_KEY=BM_Ye19...
```

Eğer görmüyorsanız:
1. Variable adını kontrol edin: `VITE_FIREBASE_VAPID_KEY` (tam olarak)
2. Scope'u kontrol edin: **All deploy contexts** seçilmeli
3. Variable'ı silip tekrar ekleyin

## 📋 Netlify Environment Variable Ayarları

### Doğru Ayarlar:
```
Key: VITE_FIREBASE_VAPID_KEY
Value: BM_Ye19uN0c4VR8WEFTnTVCIoiF4a4al7mGhm3ZCVaKd26yIh9P-B37A5c8rcqrUoyRyNp3jONqYPWv4SaPKnsk
Scopes: ✅ Production, ✅ Deploy Previews, ✅ Branch deploys
```

## 🔄 Deploy Sonrası Kullanıcılara Not

Kullanıcılarınıza söyleyin:
1. **Sayfayı yenileyin** (Hard refresh: Ctrl+Shift+R veya Cmd+Shift+R)
2. **Bildirim izni isteğini onaylayın**
3. **Token otomatik kaydedilecek**

---

## ✅ Checklist

- [ ] Netlify'da VITE_FIREBASE_VAPID_KEY eklendi
- [ ] Variable değeri doğru (BM_ ile başlıyor)
- [ ] "Clear cache and deploy site" ile yeni deploy yapıldı
- [ ] Deploy başarıyla tamamlandı
- [ ] Production sitede console'da VAPID key mesajları yok
- [ ] Token başarıyla alınıyor
- [ ] Test bildirimi çalışıyor

**Tamamlandı! 🎉**

