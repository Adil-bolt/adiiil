export interface CommunicationStatus {
  sent: boolean;
  timestamp: string;
}

export interface UpcomingAppointment {
  id: string;
  patientId: string;
  patientName: string;
  contact: string | null;
  time: string;
}

export interface NotificationData {
  patientName: string;
  appointmentDate: string;
  appointmentTime: string;
  doctorName?: string;
  clinicName?: string;
}