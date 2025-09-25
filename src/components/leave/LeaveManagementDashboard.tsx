/**
 * Gelişmiş İzin Yönetimi Dashboard'u
 * 
 * Özellikler:
 * - Yıllık izin bakiye takibi
 * - Geçmiş yıllar görünümü
 * - Otomatik hakediş hesaplaması
 * - Detaylı raporlama
 */

import React, { useState, useEffect } from 'react';
import { 
  Calendar,
  TrendingUp,
  Clock,
  Users,
  FileText,
  Settings,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Download,
  Plus,
  History,
  Award,
  BarChart3,
  CalendarDays,
  Briefcase
} from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useAuth } from '../../hooks/useAuth';
import {
  getCurrentLeaveBalance,
  getUserLeaveTransactions,
  generateLeaveReport,
  calculateLeaveAccrual,
  getEmployeeProfile,
  initializeLeaveYear
} from '../../services/leaveManagementService';
import {
  ILeaveYear,
  ILeaveTransaction,
  ILeaveReport,
  IEmployeeLeaveProfile,
  ILeaveAccrualCalculation
} from '../../types/leave-management.types';
import toast from 'react-hot-toast';

export default function LeaveManagementDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'transactions' | 'report'>('overview');
  
  // State
  const [currentBalance, setCurrentBalance] = useState<ILeaveYear | null>(null);
  const [transactions, setTransactions] = useState<ILeaveTransaction[]>([]);
  const [report, setReport] = useState<ILeaveReport | null>(null);
  const [profile, setProfile] = useState<IEmployeeLeaveProfile | null>(null);
  const [accrual, setAccrual] = useState<ILeaveAccrualCalculation | null>(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    if (user?.uid) {
      loadData();
    }
  }, [user, selectedYear]);

  const loadData = async () => {
    if (!user?.uid) return;
    
    setLoading(true);
    try {
      // Profil bilgisi
      const profileData = await getEmployeeProfile(user.uid);
      setProfile(profileData);
      
      // Mevcut bakiye
      const balance = await getCurrentLeaveBalance(user.uid);
      setCurrentBalance(balance);
      
      // İşlem geçmişi
      const trans = await getUserLeaveTransactions(user.uid, selectedYear);
      setTransactions(trans);
      
      // Detaylı rapor
      const reportData = await generateLeaveReport(user.uid);
      setReport(reportData);
      
      // Hakediş hesaplaması
      if (profileData) {
        const accrualData = await calculateLeaveAccrual(user.uid, profileData.companyId);
        setAccrual(accrualData);
      }
    } catch (error) {
      console.error('Veri yükleme hatası:', error);
      toast.error('Veriler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const refreshBalance = async () => {
    if (!user?.uid || !profile) return;
    
    try {
      await initializeLeaveYear(user.uid, profile.companyId, selectedYear);
      await loadData();
      toast.success('İzin bakiyesi güncellendi');
    } catch (error) {
      console.error('Bakiye güncelleme hatası:', error);
      toast.error('Bakiye güncellenirken hata oluştu');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Başlık ve Aksiyonlar */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">İzin Yönetimi</h1>
          <p className="text-sm text-gray-600 mt-1">
            Yıllık izin haklarınız ve kullanım detayları
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={refreshBalance}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <RefreshCw className="h-4 w-4" />
            Yenile
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Plus className="h-4 w-4" />
            İzin Talebi
          </button>
        </div>
      </div>

      {/* Ana Bakiye Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Yıllık İzin */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <CalendarDays className="h-8 w-8 opacity-80" />
            <span className="text-2xl font-bold">
              {currentBalance?.balance.annual || 0}
            </span>
          </div>
          <h3 className="font-semibold mb-1">Yıllık İzin</h3>
          <div className="text-sm opacity-90">
            <div className="flex justify-between">
              <span>Toplam Hak:</span>
              <span>{currentBalance?.entitlements.annual || 0} gün</span>
            </div>
            <div className="flex justify-between">
              <span>Kullanılan:</span>
              <span>{currentBalance?.usage.annual || 0} gün</span>
            </div>
            {currentBalance?.entitlements.carryOver > 0 && (
              <div className="flex justify-between text-xs mt-1 pt-1 border-t border-white/30">
                <span>Devreden:</span>
                <span>+{currentBalance.entitlements.carryOver} gün</span>
              </div>
            )}
          </div>
        </div>

        {/* Hastalık İzni */}
        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <Briefcase className="h-8 w-8 opacity-80" />
            <span className="text-2xl font-bold">
              {currentBalance?.balance.sick || 0}
            </span>
          </div>
          <h3 className="font-semibold mb-1">Hastalık İzni</h3>
          <div className="text-sm opacity-90">
            <div className="flex justify-between">
              <span>Toplam Hak:</span>
              <span>{currentBalance?.entitlements.sick || 0} gün</span>
            </div>
            <div className="flex justify-between">
              <span>Kullanılan:</span>
              <span>{currentBalance?.usage.sick || 0} gün</span>
            </div>
          </div>
        </div>

        {/* Toplam Kullanım */}
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <BarChart3 className="h-8 w-8 opacity-80" />
            <span className="text-2xl font-bold">
              {currentBalance?.usage.total || 0}
            </span>
          </div>
          <h3 className="font-semibold mb-1">Toplam Kullanım</h3>
          <div className="text-sm opacity-90">
            <div className="flex justify-between">
              <span>Yıllık:</span>
              <span>{currentBalance?.usage.annual || 0} gün</span>
            </div>
            <div className="flex justify-between">
              <span>Hastalık:</span>
              <span>{currentBalance?.usage.sick || 0} gün</span>
            </div>
            {currentBalance?.usage.unpaid > 0 && (
              <div className="flex justify-between">
                <span>Ücretsiz:</span>
                <span>{currentBalance.usage.unpaid} gün</span>
              </div>
            )}
          </div>
        </div>

        {/* Kıdem Bilgisi */}
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <Award className="h-8 w-8 opacity-80" />
            <span className="text-2xl font-bold">
              {accrual ? Math.floor(accrual.serviceMonths / 12) : 0}
            </span>
          </div>
          <h3 className="font-semibold mb-1">Kıdem (Yıl)</h3>
          <div className="text-sm opacity-90">
            {profile && (
              <>
                <div className="flex justify-between">
                  <span>İşe Giriş:</span>
                  <span>
                    {format(new Date(profile.hireDate), 'dd.MM.yyyy')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Pozisyon:</span>
                  <span className="truncate">{profile.position || '-'}</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Tab Menü */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {[
            { id: 'overview', label: 'Genel Bakış', icon: BarChart3 },
            { id: 'history', label: 'Geçmiş Yıllar', icon: History },
            { id: 'transactions', label: 'İşlem Geçmişi', icon: FileText },
            { id: 'report', label: 'Detaylı Rapor', icon: BarChart3 }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`
                  flex items-center gap-2 py-3 px-1 border-b-2 font-medium text-sm
                  ${activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab İçeriği */}
      <div className="bg-white rounded-lg shadow-sm">
        {/* Genel Bakış */}
        {activeTab === 'overview' && (
          <div className="p-6 space-y-6">
            {/* Hakediş Detayları */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Award className="h-5 w-5 text-purple-600" />
                Hakediş Detayları
              </h3>
              {accrual && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Çalışma Süresi</p>
                      <p className="font-semibold">
                        {Math.floor(accrual.serviceMonths / 12)} yıl {accrual.serviceMonths % 12} ay
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Yıllık Hak</p>
                      <p className="font-semibold">{accrual.final.annual} gün</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Hastalık Hakkı</p>
                      <p className="font-semibold">{accrual.final.sick} gün</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Toplam Hak</p>
                      <p className="font-semibold">{accrual.final.total} gün</p>
                    </div>
                  </div>
                  
                  {accrual.adjustments.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <p className="text-sm font-medium text-gray-700 mb-2">Düzeltmeler:</p>
                      {accrual.adjustments.map((adj, idx) => (
                        <div key={idx} className="flex justify-between text-sm">
                          <span className="text-gray-600">{adj.reason}</span>
                          <span className="font-medium text-green-600">+{adj.amount} gün</span>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {accrual.appliedRule && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <p className="text-sm text-gray-600">
                        Uygulanan Kural: <span className="font-medium">{accrual.appliedRule.name}</span>
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Kullanım Özeti */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-blue-600" />
                {selectedYear} Yılı Kullanım Özeti
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Yıllık İzin', value: currentBalance?.usage.annual || 0, color: 'blue' },
                  { label: 'Hastalık İzni', value: currentBalance?.usage.sick || 0, color: 'red' },
                  { label: 'Ücretsiz İzin', value: currentBalance?.usage.unpaid || 0, color: 'gray' },
                  { label: 'Diğer İzinler', value: currentBalance?.usage.other || 0, color: 'purple' }
                ].map((item) => (
                  <div key={item.label} className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600">{item.label}</p>
                    <p className={`text-2xl font-bold text-${item.color}-600`}>
                      {item.value} <span className="text-sm font-normal">gün</span>
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Geçmiş Yıllar */}
        {activeTab === 'history' && report && (
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">Geçmiş Yıl İzin Kullanımları</h3>
            <div className="space-y-3">
              {report.history.map((year) => (
                <div key={year.year} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-lg">{year.year}</h4>
                    <span className="text-sm text-gray-500">
                      {year.used} / {year.entitlement} gün kullanıldı
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Toplam Hak:</span>
                      <p className="font-semibold">{year.entitlement} gün</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Kullanılan:</span>
                      <p className="font-semibold">{year.used} gün</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Devreden:</span>
                      <p className="font-semibold text-blue-600">{year.carryOver} gün</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Süresi Dolan:</span>
                      <p className="font-semibold text-red-600">{year.expired} gün</p>
                    </div>
                  </div>
                  {/* İlerleme Çubuğu */}
                  <div className="mt-3">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{
                          width: `${Math.min((year.used / year.entitlement) * 100, 100)}%`
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* İşlem Geçmişi */}
        {activeTab === 'transactions' && (
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">İşlem Geçmişi</h3>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
              >
                {[0, 1, 2, 3].map(i => {
                  const year = new Date().getFullYear() - i;
                  return (
                    <option key={year} value={year}>{year}</option>
                  );
                })}
              </select>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Tarih</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">İşlem</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Tip</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">Miktar</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">Bakiye</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Açıklama</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((transaction) => (
                    <tr key={transaction.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm">
                        {format(new Date(transaction.transactionDate), 'dd.MM.yyyy')}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`
                          inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
                          ${transaction.transactionType === 'hakkedis' ? 'bg-green-100 text-green-800' :
                            transaction.transactionType === 'kullanim' ? 'bg-blue-100 text-blue-800' :
                            transaction.transactionType === 'devir' ? 'bg-purple-100 text-purple-800' :
                            transaction.transactionType === 'duzeltme' ? 'bg-yellow-100 text-yellow-800' :
                            transaction.transactionType === 'iptal' ? 'bg-gray-100 text-gray-800' :
                            'bg-red-100 text-red-800'}
                        `}>
                          {transaction.transactionType === 'hakkedis' ? 'Hakediş' :
                           transaction.transactionType === 'kullanim' ? 'Kullanım' :
                           transaction.transactionType === 'devir' ? 'Devir' :
                           transaction.transactionType === 'duzeltme' ? 'Düzeltme' :
                           transaction.transactionType === 'iptal' ? 'İptal' :
                           'Süre Dolumu'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm capitalize">
                        {transaction.leaveType === 'yillik' ? 'Yıllık' :
                         transaction.leaveType === 'hastalik' ? 'Hastalık' :
                         transaction.leaveType === 'ucretsiz' ? 'Ücretsiz' :
                         'Diğer'}
                      </td>
                      <td className="py-3 px-4 text-sm text-right font-medium">
                        <span className={transaction.days > 0 ? 'text-green-600' : 'text-red-600'}>
                          {transaction.days > 0 ? '+' : ''}{transaction.days}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-right">
                        {transaction.balanceAfter}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {transaction.description}
                      </td>
                    </tr>
                  ))}
                  {transactions.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-gray-500">
                        Bu yıl için işlem kaydı bulunmuyor
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Detaylı Rapor */}
        {activeTab === 'report' && report && (
          <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Detaylı İzin Raporu</h3>
              <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                <Download className="h-4 w-4" />
                PDF İndir
              </button>
            </div>

            {/* Kullanım Analizi */}
            <div>
              <h4 className="font-medium mb-3">Kullanım Analizi</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Ortalama İzin Süresi</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {report.usageAnalysis.averageDuration} gün
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">En Çok Kullanılan Tip</p>
                  <p className="text-lg font-bold text-gray-900 capitalize">
                    {report.usageAnalysis.mostUsedType === 'yillik' ? 'Yıllık İzin' :
                     report.usageAnalysis.mostUsedType === 'hastalik' ? 'Hastalık İzni' :
                     report.usageAnalysis.mostUsedType}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Yıl Sonu Tahmini Bakiye</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {report.projections.estimatedYearEndBalance} gün
                  </p>
                </div>
              </div>
            </div>

            {/* Tip Bazında Dağılım */}
            <div>
              <h4 className="font-medium mb-3">İzin Tipi Dağılımı</h4>
              <div className="space-y-2">
                {Object.entries(report.usageAnalysis.byType).map(([type, days]) => (
                  <div key={type} className="flex items-center justify-between">
                    <span className="capitalize">
                      {type === 'yillik' ? 'Yıllık İzin' :
                       type === 'hastalik' ? 'Hastalık İzni' :
                       type === 'ucretsiz' ? 'Ücretsiz İzin' :
                       'Diğer'}
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{
                            width: `${Math.min((days / currentBalance?.entitlements.total || 1) * 100, 100)}%`
                          }}
                        />
                      </div>
                      <span className="text-sm font-medium w-12 text-right">{days} gün</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Öneri */}
            {report.projections.recommendedUsage && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-blue-900">Öneri</p>
                    <p className="text-sm text-blue-800 mt-1">
                      {report.projections.recommendedUsage}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
