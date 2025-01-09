import { saveAs } from 'file-saver';

const STORAGE_KEY = 'cabinet_medical_data';

interface StorageData {
  patients: any[];
  paiements: any[];
  rendezVous: any[];
  documents: any[];
  lastUpdate?: string;
}

export const saveToLocalStorage = (data: StorageData) => {
  try {
    const dataToSave = {
      ...data,
      lastUpdate: new Date().toISOString()
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
  } catch (error) {
    console.error('Erreur lors de la sauvegarde des données:', error);
  }
};

export const loadFromLocalStorage = (): StorageData | null => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Erreur lors du chargement des données:', error);
    return null;
  }
};

export const exportData = (data: StorageData) => {
  try {
    const dataToExport = {
      ...data,
      exportDate: new Date().toISOString(),
      version: '1.0'
    };

    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], {
      type: 'application/json'
    });

    const fileName = `cabinet_medical_backup_${new Date().toISOString().split('T')[0]}.json`;
    saveAs(blob, fileName);
  } catch (error) {
    console.error('Erreur lors de l\'export des données:', error);
    alert('Une erreur est survenue lors de l\'export des données');
  }
};

export const importData = async (file: File): Promise<StorageData | null> => {
  try {
    const text = await file.text();
    const data = JSON.parse(text);
    
    // Validation basique des données
    if (!data.patients || !data.paiements || !data.rendezVous || !data.documents) {
      throw new Error('Format de fichier invalide');
    }

    return data;
  } catch (error) {
    console.error('Erreur lors de l\'import des données:', error);
    return null;
  }
};

export const saveLocalVersion = () => {
  try {
    // Récupérer toutes les données du localStorage
    const patients = localStorage.getItem('cabinet_medical_patients');
    const appointments = localStorage.getItem('cabinet_medical_appointments');
    const payments = localStorage.getItem('cabinet_medical_payments');
    const supplies = localStorage.getItem('cabinet_medical_supplies');
    const absences = localStorage.getItem('cabinet_medical_absences');
    const users = localStorage.getItem('cabinet_medical_users');
    const patientNumbers = localStorage.getItem('patient_numbers');
    const deletedNumbers = localStorage.getItem('deleted_patient_numbers');

    // Créer un objet avec toutes les données
    const versionData = {
      patients: patients ? JSON.parse(patients) : [],
      appointments: appointments ? JSON.parse(appointments) : [],
      payments: payments ? JSON.parse(payments) : [],
      supplies: supplies ? JSON.parse(supplies) : [],
      absences: absences ? JSON.parse(absences) : [],
      users: users ? JSON.parse(users) : [],
      patientNumbers: patientNumbers ? JSON.parse(patientNumbers) : [],
      deletedNumbers: deletedNumbers ? JSON.parse(deletedNumbers) : [],
      versionDate: new Date().toISOString(),
      version: '2.0'
    };

    // Sauvegarder dans le localStorage avec un timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const versionKey = `cabinet_medical_version_${timestamp}`;
    localStorage.setItem(versionKey, JSON.stringify(versionData));

    // Maintenir une liste des versions
    const versionsList = localStorage.getItem('cabinet_medical_versions') || '[]';
    const versions = JSON.parse(versionsList);
    versions.push({
      key: versionKey,
      date: new Date().toISOString(),
      patientsCount: versionData.patients.length,
      appointmentsCount: versionData.appointments.length
    });
    localStorage.setItem('cabinet_medical_versions', JSON.stringify(versions));

    console.log('Version sauvegardée avec succès:', versionKey);
    return versionKey;
  } catch (error) {
    console.error('Erreur lors de la sauvegarde de la version:', error);
    throw error;
  }
};

export const restoreVersion = (versionKey: string) => {
  try {
    // Récupérer les données de la version
    const versionData = localStorage.getItem(versionKey);
    if (!versionData) {
      throw new Error('Version non trouvée');
    }

    const data = JSON.parse(versionData);

    // Restaurer toutes les données
    if (data.patients) localStorage.setItem('cabinet_medical_patients', JSON.stringify(data.patients));
    if (data.appointments) localStorage.setItem('cabinet_medical_appointments', JSON.stringify(data.appointments));
    if (data.payments) localStorage.setItem('cabinet_medical_payments', JSON.stringify(data.payments));
    if (data.supplies) localStorage.setItem('cabinet_medical_supplies', JSON.stringify(data.supplies));
    if (data.absences) localStorage.setItem('cabinet_medical_absences', JSON.stringify(data.absences));
    if (data.users) localStorage.setItem('cabinet_medical_users', JSON.stringify(data.users));
    if (data.patientNumbers) localStorage.setItem('patient_numbers', JSON.stringify(data.patientNumbers));
    if (data.deletedNumbers) localStorage.setItem('deleted_patient_numbers', JSON.stringify(data.deletedNumbers));

    console.log('Version restaurée avec succès:', versionKey);
    return true;
  } catch (error) {
    console.error('Erreur lors de la restauration de la version:', error);
    throw error;
  }
};

export const listVersions = () => {
  try {
    const versionsList = localStorage.getItem('cabinet_medical_versions') || '[]';
    return JSON.parse(versionsList);
  } catch (error) {
    console.error('Erreur lors de la récupération des versions:', error);
    return [];
  }
};

export const clearAllData = () => {
  // Liste des clés à supprimer
  const keysToRemove = [
    'patients',
    'appointments',
    'visits',
    'patient_numbers',
    'deleted_patient_numbers',
    'available_patient_numbers',
    'patients_search',
    'patients_tab',
    'patients_start_date',
    'patients_end_date',
    'patients_year',
    'local_version',
    'cabinet_medical_versions'
  ];

  // Supprimer chaque clé
  keysToRemove.forEach(key => {
    localStorage.removeItem(key);
  });

  console.log('Toutes les données ont été supprimées');
};

// Gestion des versions locales
export const getLocalVersion = (): string | null => {
  return localStorage.getItem('local_version');
};