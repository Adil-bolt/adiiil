import { parseISO, isSameDay, isBefore } from 'date-fns';
import { Patient } from '../types/patient';
import { Appointment } from '../components/calendar/types';

export function getPreviousFicheNumbers(
  appointments: Appointment[],
  patients: Patient[],
  patientId: string | undefined, 
  currentVisitTime: string,
  currentPatient: { nom: string; prenom: string } | null
): string[] {
  if (!currentVisitTime || !currentPatient) return [];
  
  const currentVisitDate = parseISO(currentVisitTime);
  
  // Trouver toutes les fiches du même patient
  const patientAppointments = appointments
    .filter(apt => {
      // Si on a un ID patient, on compare uniquement par ID
      if (patientId && apt.patientId) {
        return apt.patientId === patientId;
      }
      
      // Sinon, on compare par nom et prénom
      const aptPatient = patients.find(p => p.id === apt.patientId);
      const isSamePatientByName = (
        (aptPatient && 
          aptPatient.nom.toLowerCase() === currentPatient.nom.toLowerCase() &&
          aptPatient.prenom.toLowerCase() === currentPatient.prenom.toLowerCase()) ||
        (apt.nom && apt.prenom &&
          apt.nom.toLowerCase() === currentPatient.nom.toLowerCase() &&
          apt.prenom.toLowerCase() === currentPatient.prenom.toLowerCase())
      );

      return isSamePatientByName;
    });

  // Trouver les fiches validées antérieures à la date actuelle
  const previousFiches = patientAppointments
    .filter(apt => {
      const aptDate = parseISO(apt.time);
      return apt.ficheNumber && 
             apt.status === 'Validé' &&
             !apt.patientDeleted &&
             isBefore(aptDate, currentVisitDate);
    })
    .map(apt => apt.ficheNumber!)
    .filter((value, index, self) => self.indexOf(value) === index);

  // Si aucune fiche trouvée, retourner un tableau vide
  if (previousFiches.length === 0) {
    return [];
  }

  // Retourner la dernière fiche utilisée
  return [previousFiches[previousFiches.length - 1]];
}

export function generateFicheNumber(prefix: string, sequence: number): string {
  return `F${prefix}-${sequence.toString().padStart(3, '0')}`;
}

export function validateFicheNumber(number: string): boolean {
  return /^F\d{4}-\d{3}$/.test(number);
}

export function formatFicheNumber(number: string): string {
  if (!number) return '';
  if (validateFicheNumber(number)) return number;
  
  const cleaned = number.replace(/[^0-9-]/g, '');
  const parts = cleaned.split('-');
  
  if (parts.length === 2) {
    const [prefix, sequence] = parts;
    if (prefix.length === 4 && sequence.length <= 3) {
      return generateFicheNumber(prefix, parseInt(sequence));
    }
  }
  
  return number;
}