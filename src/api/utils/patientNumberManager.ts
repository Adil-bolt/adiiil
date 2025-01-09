interface TableNpatient {
  PXXXX: string[];    // Numéros pour patients validés (P0001, P0002, etc.)
  PAXXXX: string[];   // Numéros pour patients annulés/reportés (PA0001, PA0002, etc.)
  PSXXXX: string[];   // Numéros pour patients supprimés (PS0001, PS0002, etc.)
  disponibles: {      // Numéros libérés disponibles par catégorie
    PXXXX: string[];
    PAXXXX: string[];
    PSXXXX: string[];
  };
}

let tableNpatient: TableNpatient = {
  PXXXX: [],
  PAXXXX: [],
  PSXXXX: [],
  disponibles: {
    PXXXX: [],
    PAXXXX: [],
    PSXXXX: []
  }
};

// Charger les données sauvegardées
const loadStoredData = () => {
  const storedData = localStorage.getItem('tableNpatient');
  if (storedData) {
    tableNpatient = JSON.parse(storedData);
    // S'assurer que la structure disponibles existe
    if (!tableNpatient.disponibles) {
      tableNpatient.disponibles = {
        PXXXX: [],
        PAXXXX: [],
        PSXXXX: []
      };
    }
  }
};

// Sauvegarder les données
const saveData = () => {
  localStorage.setItem('tableNpatient', JSON.stringify(tableNpatient));
};

// Charger les données au démarrage
loadStoredData();

/**
 * Vérifie si un numéro est déjà utilisé
 */
const isNumberInUse = (number: string): boolean => {
  if (!number) return false;
  return (
    tableNpatient.PXXXX.includes(number) ||
    tableNpatient.PAXXXX.includes(number) ||
    tableNpatient.PSXXXX.includes(number)
  );
};

/**
 * Libère un numéro pour réutilisation future
 */
const releaseNumber = (number: string) => {
  if (!number || number === '-') return;

  // Déterminer la catégorie du numéro
  let category: keyof typeof tableNpatient.disponibles;
  if (number.startsWith('PS')) {
    category = 'PSXXXX';
  } else if (number.startsWith('PA')) {
    category = 'PAXXXX';
  } else {
    category = 'PXXXX';
  }

  // Retirer le numéro de toutes les listes actives
  tableNpatient.PXXXX = tableNpatient.PXXXX.filter(n => n !== number);
  tableNpatient.PAXXXX = tableNpatient.PAXXXX.filter(n => n !== number);
  tableNpatient.PSXXXX = tableNpatient.PSXXXX.filter(n => n !== number);

  // Ajouter le numéro à la liste des numéros disponibles de sa catégorie
  if (!tableNpatient.disponibles[category].includes(number)) {
    tableNpatient.disponibles[category].push(number);
  }

  saveData();
};

/**
 * Trouve le prochain numéro disponible pour un préfixe donné
 */
const getNextAvailableNumber = (prefix: string): string => {
  const category = prefix === 'P' ? 'PXXXX' : prefix === 'PA' ? 'PAXXXX' : 'PSXXXX';
  
  // Chercher d'abord dans les numéros disponibles de la catégorie
  if (tableNpatient.disponibles[category].length > 0) {
    const number = tableNpatient.disponibles[category].shift()!;
    saveData();
    return number;
  }

  // Si aucun numéro n'est disponible, en générer un nouveau
  const currentNumbers = tableNpatient[category];
  let counter = 1;
  
  while (true) {
    const newNumber = `${prefix}${counter.toString().padStart(4, '0')}`;
    if (!isNumberInUse(newNumber)) {
      return newNumber;
    }
    counter++;
  }
};

/**
 * Attribue un numéro à un patient en fonction de son statut
 */
const assignNumber = (status: string): string => {
  console.log('Attribution d\'un numéro pour le statut:', status);
  
  // En attente ou pas de statut = pas de numéro
  if (!status || status === '-' || status.toLowerCase() === 'en attente') {
    return '-';
  }

  let prefix: string;
  let targetList: keyof TableNpatient;

  switch (status.toLowerCase()) {
    case 'validé':
      prefix = 'P';
      targetList = 'PXXXX';
      break;
    case 'annulé':
    case 'reporté':
    case 'absent':
      prefix = 'PA';
      targetList = 'PAXXXX';
      break;
    case 'supprimé':
      prefix = 'PS';
      targetList = 'PSXXXX';
      break;
    default:
      return '-';
  }

  const newNumber = getNextAvailableNumber(prefix);
  tableNpatient[targetList].push(newNumber);
  saveData();
  
  console.log('Nouveau numéro attribué:', newNumber);
  return newNumber;
};

/**
 * Met à jour le numéro d'un patient en fonction de son statut
 */
export const updatePatientNumber = (currentNumber: string | undefined, newStatus: string): string => {
  console.log('Mise à jour du numéro patient:', { currentNumber, newStatus });
  
  // Si le patient n'a pas de numéro et que le nouveau statut est en attente
  if ((!currentNumber || currentNumber === '-') && (newStatus === '-' || newStatus.toLowerCase() === 'en attente')) {
    return '-';
  }

  // Libérer l'ancien numéro s'il existe
  if (currentNumber && currentNumber !== '-') {
    releaseNumber(currentNumber);
  }

  // Attribuer un nouveau numéro en fonction du statut
  const newNumber = assignNumber(newStatus);
  console.log('Nouveau numéro attribué:', newNumber);
  return newNumber;
};

/**
 * Réinitialise la table des numéros
 */
export const resetTableNpatient = () => {
  tableNpatient = {
    PXXXX: [],
    PAXXXX: [],
    PSXXXX: [],
    disponibles: {
      PXXXX: [],
      PAXXXX: [],
      PSXXXX: []
    }
  };
  saveData();
};

/**
 * Obtient l'état actuel de la table des numéros
 */
export const getTableNpatientState = (): TableNpatient => {
  return { ...tableNpatient };
};
