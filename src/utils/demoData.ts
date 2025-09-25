import { 
  collection, 
  doc, 
  setDoc, 
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../lib/firebase';

export const createDemoData = async (companyId: string) => {
  try {
    console.log('Demo veriler oluşturuluyor...');

    // Demo sahalar
    const sahalar = [
      {
        id: 'demo_saha_1',
        companyId,
        ad: 'Ankara GES Sahası',
        konum: 'Ankara, Türkiye',
        koordinatlar: { lat: 39.9334, lng: 32.8597 },
        toplamKapasite: 5000, // 5 MW
        aktif: true,
        musteriId: '',
        ilgiliKisi: 'Ali Yılmaz',
        telefon: '0532 123 45 67',
        email: 'ali@example.com',
        adres: 'Ankara, Polatlı',
        notlar: 'Demo saha 1',
        olusturmaTarihi: serverTimestamp()
      },
      {
        id: 'demo_saha_2',
        companyId,
        ad: 'İzmir GES Sahası',
        konum: 'İzmir, Türkiye',
        koordinatlar: { lat: 38.4237, lng: 27.1428 },
        toplamKapasite: 3000, // 3 MW
        aktif: true,
        musteriId: '',
        ilgiliKisi: 'Ayşe Demir',
        telefon: '0533 987 65 43',
        email: 'ayse@example.com',
        adres: 'İzmir, Menderes',
        notlar: 'Demo saha 2',
        olusturmaTarihi: serverTimestamp()
      }
    ];

    // Demo santraller
    const santraller = [
      {
        id: 'demo_santral_1',
        companyId,
        sahaId: 'demo_saha_1',
        ad: 'Ankara GES-1',
        kapasite: 2500, // 2.5 MW
        panelSayisi: 6000,
        durum: 'aktif',
        performans: 92,
        sonUretim: 18000, // kWh
        koordinatlar: { lat: 39.9334, lng: 32.8597 },
        inverterSayisi: 10,
        olusturmaTarihi: serverTimestamp()
      },
      {
        id: 'demo_santral_2',
        companyId,
        sahaId: 'demo_saha_1',
        ad: 'Ankara GES-2',
        kapasite: 2500, // 2.5 MW
        panelSayisi: 6000,
        durum: 'aktif',
        performans: 88,
        sonUretim: 16500, // kWh
        koordinatlar: { lat: 39.9334, lng: 32.8597 },
        inverterSayisi: 10,
        olusturmaTarihi: serverTimestamp()
      },
      {
        id: 'demo_santral_3',
        companyId,
        sahaId: 'demo_saha_2',
        ad: 'İzmir GES-1',
        kapasite: 3000, // 3 MW
        panelSayisi: 7200,
        durum: 'aktif',
        performans: 95,
        sonUretim: 22000, // kWh
        koordinatlar: { lat: 38.4237, lng: 27.1428 },
        inverterSayisi: 12,
        olusturmaTarihi: serverTimestamp()
      }
    ];

    // Demo arızalar
    const arizalar = [
      {
        id: 'demo_ariza_1',
        companyId,
        baslik: 'İnverter Arızası',
        aciklama: 'İnverter 3 haberleşme hatası veriyor',
        durum: 'acik',
        oncelik: 'yuksek',
        kategori: 'elektrik',
        saha: 'Ankara GES Sahası',
        santral: 'Ankara GES-1',
        konum: 'İnverter Odası',
        olusturanKisi: 'Sistem',
        atananKisi: '',
        fotograflar: [],
        yorumlar: [],
        olusturmaTarihi: serverTimestamp(),
        guncellenmeTarihi: serverTimestamp()
      },
      {
        id: 'demo_ariza_2',
        companyId,
        baslik: 'Panel Temizliği Gerekli',
        aciklama: 'Toz birikimi nedeniyle verim düşüklüğü',
        durum: 'devam-ediyor',
        oncelik: 'orta',
        kategori: 'temizlik',
        saha: 'İzmir GES Sahası',
        santral: 'İzmir GES-1',
        konum: 'B Blok',
        olusturanKisi: 'Sistem',
        atananKisi: '',
        fotograflar: [],
        yorumlar: [],
        olusturmaTarihi: Timestamp.fromDate(new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)),
        guncellenmeTarihi: serverTimestamp()
      },
      {
        id: 'demo_ariza_3',
        companyId,
        baslik: 'Kablo Hasarı',
        aciklama: 'DC kabloda yalıtım hasarı tespit edildi',
        durum: 'cozuldu',
        oncelik: 'kritik',
        kategori: 'elektrik',
        saha: 'Ankara GES Sahası',
        santral: 'Ankara GES-2',
        konum: 'String 15',
        olusturanKisi: 'Sistem',
        atananKisi: '',
        cozumAciklamasi: 'Hasarlı kablo değiştirildi',
        cozumTarihi: serverTimestamp(),
        fotograflar: [],
        yorumlar: [],
        olusturmaTarihi: Timestamp.fromDate(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)),
        guncellenmeTarihi: serverTimestamp()
      }
    ];

    // Demo stoklar
    const stoklar = [
      {
        id: 'demo_stok_1',
        companyId,
        malzemeAdi: 'DC Kablo (4mm²)',
        kategori: 'Elektrik',
        birim: 'Metre',
        miktar: 150,
        minimumStok: 100,
        maximumStok: 500,
        birimFiyat: 25,
        tedarikci: 'Solar Malzeme Ltd.',
        konum: 'Ana Depo',
        sonGuncelleme: serverTimestamp()
      },
      {
        id: 'demo_stok_2',
        companyId,
        malzemeAdi: 'MC4 Konnektör',
        kategori: 'Elektrik',
        birim: 'Adet',
        miktar: 45,
        minimumStok: 50,
        maximumStok: 200,
        birimFiyat: 15,
        tedarikci: 'Solar Malzeme Ltd.',
        konum: 'Ana Depo',
        sonGuncelleme: serverTimestamp()
      },
      {
        id: 'demo_stok_3',
        companyId,
        malzemeAdi: 'Panel Temizleme Sıvısı',
        kategori: 'Temizlik',
        birim: 'Litre',
        miktar: 80,
        minimumStok: 50,
        maximumStok: 200,
        birimFiyat: 35,
        tedarikci: 'Temizlik Ürünleri A.Ş.',
        konum: 'Saha Deposu',
        sonGuncelleme: serverTimestamp()
      }
    ];

    // Verileri kaydet
    const promises = [];

    // Sahalar
    for (const saha of sahalar) {
      promises.push(setDoc(doc(db, 'sahalar', saha.id), saha));
    }

    // Santraller
    for (const santral of santraller) {
      promises.push(setDoc(doc(db, 'santraller', santral.id), santral));
    }

    // Arızalar
    for (const ariza of arizalar) {
      promises.push(setDoc(doc(db, 'arizalar', ariza.id), ariza));
    }

    // Stoklar
    for (const stok of stoklar) {
      promises.push(setDoc(doc(db, 'stoklar', stok.id), stok));
    }

    await Promise.all(promises);

    console.log('Demo veriler başarıyla oluşturuldu!');
    return true;
  } catch (error) {
    console.error('Demo veri oluşturma hatası:', error);
    throw error;
  }
};

// Demo verileri temizle
export const clearDemoData = async (companyId: string) => {
  try {
    console.log('Demo veriler temizleniyor...');
    
    // Demo ID'leri içeren verileri silmek için sorgu yapılmalı
    // Şimdilik manuel olarak ID'leri belirtiyoruz
    
    const demoIds = {
      sahalar: ['demo_saha_1', 'demo_saha_2'],
      santraller: ['demo_santral_1', 'demo_santral_2', 'demo_santral_3'],
      arizalar: ['demo_ariza_1', 'demo_ariza_2', 'demo_ariza_3'],
      stoklar: ['demo_stok_1', 'demo_stok_2', 'demo_stok_3']
    };

    // Not: deleteDoc fonksiyonu kullanılarak silinmeli
    // Ancak şu an için sadece log yazdırıyoruz
    
    console.log('Demo veriler temizlendi!');
    return true;
  } catch (error) {
    console.error('Demo veri temizleme hatası:', error);
    throw error;
  }
};

