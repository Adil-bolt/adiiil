import React, { useState, useMemo } from 'react';
import { Plus, AlertTriangle } from 'lucide-react';
import NotificationTemplateModal from '../components/NotificationTemplateModal';
import NotificationSettingsModal from '../components/NotificationSettingsModal';
import WhatsAppQRModal from '../components/WhatsAppQRModal';
import TableNotification from '../components/tables/TableNotification';
import TemplateGrid from '../components/notifications/TemplateGrid';
import { useData } from '../contexts/DataContext';
import DeleteConfirmationModal from '../components/common/DeleteConfirmationModal';
import { format } from 'date-fns';

interface Template {
  id: string;
  name: string;
  content: string;
  isActive: boolean;
  sendHoursBefore: number;
  variables: string[];
}

export default function Notifications() {
  const {
    patients,
    appointments,
    connectionStatus: { isConnected },
    templates,
    setTemplates
  } = useData();

  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [selectedModels, setSelectedModels] = useState<Record<string, string>>({});

  // Générer les données de notification à partir des patients et rendez-vous
  const notificationData = useMemo(() => {
    // Filtrer les rendez-vous pour les 48 prochaines heures
    const now = new Date();
    const in48Hours = new Date(now.getTime() + 48 * 60 * 60 * 1000);

    return appointments
      .filter(apt => {
        if (!apt.time || apt.deleted) return false;
        const aptDate = new Date(apt.time);
        return aptDate > now && aptDate <= in48Hours;
      })
      .map(apt => {
        // Trouver le patient correspondant
        let patient;
        if (apt.patientId) {
          patient = patients.find(p => p.id === apt.patientId);
        } else if (apt.patient) {
          patient = patients.find(p => 
            `${p.nom} ${p.prenom}`.toLowerCase() === apt.patient.toLowerCase()
          );
        }

        const recordId = apt.id || Math.random().toString(36).substring(2, 15);

        if (!patient && apt.nom) {
          // Si pas de patient trouvé mais qu'on a les infos dans le rendez-vous
          return {
            id: recordId,
            patient: `${apt.nom} ${apt.prenom || ''}`.trim(),
            prochainRdv: apt.time,
            heure: format(new Date(apt.time), 'HH:mm'),
            ville: apt.ville || '-',
            telephone: apt.telephone || '-',
            modelId: selectedModels[recordId] || templates[0]?.id || ""
          };
        } else if (patient) {
          // Si on a trouvé le patient
          return {
            id: recordId,
            patient: `${patient.nom} ${patient.prenom || ''}`.trim(),
            prochainRdv: apt.time,
            heure: format(new Date(apt.time), 'HH:mm'),
            ville: patient.ville || '-',
            telephone: patient.telephone || '-',
            modelId: selectedModels[recordId] || templates[0]?.id || ""
          };
        }

        return null;
      })
      .filter(Boolean)
      .sort((a, b) => new Date(a.prochainRdv).getTime() - new Date(b.prochainRdv).getTime());
  }, [appointments, patients, templates, selectedModels]);

  const handleTemplateSubmit = (formData: Partial<Template>) => {
    if (editingTemplate) {
      // Mise à jour d'un template existant
      const updatedTemplate = {
        ...editingTemplate,
        ...formData,
        variables: ['patientName', 'appointmentDate', 'appointmentTime', 'doctorName', 'clinicName']
      };
      const updatedTemplates = templates.map(t => 
        t.id === editingTemplate.id ? updatedTemplate : t
      );
      setTemplates(updatedTemplates);
      localStorage.setItem('notification_config', JSON.stringify({ templates: updatedTemplates }));
    } else {
      // Ajout d'un nouveau template
      const newTemplate = {
        ...formData,
        id: Math.random().toString(36).substring(2, 15),
        variables: ['patientName', 'appointmentDate', 'appointmentTime', 'doctorName', 'clinicName'],
        isActive: true,
        sendHoursBefore: formData.sendHoursBefore || 24
      } as Template;
      const newTemplates = [...templates, newTemplate];
      setTemplates(newTemplates);
      localStorage.setItem('notification_config', JSON.stringify({ templates: newTemplates }));
    }
    setIsTemplateModalOpen(false);
    setEditingTemplate(null);
  };

  const handleTemplateDelete = (template: Template) => {
    const newTemplates = templates.filter(t => t.id !== template.id);
    setTemplates(newTemplates);
    localStorage.setItem('notification_config', JSON.stringify({ templates: newTemplates }));
  };

  const handleTemplateEdit = (template: Template) => {
    setEditingTemplate(template);
    setIsTemplateModalOpen(true);
  };

  const handleSendHoursChange = (templateId: string, hours: number) => {
    const newTemplates = templates.map(t =>
      t.id === templateId ? { ...t, sendHoursBefore: hours } : t
    );
    setTemplates(newTemplates);
    localStorage.setItem('notification_config', JSON.stringify({ templates: newTemplates }));
  };

  return (
    <div className="space-y-6 p-6">
      <h2 className="text-2xl font-bold text-gray-900">Notifications</h2>

      <div className="space-y-6">
        <div className="bg-white shadow rounded-lg">
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Modèles de notification
              </h3>
              <button
                onClick={() => {
                  setEditingTemplate(null);
                  setIsTemplateModalOpen(true);
                }}
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                <Plus className="h-5 w-5 mr-2" />
                Nouveau modèle
              </button>
            </div>
            <TemplateGrid
              templates={templates}
              onEdit={handleTemplateEdit}
              onDelete={handleTemplateDelete}
              onSendHoursChange={handleSendHoursChange}
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-lg shadow">
            <div className="p-4">
              <TableNotification 
                records={notificationData} 
                templates={templates}
                onTemplateChange={(recordId, templateId) => {
                  setSelectedModels(prev => ({
                    ...prev,
                    [recordId]: templateId
                  }));
                }}
                onSendWhatsApp={(record) => {
                  // Gérer l'envoi WhatsApp
                }}
              />
            </div>
          </div>
        </div>
      </div>

      <NotificationTemplateModal
        isOpen={isTemplateModalOpen}
        onClose={() => {
          setIsTemplateModalOpen(false);
          setEditingTemplate(null);
        }}
        onSubmit={handleTemplateSubmit}
        template={editingTemplate}
      />
    </div>
  );
}