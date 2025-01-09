export type PatientStatus = 'Validé' | 'Non Validé' | 'Supprimé' | 'Annulé' | 'Reporté' | 'Absent' | 'En attente' | '-';
export type PatientNumberPrefix = 'P' | 'PA' | 'PS';

export interface PatientNumberOptions {
  prefix: PatientNumberPrefix;
  startNumber?: number;
  padLength?: number;
}
