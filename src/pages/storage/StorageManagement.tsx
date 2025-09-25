import React, { useState, useEffect } from 'react';
import {
  HardDrive,
  Trash2,
  Download,
  Eye,
  AlertTriangle,
  PieChart,
  FileText,
  Image,
  Folder,
  TrendingUp,
  RefreshCw,
  Zap
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, Table, TableHeader, TableBody, TableRow, TableHeaderCell, TableCell } from '../../components/ui';
import { useCompany } from '../../hooks/useCompany';
import { useNavigate } from 'react-router-dom';
import { 
  calculateRealStorageUsage, 
  analyzeStorageQuota, 
  getStorageCleanupSuggestions,
  StorageBreakdown,
  StorageQuota 
} from '../../services/storageAnalyticsService';
import { toast } from 'react-hot-toast';

const StorageManagement: React.FC = () => {
  const { company } = useCompany();
  const navigate = useNavigate();
  const [storageBreakdown, setStorageBreakdown] = useState<StorageBreakdown | null>(null);
  const [storageQuota, setStorageQuota] = useState<StorageQuota | null>(null);
  const [cleanupSuggestions, setCleanupSuggestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (company) {
      loadStorageData();
    }
  }, [company]);

  const loadStorageData = async () => {
    if (!company) return;
    
    try {
      setLoading(true);
      
      const [breakdown, quota, suggestions] = await Promise.all([
        calculateRealStorageUsage(company.id),
        analyzeStorageQuota(company.id, company.subscriptionLimits?.storageLimit || 5 * 1024),
        getStorageCleanupSuggestions(company.id)
      ]);
      
      setStorageBreakdown(breakdown);
      setStorageQuota(quota);
      setCleanupSuggestions(suggestions);
      
    } catch (error) {
      console.error('Depolama verileri yüklenemedi:', error);
      toast.error('Depolama analizi yapılamadı');
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    await loadStorageData();
    setRefreshing(false);
    toast.success('Depolama verileri güncellendi');
  };

  const formatFileSize = (sizeInMB: number): string => {
    if (sizeInMB < 1) {
      return `${(sizeInMB * 1024).toFixed(0)} KB`;
    } else if (sizeInMB < 1024) {
      return `${sizeInMB.toFixed(2)} MB`;
    } else {
      return `${(sizeInMB / 1024).toFixed(2)} GB`;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'full': return 'bg-red-500';
      case 'critical': return 'bg-red-400';
      case 'warning': return 'bg-yellow-400';
      default: return 'bg-green-500';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!storageBreakdown || !storageQuota) {
    return (
      <div className="text-center py-12">
        <HardDrive className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Depolama Analizi Yapılamadı
        </h2>
        <Button onClick={loadStorageData}>Tekrar Dene</Button>
      </div>
    );
  }

  const categoryData = Object.entries(storageBreakdown.breakdown)
    .map(([key, value]) => ({ name: getCategoryName(key), value, key }))
    .sort((a, b) => b.value - a.value);

  return (
    <div className="space-y-6">
      {/* Başlık */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Depolama Yönetimi</h1>
          <p className="text-gray-600 mt-1">
            Depolama kullanımınızı analiz edin ve optimize edin
          </p>
        </div>
        <Button onClick={refreshData} disabled={refreshing}>
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Yenile
        </Button>
      </div>

      {/* Genel Durum */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <HardDrive className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Toplam Kullanım</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatFileSize(storageBreakdown.totalUsed)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className={`h-8 w-8 rounded-full ${getStatusColor(storageQuota.status)}`} />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Doluluk Oranı</p>
                <p className="text-2xl font-bold text-gray-900">
                  %{storageQuota.percentage.toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Toplam Dosya</p>
                <p className="text-2xl font-bold text-gray-900">
                  {storageBreakdown.fileCount.total.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Kalan Alan</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatFileSize(storageQuota.remainingMB)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Plan Yükseltme Önerisi */}
      {storageQuota.nextPlanSuggestion && (
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="bg-blue-100 p-3 rounded-full">
                  <Zap className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-blue-900">
                    {storageQuota.nextPlanSuggestion.planName} Planına Yükseltin
                  </h3>
                  <p className="text-blue-700">
                    {(storageQuota.nextPlanSuggestion.storageLimit / 1024).toFixed(0)} GB depolama alanı 
                    <span className="mx-2">•</span>
                    ₺{storageQuota.nextPlanSuggestion.price}/ay
                  </p>
                </div>
              </div>
              <Button onClick={() => navigate('/subscription')}>
                Hemen Yükselt
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Kategori Dağılımı */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <PieChart className="h-5 w-5 mr-2" />
              Kategori Dağılımı
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {categoryData.map((category) => (
                <div key={category.key} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">{category.name}</span>
                        <span className="text-sm text-gray-500">
                          {formatFileSize(category.value)}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full"
                          style={{
                            width: `${(category.value / storageBreakdown.totalUsed) * 100}%`
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Dosya Tipleri */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Dosya Tipleri
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Image className="h-4 w-4 text-blue-600" />
                  <span className="text-sm">Resimler</span>
                </div>
                <Badge variant="secondary">
                  {storageBreakdown.fileCount.images.toLocaleString()}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <FileText className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Belgeler</span>
                </div>
                <Badge variant="secondary">
                  {storageBreakdown.fileCount.documents.toLocaleString()}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Folder className="h-4 w-4 text-gray-600" />
                  <span className="text-sm">Diğer</span>
                </div>
                <Badge variant="secondary">
                  {storageBreakdown.fileCount.other.toLocaleString()}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* En Büyük Dosyalar */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2" />
            En Büyük Dosyalar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHeaderCell>Dosya Adı</TableHeaderCell>
                <TableHeaderCell>Boyut</TableHeaderCell>
                <TableHeaderCell>Tip</TableHeaderCell>
                <TableHeaderCell>Konum</TableHeaderCell>
                <TableHeaderCell>İşlemler</TableHeaderCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {storageBreakdown.largestFiles.map((file, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {file.type === 'image' ? (
                        <Image className="h-4 w-4 text-blue-600" />
                      ) : (
                        <FileText className="h-4 w-4 text-gray-600" />
                      )}
                      <span className="font-medium">{file.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={file.size > 10 ? 'destructive' : 'secondary'}>
                      {formatFileSize(file.size)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-gray-600 capitalize">
                      {file.type}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-gray-500">
                      {file.path.split('/').slice(-2, -1)[0]}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-1">
                      <Button size="sm" variant="ghost">
                        <Eye className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="ghost">
                        <Download className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="ghost" className="text-red-600">
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

const getCategoryName = (category: string): string => {
  const names: Record<string, string> = {
    logos: 'Şirket Logoları',
    arizaPhotos: 'Arıza Fotoğrafları',
    bakimPhotos: 'Bakım Fotoğrafları',
    vardiyaPhotos: 'Vardiya Fotoğrafları',
    documents: 'Belgeler',
    other: 'Diğer Dosyalar'
  };
  return names[category] || category;
};

export default StorageManagement;
