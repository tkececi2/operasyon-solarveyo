/**
 * Mevcut Company'lere metrics alanı ekleyen migration script
 * Tüm company'lere otomatik olarak metrics initialize edilir
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc, Timestamp } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAZdHmOkHazCMnRZuZ6STP17wjG4QMHaxk",
  authDomain: "yenisirket-2ec3b.firebaseapp.com",
  projectId: "yenisirket-2ec3b",
  storageBucket: "yenisirket-2ec3b.firebasestorage.app",
  messagingSenderId: "950105916949",
  appId: "1:950105916949:web:bf6e31ee1855d5cdbb0c66",
  measurementId: "G-61Z9XM6J7X"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function fixCompanyMetrics() {
  console.log('🔧 Company Metrics Migration Başlatılıyor...\n');
  
  try {
    // Tüm company'leri al
    const companiesRef = collection(db, 'companies');
    const snapshot = await getDocs(companiesRef);
    
    console.log(`📊 Toplam ${snapshot.size} şirket bulundu\n`);
    
    let updatedCount = 0;
    let skippedCount = 0;
    
    for (const docSnap of snapshot.docs) {
      const companyData = docSnap.data();
      const companyId = docSnap.id;
      
      console.log(`📋 İşleniyor: ${companyData.name} (${companyId})`);
      
      // Eğer metrics yoksa veya eksikse ekle
      if (!companyData.metrics || !companyData.metrics.storageUsedMB) {
        const now = Timestamp.now();
        
        const updates: any = {
          'metrics.storageUsedMB': 0,
          'metrics.fileCount': 0,
          'metrics.lastStorageCalculation': now,
          'metrics.breakdown.logos': 0,
          'metrics.breakdown.arizaPhotos': 0,
          'metrics.breakdown.bakimPhotos': 0,
          'metrics.breakdown.vardiyaPhotos': 0,
          'metrics.breakdown.documents': 0,
          'metrics.breakdown.other': 0,
        };
        
        // subscriptionLimits kontrolü
        if (!companyData.subscriptionLimits) {
          updates.subscriptionLimits = {
            users: 3,
            sahalar: 2,
            santraller: 3,
            storageGB: 1,
            storageLimit: 1024 // MB cinsinden (1GB = 1024MB)
          };
        } else if (!companyData.subscriptionLimits.storageLimit) {
          // StorageLimit yoksa GB'den hesapla
          const storageGB = companyData.subscriptionLimits.storageGB || 1;
          updates['subscriptionLimits.storageLimit'] = storageGB * 1024;
        }
        
        await updateDoc(doc(db, 'companies', companyId), updates);
        
        console.log(`   ✅ Güncellendi`);
        updatedCount++;
      } else {
        console.log(`   ⏭️  Zaten güncel`);
        skippedCount++;
      }
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('✅ Migration Tamamlandı!');
    console.log(`   📊 Toplam: ${snapshot.size} şirket`);
    console.log(`   ✅ Güncellenen: ${updatedCount} şirket`);
    console.log(`   ⏭️  Atlanan: ${skippedCount} şirket`);
    console.log('='.repeat(50) + '\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Hata oluştu:', error);
    process.exit(1);
  }
}

// Script'i çalıştır
fixCompanyMetrics();

