import React, { useState, useMemo } from 'react';
import { Search, Download, Calendar } from 'lucide-react';
import { useAppointments } from '../contexts/AppointmentContext';
import { useData } from '../contexts/DataContext';
import { formatters } from '../utils/formatters';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { usePersistedState } from '../hooks/usePersistedState';
import { formatPatientName, formatFullName, isPatientValidated, formatAppointmentData, getPaymentStatus, getStatusColor, getStatusBgColor } from '../utils/formatDisplayData';
import ExportOptionsModal from '../components/ExportOptionsModal';
import MutuelleSelect from '../components/MutuelleSelect';
import { usePaymentAmount } from '../hooks/usePaymentAmount';
import { ConsultationType, CONSULTATION_TYPES } from '../types/payment';
import { DateInput } from '../components/DateInput';
import { YearInput } from '../components/YearInput';
import { updatePatientNumber } from '../utils/patientNumberManager';
import { PENDING_STATUSES, NON_VALIDATED_FILTER_STATUSES } from '../utils/patientStatusUtils';
import DeletePatientsConfirmModal from '../components/patient/DeletePatientsConfirmModal';

const MUTUELLES = ['RMA', 'CNSS', 'CNOPS', 'SAHAM', 'AXA', 'MCMA', 'Allianz', 'Sanad', 'MGPAP', 'AtlantaSanad'];

const formatAmount = (amount: string | number | undefined | null): string => {
  if (amount === undefined || amount === null || amount === '' || amount === '-') return '- Dhs';
  if (amount === '0,00' || amount === 0) return '- Dhs';
  
  let numAmount: number;
  if (typeof amount === 'string') {
    // Enlever "Dhs" et les espaces si présents
    const cleanAmount = amount.replace(' Dhs', '').trim();
    numAmount = parseFloat(cleanAmount.replace(',', '.'));
  } else {
    numAmount = amount;
  }
  
  if (isNaN(numAmount) || numAmount === 0) return '- Dhs';
  return `${numAmount.toFixed(2).replace('.', ',')} Dhs`;
};

const isValidDate = (dateString: string | undefined | null): boolean => {
  if (!dateString) return false;
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
};

const formatDateSafely = (dateString: string | undefined | null): string => {
  if (!isValidDate(dateString)) return '-';
  try {
    const date = new Date(dateString);
    return format(date, 'dd/MM/yyyy', { locale: fr });
  } catch (error) {
    return '-';
  }
};

// Fonction pour obtenir les informations du patient
const getPatientInfo = (patient: any, appointments: any[]): any => {
  if (!patient) return {};
  
  console.log('Patient data:', patient); // Debug log

  // Créer un Set pour suivre les consultations uniques
  const uniqueConsultations = new Set();
  
  // Filter appointments by matching either patientId or patient name
  const patientAppointments = appointments.filter(apt => {
    if (apt.deleted) return false;
    
    const isMatchingPatient = (apt.patientId === patient.id) || 
      (apt.patient && patient.nom && patient.prenom && 
       apt.patient.toLowerCase() === `${patient.nom} ${patient.prenom}`.toLowerCase());
    
    if (!isMatchingPatient) return false;
    
    // Créer une clé unique pour cette consultation
    const consultationKey = `${apt.time || apt.date || apt.dateCreation}_${apt.status}`;
    
    // Si on a déjà vu cette consultation, ne pas la compter
    if (uniqueConsultations.has(consultationKey)) return false;
    
    // Ajouter cette consultation au Set
    uniqueConsultations.add(consultationKey);
    return true;
  });
  
  // Get the most recent past appointment
  const lastAppointment = patientAppointments
    .filter(apt => {
      const aptDate = apt.time || apt.date || apt.dateCreation;
      if (!aptDate) return false;
      try {
        return new Date(aptDate) <= new Date('2025-01-04T17:00:19+01:00'); // Current time from context
      } catch (e) {
        console.error('Invalid date:', aptDate);
        return false;
      }
    })
    .sort((a, b) => {
      const dateA = new Date(a.time || a.date || a.dateCreation);
      const dateB = new Date(b.time || b.date || b.dateCreation);
      return dateB.getTime() - dateA.getTime();
    })[0];

  // Get the next upcoming appointment
  const nextAppointment = patientAppointments
    .filter(apt => {
      const aptDate = apt.time || apt.date || apt.dateCreation;
      if (!aptDate) return false;
      try {
        return new Date(aptDate) > new Date('2025-01-04T17:00:19+01:00'); // Current time from context
      } catch (e) {
        console.error('Invalid date:', aptDate);
        return false;
      }
    })
    .sort((a, b) => {
      const dateA = new Date(a.time || a.date || a.dateCreation);
      const dateB = new Date(b.time || b.date || b.dateCreation);
      return dateA.getTime() - dateB.getTime();
    })[0];

  console.log('Found appointments:', {
    total: patientAppointments.length,
    lastAppointment: lastAppointment?.time,
    nextAppointment: nextAppointment?.time
  });

  return {
    ...patient,
    consultationCount: patientAppointments.length,
    derniereConsultation: lastAppointment ? (lastAppointment.time || lastAppointment.date || lastAppointment.dateCreation) : undefined,
    prochainRdv: nextAppointment ? (nextAppointment.time || nextAppointment.date || nextAppointment.dateCreation) : undefined,
    numeroPatient: patient.numeroPatient || getPatientNumber(patient.status)
  };
};

// Fonction pour générer un numéro de patient en fonction du statut
const getPatientNumber = (status: string): string => {
  console.log('Getting patient number for status:', status); // Debug log
  switch(status?.toLowerCase()) {
    case 'validé':
      return 'P0001'; // Temporaire, à remplacer par la logique réelle
    case 'reporté':
    case 'annulé':
      return 'PA0001'; // Temporaire, à remplacer par la logique réelle
    case 'supprimé':
      return 'PS0001'; // Temporaire, à remplacer par la logique réelle
    default:
      return '-';
  }
};

// Fonction pour formater le nom du patient
const getPatientDisplayName = (patient: any) => {
  if (!patient) return '-';
  const nom = patient.nom?.trim() || '';
  const prenom = patient.prenom?.trim() || '';
  return `${nom.toUpperCase()} ${prenom.charAt(0).toUpperCase()}${prenom.slice(1).toLowerCase()}`.trim() || '-';
};

// Fonction pour formater la date avec l'heure
const formatDateTimeWithHour = (dateString: string | undefined) => {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    return format(date, "dd/MM/yyyy HH:mm", { locale: fr });
  } catch (error) {
    return '-';
  }
};

// Fonction pour formater le numéro de patient en fonction du statut
const formatPatientNumber = (numero: string | undefined, status: string): string => {
  if (!numero || numero === '-') {
    return '-';
  }
  
  // Si le numéro commence par PS ou si le statut est supprimé, afficher "-"
  if (numero.startsWith('PS') || status.toLowerCase() === 'supprimé') {
    return '-';
  }
  
  return numero;
};

// Fonction pour obtenir la couleur du statut
const getStatusBadgeStyle = (status: string): string => {
  switch (status?.toLowerCase()) {
    case 'validé':
      return 'bg-green-100 text-green-800';
    case 'annulé':
      return 'bg-red-100 text-red-800';
    case 'reporté':
      return 'bg-yellow-100 text-yellow-800';
    case 'absent':
      return 'bg-gray-100 text-gray-800';
    case 'supprimé':
      return 'bg-red-50 text-red-600';
    case 'en attente':
      return 'bg-blue-50 text-blue-600';
    default:
      return 'bg-gray-100 text-gray-600';
  }
};

export default function Patients2() {
  const { getAllAppointments, updateAppointment, deleteAppointment } = useAppointments();
  const { patients, appointments, deletePatient } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [consultationFilter, setConsultationFilter] = useState('all');
  const [editingAppointment, setEditingAppointment] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [editValues, setEditValues] = useState<Record<string, {
    amount: string;
    paymentMethod: string;
    mutuelle: { active: boolean; nom: string };
    type: string;
    status: string;
  }>>({});
  const [showExportModal, setShowExportModal] = useState(false);
  const [invalidEndDate, setInvalidEndDate] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const paidAppointments = useMemo(() => {
    return getAllAppointments()
      .filter(apt => {
        if (!apt.time) return false;

        const date = parseISO(apt.time);
        const isInDateRange = (!startDate || isAfter(date, startDate)) && 
                            (!endDate || isBefore(date, endDate));
        const isInYear = !selectedYear || getYear(date) === selectedYear;
        
        const patient = patients.find(p => p.id === apt.patientId);
        const patientName = patient 
          ? `${patient.nom || ''} ${patient.prenom || ''}`.trim()
          : apt.patient || '';
        const mutuelleNom = patient?.mutuelle?.nom || apt.mutuelle?.nom || '';
        
        const searchTermLower = searchTerm.toLowerCase();
        return isInDateRange && 
               isInYear && 
               (patientName.toLowerCase().includes(searchTermLower) ||
                apt.numeroPatient?.toLowerCase().includes(searchTermLower) ||
                mutuelleNom.toLowerCase().includes(searchTermLower));
      })
      .filter(apt => {
        if (statusFilter === 'all') return true;
        if (statusFilter === 'Supprimé') return apt.deleted;
        const status = apt.deleted ? 'Supprimé' : (apt.status || '-');
        if (statusFilter === 'Non Validé') {
          return !apt.deleted && NON_VALIDATED_FILTER_STATUSES.includes(status);
        }
        return !apt.deleted && status === statusFilter;
      })
      .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
  }, [getAllAppointments, patients, searchTerm, startDate, endDate, selectedYear, statusFilter]);

  const consultationOptions = useMemo(() => {
    const uniqueConsultations = new Set<number>();
    
    // Ajouter toujours l'option "0"
    uniqueConsultations.add(0);
    
    // Ajouter tous les nombres de consultations existants
    paidAppointments.forEach(appointment => {
      const patient = patients.find(p => p.id === appointment.patientId);
      const patientInfo = getPatientInfo(patient || appointment, appointments);
      if (patientInfo.consultationCount !== undefined) {
        uniqueConsultations.add(patientInfo.consultationCount);
      }
    });

    // Convertir en tableau et trier
    return Array.from(uniqueConsultations).sort((a, b) => a - b);
  }, [paidAppointments, patients, appointments]);

  const { handleAmountChange, handleAmountFocus, handleAmountBlur, formatDisplayAmount } = usePaymentAmount({
    onAmountChange: (amount, paymentMethod) => {
      if (editingAppointment) {
        setEditValues(prev => ({
          ...prev,
          [editingAppointment]: {
            ...prev[editingAppointment],
            amount,
            paymentMethod: paymentMethod === '-' ? '-' : prev[editingAppointment]?.paymentMethod || '-'
          }
        }));
      }
    }
  });

  const handleEdit = (appointmentId: string) => {
    const appointment = paidAppointments.find(apt => apt.id === appointmentId);
    if (!appointment) return;

    let type = appointment.type || '-';

    setEditValues(prev => ({
      ...prev,
      [appointmentId]: {
        amount: appointment.amount || '',
        paymentMethod: appointment.paymentMethod || '-',
        mutuelle: appointment.mutuelle || { active: false, nom: '' },
        type,
        status: appointment.deleted ? 'Supprimé' : (appointment.status || '-')
      }
    }));
    setEditingAppointment(appointmentId);
  };

  const handleSave = async (appointmentId: string) => {
    const editValue = editValues[appointmentId];
    if (!editValue) return;

    const appointment = paidAppointments.find(apt => apt.id === appointmentId);
    if (!appointment) return;

    // Mettre à jour le numéro du patient en fonction du nouveau statut
    const newNumeroPatient = updatePatientNumber(appointment.numeroPatient, editValue.status);
    console.log('Mise à jour du numéro patient:', {
      ancien: appointment.numeroPatient,
      nouveau: newNumeroPatient,
      status: editValue.status
    });

    const updates = {
      amount: editValue.amount,
      paymentMethod: editValue.paymentMethod,
      mutuelle: editValue.mutuelle,
      type: editValue.type,
      status: editValue.status,
      numeroPatient: newNumeroPatient,
      lastUpdated: new Date().toISOString()
    };

    await updateAppointment(appointmentId, updates);
    
    // Mettre à jour le patient associé si nécessaire
    const patient = patients.find(p => p.id === appointment.patientId);
    if (patient) {
      const updatedPatient = {
        ...patient,
        numeroPatient: newNumeroPatient,
        status: editValue.status
      };
      await updatePatient(patient.id, updatedPatient);
    }

    setEditingAppointment(null);
    setEditValues(prev => {
      const { [appointmentId]: _, ...rest } = prev;
      return rest;
    });
  };

  const handleKeyPress = async (e: React.KeyboardEvent, appointmentId: string) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave(appointmentId);
    }
  };

  const handleStartDateChange = (newStartDate: string) => {
    if (newStartDate) {
      setStartDate(newStartDate);
      if (!endDate) {
        setEndDate('31/12');
      }
    } else {
      setStartDate('');
      if (endDate) {
        setStartDate('01/01');
      }
    }
    setInvalidEndDate(false);
  };

  const handleEndDateChange = (newEndDate: string) => {
    if (newEndDate) {
      if (!startDate) {
        setStartDate('01/01');
      }

      const [startDay, startMonth] = (startDate || '01/01').split('/').map(Number);
      const [endDay, endMonth] = newEndDate.split('/').map(Number);
      
      const yearToUse = selectedYear ? parseInt(selectedYear) : new Date().getFullYear();
      const startDateObj = new Date(yearToUse, startMonth - 1, startDay);
      const endDateObj = new Date(yearToUse, endMonth - 1, endDay);

      if (endDateObj >= startDateObj) {
        setEndDate(newEndDate);
        setInvalidEndDate(false);
      } else {
        setInvalidEndDate(true);
      }
    } else {
      setEndDate('');
      if (startDate) {
        setEndDate('31/12');
      }
    }
  };

  const stats = useMemo(() => {
    const validatedPatients = new Set<string>();
    const nonValidatedPatients = new Set<string>();
    const deletedPatients = new Set<string>();
    let totalAmount = 0;

    paidAppointments.forEach(apt => {
      const patientId = apt.patientId || apt.id;
      const status = apt.status || 'En attente';
      
      // Si le patient a un numéro qui commence par PS ou est marqué comme supprimé
      if (apt.numeroPatient?.startsWith('PS') || apt.deleted || status === 'Supprimé') {
        deletedPatients.add(patientId);
      } 
      // Si le patient est validé
      else if (status === 'Validé') {
        validatedPatients.add(patientId);
      } 
      // Si le patient est non validé (en attente, reporté, annulé, etc.)
      else if (NON_VALIDATED_FILTER_STATUSES.includes(status)) {
        nonValidatedPatients.add(patientId);
      }

      if (apt.amount) {
        const amount = parseFloat(apt.amount.replace(',', '.'));
        if (!isNaN(amount)) {
          totalAmount += amount;
        }
      }
    });

    return {
      total: validatedPatients.size + nonValidatedPatients.size + deletedPatients.size,
      validated: validatedPatients.size,
      nonValidated: nonValidatedPatients.size,
      deleted: deletedPatients.size,
      totalAmount: formatAmount(totalAmount.toString())
    };
  }, [paidAppointments]);

  const filteredAppointments = useMemo(() => {
    return paidAppointments.filter((appointment) => {
      // Exclure les rendez-vous supprimés
      if (appointment.deleted) {
        return false;
      }

      const patient = patients.find(p => p.id === appointment.patientId);
      
      // Exclure les patients supprimés
      if (patient?.deleted || patient?.status === 'Supprimé') {
        return false;
      }

      const patientInfo = getPatientInfo(patient || appointment, appointments);
      const searchString = `${getPatientDisplayName(patient || { nom: appointment.nom, prenom: appointment.prenom })} ${patientInfo.telephone || ''} ${patientInfo.ville || ''} ${patientInfo.cin || ''} ${patientInfo.mutuelle?.nom || ''}`.toLowerCase();
      
      // Filtre de recherche
      if (searchTerm && !searchString.includes(searchTerm.toLowerCase())) {
        return false;
      }

      // Filtre de statut
      if (statusFilter !== 'all') {
        const status = appointment.status || 'En attente';
        
        if (statusFilter === 'Non Validé') {
          console.log('Checking non-validated status for:', appointment.patient || getPatientDisplayName(patient), 'Status:', status);
          return NON_VALIDATED_FILTER_STATUSES.includes(status);
        } else if (statusFilter === 'Supprimé') {
          return false;
        } else if (status !== statusFilter) {
          return false;
        }
      }

      // Filtre de consultations
      if (consultationFilter !== 'all') {
        const numConsultations = patientInfo.consultationCount || 0;
        return numConsultations === parseInt(consultationFilter);
      }

      return true;
    });
  }, [paidAppointments, statusFilter, consultationFilter, searchTerm, patients, appointments]);

  const handleDeleteConfirm = async () => {
    try {
      console.log('Début de la suppression définitive des patients sélectionnés:', selectedItems);

      for (const id of selectedItems) {
        const appointment = paidAppointments.find(apt => apt.id === id);
        if (!appointment) {
          console.log(`Rendez-vous non trouvé pour l'ID: ${id}`);
          continue;
        }

        console.log('Rendez-vous trouvé:', appointment);

        // Chercher le patient par ID ou par nom
        let patient = patients.find(p => p.id === appointment.patientId);
        if (!patient && appointment.patient) {
          // Si pas de patientId, chercher par nom
          patient = patients.find(p => 
            `${p.nom} ${p.prenom}`.toLowerCase() === appointment.patient.toLowerCase()
          );
        }

        if (patient) {
          console.log('Patient trouvé:', patient);
          
          // Suppression définitive dans tous les cas
          console.log('Suppression définitive du patient:', patient.id);
          await deletePatient(patient.id, 'patients');
          
          // Supprimer le rendez-vous si ce n'est pas déjà fait
          if (!appointment.deleted) {
            await deleteAppointment(id);
          }
        } else {
          console.log('Patient non trouvé, suppression du rendez-vous');
          await deleteAppointment(id);
        }
      }

      // Forcer le rafraîchissement des données
      window.location.reload();
      
      setSelectedItems([]);
      setShowDeleteModal(false);
    } catch (error) {
      console.error('Erreur lors de la suppression des patients:', error);
      alert('Une erreur est survenue lors de la suppression. Veuillez réessayer.');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col space-y-4 mb-6">
        {/* Titre et statistiques */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-2xl">
            Patients ({filteredAppointments.length})
          </h1>
          <div className="flex items-center space-x-2 text-sm mt-1">
            <span className="font-medium">Total:</span>
            <span className="text-gray-500">
              {stats.validated} Patients Validés
            </span>
            <span className="text-gray-300">•</span>
            <span className="text-gray-500">
              {stats.nonValidated} Patients Non Validés
            </span>
            <span className="text-gray-300">•</span>
            <span className="text-gray-500">
              {stats.deleted} Patients Supprimés
            </span>
          </div>
        </div>

        {/* Filtres et recherche */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="block w-48 pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            >
              <option value="all">Tous patients</option>
              <option value="Validé">Patients Validés</option>
              <option value="Non Validé">Patients Non Validés</option>
              <option value="Supprimé">Patients Supprimés</option>
            </select>

            <select
              value={consultationFilter}
              onChange={(e) => setConsultationFilter(e.target.value)}
              className="block w-48 pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            >
              <option value="all">Nombre de consultations</option>
              {consultationOptions.map((count) => (
                <option key={count} value={count}>
                  {count} consultation{count !== 1 ? 's' : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher par nom, numéro, ville, CIN, mutuelle..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>

          <div className="flex items-center gap-2">
            <DateInput
              value={startDate}
              onChange={handleStartDateChange}
              placeholder="01/01"
              className="w-28 px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
            <span className="text-gray-500">à</span>
            <DateInput
              value={endDate}
              onChange={handleEndDateChange}
              placeholder="31/12"
              className="w-28 px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
            <YearInput
              value={selectedYear}
              onChange={setSelectedYear}
              placeholder="2025"
              className="w-28 px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
          </div>

          {selectedItems.length > 0 && (
            <button
              onClick={() => setShowDeleteModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Supprimé ({selectedItems.length})
            </button>
          )}
        </div>
      </div>

      <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <input
                  type="checkbox"
                  className="h-3 w-3 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedItems(filteredAppointments.map(apt => apt.id));
                    } else {
                      setSelectedItems([]);
                    }
                  }}
                  checked={selectedItems.length === filteredAppointments.length && filteredAppointments.length > 0}
                />
              </th>
              <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                N° Patient
              </th>
              <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Patient
              </th>
              <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Consultations
              </th>
              <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Contact
              </th>
              <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ville
              </th>
              <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                CIN
              </th>
              <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Mutuelle
              </th>
              <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Dernière Consultation
              </th>
              <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Prochain RDV
              </th>
              <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Statut
              </th>
              <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ACTIONS
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredAppointments.map((appointment, index) => {
              const patient = patients.find(p => p.id === appointment.patientId);
              const patientInfo = getPatientInfo(patient || appointment, appointments);
              console.log('PatientInfo:', patientInfo); // Debug log
              
              const status = appointment.status === 'Valider' ? 'En attente' : (appointment.status || 'En attente');
              const rowClassName = appointment.deleted ? 'bg-red-50' : 
                                 (index % 2 === 0 ? 'bg-white' : 'bg-gray-50');
              
              return (
                <tr key={appointment.id} className={rowClassName}>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      className="h-3 w-3 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      checked={selectedItems.includes(appointment.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedItems([...selectedItems, appointment.id]);
                        } else {
                          setSelectedItems(selectedItems.filter(id => id !== appointment.id));
                        }
                      }}
                    />
                  </td>
                  <td className="px-3 py-2 text-sm text-gray-900 text-center">
                    {formatPatientNumber(patientInfo.numeroPatient, status) || '-'}
                  </td>
                  <td className="px-3 py-2 text-sm text-gray-900">
                    {getPatientDisplayName(patient || { nom: appointment.nom, prenom: appointment.prenom })}
                  </td>
                  <td className="px-3 py-2 text-sm text-gray-500 text-center">
                    {patientInfo.consultationCount ?? '0'}
                  </td>
                  <td className="px-3 py-2 text-sm text-gray-500 text-center">
                    {formatters.phoneNumber(patientInfo.telephone) || '-'}
                  </td>
                  <td className="px-3 py-2 text-sm text-gray-500 text-center">
                    {formatters.city(patientInfo.ville) || '-'}
                  </td>
                  <td className="px-3 py-2 text-sm text-gray-500 text-center">
                    {formatters.cin(patientInfo.cin) || '-'}
                  </td>
                  <td className="px-3 py-2 text-sm text-gray-500 text-center">
                    {patientInfo.mutuelle?.nom || 'Non'}
                  </td>
                  <td className="px-3 py-2 text-sm text-gray-500 text-center">
                    {formatDateTimeWithHour(patientInfo.derniereConsultation)}
                  </td>
                  <td className="px-3 py-2 text-sm text-gray-500 text-center">
                    {formatDateTimeWithHour(patientInfo.prochainRdv)}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeStyle(status)}`}>
                      {status}
                    </span>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-indigo-600 hover:text-indigo-900">
                    <button onClick={() => handleEdit(appointment.id)} className="hover:underline">
                      Modifier
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showExportModal && (
        <ExportOptionsModal
          onClose={() => setShowExportModal(false)}
          onExport={() => {
            // Logique d'export
            setShowExportModal(false);
          }}
        />
      )}

      <DeletePatientsConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteConfirm}
        count={selectedItems.length}
      />
    </div>
  );
}
