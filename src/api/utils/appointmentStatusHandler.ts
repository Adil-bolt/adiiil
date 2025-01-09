import { Appointment } from '../components/calendar/types';
import { Patient } from '../types/patient';
import { enrichPatientWithAppointments } from './patientUtils';

export function handleAppointmentStatusChange(
  appointment: Appointment,
  newStatus: string,
  patients: Patient[]
): void {
  try {
    // Trouver le patient concerné
    const patient = patients.find(p => p.id === appointment.patientId);
    if (!patient) return;

    // Mettre à jour le statut du patient en fonction du nouveau statut du rendez-vous
    if (newStatus === 'Validé') {
      patient.status = 'Validé';
      patient.lastValidatedAppointment = appointment.time;
    } else {
      // Vérifier s'il y a d'autres rendez-vous validés pour ce patient
      const hasOtherValidatedAppointments = appointment.patientAppointments?.some(
        apt => apt.id !== appointment.id && apt.status === 'Validé'
      );
      
      if (!hasOtherValidatedAppointments) {
        patient.status = newStatus;
      }
    }

  } catch (error) {
    console.error('Erreur lors de la mise à jour du statut du patient:', error);
  }
}

export function getAppointmentStatus(appointment: Appointment): 'pending' | 'validated' {
  if (appointment.status === 'Validé') {
    return 'validated';
  }
  return 'pending';
}