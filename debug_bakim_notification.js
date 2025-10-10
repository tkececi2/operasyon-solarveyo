/**
 * Bakım Bildirimi Debug Scripti
 * Manuel olarak elektrik bakım bildirimi test et
 */

// Firebase Console'da çalıştır:
// https://console.firebase.google.com/project/yenisirket-2ec3b/firestore/data

// 1. Önce notifications koleksiyonunu temizle
console.log("📋 Notifications debug başlıyor...");

// 2. Test bildirimi oluştur (manuel)
const testNotification = {
  companyId: "company_CN2IUZpTVSa2WeuAN9hKo3rrM8H3", // Gerçek company ID
  title: "🔧 DEBUG BAKIM TESTİ",
  message: "Manuel debug test - elektrik bakım bildirimi",
  type: "success",
  actionUrl: "/bakim/elektrik",
  metadata: {
    maintenanceId: "debug_test_" + Date.now(),
    maintenanceType: "elektrik",
    debugTest: true
  },
  roles: ["yonetici", "muhendis", "tekniker", "bekci", "musteri"],
  createdAt: new Date(),
  read: false
};

console.log("📤 Test bildirimi oluşturuluyor:", testNotification);

// 3. Firestore'a kaydet - Functions trigger olacak
// Firebase Console > Firestore > notifications koleksiyonuna manuel ekle

// 4. Functions loglarında şunu ara:
// - "🔔 sendPushOnNotificationCreate BAŞLADI"
// - FCM Token kontrolü
// - Push gönderim sonucu

// 5. Kullanıcı kontrol et:
const userId = "MYaec4xy9SSq0ecHOFHeOMI9zP32"; // Yönetici
// Firebase Console > Firestore > kullanicilar > [userId] > pushTokens.fcm var mı?

// 6. Debug checklist:
const debugChecklist = {
  "Notification oluşturuldu mu?": "✓ Firebase Console > Firestore > notifications",
  "Functions trigger oldu mu?": "✓ Firebase Console > Functions > Logs",  
  "FCM Token var mı?": "✓ Firestore > kullanicilar > [userId] > pushTokens.fcm",
  "Push gönderildi mi?": "✓ Functions logs: 'FCM mesajı gönderildi'",
  "Emergency Fix çalıştı mı?": "✓ Console logs: 'Emergency Fix başarılı'"
};

console.log("🔍 Debug Checklist:", debugChecklist);

// 7. Emergency Fix test
console.log("🚨 Emergency Fix Test - Manuel çalıştır:");
console.log(`
// Test sayfasında F12 > Console'a yapıştır:
EmergencyNotificationFix.sendGuaranteedNotification({
  companyId: "company_CN2IUZpTVSa2WeuAN9hKo3rrM8H3",
  title: "🚨 EMERGENCY DEBUG TEST",
  message: "Emergency Fix debug testi",
  type: "error",
  actionUrl: "/debug"
}).then(result => console.log("Emergency Fix sonuç:", result));
`);
