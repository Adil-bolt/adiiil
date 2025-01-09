export interface UnifiedRecord {
  id: string;
  type: 'patient' | 'appointment' | 'consultation' | 'payment';
  // Champs communs
  createdAt: string;
  updatedAt: string;
  status: string;
  deleted?: boolean;
  deletedAt?: string;
  deletedFrom?: string;

  // Champs spécifiques au patient
  numeroPatient?: string;
  nom?: string;
  prenom?: string;
  telephone?: string;
  email?: string;
  ville?: string;
  cin?: string;
  dateNaissance?: string;
  mutuelle?: {
    active: boolean;
    nom: string;
  };
  antecedents?: {
    active: boolean;
    liste: string[];
  };

  // Champs spécifiques au rendez-vous/consultation
  patientId?: string;
  date?: string;
  time?: string; 
  heure?: string;
  duree?: number;
  motif?: string;
  notes?: string;
  type_consultation?: string;
  amount?: number; 
  
  // Champs spécifiques au paiement
  montant?: number;
  mode_paiement?: string;
  reference_paiement?: string;
  appointmentId?: string;
  mutuelle_prise_en_charge?: number;

  // Champs supplémentaires pour la compatibilité
  [key: string]: any; 

}

export interface UnifiedTableState {
  records: UnifiedRecord[];
  lastUpdate: number;
  isLoading: boolean;
  error: string | null;
}

export interface UnifiedTableActions {
  addRecord: (record: Omit<UnifiedRecord, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateRecord: (id: string, updates: Partial<UnifiedRecord>) => Promise<boolean>;
  deleteRecord: (id: string, source: string) => Promise<boolean>;
  getRecordsByType: (type: UnifiedRecord['type']) => UnifiedRecord[];
  getRecordById: (id: string) => UnifiedRecord | null;
  getPatientRecords: (patientId: string) => UnifiedRecord[];
  getAppointmentRecords: (appointmentId: string) => UnifiedRecord[];
  filterRecords: (filters: Partial<UnifiedRecord>) => UnifiedRecord[];
}
