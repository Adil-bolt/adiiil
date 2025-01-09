import React from 'react';
import { AlertTriangle } from 'lucide-react';
import Modal from './Modal';

interface ValidationModalProps {
  isOpen: boolean;
  onClose: () => void;
  message: string;
}

export default function ValidationModal({ isOpen, onClose, message }: ValidationModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onClose}
      title="Validation requise"
      className="w-full max-w-md"
    >
      <div className="flex items-center space-x-3 p-4 bg-yellow-50 rounded-lg">
        <AlertTriangle className="h-6 w-6 text-yellow-600" />
        <p className="text-sm text-yellow-700">{message}</p>
      </div>

      <div className="flex justify-end mt-6">
        <button
          onClick={onClose}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          Compris
        </button>
      </div>
    </Modal>
  );
}