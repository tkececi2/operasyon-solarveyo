import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { notificationService } from '../../services/notificationService';
import toast from 'react-hot-toast';

export default function TestNotifications() {
  const { user, userProfile } = useAuth();
  const [loading, setLoading] = useState(false);

  const sendTestNotification = async () => {
    if (!user?.uid || !userProfile?.companyId) {
      toast.error('Kullanıcı bilgileri eksik!');
      return;
    }

    setLoading(true);
    try {
      await notificationService.createScopedNotificationClient({
        companyId: userProfile.companyId,
        title: '🧪 Firebase FCM Test',
        message: 'Firebase push notification test - Çalışıyor!',
        type: 'info',
        actionUrl: '/test/notifications',
        metadata: {
          testId: `test_${Date.now()}`
        },
        roles: [userProfile.rol]
      });
      
      toast.success('✅ Test bildirimi gönderildi!');
      console.log('📱 Firebase test bildirimi - Uygulamayı arka plana alın!');
    } catch (error) {
      console.error('Test bildirimi hatası:', error);
      toast.error('❌ Test bildirimi gönderilemedi!');
    } finally {
      setLoading(false);
    }
  };

  const sendFaultNotification = async () => {
    if (!userProfile?.companyId) {
      toast.error('Company bilgisi eksik!');
      return;
    }

    setLoading(true);
    try {
      await notificationService.createScopedNotificationClient({
        companyId: userProfile.companyId,
        title: '🚨 TEST ARIZA - Push Bildirimi',
        message: 'Test amaçlı arıza bildirimi. Lütfen dikkate almayın.',
        type: 'error',
        actionUrl: '/arizalar',
        metadata: {
          testId: `fault_test_${Date.now()}`,
          sahaId: 'test-saha'
        },
        roles: ['yonetici', 'muhendis', 'tekniker', 'bekci', 'musteri']
      });
      
      toast.success('✅ Test arıza bildirimi gönderildi!');
    } catch (error) {
      console.error('Test arıza bildirimi hatası:', error);
      toast.error('❌ Test arıza bildirimi gönderilemedi!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h1 className="text-2xl font-bold mb-6 text-gray-900">🔔 Bildirim Test Merkezi</h1>
        
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                ℹ️ Push Notification Sistemi
              </h3>
              <p className="text-sm text-blue-700 mt-1">
                FCM Token sistemi yeniden yapılacak. Şu an sadece uygulama içi bildirimler çalışıyor.
              </p>
            </div>
          </div>
        </div>

        {/* Test Bildirimleri */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold mb-4">🧪 Test Bildirimleri</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={sendTestNotification}
              disabled={loading}
              className="bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '⏳ Gönderiliyor...' : '📤 Basit Test Bildirimi'}
            </button>

            <button
              onClick={sendFaultNotification}
              disabled={loading}
              className="bg-red-600 text-white py-3 px-6 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '⏳ Gönderiliyor...' : '🚨 Test Arıza Bildirimi'}
            </button>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg mt-6">
            <h3 className="font-medium text-gray-800 mb-2">📋 Test Nasıl Yapılır:</h3>
            <ol className="list-decimal list-inside text-sm text-gray-600 space-y-1">
              <li>Test bildirimi butonuna tıklayın</li>
              <li>Firebase Functions sistemi bildirimi işleyecek</li>
              <li>Uygulama içinde bildirim göreceksiniz (NotificationContext)</li>
              <li><strong>Push bildirimi için FCM token sistemi gerekli (henüz yok)</strong></li>
            </ol>
          </div>
        </div>
      </div>

      {/* Sistem Durumu */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">⚙️ Sistem Durumu</h2>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
            <span className="text-green-800">✅ Uygulama içi bildirimler</span>
            <span className="text-green-600 font-medium">Çalışıyor</span>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
            <span className="text-yellow-800">⚠️ FCM Push bildirimleri</span>
            <span className="text-yellow-600 font-medium">Yeniden yapılacak</span>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-gray-800">📱 Platform</span>
            <span className="text-gray-600 font-medium">
              {navigator.userAgent.includes('iPhone') ? 'iOS Safari' : 'Web'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}