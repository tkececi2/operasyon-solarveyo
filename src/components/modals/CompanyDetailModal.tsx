import React from 'react';
import {
  X,
  Building2,
  Users,
  Calendar,
  DollarSign,
  Package,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Shield,
  Database,
  Zap,
  CreditCard,
  RefreshCw,
  TrendingUp,
  FileText
} from 'lucide-react';
import { Modal, Badge, Button } from '../ui';
// import { CompanyStats } from '../../services/superAdminService';
import { formatCurrency } from '../../utils/formatters';

interface CompanyDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  company: CompanyStats | null;
}

export const CompanyDetailModal: React.FC<CompanyDetailModalProps> = ({
  isOpen,
  onClose,
  company
}) => {
  if (!company) return null;

  const getSubscriptionBadgeVariant = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'trial': return 'warning';
      case 'expired': return 'danger';
      default: return 'default';
    }
  };

  const getSubscriptionLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Aktif';
      case 'trial': return 'Deneme';
      case 'expired': return 'Süresi Dolmuş';
      default: return status;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center space-x-3">
          {company.logo ? (
            <img 
              src={company.logo} 
              alt={company.name}
              className="h-8 w-8 rounded-full object-cover"
            />
          ) : (
            <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
              <Building2 className="h-4 w-4 text-gray-500" />
            </div>
          )}
          <span>{company.name}</span>
        </div>
      }
      size="lg"
    >
      <div className="space-y-6">
        {/* Abonelik Durumu */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-gray-900">Abonelik Detayları</h3>
            <Badge variant={getSubscriptionBadgeVariant(company.subscriptionStatus)}>
              {getSubscriptionLabel(company.subscriptionStatus)}
            </Badge>
          </div>
          
          {/* Ana Abonelik Bilgileri */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-500">Plan:</span>
                <span className="font-medium">{company.subscriptionPlan}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Döngü:</span>
                <span className="font-medium">
                  {company.billingCycle === 'monthly' ? 'Aylık' : 
                   company.billingCycle === 'yearly' ? 'Yıllık' : 'Yaşam Boyu'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Otomatik Yenileme:</span>
                <span className={`font-medium ${company.autoRenewal ? 'text-green-600' : 'text-orange-600'}`}>
                  {company.autoRenewal ? 'Aktif' : 'Pasif'}
                </span>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-500">Aylık Ücret:</span>
                <span className="font-medium text-green-600">
                  {formatCurrency(company.monthlyRevenue)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Ödeme Yöntemi:</span>
                <span className="font-medium">{company.paymentMethod || 'Kredi Kartı'}</span>
              </div>
              {company.remainingDays !== undefined && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Kalan Süre:</span>
                  <span className={`font-medium ${
                    company.remainingDays < 7 ? 'text-red-600' : 
                    company.remainingDays < 30 ? 'text-yellow-600' : 'text-green-600'
                  }`}>
                    {company.remainingDays} gün
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Tarihler */}
          <div className="border-t pt-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              {company.subscriptionStartDate && (
                <div className="text-center">
                  <div className="text-gray-500 text-xs">Plan Başlangıcı</div>
                  <div className="font-medium">
                    {company.subscriptionStartDate.toLocaleDateString('tr-TR')}
                  </div>
                </div>
              )}
              {company.nextBillingDate && (
                <div className="text-center">
                  <div className="text-gray-500 text-xs">Sonraki Ödeme</div>
                  <div className="font-medium">
                    {company.nextBillingDate.toLocaleDateString('tr-TR')}
                  </div>
                </div>
              )}
              {company.lastPaymentDate && (
                <div className="text-center">
                  <div className="text-gray-500 text-xs">Son Ödeme</div>
                  <div className="font-medium">
                    {company.lastPaymentDate.toLocaleDateString('tr-TR')}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Mali Bilgiler */}
          {(company.totalPaid > 0 || company.outstandingAmount > 0 || company.invoiceCount > 0) && (
            <div className="border-t pt-3 mt-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                {company.totalPaid > 0 && (
                  <div className="text-center">
                    <div className="text-gray-500 text-xs">Toplam Ödenen</div>
                    <div className="font-medium text-green-600">
                      {formatCurrency(company.totalPaid)}
                    </div>
                  </div>
                )}
                {company.outstandingAmount > 0 && (
                  <div className="text-center">
                    <div className="text-gray-500 text-xs">Bekleyen Borç</div>
                    <div className="font-medium text-red-600">
                      {formatCurrency(company.outstandingAmount)}
                    </div>
                  </div>
                )}
                {company.invoiceCount > 0 && (
                  <div className="text-center">
                    <div className="text-gray-500 text-xs">Fatura Sayısı</div>
                    <div className="font-medium">{company.invoiceCount}</div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Kullanım İstatistikleri */}
        <div>
          <h3 className="font-medium text-gray-900 mb-3">Kullanım İstatistikleri</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 rounded-lg p-3 text-center">
              <Users className="h-6 w-6 text-blue-500 mx-auto mb-1" />
              <div className="text-2xl font-bold text-gray-900">{company.userCount}</div>
              <div className="text-xs text-gray-600">Kullanıcı</div>
            </div>
            <div className="bg-green-50 rounded-lg p-3 text-center">
              <Database className="h-6 w-6 text-green-500 mx-auto mb-1" />
              <div className="text-2xl font-bold text-gray-900">{company.totalSahalar}</div>
              <div className="text-xs text-gray-600">Saha</div>
            </div>
            <div className="bg-purple-50 rounded-lg p-3 text-center">
              <Zap className="h-6 w-6 text-purple-500 mx-auto mb-1" />
              <div className="text-2xl font-bold text-gray-900">{company.totalSantraller}</div>
              <div className="text-xs text-gray-600">Santral</div>
            </div>
            <div className="bg-orange-50 rounded-lg p-3 text-center">
              <AlertTriangle className="h-6 w-6 text-orange-500 mx-auto mb-1" />
              <div className="text-2xl font-bold text-gray-900">{company.totalArizalar}</div>
              <div className="text-xs text-gray-600">Arıza</div>
            </div>
          </div>
        </div>

        {/* Şirket Bilgileri */}
        <div>
          <h3 className="font-medium text-gray-900 mb-3">Şirket Bilgileri</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Kayıt Tarihi:</span>
              <span className="font-medium">
                {company.createdAt.toLocaleDateString('tr-TR')}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Son Aktivite:</span>
              <span className="font-medium">
                {company.lastActivity.toLocaleDateString('tr-TR')} {company.lastActivity.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        </div>

        {/* İşlem Butonları */}
        <div className="flex justify-end space-x-3 pt-4 border-t">
          <Button variant="secondary" onClick={onClose}>
            Kapat
          </Button>
          <Button variant="primary">
            <Shield className="h-4 w-4 mr-2" />
            Şirkete Giriş Yap
          </Button>
        </div>
      </div>
    </Modal>
  );
};

