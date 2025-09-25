import React, { useState, useEffect } from 'react';
import { 
  HardDrive, 
  AlertTriangle, 
  TrendingUp, 
  ArrowRight,
  Trash2,
  Info,
  Zap
} from 'lucide-react';
import { Card, CardContent, Button, Badge } from './index';
import { useCompany } from '../../hooks/useCompany';
import { useNavigate } from 'react-router-dom';
import { analyzeStorageQuota, StorageQuota } from '../../services/storageAnalyticsService';
import { toast } from 'react-hot-toast';

export const StorageWarningWidget: React.FC = () => {
  const { company } = useCompany();
  const navigate = useNavigate();
  const [storageQuota, setStorageQuota] = useState<StorageQuota | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (company) {
      analyzeStorage();
    }
  }, [company]);

  const analyzeStorage = async () => {
    if (!company) return;
    
    try {
      setLoading(true);
      const storageLimit = company.subscriptionLimits?.storageLimit || 5 * 1024; // MB
      const quota = await analyzeStorageQuota(company.id, storageLimit);
      setStorageQuota(quota);
    } catch (error) {
      console.error('Depolama analizi hatası:', error);
      toast.error('Depolama bilgileri alınamadı');
    } finally {
      setLoading(false);
    }
  };

  if (!company || loading || !storageQuota) return null;

  // Sadece uyarı gerektiren durumlar için göster
  if (storageQuota.status === 'safe') return null;

  const getStatusConfig = () => {
    switch (storageQuota.status) {
      case 'full':
        return {
          color: 'bg-red-100 border-red-200',
          textColor: 'text-red-800',
          icon: AlertTriangle,
          iconColor: 'text-red-600',
          title: 'Depolama Alanı Dolu!',
          message: 'Yeni dosya yükleyemezsiniz. Hemen plan yükseltin.',
          badgeVariant: 'destructive' as const,
          actionText: 'Hemen Yükselt'
        };
      case 'critical':
        return {
          color: 'bg-red-100 border-red-200',
          textColor: 'text-red-800',
          icon: AlertTriangle,
          iconColor: 'text-red-600',
          title: 'Depolama Alanı Kritik!',
          message: `Sadece ${storageQuota.remainingGB.toFixed(2)} GB kaldı. Plan yükseltin.`,
          badgeVariant: 'destructive' as const,
          actionText: 'Plan Yükselt'
        };
      case 'warning':
        return {
          color: 'bg-yellow-100 border-yellow-200',
          textColor: 'text-yellow-800',
          icon: HardDrive,
          iconColor: 'text-yellow-600',
          title: 'Depolama Alanı Azalıyor',
          message: `${storageQuota.remainingGB.toFixed(2)} GB kaldı. Plan yükseltmeyi düşünün.`,
          badgeVariant: 'warning' as const,
          actionText: 'Planları Görüntüle'
        };
      default:
        return null;
    }
  };

  const statusConfig = getStatusConfig();
  if (!statusConfig) return null;

  const Icon = statusConfig.icon;
  const progressWidth = Math.min(storageQuota.percentage, 100);

  return (
    <Card className={`${statusConfig.color} border`}>
      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
          <Icon className={`h-5 w-5 ${statusConfig.iconColor} mt-0.5`} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-2">
              <h3 className={`font-medium ${statusConfig.textColor}`}>
                {statusConfig.title}
              </h3>
              <Badge variant={statusConfig.badgeVariant}>
                %{storageQuota.percentage.toFixed(2)}
              </Badge>
            </div>
            
            <p className={`text-sm ${statusConfig.textColor} mb-3`}>
              {statusConfig.message}
            </p>

            {/* Progress Bar */}
            <div className="mb-3">
              <div className="flex justify-between text-xs text-gray-600 mb-1">
                <span>{(storageQuota.used / 1024).toFixed(2)} GB kullanıldı</span>
                <span>{(storageQuota.limit / 1024).toFixed(2)} GB limit</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    storageQuota.status === 'full' ? 'bg-red-500' :
                    storageQuota.status === 'critical' ? 'bg-red-500' :
                    'bg-yellow-500'
                  }`}
                  style={{ width: `${progressWidth}%` }}
                />
              </div>
            </div>

            {/* Plan Önerisi */}
            {storageQuota.nextPlanSuggestion && (
              <div className="bg-white/50 rounded-lg p-3 mb-3">
                <div className="flex items-center space-x-2 mb-1">
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                  <span className="font-medium text-blue-800">
                    {storageQuota.nextPlanSuggestion.planName} Plan Önerisi
                  </span>
                </div>
                <div className="text-sm text-blue-700">
                  {(storageQuota.nextPlanSuggestion.storageLimit / 1024).toFixed(2)} GB depolama
                  <span className="mx-2">•</span>
                  ₺{storageQuota.nextPlanSuggestion.price}/ay
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-2">
              <Button
                size="sm"
                onClick={() => navigate('/subscription')}
                className="flex-1"
              >
                <ArrowRight className="h-4 w-4 mr-1" />
                {statusConfig.actionText}
              </Button>
              
              {storageQuota.status !== 'full' && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => navigate('/storage-management')}
                  className="flex items-center"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Temizle
                </Button>
              )}
            </div>

            {/* Hızlı İpuçları */}
            <div className="mt-3 text-xs text-gray-600">
              <div className="flex items-center space-x-1">
                <Info className="h-3 w-3" />
                <span>
                  İpucu: Eski fotoğrafları silerek {((storageQuota.used * 0.3) / 1024).toFixed(2)} GB tasarruf edebilirsiniz
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
