/**
 * 📊 Modern Analytics Dashboard
 * SolarVeyo - Business Intelligence & Platform Analytics
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  getAnalyticsDashboard,
  type AnalyticsDashboardData,
  type RevenueAnalytics,
  type UserAnalytics,
  type PlatformAnalytics,
  type GrowthMetrics
} from '../../services/analyticsService';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  Button,
  LoadingSpinner
} from '../../components/ui';
import { 
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart
} from 'recharts';
import { 
  DollarSign, 
  Users, 
  TrendingUp, 
  TrendingDown,
  Building2,
  Zap,
  AlertTriangle,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  Target,
  Calendar,
  RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

const AnalyticsDashboard: React.FC = () => {
  const { userProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<AnalyticsDashboardData | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d' | '1y'>('30d');

  // Yetki kontrolü
  if (!userProfile || userProfile.rol !== 'superadmin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-96">
          <CardHeader>
            <CardTitle className="text-red-600 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Yetkisiz Erişim
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">Bu sayfa sadece SuperAdmin kullanıcıları için.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Verileri yükle
  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      const data = await getAnalyticsDashboard();
      setDashboardData(data);
    } catch (error) {
      console.error('Analytics verisi yüklenemedi:', error);
      toast.error('Analytics verileri yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalyticsData();
  }, []);

  // Format functions
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY'
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('tr-TR').format(num);
  };

  const formatPercent = (percent: number) => {
    return `${percent >= 0 ? '+' : ''}${percent.toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardContent className="p-6">
            <p className="text-gray-600">Analytics verileri yüklenemedi.</p>
            <Button onClick={loadAnalyticsData} className="mt-4">
              Tekrar Dene
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { revenue, users, platform, growth } = dashboardData;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <BarChart3 className="h-8 w-8 text-blue-500" />
            Analytics Dashboard
          </h1>
          <p className="text-gray-600 mt-1">SolarVeyo Platform Business Intelligence</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <select 
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value as any)}
              className="border rounded px-3 py-1 text-sm"
            >
              <option value="7d">Son 7 Gün</option>
              <option value="30d">Son 30 Gün</option>
              <option value="90d">Son 90 Gün</option>
              <option value="1y">Son 1 Yıl</option>
            </select>
          </div>
          <Button 
            onClick={loadAnalyticsData}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Yenile
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Revenue */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Toplam Gelir</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(revenue.totalRevenue)}</p>
                <p className={`text-sm ${revenue.revenueGrowth.growthRate >= 0 ? 'text-green-600' : 'text-red-600'} flex items-center gap-1`}>
                  {revenue.revenueGrowth.growthRate >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {formatPercent(revenue.revenueGrowth.growthRate)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        {/* Total Users */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Toplam Kullanıcı</p>
                <p className="text-2xl font-bold text-gray-900">{formatNumber(users.totalUsers)}</p>
                <p className={`text-sm ${users.userGrowthRate >= 0 ? 'text-green-600' : 'text-red-600'} flex items-center gap-1`}>
                  {users.userGrowthRate >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {formatPercent(users.userGrowthRate)}
                </p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        {/* Active Companies */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Aktif Şirket</p>
                <p className="text-2xl font-bold text-gray-900">{formatNumber(platform.activeCompanies)}</p>
                <p className="text-sm text-gray-500">
                  {formatNumber(platform.totalCompanies)} toplam
                </p>
              </div>
              <Building2 className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        {/* Conversion Rate */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Dönüşüm Oranı</p>
                <p className="text-2xl font-bold text-gray-900">{platform.conversionRate.toFixed(1)}%</p>
                <p className="text-sm text-gray-500">Trial → Paid</p>
              </div>
              <Target className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Gelir Trendi</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={revenue.monthlyTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip 
                  formatter={(value: any) => [formatCurrency(value), 'Gelir']}
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#3B82F6" 
                  fill="#3B82F6" 
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Customer Acquisition */}
        <Card>
          <CardHeader>
            <CardTitle>Müşteri Kazanım</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={revenue.monthlyTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="newCustomers" fill="#10B981" name="Yeni Müşteri" />
                <Bar dataKey="churnedCustomers" fill="#EF4444" name="Ayrılan Müşteri" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue by Plan */}
        <Card>
          <CardHeader>
            <CardTitle>Plan Bazında Gelir</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={Object.entries(revenue.revenueByPlan).map(([plan, data], index) => ({
                    name: plan,
                    value: data.revenue,
                    fill: COLORS[index % COLORS.length]
                  }))}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {Object.keys(revenue.revenueByPlan).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* User Retention */}
        <Card>
          <CardHeader>
            <CardTitle>Kullanıcı Retention</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">1 Gün</span>
                <span className="font-semibold">{users.userRetention.day1}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full" 
                  style={{ width: `${users.userRetention.day1}%` }}
                ></div>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">7 Gün</span>
                <span className="font-semibold">{users.userRetention.day7}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full" 
                  style={{ width: `${users.userRetention.day7}%` }}
                ></div>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">30 Gün</span>
                <span className="font-semibold">{users.userRetention.day30}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-purple-500 h-2 rounded-full" 
                  style={{ width: `${users.userRetention.day30}%` }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Key Metrics */}
        <Card>
          <CardHeader>
            <CardTitle>Anahtar Metrikler</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">MRR</span>
                <span className="font-semibold">{formatCurrency(growth.monthlyRecurringRevenue)}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">ARR</span>
                <span className="font-semibold">{formatCurrency(growth.annualRecurringRevenue)}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">CAC</span>
                <span className="font-semibold">{formatCurrency(growth.customerAcquisitionCost)}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">CLV</span>
                <span className="font-semibold">{formatCurrency(growth.customerLifetimeValue)}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Churn Rate</span>
                <span className="font-semibold text-red-600">{growth.churnRate.toFixed(1)}%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Platform Usage Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Platform Kullanım İstatistikleri</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{formatNumber(platform.platformUsage.totalFaults)}</div>
              <div className="text-sm text-gray-600 flex items-center justify-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                Toplam Arıza
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{formatNumber(platform.platformUsage.totalMaintenance)}</div>
              <div className="text-sm text-gray-600 flex items-center justify-center gap-1">
                <Activity className="h-3 w-3" />
                Toplam Bakım
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{formatNumber(platform.platformUsage.totalSites)}</div>
              <div className="text-sm text-gray-600 flex items-center justify-center gap-1">
                <Building2 className="h-3 w-3" />
                Toplam Saha
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{formatNumber(platform.platformUsage.totalPowerPlants)}</div>
              <div className="text-sm text-gray-600 flex items-center justify-center gap-1">
                <Zap className="h-3 w-3" />
                Toplam Santral
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{formatNumber(platform.platformUsage.storageUsage)} MB</div>
              <div className="text-sm text-gray-600">Depolama Kullanımı</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Last Updated */}
      <div className="text-center text-sm text-gray-500">
        Son güncelleme: {dashboardData.lastUpdated.toLocaleString('tr-TR')}
      </div>
    </div>
  );
};

export default AnalyticsDashboard;