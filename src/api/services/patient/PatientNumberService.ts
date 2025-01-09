import { Patient } from '../../types/patient';
import { Appointment } from '../../components/calendar/types';

export enum PatientNumberPrefix {
  VALIDATED = 'P',     // Pour les patients validés
  TEMPORARY = 'PS',    // Pour les patients supprimés
  PENDING = 'PA'       // Pour les patients non validés (-, annulé, reporté, absent)
}

export class PatientNumberService {
  private static readonly STORAGE_KEY = 'patient_numbers';
  private static readonly DELETED_NUMBERS_KEY = 'deleted_patient_numbers';
  private static readonly AVAILABLE_NUMBERS_KEY = 'available_patient_numbers';
  private static readonly MAX_NUMBER = 9999;
  private static readonly PADDING = 4;

  public static getNextPatientNumberWithPrefix(prefix: PatientNumberPrefix = PatientNumberPrefix.PENDING): string {
    console.log('[getNextPatientNumber] Début de la génération du numéro');
    
    // D'abord, essayer de réutiliser un numéro libéré
    const deletedNumbers = this.getDeletedNumbers();
    console.log('[getNextPatientNumber] Numéros supprimés disponibles:', deletedNumbers);
    
    if (deletedNumbers.length > 0) {
      // Prendre le plus petit numéro disponible
      const numbers = deletedNumbers.map(n => parseInt(n.replace(/[^\d]/g, '')));
      const smallestNumber = Math.min(...numbers);
      const paddedNumber = smallestNumber.toString().padStart(4, '0');
      
      // Retirer ce numéro de la liste des numéros supprimés
      this.removeFromDeletedNumbers(paddedNumber);
      
      const newNumber = `${prefix}${paddedNumber}`;
      this.reserveNumber(newNumber);
      console.log('[getNextPatientNumber] Réutilisation du numéro:', newNumber);
      return newNumber;
    }

    // Si aucun numéro n'est disponible, générer le prochain numéro séquentiel
    const storedNumbers = this.getStoredNumbers();
    console.log('[getNextPatientNumber] Numéros stockés:', storedNumbers);

    // Filtrer les numéros par préfixe pour maintenir des séquences séparées
    const numbersWithSamePrefix = storedNumbers
      .filter(n => n.startsWith(prefix))
      .map(n => parseInt(n.replace(/[^\d]/g, '')))
      .filter(n => !isNaN(n));

    const nextNumber = numbersWithSamePrefix.length > 0 ? Math.max(...numbersWithSamePrefix) + 1 : 1;
    const paddedNumber = nextNumber.toString().padStart(4, '0');
    const newNumber = `${prefix}${paddedNumber}`;
    
    this.reserveNumber(newNumber);
    console.log('[getNextPatientNumber] Nouveau numéro généré:', newNumber);
    return newNumber;
  }

  public static resetNumbering(): void {
    console.log('[resetNumbering] Réinitialisation de la numérotation');
    localStorage.removeItem(this.STORAGE_KEY);
    localStorage.removeItem(this.DELETED_NUMBERS_KEY);
    localStorage.removeItem(this.AVAILABLE_NUMBERS_KEY);
  }

  private static getDeletedNumbers(): string[] {
    const stored = localStorage.getItem(this.DELETED_NUMBERS_KEY);
    return stored ? JSON.parse(stored) : [];
  }

  private static saveDeletedNumbers(numbers: string[]): void {
    localStorage.setItem(this.DELETED_NUMBERS_KEY, JSON.stringify(numbers));
  }

  private static addToDeletedNumbers(number: string): void {
    const baseNumber = number.replace(/[^\d]/g, '');
    const deletedNumbers = this.getDeletedNumbers();
    if (!deletedNumbers.includes(baseNumber)) {
      deletedNumbers.push(baseNumber);
      this.saveDeletedNumbers(deletedNumbers);
    }
  }

  private static removeFromDeletedNumbers(number: string): void {
    const baseNumber = number.replace(/[^\d]/g, '');
    const deletedNumbers = this.getDeletedNumbers();
    const index = deletedNumbers.indexOf(baseNumber);
    if (index > -1) {
      deletedNumbers.splice(index, 1);
      this.saveDeletedNumbers(deletedNumbers);
    }
  }

  public static updatePatientNumberStatus(
    currentNumber: string,
    newStatus: string,
    isDeleted: boolean = false
  ): string | null {
    console.log('[updatePatientNumberStatus] Mise à jour du numéro:', {
      currentNumber,
      newStatus,
      isDeleted
    });

    if (!currentNumber) return null;

    // Déterminer si le numéro doit être libéré
    const shouldReleaseNumber = ['annulé', 'supprimé'].includes(newStatus.toLowerCase());

    // Si le statut est annulé ou supprimé, libérer le numéro
    if (shouldReleaseNumber) {
      console.log('[updatePatientNumberStatus] Libération du numéro:', currentNumber);
      this.addToDeletedNumbers(currentNumber);
      const numbers = this.getStoredNumbers();
      const index = numbers.indexOf(currentNumber);
      if (index > -1) {
        numbers.splice(index, 1);
        this.saveNumbers(numbers);
      }
      return currentNumber;
    }

    // Extraire le numéro actuel
    const currentNumberOnly = currentNumber.replace(/[^\d]/g, '');
    
    if (!currentNumberOnly) {
      console.warn('[updatePatientNumberStatus] Numéro invalide:', currentNumber);
      return null;
    }

    // Formater le nouveau numéro avec le même préfixe PS
    let newPrefix: string;
    if (newStatus === 'Validé') {
      newPrefix = PatientNumberPrefix.VALIDATED;
    } else if (isDeleted) {
      newPrefix = PatientNumberPrefix.TEMPORARY;
    } else {
      newPrefix = PatientNumberPrefix.PENDING;
    }

    const newNumber = `${newPrefix}${currentNumberOnly.padStart(4, '0')}`;
    console.log('[updatePatientNumberStatus] Nouveau numéro généré:', newNumber);

    // Mettre à jour les listes de numéros
    const currentNumbers = this.getStoredNumbers();
    const deletedNumbers = this.getDeletedNumbers();

    // Supprimer l'ancien numéro des listes
    const updatedCurrentNumbers = currentNumbers.filter(n => n !== currentNumber);
    const updatedDeletedNumbers = deletedNumbers.filter(n => n !== currentNumber);

    // Ajouter le nouveau numéro à la liste appropriée
    if (isDeleted || shouldReleaseNumber) {
      updatedDeletedNumbers.push(newNumber);
    } else {
      updatedCurrentNumbers.push(newNumber);
    }

    // Sauvegarder les modifications
    this.saveNumbers(updatedCurrentNumbers);
    this.saveDeletedNumbers(updatedDeletedNumbers);

    return newNumber;
  }

  public static releaseNumber(number: string, patients: Patient[]): void {
    if (!number) return;
    
    const baseNumber = number.replace(/[^\d]/g, '');
    if (!this.isNumberUsedByOtherPatient(number, patients)) {
      this.addToDeletedNumbers(baseNumber);
      const numbers = this.getStoredNumbers();
      const index = numbers.indexOf(number);
      if (index > -1) {
        numbers.splice(index, 1);
        this.saveNumbers(numbers);
      }
    }
  }

  private static getStoredNumbers(): string[] {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  }

  private static saveNumbers(numbers: string[]): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(numbers));
  }

  private static isNumberUsedByOtherPatient(number: string, patients: Patient[]): boolean {
    return patients.some(p => p.numeroPatient === number);
  }

  public static reserveNumber(number: string): void {
    if (!number) return;
    
    const numbers = this.getStoredNumbers();
    if (!numbers.includes(number)) {
      numbers.push(number);
      this.saveNumbers(numbers);
    }
  }

  public static findOrGeneratePatientNumber(
    nom: string,
    prenom: string,
    patients: Patient[],
    status?: string,
    isDeleted: boolean = false
  ): string {
    console.log('Finding or generating patient number:', { nom, prenom, status, isDeleted });
    
    // Chercher d'abord si le patient existe déjà
    const existingPatient = patients.find(
      p => 
        p.nom.toLowerCase() === nom.toLowerCase() && 
        p.prenom.toLowerCase() === prenom.toLowerCase()
    );

    if (existingPatient?.numeroPatient) {
      // Si le patient existe, mettre à jour son numéro selon le statut
      const updatedNumber = this.updatePatientNumberStatus(
        existingPatient.numeroPatient,
        status || '-',
        isDeleted
      );
      if (updatedNumber) {
        return updatedNumber;
      }
      return existingPatient.numeroPatient;
    }

    // Si aucun patient existant n'est trouvé ou si la mise à jour a échoué, générer un nouveau numéro
    let prefix = PatientNumberPrefix.PENDING;
    if (status === 'Validé') {
      prefix = PatientNumberPrefix.VALIDATED;
    } else if (isDeleted) {
      prefix = PatientNumberPrefix.TEMPORARY;
    }

    return this.getNextPatientNumberWithPrefix(prefix);
  }

  public static removeNumber(number: string): void {
    console.log('[removeNumber] Suppression du numéro:', number);
    
    if (!number) return;

    // Supprimer le numéro des deux listes
    const currentNumbers = this.getStoredNumbers().filter(n => n !== number);
    const deletedNumbers = this.getDeletedNumbers().filter(n => n !== number);

    // Sauvegarder les listes mises à jour
    this.saveNumbers(currentNumbers);
    this.saveDeletedNumbers(deletedNumbers);

    // Ajouter le numéro aux disponibles
    this.addToAvailable(number);

    console.log('[removeNumber] Numéro supprimé avec succès');
  }

  public static generateNumber(existingNumbers: string[]): string {
    const numbers = existingNumbers
      .filter(num => num.startsWith(this.PREFIX))
      .map(num => parseInt(num.substring(this.PREFIX.length), 10))
      .filter(num => !isNaN(num));

    const maxNumber = numbers.length > 0 ? Math.max(...numbers) : 0;
    const nextNumber = maxNumber + 1;
    
    return `${this.PREFIX}${nextNumber.toString().padStart(this.PADDING, '0')}`;
  }

  public static isValidNumber(number: string): boolean {
    if (!number.startsWith(this.PREFIX)) return false;
    const numPart = number.substring(this.PREFIX.length);
    if (numPart.length !== this.PADDING) return false;
    return !isNaN(parseInt(numPart, 10));
  }

  public static formatPatientNumber(number: string | undefined): string {
    if (!number) return '';
    
    // Si le numéro commence déjà par PS, le retourner tel quel
    if (number.startsWith(this.PREFIX)) {
      return number;
    }

    // Extraire le numéro sans préfixe
    const numericPart = number.replace(/[^0-9]/g, '');
    
    // Formater avec le nouveau préfixe
    return `${this.PREFIX}${numericPart.padStart(this.PADDING, '0')}`;
  }

  public static formatPatientNumberByStatus(patientNumber: string, status: string, isDeleted: boolean = false): string {
    // Libérer l'ancien numéro
    this.addToAvailable(patientNumber);

    let prefix: string;
    if (isDeleted) {
      prefix = 'PS';
    } else if (status === 'Validé') {
      prefix = 'P';
    } else if (['Annulé', 'Reporté', 'Absent', '-'].includes(status)) {
      prefix = 'PA';
    } else {
      return patientNumber;
    }

    // Essayer d'obtenir un numéro disponible
    const availableNumber = this.getNextAvailableNumber(prefix);
    if (availableNumber) {
      return availableNumber;
    }

    // Si aucun numéro n'est disponible, en générer un nouveau
    const currentNumbers = this.getAllNumbers()
      .filter(n => n.startsWith(prefix))
      .map(n => parseInt(n.replace(/[^\d]/g, '')));
    
    const maxNumber = currentNumbers.length > 0 ? Math.max(...currentNumbers) : 0;
    const newNumber = `${prefix}${(maxNumber + 1).toString().padStart(4, '0')}`;
    
    return newNumber;
  }

  public static getAllNumbers(): string[] {
    const storedNumbers = JSON.parse(localStorage.getItem('patient_numbers') || '[]');
    const deletedNumbers = JSON.parse(localStorage.getItem('deleted_patient_numbers') || '[]');
    const availableNumbers = JSON.parse(localStorage.getItem('available_patient_numbers') || '[]');
    return [...storedNumbers, ...deletedNumbers, ...availableNumbers];
  }

  private static getAvailableNumbers(): string[] {
    const availableNumbers = localStorage.getItem(this.AVAILABLE_NUMBERS_KEY);
    return availableNumbers ? JSON.parse(availableNumbers) : [];
  }

  private static saveAvailableNumbers(numbers: string[]) {
    localStorage.setItem(this.AVAILABLE_NUMBERS_KEY, JSON.stringify(numbers));
  }

  public static addToAvailable(number: string) {
    const numbers = this.getAvailableNumbers();
    if (!numbers.includes(number)) {
      numbers.push(number);
      this.saveAvailableNumbers(numbers);
    }
  }

  public static getNextAvailableNumber(prefix: string): string | null {
    const numbers = this.getAvailableNumbers();
    const matchingNumbers = numbers.filter(n => n.startsWith(prefix));
    if (matchingNumbers.length > 0) {
      // Trier les numéros pour prendre le plus petit
      matchingNumbers.sort((a, b) => {
        const numA = parseInt(a.replace(/[^\d]/g, ''));
        const numB = parseInt(b.replace(/[^\d]/g, ''));
        return numA - numB;
      });
      const number = matchingNumbers[0];
      // Retirer le numéro de la liste des disponibles
      this.saveAvailableNumbers(numbers.filter(n => n !== number));
      return number;
    }
    return null;
  }
}