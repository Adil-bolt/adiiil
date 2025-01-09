import React, { useState, useMemo, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useData } from '../../contexts/DataContext';
import { useAppointments } from '../../contexts/AppointmentContext';
import { useUpdate } from '../../contexts/UpdateContext';
import { formatters } from '../../utils/formatters';
import { formatFicheNumber } from '../../utils/formatUtils';
import ValidationModal from './ValidationModal';
import { PatientNumberService } from '../../services/patient/PatientNumberService';
import { getPreviousFicheNumbers } from '../../utils/ficheUtils';
import { FicheNumberInput } from '../FicheNumberInput';

interface ConsultationTableProps {
  visits: Array<{
    id: string;
    time: string;
    patient: string;
    nom?: string;
    prenom?: string;
    patientId?: string;
    amount: string;
    paid: boolean;
    paymentMethod: string;
    isDelegue: boolean;
    isGratuite: boolean;
    isNewPatient: boolean;
    isControl: boolean;
    isCanceled: boolean;
    ficheNumber?: string;
    status?: string;
    numeroPatient?: string;
    telephone?: string;
    isLunchBreak?: boolean;
    isClinicalConsultation?: boolean;
    clinicName?: string;
    patientDeleted?: boolean;
    deletedPatientInfo?: { nom: string; prenom: string };
  }>;
  selectedDate: Date;
  dateRange: { start: Date; end: Date };
  onDateSelect: (date: Date) => void;
  onRangeSelect: (range: { start: Date; end: Date } | null) => void;
}

export default function ConsultationTable({ 
  visits, 
  selectedDate, 
  dateRange, 
  onDateSelect, 
  onRangeSelect 
}: ConsultationTableProps) {
  const { patients, addPatient, updatePatient, deletePatient } = useData();
  const { appointments, updateAppointment, deleteAppointment } = useAppointments();
  const { triggerUpdate, lastUpdate } = useUpdate();
  const [editingVisit, setEditingVisit] = useState<string | null>(null);
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [selectedVisitId, setSelectedVisitId] = useState<string | null>(null);
  const [validationMessage, setValidationMessage] = useState('');
  const [editValues, setEditValues] = useState<{
    [key: string]: {
      status: string;
      ficheNumber: string;
      numeroPatient?: string;
    };
  }>({});
  const [forceUpdate, setForceUpdate] = useState(0);

  const validateFicheNumber = (number: string): boolean => {
    if (!number) return true;
    const pattern = /^F\d{2}-\d{4}$/i;
    return pattern.test(number);
  };

  const formatFicheNumber = (number: string): string => {
    if (!number) return '';
    
    const cleaned = number.replace(/[^\d-]/g, '');
    const parts = cleaned.split('-');
    
    if (parts.length === 2) {
      const [part1, part2] = parts;
      return `F${part1.padStart(2, '0')}-${part2.padStart(4, '0')}`;
    }
    
    return number;
  };

  // Fonction pour afficher le nom du patient
  const getPatientDisplayName = (visit: any) => {
    // Cas spéciaux
    if (visit.isLunchBreak) return 'PAUSE_DEJEUNER';
    if (visit.isClinicalConsultation) {
      return `CONSULTATION_CLINIQUE${visit.clinicName ? ` - ${visit.clinicName}` : ''}`;
    }

    // Pour les rendez-vous avec patientId
    if (visit.patientId) {
      const patient = patients.find(p => p.id === visit.patientId);
      if (patient) {
        return formatters.patientName(patient.nom, patient.prenom);
      }
      // Si on a les informations directement dans le rendez-vous, les utiliser
      if (visit.nom && visit.prenom) {
        return formatters.patientName(visit.nom, visit.prenom);
      }
    }

    // Pour les nouveaux patients sans ID mais avec nom/prénom
    if (visit.nom && visit.prenom) {
      return formatters.patientName(visit.nom, visit.prenom);
    }

    // Si on a un nom de patient stocké dans le rendez-vous
    if (visit.patient && visit.patient !== '(Patient supprimé)') {
      return visit.patient;
    }

    // En dernier recours
    return '-';
  };

  const handleEdit = (visitId: string) => {
    const visit = visits.find(v => v.id === visitId);
    if (visit) {
      const patient = patients.find(p => p.id === visit.patientId);
      setEditingVisit(visitId);
      setEditValues({
        [visitId]: {
          status: visit.status || '-',
          ficheNumber: visit.ficheNumber || '',
          numeroPatient: patient?.numeroPatient || visit.numeroPatient || ''
        }
      });
    }
  };

  const handleDelete = async (visitId: string) => {
    try {
      const visit = visits.find(v => v.id === visitId);
      if (visit && visit.patientId) {
        // Marquer le patient comme supprimé au lieu de le supprimer complètement
        await updatePatient(visit.patientId, { deleted: true, deletedFrom: 'dashboard' });
      }
      // Supprimer le rendez-vous
      await deleteAppointment(visitId);
      // Déclencher la mise à jour pour les autres composants
      triggerUpdate('dashboard', 'delete', visitId);
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
    }
  };

  const handleKeyPress = async (e: React.KeyboardEvent, visitId: string) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      await handleSave(visitId);
    }
  };

  const handleSave = async (visitId: string) => {
    const editValue = editValues[visitId];
    if (!editValue) return;

    try {
      // Vérifier si le statut est "Validé"
      if (editValue.status === 'Validé') {
        // Vérifier uniquement si le numéro de fiche est renseigné
        if (!editValue.ficheNumber) {
          setValidationMessage('Un numéro de fiche est requis pour un rendez-vous validé');
          setShowValidationModal(true);
          return;
        }
      }

      // Mettre à jour le rendez-vous
      await updateAppointment(visitId, {
        status: editValue.status,
        ficheNumber: editValue.ficheNumber ? formatFicheNumber(editValue.ficheNumber) : undefined,
        numeroPatient: editValue.numeroPatient,
        lastUpdated: new Date().toISOString(),
        // Réinitialiser le montant et le mode de paiement lors de la validation
        ...(editValue.status === 'Validé' ? {
          amount: '-',
          paymentMethod: '-',
          paid: false
        } : {})
      });

      // Mettre à jour le statut du patient si nécessaire
      if (visitId && editValue.status === 'Validé') {
        const visit = visits.find(v => v.id === visitId);
        if (visit && visit.patientId) {
          const patient = patients.find(p => p.id === visit.patientId);
          if (patient) {
            const patientAppointments = appointments.filter(a => a.patientId === patient.id);
            const hasValidatedAppointment = patientAppointments.some(a => a.status === 'Validé');
            
            await updatePatient(visit.patientId, {
              status: hasValidatedAppointment ? 'Validé' : editValue.status,
              lastUpdated: new Date().toISOString()
            });
          }
        }
      }

      // Déclencher la mise à jour
      triggerUpdate('dashboard', 'update', visitId);

      // Réinitialiser l'édition
      setEditingVisit(null);
      setEditValues({});

      // toast.success('Rendez-vous mis à jour avec succès');
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      // toast.error('Erreur lors de la mise à jour du rendez-vous');
    }
  };

  const handleValidation = async (visitId: string) => {
    try {
      const visit = visits.find(v => v.id === visitId);
      if (!visit) return;

      // Mettre à jour le rendez-vous comme validé
      await updateAppointment(visitId, {
        status: 'Validé',
        ficheNumber: visit.ficheNumber ? formatFicheNumber(visit.ficheNumber) : undefined
      });

      // Mettre à jour le statut du patient comme validé
      if (visit.patientId) {
        await updatePatient(visit.patientId, {
          status: 'Validé',
          lastUpdated: new Date().toISOString()
        });
      }

      // Déclencher la mise à jour pour les autres composants
      triggerUpdate('dashboard', 'update', visitId);

      setSelectedVisitId(null);
      
    } catch (error) {
      console.error('Erreur lors de la validation:', error);
      setValidationMessage(error instanceof Error ? error.message : 'Une erreur est survenue lors de la validation');
      setShowValidationModal(true);
    }
  };

  const handleCloseValidationModal = () => {
    setShowValidationModal(false);
    setEditingVisit(null);
    setEditValues({});
    // Forcer un re-rendu
    setForceUpdate(prev => prev + 1);
  };

  // Filtrer les données pour n'afficher que les patients actifs
  const filteredData = useMemo(() => {
    // Filtrer les rendez-vous pour exclure les PAUSE_DEJEUNER
    const allVisits = visits
      .filter(visit => !visit.isLunchBreak) // Exclure les pauses déjeuner
      .map(visit => {
        const patientName = getPatientDisplayName(visit);
        return {
          ...visit,
          patient: patientName,
          isBeingEdited: visit.id === editingVisit
        };
      });

    return {
      patients,
      visits: allVisits
    };
  }, [patients, visits, editingVisit, forceUpdate]);

  // Gérer les touches du clavier pour le modal de modification
  const handleModalKeyDown = (e: KeyboardEvent) => {
    if (editingVisit && e.key === 'Delete') {
      e.preventDefault();
      handleDelete(editingVisit);
      setEditingVisit(null);
    }
  };

  const getStatusColor = (status: string | undefined): string => {
    switch (status) {
      case 'Validé':
        return 'bg-green-100 text-green-800';
      case 'Annulé':
        return 'bg-red-100 text-red-800';
      case 'Reporté':
        return 'bg-yellow-100 text-yellow-800';
      case 'Absent':
        return 'bg-gray-100 text-gray-800';
      case 'Supprimé':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-blue-100 text-blue-800'; // Pour "En attente"
    }
  };

  // Ajouter et supprimer l'écouteur d'événements quand le modal est ouvert/fermé
  useEffect(() => {
    if (editingVisit) {
      window.addEventListener('keydown', handleModalKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleModalKeyDown);
    };
  }, [editingVisit]);

  // Effet pour gérer les mises à jour automatiques
  useEffect(() => {
    if (lastUpdate && lastUpdate.source !== 'dashboard') {
      // Rafraîchir les données si la mise à jour vient d'une autre source
      setForceUpdate(prev => prev + 1);
    }
  }, [lastUpdate]);

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Patient
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Heure
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ancien Patient
              </th>
              <th className="px-3 py-3 text-center text-xs text-gray-500 uppercase tracking-wider">
                <div>Ancien N°</div>
                <div>fiche Patient</div>
              </th>
              <th className="px-3 py-3 text-center text-xs text-gray-500 uppercase tracking-wider">
                <div>N° fiche</div>
                <div>Patient</div>
              </th>
              <th className="px-3 py-3 text-center text-xs text-gray-500 uppercase tracking-wider">
                Montant
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Confirmation rendez-vous
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredData.visits.map((visit, index) => {
              const isEditing = editingVisit === visit.id;
              const editValue = editValues[visit.id] || {
                status: visit.status || '-',
                ficheNumber: visit.ficheNumber || '',
                numeroPatient: visit.numeroPatient || ''
              };
              const patient = filteredData.patients.find(p => p.id === visit.patientId);
              const currentPatient = patient || (visit.nom && visit.prenom ? { nom: visit.nom, prenom: visit.prenom } : null);
              const isNewPatient = !patient;
              const previousFiches = getPreviousFicheNumbers(appointments, filteredData.patients, visit.patientId, visit.time, currentPatient);

              return (
                <tr key={`${visit.id}-${index}`} className={visit.isBeingEdited ? 'bg-blue-50' : ''}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {getPatientDisplayName(visit)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {format(parseISO(visit.time), 'HH:mm')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {isNewPatient ? 'Non' : 'Oui'}
                  </td>
                  <td className="px-3 py-4 text-sm text-gray-500 text-center whitespace-nowrap">
                    {visit.status === 'Validé' ? (
                      previousFiches.length > 0 
                        ? previousFiches.map(fiche => formatFicheNumber(fiche)).filter(f => f !== '-').join(' / ') || '-'
                        : '-'
                    ) : (
                      <span className="inline-block w-full text-center">-</span>
                    )}
                  </td>
                  <td className="px-3 py-4 text-sm text-gray-500 text-center whitespace-nowrap">
                    {isEditing && editValue.status === 'Validé' ? (
                      <FicheNumberInput
                        value={editValue.ficheNumber || ''}
                        onChange={(value) => setEditValues({
                          ...editValues,
                          [visit.id]: { ...editValue, ficheNumber: value }
                        })}
                        onBlur={() => handleSave(visit.id)}
                        onEnter={() => {
                          handleSave(visit.id);
                          // Désactiver le mode édition après la sauvegarde
                          setEditingVisit(null);
                        }}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-center"
                        placeholder="XX-XXXX"
                        required
                      />
                    ) : visit.status === 'Validé' ? (
                      formatFicheNumber(visit.ficheNumber) || '-'
                    ) : (
                      <span className="inline-block w-full text-center">-</span>
                    )}
                  </td>
                  <td className="px-3 py-4 text-sm text-gray-500 text-center whitespace-nowrap">
                    {visit.status === 'Validé' ? (
                      isEditing ? (
                        <span className="inline-block w-full text-center">{editValue.montant || '-'} Dhs</span>
                      ) : (
                        <span className="inline-block w-full text-center">{visit.montant || '-'} Dhs</span>
                      )
                    ) : (
                      <span className="inline-block w-full text-center">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {isEditing ? (
                      <select
                        value={editValue.status}
                        onChange={(e) => setEditValues(prev => ({
                          ...prev,
                          [visit.id]: { ...prev[visit.id], status: e.target.value }
                        }))}
                        onKeyPress={(e) => handleKeyPress(e, visit.id)}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      >
                        <option value="-">-</option>
                        <option value="En attente">En attente</option>
                        <option value="Validé">Validé</option>
                        <option value="Annulé">Annulé</option>
                        <option value="Reporté">Reporté</option>
                        <option value="Absent">Absent</option>
                      </select>
                    ) : (
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(visit.status)}`}>
                        {visit.status === 'Valider' ? 'En attente' : (visit.status || '-')}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex space-x-2">
                      {isEditing ? (
                        <button
                          onClick={() => handleSave(visit.id)}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          Enregistrer
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={() => handleEdit(visit.id)}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            Modifier
                          </button>
                          <button
                            onClick={() => handleDelete(visit.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Supprimer
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <ValidationModal
        isOpen={showValidationModal}
        onClose={handleCloseValidationModal}
        message={validationMessage}
        onSubmit={handleValidation}
      />
    </div>
  );
}