import React from 'react';
import { AlertTriangle, CheckCircle, Info, XCircle } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  type?: 'danger' | 'warning' | 'info' | 'success';
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  type = 'danger',
  confirmText = 'Onayla',
  cancelText = 'İptal',
  isLoading = false
}) => {
  const iconMap = {
    danger: XCircle,
    warning: AlertTriangle,
    info: Info,
    success: CheckCircle
  };

  const colorMap = {
    danger: {
      icon: 'text-red-600',
      bg: 'bg-red-50',
      button: 'bg-red-600 hover:bg-red-700 text-white'
    },
    warning: {
      icon: 'text-yellow-600',
      bg: 'bg-yellow-50',
      button: 'bg-yellow-600 hover:bg-yellow-700 text-white'
    },
    info: {
      icon: 'text-blue-600',
      bg: 'bg-blue-50',
      button: 'bg-blue-600 hover:bg-blue-700 text-white'
    },
    success: {
      icon: 'text-green-600',
      bg: 'bg-green-50',
      button: 'bg-green-600 hover:bg-green-700 text-white'
    }
  };

  const Icon = iconMap[type];
  const colors = colorMap[type];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="">
      <div className="p-6">
        <div className="flex items-center mb-4">
          <div className={`p-3 rounded-full ${colors.bg} mr-4`}>
            <Icon className={`w-6 h-6 ${colors.icon}`} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {title}
            </h3>
          </div>
        </div>

        <div className="mb-6">
          <p className="text-gray-700 text-sm leading-relaxed">
            {message}
          </p>
        </div>

        <div className="flex justify-end space-x-3">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            {cancelText}
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isLoading}
            className={colors.button}
          >
            {isLoading ? 'Yükleniyor...' : confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
