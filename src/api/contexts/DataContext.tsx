import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { format, parseISO, isSameDay } from 'date-fns';
import { testPatients, testAppointments, testSupplies, testAbsences, testUsers } from '../data/testData';
import { PatientNumberManager } from '../services/PatientNumberManager';
import { AppointmentStorage } from '../services/storage/AppointmentStorage';

interface DataContextType {
  patients: any[];
  appointments: any[];
  supplies: any[];
  absences: any[];
  users: any[];
  payments: any[];
  connectionStatus: {
    isOnline: boolean;
    pendingChangesCount: number;
    lastSyncTimestamp: number;
  };
  templates: Template[];
  setTemplates: (templates: Template[]) => void;
  addPatient: (patient: any) => void;
  updatePatient: (id: string, patient: any) => void;
  deletePatient: (id: string, source: 'patients' | 'dashboard' | 'agenda' | 'payments') => Promise<{ patient: any; appointmentsDeleted: number; paymentsDeleted: number; completeDelete: boolean }>;
  addAppointment: (appointment: any) => void;
  updateAppointment: (id: string, appointmentData: any) => void;
  deleteAppointment: (id: string) => void;
  addSupply: (supply: any) => void;
  updateSupply: (id: string, supply: any) => void;
  deleteSupply: (id: string) => void;
  addAbsence: (absence: any) => void;
  updateAbsence: (id: string, absence: any) => void;
  deleteAbsence: (id: string) => void;
  addUser: (user: any) => void;
  updateUser: (id: string, user: any) => void;
  deleteUser: (id: string) => void;
  addPayment: (payment: any) => void;
  updatePayment: (id: string, payment: any) => void;
  deletePayment: (id: string) => void;
  getPatientConsultations: (patientId: string) => any[];
  getLastConsultation: (patientId: string) => any | null;
  isNewPatient: (patientId: string) => boolean;
  getConsultationCount: (patientId: string) => number;
  reinitialiserDonnees: () => void;
  cleanupDuplicates: () => Promise<{ keptCount: number; removedCount: number; updatedAppointments: number }>;
  updatePatientStatus: (id: string, newStatus: string) => Promise<boolean>;
  resetPatientNumbers: () => Promise<boolean>;
  resetAllPatientNumbers: () => Promise<boolean>;
  cleanupAndReassignNumbers: () => Promise<boolean>;
  setPatients: (newPatients: any[]) => void;
}

interface Template {
  id: string;
  name: string;
  content: string;
  isActive: boolean;
  sendHoursBefore: number;
  variables: string[];
}

const DataContext = createContext<DataContextType | null>(null);

// Export du context pour qu'il soit accessible
export { DataContext };

// Export du hook useData
export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [patients, setPatients] = useState<any[]>(() => {
    const savedPatients = localStorage.getItem('patients');
    return savedPatients ? JSON.parse(savedPatients) : testPatients;
  });

  const patientNumberManager = useMemo(() => PatientNumberManager.getInstance(), []);

  const [appointments, setAppointments] = useState<any[]>(() => {
    const savedAppointments = localStorage.getItem('appointments');
    return savedAppointments ? JSON.parse(savedAppointments) : testAppointments;
  });

  const [supplies, setSupplies] = useState<any[]>(() => {
    const savedSupplies = localStorage.getItem('supplies');
    return savedSupplies ? JSON.parse(savedSupplies) : testSupplies;
  });

  const [absences, setAbsences] = useState<any[]>(() => {
    const savedAbsences = localStorage.getItem('absences');
    return savedAbsences ? JSON.parse(savedAbsences) : testAbsences;
  });

  const [users, setUsers] = useState<any[]>(() => {
    const savedUsers = localStorage.getItem('users');
    return savedUsers ? JSON.parse(savedUsers) : testUsers;
  });

  const [payments, setPayments] = useState<any[]>(() => {
    const savedPayments = localStorage.getItem('payments');
    return savedPayments ? JSON.parse(savedPayments) : [];
  });

  const [connectionStatus, setConnectionStatus] = useState({
    isOnline: false,
    pendingChangesCount: 0,
    lastSyncTimestamp: Date.now()
  });

  const [lastSyncTimestamp, setLastSyncTimestamp] = useState<number>(Date.now());

  const [templates, setTemplates] = useState<Template[]>(() => {
    const savedConfig = localStorage.getItem('notification_config');
    if (savedConfig) {
      const config = JSON.parse(savedConfig);
      return config.templates || [];
    }
    // Templates par défaut
    const defaultTemplates = [
      {
        id: '1',
        name: 'Rappel de rendez-vous standard',
        content: 'Bonjour {patientName}, nous vous rappelons votre rendez-vous prévu le {appointmentDate} à {appointmentTime}. En cas d\'empêchement, merci de nous prévenir à l\'avance.',
        variables: ['patientName', 'appointmentDate', 'appointmentTime'],
        isActive: true,
        sendHoursBefore: 24
      },
      {
        id: '2',
        name: 'Rappel de rendez-vous détaillé',
        content: 'Bonjour {patientName}, n\'oubliez pas votre consultation prévue le {appointmentDate} à {appointmentTime} avec {doctorName}. Adresse : {clinicName}. En cas d\'empêchement, merci de nous contacter.',
        variables: ['patientName', 'appointmentDate', 'appointmentTime', 'doctorName', 'clinicName'],
        isActive: true,
        sendHoursBefore: 48
      }
    ];
    localStorage.setItem('notification_config', JSON.stringify({ templates: defaultTemplates }));
    return defaultTemplates;
  });

  useEffect(() => {
    console.log('[DataContext] Chargement des données');
    const loadData = async () => {
      try {
        // 1. Charger les patients existants
        const storedPatients = localStorage.getItem('patients');
        let patientsData = storedPatients ? JSON.parse(storedPatients) : [];
        console.log('[DataContext] Patients chargés depuis storage:', patientsData.length);

        // 2. Charger les rendez-vous
        const storedAppointments = localStorage.getItem('appointments');
        const appointmentsData = storedAppointments ? JSON.parse(storedAppointments) : [];
        console.log('[DataContext] Rendez-vous chargés:', appointmentsData.length);

        // 3. Extraire les patients des rendez-vous
        const appointmentPatients = appointmentsData.reduce((acc: any[], apt: any) => {
          if (!apt.patientId || acc.some((p: any) => p.id === apt.patientId)) {
            return acc;
          }

          // Créer un patient à partir des données du rendez-vous
          const patient = {
            id: apt.patientId,
            nom: apt.nom || '',
            prenom: apt.prenom || '',
            numeroPatient: apt.numeroPatient || '',
            status: apt.status === 'scheduled' ? 'En attente' : (apt.status || '-'),
            createdAt: apt.time || new Date().toISOString(),
            lastUpdated: apt.time || new Date().toISOString(),
            // Conserver les informations de suppression si présentes
            deleted: apt.patientDeleted || false,
            deletedFrom: apt.deletedFrom || null,
            deletedAt: apt.deletedAt || null
          };

          acc.push(patient);
          return acc;
        }, []);

        console.log('[DataContext] Patients extraits des rendez-vous:', appointmentPatients.length);

        // 4. Fusionner les patients en préservant les données existantes
        const mergedPatients = patientsData.map((existingPatient: any) => {
          const appointmentPatient = appointmentPatients.find(
            (p: any) => p.id === existingPatient.id
          );
          if (appointmentPatient) {
            // Préserver les données existantes mais mettre à jour le statut si nécessaire
            return {
              ...existingPatient,
              status: appointmentPatient.status !== '-' ? appointmentPatient.status : existingPatient.status,
              lastUpdated: new Date().toISOString()
            };
          }
          return existingPatient;
        });

        // 5. Ajouter les nouveaux patients des rendez-vous
        const newPatients = appointmentPatients.filter(
          (aptPatient: any) => !patientsData.some((p: any) => p.id === aptPatient.id)
        );

        const allPatients = [...mergedPatients, ...newPatients];
        console.log('[DataContext] Total patients après fusion:', allPatients.length);

        // 6. Mettre à jour l'état et le localStorage
        setPatients(allPatients);
        localStorage.setItem('patients', JSON.stringify(allPatients));

      } catch (error) {
        console.error('[DataContext] Erreur lors du chargement des données:', error);
        setPatients([]); // En cas d'erreur, initialiser avec un tableau vide
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    if (patients.length > 0) {
      console.log('[DataContext] Sauvegarde des patients:', patients.length);
      localStorage.setItem('patients', JSON.stringify(patients));
    }
  }, [patients]);

  useEffect(() => {
    const interval = setInterval(() => {
      setLastSyncTimestamp(Date.now());
    }, 30000); // Mettre à jour le timestamp toutes les 30 secondes

    return () => clearInterval(interval);
  }, []);

  // Synchronisation automatique lors des modifications de rendez-vous
  useEffect(() => {
    console.log('[DataContext] Synchronisation des patients avec les rendez-vous');
    const syncPatientsWithAppointments = async () => {
      const currentPatients = [...patients];
      let hasChanges = false;

      appointments.forEach(apt => {
        if (!apt.patientId) return;

        const existingPatient = currentPatients.find(p => p.id === apt.patientId);
        if (!existingPatient && apt.nom) {
          // Ajouter le nouveau patient
          currentPatients.push({
            id: apt.patientId,
            nom: apt.nom,
            prenom: apt.prenom || '',
            numeroPatient: apt.numeroPatient || '',
            status: apt.status === 'scheduled' ? 'En attente' : (apt.status || '-'),
            createdAt: apt.time || new Date().toISOString(),
            lastUpdated: new Date().toISOString(),
            deleted: apt.patientDeleted || false,
            deletedFrom: apt.deletedFrom || null,
            deletedAt: apt.deletedAt || null
          });
          hasChanges = true;
        }
      });

      if (hasChanges) {
        setPatients(currentPatients);
        localStorage.setItem('patients', JSON.stringify(currentPatients));
        console.log('[DataContext] Patients mis à jour après synchronisation');
      }
    };

    syncPatientsWithAppointments();
  }, [appointments]);

  // Sauvegarder les données dans le localStorage à chaque changement
  useEffect(() => {
    localStorage.setItem('appointments', JSON.stringify(appointments));
  }, [appointments]);

  useEffect(() => {
    localStorage.setItem('supplies', JSON.stringify(supplies));
  }, [supplies]);

  useEffect(() => {
    localStorage.setItem('absences', JSON.stringify(absences));
  }, [absences]);

  useEffect(() => {
    localStorage.setItem('users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('payments', JSON.stringify(payments));
  }, [payments]);

  // Réinitialiser les numéros disponibles au chargement
  useEffect(() => {
    const numberManager = PatientNumberManager.getInstance();
    numberManager.resetAvailableNumbers();
  }, []);

  // Fonctions CRUD simplifiées sans synchronisation
  const addPatient = useCallback((patient: any) => {
    const newPatient = {
      ...patient,
      numeroPatient: patientNumberManager.getNewNumber(patient.status || '-'),
      lastUpdated: new Date().toISOString()
    };
    setPatients(prev => {
      const newPatients = [...prev, newPatient];
      localStorage.setItem('patients', JSON.stringify(newPatients));
      return newPatients;
    });
  }, [patientNumberManager]);

  const updatePatient = useCallback((id: string, patientData: any) => {
    setPatients(prev => {
      const index = prev.findIndex(p => p.id === id);
      if (index === -1) return prev;

      const oldPatient = prev[index];
      
      // Mettre à jour le numéro si le statut a changé
      const numeroPatient = patientData.status !== undefined
        ? patientNumberManager.updatePatientNumber(oldPatient.numeroPatient, patientData.status)
        : oldPatient.numeroPatient;

      const newPatient = {
        ...oldPatient,
        ...patientData,
        numeroPatient,
        lastUpdated: new Date().toISOString()
      };

      const newPatients = [...prev];
      newPatients[index] = newPatient;
      localStorage.setItem('patients', JSON.stringify(newPatients));
      return newPatients;
    });
  }, [patientNumberManager]);

  const deletePatient = useCallback(async (id: string, source: 'patients' | 'dashboard' | 'agenda' | 'payments') => {
    try {
      // Supprimer définitivement le patient
      setPatients(prev => {
        const filteredPatients = prev.filter(p => p.id !== id);
        localStorage.setItem('patients', JSON.stringify(filteredPatients));
        return filteredPatients;
      });

      // Supprimer tous les rendez-vous associés
      setAppointments(prev => {
        const filteredAppointments = prev.filter(apt => apt.patientId !== id);
        localStorage.setItem('appointments', JSON.stringify(filteredAppointments));
        return filteredAppointments;
      });

      // Supprimer tous les paiements associés
      setPayments(prev => {
        const filteredPayments = prev.filter(payment => payment.patientId !== id);
        localStorage.setItem('payments', JSON.stringify(filteredPayments));
        return filteredPayments;
      });

      return {
        patient: null,
        appointmentsDeleted: 0,
        paymentsDeleted: 0,
        completeDelete: true
      };
    } catch (error) {
      console.error('Erreur lors de la suppression définitive:', error);
      throw error;
    }
  }, []);

  const addAppointment = useCallback(async (appointment: any) => {
    // Ajouter le rendez-vous
    setAppointments(prev => [...prev, appointment]);

    // Si c'est un nouveau patient, l'ajouter à la liste des patients
    if (appointment.patientId && !patients.some(p => p.id === appointment.patientId)) {
      const newPatient = {
        id: appointment.patientId,
        nom: appointment.nom || '',
        prenom: appointment.prenom || '',
        numeroPatient: appointment.numeroPatient || '',
        status: appointment.status || '-',
        createdAt: appointment.time || new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        deleted: appointment.patientDeleted || false,
        deletedFrom: appointment.deletedFrom || null,
        deletedAt: appointment.deletedAt || null
      };
      
      setPatients(prev => [...prev, newPatient]);
      
      // Mettre à jour le localStorage
      const updatedPatients = [...patients, newPatient];
      localStorage.setItem('patients', JSON.stringify(updatedPatients));
    }

    // Mettre à jour le localStorage des rendez-vous
    const updatedAppointments = [...appointments, appointment];
    localStorage.setItem('appointments', JSON.stringify(updatedAppointments));
  }, [appointments, patients]);

  const updateAppointment = useCallback(async (id: string, updatedFields: any) => {
    setAppointments(prev => {
      const newAppointments = prev.map(apt => {
        if (apt.id === id) {
          const updated = { ...apt, ...updatedFields };
          
          // Mettre à jour le patient correspondant si nécessaire
          if (updated.patientId) {
            const patientIndex = patients.findIndex(p => p.id === updated.patientId);
            if (patientIndex >= 0) {
              const updatedPatient = {
                ...patients[patientIndex],
                status: updated.status || patients[patientIndex].status,
                lastUpdated: new Date().toISOString(),
                deleted: updated.patientDeleted || patients[patientIndex].deleted,
                deletedFrom: updated.deletedFrom || patients[patientIndex].deletedFrom,
                deletedAt: updated.deletedAt || patients[patientIndex].deletedAt
              };
              
              setPatients(prevPatients => {
                const newPatients = [...prevPatients];
                newPatients[patientIndex] = updatedPatient;
                localStorage.setItem('patients', JSON.stringify(newPatients));
                return newPatients;
              });
            }
          }
          
          return updated;
        }
        return apt;
      });
      
      localStorage.setItem('appointments', JSON.stringify(newAppointments));
      return newAppointments;
    });
  }, [patients]);

  const deleteAppointment = (id: string) => {
    try {
      const appointment = appointments.find(a => a.id === id);
      if (!appointment) {
        console.error('Rendez-vous non trouvé:', id);
        return;
      }

      // Au lieu de supprimer le rendez-vous, on le marque comme supprimé
      const updatedAppointment = {
        ...appointment,
        deleted: true,
        status: 'Supprimé',
        deletedAt: new Date().toISOString()
      };

      // Mettre à jour le rendez-vous dans la liste
      setAppointments(prev => prev.map(a => a.id === id ? updatedAppointment : a));
      localStorage.setItem('appointments', JSON.stringify(
        appointments.map(a => a.id === id ? updatedAppointment : a)
      ));

      console.log('Rendez-vous marqué comme supprimé:', id);
    } catch (error) {
      console.error('Erreur lors de la suppression du rendez-vous:', error);
    }
  };

  // ... autres fonctions CRUD similaires pour supplies, absences, users, payments

  const value = useMemo(() => ({
    patients,
    appointments,
    supplies,
    absences,
    users,
    payments,
    connectionStatus,
    addPatient,
    updatePatient,
    deletePatient,
    addAppointment,
    updateAppointment,
    deleteAppointment,
    addSupply: (supply: any) => setSupplies(prev => [...prev, supply]),
    updateSupply: (id: string, supply: any) => setSupplies(prev => prev.map(s => s.id === id ? { ...s, ...supply } : s)),
    deleteSupply: (id: string) => setSupplies(prev => prev.filter(s => s.id !== id)),
    addAbsence: (absence: any) => setAbsences(prev => [...prev, absence]),
    updateAbsence: (id: string, absence: any) => setAbsences(prev => prev.map(a => a.id === id ? { ...a, ...absence } : a)),
    deleteAbsence: (id: string) => setAbsences(prev => prev.filter(a => a.id !== id)),
    addUser: (user: any) => setUsers(prev => [...prev, user]),
    updateUser: (id: string, user: any) => setUsers(prev => prev.map(u => u.id === id ? { ...u, ...user } : u)),
    deleteUser: (id: string) => setUsers(prev => prev.filter(u => u.id !== id)),
    addPayment: (payment: any) => setPayments(prev => [...prev, payment]),
    updatePayment: (id: string, payment: any) => setPayments(prev => prev.map(p => p.id === id ? { ...p, ...payment } : p)),
    deletePayment: (id: string) => setPayments(prev => prev.filter(p => p.id !== id)),
    getPatientConsultations: (patientId: string) => appointments.filter(a => a.patientId === patientId && a.type === 'consultation'),
    getLastConsultation: (patientId: string) => {
      const consultations = appointments.filter(a => a.patientId === patientId && a.type === 'consultation');
      return consultations.length > 0 ? consultations[consultations.length - 1] : null;
    },
    isNewPatient: (patientId: string) => {
      const consultations = appointments.filter(a => a.patientId === patientId && a.type === 'consultation');
      return consultations.length === 0;
    },
    getConsultationCount: (patientId: string) => 
      appointments.filter(a => a.patientId === patientId && a.type === 'consultation').length,
    reinitialiserDonnees: () => {
      localStorage.clear();
      setPatients(testPatients);
      setAppointments(testAppointments);
      setSupplies(testSupplies);
      setAbsences(testAbsences);
      setUsers(testUsers);
      setPayments([]);
    },
    cleanupDuplicates: async () => ({ keptCount: 0, removedCount: 0, updatedAppointments: 0 }),
    updatePatientStatus: async (id: string, newStatus: string) => {
      setPatients(prev => prev.map(p => p.id === id ? { ...p, status: newStatus } : p));
      return true;
    },
    resetPatientNumbers: async () => true,
    resetAllPatientNumbers: async () => true,
    cleanupAndReassignNumbers: async () => true,
    setPatients: (newPatients: any[]) => setPatients(newPatients),
    templates,
    setTemplates: (newTemplates: Template[]) => setTemplates(newTemplates)
  }), [patients, appointments, supplies, absences, users, payments, connectionStatus, templates]);

  // Initialiser les numéros de patients au chargement
  useEffect(() => {
    const initializePatientNumbers = () => {
      const updatedPatients = patients.map(patient => {
        // Ne pas réinitialiser les numéros existants
        if (patient.numeroPatient && patient.numeroPatient !== '-') {
          return patient;
        }
        
        // Attribuer un nouveau numéro en fonction du statut
        return {
          ...patient,
          numeroPatient: patientNumberManager.getNewNumber(patient.status || '-')
        };
      });

      // Mettre à jour les patients avec leurs nouveaux numéros
      setPatients(updatedPatients);
      localStorage.setItem('patients', JSON.stringify(updatedPatients));

      // Mettre à jour les rendez-vous correspondants
      const updatedAppointments = appointments.map(apt => {
        const patient = updatedPatients.find(p => p.id === apt.patientId);
        if (patient) {
          return {
            ...apt,
            numeroPatient: patient.numeroPatient
          };
        }
        return apt;
      });

      setAppointments(updatedAppointments);
      localStorage.setItem('appointments', JSON.stringify(updatedAppointments));
    };

    initializePatientNumbers();
  }, []); // Exécuter une seule fois au chargement

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}