import React from 'react';
import { getPatientStatus } from '../../utils/patientStatusUtils';
import { formatters } from '../../utils/formatters';
import { Patient } from '../../types/patient';
import { Appointment } from '../../components/calendar/types';

interface PatientNumberDisplayProps {
  patient: Patient;
  appointments: Appointment[];
}

export default function PatientNumberDisplay({ patient, appointments }: PatientNumberDisplayProps) {
  const status = getPatientStatus(patient, appointments);
  const formattedNumber = formatters.patientNumber(patient.numeroPatient, patient, appointments);

  const getStatusColor = () => {
    switch (status) {
      case 'active':
        return 'text-green-600';
      case 'pending':
        return 'text-yellow-600';
      case 'suppressed':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <span className={`font-mono ${getStatusColor()}`}>
      {formattedNumber}
    </span>
  );
}