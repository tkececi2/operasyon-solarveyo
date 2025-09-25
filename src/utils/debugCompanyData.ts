import { 
  collection, 
  getDocs,
  query,
  where,
  addDoc,
  Timestamp
} from 'firebase/firestore';
import { db } from '../lib/firebase';

export const debugCompanyData = async () => {
  console.log('🔍 Şirket verileri kontrol ediliyor...\n');
  
  try {
    // Tüm şirketleri getir
    const companiesSnapshot = await getDocs(collection(db, 'companies'));
    
    console.log(`📊 Toplam şirket sayısı: ${companiesSnapshot.size}\n`);
    
    for (const docSnap of companiesSnapshot.docs) {
      const data = docSnap.data();
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`🏢 Şirket: ${data.name || data.ad || 'İsimsiz'}`);
      console.log(`📝 ID: ${docSnap.id}`);
      console.log(`📧 Email: ${data.email}`);
      console.log(`📞 Telefon: ${data.telefon || data.phone || 'Yok'}`);
      console.log(`🔄 Durum: ${data.aktif ? '✅ Aktif' : '❌ Pasif'}`);
      console.log(`💳 Plan: ${data.subscriptionPlan || data.abonelikPlani || 'Belirsiz'}`);
      
      // Kullanıcıları kontrol et
      const kullanicilarSnapshot = await getDocs(
        query(collection(db, 'kullanicilar'), where('sirketId', '==', docSnap.id))
      );
      console.log(`\n👥 Kullanıcı Sayısı: ${kullanicilarSnapshot.size}`);
      
      if (kullanicilarSnapshot.size > 0) {
        console.log('   Kullanıcılar:');
        kullanicilarSnapshot.forEach(userDoc => {
          const userData = userDoc.data();
          console.log(`   - ${userData.ad || userData.name} (${userData.email}) - ${userData.rol}`);
        });
      }
      
      // Santralleri kontrol et
      const santrallerSnapshot = await getDocs(
        query(collection(db, 'santraller'), where('sirketId', '==', docSnap.id))
      );
      console.log(`\n⚡ Santral Sayısı: ${santrallerSnapshot.size}`);
      
      if (santrallerSnapshot.size > 0) {
        console.log('   Santraller:');
        santrallerSnapshot.forEach(santralDoc => {
          const santralData = santralDoc.data();
          console.log(`   - ${santralData.ad || santralData.name} (${santralData.kurulu_guc || 0} kW) - ${santralData.konum}`);
        });
      }
      
      // Sahaları kontrol et
      const sahalarSnapshot = await getDocs(
        query(collection(db, 'sahalar'), where('sirketId', '==', docSnap.id))
      );
      console.log(`\n🏭 Saha Sayısı: ${sahalarSnapshot.size}`);
      
      if (sahalarSnapshot.size > 0) {
        console.log('   Sahalar:');
        sahalarSnapshot.forEach(sahaDoc => {
          const sahaData = sahaDoc.data();
          console.log(`   - ${sahaData.ad || sahaData.name} - ${sahaData.konum || sahaData.il}`);
        });
      }
      
      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Hata:', error);
    return false;
  }
};

// Test verileri ekle
export const addTestDataForCompany = async (companyId: string) => {
  console.log(`🔧 ${companyId} için test verileri ekleniyor...`);
  
  try {
    // Test kullanıcıları ekle
    const testUsers = [
      {
        ad: 'Ali Yönetici',
        name: 'Ali Yönetici',
        email: 'ali@abcsirket.com',
        rol: 'yonetici',
        sirketId: companyId,
        telefon: '0532 111 2233',
        aktif: true,
        olusturmaTarihi: Timestamp.now(),
        createdAt: Timestamp.now()
      },
      {
        ad: 'Mehmet Mühendis',
        name: 'Mehmet Mühendis',
        email: 'mehmet@abcsirket.com',
        rol: 'muhendis',
        sirketId: companyId,
        telefon: '0533 444 5566',
        aktif: true,
        olusturmaTarihi: Timestamp.now(),
        createdAt: Timestamp.now()
      },
      {
        ad: 'Ayşe Tekniker',
        name: 'Ayşe Tekniker',
        email: 'ayse@abcsirket.com',
        rol: 'tekniker',
        sirketId: companyId,
        telefon: '0534 777 8899',
        aktif: true,
        olusturmaTarihi: Timestamp.now(),
        createdAt: Timestamp.now()
      }
    ];
    
    console.log('👥 Kullanıcılar ekleniyor...');
    for (const user of testUsers) {
      const docRef = await addDoc(collection(db, 'kullanicilar'), user);
      console.log(`   ✅ ${user.name} eklendi (${docRef.id})`);
    }
    
    // Test santralleri ekle
    const testSantraller = [
      {
        ad: 'İstanbul GES',
        name: 'İstanbul GES',
        konum: 'İstanbul',
        il: 'İstanbul',
        ilce: 'Silivri',
        kurulu_guc: 1500,
        sirketId: companyId,
        durum: 'aktif',
        koordinatlar: {
          lat: 41.0082,
          lng: 28.9784
        },
        olusturmaTarihi: Timestamp.now(),
        createdAt: Timestamp.now()
      },
      {
        ad: 'Ankara GES',
        name: 'Ankara GES',
        konum: 'Ankara',
        il: 'Ankara',
        ilce: 'Polatlı',
        kurulu_guc: 2500,
        sirketId: companyId,
        durum: 'aktif',
        koordinatlar: {
          lat: 39.9334,
          lng: 32.8597
        },
        olusturmaTarihi: Timestamp.now(),
        createdAt: Timestamp.now()
      },
      {
        ad: 'İzmir GES',
        name: 'İzmir GES',
        konum: 'İzmir',
        il: 'İzmir',
        ilce: 'Bergama',
        kurulu_guc: 1000,
        sirketId: companyId,
        durum: 'aktif',
        koordinatlar: {
          lat: 38.4192,
          lng: 27.1287
        },
        olusturmaTarihi: Timestamp.now(),
        createdAt: Timestamp.now()
      }
    ];
    
    console.log('⚡ Santraller ekleniyor...');
    for (const santral of testSantraller) {
      const docRef = await addDoc(collection(db, 'santraller'), santral);
      console.log(`   ✅ ${santral.name} eklendi (${docRef.id})`);
    }
    
    // Test sahalar ekle
    const testSahalar = [
      {
        ad: 'İstanbul Saha',
        name: 'İstanbul Saha',
        konum: 'İstanbul',
        il: 'İstanbul',
        ilce: 'Silivri',
        sirketId: companyId,
        durum: 'aktif',
        sorumlu: 'Ali Yönetici',
        telefon: '0212 555 0001',
        olusturmaTarihi: Timestamp.now(),
        createdAt: Timestamp.now()
      },
      {
        ad: 'Ankara Saha',
        name: 'Ankara Saha',
        konum: 'Ankara',
        il: 'Ankara',
        ilce: 'Polatlı',
        sirketId: companyId,
        durum: 'aktif',
        sorumlu: 'Mehmet Mühendis',
        telefon: '0312 444 0002',
        olusturmaTarihi: Timestamp.now(),
        createdAt: Timestamp.now()
      }
    ];
    
    console.log('🏭 Sahalar ekleniyor...');
    for (const saha of testSahalar) {
      const docRef = await addDoc(collection(db, 'sahalar'), saha);
      console.log(`   ✅ ${saha.name} eklendi (${docRef.id})`);
    }
    
    console.log('\n✅ Tüm test verileri başarıyla eklendi!');
    return true;
  } catch (error) {
    console.error('❌ Test verileri eklenirken hata:', error);
    return false;
  }
};

// Window objesine ekle (konsol'dan çağırabilmek için)
if (typeof window !== 'undefined') {
  (window as any).debugCompanyData = debugCompanyData;
  (window as any).addTestDataForCompany = addTestDataForCompany;
}
