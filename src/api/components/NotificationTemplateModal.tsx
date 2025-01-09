import React, { useState, useEffect } from 'react';
import { MessageSquare } from 'lucide-react';
import DraggableModal from './DraggableModal';

interface Template {
  id?: string;
  name: string;
  content: string;
  isActive: boolean;
  sendHoursBefore: number;
  variables?: string[];
}

interface NotificationTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (template: Template) => void;
  template: Template | null;
}

const variablesList = [
  { id: 'patientName', label: 'Nom du patient', example: '{patientName}' },
  { id: 'appointmentDate', label: 'Date du rendez-vous', example: '{appointmentDate}' },
  { id: 'appointmentTime', label: 'Heure du rendez-vous', example: '{appointmentTime}' },
  { id: 'doctorName', label: 'Nom du médecin', example: '{doctorName}' },
  { id: 'clinicName', label: 'Nom de la clinique', example: '{clinicName}' },
  { id: 'patientPhone', label: 'Téléphone du patient', example: '{patientPhone}' },
  { id: 'appointmentType', label: 'Type de rendez-vous', example: '{appointmentType}' },
  { id: 'patientCIN', label: 'CIN du patient', example: '{patientCIN}' },
  { id: 'patientMutuelle', label: 'Mutuelle du patient', example: '{patientMutuelle}' }
];

const NotificationTemplateModal: React.FC<NotificationTemplateModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  template
}) => {
  const [formData, setFormData] = useState<Template>({
    name: '',
    content: '',
    isActive: true,
    sendHoursBefore: 24
  });

  useEffect(() => {
    if (template) {
      setFormData(template);
    } else {
      setFormData({
        name: '',
        content: '',
        isActive: true,
        sendHoursBefore: 24
      });
    }
  }, [template]);

  if (!isOpen) return null;

  const insertVariable = (variable: string) => {
    const newContent = formData.content + `{${variable}}`;
    setFormData({ ...formData, content: newContent });
  };

  return (
    <DraggableModal
      isOpen={isOpen}
      onClose={onClose}
      title={template ? 'Modifier le modèle' : 'Nouveau modèle'}
      className="w-full max-w-2xl"
    >
      <div className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Nom du modèle
          </label>
          <input
            type="text"
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>
        <div>
          <label htmlFor="content" className="block text-sm font-medium text-gray-700">
            Contenu du message
          </label>
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700">
              Variables disponibles
            </label>
            <div className="mt-1 text-sm text-gray-500">
              <p className="mb-2">Vous pouvez utiliser ces variables dans votre message :</p>
              <div className="grid grid-cols-2 gap-2">
                {variablesList.map((variable) => (
                  <div key={variable.id} className="flex items-center space-x-2">
                    <code className="px-2 py-1 bg-gray-100 rounded">{variable.example}</code>
                    <span>{variable.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <textarea
            id="content"
            rows={4}
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
          <div className="mt-1 flex flex-wrap gap-2">
            {variablesList.map((variable) => (
              <button
                key={variable.id}
                type="button"
                onClick={() => insertVariable(variable.id)}
                className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                {variable.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label htmlFor="sendHoursBefore" className="block text-sm font-medium text-gray-700">
            Délai d'envoi
          </label>
          <div className="flex items-center space-x-2 mt-1">
            <span className="text-sm text-gray-600">Envoi</span>
            <input
              type="number"
              id="sendHoursBefore"
              min="1"
              max="72"
              value={formData.sendHoursBefore}
              onChange={(e) =>
                setFormData({ ...formData, sendHoursBefore: parseInt(e.target.value) || 24 })
              }
              className="block w-20 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
            <span className="text-sm text-gray-600">heures avant le RDV</span>
          </div>
        </div>
        <div className="flex items-center">
          <input
            type="checkbox"
            id="isActive"
            checked={formData.isActive}
            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          />
          <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
            Modèle actif
          </label>
        </div>
      </div>
      <div className="mt-6 flex justify-end space-x-3">
        <button
          onClick={onClose}
          className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          Annuler
        </button>
        <button
          onClick={() => onSubmit(formData)}
          className="rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          {template ? 'Enregistrer' : 'Créer'}
        </button>
      </div>
    </DraggableModal>
  );
};

export default NotificationTemplateModal;