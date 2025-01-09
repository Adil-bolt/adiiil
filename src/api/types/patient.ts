export type ConfirmationStatus = '-' | 'annulé' | 'absent' | 'validé' | 'reporté';

export interface Patient {
  id: string;
  numeroPatient: string;
  nom: string;
  prenom: string;
  ancienPatient: boolean;
  dateCreation: string;
  heure: string;
  contact: string;
  ville: string;
  cin: string;
  mutuelle: {
    nom: string;
    numero?: string;
  };
  sourceRendezVous?: string;
  antecedentsMedicaux?: string[];
  nombreConsultations: number;
  derniereConsultation?: string;
  prochainRdv?: string;
  ancienNumeroFiche?: string;
  numeroFiche: string;
  montantDerniereConsultation?: number;
  montantTotal: number;
  typePaiement?: string;
  confirmationRendezVous: ConfirmationStatus;
  status: 'Validé' | 'Non Validé' | 'Supprimé';
  deleted?: boolean;
  createdFrom?: 'patient' | 'agenda' | 'paiement' | 'tableau de bord';
  modifiedFrom?: 'patients' | 'agenda' | 'paiement' | 'tableau de bord';
}

export interface ConsultationInfo {
  id: string;
  patientId: string;
  date: string;
  montant: number;
  typePaiement?: string;
  notes?: string;
  createdFrom?: 'paiement' | 'agenda';
}

export interface RendezVous {
  id: string;
  patientId: string;
  date: string;
  heure: string;
  source?: string;
  motif?: string;
  status: 'Confirmé' | 'En attente' | 'Annulé';
  notes?: string;
  createdFrom?: 'agenda';
}