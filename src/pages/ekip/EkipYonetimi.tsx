import React, { useState, useEffect } from 'react';
import { Plus, Users, Mail, Phone, MapPin, Shield, Edit, Trash2, UserCheck, Building2, Sun, AlertCircle, X, User } from 'lucide-react';
import { Button, Card, CardContent, CardHeader, CardTitle, Modal, Input, Select, LoadingSpinner, Badge } from '../../components/ui';
import { useAuth } from '../../contexts/AuthContext';
import { useCompany } from '../../contexts/CompanyContext';
import { 
  getAllEkipUyeleri, 
  createEkipUyesi, 
  updateEkipUyesi, 
  deleteEkipUyesi,
  assignSahalarToUser,
  assignSantrallerToUser,
  updateEmailVerificationStatus,
  type EkipUyesi 
} from '../../services/ekipService';
import { getAllSahalar } from '../../services/sahaService';
import { checkUsageLimit } from '../../domain/subscription/service';
import { getAllSantraller } from '../../services/santralService';
import type { UserRole } from '../../types';
import toast from 'react-hot-toast';
import SubscriptionLimitBanner from '../../components/subscription/SubscriptionLimitBanner';
import { trackEvent } from '../../lib/posthog-events';

interface Saha {
  id: string;
  ad: string;
  konum?: {
    adres?: string;
  };
}

interface Santral {
  id: string;
  ad: string;
  sahaId: string;
  sahaAdi?: string;
}

const EkipYonetimi: React.FC = () => {
  const { userProfile, canPerformAction } = useAuth();
  const { company } = useCompany();
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<EkipUyesi | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  // Rol kontrolü - Sadece yönetici ve superadmin erişebilir
  if (userProfile && userProfile.rol !== 'yonetici' && userProfile.rol !== 'superadmin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Yetkisiz Erişim</h1>
          <p className="text-gray-600">Bu sayfaya erişim yetkiniz bulunmamaktadır.</p>
        </div>
      </div>
    );
  }

  // Gerçek veriler
  const [ekipUyeleri, setEkipUyeleri] = useState<EkipUyesi[]>([]);
  const [sahalar, setSahalar] = useState<Saha[]>([]);
  const [santraller, setSantraller] = useState<Santral[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form states
  const [inviteForm, setInviteForm] = useState({
    email: '',
    ad: '',
    telefon: '',
    rol: '' as UserRole | '',
    password: '',
    sahalar: [] as string[],
    santraller: [] as string[]
  });

  const [editForm, setEditForm] = useState({
    ad: '',
    telefon: '',
    rol: '' as UserRole,
    sahalar: [] as string[],
    santraller: [] as string[]
  });

  // Usage limit state
  const [userLimit, setUserLimit] = useState(0);
  const [isUserLimitReached, setIsUserLimitReached] = useState(false);
  const [brokenImages, setBrokenImages] = useState<Set<string>>(new Set());

  // Verileri getir
  const fetchData = async () => {
    if (!company?.id) {
      console.log('Company ID henüz yüklenmedi');
      return;
    }
    
    try {
      setIsLoading(true);
      console.log('Company ID:', company.id);
      
      // Paralel olarak tüm verileri getir
      const [ekipData, sahaData, santralData] = await Promise.all([
        getAllEkipUyeleri(company.id),
        getAllSahalar(company.id),
        getAllSantraller(company.id)
      ]);
      
      setEkipUyeleri(ekipData);
      setSahalar(sahaData);
      setSantraller(santralData);
      
      // Modern SaaS limit kontrolü
      const limitCheck = await checkUsageLimit(company.id, 'users', ekipData.length);
      setUserLimit(limitCheck.limit);
      setIsUserLimitReached(!limitCheck.allowed);
      
      // PostHog event - limit durumu
      if (!limitCheck.allowed) {
        trackEvent.limitReached('user');
      }
    } catch (error) {
      console.error('Veri getirme hatası:', error);
      toast.error('Veriler yüklenirken hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (company?.id) {
      fetchData();
    }
  }, [company?.id]);


  // Yeni üye davet et
  const handleInvite = async () => {
    if (!company?.id) return;
    
    try {
      // Limit kontrolü
      const limitCheck = await checkUsageLimit(company.id, 'users', ekipUyeleri.length);
      if (!limitCheck.allowed) {
        toast.error(`Kullanıcı limiti aşıldı (${ekipUyeleri.length}/${limitCheck.limit}). Planınızı yükseltin veya bir kullanıcı silin.`);
        return;
      }

      if (!inviteForm.email || !inviteForm.ad || !inviteForm.rol || !inviteForm.password) {
        toast.error('Lütfen zorunlu alanları doldurun');
        return;
      }

      const ekipData = {
        email: inviteForm.email,
        ad: inviteForm.ad,
        telefon: inviteForm.telefon,
        rol: inviteForm.rol as UserRole,
        companyId: company.id,
        sahalar: inviteForm.sahalar,
        santraller: inviteForm.santraller,
        emailVerified: false
      };

      await createEkipUyesi(ekipData, inviteForm.password);
      
      toast.success('Ekip üyesi başarıyla eklendi ve davet emaili gönderildi');
      setShowInviteModal(false);
      setInviteForm({
        email: '',
        ad: '',
        telefon: '',
        rol: '',
        password: '',
        sahalar: [],
        santraller: []
      });
      fetchData();
    } catch (error: any) {
      console.error('Davet hatası:', error);
      if (error.code === 'auth/email-already-in-use') {
        toast.error('Bu email adresi zaten kullanımda');
      } else if (error.code === 'auth/weak-password') {
        toast.error('Şifre en az 6 karakter olmalıdır');
      } else {
        toast.error('Ekip üyesi eklenirken hata oluştu');
      }
    }
  };

  // Kullanıcı güncelle
  const handleUpdate = async () => {
    if (!selectedUser) return;
    
    try {
      await updateEkipUyesi(selectedUser.id, {
        ad: editForm.ad,
        telefon: editForm.telefon,
        rol: editForm.rol,
        sahalar: editForm.sahalar,
        santraller: editForm.santraller
      });
      
      toast.success('Kullanıcı bilgileri güncellendi');
      setSelectedUser(null);
      fetchData();
    } catch (error) {
      console.error('Güncelleme hatası:', error);
      toast.error('Güncelleme sırasında hata oluştu');
    }
  };

  // Kullanıcı sil
  const handleDelete = async (userId: string) => {
    if (!window.confirm('Bu kullanıcıyı silmek istediğinize emin misiniz?')) return;
    
    try {
      await deleteEkipUyesi(userId);
      toast.success('Kullanıcı başarıyla silindi');
      fetchData();
    } catch (error) {
      console.error('Silme hatası:', error);
      toast.error('Kullanıcı silinirken hata oluştu');
    }
  };

  // Email doğrula
  const handleVerifyEmail = async (userId: string) => {
    try {
      await updateEmailVerificationStatus(userId, true);
      toast.success('Email doğrulama durumu güncellendi');
      fetchData();
    } catch (error) {
      console.error('Doğrulama hatası:', error);
      toast.error('Email doğrulama sırasında hata oluştu');
    }
  };

  // Sahaya göre santralleri filtrele
  const getSantrallerBySaha = (sahaIds: string[]): Santral[] => {
    return santraller.filter(santral => sahaIds.includes(santral.sahaId));
  };

  // Rol seçenekleri
  const roleOptions = [
    { value: 'all', label: 'Tüm Roller' },
    { value: 'yonetici', label: 'Yönetici' },
    { value: 'muhendis', label: 'Mühendis' },
    { value: 'tekniker', label: 'Tekniker' },
    { value: 'musteri', label: 'Müşteri' },
    { value: 'bekci', label: 'Bekçi' },
  ];

  const getRoleBadge = (rol: UserRole) => {
    const badges: Record<string, string> = {
      'yonetici': 'bg-blue-100 text-blue-800',
      'muhendis': 'bg-green-100 text-green-800',
      'tekniker': 'bg-yellow-100 text-yellow-800',
      'musteri': 'bg-gray-100 text-gray-800',
      'bekci': 'bg-orange-100 text-orange-800',
    };
    return badges[rol] || 'bg-gray-100 text-gray-800';
  };

  const getRoleText = (rol: UserRole) => {
    const texts: Record<string, string> = {
      'yonetici': 'Yönetici',
      'muhendis': 'Mühendis',
      'tekniker': 'Tekniker',
      'musteri': 'Müşteri',
      'bekci': 'Bekçi',
    };
    return texts[rol] || rol;
  };

  // Saha ve santral isimlerini getir
  const getSahaNames = (sahaIds?: string[]): string => {
    if (!sahaIds || sahaIds.length === 0) return 'Atanmamış';
    
    const sahaNames = sahaIds.map(id => {
      const saha = sahalar.find(s => s.id === id);
      return saha?.ad || `Saha #${id}`;
    });
    
    return sahaNames.join(', ');
  };

  const getSantralNames = (santralIds?: string[]): string => {
    if (!santralIds || santralIds.length === 0) return 'Atanmamış';
    
    const santralNames = santralIds.map(id => {
      const santral = santraller.find(s => s.id === id);
      return santral?.ad || `Santral #${id}`;
    });
    
    return santralNames.join(', ');
  };

  // Filtrelenmiş kullanıcılar
  const filteredUsers = ekipUyeleri.filter(user => {
    const matchesSearch = user.ad.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.rol === roleFilter;
    return matchesSearch && matchesRole;
  });

  // Rol istatistikleri
  const roleStats = {
    yonetici: ekipUyeleri.filter(u => u.rol === 'yonetici').length,
    muhendis: ekipUyeleri.filter(u => u.rol === 'muhendis').length,
    tekniker: ekipUyeleri.filter(u => u.rol === 'tekniker').length,
    musteri: ekipUyeleri.filter(u => u.rol === 'musteri').length,
    bekci: ekipUyeleri.filter(u => u.rol === 'bekci').length,
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ekip Yönetimi</h1>
          <p className="text-gray-600">Ekip üyelerini yönetin ve yetkilendirin</p>
        </div>
        {canPerformAction('ekip_ekle') && (
          <Button 
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => {
              if (isUserLimitReached) {
                toast.error(`Kullanıcı limiti aşıldı (${ekipUyeleri.length}/${userLimit}). Lütfen planı yükseltin veya bir kullanıcı silin.`);
              } else {
                setShowInviteModal(true);
              }
            }}
            disabled={isUserLimitReached}
          >
            Yeni Üye Ekle
          </Button>
        )}
      </div>

      <SubscriptionLimitBanner 
        show={isUserLimitReached}
        message={`${ekipUyeleri.length} / ${userLimit} kullanıcı. Yeni kullanıcı eklemek için planınızı yükseltin.`}
      />

      {/* Rol İstatistikleri - 2 sütunlu düzen */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-xl md:text-2xl font-bold text-blue-600">{roleStats.yonetici}</div>
              <div className="text-xs md:text-sm text-gray-600">Yönetici</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-xl md:text-2xl font-bold text-green-600">{roleStats.muhendis}</div>
              <div className="text-xs md:text-sm text-gray-600">Mühendis</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-xl md:text-2xl font-bold text-yellow-600">{roleStats.tekniker}</div>
              <div className="text-xs md:text-sm text-gray-600">Tekniker</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-xl md:text-2xl font-bold text-gray-600">{roleStats.musteri}</div>
              <div className="text-xs md:text-sm text-gray-600">Müşteri</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-xl md:text-2xl font-bold text-orange-600">{roleStats.bekci}</div>
              <div className="text-xs md:text-sm text-gray-600">Bekçi</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Ad veya email ile ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                leftIcon={<Users className="h-4 w-4 text-gray-400" />}
              />
            </div>
            <div className="sm:w-48">
              <Select
                options={roleOptions}
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ekip Üyeleri Listesi */}
      {filteredUsers.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Henüz ekip üyesi yok</h3>
            <p className="text-gray-600 mb-4">Yeni ekip üyeleri ekleyerek başlayın</p>
            <Button 
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={() => setShowInviteModal(true)}
            >
              İlk Üyeyi Ekle
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredUsers.map((user) => (
            <Card key={user.id} className="hover:shadow-lg transition-all duration-200">
              <CardContent className="p-4">
                {/* Başlık ve Rol */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center overflow-hidden">
                      {user.fotoURL && !brokenImages.has(user.id) ? (
                        <img 
                          src={user.fotoURL} 
                          alt={user.ad}
                          className="w-full h-full object-cover"
                          onError={() => {
                            setBrokenImages(prev => new Set(prev).add(user.id));
                          }}
                        />
                      ) : (
                        <User className="h-5 w-5 text-blue-600" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-semibold text-gray-900 truncate">
                        {user.ad}
                      </h3>
                      <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${getRoleBadge(user.rol)}`}>
                        {getRoleText(user.rol)}
                      </span>
                    </div>
                  </div>
                  {!user.emailVerified && (
                    <Button 
                      size="sm" 
                      variant="ghost"
                      className="h-6 px-2 text-xs text-orange-600 hover:bg-orange-50"
                      onClick={() => handleVerifyEmail(user.id)}
                    >
                      <UserCheck className="h-3 w-3 mr-1" />
                      Doğrula
                    </Button>
                  )}
                </div>

                {/* Email ve Telefon */}
                <div className="space-y-1 mb-3">
                  <div className="flex items-center text-xs text-gray-600">
                    <Mail className="h-3 w-3 mr-1.5 flex-shrink-0" />
                    <span className="truncate">{user.email}</span>
                  </div>
                  {user.telefon && (
                    <div className="flex items-center text-xs text-gray-600">
                      <Phone className="h-3 w-3 mr-1.5 flex-shrink-0" />
                      <span>{user.telefon}</span>
                    </div>
                  )}
                </div>

                {/* Sahalar ve Santraller - Sadece sayı */}
                <div className="space-y-1 mb-3">
                  {user.sahalar && user.sahalar.length > 0 && (
                    <div className="flex items-center text-xs text-gray-600">
                      <Building2 className="h-3 w-3 mr-1.5" />
                      <span>{user.sahalar.length} Saha</span>
                    </div>
                  )}
                  {user.santraller && user.santraller.length > 0 && (
                    <div className="flex items-center text-xs text-gray-600">
                      <Sun className="h-3 w-3 mr-1.5" />
                      <span>{user.santraller.length} Santral</span>
                    </div>
                  )}
                </div>

                {/* Ana Yetki Badge'i */}
                <div className="mb-3">
                  {user.rol === 'yonetici' && (
                    <Badge variant="info" className="text-xs py-0.5 px-2">Tam Erişim</Badge>
                  )}
                  {user.rol === 'muhendis' && (
                    <Badge variant="success" className="text-xs py-0.5 px-2">Teknik Analiz</Badge>
                  )}
                  {user.rol === 'tekniker' && (
                    <Badge variant="warning" className="text-xs py-0.5 px-2">Saha Kontrol</Badge>
                  )}
                  {user.rol === 'musteri' && (
                    <Badge variant="secondary" className="text-xs py-0.5 px-2">Görüntüleme</Badge>
                  )}
                  {user.rol === 'bekci' && (
                    <Badge variant="warning" className="text-xs py-0.5 px-2">Vardiya</Badge>
                  )}
                </div>

                {/* İşlem Butonları */}
                <div className="flex items-center justify-between border-t pt-3">
                  <div className="flex space-x-2">
                    {canPerformAction('ekip_duzenle') && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="h-8 px-3 text-xs"
                        onClick={() => {
                          setSelectedUser(user);
                          setEditForm({
                            ad: user.ad,
                            telefon: user.telefon || '',
                            rol: user.rol,
                            sahalar: user.sahalar || [],
                            santraller: user.santraller || []
                          });
                        }}
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Düzenle
                      </Button>
                    )}
                    {canPerformAction('ekip_sil') && userProfile && user.id !== userProfile.id && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="h-8 px-2 text-xs text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                        onClick={() => handleDelete(user.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                  <div className="text-right">
                    {!user.emailVerified && (
                      <span className="text-xs text-red-600 font-medium">Doğrulanmadı</span>
                    )}
                    <div className="text-xs text-gray-400">
                      {(user.sahalar?.length || 0) + (user.santraller?.length || 0)} Atama
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Yeni Üye Ekleme Modal */}
      <Modal
        isOpen={showInviteModal}
        onClose={() => {
          setShowInviteModal(false);
          setInviteForm({
            email: '',
            ad: '',
            telefon: '',
            rol: '',
            password: '',
            sahalar: [],
            santraller: []
          });
        }}
        title="Yeni Ekip Üyesi Ekle"
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Email Adresi"
              type="email"
              placeholder="ornek@email.com"
              value={inviteForm.email}
              onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
              required
            />
            
            <Input
              label="Şifre"
              type="password"
              placeholder="En az 6 karakter"
              value={inviteForm.password}
              onChange={(e) => setInviteForm({ ...inviteForm, password: e.target.value })}
              required
            />
          </div>
          
          <Input
            label="Ad Soyad"
            placeholder="Kullanıcının adı"
            value={inviteForm.ad}
            onChange={(e) => setInviteForm({ ...inviteForm, ad: e.target.value })}
            required
          />

          <Input
            label="Telefon"
            type="tel"
            placeholder="+90 5xx xxx xx xx"
            value={inviteForm.telefon}
            onChange={(e) => setInviteForm({ ...inviteForm, telefon: e.target.value })}
          />

                      <Select
              label="Rol"
              options={[
                { value: 'yonetici', label: 'Yönetici' },
                { value: 'muhendis', label: 'Mühendis' },
                { value: 'tekniker', label: 'Tekniker' },
                { value: 'musteri', label: 'Müşteri' },
                { value: 'bekci', label: 'Bekçi' },
              ]}
              value={inviteForm.rol}
              onChange={(e) => setInviteForm({ ...inviteForm, rol: e.target.value as UserRole })}
              placeholder="Rol seçiniz"
              required
            />
            
            {inviteForm.rol === 'musteri' && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-start">
                  <Users className="h-5 w-5 text-blue-500 mr-2 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium">Müşteri Ekleme</p>
                    <p>Müşteri rolundeki kullanıcılar sadece kendilerine atanan saha ve santralları görebilir.</p>
                    <p className="mt-1 font-medium">Lütfen aşağıdan müşteriye ait saha ve santralları seçin.</p>
                  </div>
                </div>
              </div>
            )}

          {/* Saha Seçimi */}
          {sahalar.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Atanacak Sahalar
              </label>
              <div className="space-y-2 max-h-40 overflow-y-auto border rounded-lg p-3">
                {sahalar.map((saha) => (
                  <label key={saha.id} className="flex items-center">
                    <input 
                      type="checkbox" 
                      className="rounded border-gray-300 mr-2"
                      checked={inviteForm.sahalar.includes(saha.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setInviteForm({ 
                            ...inviteForm, 
                            sahalar: [...inviteForm.sahalar, saha.id] 
                          });
                        } else {
                          setInviteForm({ 
                            ...inviteForm, 
                            sahalar: inviteForm.sahalar.filter(id => id !== saha.id),
                            santraller: inviteForm.santraller.filter(id => {
                              const santral = santraller.find(s => s.id === id);
                              return santral?.sahaId !== saha.id;
                            })
                          });
                        }
                      }}
                    />
                    <span className="text-sm">{saha.ad}</span>
                    {saha.konum?.adres && (
                      <span className="text-xs text-gray-500 ml-2">({saha.konum.adres})</span>
                    )}
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Santral Seçimi - Sadece seçili sahalara ait santraller */}
          {inviteForm.sahalar.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Atanacak Santraller
              </label>
              <div className="space-y-2 max-h-40 overflow-y-auto border rounded-lg p-3">
                {getSantrallerBySaha(inviteForm.sahalar).map((santral) => (
                  <label key={santral.id} className="flex items-center">
                    <input 
                      type="checkbox" 
                      className="rounded border-gray-300 mr-2"
                      checked={inviteForm.santraller.includes(santral.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setInviteForm({ 
                            ...inviteForm, 
                            santraller: [...inviteForm.santraller, santral.id] 
                          });
                        } else {
                          setInviteForm({ 
                            ...inviteForm, 
                            santraller: inviteForm.santraller.filter(id => id !== santral.id) 
                          });
                        }
                      }}
                    />
                    <span className="text-sm">{santral.ad}</span>
                    <span className="text-xs text-gray-500 ml-2">
                      ({sahalar.find(s => s.id === santral.sahaId)?.ad})
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-blue-500 mr-2 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium">Email Doğrulama</p>
                <p>Kullanıcıya email doğrulama linki gönderilecektir. Email doğrulanmadan sisteme giriş yapamaz.</p>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button 
              variant="ghost" 
              onClick={() => {
                setShowInviteModal(false);
                setInviteForm({
                  email: '',
                  ad: '',
                  telefon: '',
                  rol: '',
                  password: '',
                  sahalar: [],
                  santraller: []
                });
              }}
            >
              İptal
            </Button>
            <Button onClick={handleInvite} disabled={isUserLimitReached}>
              Kullanıcı Ekle
            </Button>
          </div>
        </div>
      </Modal>

      {/* Kullanıcı Düzenleme Modal */}
      <Modal
        isOpen={selectedUser !== null}
        onClose={() => setSelectedUser(null)}
        title="Kullanıcı Düzenle"
        size="lg"
      >
        {selectedUser && (
          <div className="space-y-4">
            <Input
              label="Ad Soyad"
              value={editForm.ad}
              onChange={(e) => setEditForm({ ...editForm, ad: e.target.value })}
            />
            
            <Input
              label="Email"
              type="email"
              value={selectedUser.email}
              disabled
              helperText="Email adresi değiştirilemez"
            />

            <Input
              label="Telefon"
              type="tel"
              value={editForm.telefon}
              onChange={(e) => setEditForm({ ...editForm, telefon: e.target.value })}
            />

            <Select
              label="Rol"
              options={[
                { value: 'yonetici', label: 'Yönetici' },
                { value: 'muhendis', label: 'Mühendis' },
                { value: 'tekniker', label: 'Tekniker' },
                { value: 'musteri', label: 'Müşteri' },
                { value: 'bekci', label: 'Bekçi' },
              ]}
              value={editForm.rol}
              onChange={(e) => setEditForm({ ...editForm, rol: e.target.value as UserRole })}
            />

            {/* Saha Seçimi */}
            {sahalar.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Atanacak Sahalar
                </label>
                <div className="space-y-2 max-h-40 overflow-y-auto border rounded-lg p-3">
                  {sahalar.map((saha) => (
                    <label key={saha.id} className="flex items-center">
                      <input 
                        type="checkbox" 
                        className="rounded border-gray-300 mr-2"
                        checked={editForm.sahalar.includes(saha.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setEditForm({ 
                              ...editForm, 
                              sahalar: [...editForm.sahalar, saha.id] 
                            });
                          } else {
                            setEditForm({ 
                              ...editForm, 
                              sahalar: editForm.sahalar.filter(id => id !== saha.id),
                              santraller: editForm.santraller.filter(id => {
                                const santral = santraller.find(s => s.id === id);
                                return santral?.sahaId !== saha.id;
                              })
                            });
                          }
                        }}
                      />
                      <span className="text-sm">{saha.ad}</span>
                      {saha.konum?.adres && (
                        <span className="text-xs text-gray-500 ml-2">({saha.konum.adres})</span>
                      )}
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Santral Seçimi */}
            {editForm.sahalar.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Atanacak Santraller
                </label>
                <div className="space-y-2 max-h-40 overflow-y-auto border rounded-lg p-3">
                  {getSantrallerBySaha(editForm.sahalar).map((santral) => (
                    <label key={santral.id} className="flex items-center">
                      <input 
                        type="checkbox" 
                        className="rounded border-gray-300 mr-2"
                        checked={editForm.santraller.includes(santral.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setEditForm({ 
                              ...editForm, 
                              santraller: [...editForm.santraller, santral.id] 
                            });
                          } else {
                            setEditForm({ 
                              ...editForm, 
                              santraller: editForm.santraller.filter(id => id !== santral.id) 
                            });
                          }
                        }}
                      />
                      <span className="text-sm">{santral.ad}</span>
                      <span className="text-xs text-gray-500 ml-2">
                        ({sahalar.find(s => s.id === santral.sahaId)?.ad})
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-4">
              <Button variant="ghost" onClick={() => setSelectedUser(null)}>
                İptal
              </Button>
              <Button onClick={handleUpdate}>
                Değişiklikleri Kaydet
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default EkipYonetimi;
