/**
 * İzin/Tatil Yönetimi Sayfası
 */

import React, { useState, useEffect } from 'react';
import { 
  Calendar,
  Plus,
  Check,
  X,
  Clock,
  Users,
  TrendingUp,
  AlertCircle,
  Download,
  Filter,
  Search,
  ChevronLeft,
  ChevronRight,
  Eye,
  Edit,
  Trash2,
  FileText,
  BarChart3,
  CalendarDays,
  UserCheck,
  User
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, addMonths, subMonths } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import { Badge } from '../../components/ui/Badge';
import { useAuth } from '../../contexts/AuthContext';
import { 
  createLeaveRequest,
  getLeaveRequests,
  updateLeaveRequestStatus,
  deleteLeaveRequest,
  getLeaveBalance,
  getHolidays,
  getLeaveStatistics,
  updateLeaveBalanceManual
} from '../../services/leaveService';
import { ILeaveRequest, ILeaveBalance, LEAVE_TYPES, LEAVE_STATUS } from '../../types/leave.types';
import toast from 'react-hot-toast';
import LeaveRequestModal from '../../components/leave/LeaveRequestModal';
import LeaveDetailsModal from '../../components/leave/LeaveDetailsModal';
import LeaveCalendar from '../../components/leave/LeaveCalendar';
import { LeaveBalanceEditModal } from '../../components/leave/LeaveBalanceEditModal';
import { ManualLeaveEntryModal } from '../../components/leave/ManualLeaveEntryModal';
import { exportToExcel } from '../../utils/exportUtils';

const IzinYonetimi: React.FC = () => {
  const { userProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<'requests' | 'calendar' | 'balance' | 'stats'>('requests');
  const [leaveRequests, setLeaveRequests] = useState<ILeaveRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<ILeaveRequest[]>([]);
  const [leaveBalance, setLeaveBalance] = useState<ILeaveBalance | null>(null);
  const [statistics, setStatistics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showBalanceEditModal, setShowBalanceEditModal] = useState(false);
  const [showManualEntryModal, setShowManualEntryModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<ILeaveRequest | null>(null);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [teamBalances, setTeamBalances] = useState<any[]>([]);
  const [loadingBalances, setLoadingBalances] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [brokenImages, setBrokenImages] = useState<Set<string>>(new Set());
  
  // Filtreler
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  const isManager = userProfile?.rol === 'yonetici' || userProfile?.rol === 'superadmin';

  useEffect(() => {
    loadData();
    // Geniş yıl aralığı oluştur (geçmiş 10 yıl + gelecek 10 yıl)
    // Bu sayede uzun süre güncelleme gerekmez
    const currentYear = new Date().getFullYear();
    const years = [];
    
    // 2020'den başla, 2040'a kadar git (20 yıllık aralık)
    const startYear = 2020;
    const endYear = 2040;
    
    for (let i = startYear; i <= endYear; i++) {
      years.push(i);
    }
    
    setAvailableYears(years);
  }, [userProfile]);

  useEffect(() => {
    loadData();
  }, [selectedYear]);

  useEffect(() => {
    filterRequests();
  }, [leaveRequests, searchTerm, statusFilter, typeFilter]);

  const loadData = async () => {
    if (!userProfile) return;

    setLoading(true);
    try {
      // İzin talepleri (seçili yıl için)
      const requests = await getLeaveRequests(userProfile, { year: selectedYear });
      setLeaveRequests(requests);

      // Kullanıcının izin bakiyesi
      if (!isManager) {
        const balance = await getLeaveBalance(userProfile.id, selectedYear);
        setLeaveBalance(balance);
      }
      
      // İstatistikler (sadece yöneticiler için)
      if (isManager && userProfile.companyId) {
        const stats = await getLeaveStatistics(userProfile.companyId, selectedYear);
        setStatistics(stats);
      }
    } catch (error) {
      console.error('Veri yükleme hatası:', error);
      toast.error('Veriler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const loadTeamBalances = async () => {
    if (!userProfile || !isManager) return;
    
    setLoadingBalances(true);
    try {
      // Tüm kullanıcıları al
      const { getCompanyUsers } = await import('../../services/userService');
      const users = await getCompanyUsers(userProfile.companyId);
      
      // Her kullanıcı için bakiye bilgisi al
      const balances = await Promise.all(
        users.map(async (user) => {
          try {
            const balance = await getLeaveBalance(user.uid, selectedYear);
            
            return {
              userId: user.uid,
              userName: user.displayName || user.email,
              email: user.email,
              userPhotoUrl: user.photoURL,
              department: user.department || 'Belirtilmemiş',
              position: user.position || 'Belirtilmemiş',
              annualTotal: balance?.annualLeaveTotal || 14,
              annualUsed: balance?.annualLeaveUsed || 0,
              annualRemaining: balance?.annualLeaveRemaining || 14,
              sickUsed: balance?.sickLeaveUsed || 0,
              sickRemaining: balance?.sickLeaveRemaining || 10,
              carryOver: balance?.carryOverDays || 0,
              lastUpdated: balance?.updatedAt
            };
          } catch (error) {
            console.error(`Bakiye yükleme hatası (${user.email}):`, error);
            return {
              userId: user.uid,
              userName: user.displayName || user.email,
              email: user.email,
              userPhotoUrl: user.photoURL,
              department: user.department || 'Belirtilmemiş',
              position: user.position || 'Belirtilmemiş',
              annualTotal: 14,
              annualUsed: 0,
              annualRemaining: 14,
              sickUsed: 0,
              sickRemaining: 10,
              carryOver: 0,
              lastUpdated: new Date()
            };
          }
        })
      );
      
      setTeamBalances(balances);
    } catch (error) {
      console.error('Ekip bakiyeleri yükleme hatası:', error);
      toast.error('Ekip bakiyeleri yüklenirken hata oluştu');
    } finally {
      setLoadingBalances(false);
    }
  };

  const filterRequests = () => {
    let filtered = [...leaveRequests];

    // Metin araması
    if (searchTerm) {
      filtered = filtered.filter(r => 
        r.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.reason.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Durum filtresi
    if (statusFilter !== 'all') {
      filtered = filtered.filter(r => r.status === statusFilter);
    }

    // Tip filtresi
    if (typeFilter !== 'all') {
      filtered = filtered.filter(r => r.leaveType === typeFilter);
    }

    setFilteredRequests(filtered);
  };

  const handleApprove = async (requestId: string) => {
    if (!userProfile) return;

    try {
      await updateLeaveRequestStatus(requestId, 'onaylandi', userProfile);
      toast.success('İzin talebi onaylandı');
      loadData();
    } catch (error) {
      toast.error('İzin onaylanırken hata oluştu');
    }
  };

  const handleReject = async (requestId: string, reason: string) => {
    if (!userProfile) return;

    try {
      await updateLeaveRequestStatus(requestId, 'reddedildi', userProfile, reason);
      toast.success('İzin talebi reddedildi');
      loadData();
    } catch (error) {
      toast.error('İzin reddedilirken hata oluştu');
    }
  };

  const handleDelete = async (requestId: string) => {
    if (!userProfile) return;
    
    if (!confirm('Bu izin talebini silmek istediğinizden emin misiniz?\nOnaylanmış izinler silindiğinde kullanıcının bakiyesi geri yüklenir.')) {
      return;
    }
    
    try {
      await deleteLeaveRequest(requestId, userProfile);
      toast.success('İzin talebi silindi');
      loadData();
    } catch (error: any) {
      toast.error(error.message || 'Silme sırasında hata oluştu');
    }
  };

  // Excel export fonksiyonu
  const handleExcelExport = () => {
    // Rol kontrolü - sadece yönetici, mühendis ve tekniker indirebilir
    const allowedRoles = ['yonetici', 'muhendis', 'tekniker', 'superadmin'];
    if (!userProfile || !allowedRoles.includes(userProfile.rol)) {
      toast.error('Excel indirme yetkiniz bulunmamaktadır');
      return;
    }

    // Tarih formatı için güvenli fonksiyon
    const safeFormatDate = (date: any, formatStr: string = 'dd.MM.yyyy') => {
      try {
        if (!date) return '-';
        const dateObj = date instanceof Date ? date : new Date(date);
        if (isNaN(dateObj.getTime())) return '-';
        return format(dateObj, formatStr, { locale: tr });
      } catch (error) {
        return '-';
      }
    };

    // Export edilecek veriyi hazırla
    const exportData = filteredRequests.map(request => ({
      'Personel': request.userName || '-',
      'Rol': request.userRole || '-',
      'İzin Tipi': LEAVE_TYPES[request.leaveType as keyof typeof LEAVE_TYPES]?.label || request.leaveType || '-',
      'Başlangıç Tarihi': safeFormatDate(request.startDate),
      'Bitiş Tarihi': safeFormatDate(request.endDate),
      'Gün Sayısı': request.totalDays || 0,
      'Durum': LEAVE_STATUS[request.status as keyof typeof LEAVE_STATUS]?.label || request.status || '-',
      'Açıklama': request.reason || '-',
      'Yerine Bakacak': request.substituteName || '-',
      'Talep Tarihi': safeFormatDate(request.createdAt, 'dd.MM.yyyy HH:mm'),
      'Onaylayan': request.approvedBy || '-',
      'Onay Tarihi': request.approvedAt ? safeFormatDate(request.approvedAt, 'dd.MM.yyyy HH:mm') : '-',
      'Red Nedeni': request.rejectionReason || '-'
    }));

    // Excel'e export et
    const fileName = `izin_talepleri_${selectedYear}_${format(new Date(), 'ddMMyyyy_HHmm')}`;
    exportToExcel(exportData, fileName, `İzin Talepleri - ${selectedYear}`);
    toast.success('Excel dosyası indirildi');
  };

  // Bakiye verilerini Excel'e export et
  const handleBalanceExport = () => {
    // Rol kontrolü
    const allowedRoles = ['yonetici', 'muhendis', 'tekniker', 'superadmin'];
    if (!userProfile || !allowedRoles.includes(userProfile.rol)) {
      toast.error('Excel indirme yetkiniz bulunmamaktadır');
      return;
    }

    if (teamBalances.length === 0) {
      toast.error('Export edilecek veri bulunamadı');
      return;
    }

    // Tarih formatı için güvenli fonksiyon
    const safeFormatDate = (date: any, formatStr: string = 'dd.MM.yyyy HH:mm') => {
      try {
        if (!date) return '-';
        const dateObj = date instanceof Date ? date : new Date(date);
        if (isNaN(dateObj.getTime())) return '-';
        return format(dateObj, formatStr, { locale: tr });
      } catch (error) {
        return '-';
      }
    };

    const exportData = teamBalances.map(balance => ({
      'Personel': balance.userName || '-',
      'E-posta': balance.email || '-',
      'Departman': balance.department || '-',
      'Pozisyon': balance.position || '-',
      'Yıllık İzin (Toplam)': balance.annualTotal || 0,
      'Yıllık İzin (Kullanılan)': balance.annualUsed || 0,
      'Yıllık İzin (Kalan)': balance.annualRemaining || 0,
      'Hastalık İzni (Kullanılan)': balance.sickUsed || 0,
      'Hastalık İzni (Kalan)': balance.sickRemaining || 0,
      'Devreden İzin': balance.carryOver || 0,
      'Son Güncelleme': safeFormatDate(balance.lastUpdated)
    }));

    const fileName = `izin_bakiyeleri_${selectedYear}_${format(new Date(), 'ddMMyyyy_HHmm')}`;
    exportToExcel(exportData, fileName, `İzin Bakiyeleri - ${selectedYear}`);
    toast.success('Excel dosyası indirildi');
  };

  const handleViewDetails = (request: ILeaveRequest) => {
    setSelectedRequest(request);
    setShowDetailsModal(true);
  };

  const getStatusBadge = (status: string) => {
    const config = LEAVE_STATUS[status as keyof typeof LEAVE_STATUS];
    return (
      <Badge variant={
        status === 'onaylandi' ? 'success' :
        status === 'reddedildi' ? 'danger' :
        status === 'beklemede' ? 'warning' : 'secondary'
      }>
        {config?.icon} {config?.label}
      </Badge>
    );
  };

  const getTypeBadge = (type: string) => {
    const config = LEAVE_TYPES[type as keyof typeof LEAVE_TYPES];
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-${config?.color}-100 text-${config?.color}-800`}>
        {config?.icon} {config?.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Başlık ve Aksiyonlar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">İzin Yönetimi</h1>
            <p className="text-gray-600 mt-1">İzin talepleri ve tatil takibi</p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {availableYears.map(year => {
                const currentYear = new Date().getFullYear();
                let label = year.toString();
                if (year === currentYear) {
                  label += ' (Mevcut Yıl)';
                } else if (year < currentYear) {
                  label += ' (Geçmiş)';
                } else {
                  label += ' (Gelecek)';
                }
                return (
                  <option key={year} value={year}>
                    {label}
                  </option>
                );
              })}
            </select>
            {selectedYear < new Date().getFullYear() && (
              <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
                Geçmiş Yıl
              </span>
            )}
            {selectedYear > new Date().getFullYear() && (
              <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                Gelecek Yıl
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Excel İndir - Sadece yönetici, mühendis ve tekniker görebilir */}
          {userProfile && ['yonetici', 'muhendis', 'tekniker', 'superadmin'].includes(userProfile.rol) && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleExcelExport}
              title="İzin taleplerini Excel olarak indir"
            >
              <Download className="h-4 w-4 mr-2" />
              Excel İndir
            </Button>
          )}
          {selectedYear >= new Date().getFullYear() && (
            <Button
              onClick={() => setShowRequestModal(true)}
              className="flex items-center"
              title={selectedYear > new Date().getFullYear() ? 'Gelecek yıl için planlama' : 'Yeni izin talebi'}
            >
              <Plus className="h-4 w-4 mr-2" />
              {selectedYear > new Date().getFullYear() ? 'İzin Planla' : 'İzin Talebi'}
            </Button>
          )}
          {isManager && (
            <Button
              variant="outline"
              onClick={() => setShowManualEntryModal(true)}
              className="flex items-center"
              title="Geçmişe dönük izin kaydı ekle"
            >
              <FileText className="h-4 w-4 mr-2" />
              Manuel Kayıt
            </Button>
          )}
        </div>
      </div>

      {/* İstatistik Kartları */}
      {!isManager && leaveBalance && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Yıllık İzin</p>
                <p className="text-2xl font-bold text-gray-900">
                  {leaveBalance.annualLeaveRemaining}/{leaveBalance.annualLeaveTotal}
                </p>
                <p className="text-xs text-gray-500">Kalan/Toplam Gün</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <CalendarDays className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Hastalık İzni</p>
                <p className="text-2xl font-bold text-gray-900">
                  {leaveBalance.sickLeaveRemaining}/{leaveBalance.sickLeaveTotal}
                </p>
                <p className="text-xs text-gray-500">Kalan/Toplam Gün</p>
              </div>
              <div className="p-3 bg-red-100 rounded-full">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Kullanılan İzin</p>
                <p className="text-2xl font-bold text-gray-900">
                  {leaveBalance.annualLeaveUsed + leaveBalance.sickLeaveUsed}
                </p>
                <p className="text-xs text-gray-500">Toplam Gün</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <UserCheck className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Devreden</p>
                <p className="text-2xl font-bold text-gray-900">
                  {leaveBalance.carryOverDays}
                </p>
                <p className="text-xs text-gray-500">Geçen Yıldan</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Yönetici İstatistikleri */}
      {isManager && statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Toplam Talep</p>
                <p className="text-2xl font-bold text-gray-900">{statistics.totalRequests}</p>
                <p className="text-xs text-gray-500">{selectedYear}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Onaylanan</p>
                <p className="text-2xl font-bold text-green-600">{statistics.approvedRequests}</p>
                <p className="text-xs text-gray-500">
                  %{Math.round((statistics.approvedRequests / statistics.totalRequests) * 100 || 0)}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <Check className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Bekleyen</p>
                <p className="text-2xl font-bold text-yellow-600">{statistics.pendingRequests}</p>
                <p className="text-xs text-gray-500">Onay bekliyor</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-full">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Ort. İzin</p>
                <p className="text-2xl font-bold text-gray-900">{statistics.averageLeaveDays}</p>
                <p className="text-xs text-gray-500">Gün/Kişi</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <BarChart3 className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Sekmeler */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('requests')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'requests'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <FileText className="h-4 w-4 inline mr-2" />
            İzin Talepleri
          </button>
          <button
            onClick={() => setActiveTab('calendar')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'calendar'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Calendar className="h-4 w-4 inline mr-2" />
            Takvim Görünümü
          </button>
          <button
            onClick={() => setActiveTab('balance')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'balance'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Users className="h-4 w-4 inline mr-2" />
            İzin Bakiyeleri
          </button>
          {isManager && (
            <button
              onClick={() => setActiveTab('stats')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'stats'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <BarChart3 className="h-4 w-4 inline mr-2" />
              İstatistikler
            </button>
          )}
        </nav>
      </div>

      {/* İçerik */}
      {activeTab === 'requests' && (
        <Card>
          {/* Filtreler */}
          <div className="p-4 border-b border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">Tüm Durumlar</option>
                <option value="beklemede">Beklemede</option>
                <option value="onaylandi">Onaylandı</option>
                <option value="reddedildi">Reddedildi</option>
                <option value="iptal">İptal</option>
              </Select>
              <Select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <option value="all">Tüm Tipler</option>
                {Object.entries(LEAVE_TYPES).map(([key, value]) => (
                  <option key={key} value={key}>{value.label}</option>
                ))}
              </Select>
              <Button variant="outline" onClick={loadData}>
                <Filter className="h-4 w-4 mr-2" />
                Yenile
              </Button>
            </div>
          </div>

          {/* Tablo - Mobil için responsive */}
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <table className="w-full min-w-[640px]">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Personel
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                    İzin Tipi
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tarih
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                    Gün
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Durum
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    İşlemler
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRequests.map((request) => (
                  <tr key={request.id} className="hover:bg-gray-50">
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                          {request.userPhotoUrl && !brokenImages.has(request.userId) ? (
                            <img 
                              src={request.userPhotoUrl}
                              alt={request.userName}
                              className="w-full h-full object-cover"
                              onError={() => {
                                setBrokenImages(prev => new Set(prev).add(request.userId));
                              }}
                            />
                          ) : (
                            <User className="h-4 w-4 text-blue-600" />
                          )}
                        </div>
                        <div>
                          <div className="text-xs sm:text-sm font-medium text-gray-900 flex items-center gap-2">
                            {request.userName}
                            {(request as any).isManualEntry && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800" title="Manuel olarak eklenmiş">
                                M
                              </span>
                            )}
                          </div>
                          <div className="text-xs sm:text-sm text-gray-500 sm:hidden">
                            {LEAVE_TYPES[request.leaveType as keyof typeof LEAVE_TYPES]?.label || request.leaveType}
                          </div>
                          <div className="text-xs text-gray-500">
                            {request.userRole}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap hidden sm:table-cell">
                      {getTypeBadge(request.leaveType)}
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      <div className="text-xs sm:text-sm text-gray-900">
                        <div>{format(new Date(request.startDate), 'dd MMM', { locale: tr })}</div>
                        <div className="text-gray-500">{format(new Date(request.endDate), 'dd MMM', { locale: tr })}</div>
                        <div className="sm:hidden text-xs text-gray-600 mt-1">
                          {request.totalDays} gün
                        </div>
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap hidden md:table-cell">
                      <span className="text-sm font-medium text-gray-900">
                        {request.totalDays} gün
                      </span>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      {getStatusBadge(request.status)}
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-1 sm:gap-2">
                        <button
                          onClick={() => handleViewDetails(request)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Detayları Görüntüle"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        {isManager && request.status === 'beklemede' && (
                          <>
                            <button
                              onClick={() => handleApprove(request.id!)}
                              className="text-green-600 hover:text-green-900"
                              title="Onayla"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => {
                                const reason = prompt('Red nedeni:');
                                if (reason) handleReject(request.id!, reason);
                              }}
                              className="text-red-600 hover:text-red-900"
                              title="Reddet"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </>
                        )}
                        {isManager && (
                          <button
                            onClick={() => handleDelete(request.id!)}
                            className="text-gray-600 hover:text-red-600"
                            title="Sil"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredRequests.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500">İzin talebi bulunamadı</p>
              </div>
            )}
          </div>
        </Card>
      )}

      {activeTab === 'calendar' && (
        <LeaveCalendar 
          requests={leaveRequests}
          currentMonth={currentMonth}
          onMonthChange={setCurrentMonth}
        />
      )}

      {activeTab === 'balance' && (
        <Card className="p-6">
          {/* Kendi Bakiyesi (Normal Kullanıcılar) */}
          {!isManager && leaveBalance && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold mb-4">İzin Bakiyem - {new Date().getFullYear()}</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="border rounded-lg p-4">
                  <p className="text-sm text-gray-600">Yıllık İzin</p>
                  <p className="text-2xl font-bold">
                    {leaveBalance.annualLeaveRemaining}/{leaveBalance.annualLeaveTotal}
                  </p>
                  <p className="text-xs text-gray-500">Kalan/Toplam Gün</p>
                </div>
                <div className="border rounded-lg p-4">
                  <p className="text-sm text-gray-600">Hastalık İzni</p>
                  <p className="text-2xl font-bold">
                    {leaveBalance.sickLeaveRemaining}/{leaveBalance.sickLeaveTotal}
                  </p>
                  <p className="text-xs text-gray-500">Kalan/Toplam Gün</p>
                </div>
                <div className="border rounded-lg p-4">
                  <p className="text-sm text-gray-600">Devreden İzin</p>
                  <p className="text-2xl font-bold">{leaveBalance.carryOverDays || 0}</p>
                  <p className="text-xs text-gray-500">Gün</p>
                </div>
              </div>
            </div>
          )}

          {/* Tüm Kullanıcıların Bakiyeleri (Yöneticiler) */}
          {isManager && (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Personel İzin Bakiyeleri - {selectedYear}</h3>
                {teamBalances.length > 0 && userProfile && ['yonetici', 'muhendis', 'tekniker', 'superadmin'].includes(userProfile.rol) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleBalanceExport}
                    title="İzin bakiyelerini Excel olarak indir"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Excel İndir
                  </Button>
                )}
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Personel
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Yıllık İzin
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Hastalık İzni
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Devreden
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        İşlemler
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {teamBalances.length === 0 && !loadingBalances && (
                      <tr>
                        <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                          <Button
                            size="sm"
                            onClick={loadTeamBalances}
                          >
                            Personel Listesini Yükle
                          </Button>
                        </td>
                      </tr>
                    )}
                    {loadingBalances && (
                      <tr>
                        <td colSpan={5} className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            <span className="ml-3 text-gray-600">Yükleniyor...</span>
                          </div>
                        </td>
                      </tr>
                    )}
                    {teamBalances.map((balance) => (
                      <tr key={balance.userId} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                              {balance.userPhotoUrl && !brokenImages.has(balance.userId) ? (
                                <img 
                                  src={balance.userPhotoUrl}
                                  alt={balance.userName}
                                  className="w-full h-full object-cover"
                                  onError={() => {
                                    setBrokenImages(prev => new Set(prev).add(balance.userId));
                                  }}
                                />
                              ) : (
                                <User className="h-5 w-5 text-blue-600" />
                              )}
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {balance.userName}
                              </div>
                              <div className="text-sm text-gray-500">
                                {balance.email}
                              </div>
                              <div className="text-xs text-gray-400">
                                {balance.department} - {balance.position}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm">
                            <div className="font-medium text-gray-900">
                              {balance.annualRemaining}/{balance.annualTotal} gün
                            </div>
                            <div className="text-xs text-gray-500">
                              Kullanılan: {balance.annualUsed} gün
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                              <div
                                className="bg-blue-600 h-2 rounded-full"
                                style={{
                                  width: `${Math.min((balance.annualUsed / balance.annualTotal) * 100, 100)}%`
                                }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm">
                            <div className="font-medium text-gray-900">
                              {balance.sickRemaining}/10 gün
                            </div>
                            <div className="text-xs text-gray-500">
                              Kullanılan: {balance.sickUsed} gün
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            balance.carryOver > 0 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {balance.carryOver} gün
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => {
                              setSelectedUser(balance);
                              setShowBalanceEditModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-900 mr-3"
                          >
                            Düzenle
                          </button>
                          <button
                            onClick={() => {
                              // Detay görüntüleme
                              toast('Detay görünümü yakında eklenecek', { icon: 'ℹ️' });
                            }}
                            className="text-gray-600 hover:text-gray-900"
                          >
                            Detay
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </Card>
      )}

      {activeTab === 'stats' && isManager && (
        <Card className="p-6">
          <div className="text-center py-12">
            <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Detaylı istatistikler yakında eklenecek</p>
          </div>
        </Card>
      )}

      {/* Modaller */}
      {showRequestModal && (
        <LeaveRequestModal
          isOpen={showRequestModal}
          onClose={() => setShowRequestModal(false)}
          onSubmit={() => {
            loadData();
            setShowRequestModal(false);
          }}
          userProfile={userProfile!}
        />
      )}

      {showDetailsModal && selectedRequest && (
        <LeaveDetailsModal
          isOpen={showDetailsModal}
          onClose={() => setShowDetailsModal(false)}
          request={selectedRequest}
          isManager={isManager}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      )}

      {showBalanceEditModal && selectedUser && (
        <LeaveBalanceEditModal
          isOpen={showBalanceEditModal}
          onClose={() => {
            setShowBalanceEditModal(false);
            setSelectedUser(null);
          }}
          user={selectedUser}
          userProfile={userProfile!}
          year={selectedYear}
          onUpdate={() => {
            loadData();
            if (activeTab === 'balance') {
              loadTeamBalances();
            }
            setShowBalanceEditModal(false);
            setSelectedUser(null);
          }}
        />
      )}

      {showManualEntryModal && userProfile && (
        <ManualLeaveEntryModal
          isOpen={showManualEntryModal}
          onClose={() => setShowManualEntryModal(false)}
          userProfile={userProfile}
          selectedYear={selectedYear}
          onSuccess={() => {
            loadData();
            if (activeTab === 'balance') {
              loadTeamBalances();
            }
          }}
        />
      )}
    </div>
  );
};

export default IzinYonetimi;
