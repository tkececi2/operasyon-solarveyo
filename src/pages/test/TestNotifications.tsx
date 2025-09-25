import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { notificationService } from '../../services/notificationService';
import { Button, Card } from '../../components/ui';
import toast from 'react-hot-toast';

const TestNotifications: React.FC = () => {
  const { userProfile } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead, refreshNotifications } = useNotifications();
  const [loading, setLoading] = useState(false);

  // Test bildirimi oluştur
  const createTestNotification = async (type: 'info' | 'success' | 'warning' | 'error') => {
    if (!userProfile?.companyId) return;
    
    setLoading(true);
    try {
      await notificationService.createNotification({
        companyId: userProfile.companyId,
        userId: userProfile.id,
        title: `Test Bildirimi - ${type.toUpperCase()}`,
        message: `Bu bir ${type} test bildirimidir. Tarih: ${new Date().toLocaleString('tr-TR')}`,
        type,
        actionUrl: '/dashboard',
        metadata: {
          testId: Date.now().toString(),
          createdBy: userProfile.ad
        }
      });
      
      toast.success('Test bildirimi oluşturuldu!');
      await refreshNotifications();
    } catch (error) {
      console.error('Bildirim oluşturma hatası:', error);
      toast.error('Bildirim oluşturulamadı!');
    } finally {
      setLoading(false);
    }
  };

  // Arıza bildirimi test
  const createFaultNotification = async () => {
    if (!userProfile?.companyId) return;
    
    setLoading(true);
    try {
      // Kullanıcının sahası/santralı varsa onları kullan, yoksa test değerleri
      const sahaId = (userProfile.sahalar as string[])?.[0] || 'test-saha-' + Date.now();
      const santralId = (userProfile.santraller as string[])?.[0] || 'test-santral-' + Date.now();
      
      await notificationService.createFaultNotification(
        userProfile.companyId,
        'Test Arızası - Inverter Hatası',
        'kritik',
        'test-fault-' + Date.now(),
        sahaId,
        santralId
      );
      
      toast.success('Arıza bildirimi oluşturuldu!');
      await refreshNotifications();
    } catch (error) {
      console.error('Arıza bildirimi hatası:', error);
      toast.error('Arıza bildirimi oluşturulamadı!');
    } finally {
      setLoading(false);
    }
  };

  // Bakım bildirimi test
  const createMaintenanceNotification = async () => {
    if (!userProfile?.companyId) return;
    
    setLoading(true);
    try {
      const santralId = (userProfile.santraller as string[])?.[0] || 'test-santral-' + Date.now();
      
      await notificationService.createMaintenanceNotification(
        userProfile.companyId,
        'elektrik',
        santralId,
        'test-maintenance-' + Date.now()
      );
      
      toast.success('Bakım bildirimi oluşturuldu!');
      await refreshNotifications();
    } catch (error) {
      console.error('Bakım bildirimi hatası:', error);
      toast.error('Bakım bildirimi oluşturulamadı!');
    } finally {
      setLoading(false);
    }
  };

  // Stok uyarısı test
  const createStockNotification = async () => {
    if (!userProfile?.companyId) return;
    
    setLoading(true);
    try {
      const sahaId = (userProfile.sahalar as string[])?.[0] || 'test-saha-' + Date.now();
      const santralId = (userProfile.santraller as string[])?.[0] || 'test-santral-' + Date.now();
      
      await notificationService.createLowStockNotification(
        userProfile.companyId,
        'DC Kablo (4mm)',
        5,
        20,
        sahaId,
        santralId
      );
      
      toast.success('Stok uyarısı oluşturuldu!');
      await refreshNotifications();
    } catch (error) {
      console.error('Stok uyarısı hatası:', error);
      toast.error('Stok uyarısı oluşturulamadı!');
    } finally {
      setLoading(false);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'error': return '🔴';
      case 'warning': return '⚠️';
      case 'success': return '✅';
      default: return 'ℹ️';
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Bildirim Sistemi Test Sayfası</h1>

      {/* Kullanıcı Bilgileri */}
      <Card className="mb-6">
        <h2 className="text-lg font-semibold mb-4">Kullanıcı Bilgileri</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium">Ad:</span> {userProfile?.ad}
          </div>
          <div>
            <span className="font-medium">Rol:</span> {userProfile?.rol}
          </div>
          <div>
            <span className="font-medium">Şirket ID:</span> {userProfile?.companyId}
          </div>
          <div>
            <span className="font-medium">Okunmamış:</span> {unreadCount} bildirim
          </div>
          {userProfile?.rol === 'musteri' && (
            <>
              <div>
                <span className="font-medium">Sahalar:</span> {(userProfile?.sahalar as string[])?.length || 0} adet
              </div>
              <div>
                <span className="font-medium">Santraller:</span> {(userProfile?.santraller as string[])?.length || 0} adet
              </div>
            </>
          )}
        </div>
      </Card>

      {/* Test Butonları */}
      <Card className="mb-6">
        <h2 className="text-lg font-semibold mb-4">Test Bildirimleri Oluştur</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Button
            onClick={() => createTestNotification('info')}
            disabled={loading}
            variant="outline"
          >
            ℹ️ Info Bildirimi
          </Button>
          <Button
            onClick={() => createTestNotification('success')}
            disabled={loading}
            variant="outline"
            className="border-green-500 text-green-700 hover:bg-green-50"
          >
            ✅ Success Bildirimi
          </Button>
          <Button
            onClick={() => createTestNotification('warning')}
            disabled={loading}
            variant="outline"
            className="border-yellow-500 text-yellow-700 hover:bg-yellow-50"
          >
            ⚠️ Warning Bildirimi
          </Button>
          <Button
            onClick={() => createTestNotification('error')}
            disabled={loading}
            variant="outline"
            className="border-red-500 text-red-700 hover:bg-red-50"
          >
            🔴 Error Bildirimi
          </Button>
        </div>

        <h3 className="text-md font-semibold mt-6 mb-4">Özel Bildirimler</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Button
            onClick={createFaultNotification}
            disabled={loading}
            variant="primary"
          >
            🚨 Arıza Bildirimi
          </Button>
          <Button
            onClick={createMaintenanceNotification}
            disabled={loading}
            variant="primary"
          >
            🔧 Bakım Bildirimi
          </Button>
          <Button
            onClick={createStockNotification}
            disabled={loading}
            variant="primary"
          >
            📦 Stok Uyarısı
          </Button>
        </div>
      </Card>

      {/* Bildirim Listesi */}
      <Card>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Bildirimler ({notifications.length})</h2>
          <div className="space-x-2">
            <Button
              onClick={async () => {
                try {
                  await refreshNotifications();
                  toast.success('Bildirimler yenilendi');
                } catch (error) {
                  toast.error('Bildirimler yenilenemedi');
                }
              }}
              size="sm"
              variant="outline"
            >
              🔄 Yenile
            </Button>
            {unreadCount > 0 && (
              <Button
                onClick={async () => {
                  try {
                    await markAllAsRead();
                    toast.success('Tüm bildirimler okundu işaretlendi');
                  } catch (error) {
                    toast.error('İşlem başarısız');
                  }
                }}
                size="sm"
                variant="outline"
              >
                ✓ Tümünü Okundu İşaretle
              </Button>
            )}
          </div>
        </div>

        <div className="space-y-2 max-h-96 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Henüz bildirim yok
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 rounded-lg border ${
                  !notification.read 
                    ? 'bg-blue-50 border-blue-200' 
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <span className="text-xl">
                      {getNotificationIcon(notification.type)}
                    </span>
                    <div>
                      <h3 className={`font-medium ${!notification.read ? 'text-blue-900' : 'text-gray-900'}`}>
                        {notification.title}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {notification.message}
                      </p>
                      {notification.metadata && (
                        <div className="mt-2 text-xs text-gray-500">
                          <pre>{JSON.stringify(notification.metadata, null, 2)}</pre>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end space-y-2">
                    <span className="text-xs text-gray-500">
                      {notification.createdAt ? 
                        (typeof notification.createdAt.toDate === 'function' ? 
                          notification.createdAt.toDate().toLocaleString('tr-TR') : 
                          new Date(notification.createdAt).toLocaleString('tr-TR')
                        ) : 'Tarih yok'
                      }
                    </span>
                    {!notification.read && (
                      <Button
                        onClick={() => markAsRead(notification.id)}
                        size="sm"
                        variant="outline"
                      >
                        Okundu
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
};

export default TestNotifications;
