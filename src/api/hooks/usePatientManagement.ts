import { useCallback } from 'react';
import { useData } from '../contexts/DataContext';
import { useAppointments } from '../contexts/AppointmentContext';
import { PatientNumberManager } from '../modules/patientNumber/PatientNumberManager';
import { Patient } from '../types/patient';

export function usePatientManagement() {
  const { patients, deletePatient: removePatient } = useData();
  const { appointments, deleteAppointment } = useAppointments();

  const deletePatient = useCallback((patientId: string): { success: boolean; message?: string } => {
    const patient = patients.find(p => p.id === patientId);
    if (!patient) {
      return { success: false, message: 'Patient non trouvé' };
    }

    if (!PatientNumberManager.isPatientDeletable(patient, appointments)) {
      return { success: false, message: 'Ce patient ne peut pas être supprimé car il a des rendez-vous validés' };
    }

    // Supprimer les rendez-vous associés
    appointments
      .filter(apt => apt.patientId === patientId)
      .forEach(apt => deleteAppointment(apt.id));

    // Supprimer le patient
    removePatient(patientId);

    return { success: true };
  }, [patients, appointments, removePatient, deleteAppointment]);

  const getPatientNumber = useCallback((patient: Patient): string => {
    return PatientNumberManager.getNumber(patient, appointments);
  }, [appointments]);

  return {
    deletePatient,
    getPatientNumber
  };
}