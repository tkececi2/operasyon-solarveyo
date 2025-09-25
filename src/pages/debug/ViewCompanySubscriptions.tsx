import React, { useState, useEffect } from 'react';
import { Card, LoadingSpinner, Badge } from '../../components/ui';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Building2, Users, Calendar, CreditCard } from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/formatters';

const ViewCompanySubscriptions: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [companies, setCompanies] = useState<any[]>([]);

  useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    try {
      setLoading(true);
      
      // Sadece şirketleri çek, basit!
      const companiesSnapshot = await getDocs(collection(db, 'companies'));
      const companiesData = companiesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setCompanies(companiesData);
      console.log('📊 Şirket verileri:', companiesData);
    } catch (error) {
      console.error('Hata:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'trial': return 'bg-blue-100 text-blue-800';
      case 'expired': return 'bg-red-100 text-red-800';
      case 'suspended': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Aktif';
      case 'trial': return 'Deneme';
      case 'expired': return 'Süresi Dolmuş';
      case 'suspended': return 'Askıda';
      default: return status || 'Bilinmiyor';
    }
  };

  if (loading) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4">Şirketler yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Şirket Abonelikleri</h1>
        <p className="text-gray-600 mt-2">
          Sistemdeki {companies.length} şirketin abonelik durumu
        </p>
      </div>

      <div className="grid gap-6">
        {companies.map((company) => (
          <Card key={company.id} className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <Building2 className="w-8 h-8 text-blue-600" />
                <div>
                  <h2 className="text-xl font-bold">{company.name}</h2>
                  <p className="text-gray-600">{company.email}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(company.subscriptionStatus)}`}>
                  {getStatusText(company.subscriptionStatus)}
                </span>
                <Badge variant="outline">
                  {company.subscriptionPlan || 'Plan Yok'}
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-green-600" />
                <div>
                  <div className="font-semibold">
                    {formatCurrency(company.subscriptionPrice || 0)}/ay
                  </div>
                  <div className="text-sm text-gray-600">Aylık Ücret</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                <div>
                  <div className="font-semibold">
                    {company.createdAt ? formatDate(company.createdAt.toDate()) : 'Bilinmiyor'}
                  </div>
                  <div className="text-sm text-gray-600">Kayıt Tarihi</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-600" />
                <div>
                  <div className="font-semibold">
                    {company.subscriptionLimits?.users || 'Sınırsız'}
                  </div>
                  <div className="text-sm text-gray-600">Kullanıcı Limiti</div>
                </div>
              </div>

              <div>
                <div className="font-semibold">
                  {company.subscriptionLimits?.storage || 'Bilinmiyor'}
                </div>
                <div className="text-sm text-gray-600">Depolama Limiti</div>
              </div>
            </div>

            {/* Depolama Kullanımı */}
            {company.metrics?.storageUsedMB && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Depolama Kullanımı</span>
                  <span className="text-sm">
                    {company.metrics.storageUsedMB.toFixed(2)} MB 
                    {company.subscriptionLimits?.storageLimit && 
                      ` / ${(company.subscriptionLimits.storageLimit / 1024).toFixed(2)} GB`
                    }
                  </span>
                </div>
                {company.subscriptionLimits?.storageLimit && (
                  <div className="mt-2 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{
                        width: `${Math.min(100, (company.metrics.storageUsedMB / company.subscriptionLimits.storageLimit) * 100)}%`
                      }}
                    ></div>
                  </div>
                )}
              </div>
            )}

            {/* Şirket ID - Debug için */}
            <div className="mt-4 text-xs text-gray-500 border-t pt-2">
              ID: {company.id}
            </div>
          </Card>
        ))}
      </div>

      {companies.length === 0 && (
        <Card className="p-8 text-center">
          <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Şirket Bulunamadı</h3>
          <p className="text-gray-600">Sistemde henüz şirket kaydı bulunmuyor.</p>
        </Card>
      )}
    </div>
  );
};

export default ViewCompanySubscriptions;
