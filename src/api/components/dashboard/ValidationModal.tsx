import React from 'react';
import Modal from '../modals/Modal';

interface ValidationModalProps {
  isOpen: boolean;
  onClose: () => void;
  message?: string;
}

export default function ValidationModal({ isOpen, onClose, message }: ValidationModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Validation requise"
      description={message || "Un numéro de fiche patient est requis (format FXX-XXXX) pour un rendez-vous validé"}
    >
      <div className="mt-4 sm:flex sm:flex-row-reverse">
        <button
          type="button"
          className="w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:w-auto"
          onClick={onClose}
        >
          Fermer
        </button>
      </div>
    </Modal>
  );
}