import { 
  collection, 
  doc, 
  setDoc, 
  Timestamp 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { SAAS_CONFIG, getPlanById } from '../config/saas.config';

// ABC Şirketi için örnek veri oluştur
export const createSampleDataForABC = async () => {
  const companyId = 'company_7ZoNMYOpvmfrvctPg8U543uT6q2';
  
  try {
    console.log('ABC Şirketi için örnek veri oluşturuluyor...');
    
    // SAAS_CONFIG'den professional plan bilgilerini al
    const professionalPlan = getPlanById('professional');
    if (!professionalPlan) {
      throw new Error('Professional plan not found in SAAS_CONFIG');
    }
    
    // Önce ABC Şirketi'ni oluştur
    const abcCompanyData = {
      id: companyId,
      name: 'ABC ŞİRKETİ',
      email: 'info@abcsirketi.com',
      phone: '+90 555 000 0001',
      address: 'İstanbul, Türkiye',
      subscriptionPlan: 'professional',
      subscriptionStatus: 'active' as const,
      subscriptionPrice: professionalPlan.price, // SAAS_CONFIG'den al
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      isActive: true,
      trialEndDate: null,
      subscriptionStartDate: Timestamp.now(),
      nextBillingDate: Timestamp.fromDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)),
      subscriptionLimits: {
        users: professionalPlan.limits.users,
        storage: `${professionalPlan.limits.storageGB.toFixed(2)} GB`,
        storageLimit: professionalPlan.limits.storageGB * 1024, // MB cinsinden
        sahalar: professionalPlan.limits.sahalar,
        santraller: professionalPlan.limits.santraller,
        arizaKaydi: professionalPlan.limits.arizaKaydi,
        bakimKaydi: professionalPlan.limits.bakimKaydi
      },
      subscriptionFeatures: {
        aiFeatures: true,
        customReports: true,
        apiAccess: false,
        support: 'priority'
      },
      metrics: {
        storageUsedMB: 51.2, // 0.05 GB ile uyumlu
        fileCount: 12,
        breakdown: {
          logos: 2.1,
          arizaPhotos: 25.6,
          bakimPhotos: 8.3,
          vardiyaPhotos: 12.8,
          documents: 2.4,
          other: 0
        },
        lastStorageCalculation: new Date()
      }
    };
    
    // 1. Kullanıcılar ekle
    const users = [
      {
        id: 'user_abc_admin',
        companyId,
        email: 'admin@abcsirketi.com',
        ad: 'Ahmet Yılmaz',
        rol: 'yonetici',
        telefon: '+90 555 123 4567',
        isActive: true,
        aktif: true,
        sonGiris: Timestamp.now(),
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      },
      {
        id: 'user_abc_engineer',
        companyId,
        email: 'muhendis@abcsirketi.com',
        ad: 'Mehmet Demir',
        rol: 'muhendis',
        telefon: '+90 555 234 5678',
        isActive: true,
        aktif: true,
        sonGiris: Timestamp.fromDate(new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)), // 2 gün önce
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      },
      {
        id: 'user_abc_technician',
        companyId,
        email: 'tekniker@abcsirketi.com',
        ad: 'Ali Kaya',
        rol: 'tekniker',
        telefon: '+90 555 345 6789',
        isActive: true,
        aktif: true,
        sonGiris: Timestamp.fromDate(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)), // 1 hafta önce
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      }
    ];

    // 2. Sahalar ekle
    const sahalar = [
      {
        id: 'saha_abc_1',
        companyId,
        ad: 'Ankara Solar Sahası',
        adres: 'Ankara, Türkiye',
        koordinat: {
          lat: 39.9334,
          lng: 32.8597
        },
        kapasite: 1500, // kW
        durum: 'aktif',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      },
      {
        id: 'saha_abc_2',
        companyId,
        ad: 'İstanbul Solar Sahası',
        adres: 'İstanbul, Türkiye',
        koordinat: {
          lat: 41.0082,
          lng: 28.9784
        },
        kapasite: 2000, // kW
        durum: 'aktif',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      }
    ];

    // 3. Santraller ekle
    const santraller = [
      {
        id: 'santral_abc_1',
        companyId,
        sahaId: 'saha_abc_1',
        ad: 'Ankara GES-1',
        kapasite: 750, // kW
        durum: 'aktif',
        kurulumTarihi: Timestamp.fromDate(new Date('2023-01-15')),
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      },
      {
        id: 'santral_abc_2',
        companyId,
        sahaId: 'saha_abc_1',
        ad: 'Ankara GES-2',
        kapasite: 750, // kW
        durum: 'aktif',
        kurulumTarihi: Timestamp.fromDate(new Date('2023-03-20')),
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      },
      {
        id: 'santral_abc_3',
        companyId,
        sahaId: 'saha_abc_2',
        ad: 'İstanbul GES-1',
        kapasite: 1000, // kW
        durum: 'aktif',
        kurulumTarihi: Timestamp.fromDate(new Date('2023-06-10')),
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      },
      {
        id: 'santral_abc_4',
        companyId,
        sahaId: 'saha_abc_2',
        ad: 'İstanbul GES-2',
        kapasite: 1000, // kW
        durum: 'aktif',
        kurulumTarihi: Timestamp.fromDate(new Date('2023-08-15')),
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      }
    ];

    // 4. Arızalar ekle
    const arizalar = [
      {
        id: 'ariza_abc_1',
        companyId,
        sahaId: 'saha_abc_1',
        santralId: 'santral_abc_1',
        baslik: 'İnvertör Arızası',
        aciklama: 'İnvertör 3 nolu ünitede arıza tespit edildi',
        durum: 'acik',
        oncelik: 'yuksek',
        olusturmaTarihi: Timestamp.fromDate(new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)),
        olusturanKullanici: 'user_abc_engineer',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      },
      {
        id: 'ariza_abc_2',
        companyId,
        sahaId: 'saha_abc_2',
        santralId: 'santral_abc_3',
        baslik: 'Panel Temizliği Gerekli',
        aciklama: 'Panellerde toz birikimi nedeniyle verimlilik düşüşü',
        durum: 'cozuldu',
        oncelik: 'normal',
        olusturmaTarihi: Timestamp.fromDate(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)),
        cozumTarihi: Timestamp.fromDate(new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)),
        olusturanKullanici: 'user_abc_technician',
        cozumAciklamasi: 'Panel temizliği tamamlandı',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      },
      {
        id: 'ariza_abc_3',
        companyId,
        sahaId: 'saha_abc_1',
        santralId: 'santral_abc_2',
        baslik: 'Kablo Hasarı',
        aciklama: 'DC kablolarında hasar tespit edildi',
        durum: 'devam-ediyor',
        oncelik: 'kritik',
        olusturmaTarihi: Timestamp.fromDate(new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)),
        olusturanKullanici: 'user_abc_admin',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      }
    ];

    // Verileri Firebase'e kaydet
    const promises = [];

    // ABC Şirketi'ni kaydet
    promises.push(setDoc(doc(db, 'companies', companyId), abcCompanyData));

    // Kullanıcıları kaydet
    for (const user of users) {
      promises.push(setDoc(doc(db, 'kullanicilar', user.id), user));
    }

    // Sahaları kaydet
    for (const saha of sahalar) {
      promises.push(setDoc(doc(db, 'sahalar', saha.id), saha));
    }

    // Santralleri kaydet
    for (const santral of santraller) {
      promises.push(setDoc(doc(db, 'santraller', santral.id), santral));
    }

    // Arızaları kaydet
    for (const ariza of arizalar) {
      promises.push(setDoc(doc(db, 'arizalar', ariza.id), ariza));
    }

    await Promise.all(promises);
    
    console.log('✅ ABC Şirketi için örnek veri başarıyla oluşturuldu!');
    console.log(`📊 Oluşturulan veriler:
    - 1 şirket (ABC ŞİRKETİ)
    - ${users.length} kullanıcı
    - ${sahalar.length} saha  
    - ${santraller.length} santral
    - ${arizalar.length} arıza
    - 51.2 MB depolama metrikleri`);

    return {
      success: true,
      message: 'Örnek veri başarıyla oluşturuldu',
      data: {
        users: users.length,
        sahalar: sahalar.length,
        santraller: santraller.length,
        arizalar: arizalar.length
      }
    };

  } catch (error) {
    console.error('❌ Örnek veri oluşturma hatası:', error);
    throw error;
  }
};
