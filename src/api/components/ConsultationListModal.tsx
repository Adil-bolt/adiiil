import React from 'react';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import DraggableModal from './DraggableModal';

interface ConsultationListModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: {
    nom: string;
    prenom: string;
    consultations?: Array<{
      id: string;
      date: string;
      ficheNumber: string;
      type: string;
    }>;
  };
}

export default function ConsultationListModal({
  isOpen,
  onClose,
  patient
}: ConsultationListModalProps) {
  if (!patient.consultations) {
    return null;
  }

  return (
    <DraggableModal
      isOpen={isOpen}
      onClose={onClose}
      title="Liste des consultations"
      className="w-full max-w-3xl"
    >
      <div className="space-y-4">
        <div className="text-lg font-medium text-gray-900 mb-4">
          {patient.nom} {patient.prenom}
          <span className="ml-2 text-sm text-gray-500">
            ({patient.consultations.length} consultation{patient.consultations.length > 1 ? 's' : ''})
          </span>
        </div>

        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
          <table className="min-w-full divide-y divide-gray-300">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Type</th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Date</th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Heure</th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Fiche N°</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {patient.consultations.map((consultation, index) => (
                <tr key={`${consultation.id}-${index}`} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                    {consultation.type}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {format(parseISO(consultation.date), 'dd/MM/yyyy', { locale: fr })}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {format(parseISO(consultation.date), 'HH:mm', { locale: fr })}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {consultation.ficheNumber}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DraggableModal>
  );
}