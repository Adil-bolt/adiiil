import { Patient } from '../../types/patient';
import { Appointment } from '../../types/appointment';

export class PatientNumberManager {
  private static readonly PREFIX = {
    ACTIVE: 'P',
    PENDING: 'PA',
    SUPPRESSED: 'PS'
  };

  public static getNumber(patient: Patient, appointments: Appointment[]): string {
    const status = this.getPatientStatus(patient, appointments);
    const baseNumber = patient.numeroPatient.replace(/[^\d]/g, '');
    return `${this.PREFIX[status]}${baseNumber}`;
  }

  private static getPatientStatus(patient: Patient, appointments: Appointment[]): 'ACTIVE' | 'PENDING' | 'SUPPRESSED' {
    const patientAppointments = this.getPatientAppointments(patient, appointments);
    
    if (patientAppointments.length === 0) {
      return 'SUPPRESSED';
    }

    const hasValidated = patientAppointments.some(apt => apt.status === 'Validé');
    return hasValidated ? 'ACTIVE' : 'PENDING';
  }

  private static getPatientAppointments(patient: Patient, appointments: Appointment[]): Appointment[] {
    return appointments.filter(apt => 
      !apt.deleted && 
      (apt.patientId === patient.id || 
      (apt.nom?.toLowerCase() === patient.nom.toLowerCase() && 
       apt.prenom?.toLowerCase() === patient.prenom.toLowerCase()))
    );
  }

  public static isPatientDeletable(patient: Patient, appointments: Appointment[]): boolean {
    const patientAppointments = this.getPatientAppointments(patient, appointments);
    return patientAppointments.every(apt => apt.status !== 'Validé');
  }
}