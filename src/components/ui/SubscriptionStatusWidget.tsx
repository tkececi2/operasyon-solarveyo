import React from 'react';
import { AlertTriangle, Clock, CheckCircle, CreditCard } from 'lucide-react';
import { Card, CardContent, Button, Badge } from './index';
import { useNavigate } from 'react-router-dom';
import { useSubscription } from '../../hooks/useSubscription';

export const SubscriptionStatusWidget: React.FC = () => {
  const navigate = useNavigate();
  const { 
    subscriptionInfo, 
    loading, 
    getRemainingDays, 
    isTrialing, 
    isActive, 
    isExpired,
    getWarningLevel 
  } = useSubscription();

  if (loading || !subscriptionInfo) return null;

  const remainingDays = getRemainingDays();

  // Abonelik durumunu belirle
  const getStatus = () => {
    const warningLevel = getWarningLevel();
    
    if (isExpired()) {
      return {
        type: 'expired',
        color: 'bg-red-100 border-red-200',
        textColor: 'text-red-800',
        icon: AlertTriangle,
        iconColor: 'text-red-600',
        title: 'Abonelik Süresi Dolmuş',
        message: 'Hizmetlere erişim kısıtlanmıştır.',
        action: 'Hemen Yenile'
      };
    } else if (warningLevel === 'danger' || warningLevel === 'warning') {
      return {
        type: 'critical',
        color: 'bg-red-100 border-red-200',
        textColor: 'text-red-800',
        icon: AlertTriangle,
        iconColor: 'text-red-600',
        title: `${remainingDays} Gün Kaldı`,
        message: 'Aboneliğinizi hemen yenileyin.',
        action: 'Hemen Yenile'
      };
    } else {
      // 7 günden fazla kaldıysa widget gösterme
      return null;
    }
  };

  const status = getStatus();
  
  // Status null ise widget gösterme (lifetime planlar veya 5+ gün kalanlar için)
  if (!status) {
    return null;
  }
  
  const Icon = status.icon;

  return (
    <Card className={`${status.color} border`}>
      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
          <Icon className={`h-5 w-5 ${status.iconColor} mt-0.5`} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <h3 className={`font-medium ${status.textColor}`}>
                {status.title}
              </h3>
              <Badge variant={status.type === 'active' ? 'success' : 
                             status.type === 'warning' ? 'warning' : 'destructive'}>
                {subscriptionInfo.planName}
              </Badge>
            </div>
            <p className={`text-sm ${status.textColor} mb-3`}>
              {status.message}
            </p>
            <Button
              size="sm"
              variant={status.type === 'expired' || status.type === 'critical' ? 'default' : 'secondary'}
              onClick={() => navigate('/subscription')}
              className="w-full"
            >
              <CreditCard className="h-4 w-4 mr-2" />
              {status.action}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
