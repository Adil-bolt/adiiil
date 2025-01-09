import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Patient, ConsultationInfo, RendezVous } from '../types/patient';
import { DataValidationService } from '../services/DataValidationService';
import { VersioningService } from '../services/VersioningService';
import { CacheService } from '../services/CacheService';

interface UnifiedRecord {
  id: string;
  type: 'patient' | 'consultation' | 'rendezVous';
  numeroPatient?: string;
  nom?: string;
  prenom?: string;
  contact?: string;
  ville?: string;
  cin?: string;
  mutuelle?: {
    nom: string;
    numero?: string;
  } | null;
  status?: string;
  confirmationRendezVous?: '-' | 'annulé' | 'absent' | 'validé' | 'reporté';
  prochainRdv?: string | null;
  createdFrom?: 'patient' | 'agenda' | 'paiement' | 'tableau de bord';
  modifiedFrom?: 'patients' | 'agenda' | 'paiement' | 'tableau de bord';
  deleted?: boolean;
  // Champs pour consultation
  patientId?: string;
  date?: string;
  montant?: number;
  typePaiement?: string;
  notes?: string;
  heure?: string;
}

interface UnifiedDataContextType {
  records: UnifiedRecord[];
  addRecord: (record: Partial<UnifiedRecord>, source: string) => Promise<UnifiedRecord>;
  updateRecord: (id: string, updates: Partial<UnifiedRecord>, source: string) => Promise<void>;
  deleteRecord: (id: string, type: string, source: string) => Promise<void>;
  getRecordsByType: (type: string) => UnifiedRecord[];
  getPatientRecords: (patientId: string) => UnifiedRecord[];
  getRecordsBySource: (source: string) => UnifiedRecord[];
  getRecordHistory: (recordId: string) => any[];
  isLoading: boolean;
  error: string | null;
}

const UnifiedDataContext = createContext<UnifiedDataContextType | undefined>(undefined);

// Initialiser le service de cache
const cache = CacheService.getInstance({ ttl: 5 * 60 * 1000, maxSize: 1000 });

// Données de test initiales
const initialTestData: UnifiedRecord[] = [
  {
    id: '1',
    type: 'patient',
    numeroPatient: 'PA0001',
    nom: 'U',
    prenom: 'U',
    contact: '08',
    ville: '',
    cin: '',
    mutuelle: null,
    status: '-',
    createdFrom: 'patient',
    prochainRdv: '2024-12-28 15:00',
    confirmationRendezVous: 'validé'
  },
  {
    id: '2',
    type: 'patient',
    numeroPatient: 'P0001',
    nom: 'A',
    prenom: 'A',
    contact: '01',
    ville: '',
    cin: '',
    mutuelle: null,
    status: 'Validé',
    createdFrom: 'patient',
    prochainRdv: '2024-12-28 13:30',
    confirmationRendezVous: 'reporté'
  },
  {
    id: '3',
    type: 'patient',
    numeroPatient: 'PS0001',
    nom: 'T',
    prenom: 'T',
    contact: '05',
    ville: '',
    cin: '',
    mutuelle: null,
    status: 'Supprimé',
    createdFrom: 'patient',
    prochainRdv: null,
    confirmationRendezVous: 'annulé'
  },
  {
    id: '4',
    type: 'patient',
    numeroPatient: 'PA0001',
    nom: 'B',
    prenom: 'B',
    contact: '03',
    ville: '',
    cin: '',
    mutuelle: null,
    status: '-',
    createdFrom: 'patient',
    prochainRdv: '2024-12-28 10:30',
    confirmationRendezVous: 'absent'
  },
  // Rendez-vous
  {
    id: 'rdv1',
    type: 'rendezVous',
    patientId: '1',
    date: '2024-12-28',
    heure: '15:00',
    status: 'Confirmé'
  },
  {
    id: 'rdv2',
    type: 'rendezVous',
    patientId: '2',
    date: '2024-12-28',
    heure: '13:30',
    status: 'Reporté'
  },
  {
    id: 'rdv3',
    type: 'rendezVous',
    patientId: '3',
    date: '2024-12-28',
    heure: '14:00',
    status: 'Annulé'
  },
  {
    id: 'rdv4',
    type: 'rendezVous',
    patientId: '4',
    date: '2024-12-28',
    heure: '10:30',
    status: 'Absent'
  }
];

export const UnifiedDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [records, setRecords] = useState<UnifiedRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Charger les données depuis le localStorage au démarrage
  useEffect(() => {
    const loadData = () => {
      try {
        console.log('Chargement des données...');
        const cachedRecords = cache.get<UnifiedRecord[]>('unifiedRecords');
        if (cachedRecords) {
          console.log('Données trouvées dans le cache:', cachedRecords);
          setRecords(cachedRecords);
          return;
        }

        const savedRecords = localStorage.getItem('unifiedRecords');
        if (savedRecords) {
          const parsedRecords = JSON.parse(savedRecords);
          console.log('Données trouvées dans le localStorage:', parsedRecords);
          setRecords(parsedRecords);
          cache.set('unifiedRecords', parsedRecords);
        } else {
          console.log('Pas de données dans le cache ou le localStorage, utilisation des données initiales:', initialTestData);
          setRecords(initialTestData);
          localStorage.setItem('unifiedRecords', JSON.stringify(initialTestData));
          cache.set('unifiedRecords', initialTestData);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
        setError('Erreur lors du chargement des données');
      }
    };

    loadData();
  }, []);

  // Sauvegarder les données dans le localStorage à chaque modification
  useEffect(() => {
    try {
      localStorage.setItem('unifiedRecords', JSON.stringify(records));
      cache.set('unifiedRecords', records);
    } catch (err) {
      console.error('Erreur lors de la sauvegarde des données:', err);
      setError('Erreur lors de la sauvegarde des données');
    }
  }, [records]);

  const validateRecord = (record: Partial<UnifiedRecord>): boolean => {
    let validationResult;

    switch (record.type) {
      case 'patient':
        validationResult = DataValidationService.validatePatient(record);
        break;
      case 'consultation':
        validationResult = DataValidationService.validateConsultation(record as ConsultationInfo);
        break;
      case 'rendezVous':
        validationResult = DataValidationService.validateRendezVous(record as RendezVous);
        break;
      default:
        validationResult = { isValid: false, errors: ['Type d\'enregistrement invalide'] };
    }

    if (!validationResult.isValid) {
      setError(validationResult.errors.join(', '));
      return false;
    }

    return true;
  };

  const addRecord = useCallback(async (record: Partial<UnifiedRecord>, source: string): Promise<UnifiedRecord> => {
    setIsLoading(true);
    setError(null);

    try {
      if (!validateRecord(record)) {
        throw new Error('Validation échouée');
      }

      const newRecord: UnifiedRecord = {
        id: uuidv4(),
        type: record.type || 'patient',
        numeroPatient: record.numeroPatient || '',
        nom: record.nom || '',
        prenom: record.prenom || '',
        contact: record.contact || '',
        ville: record.ville || '',
        cin: record.cin || '',
        mutuelle: record.mutuelle || { nom: '' },
        status: record.status || '-',
        confirmationRendezVous: record.confirmationRendezVous || '-',
        prochainRdv: record.prochainRdv || null,
        createdFrom: source as 'patient' | 'agenda' | 'paiement' | 'tableau de bord',
        ...record
      };

      setRecords(prevRecords => {
        const updatedRecords = [...prevRecords, newRecord];
        return updatedRecords;
      });

      // Créer une version pour le nouvel enregistrement
      await VersioningService.createVersion(newRecord.id, newRecord, source);

      return newRecord;
    } catch (error) {
      console.error('Erreur lors de l\'ajout de l\'enregistrement:', error);
      setError('Erreur lors de l\'ajout de l\'enregistrement');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateRecord = useCallback(async (
    id: string,
    updates: Partial<UnifiedRecord>,
    source: string
  ): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      setRecords(prevRecords => {
        const recordIndex = prevRecords.findIndex(r => r.id === id);
        if (recordIndex === -1) {
          throw new Error('Enregistrement non trouvé');
        }

        const oldRecord = prevRecords[recordIndex];
        const updatedRecord = {
          ...oldRecord,
          ...updates,
          modifiedFrom: source as 'patients' | 'agenda' | 'paiement' | 'tableau de bord'
        };

        if (!validateRecord(updatedRecord)) {
          throw new Error('Validation échouée');
        }

        // Créer une version pour la mise à jour
        VersioningService.createVersion(id, updatedRecord, source);

        const newRecords = [...prevRecords];
        newRecords[recordIndex] = updatedRecord;
        return newRecords;
      });
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      setError('Erreur lors de la mise à jour');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteRecord = useCallback(async (id: string, type: string, source: string): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      if (type === 'patient') {
        // Sauvegarder la version de suppression
        VersioningService.saveVersion(id, { deleted: true, status: 'Supprimé' }, source);

        setRecords(prev => prev.map(record =>
          record.id === id ? { 
            ...record, 
            deleted: true, 
            status: 'Supprimé',
            modifiedFrom: source as 'patients' | 'agenda' | 'paiement' | 'tableau de bord'
          } : record
        ));
      } else {
        // Pour les autres types, supprimer physiquement
        setRecords(prev => prev.filter(record => record.id !== id));
      }
    } catch (err) {
      console.error('Erreur lors de la suppression:', err);
      setError('Erreur lors de la suppression du record');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getRecordsByType = useCallback((type: string) => {
    const cacheKey = `records_by_type_${type}`;
    const cachedResult = cache.get<UnifiedRecord[]>(cacheKey);
    
    if (cachedResult) {
      return cachedResult;
    }

    const result = records.filter(record => record.type === type);
    cache.set(cacheKey, result);
    return result;
  }, [records]);

  const getPatientRecords = useCallback((patientId: string) => {
    const cacheKey = `patient_records_${patientId}`;
    const cachedResult = cache.get<UnifiedRecord[]>(cacheKey);
    
    if (cachedResult) {
      return cachedResult;
    }

    const result = records.filter(record => 
      (record.type === 'consultation' || record.type === 'rendezVous') && 
      'patientId' in record && record.patientId === patientId
    );
    cache.set(cacheKey, result);
    return result;
  }, [records]);

  const getRecordsBySource = useCallback((source: string) => {
    const cacheKey = `records_by_source_${source}`;
    const cachedResult = cache.get<UnifiedRecord[]>(cacheKey);
    
    if (cachedResult) {
      return cachedResult;
    }

    const result = records.filter(record => 
      record.createdFrom === source || record.modifiedFrom === source
    );
    cache.set(cacheKey, result);
    return result;
  }, [records]);

  const getRecordHistory = useCallback((recordId: string) => {
    return VersioningService.getRecordVersions(recordId);
  }, []);

  const value = {
    records,
    addRecord,
    updateRecord,
    deleteRecord,
    getRecordsByType,
    getPatientRecords,
    getRecordsBySource,
    getRecordHistory,
    isLoading,
    error
  };

  return (
    <UnifiedDataContext.Provider value={value}>
      {children}
    </UnifiedDataContext.Provider>
  );
};

export const useUnifiedData = () => {
  const context = useContext(UnifiedDataContext);
  if (context === undefined) {
    throw new Error('useUnifiedData must be used within a UnifiedDataProvider');
  }
  return context;
};
