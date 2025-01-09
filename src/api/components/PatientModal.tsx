import React, { useState, useEffect } from 'react';
import { X, User, Edit, Trash2, AlertTriangle } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import DraggableModal from './DraggableModal';
import MutuelleModal from './MutuelleModal';
import AntecedentsModal from './AntecedentsModal';
import { updatePatientNumber } from '../utils/patientNumberManager';

interface PatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (patient: any) => void;
  onDelete?: (patientId: string) => void;
  initialData?: any;
  error?: string | null;
}

export default function PatientModal({
  isOpen,
  onClose,
  onSubmit,
  onDelete,
  initialData,
  error
}: PatientModalProps) {
  const { deletePatient } = useData();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isMutuelleModalOpen, setIsMutuelleModalOpen] = useState(false);
  const [isAntecedentsModalOpen, setIsAntecedentsModalOpen] = useState(false);
  const [patient, setPatient] = useState({
    nom: '',
    prenom: '',
    telephone: '',
    email: '',
    ville: '',
    secteur: '',
    cin: '',
    dateNaissance: '',
    mutuelle: {
      active: false,
      nom: ''
    },
    antecedents: {
      active: false,
      liste: [] as string[]
    }
  });

  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [savedMutuelles, setSavedMutuelles] = useState<string[]>([
    'CNOPS', 'CNSS', 'RMA', 'SAHAM', 'AXA'
  ]);
  const [savedAntecedents, setSavedAntecedents] = useState<string[]>(() => {
    const saved = localStorage.getItem('savedAntecedents');
    return saved ? JSON.parse(saved) : [
      'Diabète',
      'Hypertension',
      'Asthme',
      'Allergie',
      'Dépression',
      'Anxiété'
    ];
  });

  useEffect(() => {
    if (initialData) {
      setPatient(prev => ({
        ...prev,
        nom: initialData.nom || '',
        prenom: initialData.prenom || '',
        telephone: initialData.telephone || '',
        email: initialData.email || '',
        ville: initialData.ville || '',
        secteur: initialData.secteur || '',
        cin: initialData.cin || '',
        dateNaissance: initialData.dateNaissance || '',
        mutuelle: {
          active: initialData.mutuelle?.active || false,
          nom: initialData.mutuelle?.nom || ''
        },
        antecedents: {
          active: (initialData.antecedents?.length || 0) > 0,
          liste: initialData.antecedents || []
        }
      }));
    } else {
      setPatient({
        nom: '',
        prenom: '',
        telephone: '',
        email: '',
        ville: '',
        secteur: '',
        cin: '',
        dateNaissance: '',
        mutuelle: {
          active: false,
          nom: ''
        },
        antecedents: {
          active: false,
          liste: []
        }
      });
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Début de la soumission du formulaire patient');
    
    const newErrors: {[key: string]: string} = {};
    const nameRegex = /^[a-zA-ZÀ-ÿ\s-]+$/;
    const cinRegex = /^[A-Za-z0-9]+$/;
    const phoneRegex = /^\d{10}$/;

    // Validation du nom
    if (!patient.nom.trim()) {
      newErrors.nom = 'Le nom est requis';
    } else if (!nameRegex.test(patient.nom)) {
      newErrors.nom = 'Le nom ne doit contenir que des lettres, espaces et tirets';
    }
    
    // Validation du prénom
    if (!patient.prenom.trim()) {
      newErrors.prenom = 'Le prénom est requis';
    } else if (!nameRegex.test(patient.prenom)) {
      newErrors.prenom = 'Le prénom ne doit contenir que des lettres, espaces et tirets';
    }

    // Validation du CIN
    if (!patient.cin.trim()) {
      newErrors.cin = 'Le CIN est requis';
    } else if (!cinRegex.test(patient.cin)) {
      newErrors.cin = 'Le CIN doit contenir uniquement des lettres et des chiffres';
    }

    // Validation du téléphone
    if (!patient.telephone.trim()) {
      newErrors.telephone = 'Le numéro de téléphone est requis';
    } else if (!phoneRegex.test(patient.telephone)) {
      newErrors.telephone = 'Le numéro de téléphone doit contenir exactement 10 chiffres';
    }

    // Validation de l'email (optionnel)
    if (patient.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(patient.email)) {
      newErrors.email = 'Format d\'email invalide';
    }

    // Validation de la date de naissance
    if (!/^\d{2}\/\d{2}\/\d{4}$/.test(patient.dateNaissance)) {
      newErrors.dateNaissance = 'Format de date de naissance invalide (jj/mm/aaaa)';
    }

    console.log('Erreurs de validation:', newErrors);

    // Si des erreurs sont présentes, on les affiche et on arrête la soumission
    if (Object.keys(newErrors).length > 0) {
      console.log('Validation échouée');
      setErrors(newErrors);
      return;
    }

    // Attribuer un numéro de patient
    const status = initialData?.status || '-'; // Si c'est un nouveau patient, le statut est '-'
    const numeroPatient = updatePatientNumber(initialData?.numeroPatient, status);

    // Créer ou mettre à jour le patient avec son numéro
    const patientToSubmit = {
      ...patient,
      numeroPatient,
      status,
      lastUpdated: new Date().toISOString()
    };

    try {
      console.log('Préparation des données du patient pour soumission:', patientToSubmit);
      const patientData = {
        ...patientToSubmit,
        ville: patientToSubmit.ville.trim(),
        secteur: patientToSubmit.ville.toLowerCase() === 'marrakech' ? patientToSubmit.secteur.trim() : '',
        antecedents: patientToSubmit.antecedents.active ? patientToSubmit.antecedents.liste : [],
        mutuelle: {
          active: patientToSubmit.mutuelle.active,
          nom: patientToSubmit.mutuelle.active ? patientToSubmit.mutuelle.nom.trim() : ''
        }
      };

      console.log('Données du patient préparées:', patientData);
      onSubmit(patientData);
    } catch (error) {
      console.error('Erreur lors de la soumission du patient:', error);
      setErrors({
        submit: 'Une erreur est survenue lors de l\'enregistrement. Veuillez réessayer.'
      });
    }
    onClose();
  };

  const handleDelete = () => {
    if (initialData?.id) {
      if (onDelete) {
        onDelete(initialData.id);
      } else {
        deletePatient(initialData.id);
      }
      onClose();
    }
  };

  const handleMutuelleUpdate = (mutuelles: string[]) => {
    setSavedMutuelles(mutuelles);
  };

  const handleAntecedentsUpdate = (antecedents: string[]) => {
    setSavedAntecedents(antecedents);
    localStorage.setItem('savedAntecedents', JSON.stringify(antecedents));
  };

  const handleInputChange = (field: string, value: string) => {
    setPatient(prev => ({ ...prev, [field]: value }));
  };

  // Gérer les touches du clavier
  const handleKeyDown = (e: KeyboardEvent) => {
    if (!isOpen) return;

    // Si le modal de confirmation de suppression est ouvert
    if (showDeleteConfirm) {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleDelete();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setShowDeleteConfirm(false);
      }
      return;
    }

    // Si le modal principal est ouvert
    if (e.key === 'Delete' && initialData) {
      e.preventDefault();
      setShowDeleteConfirm(true);
    } else if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
      // Vérifier que nous ne sommes pas dans un champ textarea ou que l'utilisateur ne fait pas une nouvelle ligne
      const activeElement = document.activeElement;
      if (activeElement?.tagName !== 'TEXTAREA' || !e.shiftKey) {
        e.preventDefault();
        const form = document.querySelector('form');
        if (form) {
          const submitEvent = new Event('submit', {
            bubbles: true,
            cancelable: true,
          });
          form.dispatchEvent(submitEvent);
        }
      }
    }
  };

  // Ajouter et supprimer les écouteurs d'événements
  useEffect(() => {
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isOpen, showDeleteConfirm, initialData]);

  if (!isOpen) return null;

  if (showDeleteConfirm) {
    return (
      <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full">
          <div className="flex items-center mb-4">
            <AlertTriangle className="h-6 w-6 text-red-600 mr-2" />
            <h3 className="text-lg font-medium text-gray-900">
              Confirmer la suppression
            </h3>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            Êtes-vous sûr de vouloir supprimer définitivement ce patient ? Cette action est irréversible.
          </p>
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Annuler
            </button>
            <button
              onClick={handleDelete}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
            >
              Supprimer
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <DraggableModal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Modifier le patient' : 'Nouveau patient'}
      preventBackgroundClose={true}
    >
      <div className="space-y-6 max-w-3xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              <strong>Erreur !</strong> {error}
            </div>
          )}
          {/* En-tête avec icône */}
          <div className="flex items-center justify-center mb-6">
            <div className="bg-indigo-100 p-3 rounded-full">
              <User className="h-8 w-8 text-indigo-600" />
            </div>
          </div>

          {/* Informations principales */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Nom
                <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="nom"
                value={patient.nom}
                onChange={(e) => handleInputChange('nom', e.target.value)}
                className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
                  errors.nom ? 'border-red-500' : ''
                }`}
              />
              {errors.nom && (
                <p className="text-red-500 text-xs mt-1">{errors.nom}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Prénom
                <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="prenom"
                value={patient.prenom}
                onChange={(e) => handleInputChange('prenom', e.target.value)}
                className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
                  errors.prenom ? 'border-red-500' : ''
                }`}
              />
              {errors.prenom && (
                <p className="text-red-500 text-xs mt-1">{errors.prenom}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Téléphone
                <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                name="telephone"
                value={patient.telephone}
                onChange={(e) => handleInputChange('telephone', e.target.value)}
                className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
                  errors.telephone ? 'border-red-500' : ''
                }`}
                placeholder="0600000000"
              />
              {errors.telephone && (
                <p className="text-red-500 text-xs mt-1">{errors.telephone}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={patient.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="exemple@email.com"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                CIN
                <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="cin"
                value={patient.cin}
                onChange={(e) => handleInputChange('cin', e.target.value)}
                className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
                  errors.cin ? 'border-red-500' : ''
                }`}
              />
              {errors.cin && (
                <p className="text-red-500 text-xs mt-1">{errors.cin}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Date de naissance
              </label>
              <input
                type="text"
                name="dateNaissance"
                value={patient.dateNaissance}
                onChange={(e) => {
                  const value = e.target.value;
                  // Permet uniquement les chiffres et /
                  if (value === '' || /^[\d/]*$/.test(value)) {
                    // Ajoute automatiquement les /
                    let formattedValue = value.replace(/[^0-9]/g, '');
                    if (formattedValue.length > 2 && formattedValue.length <= 4) {
                      formattedValue = formattedValue.slice(0, 2) + '/' + formattedValue.slice(2);
                    } else if (formattedValue.length > 4) {
                      formattedValue = formattedValue.slice(0, 2) + '/' + formattedValue.slice(2, 4) + '/' + formattedValue.slice(4, 8);
                    }
                    handleInputChange('dateNaissance', formattedValue);
                  }
                }}
                maxLength={10}
                placeholder="jj/mm/aaaa"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
              {errors.dateNaissance && (
                <p className="text-red-500 text-xs mt-1">{errors.dateNaissance}</p>
              )}
            </div>
          </div>

          {/* Boutons Mutuelle et Antécédents */}
          <div className="flex space-x-4 mt-6">
            <button
              type="button"
              onClick={() => setIsMutuelleModalOpen(true)}
              className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              {patient.mutuelle.active ? (
                <>
                  <span className="text-green-500 mr-2">✓</span>
                  Mutuelle ajoutée
                </>
              ) : (
                'Ajouter une mutuelle'
              )}
            </button>
            <button
              type="button"
              onClick={() => setIsAntecedentsModalOpen(true)}
              className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              {patient.antecedents.active ? (
                <>
                  <span className="text-green-500 mr-2">✓</span>
                  Antécédents ajoutés
                </>
              ) : (
                'Ajouter des antécédents'
              )}
            </button>
          </div>

          {/* Boutons d'action */}
          <div className="flex justify-end space-x-3 mt-6 pt-6 border-t">
            {onDelete && (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="inline-flex items-center px-4 py-2 border border-red-300 shadow-sm text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Supprimer
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              {initialData ? 'Modifier' : 'Créer'}
            </button>
          </div>
        </form>
      </div>

      {/* Modals secondaires */}
      <MutuelleModal
        isOpen={isMutuelleModalOpen}
        onClose={() => setIsMutuelleModalOpen(false)}
        savedMutuelles={savedMutuelles}
        onSaveMutuelle={(mutuelle) => {
          setPatient(prev => ({
            ...prev,
            mutuelle: {
              active: true,
              nom: mutuelle
            }
          }));
          setIsMutuelleModalOpen(false);
        }}
        initialMutuelle={patient.mutuelle.nom}
      />

      <AntecedentsModal
        isOpen={isAntecedentsModalOpen}
        onClose={() => setIsAntecedentsModalOpen(false)}
        savedAntecedents={savedAntecedents}
        onSaveAntecedents={(antecedents) => {
          setPatient(prev => ({
            ...prev,
            antecedents: {
              active: antecedents.length > 0,
              liste: antecedents
            }
          }));
          setIsAntecedentsModalOpen(false);
        }}
        initialAntecedents={patient.antecedents.liste}
      />

      {/* Modal de confirmation de suppression */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
            <div className="flex items-center mb-4">
              <AlertTriangle className="h-6 w-6 text-red-500 mr-2" />
              <h3 className="text-lg font-medium">Confirmer la suppression</h3>
            </div>
            <p className="mb-4">Êtes-vous sûr de vouloir supprimer ce patient ? Cette action est irréversible.</p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  if (onDelete && initialData?.id) {
                    onDelete(initialData.id);
                    setShowDeleteConfirm(false);
                    onClose();
                  }
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </DraggableModal>
  );
}