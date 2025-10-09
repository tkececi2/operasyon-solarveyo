# Firebase Functions Loglarını Kontrol Et

## Adımlar:

1. **Firebase Console'u Aç**: https://console.firebase.google.com

2. **Projen Seç**: yenisirket-2ec3b

3. **Functions Sekmesine Git**: Sol menüden "Functions"

4. **sendPushOnNotificationCreate Fonksiyonunu Kontrol Et**:
   - "sendPushOnNotificationCreate" fonksiyonuna tıkla
   - "Logs" sekmesine tıkla
   - Son 1 saat içindeki logları kontrol et

5. **Aranacak Log Mesajları**:

   **✅ Başarılı (Hiçbir log olmamalı - başarılıysa sessiz çalışır)**
   
   **❌ Uyarı Logları:**
   ```
   "sendPushOnNotificationCreate: eksik alan"
   → userId veya title/message eksik
   
   "sendPushOnNotificationCreate: kullanıcı bulunamadı"
   → userId Firestore'da yok
   
   "sendPushOnNotificationCreate: companyId uyuşmuyor"
   → Kullanıcının companyId'si bildiriminkiyle uyuşmuyor
   
   "sendPushOnNotificationCreate: kullanıcı token yok"
   → FCM token bulunamadı
   ```
   
   **❌ Hata Logları:**
   ```
   "sendPushOnNotificationCreate error"
   → FCM gönderim hatası
   ```

6. **createScopedNotification Fonksiyonunu Kontrol Et**:
   - "createScopedNotification" fonksiyonuna tıkla
   - "Logs" sekmesine tıkla
   - Son 1 saat içindeki logları kontrol et
   
   **Aranacak:**
   ```
   ✅ "created: 5" → 5 kullanıcıya bildirim oluşturuldu
   ❌ "invalid-argument" → Parametre eksik
   ❌ "internal" → Firebase hatası
   ```

---

## Sonuçları Buraya Yaz:

**sendPushOnNotificationCreate Logları:**
- [ ] Hiç log yok (iyi işaret değil - trigger olmamış)
- [ ] "eksik alan" uyarısı var (hangi alan?)
- [ ] "kullanıcı token yok" uyarısı var
- [ ] Başka hata: _____________

**createScopedNotification Logları:**
- [ ] "created: X" mesajı var (kaç kullanıcı?)
- [ ] Hata var: _____________
- [ ] Hiç log yok

