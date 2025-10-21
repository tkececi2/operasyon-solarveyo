import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAZdHmOkHazCMnRZuZ6STP17wjG4QMHaxk",
  authDomain: "yenisirket-2ec3b.firebaseapp.com",
  projectId: "yenisirket-2ec3b",
  storageBucket: "yenisirket-2ec3b.firebasestorage.app",
  messagingSenderId: "155422395281",
  appId: "1:155422395281:web:b496b7e93ae3d0a280a830"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function testLogin() {
  try {
    console.log('🔐 Test login başlıyor...');
    console.log('📧 Email: tkececi@edeonenerji.com');
    
    // Şifreyi stdin'den al
    const readline = await import('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    rl.question('🔑 Şifre: ', async (password) => {
      try {
        const userCredential = await signInWithEmailAndPassword(auth, 'tkececi@edeonenerji.com', password);
        console.log('\n✅ Firebase Auth LOGIN BAŞARILI!');
        console.log('   UID:', userCredential.user.uid);
        console.log('   Email verified:', userCredential.user.emailVerified);
        
        // Firestore profil kontrol
        const userDoc = await getDoc(doc(db, 'kullanicilar', userCredential.user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          console.log('\n✅ Firestore Profil:');
          console.log('   aktif:', data.aktif);
          console.log('   rol:', data.rol);
          console.log('   email:', data.email);
          console.log('   companyId:', data.companyId);
          
          if (data.aktif === false) {
            console.log('\n❌❌❌ SORUN BULUNDU: aktif = false');
            console.log('Bu hesap PASIF durumda - Login engelleniyor!');
          } else {
            console.log('\n✅ Hesap aktif - Login izni var');
          }
        } else {
          console.log('\n❌ Firestore\'da profil YOK!');
        }
      } catch (error) {
        console.error('\n❌ Login hatası:', error.code, error.message);
      } finally {
        process.exit(0);
      }
    });
    
  } catch (error) {
    console.error('❌ Hata:', error);
    process.exit(1);
  }
}

testLogin();
