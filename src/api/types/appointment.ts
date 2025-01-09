export interface Appointment {
  id: string;
  time: string; // Stored in GMT/UTC
  duration: string;
  patient: string;
  patientId?: string;
  type: string;
  source: string;
  status: string;
  amount?: string;
  paid?: boolean;
  paymentMethod?: string;
  isNewPatient?: boolean;
  isDelegue?: boolean;
  isGratuite?: boolean;
  isCanceled?: boolean;
  deleted?: boolean;
}

export interface LocalAppointment extends Appointment {
  localDate: string;
  localTime: string;
}