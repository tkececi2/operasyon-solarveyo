/**
 * İzin Bakiyesi Düzenleme Modal'ı
 * Yöneticiler için kullanıcıların izin haklarını düzenleme
 */

import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { toast } from 'react-hot-toast';
import { updateLeaveBalanceManual, getLeaveBalance } from '../../services/leaveService';
import { User } from '../../types';
import { ILeaveBalance } from '../../types/leave.types';

interface LeaveBalanceEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: (User | any) | null;  // any tipi balance objesi için
  userProfile: User;
  year: number;
  onUpdate: () => void;
}

export const LeaveBalanceEditModal: React.FC<LeaveBalanceEditModalProps> = ({
  isOpen,
  onClose,
  user,
  userProfile,
  year,
  onUpdate
}) => {
  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState<ILeaveBalance | null>(null);
  const [formData, setFormData] = useState({
    annualLeaveTotal: 14,
    sickLeaveTotal: 10,
    carryOverDays: 0
  });

  useEffect(() => {
    if (user && isOpen) {
      loadBalance();
    }
  }, [user, isOpen, year]);

  const loadBalance = async () => {
    if (!user) return;
    
    try {
      // user objesi balance objesi olabilir
      const userId = user.userId || user.id || user.uid;
      
      if (!userId) {
        console.error('Kullanıcı ID bulunamadı');
        return;
      }
      
      const data = await getLeaveBalance(userId, year);
      if (data) {
        setBalance(data);
        setFormData({
          annualLeaveTotal: data.annualLeaveTotal || 14,
          sickLeaveTotal: data.sickLeaveTotal || 10,
          carryOverDays: data.carryOverDays || 0
        });
      }
    } catch (error) {
      console.error('Bakiye yüklenemedi:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      // user objesi balance objesi olabilir
      const userId = user.userId || user.id || user.uid;
      
      if (!userId) {
        throw new Error('Kullanıcı ID bulunamadı');
      }
      
      await updateLeaveBalanceManual(
        userId,
        year,
        formData,
        userProfile
      );
      
      toast.success('İzin bakiyesi güncellendi');
      onUpdate();
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Bakiye güncellenemedi');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">
            İzin Bakiyesi Düzenle - {user.userName || user.name || user.displayName || user.email}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Yıllık İzin Hakkı (Gün)
            </label>
            <Input
              type="number"
              min="0"
              max="365"
              value={formData.annualLeaveTotal}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                annualLeaveTotal: parseInt(e.target.value) || 0
              }))}
              required
            />
            {balance && (
              <p className="text-xs text-gray-500 mt-1">
                Kullanılan: {balance.annualLeaveUsed} gün
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Hastalık İzni Hakkı (Gün)
            </label>
            <Input
              type="number"
              min="0"
              max="365"
              value={formData.sickLeaveTotal}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                sickLeaveTotal: parseInt(e.target.value) || 0
              }))}
              required
            />
            {balance && (
              <p className="text-xs text-gray-500 mt-1">
                Kullanılan: {balance.sickLeaveUsed} gün
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Devreden İzin (Gün)
            </label>
            <Input
              type="number"
              min="0"
              max="365"
              value={formData.carryOverDays}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                carryOverDays: parseInt(e.target.value) || 0
              }))}
            />
            <p className="text-xs text-gray-500 mt-1">
              Geçen yıldan devreden izin günleri
            </p>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={loading}
            >
              İptal
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex items-center"
            >
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Kaydediliyor...' : 'Kaydet'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
