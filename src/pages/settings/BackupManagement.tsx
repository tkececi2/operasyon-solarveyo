import React, { useState, useEffect } from 'react';
import { 
  Database, 
  Download, 
  Upload, 
  Clock, 
  HardDrive,
  RefreshCw,
  Shield,
  AlertTriangle,
  Check,
  Calendar,
  Trash2
} from 'lucide-react';
import { 
  Button, 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  Badge,
  Table
} from '../../components/ui';
import { useAuth } from '../../contexts/AuthContext';
import { useCompany } from '../../contexts/CompanyContext';
import { 
  createBackup, 
  restoreBackup, 
  getBackups,
  deleteBackup, 
  scheduleBackup,
  exportBackupFile 
} from '../../services/backupService';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';

interface BackupItem {
  id: string;
  timestamp: any;
  documentCount: number;
  sizeBytes: number;
  type: 'manual' | 'automatic' | 'scheduled';
  status: 'completed' | 'failed';
  storageUrl?: string;
}

const BackupManagement: React.FC = () => {
  const { currentUser, userProfile } = useAuth();
  const { company } = useCompany();
  const [backups, setBackups] = useState<BackupItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<string | null>(null);
  const [autoBackupEnabled, setAutoBackupEnabled] = useState(false);
  const [lastBackupTime, setLastBackupTime] = useState<Date | null>(null);

  // Backup listesini yükle
  useEffect(() => {
    if (company?.id) {
      loadBackups();
      checkAutoBackupStatus();
    }
  }, [company]);

  const loadBackups = async () => {
    if (!company?.id) return;
    
    setLoading(true);
    try {
      const backupList = await getBackups(company.id);
      setBackups(backupList as BackupItem[]);
      
      // Son backup zamanını bul
      if (backupList.length > 0) {
        const lastBackup = backupList[0];
        setLastBackupTime(lastBackup.timestamp.toDate());
      }
    } catch (error) {
      console.error('Backup listesi yüklenemedi:', error);
      toast.error('Yedekler yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const checkAutoBackupStatus = () => {
    // LocalStorage'dan otomatik backup durumunu kontrol et
    const autoBackup = localStorage.getItem(`autoBackup_${company?.id}`);
    setAutoBackupEnabled(autoBackup === 'true');
  };

  // Manuel backup oluştur
  const handleCreateBackup = async () => {
    if (!company?.id || !currentUser?.uid) return;
    
    if (!confirm('Yeni yedekleme oluşturulacak. Devam edilsin mi?')) {
      return;
    }
    
    setLoading(true);
    try {
      await createBackup(company.id, currentUser.uid);
      await loadBackups();
      toast.success('Yedekleme başarıyla oluşturuldu!');
    } catch (error) {
      console.error('Backup oluşturma hatası:', error);
      toast.error('Yedekleme oluşturulamadı');
    } finally {
      setLoading(false);
    }
  };

  // Backup'tan geri yükle
  const handleRestoreBackup = async (backupId: string) => {
    if (!currentUser?.uid) return;
    
    if (!confirm('⚠️ DİKKAT: Mevcut veriler üzerine yazılacak! Devam edilsin mi?')) {
      return;
    }
    
    setLoading(true);
    try {
      await restoreBackup(backupId, currentUser.uid);
      toast.success('Veriler başarıyla geri yüklendi!');
    } catch (error) {
      console.error('Geri yükleme hatası:', error);
      toast.error('Geri yükleme başarısız');
    } finally {
      setLoading(false);
    }
  };

  // Backup'ı indir
  const handleDownloadBackup = async (backup: BackupItem) => {
    if (!backup.storageUrl) {
      toast.error('İndirme linki bulunamadı');
      return;
    }
    
    try {
      const response = await fetch(backup.storageUrl);
      const data = await response.json();
      exportBackupFile(data, backup.id);
    } catch (error) {
      console.error('İndirme hatası:', error);
      toast.error('Backup indirilemedi');
    }
  };

  // Backup'ı sil
  const handleDeleteBackup = async (backupId: string) => {
    if (!company?.id) return;
    
    if (!confirm('⚠️ Bu yedek kalıcı olarak silinecek. Emin misiniz?')) {
      return;
    }
    
    setLoading(true);
    try {
      await deleteBackup(backupId, company.id);
      await loadBackups();
      toast.success('Yedek başarıyla silindi');
    } catch (error) {
      console.error('Silme hatası:', error);
      toast.error('Yedek silinemedi');
    } finally {
      setLoading(false);
    }
  };

  // Otomatik backup'ı aç/kapat
  const toggleAutoBackup = () => {
    if (!company?.id || !currentUser?.uid) return;
    
    const newStatus = !autoBackupEnabled;
    
    if (newStatus) {
      scheduleBackup(company.id, currentUser.uid);
      localStorage.setItem(`autoBackup_${company.id}`, 'true');
      toast.success('Otomatik yedekleme aktif edildi');
    } else {
      localStorage.setItem(`autoBackup_${company.id}`, 'false');
      toast.success('Otomatik yedekleme kapatıldı');
    }
    
    setAutoBackupEnabled(newStatus);
  };

  // Boyut formatla
  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  };

  // Yetki kontrolü
  const canManageBackups = userProfile?.rol === 'superadmin' || userProfile?.rol === 'yonetici';

  if (!canManageBackups) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Bu sayfaya erişim yetkiniz yok.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Başlık ve İstatistikler */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Toplam Yedek</p>
                <p className="text-2xl font-bold">{backups.length}</p>
              </div>
              <Database className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Son Yedekleme</p>
                <p className="text-sm font-medium">
                  {lastBackupTime 
                    ? formatDistanceToNow(lastBackupTime, { addSuffix: true, locale: tr })
                    : 'Henüz yok'}
                </p>
              </div>
              <Clock className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Otomatik Yedek</p>
                <Badge variant={autoBackupEnabled ? 'success' : 'secondary'}>
                  {autoBackupEnabled ? 'Aktif' : 'Pasif'}
                </Badge>
              </div>
              <RefreshCw className={`h-8 w-8 ${autoBackupEnabled ? 'text-green-600' : 'text-gray-400'}`} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Toplam Boyut</p>
                <p className="text-lg font-medium">
                  {formatSize(backups.reduce((sum, b) => sum + (b.sizeBytes || 0), 0))}
                </p>
              </div>
              <HardDrive className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Kontrol Butonları */}
      <Card>
        <CardHeader>
          <CardTitle>Yedekleme İşlemleri</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={handleCreateBackup}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Database className="h-4 w-4 mr-2" />
              Yeni Yedek Oluştur
            </Button>

            <Button
              variant="outline"
              onClick={toggleAutoBackup}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${autoBackupEnabled ? 'animate-spin' : ''}`} />
              Otomatik Yedekleme {autoBackupEnabled ? 'Kapat' : 'Aç'}
            </Button>

            <Button
              variant="outline"
              onClick={loadBackups}
              disabled={loading}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Yenile
            </Button>
          </div>

          {autoBackupEnabled && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <Check className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-green-900">
                    Otomatik Yedekleme Aktif
                  </p>
                  <p className="text-sm text-green-700">
                    Her gün saat 03:00'te otomatik yedek alınacak
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Yedek Listesi */}
      <Card>
        <CardHeader>
          <CardTitle>Yedekleme Geçmişi</CardTitle>
        </CardHeader>
        <CardContent>
          {backups.length === 0 ? (
            <div className="text-center py-8">
              <Database className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Henüz yedekleme yok</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tarih
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tip
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Kayıt Sayısı
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Boyut
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Durum
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      İşlemler
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {backups.map((backup) => (
                    <tr key={backup.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          {backup.timestamp?.toDate?.()?.toLocaleString('tr-TR') || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={backup.type === 'automatic' ? 'primary' : 'secondary'}>
                          {backup.type === 'automatic' ? 'Otomatik' : 'Manuel'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {backup.documentCount} kayıt
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatSize(backup.sizeBytes)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={backup.status === 'completed' ? 'success' : 'danger'}>
                          {backup.status === 'completed' ? 'Başarılı' : 'Başarısız'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDownloadBackup(backup)}
                            disabled={loading}
                            title="İndir"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRestoreBackup(backup.id)}
                            disabled={loading}
                            title="Geri Yükle"
                          >
                            <Upload className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteBackup(backup.id)}
                            disabled={loading}
                            title="Sil"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Uyarı Mesajı */}
      <Card>
        <CardContent className="bg-amber-50 border border-amber-200">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
            <div>
              <p className="font-medium text-amber-900">Önemli Notlar</p>
              <ul className="mt-2 space-y-1 text-sm text-amber-800">
                <li>• Yedekler 30 gün boyunca saklanır</li>
                <li>• Geri yükleme işlemi mevcut verilerin üzerine yazacaktır</li>
                <li>• Otomatik yedekleme her gün saat 03:00'te çalışır</li>
                <li>• Maksimum 30 yedek saklanır, eskiler otomatik silinir</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BackupManagement;
