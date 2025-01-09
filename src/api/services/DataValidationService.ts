import { Patient, ConsultationInfo, RendezVous } from '../types/patient';

type ValidationResult = {
  isValid: boolean;
  errors: string[];
};

export class DataValidationService {
  static validatePatient(patient: Partial<Patient>, existingPatients: Patient[] = []): ValidationResult {
    const errors: string[] = [];

    // Validation des champs obligatoires
    if (!patient.nom?.trim()) {
      errors.push('Le nom est obligatoire');
    }
    if (!patient.prenom?.trim()) {
      errors.push('Le prénom est obligatoire');
    }
    if (!patient.contact?.trim()) {
      errors.push('Le contact est obligatoire');
    }

    // Vérification des doublons
    if (patient.nom && patient.prenom) {
      const normalizedNewName = `${patient.nom} ${patient.prenom}`.toLowerCase().trim();
      const hasDuplicate = existingPatients.some(existingPatient => {
        if (existingPatient.id === patient.id) return false; // Ignorer le patient actuel lors d'une modification
        
        const normalizedExistingName = `${existingPatient.nom} ${existingPatient.prenom}`.toLowerCase().trim();
        const hasSameName = normalizedNewName === normalizedExistingName;
        
        const hasSameCIN = patient.cin && 
                          existingPatient.cin && 
                          patient.cin.toLowerCase() === existingPatient.cin.toLowerCase();
        
        return hasSameName || hasSameCIN;
      });

      if (hasDuplicate) {
        errors.push('Un patient avec le même nom et prénom ou la même CIN existe déjà');
      }
    }

    // Validation du numéro de patient
    if (patient.numeroPatient) {
      if (!/^\d{6}$/.test(patient.numeroPatient)) {
        errors.push('Le numéro de patient doit contenir 6 chiffres');
      }
    }

    // Validation de la CIN
    if (patient.cin && !/^[A-Z]{1,2}\d{5,6}$/.test(patient.cin)) {
      errors.push('Format de CIN invalide');
    }

    // Validation des montants
    if (patient.montantDerniereConsultation && patient.montantDerniereConsultation < 0) {
      errors.push('Le montant de la consultation ne peut pas être négatif');
    }
    if (patient.montantTotal && patient.montantTotal < 0) {
      errors.push('Le montant total ne peut pas être négatif');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static validateConsultation(consultation: Partial<ConsultationInfo>): ValidationResult {
    const errors: string[] = [];

    if (!consultation.patientId) {
      errors.push('L\'ID du patient est obligatoire');
    }
    if (!consultation.date) {
      errors.push('La date est obligatoire');
    }
    if (consultation.montant === undefined || consultation.montant < 0) {
      errors.push('Le montant doit être positif ou nul');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static validateRendezVous(rdv: Partial<RendezVous>): ValidationResult {
    const errors: string[] = [];

    if (!rdv.patientId) {
      errors.push('L\'ID du patient est obligatoire');
    }
    if (!rdv.date) {
      errors.push('La date est obligatoire');
    }
    if (!rdv.heure) {
      errors.push('L\'heure est obligatoire');
    }

    // Validation du format de la date
    if (rdv.date && !this.isValidDate(rdv.date)) {
      errors.push('Format de date invalide');
    }

    // Validation du format de l'heure
    if (rdv.heure && !this.isValidTime(rdv.heure)) {
      errors.push('Format d\'heure invalide');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  private static isValidDate(date: string): boolean {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(date)) return false;
    const d = new Date(date);
    return d.toString() !== 'Invalid Date';
  }

  private static isValidTime(time: string): boolean {
    const regex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return regex.test(time);
  }
}
