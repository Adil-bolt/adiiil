import React, { createContext, useContext, useCallback } from 'react';
import { useData } from './DataContext';
import { useAppointments } from './AppointmentContext';
import { Patient } from '../types/patient';
import { deletePatientData } from '../utils/patientManagement';
import { shouldDeletePatient } from '../utils/patientStatusUtils';

interface PatientManagementContextType {
  deletePatient: (patientId: string) => void;
}

const PatientManagementContext = createContext<PatientManagementContextType | null>(null);

export const usePatientManagement = () => {
  const context = useContext(PatientManagementContext);
  if (!context) {
    throw new Error('usePatientManagement must be used within a PatientManagementProvider');
  }
  return context;
};

export function PatientManagementProvider({ children }: { children: React.ReactNode }) {
  const { patients, deletePatient: removePatient } = useData();
  const { appointments, deleteAppointment } = useAppointments();

  const deletePatient = useCallback((patientId: string) => {
    const patient = patients.find(p => p.id === patientId);
    if (!patient) return;

    // Vérifier si le patient doit être supprimé
    if (!shouldDeletePatient(patient, appointments)) {
      console.log('Patient non supprimé car ce n\'est pas un nouveau patient');
      return;
    }

    // Supprimer le patient et ses données associées
    deletePatientData({
      patient,
      appointments,
      onDeletePatient: removePatient,
      onDeleteAppointment: deleteAppointment
    });
  }, [patients, appointments, removePatient, deleteAppointment]);

  return (
    <PatientManagementContext.Provider value={{ deletePatient }}>
      {children}
    </PatientManagementContext.Provider>
  );
}