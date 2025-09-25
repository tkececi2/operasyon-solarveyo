/**
 * Gelişmiş İzin Yönetimi Tipleri
 */

// İzin Hakediş Kuralları
export interface ILeaveAccrualRule {
  id?: string;
  companyId: string;
  
  // Kural Detayları
  name: string; // Kural adı
  description?: string;
  isActive: boolean;
  
  // Hakediş Kriterleri
  employmentType: 'tam_zamanli' | 'yari_zamanli' | 'sozlesmeli' | 'tum';
  minServiceMonths: number; // Minimum çalışma süresi (ay)
  maxServiceMonths?: number; // Maximum çalışma süresi (ay)
  
  // Yıllık İzin Hakları
  annualLeaveDays: number; // Yıllık izin günü
  sickLeaveDays: number; // Hastalık izni günü
  
  // Hakediş Yöntemi
  accrualMethod: 'yillik' | 'aylik' | 'ceyreklik';
  accrualStartMonth: number; // Hakediş başlangıç ayı (1-12)
  
  // Devir Kuralları
  allowCarryOver: boolean; // Devreden izin olabilir mi?
  maxCarryOverDays?: number; // Max devreden gün
  carryOverExpiryMonths?: number; // Devreden iznin geçerlilik süresi (ay)
  
  createdAt: Date | string;
  updatedAt?: Date | string;
}

// Çalışan İzin Profili
export interface IEmployeeLeaveProfile {
  id?: string;
  userId: string;
  userName: string;
  companyId: string;
  
  // İstihdam Bilgileri
  hireDate: Date | string; // İşe giriş tarihi
  employmentType: 'tam_zamanli' | 'yari_zamanli' | 'sozlesmeli';
  department?: string;
  position?: string;
  
  // Uygulanan Kural
  appliedRuleId?: string; // Uygulanan izin kuralı
  appliedRuleName?: string;
  
  // Özel Haklar (kural üzerine eklenen)
  customAnnualDays?: number;
  customSickDays?: number;
  specialNotes?: string;
  
  createdAt: Date | string;
  updatedAt?: Date | string;
}

// Yıllık İzin Döngüsü
export interface ILeaveYear {
  id?: string;
  companyId: string;
  userId: string;
  year: number;
  
  // Dönem Bilgileri
  startDate: Date | string; // Dönem başlangıcı
  endDate: Date | string; // Dönem bitişi
  isCurrent: boolean; // Aktif dönem mi?
  
  // İzin Hakları
  entitlements: {
    annual: number; // Yıllık izin hakkı
    sick: number; // Hastalık izni hakkı
    carryOver: number; // Önceki yıldan devreden
    adjustment: number; // Manuel düzeltme (+/-)
    total: number; // Toplam hak
  };
  
  // Kullanımlar
  usage: {
    annual: number; // Kullanılan yıllık
    sick: number; // Kullanılan hastalık
    unpaid: number; // Ücretsiz izin
    other: number; // Diğer izinler
    total: number; // Toplam kullanım
  };
  
  // Bakiye
  balance: {
    annual: number; // Kalan yıllık
    sick: number; // Kalan hastalık
    total: number; // Toplam kalan
  };
  
  // Dönem Sonu İşlemleri
  yearEndProcessed: boolean;
  carryOverToNextYear?: number; // Gelecek yıla devreden
  expiredDays?: number; // Süresi dolan izinler
  
  createdAt: Date | string;
  updatedAt?: Date | string;
  processedAt?: Date | string;
}

// İzin İşlem Geçmişi
export interface ILeaveTransaction {
  id?: string;
  companyId: string;
  userId: string;
  leaveYearId: string; // İlgili izin yılı
  
  // İşlem Detayları
  transactionType: 'hakkedis' | 'kullanim' | 'devir' | 'duzeltme' | 'iptal' | 'sureli_dolma';
  transactionDate: Date | string;
  
  // Miktar Bilgileri
  leaveType: 'yillik' | 'hastalik' | 'ucretsiz' | 'diger';
  days: number; // İşlem gün sayısı (+ veya -)
  
  // Bakiye Durumu (işlem sonrası)
  balanceBefore: number;
  balanceAfter: number;
  
  // Referans Bilgileri
  referenceType?: 'leave_request' | 'manual_adjustment' | 'year_end_process' | 'rule_change';
  referenceId?: string; // İlgili izin talebi veya işlem ID
  
  // İşlem Detayları
  description: string;
  notes?: string;
  
  // İşlemi Yapan
  createdBy: string;
  createdByName: string;
  createdAt: Date | string;
}

// Detaylı İzin Raporu
export interface ILeaveReport {
  userId: string;
  userName: string;
  companyId: string;
  reportDate: Date | string;
  
  // Mevcut Dönem
  currentYear: {
    year: number;
    entitlement: number;
    used: number;
    remaining: number;
    pending: number; // Onay bekleyen
  };
  
  // Geçmiş Yıllar Özeti
  history: {
    year: number;
    entitlement: number;
    used: number;
    carryOver: number;
    expired: number;
  }[];
  
  // İzin Kullanım Analizi
  usageAnalysis: {
    byType: Record<string, number>; // Tip bazında kullanım
    byMonth: Record<string, number>; // Ay bazında kullanım
    averageDuration: number; // Ortalama izin süresi
    mostUsedType: string; // En çok kullanılan tip
  };
  
  // Tahminler
  projections: {
    estimatedYearEndBalance: number;
    recommendedUsage?: string; // Önerilen kullanım
  };
}

// İzin Politikası
export interface ILeavePolicy {
  id?: string;
  companyId: string;
  
  // Politika Detayları
  name: string;
  description: string;
  effectiveDate: Date | string;
  isActive: boolean;
  
  // Genel Kurallar
  rules: {
    minConsecutiveDays?: number; // Min ardışık gün
    maxConsecutiveDays?: number; // Max ardışık gün
    advanceNoticeDays: number; // Önceden bildirim süresi
    blackoutPeriods?: { // Yasaklı dönemler
      startDate: string;
      endDate: string;
      reason: string;
    }[];
    requiresSubstitute: boolean; // Yerine bakacak kişi zorunlu mu?
    requiresDocumentation: string[]; // Gerekli belgeler (hastalık raporu vb.)
  };
  
  // Onay Hiyerarşisi
  approvalFlow: {
    level: number;
    approverRole: string;
    autoApprovalDays?: number; // Otomatik onay süresi
  }[];
  
  createdAt: Date | string;
  updatedAt?: Date | string;
  createdBy: string;
}

// İzin Takvimi Görünümü
export interface ILeaveCalendarEntry {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  department?: string;
  
  startDate: Date | string;
  endDate: Date | string;
  leaveType: string;
  status: string;
  
  // Görünüm için
  color: string;
  title: string;
  isHalfDay?: boolean;
}

// İzin Özet İstatistikleri
export interface ILeaveSummaryStats {
  companyId: string;
  period: 'month' | 'quarter' | 'year';
  periodValue: string; // "2024-01", "Q1-2024", "2024"
  
  // Genel İstatistikler
  totalEmployees: number;
  totalLeaveDays: number;
  averageLeaveDays: number;
  
  // Durum Bazlı
  byStatus: {
    approved: number;
    pending: number;
    rejected: number;
  };
  
  // Tip Bazlı
  byType: Record<string, number>;
  
  // Departman Bazlı
  byDepartment?: Record<string, number>;
  
  // Trendler
  trends: {
    comparedToPrevious: number; // % değişim
    peakMonth?: string;
    lowestMonth?: string;
  };
  
  // En Çok İzin Kullananlar
  topUsers: {
    userId: string;
    userName: string;
    totalDays: number;
  }[];
}

// İzin Hakediş Hesaplama Sonucu
export interface ILeaveAccrualCalculation {
  userId: string;
  calculationDate: Date | string;
  
  // Hesaplama Detayları
  serviceMonths: number; // Toplam çalışma süresi (ay)
  appliedRule?: ILeaveAccrualRule;
  
  // Hesaplanan Haklar
  calculated: {
    annual: number;
    sick: number;
    total: number;
  };
  
  // Düzeltmeler
  adjustments: {
    reason: string;
    amount: number;
  }[];
  
  // Nihai Haklar
  final: {
    annual: number;
    sick: number;
    total: number;
  };
}

// İzin Yönetimi Ayarları
export interface ILeaveSettings {
  companyId: string;
  
  // Genel Ayarlar
  leaveYearStart: 'ocak' | 'nisan' | 'ise_giris'; // İzin yılı başlangıcı
  workingDays: string[]; // ['pazartesi', 'sali', ...]
  publicHolidaysIncluded: boolean;
  weekendsIncluded: boolean;
  
  // Bildirim Ayarları
  notifications: {
    onRequest: boolean;
    onApproval: boolean;
    onRejection: boolean;
    reminderDays: number; // Kullanılmayan izin hatırlatması
    expiryWarningDays: number; // Süresi dolacak izin uyarısı
  };
  
  // Otomatik İşlemler
  automation: {
    autoAccrual: boolean; // Otomatik hakediş
    autoCarryOver: boolean; // Otomatik devir
    autoExpiry: boolean; // Otomatik süre dolumu
    yearEndProcessDay: number; // Yıl sonu işlem günü
  };
  
  updatedAt: Date | string;
  updatedBy: string;
}
