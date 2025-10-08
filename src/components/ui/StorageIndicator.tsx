import React, { useState, useEffect } from 'react';
import { HardDrive, RefreshCw, AlertTriangle } from 'lucide-react';
import { Button } from './Button';
import { Badge } from './Badge';
import { fastCalculateStorage, checkStorageLimitFast } from '../../services/fastStorageService';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';

interface StorageIndicatorProps {
  className?: string;
  showButton?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export const StorageIndicator: React.FC<StorageIndicatorProps> = ({ 
  className = '', 
  showButton = true,
  autoRefresh = false,
  refreshInterval = 300000 // 5 dakika
}) => {
  const { userProfile } = useAuth();
  const [storageInfo, setStorageInfo] = useState<any>(null);
  const [checking, setChecking] = useState(false);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);

  const checkStorage = async () => {
    if (!userProfile?.companyId) return;
    
    setChecking(true);
    try {
      const startTime = performance.now();
      
      // Hızlı storage hesaplama
      const metrics = await fastCalculateStorage(userProfile.companyId, false); // Cache kullan
      
      // Limit kontrolü
      const limitInfo = await checkStorageLimitFast(userProfile.companyId);
      
      const endTime = performance.now();
      
      setStorageInfo({
        ...metrics,
        ...limitInfo,
        calculationTime: endTime - startTime
      });
      
      setLastCheck(new Date());
      
      // Sadece manuel kontrollerde toast göster
      if (showButton) {
        toast.success(`Depolama: ${(metrics.storageUsedMB / 1024).toFixed(2)} GB / ${(limitInfo.limit / 1024).toFixed(0)} GB`, {
          duration: 2000
        });
      }
      
      // Limit uyarıları
      if (limitInfo.isOverLimit) {
        toast.error('⛔ Depolama limitiniz doldu! Lütfen planınızı yükseltin.', {
          duration: 5000
        });
      } else if (limitInfo.isNearLimit) {
        toast.warning('⚠️ Depolama alanınızın %80\'inden fazlası dolu!', {
          duration: 4000
        });
      }
      
    } catch (error) {
      console.error('Storage kontrol hatası:', error);
      if (showButton) {
        toast.error('Depolama kontrolü başarısız');
      }
    } finally {
      setChecking(false);
    }
  };

  // İlk yükleme ve otomatik yenileme
  useEffect(() => {
    checkStorage();
    
    if (autoRefresh) {
      const interval = setInterval(checkStorage, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [userProfile?.companyId, autoRefresh, refreshInterval]);

  if (!storageInfo) {
    return null;
  }

  const formatSize = (mb: number) => {
    if (mb < 1024) return `${mb.toFixed(0)} MB`;
    return `${(mb / 1024).toFixed(2)} GB`;
  };

  const getVariant = () => {
    if (storageInfo.percentage > 90) return 'danger';
    if (storageInfo.percentage > 80) return 'warning';
    return 'success';
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Storage Info */}
      <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <HardDrive className="w-4 h-4 text-gray-600 dark:text-gray-400" />
        <span className="text-sm text-gray-700 dark:text-gray-300">
          {formatSize(storageInfo.storageUsedMB)} / {formatSize(storageInfo.limit)}
        </span>
        <Badge variant={getVariant()} className="text-xs">
          {storageInfo.percentage.toFixed(0)}%
        </Badge>
        
        {storageInfo.isOverLimit && (
          <AlertTriangle className="w-4 h-4 text-red-500 animate-pulse" />
        )}
      </div>
      
      {/* Refresh Button */}
      {showButton && (
        <Button 
          variant="outline" 
          size="sm"
          onClick={checkStorage}
          disabled={checking}
          title={lastCheck ? `Son kontrol: ${lastCheck.toLocaleTimeString('tr-TR')}` : 'Depolama kontrolü'}
        >
          <RefreshCw className={`w-4 h-4 ${checking ? 'animate-spin' : ''}`} />
        </Button>
      )}
      
      {/* Mobile View */}
      <div className="flex sm:hidden items-center gap-1">
        <Badge variant={getVariant()} className="text-xs">
          <HardDrive className="w-3 h-3 mr-1" />
          {storageInfo.percentage.toFixed(0)}%
        </Badge>
      </div>
    </div>
  );
};

export default StorageIndicator;
