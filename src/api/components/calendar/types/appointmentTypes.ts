export interface AppointmentType {
  id: string;
  label: string;
  color: string;
  barColor: string;
}

export const APPOINTMENT_TYPES: Record<string, AppointmentType> = {
  'NOUVELLE CONSULTATION': {
    id: 'new',
    label: 'Nouveaux patients',
    color: 'bg-emerald-500',
    barColor: 'bg-emerald-500'
  },
  'SUIVI': {
    id: 'followup',
    label: 'Suivis',
    color: 'bg-blue-500',
    barColor: 'bg-blue-500'
  },
  'DELEGUE': {
    id: 'delegate',
    label: 'Délégués',
    color: 'bg-amber-500',
    barColor: 'bg-amber-500'
  },
  'GRATUIT': {
    id: 'free',
    label: 'Gratuités',
    color: 'bg-gray-500',
    barColor: 'bg-gray-500'
  }
};