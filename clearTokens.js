// Firebase Admin SDK ile tüm kullanıcıların token'larını temizleme scripti
// Terminal'de çalıştırın: node clearTokens.js

const admin = require('firebase-admin');

// Service account key'i buraya yapıştırın
const serviceAccount = {
  "type": "service_account",
  "project_id": "yenisirket-2ec3b",
  "private_key_id": "YOUR_KEY_ID",
  "private_key": "YOUR_PRIVATE_KEY",
  "client_email": "YOUR_CLIENT_EMAIL",
  "client_id": "YOUR_CLIENT_ID",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "YOUR_CERT_URL"
};

// Firebase Admin'i başlat
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://yenisirket-2ec3b.firebaseio.com"
});

const db = admin.firestore();

async function clearAllTokens() {
  try {
    console.log('🔄 Tüm FCM token\'ları temizleniyor...');
    
    // Tüm kullanıcıları al
    const usersSnapshot = await db.collection('kullanicilar').get();
    
    let clearedCount = 0;
    const batch = db.batch();
    
    usersSnapshot.forEach((doc) => {
      const userData = doc.data();
      
      // Token varsa temizle
      if (userData.pushTokens || userData.fcmToken) {
        console.log(`🗑️ Temizleniyor: ${userData.email || doc.id}`);
        
        const userRef = db.collection('kullanicilar').doc(doc.id);
        batch.update(userRef, {
          pushTokens: admin.firestore.FieldValue.delete(),
          fcmToken: admin.firestore.FieldValue.delete(),
          pushTokenUpdatedAt: admin.firestore.FieldValue.delete()
        });
        
        clearedCount++;
      }
    });
    
    // Batch commit
    await batch.commit();
    
    console.log(`✅ Toplam ${clearedCount} kullanıcının token'ı temizlendi`);
    console.log('📱 Şimdi iOS uygulamasından giriş yapın, yeni token otomatik kaydedilecek!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Hata:', error);
    process.exit(1);
  }
}

// Scripti çalıştır
clearAllTokens();
