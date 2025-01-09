import React, { useState, useMemo, useEffect } from 'react';
import { format, addHours, isWithinInterval, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Clock, Calendar, MessageSquare, Mail, Phone, Check, Download } from 'lucide-react';
import { useAppointments } from '@/hooks/useAppointments';
import { useData } from '@/hooks/useData';
import { CommunicationStatus, UpcomingAppointment } from '../../types/notification';
import { getConsideredColor, getInitialCommunicationStatus } from '../../utils/notificationStatus';
import { formatPhoneNumber } from '../../utils/phoneUtils';
import { WhatsAppService } from '@/utils/whatsappUtils';
import { ExcelService } from '@/utils/excelUtils';
import NotificationDelay from './NotificationDelay';

export default function UpcomingAppointments() {
  const { appointments } = useAppointments();
  const { patients } = useData();
  const [delayHours, setDelayHours] = useState(48);
  const [communicationStatus, setCommunicationStatus] = useState<Record<string, CommunicationStatus>>({});

  const upcomingAppointments = useMemo(() => {
    const now = new Date();
    const maxTime = addHours(now, delayHours);

    return appointments
      .filter(apt => {
        const aptTime = parseISO(apt.time);
        return isWithinInterval(aptTime, { start: now, end: maxTime });
      })
      .map(apt => {
        const patient = apt.patientId ? patients.find(p => p.id === apt.patientId) : null;
        return {
          id: apt.id,
          patientId: apt.patientId,
          patientName: patient 
            ? formatters.patientName(patient.nom, patient.prenom)
            : apt.nom && apt.prenom 
              ? formatters.patientName(apt.nom, apt.prenom)
              : 'Patient non spécifié',
          time: apt.time,
          contact: apt.contact || patient?.telephone,
          patient: patient
        };
      })
      .sort((a, b) => parseISO(a.time).getTime() - parseISO(b.time).getTime());
  }, [appointments, patients, delayHours]);

  const handleCommunication = (appointment: any) => {
    const patient = patients.find(p => p.id === appointment.patientId);
    if (patient && patient.telephone) {
      // Construire le message de rappel
      const appointmentDate = format(parseISO(appointment.time), 'dd/MM/yyyy');
      const appointmentTime = format(parseISO(appointment.time), 'HH:mm');
      
      // Envoyer via WhatsApp et logger dans le fichier CSV
      WhatsAppService.sendMessage({
        phoneNumber: patient.telephone,
        message: `Bonjour ${patient.nom}, nous vous rappelons votre rendez-vous prévu le ${appointmentDate} à ${appointmentTime}. En cas d'empêchement, merci de nous prévenir à l'avance.`,
        variables: {
          patientName: `${patient.nom} ${patient.prenom}`,
          appointmentDate,
          appointmentTime
        }
      });
      
      // Mettre à jour le statut
      setCommunicationStatus(prev => ({
        ...prev,
        [appointment.id]: { sent: true, timestamp: new Date().toISOString() }
      }));
    }
  };

  const getCommunicationStatus = (appointmentId: string): CommunicationStatus => {
    return communicationStatus[appointmentId] || getInitialCommunicationStatus();
  };

  return (
    <div className="space-y-4">
      <NotificationDelay 
        defaultValue={delayHours} 
        onChange={setDelayHours}
      />

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Rendez-vous à venir</h2>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <MessageSquare className="h-4 w-4 text-green-600" />
          <span>Envoyer un message WhatsApp</span>
          <FileSpreadsheet className="h-4 w-4 ml-4 text-blue-600" />
          <span>Cliquez sur l'icône bleue pour exporter</span>
        </div>
      </div>

      <div className="flex items-center space-x-2 text-sm text-gray-500">
        <AlertCircle className="h-4 w-4" />
        <span>{upcomingAppointments.length} rendez-vous dans les prochaines {delayHours} heures</span>
      </div>

      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              PATIENT
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              PROCHAIN RDV
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              HEURE
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              VILLE
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              NUMÉRO DE TÉLÉPHONE
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              CHOIX DU MODÈLE
            </th>
            <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
              EXCEL
            </th>
            <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
              ACTIONS
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {upcomingAppointments.map((appointment) => (
            <tr key={appointment.id}>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-900">
                      {appointment.patientName}
                    </div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">
                  {format(parseISO(appointment.time), 'dd/MM/yyyy')}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">
                  {format(parseISO(appointment.time), 'HH:mm')}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">
                  {appointment.city || '-'}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">
                  {appointment.contact}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <select
                  value={appointment.templateId || ''}
                  onChange={(e) => handleTemplateChange(appointment.id, e.target.value)}
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
              <td className="px-6 py-4 whitespace-nowrap text-center">
                <button
                  onClick={async () => {
                    try {
                      const success = await ExcelService.exportToExcel(appointment);
                      if (success) {
                        setCommunicationStatus(prev => ({
                          ...prev,
                          [appointment.id]: { 
                            ...prev[appointment.id],
                            exported: true,
                            exportTimestamp: new Date().toISOString() 
                          }
                        }));
                      }
                    } catch (error) {
                      console.error('Erreur lors de l\'export:', error);
                      alert('Une erreur est survenue lors de l\'export');
                    }
                  }}
                  className="text-blue-600 hover:text-blue-700"
                  title="Exporter vers Excel"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M4 4V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 21.1046 20 20V8.34162C20 7.8034 19.7831 7.28789 19.3982 6.91161L15.0801 2.6749C14.7033 2.30755 14.1905 2.09814 13.6556 2.09814H6C4.89543 2.09814 4 2.99357 4 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M9 13L15 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M9 17L13 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M14 2.5V6C14 7.10457 14.8954 8 16 8H19.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-center">
                <div className="flex items-center justify-center space-x-2">
                  {/* WhatsApp */}
                  <button
                    onClick={() => handleCommunication(appointment)}
                    className="text-green-600 hover:text-green-700"
                    title="Envoyer un message WhatsApp"
                  >
                    <MessageSquare className="h-5 w-5" />
                  </button>

                  {/* Email */}
                  <button
                    className="text-yellow-600 hover:text-yellow-700"
                    title="Envoyer un email"
                  >
                    <Mail className="h-5 w-5" />
                  </button>

                  {/* Phone */}
                  <button
                    className="text-purple-600 hover:text-purple-700"
                    title="Appeler"
                  >
                    <Phone className="h-5 w-5" />
                  </button>

                  {/* Status */}
                  <div className={`ml-2 ${getConsideredColor(status)}`}>
                    <Check className="h-5 w-5" />
                  </div>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {upcomingAppointments.length === 0 && (
        <div className="text-center py-6 text-gray-500">
          Aucun rendez-vous prévu dans les prochaines {delayHours} heures
        </div>
      )}
    </div>
  );
}