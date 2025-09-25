import { 
  collection, 
  getDocs,
  doc,
  updateDoc,
  query,
  where,
  Timestamp
} from 'firebase/firestore';
import { db } from '../lib/firebase';

export const checkAndFixCompanyData = async () => {
  try {
    console.log('Şirket verileri kontrol ediliyor...');
    
    // Tüm şirketleri getir
    const companiesSnapshot = await getDocs(collection(db, 'companies'));
    
    for (const docSnap of companiesSnapshot.docs) {
      const data = docSnap.data();
      console.log(`Şirket ID: ${docSnap.id}`);
      console.log('Mevcut veri:', data);
      
      // Eğer name alanı yoksa veya "İsimsiz Şirket" ise düzelt
      const updates: any = {};
      
      // İsim kontrolü
      if (!data.name || data.name === 'İsimsiz Şirket') {
        // Eğer ad alanı varsa onu kullan, yoksa varsayılan isim ata
        updates.name = data.ad || 'ABC Şirket';
      }
      
      // Email kontrolü
      if (!data.email) {
        updates.email = 'info@abcsirket.com';
      }
      
      // Telefon kontrolü
      if (!data.phone && !data.telefon) {
        updates.phone = '0212 555 0001';
        updates.telefon = '0212 555 0001';
      }
      
      // Abonelik durumu
      if (!data.subscriptionStatus) {
        updates.subscriptionStatus = data.abonelikDurumu || 'trial';
      }
      
      if (!data.subscriptionPlan) {
        updates.subscriptionPlan = data.abonelikPlani || 'Başlangıç';
      }
      
      // Tarihler
      if (!data.createdAt) {
        updates.createdAt = data.olusturmaTarihi || Timestamp.now();
      }
      
      // Güncelleme gerekiyorsa yap
      if (Object.keys(updates).length > 0) {
        console.log(`${docSnap.id} güncelleniyor:`, updates);
        await updateDoc(doc(db, 'companies', docSnap.id), updates);
        console.log('Güncelleme tamamlandı!');
      }
      
      // Kullanıcı ve santral sayılarını kontrol et
      const kullanicilarSnapshot = await getDocs(
        query(collection(db, 'kullanicilar'), where('sirketId', '==', docSnap.id))
      );
      const santrallerSnapshot = await getDocs(
        query(collection(db, 'santraller'), where('sirketId', '==', docSnap.id))
      );
      
      console.log(`Kullanıcı sayısı: ${kullanicilarSnapshot.size}`);
      console.log(`Santral sayısı: ${santrallerSnapshot.size}`);
      
      // Eğer kullanıcı yoksa test kullanıcıları ekle
      if (kullanicilarSnapshot.size === 0) {
        console.log('Kullanıcı bulunamadı, test kullanıcıları ekleniyor...');
        await createTestUsers(docSnap.id);
      }
      
      // Eğer santral yoksa test santralleri ekle
      if (santrallerSnapshot.size === 0) {
        console.log('Santral bulunamadı, test santraller ekleniyor...');
        await createTestSantraller(docSnap.id);
      }
    }
    
    console.log('Kontrol ve düzeltme tamamlandı!');
    return { success: true };
  } catch (error) {
    console.error('Hata:', error);
    return { success: false, error };
  }
};

// Test kullanıcıları oluştur
const createTestUsers = async (companyId: string) => {
  const { addDoc } = await import('firebase/firestore');
  
  const testUsers = [
    {
      ad: 'Ali Yönetici',
      email: 'yonetici@abcsirket.com',
      rol: 'yonetici',
      sirketId: companyId,
      telefon: '0532 111 2233',
      aktif: true,
      olusturmaTarihi: Timestamp.now()
    },
    {
      ad: 'Mehmet Mühendis',
      email: 'muhendis@abcsirket.com',
      rol: 'muhendis',
      sirketId: companyId,
      telefon: '0533 444 5566',
      aktif: true,
      olusturmaTarihi: Timestamp.now()
    }
  ];
  
  for (const user of testUsers) {
    await addDoc(collection(db, 'kullanicilar'), user);
  }
  
  console.log('Test kullanıcıları eklendi');
};

// Test santralleri oluştur
const createTestSantraller = async (companyId: string) => {
  const { addDoc } = await import('firebase/firestore');
  
  const testSantraller = [
    {
      ad: 'Santral 1',
      konum: 'İstanbul',
      kurulu_guc: 1000,
      sirketId: companyId,
      durum: 'aktif',
      koordinatlar: {
        lat: 41.0082,
        lng: 28.9784
      },
      olusturmaTarihi: Timestamp.now()
    },
    {
      ad: 'Santral 2',
      konum: 'Ankara',
      kurulu_guc: 500,
      sirketId: companyId,
      durum: 'aktif',
      koordinatlar: {
        lat: 39.9334,
        lng: 32.8597
      },
      olusturmaTarihi: Timestamp.now()
    }
  ];
  
  for (const santral of testSantraller) {
    await addDoc(collection(db, 'santraller'), santral);
  }
  
  console.log('Test santralleri eklendi');
};
