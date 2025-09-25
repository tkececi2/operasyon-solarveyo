import { format, formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';

// Tarih formatlama
export const formatDate = (date: Date | string | any, formatStr: string = 'dd.MM.yyyy'): string => {
  // Eksik/boş tarih varsa asla bugünün tarihine düşme
  if (!date) return 'Geçersiz Tarih';

  let dateObj: Date | null = null;

  if (typeof date === 'string') {
    dateObj = new Date(date);
  } else if (date && typeof date.toDate === 'function') {
    // Firebase Timestamp
    dateObj = date.toDate();
  } else if (typeof date?.seconds === 'number') {
    // Serialized Firestore Timestamp { seconds, nanoseconds }
    dateObj = new Date(date.seconds * 1000);
  } else if (typeof date === 'number') {
    // epoch milliseconds
    dateObj = new Date(date);
  } else if (date instanceof Date) {
    dateObj = date;
  }

  if (!dateObj || isNaN(dateObj.getTime())) {
    return 'Geçersiz Tarih';
  }

  return format(dateObj, formatStr, { locale: tr });
};

// Zaman formatı (HH:mm)
export const formatTime = (date: Date | string | any): string => {
  return formatDate(date, 'HH:mm');
};

// Tarih ve saat formatı
export const formatDateTime = (date: Date | string | any): string => {
  return formatDate(date, 'dd.MM.yyyy HH:mm');
};

// Göreceli zaman (2 saat önce, 3 gün önce)
export const formatRelativeTime = (date: Date | string | any): string => {
  let dateObj: Date;
  
  if (typeof date === 'string') {
    dateObj = new Date(date);
  } else if (date && typeof date.toDate === 'function') {
    // Firebase Timestamp
    dateObj = date.toDate();
  } else if (date instanceof Date) {
    dateObj = date;
  } else {
    // Fallback için güncel tarih
    dateObj = new Date();
  }
  
  // Geçersiz tarih kontrolü
  if (isNaN(dateObj.getTime())) {
    return 'Geçersiz Tarih';
  }
  
  return formatDistanceToNow(dateObj, { addSuffix: true, locale: tr });
};

// Para formatı (Türk Lirası)
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

// Sayı formatı (Türkçe)
export const formatNumber = (num: number, decimals: number = 0): string => {
  return new Intl.NumberFormat('tr-TR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(num);
};

// Enerji formatı (kWh, MWh)
export const formatEnergy = (kwh: number): string => {
  if (kwh >= 1000000) {
    return `${formatNumber(kwh / 1000000, 2)} GWh`;
  } else if (kwh >= 1000) {
    return `${formatNumber(kwh / 1000, 1)} MWh`;
  } else {
    return `${formatNumber(kwh, 1)} kWh`;
  }
};

export const formatKwh = formatEnergy;

// Güç formatı (kW, MW)
export const formatPower = (kw: number): string => {
  if (kw >= 1000) {
    return `${formatNumber(kw / 1000, 2)} MW`;
  } else {
    return `${formatNumber(kw, 1)} kW`;
  }
};

// Yüzde formatı
export const formatPercentage = (value: number, decimals: number = 1): string => {
  return `${formatNumber(value, decimals)}%`;
};

// Dosya boyutu formatı
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${formatNumber(bytes / Math.pow(k, i), 2)} ${sizes[i]}`;
};

// Byte formatı (alias for formatFileSize)
export const formatBytes = (bytes: number, decimals = 2): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

// CO2 tasarrufu formatı
export const formatCO2 = (kg: number): string => {
  if (kg >= 1000) {
    return `${formatNumber(kg / 1000, 2)} ton`;
  } else {
    return `${formatNumber(kg, 1)} kg`;
  }
};

// Süre formatı (dakika -> saat:dakika)
export const formatDuration = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours > 0) {
    return `${hours}s ${mins}dk`;
  } else {
    return `${mins}dk`;
  }
};

// Telefon numarası formatı
export const formatPhone = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');
  const match = cleaned.match(/^(\d{3})(\d{3})(\d{2})(\d{2})$/);
  
  if (match) {
    return `(${match[1]}) ${match[2]} ${match[3]} ${match[4]}`;
  }
  
  return phone;
};

// Durum renk eşleştirmesi
export const getStatusColor = (status: string): string => {
  const colorMap: Record<string, string> = {
    // Arıza durumları
    'acik': 'text-red-600 bg-red-50',
    'devam-ediyor': 'text-yellow-600 bg-yellow-50',
    'beklemede': 'text-gray-600 bg-gray-50',
    'cozuldu': 'text-green-600 bg-green-50',
    
    // Öncelik seviyeleri
    'kritik': 'text-red-600 bg-red-50',
    'yuksek': 'text-orange-600 bg-orange-50',
    'normal': 'text-blue-600 bg-blue-50',
    'dusuk': 'text-gray-600 bg-gray-50',
    
    // Genel durumlar
    'iyi': 'text-green-600 bg-green-50',
    'orta': 'text-yellow-600 bg-yellow-50',
    'kotu': 'text-red-600 bg-red-50',
    
    // Abonelik durumları
    'active': 'text-green-600 bg-green-50',
    'trial': 'text-blue-600 bg-blue-50',
    'expired': 'text-red-600 bg-red-50',
    
    // Vardiya durumları
    'sabah': 'text-yellow-600 bg-yellow-50',
    'aksam': 'text-blue-600 bg-blue-50',
    'acil': 'text-red-600 bg-red-50'
  };
  
  return colorMap[status] || 'text-gray-600 bg-gray-50';
};

// Durum metni çevirisi
export const translateStatus = (status: string): string => {
  const translations: Record<string, string> = {
    // Arıza durumları
    'acik': 'Açık',
    'devam-ediyor': 'Devam Ediyor',
    'beklemede': 'Beklemede',
    'cozuldu': 'Çözüldü',
    
    // Öncelik seviyeleri
    'kritik': 'Kritik',
    'yuksek': 'Yüksek',
    'normal': 'Normal',
    'dusuk': 'Düşük',
    
    // Genel durumlar
    'iyi': 'İyi',
    'orta': 'Orta',
    'kotu': 'Kötü',
    
    // Abonelik durumları
    'active': 'Aktif',
    'trial': 'Deneme',
    'expired': 'Süresi Bitmiş',
    
    // Roller
    'yonetici': 'Yönetici',
    'muhendis': 'Mühendis',
    'tekniker': 'Tekniker',
    'musteri': 'Müşteri',
    'bekci': 'Bekçi',
    
    // Vardiya tipleri
    'sabah': 'Sabah Vardiyası',
    'aksam': 'Akşam Vardiyası',
    
    // İş kategorileri
    'bakim': 'Bakım',
    'onarim': 'Onarım',
    'kurulum': 'Kurulum',
    'kontrol': 'Kontrol'
  };
  
  return translations[status] || status;
};

