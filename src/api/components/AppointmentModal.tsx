import React, { useState, useEffect } from 'react';
import { format, isSameDay, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { User, Edit, Trash2, AlertTriangle, Search, Phone, Check, Plus } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useTimeSlots } from '../hooks/useTimeSlots';
import { APPOINTMENT_SOURCES } from '../constants/appointmentSources';
import DraggableModal from './DraggableModal';
import NewPatientModal from './patient/NewPatientModal';
import AppointmentSourceModal from './AppointmentSourceModal';
import ValidationModal from './modals/ValidationModal';

interface AppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (appointment: any) => void;
  onDelete?: (id: string) => void;
  initialDate?: Date;
  initialTime?: string;
  existingAppointment?: any;
  timezone?: string;
}

export default function AppointmentModal({
  isOpen,
  onClose,
  onSubmit,
  onDelete,
  initialDate,
  initialTime,
  existingAppointment,
  timezone = 'GMT'
}: AppointmentModalProps) {
  const { patients } = useData();
  const { timeSlots } = useTimeSlots(timezone);
  const [isNewPatientModalOpen, setIsNewPatientModalOpen] = useState(false);
  const [isSourceModalOpen, setIsSourceModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredPatients, setFilteredPatients] = useState(patients);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [showPatientSearch, setShowPatientSearch] = useState(false);
  const [validationMessage, setValidationMessage] = useState('');
  const [showValidationModal, setShowValidationModal] = useState(false);

  const defaultAppointment = {
    nom: '',
    prenom: '',
    telephone: '',
    date: initialDate ? initialDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    time: initialTime || '09:00',
    duration: '30',
    source: APPOINTMENT_SOURCES.PHONE.id,
    isExistingPatient: false,
    isLunchBreak: false,
    isClinicalConsultation: false,
    clinicName: '',
    patientId: '',
    type: 'NOUVELLE CONSULTATION',
    status: 'Valider',
    paid: false,
    paymentMethod: '',
    amount: '',
    isNewPatient: false,
    isDelegue: false,
    isGratuite: false,
    isCanceled: false
  };

  const [appointment, setAppointment] = useState(defaultAppointment);

  // Fonction pour vérifier si un patient existe déjà
  const checkExistingPatient = (nom: string, prenom: string, cin?: string) => {
    const normalizedNewName = `${nom} ${prenom}`.toLowerCase().trim();
    return patients.find(existingPatient => {
      const normalizedExistingName = `${existingPatient.nom} ${existingPatient.prenom}`.toLowerCase().trim();
      const hasSameName = normalizedNewName === normalizedExistingName;
      
      const hasSameCIN = cin && 
                        existingPatient.cin && 
                        cin.toLowerCase() === existingPatient.cin.toLowerCase();
      
      return hasSameName || hasSameCIN;
    });
  };

  useEffect(() => {
    if (existingAppointment) {
      const patient = patients.find(p => p.id === existingAppointment.patientId);
      const appointmentDate = new Date(existingAppointment.time);
      
      setAppointment({
        ...defaultAppointment,
        ...existingAppointment,
        nom: patient?.nom || existingAppointment.nom || '',
        prenom: patient?.prenom || existingAppointment.prenom || '',
        telephone: patient?.telephone || existingAppointment.telephone || '',
        date: initialDate ? initialDate.toISOString().split('T')[0] : format(appointmentDate, 'yyyy-MM-dd'),
        time: initialTime || format(appointmentDate, 'HH:mm'),
        duration: typeof existingAppointment.duration === 'string' ? existingAppointment.duration.replace(/[^0-9]/g, '') : String(existingAppointment.duration || 30),
        isExistingPatient: !!existingAppointment.patientId,
        isNewPatient: !existingAppointment.patientId && !patient
      });

      if (existingAppointment.patientId && patient) {
        setSelectedPatient(patient);
      }
    } else {
      setAppointment({
        ...defaultAppointment,
        isNewPatient: !selectedPatient
      });
      setSelectedPatient(null);
    }
  }, [existingAppointment, patients, initialDate, initialTime]);

  useEffect(() => {
    if (searchTerm) {
      const filtered = patients.filter(patient => {
        const searchString = `${patient.nom} ${patient.prenom} ${patient.telephone}`.toLowerCase();
        const searchTerms = searchTerm.toLowerCase().split(' ');
        return searchTerms.every(term => searchString.includes(term));
      });
      setFilteredPatients(filtered);
      setShowPatientSearch(true);
    } else {
      setFilteredPatients(patients);
      setShowPatientSearch(appointment.isExistingPatient);
    }
  }, [searchTerm, patients, appointment.isExistingPatient]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Créer une date combinée avec la date et l'heure sélectionnées
      const [hours, minutes] = appointment.time.split(':').map(Number);
      const combinedDate = new Date(appointment.date);
      combinedDate.setHours(hours, minutes, 0, 0);

      // Vérifier si c'est une pause déjeuner ou une consultation clinique
      if (appointment.isLunchBreak || appointment.isClinicalConsultation) {
        const updatedAppointment = {
          ...appointment,
          time: combinedDate.toISOString(),
          duration: parseInt(appointment.duration),
          patient: appointment.isLunchBreak 
            ? 'PAUSE_DEJEUNER' 
            : `CONSULTATION_CLINIQUE - ${appointment.clinicName} - ${appointment.nom} ${appointment.prenom}`.trim(),
        };
        await onSubmit(updatedAppointment);
        onClose();
        return;
      }

      // Validation des champs requis
      if (!selectedPatient && !appointment.nom) {
        setValidationMessage('Veuillez sélectionner un patient ou saisir un nom');
        setShowValidationModal(true);
        return;
      }
      if (!selectedPatient && !appointment.prenom) {
        setValidationMessage('Veuillez saisir un prénom');
        setShowValidationModal(true);
        return;
      }

      // Si ce n'est pas un patient sélectionné, vérifier s'il existe déjà
      if (!selectedPatient) {
        const existingPatient = checkExistingPatient(appointment.nom, appointment.prenom);
        if (existingPatient) {
          // Utiliser le patient existant
          setSelectedPatient(existingPatient);
          setAppointment(prev => ({
            ...prev,
            patientId: existingPatient.id,
            telephone: existingPatient.telephone || prev.telephone,
            isExistingPatient: true,
            isNewPatient: false
          }));
        }
      }

      const updatedAppointment = {
        ...appointment,
        time: combinedDate.toISOString(),
        duration: parseInt(appointment.duration),
        patientId: selectedPatient?.id || '',
        patient: selectedPatient 
          ? `${selectedPatient.nom} ${selectedPatient.prenom}`
          : `${appointment.nom} ${appointment.prenom}`,
      };

      // Si tout est valide, soumettre le rendez-vous
      await onSubmit(updatedAppointment);
      onClose();
    } catch (error) {
      console.error('Erreur lors de la soumission du rendez-vous:', error);
      if (error instanceof Error) {
        setValidationMessage(error.message);
      } else {
        setValidationMessage('Une erreur est survenue lors de la création du rendez-vous');
      }
      setShowValidationModal(true);
    }
  };

  const handlePatientSelect = (patient: any) => {
    setSelectedPatient(patient);
    setAppointment(prev => ({
      ...prev,
      nom: patient.nom,
      prenom: patient.prenom,
      telephone: patient.telephone,
      patientId: patient.id,
      isExistingPatient: true,
      isNewPatient: false
    }));
    setSearchTerm('');
    setShowPatientSearch(false);
  };

  const handleDeleteAppointment = () => {
    if (existingAppointment && onDelete) {
      onDelete(existingAppointment.id);
      onClose();
    }
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Delete' && isOpen && existingAppointment && onDelete) {
        handleDeleteAppointment();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, existingAppointment, onDelete]);

  const handleNewPatientCreated = (patient: any) => {
    handlePatientSelect(patient);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase();
    setAppointment(prev => ({ ...prev, nom: value }));
  };

  const handleFirstNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const formattedValue = value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
    setAppointment(prev => ({ ...prev, prenom: formattedValue }));

    // Vérifier si un patient existe avec ce nom et prénom
    if (appointment.nom && formattedValue) {
      const existingPatient = checkExistingPatient(appointment.nom, formattedValue);
      if (existingPatient) {
        handlePatientSelect(existingPatient);
      }
    }
  };

  return (
    <>
      <DraggableModal
        isOpen={isOpen}
        onClose={onClose}
        title={
          <div className="flex items-center space-x-2">
            <span className="text-xl font-semibold">
              {existingAppointment ? "Modifier le rendez-vous" : "Nouveau rendez-vous"}
            </span>
            {existingAppointment && (
              <span className="px-2 py-1 text-sm rounded-full bg-blue-100 text-blue-800">
                {format(parseISO(existingAppointment.time), 'dd MMMM yyyy', { locale: fr })}
              </span>
            )}
          </div>
        }
        className="w-full max-w-2xl max-h-[80vh] overflow-y-auto"
        preventBackgroundClose={true}
        onEscapeKey={onClose}
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* En-tête avec les options principales */}
          <div className="bg-gray-50 p-4 rounded-lg space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isExistingPatient"
                    checked={appointment.isExistingPatient}
                    onChange={(e) => {
                      setAppointment(prev => ({ ...prev, isExistingPatient: e.target.checked }));
                      if (!e.target.checked) {
                        setSelectedPatient(null);
                        setSearchTerm('');
                      }
                    }}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <label htmlFor="isExistingPatient" className="text-sm font-medium text-gray-700">
                    Patient existant
                  </label>
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => setIsNewPatientModalOpen(true)}
                  className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors duration-200"
                >
                  <User className="h-5 w-5 mr-2" />
                  Ajouter patient
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-4">
              <div className="flex items-center space-x-2 bg-white px-3 py-2 rounded-md shadow-sm">
                <input
                  type="checkbox"
                  id="isLunchBreak"
                  checked={appointment.isLunchBreak}
                  onChange={(e) => {
                    setAppointment(prev => ({
                      ...prev,
                      isLunchBreak: e.target.checked,
                      isClinicalConsultation: false,
                      type: e.target.checked ? 'PAUSE_DEJEUNER' : 'NOUVELLE CONSULTATION'
                    }));
                  }}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="isLunchBreak" className="text-sm font-medium text-gray-700">
                  Pause déjeuner
                </label>
              </div>

              <div className="flex items-center space-x-2 bg-white px-3 py-2 rounded-md shadow-sm">
                <input
                  type="checkbox"
                  id="isClinicalConsultation"
                  checked={appointment.isClinicalConsultation}
                  onChange={(e) => {
                    setAppointment(prev => ({
                      ...prev,
                      isClinicalConsultation: e.target.checked,
                      isLunchBreak: false,
                      type: e.target.checked ? 'CONSULTATION_CLINIQUE' : 'NOUVELLE CONSULTATION'
                    }));
                  }}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="isClinicalConsultation" className="text-sm font-medium text-gray-700">
                  Consultation Clinique
                </label>
              </div>
            </div>
          </div>

          {/* Section de recherche de patient */}
          {appointment.isExistingPatient && (
            <div className="space-y-4 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Rechercher un patient par nom, prénom ou téléphone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  autoFocus
                />
              </div>

              {showPatientSearch && (
                <div className="absolute z-10 w-full bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                  {filteredPatients.length > 0 ? (
                    filteredPatients.map((patient) => (
                      <div
                        key={patient.id}
                        className="px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors duration-150"
                        onClick={() => handlePatientSelect(patient)}
                      >
                        <div className="font-medium text-gray-900">{patient.nom} {patient.prenom}</div>
                        <div className="text-sm text-gray-600 mt-1">
                          <span className="inline-flex items-center">
                            <Phone className="h-4 w-4 mr-1" />
                            {patient.telephone}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-gray-500 text-center">
                      Aucun patient trouvé
                    </div>
                  )}
                </div>
              )}

              {selectedPatient && (
                <div className="mt-2 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-lg font-medium text-gray-900">
                        {selectedPatient.nom} {selectedPatient.prenom}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        <span className="inline-flex items-center">
                          <Phone className="h-4 w-4 mr-1" />
                          {selectedPatient.telephone}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsNewPatientModalOpen(true)}
                      className="p-2 text-indigo-600 hover:text-indigo-800 rounded-full hover:bg-indigo-50 transition-colors duration-200"
                    >
                      <Edit className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Formulaire pour nouveau patient */}
          {!appointment.isLunchBreak && !appointment.isClinicalConsultation && !appointment.isExistingPatient && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div>
                <label htmlFor="nom" className="block text-sm font-medium text-gray-700">
                  Nom
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <input
                  type="text"
                  id="nom"
                  name="nom"
                  value={appointment.nom}
                  onChange={handleNameChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label htmlFor="prenom" className="block text-sm font-medium text-gray-700">
                  Prénom
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <input
                  type="text"
                  id="prenom"
                  name="prenom"
                  value={appointment.prenom}
                  onChange={handleFirstNameChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Téléphone
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="tel"
                    value={appointment.telephone}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9]/g, '');
                      if (value.length <= 10) {
                        setAppointment(prev => ({ ...prev, telephone: value }));
                      }
                    }}
                    onBlur={(e) => {
                      if (e.target.value.length < 10) {
                        setValidationMessage('Le numéro de téléphone doit contenir 10 chiffres');
                        setShowValidationModal(true);
                      }
                    }}
                    className={`w-full pl-10 pr-10 py-3 rounded-md shadow-sm sm:text-sm transition-colors duration-200 ${
                      appointment.telephone.length === 10
                        ? 'border-green-300 focus:border-green-500 focus:ring-green-500'
                        : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'
                    }`}
                    required
                    placeholder="0612345678"
                    pattern="[0-9]{10}"
                    minLength={10}
                    maxLength={10}
                    title="Le numéro de téléphone doit contenir exactement 10 chiffres"
                  />
                  {appointment.telephone.length > 0 && appointment.telephone.length < 10 && (
                    <div className="absolute right-0 -bottom-5 text-red-500 text-xs">
                      Il manque {10 - appointment.telephone.length} chiffre(s)
                    </div>
                  )}
                  {appointment.telephone.length === 10 && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <Check className="h-5 w-5 text-green-500" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Section date et heure */}
          <div className="grid grid-cols-3 gap-4 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date
                <span className="text-red-500 ml-1">*</span>
              </label>
              <input
                type="date"
                value={appointment.date}
                onChange={(e) => setAppointment(prev => ({ ...prev, date: e.target.value }))}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Heure ({timezone})
                <span className="text-red-500 ml-1">*</span>
              </label>
              <select
                value={appointment.time}
                onChange={(e) => setAppointment(prev => ({ ...prev, time: e.target.value }))}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                required
              >
                {timeSlots.map((time) => (
                  <option key={time} value={time}>{time}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Durée
                <span className="text-red-500 ml-1">*</span>
              </label>
              <select
                value={appointment.duration}
                onChange={(e) => setAppointment(prev => ({ ...prev, duration: e.target.value }))}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                required
              >
                <option value="15">15 minutes</option>
                <option value="30">30 minutes</option>
                <option value="45">45 minutes</option>
                <option value="60">1 heure</option>
                <option value="90">1h30</option>
                <option value="120">2 heures</option>
              </select>
            </div>
          </div>

          {/* Cases à cocher pour le type de rendez-vous */}
          <div className="space-y-4">
            {appointment.isClinicalConsultation && (
              <div className="space-y-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700">Clinique</label>
                  <input
                    type="text"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    value={appointment.clinicName}
                    onChange={(e) => setAppointment(prev => ({ ...prev, clinicName: e.target.value }))}
                    placeholder="Nom de la clinique"
                  />
                </div>
                <div className="flex space-x-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700">Nom du patient</label>
                    <input
                      type="text"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      value={appointment.nom}
                      onChange={(e) => setAppointment(prev => ({ ...prev, nom: e.target.value }))}
                      placeholder="Nom du patient"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700">Prénom du patient</label>
                    <input
                      type="text"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      value={appointment.prenom}
                      onChange={(e) => setAppointment(prev => ({ ...prev, prenom: e.target.value }))}
                      placeholder="Prénom du patient"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Source du rendez-vous */}
          {!appointment.isLunchBreak && !appointment.isClinicalConsultation && (
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">Source du rendez-vous</label>
                <button
                  type="button"
                  onClick={() => setIsSourceModalOpen(true)}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors duration-200"
                >
                  <Edit className="h-5 w-5" />
                </button>
              </div>
              <select
                value={appointment.source}
                onChange={(e) => setAppointment(prev => ({ ...prev, source: e.target.value }))}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                required
              >
                {Object.values(APPOINTMENT_SOURCES).map((source) => (
                  <option key={source.id} value={source.id}>{source.label}</option>
                ))}
              </select>
            </div>
          )}

          {/* Boutons d'action */}
          <div className="mt-6 flex justify-between space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors duration-200"
            >
              Annuler
            </button>
            {existingAppointment && onDelete && (
              <button
                type="button"
                onClick={handleDeleteAppointment}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors duration-200 flex items-center"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Supprimer
              </button>
            )}
            <button
              type="submit"
              className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors duration-200 flex items-center"
            >
              {existingAppointment ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Mettre à jour
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Créer
                </>
              )}
            </button>
          </div>
        </form>
      </DraggableModal>

      <NewPatientModal
        isOpen={isNewPatientModalOpen}
        onClose={() => setIsNewPatientModalOpen(false)}
        onPatientCreated={handleNewPatientCreated}
        initialData={{
          nom: appointment.nom,
          prenom: appointment.prenom,
          telephone: appointment.telephone
        }}
      />

      <AppointmentSourceModal
        isOpen={isSourceModalOpen}
        onClose={() => setIsSourceModalOpen(false)}
        onUpdate={(updatedSources) => {
          setIsSourceModalOpen(false);
        }}
      />

      <ValidationModal
        isOpen={showValidationModal}
        onClose={() => setShowValidationModal(false)}
        message={validationMessage}
      />
    </>
  );
}