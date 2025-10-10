import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useOneSignal } from '../../hooks/useOneSignal';
import OneSignalService from '../../services/oneSignalService';
import toast from 'react-hot-toast';

export default function TestNotifications() {
  const { user, userProfile } = useAuth();
  const { initialized, permission, playerId, tags, sendTestNotification, getUserInfo } = useOneSignal();
  const [loading, setLoading] = useState(false);
  const [oneSignalInfo, setOneSignalInfo] = useState<any>(null);

  useEffect(() => {
    loadOneSignalInfo();
  }, [initialized]);

  const loadOneSignalInfo = async () => {
    if (initialized) {
      const info = await getUserInfo();
      setOneSignalInfo(info);
    }
  };

  const testBasicNotification = async () => {
    if (!userProfile?.companyId) {
      toast.error('Kullanıcı bilgileri eksik!');
      return;
    }

    setLoading(true);
    try {
      const success = await sendTestNotification();
      
      if (success) {
        toast.success('✅ OneSignal test bildirimi gönderildi!');
        console.log('📱 Test bildirim gönderildi - Uygulamayı arka plana alın!');
      } else {
        toast.error('❌ OneSignal test bildirimi başarısız!');
      }
    } catch (error) {
      console.error('Test bildirimi hatası:', error);
      toast.error('❌ Test bildirimi gönderilemedi!');
    } finally {
      setLoading(false);
    }
  };

  const testArızaBildirimi = async () => {
    if (!userProfile?.companyId) {
      toast.error('Kullanıcı bilgileri eksik!');
      return;
    }

    setLoading(true);
    try {
      const success = await OneSignalService.sendCompanyNotification({
        companyId: userProfile.companyId,
        title: '🚨 TEST ARIZA',
        message: 'OneSignal test arıza bildirimi - Gerçek arıza değil!',
        type: 'error',
        actionUrl: '/arizalar',
        roles: ['yonetici', 'muhendis', 'tekniker', 'bekci', 'musteri'],
        metadata: { testType: 'fault' }
      });
      
      if (success) {
        toast.success('✅ OneSignal arıza bildirimi gönderildi!');
      } else {
        toast.error('❌ OneSignal arıza bildirimi başarısız!');
      }
    } catch (error) {
      console.error('Arıza bildirimi hatası:', error);
      toast.error('❌ Arıza bildirimi gönderilemedi!');
    } finally {
      setLoading(false);
    }
  };

  const testBakımBildirimi = async () => {
    if (!userProfile?.companyId) {
      toast.error('Kullanıcı bilgileri eksik!');
      return;
    }

    setLoading(true);
    try {
      const success = await OneSignalService.sendCompanyNotification({
        companyId: userProfile.companyId,
        title: '⚡ TEST ELEKTRİK BAKIM',
        message: 'OneSignal test elektrik bakım bildirimi tamamlandı!',
        type: 'success',
        actionUrl: '/bakim/elektrik',
        roles: ['yonetici', 'muhendis', 'tekniker', 'bekci', 'musteri'],
        metadata: { testType: 'maintenance' }
      });
      
      if (success) {
        toast.success('✅ OneSignal bakım bildirimi gönderildi!');
      } else {
        toast.error('❌ OneSignal bakım bildirimi başarısız!');
      }
    } catch (error) {
      console.error('Bakım bildirimi hatası:', error);
      toast.error('❌ Bakım bildirimi gönderilemedi!');
    } finally {
      setLoading(false);
    }
  };

  const testStokUyarısı = async () => {
    if (!userProfile?.companyId) {
      toast.error('Kullanıcı bilgileri eksik!');
      return;
    }

    setLoading(true);
    try {
      const success = await OneSignalService.sendCompanyNotification({
        companyId: userProfile.companyId,
        title: '📦 TEST STOK UYARISI',
        message: 'OneSignal test stok uyarısı - Kritik seviye!',
        type: 'warning',
        actionUrl: '/stok',
        roles: ['yonetici', 'muhendis', 'tekniker'],
        metadata: { testType: 'stock' }
      });
      
      if (success) {
        toast.success('✅ OneSignal stok uyarısı gönderildi!');
      } else {
        toast.error('❌ OneSignal stok uyarısı başarısız!');
      }
    } catch (error) {
      console.error('Stok uyarısı hatası:', error);
      toast.error('❌ Stok uyarısı gönderilemedi!');
    } finally {
      setLoading(false);
    }
  };

  const refreshUserInfo = async () => {
    setLoading(true);
    try {
      if (userProfile) {
        await OneSignalService.setUserTags({
          companyId: userProfile.companyId,
          companyName: userProfile.companyName || userProfile.companyId,
          role: userProfile.rol,
          userId: user?.uid || '',
          sahalar: userProfile.sahalar as string[],
          santraller: userProfile.santraller as string[],
          email: userProfile.email,
          name: userProfile.ad
        });
        
        await loadOneSignalInfo();
        toast.success('✅ OneSignal kullanıcı bilgileri yenilendi!');
      }
    } catch (error) {
      console.error('User info yenileme hatası:', error);
      toast.error('❌ Kullanıcı bilgileri yenilenemedi!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 flex items-center">
          🚀 OneSignal Test Merkezi
          <span className="ml-3 text-sm bg-green-100 text-green-800 px-3 py-1 rounded-full">
            {initialized ? '✅ Aktif' : '❌ Başlatılamadı'}
          </span>
        </h1>

        {/* OneSignal Durum Bilgileri */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">🔔 OneSignal Durum</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Initialization:</label>
              <span className={`px-2 py-1 rounded text-sm ${initialized ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {initialized ? '✅ Başarılı' : '❌ Başarısız'}
              </span>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Permission:</label>
              <span className={`px-2 py-1 rounded text-sm ${permission === 'granted' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                {permission || 'Bilinmiyor'}
              </span>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Player ID:</label>
              <div className="bg-gray-100 rounded px-2 py-1 font-mono text-sm break-all">
                {playerId ? playerId.substring(0, 20) + '...' : 'Yok'}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company:</label>
              <span className="text-sm text-gray-900">
                {tags?.companyId || userProfile?.companyId || 'Belirtilmemiş'}
              </span>
            </div>
          </div>

          <button
            onClick={refreshUserInfo}
            disabled={loading || !initialized}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? '⏳ Yenileniyor...' : '🔄 Bilgileri Yenile'}
          </button>
        </div>

        {/* OneSignal Tags (Debug) */}
        {tags && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">🏷️ OneSignal Tags</h2>
            <pre className="bg-gray-100 rounded-lg p-4 text-sm overflow-auto">
              {JSON.stringify(tags, null, 2)}
            </pre>
          </div>
        )}

        {/* Test Bildirimleri */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">🧪 OneSignal Test Bildirimleri</h2>
          
          <div className="space-y-4">
            <button
              onClick={testBasicNotification}
              disabled={loading || !initialized || !userProfile?.companyId}
              className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '⏳ Gönderiliyor...' : '📤 Temel OneSignal Test'}
            </button>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-gray-800 mb-3">🎯 SAAS Test Bildirimleri</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <button
                  onClick={testArızaBildirimi}
                  disabled={loading || !initialized}
                  className="bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? '⏳' : '🚨'} Arıza Test
                </button>

                <button
                  onClick={testBakımBildirimi}
                  disabled={loading || !initialized}
                  className="bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? '⏳' : '⚡'} Bakım Test
                </button>

                <button
                  onClick={testStokUyarısı}
                  disabled={loading || !initialized}
                  className="bg-orange-600 text-white py-3 rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? '⏳' : '📦'} Stok Test
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bilgi Kutusu */}
        <div className="bg-green-50 border-l-4 border-green-400 p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">🎉 OneSignal Migration Başarılı!</h3>
              <div className="mt-2 text-sm text-green-700">
                <ul className="list-disc list-inside space-y-1">
                  <li><strong>Basit Sistem:</strong> Firebase FCM karmaşıklığı kaldırıldı</li>
                  <li><strong>Multi-Tenant:</strong> Company bazlı izolasyon otomatik</li>
                  <li><strong>Güvenilir:</strong> %99 delivery rate</li>
                  <li><strong>Kolay Debug:</strong> Visual dashboard mevcut</li>
                </ul>
                
                <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
                  <p className="font-medium">⚠️ Setup gerekiyor:</p>
                  <p className="mt-1">
                    1. <strong>OneSignal hesabı açın:</strong> https://onesignal.com<br/>
                    2. <strong>App oluşturun:</strong> "Solarveyo Arıza Takip"<br/>
                    3. <strong>Keys'leri</strong> oneSignalService.ts'e ekleyin
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}