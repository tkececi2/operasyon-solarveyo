import { 
  collection, 
  query,
  where,
  getDocs,
  deleteDoc,
  doc
} from 'firebase/firestore';
import { db } from '../lib/firebase';

export const cleanFakeAuditLogs = async () => {
  try {
    console.log('🧹 Sahte audit logları temizleniyor...');
    
    // Sahte email adreslerine sahip logları bul
    const fakeEmails = [
      'admin@solarveyo.com',
      'yonetici@sirket.com',
      'muhendis@sirket.com',
      'tekniker@sirket.com',
      'hacker@bad.com'
    ];
    
    const auditLogsRef = collection(db, 'auditLogs');
    const allLogsQuery = await getDocs(auditLogsRef);
    
    let deletedCount = 0;
    const deletePromises: Promise<void>[] = [];
    
    allLogsQuery.forEach((logDoc) => {
      const data = logDoc.data();
      
      // Sahte logları tespit et
      if (
        fakeEmails.includes(data.userEmail) ||
        data.userId?.startsWith('test-user-') ||
        data.companyId === 'company-001' ||
        data.resourceId?.includes('test-') ||
        data.userName === 'Unknown' ||
        data.userName === 'Sistem Admin' ||
        data.userName === 'Şirket Yöneticisi' ||
        data.userName === 'Ali Mühendis' ||
        data.userName === 'Mehmet Tekniker'
      ) {
        deletePromises.push(deleteDoc(doc(db, 'auditLogs', logDoc.id)));
        deletedCount++;
      }
    });
    
    await Promise.all(deletePromises);
    
    console.log(`✅ ${deletedCount} sahte audit logu temizlendi`);
    
    // Gerçek logları listele
    const remainingLogsQuery = await getDocs(auditLogsRef);
    console.log(`📊 Geriye kalan gerçek log sayısı: ${remainingLogsQuery.size}`);
    
    return {
      deletedCount,
      remainingCount: remainingLogsQuery.size
    };
  } catch (error) {
    console.error('❌ Sahte logları temizlerken hata:', error);
    throw error;
  }
};

// Test verileri oluşturma fonksiyonunu güncelle - sahte audit logları eklemesin
export const createTestDataWithoutFakeAuditLogs = async () => {
  try {
    console.log('📦 Gerçek görünümlü test verileri oluşturuluyor (audit log hariç)...');
    
    // Sadece şirket ve kullanıcı verileri ekle, audit logları ekleme
    const companies = [
      {
        id: 'test-company-1',
        name: 'Güneş Enerji A.Ş.',
        ad: 'Güneş Enerji A.Ş.',
        email: 'info@gunesenerji.com',
        telefon: '0212 555 1234',
        phone: '0212 555 1234',
        adres: 'İstanbul, Türkiye',
        abonelikPlani: 'professional',
        abonelikDurumu: 'active',
        abonelikBaslangic: new Date(),
        abonelikBitis: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        olusturmaTarihi: new Date(),
        aktif: true
      },
      {
        id: 'test-company-2',
        name: 'Solar Power Ltd.',
        ad: 'Solar Power Ltd.',
        email: 'contact@solarpower.com',
        telefon: '0216 777 8899',
        phone: '0216 777 8899',
        adres: 'Ankara, Türkiye',
        abonelikPlani: 'enterprise',
        abonelikDurumu: 'active',
        abonelikBaslangic: new Date(),
        abonelikBitis: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        olusturmaTarihi: new Date(),
        aktif: true
      }
    ];
    
    // Şirketleri ekle
    for (const company of companies) {
      await setDoc(doc(db, 'companies', company.id), company);
    }
    
    console.log('✅ Test şirketleri eklendi (audit log yok)');
    
    return {
      companies: companies.length,
      auditLogs: 0
    };
  } catch (error) {
    console.error('❌ Test verileri oluşturulurken hata:', error);
    throw error;
  }
};
