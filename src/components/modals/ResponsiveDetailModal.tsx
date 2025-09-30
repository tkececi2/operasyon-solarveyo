import React from 'react';
import { platform } from '../../utils/platform';
import { DetailModal } from './DetailModal';
import { MobileDetailModal } from './MobileDetailModal';

// Props are the same for both components
export interface DetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  status?: {
    label: string;
    variant: 'success' | 'warning' | 'error' | 'info' | 'default';
  };
  details: {
    label: string;
    value: string | number | React.ReactNode;
    icon?: React.ComponentType<{ className?: string }>;
    fullWidth?: boolean;
  }[];
  images?: string[];
  actions?: {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary' | 'danger';
    icon?: React.ComponentType<{ className?: string }>;
    disabled?: boolean;
  }[];
}

/**
 * Responsive Detail Modal
 * Mobilde bottom sheet, web'de normal modal olarak görünür
 */
export const ResponsiveDetailModal: React.FC<DetailModalProps> = (props) => {
  // Platform kontrolü yaparak doğru modal'ı render et
  if (platform.isNative()) {
    return <MobileDetailModal {...props} />;
  }
  
  return <DetailModal {...props} />;
};

export default ResponsiveDetailModal;
