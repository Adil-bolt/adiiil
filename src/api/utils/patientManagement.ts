import { Patient } from '../types/patient';
import { Appointment } from '../components/calendar/types';
import { PatientNumberService } from '../services/patient/PatientNumberService';
import { shouldDeletePatient } from './patientStatusUtils';

interface DeletePatientOptions {
  patient: Patient;
  appointments: Appointment[];
  onDeletePatient: (id: string) => void;
  onDeleteAppointment: (id: string) => void;
}

export function deletePatientData({
  patient,
  appointments,
  onDeletePatient,
  onDeleteAppointment
}: DeletePatientOptions) {
  // Vérifier si le patient doit être supprimé
  if (!shouldDeletePatient(patient, appointments)) {
    return;
  }

  // 1. Libérer le numéro de patient
  if (patient.numeroPatient) {
    PatientNumberService.releaseNumber(patient.numeroPatient, []);
  }

  // 2. Supprimer tous les rendez-vous associés
  const patientAppointments = appointments.filter(apt => 
    apt.patientId === patient.id ||
    (apt.nom?.toLowerCase() === patient.nom.toLowerCase() && 
     apt.prenom?.toLowerCase() === patient.prenom.toLowerCase())
  );

  patientAppointments.forEach(apt => {
    onDeleteAppointment(apt.id);
  });

  // 3. Supprimer le patient
  onDeletePatient(patient.id);
}