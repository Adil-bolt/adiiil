import { Patient } from '../types/patient';
import { Appointment } from '../components/calendar/types';

export const PENDING_STATUSES = ['-', 'Annulé', 'Reporté', 'Absent', 'En attente'];
export const NON_VALIDATED_FILTER_STATUSES = ['-', 'Annulé', 'Reporté', 'Absent', 'En attente'];

export function isNonValidatedStatus(status: string | undefined | null): boolean {
  const normalizedStatus = status || 'En attente';
  return NON_VALIDATED_FILTER_STATUSES.includes(normalizedStatus);
}

export function getPatientStatus(patient: Patient, appointments: Appointment[]): 'active' | 'pending' | 'suppressed' {
  const patientAppointments = appointments.filter(apt => 
    !apt.deleted && 
    (apt.patientId === patient.id || 
    (apt.nom?.toLowerCase() === patient.nom.toLowerCase() && 
     apt.prenom?.toLowerCase() === patient.prenom.toLowerCase()))
  );

  // Si aucun rendez-vous, le patient est considéré comme supprimé
  if (patientAppointments.length === 0) {
    return 'suppressed';
  }

  // Vérifier si le patient a au moins un rendez-vous validé
  const hasValidated = patientAppointments.some(apt => !PENDING_STATUSES.includes(apt.status || 'En attente'));
  if (hasValidated) {
    return 'active';
  }

  // Si tous les rendez-vous sont en attente/annulés
  return 'pending';
}

export function getPatientNumberPrefix(status: 'active' | 'pending' | 'suppressed'): string {
  switch (status) {
    case 'active':
      return 'P';
    case 'pending':
      return 'PA';
    case 'suppressed':
      return 'PS';
  }
}

export function formatPatientNumber(number: string | undefined | null, status: 'active' | 'pending' | 'suppressed'): string {
  if (!number) return '-';
  
  const prefix = getPatientNumberPrefix(status);
  const numericPart = number.replace(/\D/g, '');
  return `${prefix}${numericPart.padStart(4, '0')}`;
}

export function shouldDeletePatient(patient: Patient, appointments: Appointment[]): boolean {
  const patientAppointments = appointments.filter(apt => 
    !apt.deleted && 
    (apt.patientId === patient.id || 
    (apt.nom?.toLowerCase() === patient.nom.toLowerCase() && 
     apt.prenom?.toLowerCase() === patient.prenom.toLowerCase()))
  );

  // Un patient peut être supprimé s'il n'a aucun rendez-vous validé
  return !patientAppointments.some(apt => !PENDING_STATUSES.includes(apt.status || 'En attente'));
}