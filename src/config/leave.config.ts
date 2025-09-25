/**
 * İzin Yönetimi Yapılandırması
 * 
 * Bu dosya izin yönetimi sisteminin temel ayarlarını içerir.
 * Güncelleme gerektirmeden uzun süre kullanılabilir.
 */

export const LEAVE_CONFIG = {
  // Yıl aralığı ayarları
  yearRange: {
    // Sistemin desteklediği minimum yıl
    minYear: 2015,
    
    // Sistemin desteklediği maksimum yıl
    // 2050'ye kadar planlama yapılabilir
    maxYear: 2050,
    
    // Varsayılan gösterim aralığı
    defaultRange: {
      // Geçmişe kaç yıl gösterilsin
      pastYears: 10,
      
      // Geleceğe kaç yıl gösterilsin
      futureYears: 15
    }
  },
  
  // İzin hakları (gün)
  defaultLeaveRights: {
    annual: 14,        // Yıllık izin (minimum yasal hak)
    sick: 10,          // Hastalık izni
    marriage: 3,       // Evlilik izni
    bereavement: 3,    // Vefat izni
    maternity: 112,    // Doğum izni (16 hafta)
    paternity: 10      // Babalık izni
  },
  
  // Kıdem artışları
  seniorityBonus: {
    // Her 5 yılda 1 gün ek izin
    yearsPerBonus: 5,
    bonusDays: 1,
    maxBonus: 10  // Maksimum 10 gün ek izin
  },
  
  // Devir kuralları
  carryOverRules: {
    enabled: true,
    maxDays: 10,       // Maksimum devredilebilir gün
    expiryMonths: 6    // Devreden iznin geçerlilik süresi (ay)
  },
  
  // Planlama kuralları
  planningRules: {
    // Gelecek için ne kadar önceden plan yapılabilir (ay)
    maxAdvanceMonths: 12,
    
    // Minimum izin talebi süresi (gün)
    minLeaveDays: 1,
    
    // Maksimum ardışık izin (gün)
    maxConsecutiveDays: 30,
    
    // İzin talebinde bulunma süresi (gün önceden)
    advanceNoticeDays: 7
  },
  
  // Otomatik işlemler
  automation: {
    // Yıl sonu işlemleri otomatik yapılsın mı
    yearEndProcessing: true,
    
    // Yıl sonu işlem günü (Ocak ayının kaçıncı günü)
    yearEndProcessDay: 15,
    
    // Otomatik hakediş hesaplama
    autoAccrual: true,
    
    // Kullanılmayan izin uyarısı (gün kala)
    unusedLeaveWarningDays: 30
  },
  
  // Raporlama
  reporting: {
    // Raporda gösterilecek maksimum yıl sayısı
    maxYearsInReport: 5,
    
    // Grafiklerde gösterilecek ay sayısı
    chartMonthsRange: 12
  }
};

/**
 * Yıl listesi oluştur
 * @param currentYear Mevcut yıl
 * @param customRange Özel aralık (opsiyonel)
 */
export function generateYearList(
  currentYear?: number,
  customRange?: { past?: number; future?: number }
): number[] {
  const year = currentYear || new Date().getFullYear();
  const range = customRange || LEAVE_CONFIG.yearRange.defaultRange;
  
  const startYear = Math.max(
    LEAVE_CONFIG.yearRange.minYear,
    year - range.pastYears
  );
  
  const endYear = Math.min(
    LEAVE_CONFIG.yearRange.maxYear,
    year + range.futureYears
  );
  
  const years: number[] = [];
  for (let i = startYear; i <= endYear; i++) {
    years.push(i);
  }
  
  return years;
}

/**
 * Yıl tipini belirle
 * @param year Kontrol edilecek yıl
 * @param currentYear Mevcut yıl
 */
export function getYearType(
  year: number,
  currentYear?: number
): 'past' | 'current' | 'future' {
  const current = currentYear || new Date().getFullYear();
  
  if (year < current) return 'past';
  if (year > current) return 'future';
  return 'current';
}

/**
 * Yıl etiketi oluştur
 * @param year Yıl
 * @param currentYear Mevcut yıl
 */
export function getYearLabel(
  year: number,
  currentYear?: number
): string {
  const type = getYearType(year, currentYear);
  
  switch (type) {
    case 'current':
      return `${year} (Mevcut Yıl)`;
    case 'past':
      return `${year} (Geçmiş)`;
    case 'future':
      return `${year} (Gelecek)`;
    default:
      return year.toString();
  }
}

/**
 * İzin hakkı hesapla
 * @param serviceYears Çalışma yılı
 * @param baseLeave Temel izin hakkı
 */
export function calculateLeaveEntitlement(
  serviceYears: number,
  baseLeave: number = LEAVE_CONFIG.defaultLeaveRights.annual
): number {
  const { yearsPerBonus, bonusDays, maxBonus } = LEAVE_CONFIG.seniorityBonus;
  
  // Kıdem bonusu hesapla
  const bonus = Math.min(
    Math.floor(serviceYears / yearsPerBonus) * bonusDays,
    maxBonus
  );
  
  return baseLeave + bonus;
}

/**
 * Gelecek yıl için planlama yapılabilir mi kontrol et
 * @param targetYear Hedef yıl
 * @param targetMonth Hedef ay
 */
export function canPlanForFuture(
  targetYear: number,
  targetMonth?: number
): boolean {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  
  // Hedef tarih oluştur
  const target = new Date(targetYear, (targetMonth || 1) - 1, 1);
  
  // Maksimum planlama tarihini hesapla
  const maxDate = new Date(now);
  maxDate.setMonth(maxDate.getMonth() + LEAVE_CONFIG.planningRules.maxAdvanceMonths);
  
  return target <= maxDate;
}
