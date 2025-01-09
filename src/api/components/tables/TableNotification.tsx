import React, { useState, useRef, useMemo } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { MessageSquare, Mail, Phone, Check, Download, MessageCircle, Edit2, Trash2, Clock } from 'lucide-react';
import { ExcelService } from '@/utils/excelUtils';

interface TableNotificationProps {
  records: any[];
  onSendWhatsApp?: (record: any) => void;
  onSendEmail?: (record: any) => void;
  onSendSMS?: (record: any) => void;
  onCall?: (record: any) => void;
  templates?: any[];
  onTemplateChange?: (recordId: string, templateId: string) => void;
  communicationStatus?: Record<string, { 
    sent: boolean; 
    timestamp?: string; 
    methods?: string[];
  }>;
  onStatusChange?: (recordId: string, status: { sent: boolean; methods: string[] }) => void;
  onEdit?: () => void;
  onDelete?: () => void;
  defaultHoursBefore?: number;
  onHoursBeforeChange?: (hours: number) => void;
}

export default function TableNotification({ 
  records = [], 
  onSendWhatsApp, 
  onSendEmail,
  onSendSMS,
  onCall,
  templates = [], 
  onTemplateChange,
  communicationStatus = {},
  onStatusChange,
  onEdit,
  onDelete,
  defaultHoursBefore = 24,
  onHoursBeforeChange
}: TableNotificationProps) {
  const [localStatus, setLocalStatus] = useState<Record<string, { sent: boolean; methods: string[] }>>({});

  const [statuses, setStatuses] = useState<Record<string, { sent: boolean; methods: string[] }>>(
    Object.keys(communicationStatus).reduce((acc, key) => ({
      ...acc,
      [key]: {
        sent: communicationStatus[key].sent,
        methods: communicationStatus[key].methods || []
      }
    }), {})
  );

  const [hoursBefore, setHoursBefore] = useState(defaultHoursBefore);
  const [isEditingHours, setIsEditingHours] = useState(false);
  const [tempHours, setTempHours] = useState(defaultHoursBefore.toString());
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredRecords = useMemo(() => {
    const now = new Date();
    const hoursInMs = hoursBefore * 60 * 60 * 1000; // Convertir les heures en millisecondes

    return records.filter(record => {
      const appointmentDate = new Date(record.time || record.prochainRdv);
      const timeDifference = appointmentDate.getTime() - now.getTime();
      
      // Vérifier si le rendez-vous est dans la fenêtre de notification
      // (entre maintenant et le délai configuré)
      return timeDifference > 0 && timeDifference <= hoursInMs;
    });
  }, [records, hoursBefore]);

  const handleHoursChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTempHours(e.target.value);
  };

  const handleHoursSubmit = () => {
    const value = parseInt(tempHours, 10);
    if (!isNaN(value) && value > 0) {
      setHoursBefore(value);
      if (onHoursBeforeChange) {
        onHoursBeforeChange(value);
      }
    } else {
      setTempHours(hoursBefore.toString());
    }
    setIsEditingHours(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleHoursSubmit();
    } else if (e.key === 'Escape') {
      setTempHours(hoursBefore.toString());
      setIsEditingHours(false);
    }
  };

  const startEditing = () => {
    setIsEditingHours(true);
    setTempHours(hoursBefore.toString());
    // Focus l'input après le rendu
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        inputRef.current.select();
      }
    }, 0);
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return '-';
      }
      return format(date, 'dd/MM/yyyy', { locale: fr });
    } catch (error) {
      console.error('Error formatting date:', error);
      return '-';
    }
  };

  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return '-';
      }
      return format(date, 'HH:mm');
    } catch (error) {
      console.error('Error formatting time:', error);
      return '-';
    }
  };

  const formatName = (fullName: string): string => {
    if (!fullName) return '';
    
    // Diviser en prénom et nom
    const parts = fullName.trim().split(' ');
    if (parts.length === 1) {
      // Si un seul mot, le traiter comme un nom
      return parts[0].toUpperCase();
    }
    
    // Le dernier mot est le nom de famille
    const lastName = parts.pop()?.toUpperCase() || '';
    
    // Le reste est le prénom
    const firstName = parts.map(part => 
      part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
    ).join(' ');
    
    return `${firstName} ${lastName}`;
  };

  const getSelectedTemplate = (record: any) => {
    const templateId = record.templateId || record.modelId;
    if (!templateId || !templates.length) {
      return {
        content: 'Bonjour {patientName}, nous vous rappelons votre rendez-vous prévu le {appointmentDate} à {appointmentTime}. En cas d\'empêchement, merci de nous prévenir à l\'avance.'
      };
    }
    return templates.find(t => t.id === templateId) || templates[0];
  };

  const handleExport = async (record: any) => {
    try {
      // Récupérer le template sélectionné
      const selectedTemplate = getSelectedTemplate(record);
      
      // Préparer les données pour l'export avec toutes les variables possibles
      const exportData = {
        date: format(new Date(), 'dd/MM/yyyy'),
        patientName: record.patient || record.patientName || '',
        appointmentDate: formatDate(record.time || record.prochainRdv),
        appointmentTime: formatTime(record.time || record.prochainRdv),
        contact: (record.contact || record.telephone || '').replace(/^'/, ''),
        city: record.ville || '',
        message: selectedTemplate.content, // Utiliser directement le contenu du template
        status: 'En attente',
        // Informations supplémentaires pour le remplacement des variables
        doctorName: record.doctorName || record.doctor || '',
        clinicName: record.clinicName || record.clinic || '',
        patientPhone: (record.telephone || record.contact || '').replace(/^'/, ''),
        appointmentType: record.appointmentType || record.type || '',
        patientCIN: record.patientCIN || record.cin || '',
        patientMutuelle: record.patientMutuelle || record.mutuelle || ''
      };

      // Télécharger le fichier CSV
      ExcelService.downloadCSV([exportData]);
    } catch (error) {
      console.error('Error exporting to Excel:', error);
    }
  };

  const updateStatus = (recordId: string, method: string) => {
    setStatuses(prev => {
      const currentStatus = prev[recordId] || { sent: false, methods: [] };
      let newMethods;

      if (currentStatus.methods.includes(method)) {
        // Si la méthode existe déjà, la supprimer
        newMethods = currentStatus.methods.filter(m => m !== method);
      } else {
        // Sinon, l'ajouter
        newMethods = [...currentStatus.methods, method];
      }
      
      const newStatus = {
        ...prev,
        [recordId]: {
          sent: newMethods.length > 0, // sent est true seulement s'il y a des méthodes
          methods: newMethods
        }
      };

      // Notifier le parent du changement
      if (onStatusChange) {
        onStatusChange(recordId, newStatus[recordId]);
      }

      return newStatus;
    });
  };

  const handleSendWhatsApp = async (record: any) => {
    try {
      // Récupérer le template sélectionné
      const selectedTemplate = getSelectedTemplate(record);
      
      // Préparer les données pour l'export
      const exportData = {
        date: format(new Date(), 'dd/MM/yyyy'),
        patientName: record.patient || record.patientName || '',
        appointmentDate: formatDate(record.time || record.prochainRdv),
        appointmentTime: formatTime(record.time || record.prochainRdv),
        contact: (record.contact || record.telephone || '').replace(/^'/, ''),
        city: record.ville || '',
        message: selectedTemplate.content,
        status: 'En attente',
        doctorName: record.doctorName || record.doctor || '',
        clinicName: record.clinicName || record.clinic || '',
        patientPhone: (record.telephone || record.contact || '').replace(/^'/, ''),
        appointmentType: record.appointmentType || record.type || '',
        patientCIN: record.patientCIN || record.cin || '',
        patientMutuelle: record.patientMutuelle || record.mutuelle || ''
      };

      // Télécharger le fichier CSV
      await ExcelService.downloadCSV([exportData]);
      updateStatus(record.id, 'WhatsApp');
      
      if (onSendWhatsApp) {
        onSendWhatsApp(record);
      }
    } catch (error) {
      console.error('Error exporting to WhatsApp:', error);
    }
  };

  const handleSendSMS = (record: any) => {
    updateStatus(record.id, 'SMS');
    if (onSendSMS) {
      onSendSMS(record);
    }
  };

  const handleSendEmail = (record: any) => {
    updateStatus(record.id, 'Email');
    if (onSendEmail) {
      onSendEmail(record);
    }
  };

  const handleCall = (record: any) => {
    updateStatus(record.id, 'Call');
    if (onCall) {
      onCall(record);
    }
  };

  const getStatusDisplay = (record: any) => {
    const status = statuses[record.id];
    if (!status?.sent) {
      return (
        <div className="flex items-center justify-center space-x-1">
          <span className="text-sm text-red-600 font-medium">
            Pas encore traité
          </span>
        </div>
      );
    }

    return (
      <div className="flex items-center justify-center space-x-2">
        <span className="text-sm text-green-600 font-medium flex items-center">
          Traité par
          {status.methods.map((method, index) => (
            <React.Fragment key={method}>
              {index > 0 && <span className="mx-1">/</span>}
              <span 
                className="hover:opacity-75 cursor-pointer" 
                onClick={() => updateStatus(record.id, method)}
                title={`Cliquer pour supprimer ${method}`}
              >
                {method === 'WhatsApp' && <MessageSquare className="h-4 w-4 ml-1" />}
                {method === 'SMS' && <MessageCircle className="h-4 w-4 ml-1" />}
                {method === 'Email' && <Mail className="h-4 w-4 ml-1" />}
                {method === 'Call' && <Phone className="h-4 w-4 ml-1" />}
              </span>
            </React.Fragment>
          ))}
        </span>
      </div>
    );
  };

  return (
    <div className="flex flex-col">
      <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
        <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
          {/* Barre d'envoi en haut */}
          <div className="mb-4 p-4 bg-white shadow rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-gray-500" />
                <span className="text-sm text-gray-700">Envoi</span>
                {isEditingHours ? (
                  <input
                    ref={inputRef}
                    type="number"
                    value={tempHours}
                    onChange={handleHoursChange}
                    onBlur={handleHoursSubmit}
                    onKeyDown={handleKeyDown}
                    className="w-16 px-2 py-1 text-sm border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                    min="1"
                  />
                ) : (
                  <span 
                    onClick={startEditing}
                    className="w-16 px-2 py-1 text-sm text-gray-900 cursor-pointer hover:bg-gray-100 rounded-md"
                    title="Cliquer pour modifier"
                  >
                    {hoursBefore}
                  </span>
                )}
                <span className="text-sm text-gray-700">heures avant le RDV</span>
              </div>
              <div className="flex items-center">
                <span className="text-sm text-gray-500">
                  {filteredRecords.length} patient(s) à notifier
                </span>
              </div>
            </div>
          </div>

          <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Patient
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Heure
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Choix du modèle
                  </th>
                  <th scope="col" className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-10">
                    WA
                  </th>
                  <th scope="col" className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-10">
                    SMS
                  </th>
                  <th scope="col" className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-10">
                    Mail
                  </th>
                  <th scope="col" className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-10">
                    Tel
                  </th>
                  <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRecords.map((record) => (
                  <tr key={record.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {formatName(record.patient || record.patientName || '')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatDate(record.time || record.prochainRdv)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatTime(record.time || record.prochainRdv)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {record.contact || record.telephone || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={record.templateId || record.modelId || ''}
                        onChange={(e) => onTemplateChange?.(record.id, e.target.value)}
                        className="text-sm text-gray-900 border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                      >
                        <option value="">Rappel de rendez-vous standard</option>
                        {templates.map((template) => (
                          <option key={template.id} value={template.id}>
                            {template.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-center">
                      <button
                        onClick={() => handleSendWhatsApp(record)}
                        className="inline-flex items-center justify-center p-1.5 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-full transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Exporter vers WhatsApp"
                      >
                        <MessageSquare className="h-4 w-4" />
                      </button>
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-center">
                      <button
                        onClick={() => handleSendSMS(record)}
                        className="inline-flex items-center justify-center p-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-full transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Envoyer un SMS"
                      >
                        <MessageCircle className="h-4 w-4" />
                      </button>
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-center">
                      <button
                        onClick={() => handleSendEmail(record)}
                        className="inline-flex items-center justify-center p-1.5 text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50 rounded-full transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Envoyer un email"
                      >
                        <Mail className="h-4 w-4" />
                      </button>
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-center">
                      <button
                        onClick={() => handleCall(record)}
                        className="inline-flex items-center justify-center p-1.5 text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-full transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Appeler"
                      >
                        <Phone className="h-4 w-4" />
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {getStatusDisplay(record)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
