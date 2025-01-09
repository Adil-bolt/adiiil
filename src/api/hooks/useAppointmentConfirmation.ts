import { useCallback } from 'react';
import { useUnifiedData } from '../contexts/UnifiedDataContext';

export const useAppointmentConfirmation = () => {
  const { addRecord, updateRecord, records } = useUnifiedData();

  const confirmAppointment = useCallback(async (
    patientId: string,
    appointmentDate: string,
    appointmentTime: string,
    confirmed: boolean = true
  ) => {
    try {
      // Vérifier si le patient existe
      const patient = records.find(r => r.id === patientId && r.type === 'patient');
      if (!patient) {
        throw new Error('Patient non trouvé');
      }

      // Vérifier si un rendez-vous existe déjà pour cette date et heure
      const existingAppointment = records.find(r => 
        r.type === 'rendezVous' &&
        'patientId' in r &&
        r.patientId === patientId &&
        r.date === appointmentDate &&
        r.heure === appointmentTime
      );

      if (existingAppointment) {
        // Mettre à jour le rendez-vous existant
        await updateRecord(
          existingAppointment.id,
          {
            status: confirmed ? 'Confirmé' : 'En attente',
            confirmationRendezVous: confirmed
          },
          'agenda'
        );

        // Mettre à jour le patient
        await updateRecord(
          patientId,
          {
            confirmationRendezVous: confirmed,
            prochainRdv: confirmed ? `${appointmentDate} ${appointmentTime}` : undefined
          },
          'agenda'
        );
      } else {
        // Créer un nouveau rendez-vous
        const newAppointment = {
          type: 'rendezVous' as const,
          patientId,
          date: appointmentDate,
          heure: appointmentTime,
          status: confirmed ? 'Confirmé' : 'En attente',
          confirmationRendezVous: confirmed,
          createdFrom: 'agenda' as const
        };

        await addRecord(newAppointment, 'agenda');

        // Mettre à jour le patient
        await updateRecord(
          patientId,
          {
            confirmationRendezVous: confirmed,
            prochainRdv: confirmed ? `${appointmentDate} ${appointmentTime}` : undefined
          },
          'agenda'
        );
      }

      return true;
    } catch (error) {
      console.error('Erreur lors de la confirmation du rendez-vous:', error);
      throw error;
    }
  }, [addRecord, updateRecord, records]);

  const cancelAppointment = useCallback(async (
    patientId: string,
    appointmentDate: string,
    appointmentTime: string
  ) => {
    try {
      const existingAppointment = records.find(r => 
        r.type === 'rendezVous' &&
        'patientId' in r &&
        r.patientId === patientId &&
        r.date === appointmentDate &&
        r.heure === appointmentTime
      );

      if (existingAppointment) {
        await updateRecord(
          existingAppointment.id,
          {
            status: 'Annulé',
            confirmationRendezVous: false
          },
          'agenda'
        );

        // Mettre à jour le patient
        await updateRecord(
          patientId,
          {
            confirmationRendezVous: false,
            prochainRdv: undefined
          },
          'agenda'
        );
      }

      return true;
    } catch (error) {
      console.error('Erreur lors de l\'annulation du rendez-vous:', error);
      throw error;
    }
  }, [updateRecord, records]);

  return {
    confirmAppointment,
    cancelAppointment
  };
};
