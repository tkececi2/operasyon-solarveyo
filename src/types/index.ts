import { Timestamp } from 'firebase/firestore';

// Kullanıcı rolleri
export type UserRole = 'superadmin' | 'yonetici' | 'muhendis' | 'tekniker' | 'musteri' | 'bekci';

// Abonelik durumları
export type SubscriptionStatus = 'active' | 'expired' | 'trial' | 'cancelled' | 'suspended';

// Ödeme durumları
export type PaymentStatus = 'deneme' | 'odendi' | 'beklemede' | 'surebitti';

// Arıza durumları
export type FaultStatus = 'acik' | 'devam-ediyor' | 'beklemede' | 'cozuldu';

// Öncelik seviyeleri
export type Priority = 'dusuk' | 'normal' | 'yuksek' | 'kritik';

// Genel durum
export type GeneralStatus = 'iyi' | 'orta' | 'kotu';

// Vardiya tipi
export type ShiftType = 'sabah' | 'aksam';

// İş kategorisi
export type WorkCategory = 'bakim' | 'onarim' | 'kurulum' | 'kontrol';

// Şirket
export interface Company {
  id: string;
  name: string;
  logo?: string;
  slogan?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  subscriptionStatus: SubscriptionStatus;
  subscriptionPlan?: string;
  subscriptionPrice?: number;
  subscriptionLimits?: {
    users: number;
    storage: string;
    storageLimit: number; // MB cinsinden storage limiti
    sahalar: number;
    santraller: number;
    arizaKaydi?: number;
    bakimKaydi?: number;
  };
  subscriptionFeatures?: {
    aiFeatures: boolean;
    customReports: boolean;
    apiAccess: boolean;
    support: string;
  };
  metrics?: {
    storageUsedMB: number;
    fileCount: number;
    lastStorageCalculation?: Timestamp;
    breakdown?: {
      logos: number;
      arizaPhotos: number;
      bakimPhotos: number;
      vardiyaPhotos: number;
      documents: number;
      other: number;
    };
  };
  nextBillingDate?: Timestamp;
  trialEndDate?: Timestamp;
  subscriptionEndDate?: Timestamp;
  isActive: boolean;
  createdAt: Timestamp;
  createdBy: string;
  settings?: {
    theme: string;
    language: string;
    notificationSettings?: Record<string, any>;
  };
}

// Kullanıcı
export interface User {
  id: string;
  companyId: string;
  email: string;
  ad: string;
  telefon?: string;
  rol: UserRole;
  sahalar?: string[] | Record<string, any>;
  santraller?: string[]; // Atanmış santral ID'leri
  odemeDurumu?: PaymentStatus;
  denemeSuresiBaslangic?: Timestamp;
  denemeSuresiBitis?: Timestamp;
  emailVerified: boolean;
  requiresEmailVerification?: boolean; // Register'dan gelenler: true, Ekip yönetiminden: false
  adminApproved?: boolean; // Admin onayı gerekli mi?
  aktif?: boolean; // Kullanıcı aktif mi?
  fotoURL?: string;
  olusturmaTarihi?: Timestamp;
  guncellenmeTarihi?: Timestamp;
  davetTarihi?: Timestamp;
  davetEden?: string;
  sonGiris?: Timestamp;
}

// Santral
export interface PowerPlant {
  id: string;
  companyId: string;
  musteriId?: string;
  ad: string;
  kapasite: number; // kW olarak saklanacak
  kurulumTarihi: Timestamp;
  konum: {
    lat: number;
    lng: number;
  };
  adres: string;
  yillikHedefUretim: number; // kWh
  elektrikFiyati: number; // TL/kWh
  dagitimBedeli: number; // TL/kWh
  // 12 aylık tahmini üretim değerleri (manuel giriş)
  aylikTahminler: {
    ocak: number;
    subat: number;
    mart: number;
    nisan: number;
    mayis: number;
    haziran: number;
    temmuz: number;
    agustos: number;
    eylul: number;
    ekim: number;
    kasim: number;
    aralik: number;
  };
  // Santral resimleri
  resimler?: string[]; // Firebase Storage URL'leri
  kapakResmi?: string; // Ana resim
  olusturmaTarihi: Timestamp;
}

// Arıza
export interface Fault {
  id: string;
  companyId: string;
  santralId: string;
  saha: string;
  baslik: string;
  aciklama: string;
  durum: FaultStatus;
  oncelik: Priority;
  konum?: string;
  fotograflar: string[];
  cozumAciklamasi?: string;
  cozumFotograflari?: string[];
  raporlayanId: string;
  atananKisi?: string;
  olusturmaTarihi: Timestamp;
  guncellenmeTarihi: Timestamp;
  cozumTarihi?: Timestamp;
}

// Elektrik Bakım
export interface ElectricalMaintenance {
  id: string;
  companyId: string;
  santralId: string;
  sahaId: string;
  tarih: Timestamp;
  yapanKisi: string; // [DEPRECATED] Eski kayıtlar için - yeni kayıtlarda yapanKisiId kullan
  yapanKisiId?: string; // Yeni: Kullanıcı ID'si (dinamik isim için)
  kontroller: {
    ogSistemleri: Record<string, any>;
    trafolar: Record<string, any>;
    agDagitimPanosu: Record<string, any>;
    invertorler: Record<string, any>;
    toplamaKutulari: Record<string, any>;
    pvModulleri: Record<string, any>;
  };
  genelDurum: GeneralStatus;
  notlar?: string;
  fotograflar: string[];
  olusturmaTarihi: Timestamp;
}

// Mekanik Bakım
export interface MechanicalMaintenance {
  id: string;
  companyId: string;
  santralId: string;
  sahaId: string;
  tarih: Timestamp;
  yapanKisi: string; // [DEPRECATED] Eski kayıtlar için - yeni kayıtlarda yapanKisiId kullan
  yapanKisiId?: string; // Yeni: Kullanıcı ID'si (dinamik isim için)
  kontroller: {
    panelTemizligi: Record<string, any>;
    yapiselKontroller: Record<string, any>;
    kablolar: Record<string, any>;
    guvenlikEkipmanlari: Record<string, any>;
    montajElemanlari: Record<string, any>;
  };
  genelDurum: GeneralStatus;
  notlar?: string;
  fotograflar: string[];
  olusturmaTarihi: Timestamp;
}

// Üretim Verisi
export interface ProductionData {
  id: string;
  companyId: string;
  santralId: string;
  tarih: Timestamp;
  gunlukUretim: number; // kWh
  anlikGuc: number; // kW
  performansOrani: number; // %
  gelir: number; // TL
  dagitimBedeli: number; // TL
  tasarrufEdilenCO2: number; // kg
  hava: {
    sicaklik: number;
    nem: number;
    radyasyon: number;
  };
  olusturanKisi: Record<string, any>;
  olusturmaTarihi: Timestamp;
}

// İnvertör Kontrol
export interface InverterControl {
  id: string;
  companyId: string;
  sahaId: string;
  tarih: Timestamp;
  yapanKisi: string;
  invertorNumarasi: string;
  olcumler: {
    dcGerilim: number;
    dcAkim: number;
    acGerilim: number;
    acAkim: number;
    sicaklik: number;
    verimlilik: number;
  };
  durum: 'normal' | 'uyari' | 'ariza';
  notlar?: string;
  fotograflar: string[];
  olusturmaTarihi: Timestamp;
}

// Elektrik Kesintisi
export interface PowerOutage {
  id: string;
  companyId: string;
  sahaId: string;
  baslangicTarihi: Timestamp;
  bitisTarihi?: Timestamp;
  sure?: number; // dakika
  neden: string;
  etkilenenKapasite: number; // kW
  kayilanUretim?: number; // kWh
  kayilanGelir?: number; // TL
  aciklama?: string;
  olusturanKisi: string;
  olusturmaTarihi: Timestamp;
}

// Stok
export interface Stock {
  id: string;
  companyId: string;
  sahaId?: string;
  malzemeAdi: string;
  kategori: string;
  birim: string;
  mevcutStok: number;
  minimumStokSeviyesi: number;
  birimFiyat: number;
  tedarikci?: string;
  sonGuncelleme: Timestamp;
  olusturmaTarihi: Timestamp;
}

// Envanter
export interface Envanter {
  id: string;
  companyId: string;
  sahaId: string;
  santralId?: string;
  kategori: 'panel' | 'inverter' | 'trafo' | 'ac-pano' | 'dc-pano' | 'sayac' | 'kablo' | 'montaj' | 'diger';
  marka?: string;
  model?: string;
  seriNo?: string;
  adet?: number;
  durum: 'aktif' | 'arizali' | 'degisti' | 'sokuldu';
  kurulumTarihi?: Timestamp;
  garantiBaslangic?: Timestamp;
  garantiSuresiAy?: number; // ay
  garantiBitis?: Timestamp;
  garantiKapsami?: string; // parça/işçilik vb.
  servisIrtibat?: string;
  tedarikciAdi?: string;
  satinAlmaBelgesiUrl?: string;
  garantiBelgesiUrl?: string;
  faturaNo?: string;
  faturaTarihi?: Timestamp;
  konum?: string; // string/dizi no vb.
  fotoUrl?: string[];
  belgeUrl?: string[];
  qrCode?: string;
  notlar?: string;
  olusturmaTarihi: Timestamp;
}

// Vardiya Bildirimi
export interface ShiftNotification {
  id: string;
  companyId: string;
  bekciId: string;
  bekciAdi: string;
  sahaId: string;
  santralId: string;
  tarih: Timestamp;
  vardiyaTipi: ShiftType;
  durum: 'normal' | 'dikkat' | 'acil';
  acilDurum: boolean;
  aciklama: string;
  fotograflar: string[];
  konum?: {
    lat: number;
    lng: number;
  };
  olusturmaTarihi: Timestamp;
}

// Yapılan İşler
export interface CompletedWork {
  id: string;
  companyId: string;
  sahaId: string;
  tarih: Timestamp;
  yapanKisi: string;
  isAciklamasi: string;
  kategori: WorkCategory;
  sure: number; // saat
  malzemeler: string[];
  fotograflar: string[];
  tamamlandiMi: boolean;
  notlar?: string;
  olusturmaTarihi: Timestamp;
}
