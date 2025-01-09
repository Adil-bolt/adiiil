import React, { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { usePatientDeletion } from '../../hooks/usePatientDeletion';
import { useModalForm } from '../../hooks/useModalForm';
import BaseModal from '../modals/BaseModal';
import PasswordInput from '../common/PasswordInput';

interface DeletePatientConfirmationProps {
  isOpen: boolean;
  onClose: () => void;
  patientId: string;
  patientName: string;
  onSuccess?: () => void;
}

export default function DeletePatientConfirmation({
  isOpen,
  onClose,
  patientId,
  patientName,
  onSuccess
}: DeletePatientConfirmationProps) {
  const [error, setError] = useState('');
  const { deletePatient } = usePatientDeletion();

  const handleConfirm = () => {
    const result = deletePatient(patientId);
    if (result.success) {
      onSuccess?.();
      onClose();
    } else {
      setError(result.message || 'Une erreur est survenue');
    }
  };

  const { handleSubmit } = useModalForm({
    isOpen,
    onClose,
    onSubmit: handleConfirm
  });

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={handleConfirm}
      title="Confirmation de suppression"
      className="w-full max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-center mb-4 text-yellow-700 bg-yellow-50 p-4 rounded-md">
          <AlertTriangle className="h-5 w-5 mr-2" />
          <p>
            Vous êtes sur le point de supprimer définitivement le patient <strong>{patientName}</strong>.
            Cette action est irréversible.
          </p>
        </div>

        <PasswordInput
          label="Mot de passe administrateur"
          required
          autoFocus
          onValidPassword={handleConfirm}
        />

        {error && (
          <div className="text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Annuler
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Supprimer
          </button>
        </div>
      </form>
    </BaseModal>
  );
}