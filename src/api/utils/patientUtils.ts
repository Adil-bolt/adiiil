import { Patient } from '../types/patient';
import { Appointment } from '../components/calendar/types';
import { format, parseISO, startOfDay, isSameDay, isAfter, isBefore, compareAsc } from 'date-fns';
import { fr } from 'date-fns/locale';

const PENDING_STATUSES = ['-', 'Annulé', 'Reporté', 'Absent'];

export function getUniquePatients(patients: Patient[]): Patient[] {
  const patientMap = new Map();
  const nameToNumberMap = new Map(); // Pour suivre les numéros par nom de patient

  // Trier les patients par numéro (pour garder les plus petits numéros)
  const sortedPatients = [...patients].sort((a, b) => {
    const numA = parseInt(a.numeroPatient.slice(1));
    const numB = parseInt(b.numeroPatient.slice(1));
    return numA - numB;
  });

  // Premier passage : traiter les patients
  sortedPatients.forEach(patient => {
    const fullName = `${patient.nom.toLowerCase()} ${patient.prenom.toLowerCase()}`;
    const patientNumber = patient.numeroPatient;

    // Si nous n'avons pas encore vu ce nom
    if (!nameToNumberMap.has(fullName)) {
      nameToNumberMap.set(fullName, patientNumber);
      patientMap.set(fullName, patient);
    }
    // Si nous avons déjà vu ce nom, mais le numéro actuel est un P et l'ancien ne l'est pas
    else if (
      patientNumber.startsWith('P') && 
      !nameToNumberMap.get(fullName).startsWith('P')
    ) {
      nameToNumberMap.set(fullName, patientNumber);
      patientMap.set(fullName, patient);
    }
  });

  return Array.from(patientMap.values());
}

export function enrichPatientWithAppointments(
  patient: Patient, 
  appointments: Appointment[]
): Patient & {
  nombreConsultations: number;
  derniereConsultation?: string;
  prochainRdv?: string;
  patientStatus: 'pending' | 'validated';
  status: 'Supprimé' | 'Validé' | '-';
  consultations: any[];
} {
  const today = startOfDay(new Date());
  
  // Filtrer les rendez-vous valides du patient en évitant les doublons
  const seenAppointments = new Set<string>();
  const patientAppointments = appointments.filter(apt => {
    if (apt.deleted) return false;
    
    // Vérifier si c'est le même patient
    const isMatchingPatient = apt.patientId === patient.id || 
      (apt.nom?.toLowerCase() === patient.nom.toLowerCase() && 
       apt.prenom?.toLowerCase() === patient.prenom.toLowerCase());
    
    if (!isMatchingPatient) return false;
    
    // Éviter les doublons en utilisant la date et l'heure comme clé unique
    const appointmentKey = `${apt.time}_${apt.status}`;
    if (seenAppointments.has(appointmentKey)) return false;
    
    seenAppointments.add(appointmentKey);
    return true;
  });

  // Trier les rendez-vous par date
  const sortedAppointments = [...patientAppointments].sort((a, b) => {
    const dateA = parseISO(a.time);
    const dateB = parseISO(b.time);
    return compareAsc(dateA, dateB);
  });

  // Vérifier les différents types de statuts
  const hasValidatedAppointment = patientAppointments.some(apt => apt.status === 'Validé');
  const hasPendingAppointment = patientAppointments.some(apt => apt.status === '-' || !apt.status);
  const hasReportedAppointment = patientAppointments.some(apt => apt.status?.toLowerCase() === 'reporté');
  const hasCanceledAppointment = patientAppointments.some(apt => apt.status?.toLowerCase() === 'annulé');
  const hasAbsentAppointment = patientAppointments.some(apt => apt.status?.toLowerCase() === 'absent');

  // Calculer le nombre de consultations validées
  const validatedAppointments = patientAppointments.filter(apt => 
    !apt.deleted && apt.status === 'Validé'
  );

  // Trouver la dernière consultation (passée)
  const lastAppointment = [...sortedAppointments]
    .reverse()
    .find(apt => {
      const aptDate = parseISO(apt.time);
      return isBefore(aptDate, today) || isSameDay(aptDate, today);
    });

  // Trouver le prochain rendez-vous (futur)
  const nextAppointment = sortedAppointments
    .find(apt => {
      const aptDate = parseISO(apt.time);
      return isAfter(aptDate, today);
    });

  // Déterminer le statut du patient
  let status = patient.deleted ? 'Supprimé' : patient.status || '-';
  
  if (!patient.deleted) {
    if (hasValidatedAppointment) {
      status = 'Validé';
    } else if (lastAppointment) {
      // Utiliser le statut du dernier rendez-vous si disponible
      status = lastAppointment.status || status;
    } else if (hasReportedAppointment) {
      status = 'Reporté';
    } else if (hasAbsentAppointment) {
      status = 'Absent';
    } else if (hasCanceledAppointment) {
      status = 'Annulé';
    } else if (hasPendingAppointment) {
      status = '-';
    }
  }

  // Enrichir les consultations avec plus de détails
  const enrichedConsultations = sortedAppointments.map(apt => ({
    id: apt.id,
    date: format(parseISO(apt.time), 'dd/MM/yyyy', { locale: fr }),
    time: format(parseISO(apt.time), 'HH:mm', { locale: fr }),
    status: apt.status || '-',
    amount: apt.amount,
    paid: apt.paid,
    paymentMethod: apt.paymentMethod,
    isNewPatient: apt.isNewPatient,
    isControl: apt.isControl,
    isCanceled: apt.isCanceled,
    ficheNumber: apt.ficheNumber
  }));

  return {
    ...patient,
    nombreConsultations: validatedAppointments.length,
    derniereConsultation: lastAppointment 
      ? format(parseISO(lastAppointment.time), 'dd/MM/yyyy', { locale: fr })
      : undefined,
    prochainRdv: nextAppointment
      ? format(parseISO(nextAppointment.time), 'dd/MM/yyyy', { locale: fr })
      : undefined,
    patientStatus: hasValidatedAppointment ? 'validated' : 'pending',
    status,
    consultations: enrichedConsultations,
    hasAppointments: patientAppointments.length > 0,
    hasValidatedAppointment,
    hasPendingAppointment,
    hasReportedAppointment,
    hasCanceledAppointment,
    hasAbsentAppointment
  };
}

export function shouldRemovePatient(patient: Patient, appointments: Appointment[]): boolean {
  const validAppointments = appointments.filter(apt => 
    !apt.deleted && 
    (apt.patientId === patient.id || 
    (apt.nom?.toLowerCase() === patient.nom.toLowerCase() && 
     apt.prenom?.toLowerCase() === patient.prenom.toLowerCase()))
  );

  return validAppointments.length === 0;
}

export function generatePatientNumber(index: number, status: 'pending' | 'validated'): string {
  const prefix = status === 'pending' ? 'PA' : 'P';
  return `${prefix}${String(index).padStart(4, '0')}`;
}

export function assignPatientNumbers(patients: (Patient & { patientStatus: 'pending' | 'validated' })[]): Patient[] {
  // Separate patients by status
  const pendingPatients = patients.filter(p => p.patientStatus === 'pending');
  const validatedPatients = patients.filter(p => p.patientStatus === 'validated');

  // Assign numbers to each group
  const numberedPatients = [
    ...pendingPatients.map((patient, index) => ({
      ...patient,
      numeroPatient: generatePatientNumber(index + 1, 'pending')
    })),
    ...validatedPatients.map((patient, index) => ({
      ...patient,
      numeroPatient: generatePatientNumber(index + 1, 'validated')
    }))
  ];

  return numberedPatients;
}

export function cleanupDuplicatePatients(patients: Patient[], appointments: Appointment[]): {
  patientsToKeep: Patient[];
  duplicatesToRemove: Patient[];
  appointmentsToUpdate: Appointment[];
} {
  const patientMap = new Map<string, Patient[]>();
  const result = {
    patientsToKeep: [] as Patient[],
    duplicatesToRemove: [] as Patient[],
    appointmentsToUpdate: [] as Appointment[]
  };

  // Grouper les patients par nom
  patients.forEach(patient => {
    const fullName = `${patient.nom.toLowerCase()} ${patient.prenom.toLowerCase()}`;
    if (!patientMap.has(fullName)) {
      patientMap.set(fullName, []);
    }
    patientMap.get(fullName)?.push(patient);
  });

  // Traiter chaque groupe de patients
  patientMap.forEach((patientGroup, fullName) => {
    if (patientGroup.length > 1) {
      // Trier les patients par numéro (garder le plus petit numéro P)
      patientGroup.sort((a, b) => {
        const aIsP = a.numeroPatient.startsWith('P');
        const bIsP = b.numeroPatient.startsWith('P');
        if (aIsP && !bIsP) return -1;
        if (!aIsP && bIsP) return 1;
        return parseInt(a.numeroPatient.slice(1)) - parseInt(b.numeroPatient.slice(1));
      });

      // Garder le premier patient (celui avec le plus petit numéro P)
      const patientToKeep = patientGroup[0];
      result.patientsToKeep.push(patientToKeep);

      // Marquer les autres comme doublons à supprimer
      const duplicates = patientGroup.slice(1);
      result.duplicatesToRemove.push(...duplicates);

      // Mettre à jour les rendez-vous des doublons
      const appointmentsToUpdate = appointments.filter(apt => 
        duplicates.some(dup => 
          apt.patientId === dup.id || 
          (apt.nom?.toLowerCase() === dup.nom.toLowerCase() && 
           apt.prenom?.toLowerCase() === dup.prenom.toLowerCase())
        )
      ).map(apt => ({
        ...apt,
        patientId: patientToKeep.id,
        nom: patientToKeep.nom,
        prenom: patientToKeep.prenom
      }));

      result.appointmentsToUpdate.push(...appointmentsToUpdate);
    } else {
      // Si un seul patient, le garder tel quel
      result.patientsToKeep.push(patientGroup[0]);
    }
  });

  return result;
}