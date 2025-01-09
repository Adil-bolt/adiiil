import React, { ReactNode } from 'react';
import { X } from 'lucide-react';
import { useModalActions } from '../../hooks/useModalActions';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  showCloseButton?: boolean;
  preventBackgroundClose?: boolean;
  disableEnterKey?: boolean;
}

export default function Modal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  children,
  className = '',
  showCloseButton = true,
  preventBackgroundClose = false,
  disableEnterKey = false
}: ModalProps) {
  const { handleConfirm, handleBackgroundClick } = useModalActions({
    isOpen,
    onClose,
    onConfirm,
    preventBackgroundClose,
    disableEnterKey
  });

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50"
      onClick={handleBackgroundClick}
    >
      <div 
        className={`bg-white rounded-lg shadow-xl ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <div>
            <h3 className="text-lg font-medium text-gray-900">{title}</h3>
            {description && (
              <p className="mt-1 text-sm text-gray-500">{description}</p>
            )}
          </div>
          {showCloseButton && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
        <div className="p-4">
          {children}
        </div>
      </div>
    </div>
  );
}