/**
 * Manuel İzin Kayıt Modal'ı
 * Yöneticiler için geçmişe dönük izin kaydı ekleme
 */

import React, { useState, useEffect } from 'react';
import { X, Save, Calendar, AlertCircle, User, FileText } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { toast } from 'react-hot-toast';
import { format, differenceInDays } from 'date-fns';
import { tr } from 'date-fns/locale';
import { LEAVE_TYPES } from '../../types/leave.types';
import { createManualLeaveEntry, updateLeaveBalance } from '../../services/leaveService';
import { User as UserType } from '../../types';
import { getCompanyUsers } from '../../services/userService';

interface ManualLeaveEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserType;
  selectedYear: number;
  onSuccess: () => void;
  preSelectedUser?: any; // Eğer belirli bir kullanıcı için açılıyorsa
}

export const ManualLeaveEntryModal: React.FC<ManualLeaveEntryModalProps> = ({
  isOpen,
  onClose,
  userProfile,
  selectedYear,
  onSuccess,
  preSelectedUser
}) => {
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<UserType[]>([]);
  const [formData, setFormData] = useState({
    userId: preSelectedUser?.userId || '',
    userName: preSelectedUser?.userName || '',
    leaveType: 'yillik' as keyof typeof LEAVE_TYPES,
    startDate: '',
    endDate: '',
    totalDays: 0,
    reason: 'Sonradan eklenen izin kaydı',
    status: 'onaylandi', // Direkt onaylı olarak ekle
    notes: '',
    deductFromBalance: true // Bakiyeden düşülsün mü?
  });

  useEffect(() => {
    if (isOpen && userProfile.companyId) {
      loadUsers();
    }
  }, [isOpen, userProfile.companyId]);

  useEffect(() => {
    // Tarihler değiştiğinde gün sayısını hesapla
    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      const days = differenceInDays(end, start) + 1;
      setFormData(prev => ({ ...prev, totalDays: Math.max(0, days) }));
    }
  }, [formData.startDate, formData.endDate]);

  const loadUsers = async () => {
    try {
      const companyUsers = await getCompanyUsers(userProfile.companyId);
      setUsers(companyUsers);
    } catch (error) {
      console.error('Kullanıcılar yüklenemedi:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.userId) {
      toast.error('Lütfen personel seçin');
      return;
    }
    
    if (!formData.startDate || !formData.endDate) {
      toast.error('Lütfen tarih aralığı seçin');
      return;
    }
    
    if (formData.totalDays <= 0) {
      toast.error('Geçersiz tarih aralığı');
      return;
    }

    // Seçilen yıl kontrolü
    const startYear = new Date(formData.startDate).getFullYear();
    const endYear = new Date(formData.endDate).getFullYear();
    
    if (startYear !== selectedYear || endYear !== selectedYear) {
      toast.error(`Tarihler ${selectedYear} yılına ait olmalıdır`);
      return;
    }

    setLoading(true);
    try {
      // Manuel izin kaydı oluştur
      await createManualLeaveEntry({
        ...formData,
        companyId: userProfile.companyId
      }, userProfile);

      // Bakiyeden düşülecekse güncelle
      if (formData.deductFromBalance && formData.leaveType === 'yillik') {
        await updateLeaveBalance(
          formData.userId,
          selectedYear,
          formData.leaveType,
          formData.totalDays,
          'use' // Kullanım olarak işaretle
        );
      }

      toast.success('İzin kaydı başarıyla eklendi');
      onSuccess();
      handleClose();
    } catch (error: any) {
      console.error('İzin kaydı eklenemedi:', error);
      toast.error(error.message || 'İzin kaydı eklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      userId: '',
      userName: '',
      leaveType: 'yillik',
      startDate: '',
      endDate: '',
      totalDays: 0,
      reason: 'Sonradan eklenen izin kaydı',
      status: 'onaylandi',
      notes: '',
      deductFromBalance: true
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold">Manuel İzin Kaydı Ekle</h2>
            <p className="text-sm text-gray-600 mt-1">
              Geçmişe dönük izin kaydı oluştur ({selectedYear})
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Uyarı */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-amber-900">Dikkat!</p>
                <p className="text-amber-800 mt-1">
                  Bu işlem geçmişe dönük izin kaydı oluşturacaktır. 
                  Kayıt sonradan eklenmiş olarak işaretlenecektir.
                </p>
              </div>
            </div>
          </div>

          {/* Personel Seçimi */}
          {!preSelectedUser && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <User className="inline h-4 w-4 mr-1" />
                Personel
              </label>
              <select
                value={formData.userId}
                onChange={(e) => {
                  const user = users.find(u => u.uid === e.target.value);
                  setFormData(prev => ({
                    ...prev,
                    userId: e.target.value,
                    userName: user?.displayName || user?.email || ''
                  }));
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Personel Seçin</option>
                {users.map(user => (
                  <option key={user.uid} value={user.uid}>
                    {user.displayName || user.email} - {user.position || 'Pozisyon belirtilmemiş'}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* İzin Tipi */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              İzin Tipi
            </label>
            <select
              value={formData.leaveType}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                leaveType: e.target.value as keyof typeof LEAVE_TYPES 
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {Object.entries(LEAVE_TYPES).map(([key, value]) => (
                <option key={key} value={key}>
                  {value.icon} {value.label}
                </option>
              ))}
            </select>
          </div>

          {/* Tarih Aralığı */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Calendar className="inline h-4 w-4 mr-1" />
                Başlangıç Tarihi
              </label>
              <Input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                max={format(new Date(), 'yyyy-MM-dd')}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Calendar className="inline h-4 w-4 mr-1" />
                Bitiş Tarihi
              </label>
              <Input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                max={format(new Date(), 'yyyy-MM-dd')}
                min={formData.startDate}
                required
              />
            </div>
          </div>

          {/* Gün Sayısı */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Toplam Gün
            </label>
            <Input
              type="number"
              value={formData.totalDays}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                totalDays: parseInt(e.target.value) || 0 
              }))}
              min="1"
              required
              className="bg-gray-50"
            />
          </div>

          {/* Açıklama */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <FileText className="inline h-4 w-4 mr-1" />
              Açıklama
            </label>
            <textarea
              value={formData.reason}
              onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="İzin açıklaması..."
              required
            />
          </div>

          {/* Notlar */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ek Notlar (Opsiyonel)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Varsa ek notlar..."
            />
          </div>

          {/* Bakiyeden Düşülsün mü? */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="deductFromBalance"
              checked={formData.deductFromBalance}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                deductFromBalance: e.target.checked 
              }))}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="deductFromBalance" className="text-sm text-gray-700">
              İzin bakiyesinden düşülsün
              <span className="text-xs text-gray-500 ml-1">
                (İşaretlenirse kullanılan izin olarak kaydedilir)
              </span>
            </label>
          </div>

          {/* Butonlar */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              İptal
            </Button>
            <Button
              type="submit"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                  Kaydediliyor...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Kaydet
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
