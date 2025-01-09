export interface PatientManagementContextType {
  deletePatient: (id: string) => void;
}

export interface PatientManagementProviderProps {
  children: React.ReactNode;
}