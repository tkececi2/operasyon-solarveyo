/**
 * İzin/Tatil Yönetimi Tipleri
 */

export interface ILeaveRequest {
  id?: string;
  userId: string; // İzin talep eden kullanıcı
  userName: string;
  userRole: string;
  userPhotoUrl?: string; // Kullanıcı profil fotoğrafı
  companyId: string;
  
  // İzin Detayları
  leaveType: 'yillik' | 'hastalik' | 'mazeret' | 'ucretsiz' | 'dogum' | 'evlilik' | 'vefat' | 'diger';
  startDate: Date | string;
  endDate: Date | string;
  totalDays: number; // Toplam gün sayısı
  reason: string; // İzin nedeni/açıklama
  
  // Onay Süreci
  status: 'beklemede' | 'onaylandi' | 'reddedildi' | 'iptal';
  approvedBy?: string; // Onaylayan yönetici ID
  approverName?: string;
  approvalDate?: Date | string;
  rejectionReason?: string; // Red nedeni
  
  // Sistem Bilgileri
  createdAt: Date | string;
  updatedAt?: Date | string;
  
  // Ek Bilgiler
  attachments?: string[]; // Rapor, belge vb.
  substituteUserId?: string; // Yerine bakacak kişi
  substituteUserName?: string;
  notes?: string; // Ek notlar
}

export interface ILeaveBalance {
  id?: string;
  userId: string;
  companyId: string;
  year: number;
  
  // İzin Hakları (gün)
  annualLeaveTotal: number; // Yıllık izin hakkı
  annualLeaveUsed: number; // Kullanılan yıllık izin
  annualLeaveRemaining: number; // Kalan yıllık izin
  
  sickLeaveTotal: number; // Hastalık izni hakkı
  sickLeaveUsed: number; // Kullanılan hastalık izni
  sickLeaveRemaining: number; // Kalan hastalık izni
  
  // Diğer İzinler
  unpaidLeaveUsed: number; // Ücretsiz izin
  maternityLeaveUsed: number; // Doğum izni
  marriageLeaveUsed: number; // Evlilik izni
  bereavementLeaveUsed: number; // Vefat izni
  otherLeaveUsed: number; // Diğer izinler
  
  // Geçmiş Yıldan Devreden
  carryOverDays: number; // Devreden izin günleri
  
  updatedAt: Date | string;
}

export interface IHoliday {
  id?: string;
  companyId: string;
  name: string; // Bayram/Tatil adı
  date: Date | string;
  type: 'resmi' | 'dini' | 'sirket';
  isRecurring: boolean; // Her yıl tekrarlanır mı?
  createdAt: Date | string;
}

export interface IShiftSchedule {
  id?: string;
  companyId: string;
  userId: string;
  userName: string;
  
  date: Date | string;
  shiftType: 'sabah' | 'ogle' | 'aksam' | 'gece' | 'tatil' | 'izinli';
  startTime?: string; // "08:00"
  endTime?: string; // "16:00"
  
  location?: string; // Çalışma lokasyonu
  notes?: string;
  
  createdAt: Date | string;
  createdBy: string;
}

// İzin Tipleri
export const LEAVE_TYPES = {
  yillik: { label: 'Yıllık İzin', color: 'blue', icon: '🏖️' },
  hastalik: { label: 'Hastalık İzni', color: 'red', icon: '🏥' },
  mazeret: { label: 'Mazeret İzni', color: 'yellow', icon: '📋' },
  ucretsiz: { label: 'Ücretsiz İzin', color: 'gray', icon: '💼' },
  dogum: { label: 'Doğum İzni', color: 'pink', icon: '👶' },
  evlilik: { label: 'Evlilik İzni', color: 'purple', icon: '💒' },
  vefat: { label: 'Vefat İzni', color: 'black', icon: '🕊️' },
  diger: { label: 'Diğer', color: 'gray', icon: '📝' }
} as const;

// Vardiya Tipleri
export const SHIFT_TYPES = {
  sabah: { label: 'Sabah', time: '08:00-10:00', color: 'yellow' },
  ogle: { label: 'Öğle', time: '15:00-17:00', color: 'orange' },
  aksam: { label: 'Akşam', time: '20:00-22:00', color: 'blue' },
  gece: { label: 'Gece', time: '03:00-05:00', color: 'indigo' },
  tatil: { label: 'Tatil', time: '-', color: 'green' },
  izinli: { label: 'İzinli', time: '-', color: 'gray' }
} as const;

// İzin Durumları
export const LEAVE_STATUS = {
  beklemede: { label: 'Beklemede', color: 'yellow', icon: '⏳' },
  onaylandi: { label: 'Onaylandı', color: 'green', icon: '✅' },
  reddedildi: { label: 'Reddedildi', color: 'red', icon: '❌' },
  iptal: { label: 'İptal Edildi', color: 'gray', icon: '🚫' }
} as const;

