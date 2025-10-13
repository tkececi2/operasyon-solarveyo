import React from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { Button } from '../ui';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md'
}) => {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl'
  };

  const modalContent = (
    <>
      <div
        className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
        style={{ zIndex: 9998 }}
        aria-hidden="true"
        onClick={onClose}
      />

      <div 
        className="fixed inset-0 overflow-y-auto"
        style={{ zIndex: 9999 }}
      >
        <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
          <div 
            className={`inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle ${sizeClasses[size]} w-full`}
            role="dialog"
            aria-modal="true"
          >
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {title}
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  aria-label="Kapat"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="mt-2">
                {children}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : null;
};
