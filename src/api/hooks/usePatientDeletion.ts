import { useCallback } from 'react';
import { useData } from '../contexts/DataContext';
import { useAppointments } from '../contexts/AppointmentContext';
import { isNewPatient } from '../utils/patientStatusUtils';
import { deletePatientData } from '../utils/patientManagement';

export function usePatientDeletion() {
  const { patients, deletePatient: removePatient } = useData();
  const { appointments, deleteAppointment } = useAppointments();

  const deletePatient = useCallback((patientId: string): { success: boolean; message?: string } => {
    const patient = patients.find(p => p.id === patientId);
    if (!patient) {
      return { success: false, message: 'Patient non trouvé' };
    }

    // Vérifier si c'est un nouveau patient
    const isNew = isNewPatient(patient, appointments);
    if (!isNew) {
      return { success: false, message: 'Seuls les nouveaux patients peuvent être supprimés' };
    }

    // Supprimer le patient et ses données associées
    deletePatientData({
      patient,
      appointments,
      onDeletePatient: removePatient,
      onDeleteAppointment: deleteAppointment
    });

    return { success: true };
  }, [patients, appointments, removePatient, deleteAppointment]);

  return { deletePatient };
}