/**
 * İzin Talebi Modal Komponenti
 */

import React, { useState, useEffect } from 'react';
import { X, Calendar, FileText, Users } from 'lucide-react';
import { format, differenceInDays, addDays } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import Select from '../ui/Select';
import { LEAVE_TYPES } from '../../types/leave.types';
import { createLeaveRequest } from '../../services/leaveService';
import { getSubstituteUsers } from '../../services/userService';
import { User } from '../../types';
import toast from 'react-hot-toast';

interface LeaveRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  userProfile: User;
}

const LeaveRequestModal: React.FC<LeaveRequestModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  userProfile
}) => {
  const [formData, setFormData] = useState({
    leaveType: 'yillik',
    startDate: format(new Date(), 'yyyy-MM-dd'),
    endDate: format(addDays(new Date(), 1), 'yyyy-MM-dd'),
    reason: '',
    substituteUserId: '',
    notes: ''
  });
  const [totalDays, setTotalDays] = useState(1);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadUsers();
    }
  }, [isOpen]);

  useEffect(() => {
    // Gün sayısını hesapla
    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    const days = differenceInDays(end, start) + 1;
    setTotalDays(days > 0 ? days : 1);
  }, [formData.startDate, formData.endDate]);

  const loadUsers = async () => {
    try {
      // Rol ve saha bazlı yerine bakacak kişileri getir
      const substituteUsers = await getSubstituteUsers(
        userProfile.companyId,
        userProfile.id || userProfile.uid,
        userProfile.rol,
        userProfile.sahalar as string[] | undefined
      );
      setUsers(substituteUsers);
    } catch (error) {
      console.error('Kullanıcılar yüklenemedi:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.reason.trim()) {
      toast.error('Lütfen izin nedenini belirtin');
      return;
    }

    if (totalDays <= 0) {
      toast.error('Geçerli bir tarih aralığı seçin');
      return;
    }

    setLoading(true);
    try {
      const substituteUser = users.find(u => u.id === formData.substituteUserId);
      
      await createLeaveRequest({
        userId: userProfile.id || userProfile.uid,
        userName: userProfile.name || userProfile.displayName || userProfile.email || 'İsimsiz Kullanıcı',
        userRole: userProfile.rol || 'muhendis',
        companyId: userProfile.companyId,
        leaveType: formData.leaveType as any,
        startDate: formData.startDate,
        endDate: formData.endDate,
        totalDays,
        reason: formData.reason,
        substituteUserId: formData.substituteUserId || undefined,
        substituteUserName: substituteUser?.name || undefined,
        notes: formData.notes || undefined
      }, userProfile);

      toast.success('İzin talebiniz oluşturuldu');
      onSubmit();
    } catch (error: any) {
      toast.error(error.message || 'İzin talebi oluşturulamadı');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Yeni İzin Talebi</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* İzin Tipi */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              İzin Tipi
            </label>
            <Select
              value={formData.leaveType}
              onChange={(e) => setFormData({ ...formData, leaveType: e.target.value })}
              required
            >
              {Object.entries(LEAVE_TYPES).map(([key, value]) => (
                <option key={key} value={key}>
                  {value.icon} {value.label}
                </option>
              ))}
            </Select>
          </div>

          {/* Tarih Aralığı */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Calendar className="h-4 w-4 inline mr-1" />
                Başlangıç Tarihi
              </label>
              <Input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                min={format(new Date(), 'yyyy-MM-dd')}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Calendar className="h-4 w-4 inline mr-1" />
                Bitiş Tarihi
              </label>
              <Input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                min={formData.startDate}
                required
              />
            </div>
          </div>

          {/* Toplam Gün */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              <strong>Toplam İzin Süresi:</strong> {totalDays} gün
            </p>
          </div>

          {/* İzin Nedeni */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <FileText className="h-4 w-4 inline mr-1" />
              İzin Nedeni
            </label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              placeholder="İzin talebinizin nedenini açıklayın..."
              required
            />
          </div>

          {/* Yerine Bakacak Kişi */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Users className="h-4 w-4 inline mr-1" />
              Yerine Bakacak Kişi (Opsiyonel)
              {userProfile.rol === 'bekci' && (
                <span className="text-xs text-gray-500 ml-2">(Aynı sahadaki bekçiler)</span>
              )}
              {userProfile.rol === 'tekniker' && (
                <span className="text-xs text-gray-500 ml-2">(Aynı sahadaki teknikerler)</span>
              )}
              {userProfile.rol === 'muhendis' && (
                <span className="text-xs text-gray-500 ml-2">(Diğer mühendisler)</span>
              )}
            </label>
            <Select
              value={formData.substituteUserId}
              onChange={(e) => setFormData({ ...formData, substituteUserId: e.target.value })}
            >
              <option value="">Seçiniz...</option>
              {users.length === 0 ? (
                <option value="" disabled>Uygun personel bulunamadı</option>
              ) : (
                users.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.name || user.displayName || user.email} - {user.rol}
                    {user.sahalar && user.sahalar.length > 0 && (
                      ` (${user.sahalar.length} saha)`
                    )}
                  </option>
                ))
              )}
            </Select>
          </div>

          {/* Ek Notlar */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ek Notlar (Opsiyonel)
            </label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={2}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Varsa ek notlarınız..."
            />
          </div>

          {/* Butonlar */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              İptal
            </Button>
            <Button
              type="submit"
              disabled={loading}
            >
              {loading ? 'Gönderiliyor...' : 'Talep Oluştur'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LeaveRequestModal;
