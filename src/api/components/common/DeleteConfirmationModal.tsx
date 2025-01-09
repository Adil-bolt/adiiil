import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { useModalEnterKey } from '../../hooks/useModalEnterKey';
import BaseModal from '../modals/BaseModal';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
}

export default function DeleteConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message
}: DeleteConfirmationModalProps) {
  useModalEnterKey({
    isOpen,
    onEnter: onConfirm,
    onEscape: onClose
  });

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      className="w-full max-w-md"
    >
      <div className="flex items-center space-x-3 p-4 bg-red-50 rounded-lg">
        <AlertTriangle className="h-6 w-6 text-red-600" />
        <p className="text-sm text-red-700">{message}</p>
      </div>

      <div className="flex justify-end space-x-3 mt-6">
        <button
          onClick={onClose}
          className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Annuler
        </button>
        <button
          onClick={onConfirm}
          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
        >
          Supprimer
        </button>
      </div>
    </BaseModal>
  );
}