const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function checkUser() {
  try {
    // Auth durumu
    const userRecord = await admin.auth().getUserByEmail('tkececi@edeonenerji.com');
    console.log('\n✅ Firebase Auth:');
    console.log('  - UID:', userRecord.uid);
    console.log('  - Email verified:', userRecord.emailVerified);
    console.log('  - Disabled:', userRecord.disabled);
    
    // Firestore profili
    const userDoc = await db.collection('kullanicilar').doc(userRecord.uid).get();
    if (userDoc.exists) {
      const data = userDoc.data();
      console.log('\n✅ Firestore Profile:');
      console.log('  - Aktif:', data.aktif);
      console.log('  - Rol:', data.rol);
      console.log('  - CompanyId:', data.companyId);
      console.log('  - Email:', data.email);
    } else {
      console.log('\n❌ Firestore\'da kullanıcı profili YOK!');
    }
  } catch (error) {
    console.error('❌ Hata:', error.message);
  }
  process.exit(0);
}

checkUser();
