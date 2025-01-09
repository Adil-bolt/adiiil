import React, { useState } from 'react';
import { useData } from '../../contexts/DataContext';
import PatientModal from '../PatientModal';

interface NewPatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPatientCreated: (patient: any) => void;
  initialData?: {
    nom?: string;
    prenom?: string;
    telephone?: string;
    cin?: string;
  };
}

export default function NewPatientModal({
  isOpen,
  onClose,
  onPatientCreated,
  initialData = null
}: NewPatientModalProps) {
  const { addPatient, patients } = useData();
  const [error, setError] = useState<string | null>(null);

  const checkDuplicatePatient = (patientData: any) => {
    // Normaliser le nom complet
    const normalizedNewName = `${patientData.nom} ${patientData.prenom}`.toLowerCase().trim();
    
    // Vérifier les doublons de nom/prénom ou CIN
    return patients.some(existingPatient => {
      const normalizedExistingName = `${existingPatient.nom} ${existingPatient.prenom}`.toLowerCase().trim();
      
      // Vérifier si le nom/prénom est identique
      const hasSameName = normalizedNewName === normalizedExistingName;
      
      // Vérifier si la CIN est identique (si elle est fournie)
      const hasSameCIN = patientData.cin && 
                        existingPatient.cin && 
                        patientData.cin.toLowerCase() === existingPatient.cin.toLowerCase();
      
      return hasSameName || hasSameCIN;
    });
  };

  const handleSubmit = (patientData: any) => {
    // Vérifier les doublons
    const isDuplicate = checkDuplicatePatient(patientData);
    if (isDuplicate) {
      setError("Un patient avec le même nom et prénom ou la même CIN existe déjà. Veuillez vérifier les informations.");
      return;
    }

    const newPatient = {
      ...patientData,
      id: Date.now().toString()
    };
    addPatient(newPatient);
    onPatientCreated(newPatient);
    onClose();
  };

  return (
    <>
      <PatientModal
        isOpen={isOpen}
        onClose={onClose}
        onSubmit={handleSubmit}
        initialData={initialData}
        error={error}
      />
    </>
  );
}