/**
 * İzin Detay Modal Komponenti
 */

import React from 'react';
import { X, Calendar, User, FileText, Clock, CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { ILeaveRequest, LEAVE_TYPES, LEAVE_STATUS } from '../../types/leave.types';

interface LeaveDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: ILeaveRequest;
  isManager: boolean;
  onApprove?: (id: string) => void;
  onReject?: (id: string, reason: string) => void;
}

const LeaveDetailsModal: React.FC<LeaveDetailsModalProps> = ({
  isOpen,
  onClose,
  request,
  isManager,
  onApprove,
  onReject
}) => {
  if (!isOpen) return null;

  const leaveType = LEAVE_TYPES[request.leaveType as keyof typeof LEAVE_TYPES];
  const status = LEAVE_STATUS[request.status as keyof typeof LEAVE_STATUS];

  const handleReject = () => {
    const reason = prompt('Red nedeni:');
    if (reason && onReject && request.id) {
      onReject(request.id, reason);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">İzin Talebi Detayları</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Durum Bilgisi */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Durum</p>
                <Badge
                  variant={
                    request.status === 'onaylandi' ? 'success' :
                    request.status === 'reddedildi' ? 'danger' :
                    request.status === 'beklemede' ? 'warning' : 'secondary'
                  }
                  className="text-base"
                >
                  {status?.icon} {status?.label}
                </Badge>
              </div>
              {request.status === 'onaylandi' && request.approverName && (
                <div className="text-right">
                  <p className="text-sm text-gray-600">Onaylayan</p>
                  <p className="font-medium">{request.approverName}</p>
                  <p className="text-xs text-gray-500">
                    {request.approvalDate && !isNaN(new Date(request.approvalDate).getTime()) && 
                      format(new Date(request.approvalDate), 'dd MMM yyyy HH:mm', { locale: tr })}
                  </p>
                </div>
              )}
              {request.status === 'reddedildi' && request.rejectionReason && (
                <div className="text-right">
                  <p className="text-sm text-gray-600">Red Nedeni</p>
                  <p className="text-sm text-red-600">{request.rejectionReason}</p>
                </div>
              )}
            </div>
          </div>

          {/* Personel Bilgileri */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
              <User className="h-4 w-4 mr-2" />
              Personel Bilgileri
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Ad Soyad</p>
                <p className="font-medium">{request.userName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Pozisyon</p>
                <p className="font-medium">{request.userRole}</p>
              </div>
            </div>
          </div>

          {/* İzin Detayları */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
              <Calendar className="h-4 w-4 mr-2" />
              İzin Detayları
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">İzin Tipi</p>
                <p className="font-medium flex items-center">
                  {leaveType?.icon} {leaveType?.label}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Toplam Gün</p>
                <p className="font-medium">{request.totalDays} gün</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Başlangıç Tarihi</p>
                <p className="font-medium">
                  {request.startDate && !isNaN(new Date(request.startDate).getTime()) ?
                    format(new Date(request.startDate), 'dd MMMM yyyy, EEEE', { locale: tr }) :
                    'Geçersiz tarih'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Bitiş Tarihi</p>
                <p className="font-medium">
                  {request.endDate && !isNaN(new Date(request.endDate).getTime()) ?
                    format(new Date(request.endDate), 'dd MMMM yyyy, EEEE', { locale: tr }) :
                    'Geçersiz tarih'}
                </p>
              </div>
            </div>
          </div>

          {/* İzin Nedeni */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
              <FileText className="h-4 w-4 mr-2" />
              İzin Nedeni
            </h3>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-sm text-gray-700">{request.reason}</p>
            </div>
          </div>

          {/* Yerine Bakacak Kişi */}
          {request.substituteUserName && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                <User className="h-4 w-4 mr-2" />
                Yerine Bakacak Kişi
              </h3>
              <p className="font-medium">{request.substituteUserName}</p>
            </div>
          )}

          {/* Ek Notlar */}
          {request.notes && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">Ek Notlar</h3>
              <div className="bg-yellow-50 rounded-lg p-3">
                <p className="text-sm text-gray-700">{request.notes}</p>
              </div>
            </div>
          )}

          {/* Talep Tarihi */}
          <div className="pt-4 border-t border-gray-200">
            <div className="flex items-center text-sm text-gray-500">
              <Clock className="h-4 w-4 mr-2" />
              Talep Tarihi: {
                request.createdAt ? 
                  (request.createdAt.toDate ? 
                    format(request.createdAt.toDate(), 'dd MMMM yyyy HH:mm', { locale: tr }) :
                    (!isNaN(new Date(request.createdAt).getTime()) ?
                      format(new Date(request.createdAt), 'dd MMMM yyyy HH:mm', { locale: tr }) :
                      'Geçersiz tarih')
                  ) : 
                  'Bilinmiyor'
              }
            </div>
          </div>

          {/* Yönetici Aksiyonları */}
          {isManager && request.status === 'beklemede' && (
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <Button
                variant="outline"
                onClick={handleReject}
                className="flex items-center"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Reddet
              </Button>
              <Button
                onClick={() => {
                  if (onApprove && request.id) {
                    onApprove(request.id);
                    onClose();
                  }
                }}
                className="flex items-center"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Onayla
              </Button>
            </div>
          )}

          {/* Kapatma Butonu */}
          {(!isManager || request.status !== 'beklemede') && (
            <div className="flex justify-end pt-4 border-t border-gray-200">
              <Button variant="outline" onClick={onClose}>
                Kapat
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LeaveDetailsModal;
