interface TableNpatient {
  PXXXX: string[];    // Numéros disponibles pour les patients validés
  PAXXXX: string[];   // Numéros disponibles pour les patients annulés/reportés
  PSXXXX: string[];   // Numéros disponibles pour les patients supprimés
}

export class PatientNumberManager {
  private static instance: PatientNumberManager;
  private tableNpatient: TableNpatient;
  private lastNumbers: { [key: string]: number } = {
    P: 0,
    PA: 0,
    PS: 0
  };

  private constructor() {
    // Initialiser ou charger depuis le localStorage
    const savedTable = localStorage.getItem('tableNpatient');
    this.tableNpatient = savedTable ? JSON.parse(savedTable) : {
      PXXXX: [],
      PAXXXX: [],
      PSXXXX: []
    };

    // Initialiser les derniers numéros utilisés et trier les numéros disponibles
    this.initializeLastNumbers();
    this.sortAvailableNumbers();
  }

  private sortAvailableNumbers() {
    // Trier les numéros dans chaque catégorie par ordre numérique
    this.tableNpatient.PXXXX.sort((a, b) => {
      const numA = parseInt(a.replace('P', ''));
      const numB = parseInt(b.replace('P', ''));
      return numA - numB;
    });
    this.tableNpatient.PAXXXX.sort((a, b) => {
      const numA = parseInt(a.replace('PA', ''));
      const numB = parseInt(b.replace('PA', ''));
      return numA - numB;
    });
    this.tableNpatient.PSXXXX.sort((a, b) => {
      const numA = parseInt(a.replace('PS', ''));
      const numB = parseInt(b.replace('PS', ''));
      return numA - numB;
    });
  }

  public static getInstance(): PatientNumberManager {
    if (!PatientNumberManager.instance) {
      PatientNumberManager.instance = new PatientNumberManager();
    }
    return PatientNumberManager.instance;
  }

  private initializeLastNumbers() {
    const allPatients = JSON.parse(localStorage.getItem('patients') || '[]');
    console.log('Initializing numbers from patients:', allPatients);

    // Créer des ensembles pour stocker les numéros existants par catégorie
    const existingP = new Set<string>();
    const existingPA = new Set<string>();
    const existingPS = new Set<string>();
    
    allPatients.forEach((patient: any) => {
      if (!patient.numeroPatient) return;
      
      // Stocker les numéros actuellement utilisés
      if (patient.numeroPatient.startsWith('P') && patient.numeroPatient.length === 5) {
        existingP.add(patient.numeroPatient);
      } else if (patient.numeroPatient.startsWith('PA')) {
        existingPA.add(patient.numeroPatient);
      } else if (patient.numeroPatient.startsWith('PS')) {
        existingPS.add(patient.numeroPatient);
      }
    });

    console.log('Existing numbers:', { P: existingP, PA: existingPA, PS: existingPS });

    // Trouver les "trous" dans les séquences et les ajouter aux numéros disponibles
    this.findAndAddAvailableNumbers('P', existingP);
    this.findAndAddAvailableNumbers('PA', existingPA);
    this.findAndAddAvailableNumbers('PS', existingPS);

    console.log('Available numbers after initialization:', this.tableNpatient);
  }

  private findAndAddAvailableNumbers(prefix: string, usedNumbers: Set<string>) {
    const maxNum = Array.from(usedNumbers)
      .map(n => parseInt(n.replace(prefix, '')))
      .reduce((max, num) => Math.max(max, num), 0);

    // Trouver les numéros manquants dans la séquence
    for (let i = 1; i <= maxNum; i++) {
      const numStr = prefix + String(i).padStart(4, '0');
      if (!usedNumbers.has(numStr)) {
        switch (prefix) {
          case 'P':
            if (!this.tableNpatient.PXXXX.includes(numStr)) {
              this.tableNpatient.PXXXX.push(numStr);
            }
            break;
          case 'PA':
            if (!this.tableNpatient.PAXXXX.includes(numStr)) {
              this.tableNpatient.PAXXXX.push(numStr);
            }
            break;
          case 'PS':
            if (!this.tableNpatient.PSXXXX.includes(numStr)) {
              this.tableNpatient.PSXXXX.push(numStr);
            }
            break;
        }
      }
    }
  }

  private saveTable() {
    this.sortAvailableNumbers();
    localStorage.setItem('tableNpatient', JSON.stringify(this.tableNpatient));
  }

  private getNextNumber(prefix: string): string {
    let nextNum = 1;
    const existingNumbers = new Set<number>();

    // Collecter tous les numéros existants pour ce préfixe
    const allPatients = JSON.parse(localStorage.getItem('patients') || '[]');
    allPatients.forEach((patient: any) => {
      if (patient.numeroPatient?.startsWith(prefix)) {
        const num = parseInt(patient.numeroPatient.replace(prefix, ''));
        if (!isNaN(num)) {
          existingNumbers.add(num);
        }
      }
    });

    // Trouver le premier numéro disponible
    while (existingNumbers.has(nextNum)) {
      nextNum++;
    }

    return `${prefix}${String(nextNum).padStart(4, '0')}`;
  }

  public getNewNumber(status: string): string {
    console.log('Getting new number for status:', status);
    console.log('Current available numbers:', this.tableNpatient);

    if (status === 'En attente' || !status || status === '-') {
      return '-';
    }

    let prefix: string;
    let availableNumbers: string[];

    switch (status.toLowerCase()) {
      case 'validé':
        prefix = 'P';
        availableNumbers = this.tableNpatient.PXXXX;
        break;
      case 'annulé':
      case 'reporté':
        prefix = 'PA';
        availableNumbers = this.tableNpatient.PAXXXX;
        break;
      case 'supprimé':
        prefix = 'PS';
        availableNumbers = this.tableNpatient.PSXXXX;
        break;
      default:
        return '-';
    }

    console.log('Using prefix:', prefix);
    console.log('Available numbers for this status:', availableNumbers);

    // Utiliser un numéro disponible s'il y en a
    if (availableNumbers.length > 0) {
      const number = availableNumbers.shift()!;
      console.log('Using available number:', number);
      this.saveTable();
      return number;
    }

    // Sinon, générer un nouveau numéro
    const newNumber = this.getNextNumber(prefix);
    console.log('Generated new number:', newNumber);
    return newNumber;
  }

  public releaseNumber(number: string | undefined) {
    console.log('Releasing number:', number);
    if (!number || number === '-') return;

    // Ajouter le numéro à la bonne catégorie
    if (number.startsWith('P') && number.length === 5) {
      if (!this.tableNpatient.PXXXX.includes(number)) {
        console.log('Adding to PXXXX:', number);
        this.tableNpatient.PXXXX.push(number);
      }
    } else if (number.startsWith('PA')) {
      if (!this.tableNpatient.PAXXXX.includes(number)) {
        console.log('Adding to PAXXXX:', number);
        this.tableNpatient.PAXXXX.push(number);
      }
    } else if (number.startsWith('PS')) {
      if (!this.tableNpatient.PSXXXX.includes(number)) {
        console.log('Adding to PSXXXX:', number);
        this.tableNpatient.PSXXXX.push(number);
      }
    }

    this.saveTable();
    console.log('Current table state after release:', this.tableNpatient);
  }

  public resetAvailableNumbers() {
    console.log('Resetting available numbers');
    
    // Vider les tableaux existants
    this.tableNpatient = {
      PXXXX: [],
      PAXXXX: [],
      PSXXXX: []
    };

    // Réinitialiser à partir des patients existants
    this.initializeLastNumbers();
    this.saveTable();

    console.log('Numbers reset complete. New state:', this.tableNpatient);
  }

  public updatePatientNumber(currentNumber: string | undefined, newStatus: string): string {
    // Si le statut est "En attente", pas de numéro
    if (newStatus === 'En attente' || !newStatus || newStatus === '-') {
      if (currentNumber) {
        this.releaseNumber(currentNumber);
      }
      return '-';
    }

    // Vérifier si le numéro actuel correspond au bon format pour le nouveau statut
    if (currentNumber) {
      const isValidFormat = (
        (newStatus.toLowerCase() === 'validé' && currentNumber.startsWith('P') && currentNumber.length === 5) ||
        ((newStatus.toLowerCase() === 'annulé' || newStatus.toLowerCase() === 'reporté') && currentNumber.startsWith('PA')) ||
        (newStatus.toLowerCase() === 'supprimé' && currentNumber.startsWith('PS'))
      );

      if (isValidFormat) {
        return currentNumber;
      }

      // Libérer l'ancien numéro
      this.releaseNumber(currentNumber);
    }

    // Obtenir un nouveau numéro
    return this.getNewNumber(newStatus);
  }
}
