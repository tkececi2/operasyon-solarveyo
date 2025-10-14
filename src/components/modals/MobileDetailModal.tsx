import React, { useEffect, useState } from 'react';
import { X, Calendar, User, MapPin, Camera, ChevronDown, Share, Edit, Trash2 } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { platform } from '../../utils/platform';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { createPortal } from 'react-dom';

interface DetailItem {
  label: string;
  value: string | number | React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  fullWidth?: boolean;
}

interface MobileDetailModalProps {
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
    icon?: React.ComponentType<{ className?: string }>;
    disabled?: boolean;
  }[];
}

export const MobileDetailModal: React.FC<MobileDetailModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  status,
  details,
  images = [],
  actions = []
}) => {
  const [isClosing, setIsClosing] = useState(false);
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Body scroll kilidi (iOS sabitlenme ve görünüm sorunları için kritik)
  useEffect(() => {
    if (isOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && platform.isNative()) {
      // Open haptic
      Haptics.impact({ style: ImpactStyle.Light });
    }
  }, [isOpen]);

  const handleClose = async () => {
    if (platform.isNative()) {
      await Haptics.impact({ style: ImpactStyle.Light });
    }
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
      setDragY(0);
    }, 300);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setStartY(e.touches[0].clientY);
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const currentY = e.touches[0].clientY;
    const diff = currentY - startY;
    if (diff > 0) {
      setDragY(diff);
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    if (dragY > 100) {
      handleClose();
    } else {
      setDragY(0);
    }
  };

  if (!isOpen && !isClosing) return null;

  const getStatusColor = (variant: string) => {
    switch (variant) {
      case 'success': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'warning': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'error': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'info': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const modalContent = (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-[9998] transition-opacity duration-300 ${
          isClosing ? 'opacity-0' : 'opacity-100'
        }`}
        onClick={handleClose}
      />
      
      {/* Modal Sheet */}
      <div 
        className={`fixed inset-x-0 bottom-0 z-[9999] transition-transform duration-300 ${
          isClosing ? 'translate-y-full' : 'translate-y-0'
        }`}
        style={{
          transform: `translateY(${isClosing ? '100%' : dragY + 'px'})`,
          maxHeight: '90vh'
        }}
      >
        <div className="bg-white dark:bg-gray-900 rounded-t-3xl shadow-2xl overflow-hidden">
          {/* Drag Handle */}
          <div 
            className="sticky top-0 z-10 bg-white dark:bg-gray-900 px-4 py-3 border-b border-gray-100 dark:border-gray-800"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <div className="w-12 h-1 bg-gray-300 dark:bg-gray-700 rounded-full mx-auto mb-3" />
            
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center flex-wrap gap-2 mb-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {title}
                  </h3>
                  {status && (
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(status.variant)}`}>
                      {status.label}
                    </span>
                  )}
                </div>
                {subtitle && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {subtitle}
                  </p>
                )}
              </div>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="overflow-y-auto" style={{ maxHeight: 'calc(90vh - 100px)' }}>
            <div className="px-4 py-4 space-y-4">
              {/* Quick Actions (if available) */}
              {actions.length > 0 && actions.length <= 3 && (
                <div className="grid grid-cols-3 gap-2">
                  {actions.slice(0, 3).map((action, index) => (
                    <button
                      key={index}
                      onClick={async () => {
                        await Haptics.impact({ style: ImpactStyle.Light });
                        action.onClick();
                      }}
                      disabled={action.disabled}
                      className={`p-3 rounded-xl flex flex-col items-center justify-center space-y-1 transition-all ${
                        action.variant === 'danger' 
                          ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 active:scale-95'
                          : action.variant === 'primary'
                          ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 active:scale-95'
                          : 'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 active:scale-95'
                      } ${action.disabled ? 'opacity-50' : ''}`}
                    >
                      {action.icon && <action.icon className="w-5 h-5" />}
                      <span className="text-xs font-medium">{action.label}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Details */}
              <div className="space-y-3">
                {details.map((detail, index) => (
                  <div 
                    key={index}
                    className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3"
                  >
                    <div className="flex items-start space-x-3">
                      {detail.icon && (
                        <div className="w-8 h-8 bg-white dark:bg-gray-700 rounded-lg flex items-center justify-center flex-shrink-0">
                          <detail.icon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <dt className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-0.5">
                          {detail.label}
                        </dt>
                        <dd className="text-sm text-gray-900 dark:text-white font-medium break-words">
                          {detail.value}
                        </dd>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Images */}
              {images.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                    <Camera className="w-4 h-4 mr-2 text-gray-500" />
                    Fotoğraflar ({images.length})
                  </h4>
                  <div className="grid grid-cols-3 gap-2">
                    {images.map((image, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedImage(image)}
                        className="aspect-square relative overflow-hidden rounded-lg border-2 border-gray-200 dark:border-gray-700 active:scale-95 transition-transform"
                      >
                        <img
                          src={image}
                          alt={`Fotoğraf ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* More Actions */}
              {actions.length > 3 && (
                <div className="space-y-2 pt-2">
                  {actions.slice(3).map((action, index) => (
                    <button
                      key={index}
                      onClick={async () => {
                        await Haptics.impact({ style: ImpactStyle.Light });
                        action.onClick();
                      }}
                      disabled={action.disabled}
                      className={`w-full p-3 rounded-xl flex items-center justify-center space-x-2 transition-all font-medium ${
                        action.variant === 'danger' 
                          ? 'bg-red-500 text-white active:bg-red-600'
                          : action.variant === 'primary'
                          ? 'bg-blue-500 text-white active:bg-blue-600'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 active:bg-gray-200 dark:active:bg-gray-700'
                      } ${action.disabled ? 'opacity-50' : ''}`}
                    >
                      {action.icon && <action.icon className="w-5 h-5" />}
                      <span>{action.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Bottom Safe Area */}
            <div style={{ paddingBottom: 'env(safe-area-inset-bottom)' }} className="h-4" />
          </div>
        </div>
      </div>

      {/* Image Viewer */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-[10000] bg-black flex items-center justify-center"
          onClick={() => setSelectedImage(null)}
        >
          <img
            src={selectedImage}
            alt="Büyük görünüm"
            className="max-w-full max-h-full object-contain"
          />
          <button
            onClick={() => setSelectedImage(null)}
            className="absolute top-4 right-4 p-2 bg-white/10 backdrop-blur rounded-full"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>
      )}
    </>
  );

  // React Portal: iOS'ta fixed pozisyonlanan elemanların transformlu atalardan etkilenmemesi için önemli
  return createPortal(modalContent, document.body);
};
