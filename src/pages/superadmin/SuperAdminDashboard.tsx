/**
 * 🚀 Modern SuperAdmin Dashboard
 * SolarVeyo Platform Yönetimi
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  getAllCompaniesWithStats, 
  getPlatformStats, 
  updateCompanySubscription,
  toggleCompanyStatus,
  deleteCompany,
  getAdminActivityLogs,
  secureDeleteCompany,
  type CompanyStats,
  type PlatformStats,
  type AdminActivityLog
} from '../../services/superAdminService';
import { deleteCompanyCompletely } from '../../services/companyDeletionService';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { cleanupOdemeDurumuFields } from '../../utils/cleanupOdemeDurumu';
import { SAAS_CONFIG } from '../../config/saas.config';
import { getMergedPlans, subscribeToMergedPlans } from '../../services/planConfigService';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  Button,
  Badge,
  Select,
  LoadingSpinner,
  Modal
} from '../../components/ui';
import { 
  Building2, 
  Users, 
  DollarSign, 
  TrendingUp, 
  Calendar,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Crown,
  Activity,
  Eye,
  Zap,
  Wrench
} from 'lucide-react';
import toast from 'react-hot-toast';

const SuperAdminDashboard: React.FC = () => {
  const { userProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [companies, setCompanies] = useState<CompanyStats[]>([]);
  const [platformStats, setPlatformStats] = useState<PlatformStats | null>(null);
  const [activityLogs, setActivityLogs] = useState<AdminActivityLog[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<CompanyStats | null>(null);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [showCompanyDetailModal, setShowCompanyDetailModal] = useState(false);
  const [newPlanId, setNewPlanId] = useState('');
  const [plans, setPlans] = useState<Record<string, any>>(() => (SAAS_CONFIG as any).PLANS);
  const [showSecureDeleteModal, setShowSecureDeleteModal] = useState(false);
  const [confirmCompanyName, setConfirmCompanyName] = useState('');
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [showOrphanCleanup, setShowOrphanCleanup] = useState(false);
  const [orphanCompanyName, setOrphanCompanyName] = useState('');
  const [orphanFoundId, setOrphanFoundId] = useState<string>('');
  const [orphanBusy, setOrphanBusy] = useState(false);

  // Yetki kontrolü
  if (!userProfile || userProfile.rol !== 'superadmin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-96">
          <CardHeader>
            <CardTitle className="text-red-600 flex items-center gap-2">
              <XCircle className="h-5 w-5" />
              Yetkisiz Erişim
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">Bu sayfa sadece SuperAdmin kullanıcıları için.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Verileri yükle
  const loadData = async () => {
    try {
      setLoading(true);
      const [companiesData, statsData, logsData] = await Promise.all([
        getAllCompaniesWithStats(),
        getPlatformStats(),
        getAdminActivityLogs(20)
      ]);
      
      setCompanies(companiesData);
      setPlatformStats(statsData);
      setActivityLogs(logsData);
    } catch (error) {
      console.error('Veri yükleme hatası:', error);
      toast.error('Veriler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  // Planları yükle ve canlı dinle – SuperAdmin planları güncellediğinde dropdown anında güncellensin
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    (async () => {
      try {
        const merged = await getMergedPlans();
        setPlans(merged);
      } catch {}
      unsubscribe = subscribeToMergedPlans((merged) => setPlans(merged));
    })();
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  useEffect(() => {
    loadData();
  }, []);

  // Abonelik güncelle
  const handleUpdateSubscription = async () => {
    if (!selectedCompany || !newPlanId) return;
    
    try {
      await updateCompanySubscription(
        selectedCompany.id, 
        newPlanId, 
        userProfile!.id, 
        userProfile!.ad
      );
      
      toast.success('Abonelik başarıyla güncellendi');
      setShowSubscriptionModal(false);
      loadData();
    } catch (error) {
      console.error('Abonelik güncelleme hatası:', error);
      toast.error('Abonelik güncellenirken hata oluştu');
    }
  };

  // Silinmiş (companies'de görünmeyen) şirketler için: adıyla ID bul ve temizle
  const findDeletedCompanyIdByName = async (name: string) => {
    const q = query(
      collection(db, 'adminActivityLogs'),
      where('action', '==', 'company_delete')
    );
    const snap = await getDocs(q);
    const items = snap.docs
      .map(d=>d.data() as any)
      .filter(d => String(d.targetCompanyName || '').trim().toLowerCase() === String(name||'').trim().toLowerCase())
      .sort((a,b)=> (b.timestamp?.seconds||0) - (a.timestamp?.seconds||0));
    return items[0]?.targetCompanyId || '';
  };

  const handleOrphanCleanup = async () => {
    if (!orphanCompanyName) { toast.error('Şirket adını yazın'); return; }
    try {
      setOrphanBusy(true);
      const id = await findDeletedCompanyIdByName(orphanCompanyName);
      setOrphanFoundId(id);
      if (!id) { toast.error('Kayıtlarda bu adla silinmiş şirket bulunamadı'); return; }
      const res = await deleteCompanyCompletely(id, { userId: userProfile!.id, userEmail: userProfile!.email || '', userName: userProfile!.ad });
      if (res.success) {
        toast.success('Yetim veriler temizlendi');
        setOrphanCompanyName(''); setOrphanFoundId(''); setShowOrphanCleanup(false);
        loadData();
      } else {
        toast(res.errors.length ? res.errors[0] : 'Temizlikte hata');
      }
    } catch (e) {
      console.error(e);
      toast.error('Temizlik hatası');
    } finally {
      setOrphanBusy(false);
    }
  };

  // Şirket durumu değiştir
  const handleToggleCompany = async (company: CompanyStats) => {
    try {
      await toggleCompanyStatus(
        company.id, 
        company.isActive, 
        userProfile!.id, 
        userProfile!.ad
      );
      
      toast.success(`Şirket ${!company.isActive ? 'aktifleştirildi' : 'pasifleştirildi'}`);
      loadData();
    } catch (error) {
      console.error('Şirket durumu değiştirme hatası:', error);
      toast.error('İşlem başarısız');
    }
  };

  // Şirket sil
  const handleDeleteCompany = async (company: CompanyStats) => {
    setSelectedCompany(company);
    setConfirmCompanyName('');
    setShowSecureDeleteModal(true);
  };

  const handleSecureDelete = async () => {
    if (!selectedCompany) return;
    const norm = (s: string) => String(s||'').trim().toLowerCase();
    if (norm(confirmCompanyName) !== norm(selectedCompany.name)) {
      toast.error('Onay metni şirket adıyla eşleşmiyor');
      return;
    }
    try {
      setDeleteBusy(true);
      const { summary, result } = await secureDeleteCompany({
        companyId: selectedCompany.id,
        adminId: userProfile!.id,
        adminName: userProfile!.ad,
        confirmCompanyName: confirmCompanyName
      });
      toast.success('Şirket ve bağlı veriler silindi');
      setShowSecureDeleteModal(false);
      setSelectedCompany(null);
      loadData();
      // Konsola özet bırak
      console.log('Silme Özeti:', summary);
      console.log('Silme Sonucu:', result);
    } catch (error) {
      console.error('Güvenli silme hatası:', error);
      toast.error('Silme başarısız');
    } finally {
      setDeleteBusy(false);
    }
  };

  // Durum badge'i - Daha detaylı gösterim
  const getStatusBadge = (status: string, daysRemaining: number) => {
    // Eğer gün negatifse veya 0 ise expired olarak göster
    if (daysRemaining <= 0) {
      return (
        <Badge variant="danger">
          ⚠️ Süresi Dolmuş
        </Badge>
      );
    }
    
    switch (status) {
      case 'trial':
        return (
          <Badge variant={daysRemaining > 3 ? 'info' : 'warning'}>
            🎁 Deneme ({daysRemaining} gün)
          </Badge>
        );
      case 'active':
        return (
          <Badge variant={daysRemaining > 7 ? 'success' : 'warning'}>
            ✅ Aktif ({daysRemaining} gün)
          </Badge>
        );
      case 'expired':
        return <Badge variant="danger">❌ Süresi Dolmuş</Badge>;
      case 'lifetime':
        return <Badge variant="success">♾️ Ömür Boyu</Badge>;
      default:
        return <Badge variant="secondary">Bilinmiyor</Badge>;
    }
  };

  // Format para
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Crown className="h-8 w-8 text-yellow-500" />
            SuperAdmin Dashboard
          </h1>
          <p className="text-gray-600 mt-1">SolarVeyo Platform Yönetimi</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={async () => {
              const confirmed = window.confirm('Eski ödeme durumu alanlarını temizlemek istediğinize emin misiniz?');
              if (confirmed) {
                try {
                  const count = await cleanupOdemeDurumuFields();
                  toast.success(`${count} kullanıcı temizlendi!`);
                  loadData();
                } catch (error) {
                  toast.error('Temizlik sırasında hata oluştu');
                }
              }
            }}
            variant="outline"
            className="flex items-center gap-2 bg-orange-50 hover:bg-orange-100 text-orange-700"
          >
            <Wrench className="h-4 w-4" />
            Eski Alanları Temizle
          </Button>
          <Button 
            onClick={loadData}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Activity className="h-4 w-4" />
            Yenile
          </Button>
        </div>
      </div>

      {/* Platform İstatistikleri */}
      {platformStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Toplam Şirket</p>
                  <p className="text-2xl font-bold text-gray-900">{platformStats.totalCompanies}</p>
                </div>
                <Building2 className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Aktif Şirket</p>
                  <p className="text-2xl font-bold text-green-600">{platformStats.activeCompanies}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Aylık Gelir</p>
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(platformStats.monthlyRevenue)}</p>
                </div>
                <DollarSign className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Son 7 Gün Kayıt</p>
                  <p className="text-2xl font-bold text-blue-600">{platformStats.recentSignups}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Şirket Listesi */}
      <Card>
        <CardHeader>
          <CardTitle>Şirketler ({companies.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Yetim Temizlik (Ad ile) */}
          <div className="mb-4 p-3 border rounded bg-yellow-50">
            <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-end">
              <div className="flex-1 w-full">
                <label className="text-sm text-gray-700">Silinmiş şirket adı (admin loglarından ID bulunur)</label>
                <input className="w-full border rounded px-3 py-2 text-sm" placeholder="Örn: ABC ŞİRKETİ" value={orphanCompanyName} onChange={(e)=>setOrphanCompanyName(e.target.value)} />
              </div>
              <Button onClick={handleOrphanCleanup} disabled={orphanBusy || !orphanCompanyName}>{orphanBusy?'Çalışıyor...':'Bul & Temizle'}</Button>
            </div>
            {orphanFoundId && (
              <div className="mt-2 text-xs text-gray-600">Bulunan ID: <span className="font-mono">{orphanFoundId}</span></div>
            )}
          </div>
          <div className="space-y-4">
            {companies.map((company) => (
              <div 
                key={company.id}
                className="border rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg">{company.name}</h3>
                      {getStatusBadge(company.subscriptionStatus, company.daysRemaining)}
                      {!company.isActive && (
                        <Badge variant="danger">Pasif</Badge>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-sm text-gray-600">
                      <div>Plan: <span className="font-medium">{company.planDisplayName}</span></div>
                      <div>Fiyat: <span className="font-medium">{formatCurrency(company.subscriptionPrice)}</span></div>
                      <div>Kullanıcı: <span className="font-medium">{company.userCount}</span></div>
                      <div>Saha: <span className="font-medium">{company.sahaCount}</span></div>
                      <div>Santral: <span className="font-medium">{company.santralCount}</span></div>
                      <div>Arıza: <span className="font-medium text-red-600">{company.arizaCount}</span></div>
                    </div>
                    
                    <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-gray-500">
                      <div>Bu ay arıza: <span className="font-medium">{company.monthlyStats.arizalar}</span></div>
                      <div>Bu ay bakım: <span className="font-medium">{company.monthlyStats.bakimlar}</span></div>
                      <div>Depolama: <span className="font-medium">{company.storageUsed.toFixed(2)}MB / {company.storageLimit}MB</span></div>
                      <div>Toplam bakım: <span className="font-medium">{company.bakimCount}</span></div>
                    </div>
                    
                    <div className="mt-2 text-xs text-gray-500">
                      Kayıt: {company.createdAt.toLocaleDateString('tr-TR')}
                      {company.email && ` • ${company.email}`}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    <Button 
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        setSelectedCompany(company);
                        setShowCompanyDetailModal(true);
                      }}
                    >
                      Detaylar
                    </Button>
                    
                    <Button 
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedCompany(company);
                        setNewPlanId(company.subscriptionPlan);
                        setShowSubscriptionModal(true);
                      }}
                    >
                      Plan Değiştir
                    </Button>
                    
                    <Button 
                      size="sm"
                      variant={company.isActive ? 'outline' : 'primary'}
                      onClick={() => handleToggleCompany(company)}
                    >
                      {company.isActive ? 'Pasifleştir' : 'Aktifleştir'}
                    </Button>
                    
                    <Button 
                      size="sm"
                      variant="danger"
                      onClick={() => handleDeleteCompany(company)}
                    >
                      Güvenli Sil
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Activity Logs */}
      <Card>
        <CardHeader>
          <CardTitle>Son Aktiviteler</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {activityLogs.map((log) => (
              <div key={log.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div>
                  <p className="font-medium">{log.details}</p>
                  <p className="text-sm text-gray-600">
                    {log.adminName} • {log.targetCompanyName || 'Platform'}
                  </p>
                </div>
                <span className="text-xs text-gray-500">
                  {log.timestamp.toLocaleDateString('tr-TR')} {log.timestamp.toLocaleTimeString('tr-TR')}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Abonelik Değiştirme Modal */}
      <Modal 
        isOpen={showSubscriptionModal} 
        onClose={() => setShowSubscriptionModal(false)}
        title="Abonelik Planı Değiştir"
      >
        {selectedCompany && (
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold">{selectedCompany.name}</h3>
              <div className="flex items-center gap-3 mt-1">
                <p className="text-sm text-gray-600">Mevcut plan: {selectedCompany.planDisplayName}</p>
                {getStatusBadge(selectedCompany.subscriptionStatus, selectedCompany.daysRemaining)}
              </div>
            </div>
            
            {/* Uyarı mesajı - deneme süresi dolmuş kullanıcılar için */}
            {selectedCompany.daysRemaining <= 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-700">
                  ⚠️ Bu şirketin abonelik süresi dolmuş. Yeni plan atayarak aktif hale getirebilirsiniz.
                </p>
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium mb-2">Yeni Plan</label>
              <Select
                value={newPlanId}
                onChange={(e) => setNewPlanId(e.target.value)}
                options={[
                  { value: '', label: 'Plan Seçin...' },
                  ...Object.values(plans)
                    .filter((p: any) => p.id !== 'trial')
                    .map((plan: any) => ({
                      value: plan.id,
                      label: `${plan.displayName} - ${formatCurrency(plan.price)}/ay`
                    }))
                ]}
              />
            </div>
            
            {/* Plan seçildiğinde bilgi göster */}
            {newPlanId && newPlanId !== selectedCompany.subscriptionPlan && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-700">
                  ✅ Plan değiştirildiğinde:
                  <ul className="mt-1 ml-4 list-disc">
                    <li>Abonelik durumu "Aktif" olacak</li>
                    <li>1 aylık süre tanımlanacak</li>
                    <li>Deneme süresi bilgileri temizlenecek</li>
                  </ul>
                </p>
              </div>
            )}
            
            <div className="flex justify-end gap-2 pt-4">
              <Button 
                variant="outline" 
                onClick={() => setShowSubscriptionModal(false)}
              >
                İptal
              </Button>
              <Button 
                onClick={handleUpdateSubscription}
                disabled={!newPlanId || newPlanId === selectedCompany.subscriptionPlan}
              >
                Güncelle
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Şirket Detay Modalı */}
      <Modal 
        isOpen={showCompanyDetailModal} 
        onClose={() => setShowCompanyDetailModal(false)}
        title="Şirket Detayları"
      >
        {selectedCompany && (
          <div className="space-y-6">
            {/* Genel Bilgiler */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                {selectedCompany.name}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>Email: <span className="font-medium">{selectedCompany.email}</span></div>
                <div>Telefon: <span className="font-medium">{selectedCompany.phone || 'Belirtilmemiş'}</span></div>
                <div>Kayıt Tarihi: <span className="font-medium">{selectedCompany.createdAt.toLocaleDateString('tr-TR')}</span></div>
                <div>Durum: {getStatusBadge(selectedCompany.subscriptionStatus, selectedCompany.daysRemaining)}</div>
              </div>
            </div>

            {/* Bu Ay İstatistikleri */}
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Bu Ay İstatistikleri
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-red-50 p-3 rounded-lg text-center">
                  <div className="text-2xl font-bold text-red-600">{selectedCompany.monthlyStats.arizalar}</div>
                  <div className="text-sm text-red-700">Yeni Arıza</div>
                </div>
                <div className="bg-blue-50 p-3 rounded-lg text-center">
                  <div className="text-2xl font-bold text-blue-600">{selectedCompany.monthlyStats.bakimlar}</div>
                  <div className="text-sm text-blue-700">Yapılan Bakım</div>
                </div>
                <div className="bg-green-50 p-3 rounded-lg text-center">
                  <div className="text-2xl font-bold text-green-600">{selectedCompany.monthlyStats.yeniKullanicilar}</div>
                  <div className="text-sm text-green-700">Aktif Kullanıcı</div>
                </div>
              </div>
            </div>

            {/* Genel İstatistikler */}
            <div>
              <h4 className="font-semibold mb-3">Genel İstatistikler</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white border rounded-lg p-3 text-center">
                  <div className="text-xl font-bold text-gray-900">{selectedCompany.arizaCount}</div>
                  <div className="text-sm text-gray-600 flex items-center justify-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    Toplam Arıza
                  </div>
                </div>
                <div className="bg-white border rounded-lg p-3 text-center">
                  <div className="text-xl font-bold text-gray-900">{selectedCompany.bakimCount}</div>
                  <div className="text-sm text-gray-600 flex items-center justify-center gap-1">
                    <Wrench className="h-3 w-3" />
                    Toplam Bakım
                  </div>
                </div>
                <div className="bg-white border rounded-lg p-3 text-center">
                  <div className="text-xl font-bold text-gray-900">{selectedCompany.sahaCount}</div>
                  <div className="text-sm text-gray-600 flex items-center justify-center gap-1">
                    <Building2 className="h-3 w-3" />
                    Saha Sayısı
                  </div>
                </div>
                <div className="bg-white border rounded-lg p-3 text-center">
                  <div className="text-xl font-bold text-gray-900">{selectedCompany.santralCount}</div>
                  <div className="text-sm text-gray-600 flex items-center justify-center gap-1">
                    <Zap className="h-3 w-3" />
                    Santral Sayısı
                  </div>
                </div>
              </div>
            </div>

            {/* Kullanıcı Listesi */}
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Users className="h-4 w-4" />
                Kullanıcılar ({selectedCompany.users.length})
              </h4>
              <div className="max-h-40 overflow-y-auto space-y-2">
                {selectedCompany.users.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div>
                      <span className="font-medium">{user.ad}</span>
                      <span className="text-sm text-gray-600 ml-2">({user.rol})</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {user.email}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Saha Listesi */}
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Sahalar ({selectedCompany.sahalar.length})
              </h4>
              <div className="max-h-40 overflow-y-auto space-y-2">
                {selectedCompany.sahalar.map((saha) => (
                  <div key={saha.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div>
                      <span className="font-medium">{saha.ad}</span>
                      <span className="text-sm text-gray-600 ml-2">({saha.musteriAdi})</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {saha.santralSayisi} santral
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button 
                variant="outline" 
                onClick={() => setShowCompanyDetailModal(false)}
              >
                Kapat
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Güvenli Silme Modalı */}
      <Modal
        isOpen={showSecureDeleteModal}
        onClose={() => setShowSecureDeleteModal(false)}
        title="Şirketi Güvenli Sil"
      >
        {selectedCompany && (
          <div className="space-y-4">
            <div className="text-sm text-gray-700">
              Lütfen onay için şirket adını aynen yazın: <span className="font-semibold">{selectedCompany.name}</span>
            </div>
            <input
              className="w-full border rounded px-3 py-2 text-sm"
              placeholder={selectedCompany.name}
              value={confirmCompanyName}
              onChange={(e)=>setConfirmCompanyName(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={()=>setShowSecureDeleteModal(false)}>İptal</Button>
              <Button onClick={handleSecureDelete} disabled={deleteBusy || !confirmCompanyName}>
                {deleteBusy ? 'Siliniyor...' : 'Kalıcı Olarak Sil'}
              </Button>
            </div>
            <div className="text-xs text-red-600">
              Bu işlem geri alınamaz. Tüm şirket verileri (kullanıcılar, arızalar, bakımlar, bildirimler, storage yedekleri vb.) silinecek.
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default SuperAdminDashboard;