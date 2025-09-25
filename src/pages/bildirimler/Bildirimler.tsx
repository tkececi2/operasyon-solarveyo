import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Check, 
  CheckCheck,
  Trash2,
  Filter,
  AlertCircle,
  Info,
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
  ChevronRight,
  X
} from 'lucide-react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  Button,
  LoadingSpinner,
  Badge
} from '../../components/ui';
import { useAuth } from '../../contexts/AuthContext';
import { useCompany } from '../../contexts/CompanyContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { notificationService, Notification } from '../../services/notificationService';
import { formatDateTime, formatRelativeTime } from '../../utils/formatters';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const Bildirimler: React.FC = () => {
  const { userProfile } = useAuth();
  const { company } = useCompany();
  const { notifications, unreadCount, markAsRead, markAllAsRead, refreshNotifications } = useNotifications();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'unread' | 'read'>('all');
  const [selectedType, setSelectedType] = useState<'all' | 'info' | 'success' | 'warning' | 'error'>('all');
  const [selectedNotifications, setSelectedNotifications] = useState<Set<string>>(new Set());
  const [selectMode, setSelectMode] = useState(false);

  useEffect(() => {
    refreshNotifications();
  }, []);

  // Filtrelenmiş bildirimler
  const filteredNotifications = notifications.filter(notif => {
    let matches = true;
    
    // Okunma durumu filtresi
    if (filterType === 'unread') matches = matches && !notif.read;
    if (filterType === 'read') matches = matches && notif.read;
    
    // Tip filtresi
    if (selectedType !== 'all') matches = matches && notif.type === selectedType;
    
    return matches;
  });

  // Bildirim ikonunu getir
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  // Bildirim rengini getir
  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'success':
        return 'bg-green-50 border-green-200';
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  // Bildirimi sil - Her kullanıcı kendi bildirimlerini silebilir
  const handleDelete = async (notificationId: string, notification: Notification) => {
    if (!userProfile) {
      toast.error('Oturum açmanız gerekli');
      return;
    }

    if (!window.confirm('Bu bildirimi gizlemek istediğinizden emin misiniz?\n\nBu işlem sadece sizin için bildirimi gizleyecek, diğer kullanıcılar görmeye devam edecektir.')) {
      return;
    }

    try {
      // Kullanıcı için bildirimi gizle (diğer kullanıcılar görebilir)
      await notificationService.deleteNotification(notificationId, userProfile.id);
      toast.success('Bildirim gizlendi');
      refreshNotifications();
    } catch (error) {
      console.error('Bildirim gizleme hatası:', error);
      toast.error('Bildirim gizlenemedi');
    }
  };

  // Seçili bildirimleri toplu gizle
  const handleBulkHide = async () => {
    if (selectedNotifications.size === 0) {
      toast.error('Lütfen gizlemek istediğiniz bildirimleri seçin');
      return;
    }

    if (!userProfile) {
      toast.error('Oturum açmanız gerekli');
      return;
    }

    if (!window.confirm(`${selectedNotifications.size} bildirimi gizlemek istediğinizden emin misiniz?\n\nBu işlem sadece sizin için bildirimleri gizleyecek.`)) {
      return;
    }

    setLoading(true);
    let successCount = 0;
    let errorCount = 0;

    for (const notificationId of selectedNotifications) {
      try {
        await notificationService.deleteNotification(notificationId, userProfile.id);
        successCount++;
      } catch (error) {
        console.error(`Bildirim gizleme hatası (${notificationId}):`, error);
        errorCount++;
      }
    }

    setLoading(false);
    
    if (successCount > 0) {
      toast.success(`${successCount} bildirim gizlendi`);
      refreshNotifications();
      setSelectedNotifications(new Set());
      setSelectMode(false);
    }
    
    if (errorCount > 0) {
      toast.error(`${errorCount} bildirim gizlenemedi`);
    }
  };

  // Tümünü seç/kaldır
  const handleSelectAll = () => {
    if (selectedNotifications.size === filteredNotifications.length) {
      setSelectedNotifications(new Set());
    } else {
      setSelectedNotifications(new Set(filteredNotifications.map(n => n.id)));
    }
  };

  // Bildirime tıklandığında
  const handleNotificationClick = async (notification: Notification) => {
    // Seçim modundaysa seçimi değiştir
    if (selectMode) {
      const newSelected = new Set(selectedNotifications);
      if (newSelected.has(notification.id)) {
        newSelected.delete(notification.id);
      } else {
        newSelected.add(notification.id);
      }
      setSelectedNotifications(newSelected);
      return;
    }

    // Okunmadıysa okundu olarak işaretle
    if (!notification.read) {
      await markAsRead(notification.id);
    }

    // Eğer actionUrl varsa yönlendir
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bildirimler</h1>
          <p className="text-gray-600">
            {selectMode 
              ? `${selectedNotifications.size} bildirim seçildi` 
              : unreadCount > 0 
                ? `${unreadCount} okunmamış bildirim` 
                : 'Tüm bildirimler okundu'}
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {selectMode ? (
            <>
              <Button 
                onClick={handleSelectAll} 
                variant="outline"
                size="sm"
                className="text-xs sm:text-sm"
              >
                {selectedNotifications.size === filteredNotifications.length ? 'Seçimi Kaldır' : 'Tümünü Seç'}
              </Button>
              
              <Button 
                onClick={handleBulkHide} 
                variant="danger"
                size="sm"
                disabled={selectedNotifications.size === 0}
                className="text-xs sm:text-sm"
              >
                <Trash2 className="h-4 w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Seçilenleri Gizle</span>
                <span className="sm:hidden">Gizle</span> ({selectedNotifications.size})
              </Button>
              
              <Button 
                onClick={() => {
                  setSelectMode(false);
                  setSelectedNotifications(new Set());
                }}
                variant="ghost"
                size="sm"
                className="text-xs sm:text-sm"
              >
                <X className="h-4 w-4 mr-1 sm:mr-2" />
                İptal
              </Button>
            </>
          ) : (
            <>
              {unreadCount > 0 && (
                <Button onClick={markAllAsRead} variant="outline" size="sm" className="text-xs sm:text-sm">
                  <CheckCheck className="h-4 w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Tümünü Okundu İşaretle</span>
                  <span className="sm:hidden">Okundu</span>
                </Button>
              )}
              
              {filteredNotifications.length > 0 && (
                <Button 
                  onClick={() => setSelectMode(true)} 
                  variant="outline"
                  size="sm"
                  className="text-xs sm:text-sm"
                >
                  <Check className="h-4 w-4 mr-1 sm:mr-2" />
                  Seç
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Seçim modu bilgilendirme */}
      {selectMode && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-2">
          <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium">Toplu Gizleme Modu</p>
            <p className="mt-1">Gizlediğiniz bildirimler sadece sizin ekranınızdan kaldırılır. Diğer kullanıcılar bu bildirimleri görmeye devam eder.</p>
          </div>
        </div>
      )}

      {/* Filtreler */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Okunma durumu filtresi */}
            <div className="flex gap-2">
              <button
                onClick={() => setFilterType('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterType === 'all' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Tümü ({notifications.length})
              </button>
              <button
                onClick={() => setFilterType('unread')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterType === 'unread' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Okunmamış ({unreadCount})
              </button>
              <button
                onClick={() => setFilterType('read')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterType === 'read' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Okunmuş ({notifications.length - unreadCount})
              </button>
            </div>

            {/* Tip filtresi */}
            <div className="flex gap-2 ml-auto">
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value as any)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Tüm Tipler</option>
                <option value="info">Bilgi</option>
                <option value="success">Başarı</option>
                <option value="warning">Uyarı</option>
                <option value="error">Hata</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bildirimler Listesi */}
      {filteredNotifications.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Bildirim bulunamadı
            </h3>
            <p className="text-gray-600">
              {filterType === 'unread' 
                ? 'Okunmamış bildiriminiz yok' 
                : 'Henüz bildirim almadınız'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map((notification) => (
            <div
              key={notification.id}
              className={`
                border rounded-lg p-4 transition-all cursor-pointer hover:shadow-md
                ${getNotificationColor(notification.type)}
                ${!notification.read ? 'border-l-4' : ''}
                ${selectMode && selectedNotifications.has(notification.id) ? 'ring-2 ring-blue-500' : ''}
              `}
              onClick={() => handleNotificationClick(notification)}
            >
              <div className="flex items-start gap-3">
                {/* Checkbox (seçim modunda) */}
                {selectMode && (
                  <div 
                    className="flex-shrink-0 mt-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      type="checkbox"
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      checked={selectedNotifications.has(notification.id)}
                      onChange={() => {}}
                    />
                  </div>
                )}
                
                {/* İkon */}
                <div className="flex-shrink-0 mt-1">
                  {getNotificationIcon(notification.type)}
                </div>

                {/* İçerik */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <h4 className={`font-medium text-gray-900 ${!notification.read ? 'font-semibold' : ''}`}>
                        {notification.title}
                      </h4>
                      <p className="text-sm text-gray-600 mt-1">
                        {notification.message}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatRelativeTime(notification.createdAt)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDateTime(notification.createdAt)}
                        </span>
                      </div>
                    </div>

                    {/* İşlemler */}
                    <div className="flex items-center gap-2">
                      {!notification.read && (
                        <Badge variant="primary" size="sm">
                          Yeni
                        </Badge>
                      )}
                      
                      {notification.actionUrl && (
                        <ChevronRight className="h-4 w-4 text-gray-400" />
                      )}
                      
                      {/* Seçim modunda değilse silme butonunu göster */}
                      {!selectMode && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(notification.id, notification);
                          }}
                          className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                          title="Bildirimi gizle (sadece sizin için)"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Bildirimler;
