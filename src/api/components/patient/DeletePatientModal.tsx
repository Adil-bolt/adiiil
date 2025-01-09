import React from 'react';
import DraggableModal from '../DraggableModal';
import { useModalEnterKey } from '../../hooks/useModalEnterKey';

interface DeletePatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  patientId: string;
  patientName: string;
}

export default function DeletePatientModal({
  isOpen,
  onClose,
  onConfirm,
  patientId,
  patientName
}: DeletePatientModalProps) {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  // Utiliser le hook pour gérer la touche Entrée
  useModalEnterKey({
    isOpen,
    onEnter: handleConfirm,
    onEscape: onClose
  });

  return (
    <DraggableModal isOpen={isOpen} onClose={onClose} title="Supprimer le patient">
      <div className="p-6">
        <div className="text-red-600 mb-4">
          <svg
            className="h-12 w-12 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <div className="text-center mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Êtes-vous sûr de vouloir supprimer ce patient ?
          </h3>
          <p className="text-sm text-gray-600">
            <strong>{patientName}</strong>
          </p>
          <p className="text-sm text-red-600 mt-2">
            Cette action est irréversible. Le patient et tous ses rendez-vous seront définitivement supprimés.
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Appuyez sur Entrée ou Supprimer pour confirmer, ou Échap pour annuler
          </p>
        </div>
        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Annuler
          </button>
          <button
            onClick={handleConfirm}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Supprimer définitivement
          </button>
        </div>
      </div>
    </DraggableModal>
  );
}