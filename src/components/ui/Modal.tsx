import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { Button } from './Button';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showCloseButton?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showCloseButton = true,
}) => {
  // Escape key ile kapatma
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-4xl w-full mx-8',
  };

  const modalContent = (
    <>
      {/* Backdrop - Ayrı bir portal olarak */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        style={{ zIndex: 9998 }}
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Modal - Backdrop'un üstünde ayrı bir layer */}
      <div 
        className="fixed inset-0 overflow-y-auto"
        style={{ zIndex: 9999 }}
      >
        <div className="flex min-h-full items-center justify-center p-4">
          <div 
            className={`relative w-full ${sizeClasses[size]} transform overflow-hidden rounded-lg bg-white shadow-xl transition-all`}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            {(title || showCloseButton) && (
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  {title}
                </h3>
                {showCloseButton && (
                  <button
                    onClick={onClose}
                    className="rounded-md p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                    aria-label="Kapat"
                  >
                    <X className="h-5 w-5" />
                  </button>
                )}
              </div>
            )}
            <div className={`${size === 'full' ? 'p-4' : 'p-6'} max-h-[calc(100vh-200px)] overflow-y-auto pb-20 md:pb-6`}>
              {children}
            </div>
          </div>
        </div>
      </div>
    </>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : null;
};

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Onayla',
  cancelText = 'İptal',
  type = 'danger',
}) => {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className="space-y-4">
        <p className="text-gray-600">{message}</p>
        
        <div className="flex gap-3 justify-end">
          <Button variant="ghost" onClick={onClose}>
            {cancelText}
          </Button>
          <Button 
            variant={type === 'danger' ? 'danger' : 'primary'}
            onClick={handleConfirm}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
