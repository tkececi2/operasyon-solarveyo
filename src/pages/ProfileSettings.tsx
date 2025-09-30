import React, { useState, useEffect } from 'react';
import { 
  User, 
  Mail, 
  Phone, 
  Lock, 
  Camera, 
  Save, 
  X,
  Shield,
  AlertCircle,
  Check,
  Upload,
  Trash2,
  Eye,
  EyeOff
} from 'lucide-react';
import { Card, CardHeader, CardContent, Alert, AlertDescription, Badge } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { 
  updateProfile, 
  uploadProfilePhoto, 
  removeProfilePhoto,
  updateUserPassword,
  updateUserEmail,
  getUserProfile
} from '@/services/profileService';
import { User as UserType } from '@/types';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

const ProfileSettings: React.FC = () => {
  const { currentUser, userProfile: authUserProfile } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [userProfile, setUserProfile] = useState<UserType | null>(null);
  const [profileData, setProfileData] = useState({
    ad: '',
    telefon: ''
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [emailData, setEmailData] = useState({
    currentPassword: '',
    newEmail: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>('');

  useEffect(() => {
    if (currentUser) {
      loadUserProfile();
    }
  }, [currentUser]);

  const loadUserProfile = async () => {
    try {
      if (!currentUser?.uid) return;
      
      // Auth UID kullanarak profili getir
      const profile = await getUserProfile(currentUser.uid);
      if (profile) {
        setUserProfile(profile);
        setProfileData({
          ad: profile.ad || '',
          telefon: profile.telefon || ''
        });
        setPhotoPreview(profile.fotoURL || '');
      }
    } catch (error) {
      console.error('Profil yükleme hatası:', error);
    }
  };

  const handleProfileUpdate = async () => {
    try {
      setLoading(true);
      
      if (!currentUser?.uid) {
        throw new Error('Kullanıcı bilgisi bulunamadı');
      }

      await updateProfile(currentUser.uid, profileData);
      
      toast.success('Profil bilgileri güncellendi');
      loadUserProfile();
    } catch (error: any) {
      toast.error(error.message || 'Profil güncellenemedi');
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = async () => {
    try {
      if (!profilePhoto || !currentUser?.uid) return;
      
      setLoading(true);
      const photoURL = await uploadProfilePhoto(currentUser.uid, profilePhoto);
      
      setPhotoPreview(photoURL);
      setProfilePhoto(null);
      toast.success('Profil fotoğrafı güncellendi');
      loadUserProfile();
    } catch (error: any) {
      toast.error(error.message || 'Fotoğraf yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoRemove = async () => {
    try {
      if (!currentUser?.uid) return;
      
      setLoading(true);
      await removeProfilePhoto(currentUser.uid);
      
      setPhotoPreview('');
      toast.success('Profil fotoğrafı kaldırıldı');
      loadUserProfile();
    } catch (error: any) {
      toast.error(error.message || 'Fotoğraf kaldırılamadı');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordUpdate = async () => {
    try {
      if (!currentUser) {
        throw new Error('Kullanıcı oturumu bulunamadı');
      }

      if (passwordData.newPassword !== passwordData.confirmPassword) {
        throw new Error('Yeni şifreler eşleşmiyor');
      }

      if (passwordData.newPassword.length < 6) {
        throw new Error('Yeni şifre en az 6 karakter olmalıdır');
      }

      setLoading(true);
      await updateUserPassword(currentUser, {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });

      toast.success('Şifre başarıyla güncellendi');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error: any) {
      toast.error(error.message || 'Şifre güncellenemedi');
      // Mevcut şifre yanlışsa, sadece o alanı temizle
      if (error.message.includes('Mevcut şifre yanlış')) {
        setPasswordData({
          ...passwordData,
          currentPassword: ''
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEmailUpdate = async () => {
    try {
      if (!currentUser) {
        throw new Error('Kullanıcı oturumu bulunamadı');
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(emailData.newEmail)) {
        throw new Error('Geçerli bir email adresi giriniz');
      }

      setLoading(true);
      await updateUserEmail(currentUser, emailData);

      toast.success('Email adresi güncellendi. Lütfen yeni adresinizi doğrulayın.');
      setEmailData({
        currentPassword: '',
        newEmail: ''
      });
    } catch (error: any) {
      toast.error(error.message || 'Email güncellenemedi');
      // Şifre yanlışsa, sadece şifre alanını temizle
      if (error.message.includes('Şifre yanlış')) {
        setEmailData({
          ...emailData,
          currentPassword: ''
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Dosya boyutu 5MB\'dan büyük olamaz');
        return;
      }

      setProfilePhoto(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setPhotoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const getRoleBadgeColor = (rol: string) => {
    const colors = {
      superadmin: 'bg-purple-500',
      yonetici: 'bg-blue-500',
      muhendis: 'bg-green-500',
      tekniker: 'bg-yellow-500',
      musteri: 'bg-gray-500',
      bekci: 'bg-orange-500'
    };
    return colors[rol as keyof typeof colors] || 'bg-gray-500';
  };

  const getRoleName = (rol: string) => {
    const names = {
      superadmin: 'Süper Admin',
      yonetici: 'Yönetici',
      muhendis: 'Mühendis',
      tekniker: 'Tekniker',
      musteri: 'Müşteri',
      bekci: 'Bekçi'
    };
    return names[rol as keyof typeof names] || rol;
  };

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
          Profil Ayarları
        </h1>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-2">
          Profil bilgilerinizi ve güvenlik ayarlarınızı yönetin
        </p>
      </div>

      {/* Profil Özeti */}
      <Card className="mb-4 sm:mb-6">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
            <div className="relative">
              {photoPreview ? (
                <img
                  src={photoPreview}
                  alt="Profil"
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-4 border-white shadow-lg"
                />
              ) : (
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl sm:text-3xl font-bold shadow-lg">
                  {userProfile?.ad?.[0]?.toUpperCase() || 'U'}
                </div>
              )}
              <Badge className={`absolute -bottom-2 left-1/2 transform -translate-x-1/2 text-xs ${getRoleBadgeColor(userProfile?.rol || '')}`}>
                {getRoleName(userProfile?.rol || '')}
              </Badge>
            </div>
            
            <div className="flex-1 text-center sm:text-left">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
                {userProfile?.ad || 'İsimsiz Kullanıcı'}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 flex items-center justify-center sm:justify-start gap-2 mt-1 text-sm">
                <Mail className="h-4 w-4" />
                <span className="break-all">{userProfile?.email}</span>
              </p>
              {userProfile?.telefon && (
                <p className="text-gray-600 dark:text-gray-400 flex items-center justify-center sm:justify-start gap-2 mt-1 text-sm">
                  <Phone className="h-4 w-4" />
                  {userProfile.telefon}
                </p>
              )}
            </div>

            <div className="text-center sm:text-right">
              {userProfile?.emailVerified ? (
                <Badge className="bg-green-500 text-white text-xs">
                  <Check className="h-3 w-3 mr-1" />
                  <span className="hidden sm:inline">Email Doğrulandı</span>
                  <span className="sm:hidden">Doğrulandı</span>
                </Badge>
              ) : (
                <Badge variant="warning" className="text-orange-500 text-xs">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  <span className="hidden sm:inline">Email Doğrulanmadı</span>
                  <span className="sm:hidden">Doğrulanmadı</span>
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tab Menu */}
      <div className="flex gap-2 sm:gap-4 mb-4 sm:mb-6 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
        <button
          onClick={() => setActiveTab('profile')}
          className={`pb-3 px-2 sm:px-4 font-medium transition-colors whitespace-nowrap text-sm sm:text-base ${
            activeTab === 'profile'
              ? 'text-blue-500 border-b-2 border-blue-500'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
          }`}
        >
          <User className="h-4 w-4 inline mr-1 sm:mr-2" />
          <span className="hidden sm:inline">Profil Bilgileri</span>
          <span className="sm:hidden">Profil</span>
        </button>
        <button
          onClick={() => setActiveTab('security')}
          className={`pb-3 px-2 sm:px-4 font-medium transition-colors whitespace-nowrap text-sm sm:text-base ${
            activeTab === 'security'
              ? 'text-blue-500 border-b-2 border-blue-500'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
          }`}
        >
          <Shield className="h-4 w-4 inline mr-1 sm:mr-2" />
          Güvenlik
        </button>
        <button
          onClick={() => setActiveTab('photo')}
          className={`pb-3 px-2 sm:px-4 font-medium transition-colors whitespace-nowrap text-sm sm:text-base ${
            activeTab === 'photo'
              ? 'text-blue-500 border-b-2 border-blue-500'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
          }`}
        >
          <Camera className="h-4 w-4 inline mr-1 sm:mr-2" />
          <span className="hidden sm:inline">Profil Fotoğrafı</span>
          <span className="sm:hidden">Fotoğraf</span>
        </button>
      </div>

      {/* Tab İçerikleri */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Profil Bilgileri */}
        {activeTab === 'profile' && (
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Profil Bilgileri</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Temel profil bilgilerinizi güncelleyin
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Ad Soyad
                  </label>
                  <input
                    type="text"
                    value={profileData.ad}
                    onChange={(e) => setProfileData({ ...profileData, ad: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Adınızı ve soyadınızı girin"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Telefon
                  </label>
                  <input
                    type="tel"
                    value={profileData.telefon}
                    onChange={(e) => setProfileData({ ...profileData, telefon: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Telefon numaranızı girin"
                  />
                </div>

                <div className="pt-4">
                  <button
                    onClick={handleProfileUpdate}
                    disabled={loading}
                    className="w-full sm:w-auto bg-blue-500 hover:bg-blue-600 text-white px-4 sm:px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    Bilgileri Güncelle
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Güvenlik */}
        {activeTab === 'security' && (
          <div className="space-y-6">
            {/* Şifre Değiştirme */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  Şifre Değiştir
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Hesabınızın güvenliği için düzenli olarak şifrenizi güncelleyin
                </p>
              </CardHeader>
              <CardContent>
                {/* Bilgi Mesajı */}
                <Alert className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Şifre Kuralları:</strong>
                    <ul className="mt-1 ml-4 text-xs list-disc">
                      <li>En az 6 karakter uzunluğunda olmalı</li>
                      <li>Büyük/küçük harf, rakam ve özel karakter içerebilir</li>
                      <li>Mevcut şifrenizden farklı olmalı</li>
                    </ul>
                  </AlertDescription>
                </Alert>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Mevcut Şifre
                    </label>
                    <div className="relative">
                      <input
                        type={showPasswords.current ? 'text' : 'password'}
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                        className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Mevcut şifrenizi girin"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                        className="absolute right-2 top-2.5 text-gray-500 hover:text-gray-700"
                      >
                        {showPasswords.current ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Yeni Şifre
                    </label>
                    <div className="relative">
                      <input
                        type={showPasswords.new ? 'text' : 'password'}
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                        className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="En az 6 karakter"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                        className="absolute right-2 top-2.5 text-gray-500 hover:text-gray-700"
                      >
                        {showPasswords.new ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                    {passwordData.newPassword && passwordData.newPassword.length < 6 && (
                      <p className="text-xs text-orange-500 mt-1">
                        Şifre en az 6 karakter olmalıdır (şu an: {passwordData.newPassword.length})
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Yeni Şifre (Tekrar)
                    </label>
                    <div className="relative">
                      <input
                        type={showPasswords.confirm ? 'text' : 'password'}
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                        className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Yeni şifrenizi tekrar girin"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                        className="absolute right-2 top-2.5 text-gray-500 hover:text-gray-700"
                      >
                        {showPasswords.confirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>

                  {passwordData.newPassword && passwordData.confirmPassword && 
                   passwordData.newPassword !== passwordData.confirmPassword && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Yeni şifreler eşleşmiyor
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="pt-4">
                    <button
                      onClick={handlePasswordUpdate}
                      disabled={loading || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {loading ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                      ) : (
                        <Lock className="h-4 w-4" />
                      )}
                      Şifreyi Güncelle
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Email Değiştirme */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Email Adresi Değiştir
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Email adresinizi güncelleyin
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Mevcut Email
                    </label>
                    <input
                      type="email"
                      value={userProfile?.email || ''}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Yeni Email
                    </label>
                    <input
                      type="email"
                      value={emailData.newEmail}
                      onChange={(e) => setEmailData({ ...emailData, newEmail: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Yeni email adresinizi girin"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Şifreniz (Doğrulama için)
                    </label>
                    <input
                      type="password"
                      value={emailData.currentPassword}
                      onChange={(e) => setEmailData({ ...emailData, currentPassword: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Şifrenizi girin"
                    />
                  </div>

                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Email adresinizi değiştirdikten sonra yeni adresinize bir doğrulama maili gönderilecektir.
                    </AlertDescription>
                  </Alert>

                  <div className="pt-4">
                    <button
                      onClick={handleEmailUpdate}
                      disabled={loading || !emailData.newEmail || !emailData.currentPassword}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {loading ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                      ) : (
                        <Mail className="h-4 w-4" />
                      )}
                      Email Adresini Güncelle
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Profil Fotoğrafı */}
        {activeTab === 'photo' && (
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Camera className="h-5 w-5" />
                Profil Fotoğrafı
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Profil fotoğrafınızı yükleyin veya değiştirin
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex items-center justify-center">
                  <div className="relative">
                    {photoPreview ? (
                      <img
                        src={photoPreview}
                        alt="Profil"
                        className="w-32 h-32 sm:w-40 sm:h-40 rounded-full object-cover border-4 border-gray-200 shadow-xl"
                      />
                    ) : (
                      <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-4xl sm:text-5xl font-bold shadow-xl">
                        {userProfile?.ad?.[0]?.toUpperCase() || 'U'}
                      </div>
                    )}
                    
                    {photoPreview && userProfile?.fotoURL && (
                      <button
                        onClick={handlePhotoRemove}
                        className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white p-2 rounded-full shadow-lg transition-colors"
                        title="Fotoğrafı Kaldır"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/gif,image/webp"
                      onChange={handleFileSelect}
                      className="hidden"
                      id="photo-upload"
                    />
                    <label
                      htmlFor="photo-upload"
                      className="cursor-pointer"
                    >
                      <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        Fotoğraf yüklemek için tıklayın
                      </p>
                      <p className="text-xs text-gray-500">
                        JPEG, PNG, GIF veya WebP (Maks. 5MB)
                      </p>
                    </label>
                  </div>

                  {profilePhoto && (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        <span className="font-medium">{profilePhoto.name}</span> seçildi. 
                        Yüklemek için aşağıdaki butona tıklayın.
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="flex gap-4">
                    {profilePhoto && (
                      <>
                        <button
                          onClick={handlePhotoUpload}
                          disabled={loading}
                          className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          {loading ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                          ) : (
                            <Upload className="h-4 w-4" />
                          )}
                          Fotoğrafı Yükle
                        </button>
                        <button
                          onClick={() => {
                            setProfilePhoto(null);
                            setPhotoPreview(userProfile?.fotoURL || '');
                          }}
                          className="px-6 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center gap-2"
                        >
                          <X className="h-4 w-4" />
                          İptal
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </motion.div>
    </div>
  );
};

export default ProfileSettings;
