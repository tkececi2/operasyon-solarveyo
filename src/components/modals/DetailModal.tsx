import React from 'react';
import { X, Calendar, User, MapPin, Camera } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { formatDate } from '../../utils/formatters';

interface DetailItem {
  label: string;
  value: string | number | React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  fullWidth?: boolean;
}

interface DetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  status?: {
    label: string;
    variant: 'success' | 'warning' | 'error' | 'info' | 'default';
  };
  details: DetailItem[];
  images?: string[];
  actions?: {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary' | 'danger';
    disabled?: boolean;
  }[];
}

export const DetailModal: React.FC<DetailModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  status,
  details,
  images = [],
  actions = []
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="" size="lg">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <h3 className="text-xl font-semibold text-gray-900">
                {title}
              </h3>
              {status && (
                <Badge variant={status.variant}>
                  {status.label}
                </Badge>
              )}
            </div>
            {subtitle && (
              <p className="text-gray-600 text-sm">
                {subtitle}
              </p>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="p-2"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {details.map((detail, index) => (
            <div 
              key={index} 
              className={`${detail.fullWidth ? 'md:col-span-2' : ''}`}
            >
              <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                {detail.icon && (
                  <detail.icon className="w-5 h-5 text-gray-500 mt-0.5 flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <dt className="text-sm font-medium text-gray-600 mb-1">
                    {detail.label}
                  </dt>
                  <dd className="text-sm text-gray-900 break-words">
                    {detail.value}
                  </dd>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Images */}
        {images.length > 0 && (
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
              <Camera className="w-4 h-4 mr-2" />
              Fotoğraflar ({images.length})
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {images.map((image, index) => (
                <div key={index} className="aspect-square">
                  <img
                    src={image}
                    alt={`Fotoğraf ${index + 1}`}
                    className="w-full h-full object-cover rounded-lg border border-gray-200 hover:border-gray-300 transition-colors cursor-pointer"
                    onClick={() => {
                      // Fotoğrafı büyük boyutta göstermek için modal açılabilir
                      window.open(image, '_blank');
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        {actions.length > 0 && (
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            {actions.map((action, index) => (
              <Button
                key={index}
                variant={action.variant || 'secondary'}
                onClick={action.onClick}
                disabled={action.disabled}
              >
                {action.label}
              </Button>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
};
