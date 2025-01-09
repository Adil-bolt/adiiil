// Fonctions utilitaires pour formater les données d'affichage de manière cohérente
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Patient {
  id?: string;
  numeroPatient?: string;
  nom?: string;
  prenom?: string;
  status?: string;
  deleted?: boolean;
  mutuelle?: {
    active: boolean;
    nom: string;
  };
}

interface Appointment {
  id?: string;
  time?: string;
  amount?: string;
  montant?: string;
  status?: string;
  type?: string;
  paymentMethod?: string;
  mutuelle?: {
    active: boolean;
    nom: string;
  };
  deleted?: boolean;
  nom?: string;
  prenom?: string;
  numeroPatient?: string;
  patient?: string;
}

/**
 * Formate le nom complet du patient de manière cohérente
 */
export const formatPatientName = (nom: string | undefined | null, prenom: string | undefined | null): string => {
  if (!nom && !prenom) return '-';
  const safeName = nom?.trim() || '';
  const safePrenom = prenom?.trim() || '';
  return `${safeName.toUpperCase()} ${safePrenom.charAt(0).toUpperCase()}${safePrenom.slice(1).toLowerCase()}`.trim();
};

/**
 * Formate un nom complet en séparant le nom et le prénom
 */
export const formatFullName = (fullName: string | null | undefined): string => {
  if (!fullName) return '-';

  const parts = fullName.trim().split(' ');
  if (parts.length === 0) return '-';

  // Si nous avons plusieurs parties, considérer la première comme le nom
  // et le reste comme le prénom
  const nom = parts[0].toUpperCase();
  const prenom = parts.slice(1)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');

  return prenom ? `${nom} ${prenom}` : nom;
};

/**
 * Formate le numéro de patient
 */
export const formatPatientNumber = (numeroPatient: string | null | undefined): string => {
  return numeroPatient || '-';
};

/**
 * Formate la date et l'heure
 */
export const formatDateTime = (dateTime: string | Date | null | undefined): string => {
  if (!dateTime) return '-';
  const date = typeof dateTime === 'string' ? parseISO(dateTime) : dateTime;
  return format(date, 'dd/MM/yyyy HH:mm', { locale: fr });
};

/**
 * Formate le montant
 */
export const formatAmount = (amount: string | number | null | undefined): string => {
  if (!amount) return '- Dhs';
  const cleanAmount = typeof amount === 'string' ? amount.replace(' Dhs', '').trim() : amount.toString();
  return `${cleanAmount} Dhs`;
};

/**
 * Formate le type de paiement
 */
export const formatPaymentMethod = (method: string | null | undefined): string => {
  return method || '-';
};

/**
 * Formate les informations de mutuelle
 */
export const formatMutuelle = (mutuelle: { active: boolean; nom: string; } | null | undefined): string => {
  if (!mutuelle || !mutuelle.active) return '-';
  return mutuelle.nom || '-';
};

/**
 * Formate le type de consultation
 */
export const formatConsultationType = (type: string | null | undefined): string => {
  return type || '-';
};

/**
 * Formate le statut
 */
export const formatStatus = (status: string | null | undefined): string => {
  return status || 'En attente';
};

/**
 * Détermine le statut de paiement en fonction du montant
 */
export const getPaymentStatus = (amount: string | number | null | undefined): string => {
  if (!amount && amount !== 0) return 'En attente';
  
  // Nettoyer et convertir le montant
  const cleanAmount = typeof amount === 'string' 
    ? amount.replace(/[^\d,.-]/g, '').replace(',', '.').replace(' Dhs', '')  // Enlever 'Dhs' et convertir la virgule en point
    : amount;
    
  const numericAmount = Number(cleanAmount);

  // Vérifier si le montant est valide
  if (isNaN(numericAmount)) return 'En attente';
  if (numericAmount === 0 || amount === '-') return 'Non payé';
  if (numericAmount === 400) return 'Payé';
  if (numericAmount > 400) return 'Payé';
  if (numericAmount < 400) {
    // Si le montant est 200, alors c'est 50% de 400
    const percentage = Math.round((numericAmount / 400) * 100);
    return `Réduction de ${100 - percentage}%`;
  }
  
  return 'En attente';
};

/**
 * Détermine la couleur en fonction du statut de paiement
 */
export const getStatusColor = (status: string): string => {
  return 'text-white font-semibold'; // Texte blanc en gras pour tous les statuts
};

/**
 * Détermine la couleur de fond en fonction du statut de paiement
 */
export const getStatusBgColor = (status: string): string => {
  if (status === 'Payé') return 'bg-emerald-500'; // Fond vert vif
  if (status === 'Non payé') return 'bg-red-500'; // Fond rouge vif
  if (status.startsWith('Réduction')) return 'bg-blue-500'; // Fond bleu vif
  return 'bg-orange-500'; // Fond orange vif pour 'En attente'
};

/**
 * Vérifie si un patient est validé
 */
export const isPatientValidated = (patient: any, appointments: any[] = []): boolean => {
  if (!patient) return false;

  // Vérifier si le patient lui-même est validé
  const isPatientValidated = patient.status === 'Validé' && !patient.deleted;
  
  // Vérifier si le patient a des rendez-vous validés
  const hasValidatedAppointment = appointments.some(apt => 
    apt.patientId === patient.id && 
    (apt.status === 'Validé' || apt.status === 'validé') && 
    !apt.deleted
  );

  // Log pour le débogage
  console.log('Patient validation check:', {
    patientId: patient.id,
    patientName: `${patient.nom} ${patient.prenom}`,
    patientStatus: patient.status,
    isDeleted: patient.deleted,
    isPatientValidated,
    hasValidatedAppointment,
    appointments: appointments.map(apt => ({
      id: apt.id,
      status: apt.status,
      isDeleted: apt.deleted
    }))
  });

  // Un patient est considéré comme validé si :
  // 1. Son statut est "Validé" et il n'est pas supprimé
  // OU
  // 2. Il a au moins un rendez-vous avec le statut "Validé" qui n'est pas supprimé
  return isPatientValidated || hasValidatedAppointment;
};

/**
 * Formate toutes les informations d'un rendez-vous
 */
export const formatAppointmentData = (appointment: Appointment, patient?: Patient | null) => {
  // Si on n'a pas de patient mais que le rendez-vous a des informations patient
  const patientData = patient || {
    nom: appointment.nom || '',
    prenom: appointment.prenom || '',
    numeroPatient: appointment.numeroPatient || '-'
  };

  // Formater le nom du patient
  const patientName = patient 
    ? formatPatientName(patient.nom, patient.prenom)
    : appointment.patient 
      ? formatFullName(appointment.patient)
      : formatPatientName(patientData.nom, patientData.prenom);

  return {
    patientName,
    patientNumber: formatPatientNumber(patientData.numeroPatient),
    displayTime: formatDateTime(appointment.time),
    displayAmount: formatAmount(appointment.amount || appointment.montant),
    displayPaymentMethod: formatPaymentMethod(appointment.paymentMethod),
    displayMutuelle: formatMutuelle(appointment.mutuelle),
    displayStatus: formatStatus(appointment.status),
    displayType: formatConsultationType(appointment.type)
  };
};
