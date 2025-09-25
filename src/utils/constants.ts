/**
 * Uygulama sabitleri
 */

// Roller ve yetkileri
export const USER_ROLES = {
  SUPERADMIN: 'superadmin',
  YONETICI: 'yonetici',
  MUHENDIS: 'muhendis',
  TEKNIKER: 'tekniker',
  MUSTERI: 'musteri',
  BEKCI: 'bekci'
} as const;

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];

// Rol etiketleri
export const ROLE_LABELS: Record<UserRole, string> = {
  [USER_ROLES.SUPERADMIN]: 'Süper Yönetici',
  [USER_ROLES.YONETICI]: 'Yönetici',
  [USER_ROLES.MUHENDIS]: 'Mühendis',
  [USER_ROLES.TEKNIKER]: 'Tekniker',
  [USER_ROLES.MUSTERI]: 'Müşteri',
  [USER_ROLES.BEKCI]: 'Bekçi'
};

// Arıza durumları
export const FAULT_STATUS = {
  ACIK: 'acik',
  DEVAM_EDIYOR: 'devam-ediyor',
  BEKLEMEDE: 'beklemede',
  COZULDU: 'cozuldu'
} as const;

export const FAULT_STATUS_LABELS = {
  [FAULT_STATUS.ACIK]: 'Açık',
  [FAULT_STATUS.DEVAM_EDIYOR]: 'Devam Ediyor',
  [FAULT_STATUS.BEKLEMEDE]: 'Beklemede',
  [FAULT_STATUS.COZULDU]: 'Çözüldü'
};

// Öncelik seviyeleri
export const PRIORITY_LEVELS = {
  DUSUK: 'dusuk',
  NORMAL: 'normal',
  YUKSEK: 'yuksek',
  KRITIK: 'kritik'
} as const;

export const PRIORITY_LABELS = {
  [PRIORITY_LEVELS.DUSUK]: 'Düşük',
  [PRIORITY_LEVELS.NORMAL]: 'Normal',
  [PRIORITY_LEVELS.YUKSEK]: 'Yüksek',
  [PRIORITY_LEVELS.KRITIK]: 'Kritik'
};

// Abonelik durumları
export const SUBSCRIPTION_STATUS = {
  ACTIVE: 'active',
  EXPIRED: 'expired',
  TRIAL: 'trial'
} as const;

export const SUBSCRIPTION_LABELS = {
  [SUBSCRIPTION_STATUS.ACTIVE]: 'Aktif',
  [SUBSCRIPTION_STATUS.EXPIRED]: 'Süresi Dolmuş',
  [SUBSCRIPTION_STATUS.TRIAL]: 'Deneme'
};

// Ödeme durumları
export const PAYMENT_STATUS = {
  DENEME: 'deneme',
  ODENDI: 'odendi',
  BEKLEMEDE: 'beklemede',
  SUREBITTI: 'surebitti'
} as const;

export const PAYMENT_LABELS = {
  [PAYMENT_STATUS.DENEME]: 'Deneme',
  [PAYMENT_STATUS.ODENDI]: 'Ödendi',
  [PAYMENT_STATUS.BEKLEMEDE]: 'Beklemede',
  [PAYMENT_STATUS.SUREBITTI]: 'Süresi Bitti'
};

// Genel durumlar (bakım için)
export const GENERAL_STATUS = {
  IYI: 'iyi',
  ORTA: 'orta',
  KOTU: 'kotu'
} as const;

export const GENERAL_STATUS_LABELS = {
  [GENERAL_STATUS.IYI]: 'İyi',
  [GENERAL_STATUS.ORTA]: 'Orta',
  [GENERAL_STATUS.KOTU]: 'Kötü'
};

// Vardiya tipleri
export const SHIFT_TYPES = {
  SABAH: 'sabah',
  AKSAM: 'aksam'
} as const;

export const SHIFT_TYPE_LABELS = {
  [SHIFT_TYPES.SABAH]: 'Sabah',
  [SHIFT_TYPES.AKSAM]: 'Akşam'
};

// İş kategorileri
export const WORK_CATEGORIES = {
  BAKIM: 'bakim',
  ONARIM: 'onarim',
  KURULUM: 'kurulum',
  KONTROL: 'kontrol'
} as const;

export const WORK_CATEGORY_LABELS = {
  [WORK_CATEGORIES.BAKIM]: 'Bakım',
  [WORK_CATEGORIES.ONARIM]: 'Onarım',
  [WORK_CATEGORIES.KURULUM]: 'Kurulum',
  [WORK_CATEGORIES.KONTROL]: 'Kontrol'
};

// İnvertör durumları
export const INVERTER_STATUS = {
  NORMAL: 'normal',
  UYARI: 'uyari',
  ARIZA: 'ariza'
} as const;

export const INVERTER_STATUS_LABELS = {
  [INVERTER_STATUS.NORMAL]: 'Normal',
  [INVERTER_STATUS.UYARI]: 'Uyarı',
  [INVERTER_STATUS.ARIZA]: 'Arıza'
};

// Dosya tipleri
export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp'
];

export const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
];

// Dosya boyut limitleri (bytes)
export const FILE_SIZE_LIMITS = {
  IMAGE: 5 * 1024 * 1024, // 5MB
  DOCUMENT: 10 * 1024 * 1024, // 10MB
  AVATAR: 2 * 1024 * 1024 // 2MB
};

// Sayfalama
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100]
};

// Grafik renkleri
export const CHART_COLORS = {
  PRIMARY: '#3B82F6',
  SUCCESS: '#10B981',
  WARNING: '#F59E0B',
  DANGER: '#EF4444',
  INFO: '#06B6D4',
  SECONDARY: '#8B5CF6',
  GRAY: '#6B7280'
};

// Emisyon faktörü (kg CO2 / kWh)
export const CO2_FACTOR_KG_PER_KWH = 0.45;

// Tema renkleri
export const THEME_COLORS = {
  LIGHT: {
    background: '#FFFFFF',
    surface: '#F9FAFB',
    text: '#111827',
    textSecondary: '#6B7280'
  },
  DARK: {
    background: '#111827',
    surface: '#1F2937',
    text: '#F9FAFB',
    textSecondary: '#9CA3AF'
  }
};

// API endpoint'leri
export const API_ENDPOINTS = {
  FIREBASE: {
    AUTH: 'auth',
    FIRESTORE: 'firestore',
    STORAGE: 'storage',
    FUNCTIONS: 'functions'
  }
};

// Cache süreleri (milisaniye)
export const CACHE_DURATIONS = {
  SHORT: 5 * 60 * 1000, // 5 dakika
  MEDIUM: 30 * 60 * 1000, // 30 dakika
  LONG: 2 * 60 * 60 * 1000, // 2 saat
  VERY_LONG: 24 * 60 * 60 * 1000 // 24 saat
};

// Notification tipleri
export const NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info'
} as const;

// Dil kodları
export const LANGUAGES = {
  TR: 'tr',
  EN: 'en'
} as const;

// Zaman aralıkları
export const TIME_RANGES = {
  TODAY: 'today',
  YESTERDAY: 'yesterday',
  LAST_7_DAYS: 'last_7_days',
  LAST_30_DAYS: 'last_30_days',
  THIS_MONTH: 'this_month',
  LAST_MONTH: 'last_month',
  THIS_YEAR: 'this_year',
  LAST_YEAR: 'last_year',
  CUSTOM: 'custom'
} as const;

export const TIME_RANGE_LABELS = {
  [TIME_RANGES.TODAY]: 'Bugün',
  [TIME_RANGES.YESTERDAY]: 'Dün',
  [TIME_RANGES.LAST_7_DAYS]: 'Son 7 Gün',
  [TIME_RANGES.LAST_30_DAYS]: 'Son 30 Gün',
  [TIME_RANGES.THIS_MONTH]: 'Bu Ay',
  [TIME_RANGES.LAST_MONTH]: 'Geçen Ay',
  [TIME_RANGES.THIS_YEAR]: 'Bu Yıl',
  [TIME_RANGES.LAST_YEAR]: 'Geçen Yıl',
  [TIME_RANGES.CUSTOM]: 'Özel Aralık'
};

// Regex pattern'leri
export const REGEX_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^(\+90|0)?[5][0-9]{9}$/,
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{6,}$/,
  TURKISH_ID: /^[1-9][0-9]{10}$/,
  COORDINATE: /^-?([1-8]?[0-9]\.{1}\d{1,6}$|90\.{1}0{1,6}$)/
};

// Hata mesajları
export const ERROR_MESSAGES = {
  REQUIRED_FIELD: 'Bu alan zorunludur',
  INVALID_EMAIL: 'Geçerli bir email adresi girin',
  INVALID_PHONE: 'Geçerli bir telefon numarası girin',
  WEAK_PASSWORD: 'Şifre en az 6 karakter olmalı ve büyük harf, küçük harf, rakam içermeli',
  PASSWORDS_NOT_MATCH: 'Şifreler eşleşmiyor',
  FILE_TOO_LARGE: 'Dosya boyutu çok büyük',
  INVALID_FILE_TYPE: 'Geçersiz dosya tipi',
  NETWORK_ERROR: 'Bağlantı hatası. Lütfen tekrar deneyin.',
  PERMISSION_DENIED: 'Bu işlem için yetkiniz yok',
  NOT_FOUND: 'Aradığınız kayıt bulunamadı',
  UNKNOWN_ERROR: 'Bilinmeyen bir hata oluştu'
};

// Başarı mesajları
export const SUCCESS_MESSAGES = {
  SAVED: 'Başarıyla kaydedildi',
  UPDATED: 'Başarıyla güncellendi',
  DELETED: 'Başarıyla silindi',
  SENT: 'Başarıyla gönderildi',
  UPLOADED: 'Başarıyla yüklendi',
  COPIED: 'Panoya kopyalandı'
};

// LocalStorage anahtarları
export const STORAGE_KEYS = {
  USER_PREFERENCES: 'user_preferences',
  THEME: 'theme',
  LANGUAGE: 'language',
  SIDEBAR_COLLAPSED: 'sidebar_collapsed',
  RECENT_SEARCHES: 'recent_searches',
  DRAFT_FORMS: 'draft_forms'
};
