import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { format, parseISO, isSameDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Appointment } from '../components/calendar/types';
import { getPaymentStatus, PAYMENT_STATUSES } from '../utils/paymentStatus';
import { useData } from './DataContext';
import { handleAppointmentStatusChange } from '../utils/appointmentStatusHandler';
import { updatePatientNumber } from '../utils/patientNumberManager';

interface AppointmentContextType {
  appointments: Appointment[];
  addAppointment: (appointment: Appointment) => void;
  updateAppointment: (id: string, appointment: Partial<Appointment>) => Promise<void>;
  deleteAppointment: (id: string) => void;
  getAppointmentsByDate: (date: Date) => Appointment[];
  getAppointmentById: (id: string) => Appointment | undefined;
  isTimeSlotAvailable: (date: Date, time: string, duration: number, excludeId?: string) => boolean;
  todayAppointments: Appointment[];
  getAllAppointments: () => Appointment[];
}

const AppointmentContext = createContext<AppointmentContextType | null>(null);

export const useAppointments = () => {
  const context = useContext(AppointmentContext);
  if (!context) {
    throw new Error('useAppointments must be used within an AppointmentProvider');
  }
  return context;
};

interface AppointmentProviderProps {
  children: React.ReactNode;
}

export const AppointmentProvider = ({ children }: AppointmentProviderProps) => {
  const { appointments: dataAppointments, patients, addAppointment: addDataAppointment, updateAppointment: updateDataAppointment, deleteAppointment: deleteDataAppointment } = useData();
  const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([]);

  // Mémoriser les rendez-vous transformés pour éviter les re-rendus inutiles
  const appointments = useMemo(() => {
    return dataAppointments
      .filter(apt => !apt.deleted && apt.time) // Filtrer les rendez-vous supprimés et sans date
      .map(apt => ({
        ...apt,
        displayStatus: apt.status === 'Validé' ? PAYMENT_STATUSES.CONFIRMED : getPaymentStatus(apt.amount)
      }));
  }, [dataAppointments]);

  const getAppointmentsByDate = useCallback((date: Date) => {
    return appointments.filter(apt => {
      const aptDate = parseISO(apt.time);
      return isSameDay(aptDate, date);
    });
  }, [appointments]);

  const getAppointmentById = useCallback((id: string) => {
    return appointments.find(apt => apt.id === id);
  }, [appointments]);

  const isTimeSlotAvailable = useCallback((date: Date, time: string, duration: number = 30, excludeId?: string) => {
    const appointmentsOnDate = getAppointmentsByDate(date);
    const proposedStart = new Date(time);
    const proposedEnd = new Date(proposedStart.getTime() + duration * 60000);
    
    return !appointmentsOnDate.some(apt => {
      if (excludeId && apt.id === excludeId) return false;
      const aptStart = new Date(apt.time);
      const aptEnd = new Date(aptStart.getTime() + (apt.duration || 30) * 60000);
      return (
        (proposedStart >= aptStart && proposedStart < aptEnd) ||
        (proposedEnd > aptStart && proposedEnd <= aptEnd) ||
        (proposedStart <= aptStart && proposedEnd >= aptEnd)
      );
    });
  }, [getAppointmentsByDate]);

  const addAppointment = useCallback((appointment: Appointment) => {
    // Vérifier les données obligatoires
    if (!appointment.patient?.trim() && !appointment.isLunchBreak && !appointment.isClinicalConsultation) {
      throw new Error('Le nom du patient est requis');
    }

    if (!appointment.time) {
      throw new Error('L\'heure du rendez-vous est requise');
    }

    // Ne pas vérifier la disponibilité pour les pauses déjeuner et consultations cliniques
    if (!appointment.isLunchBreak && !appointment.isClinicalConsultation) {
      // Vérifier la disponibilité du créneau
      const isAvailable = isTimeSlotAvailable(
        parseISO(appointment.time),
        appointment.time,
        appointment.duration || 30
      );

      if (!isAvailable) {
        throw new Error('Ce créneau horaire n\'est pas disponible');
      }
    }

    // Préparer le nouveau rendez-vous avec les champs requis
    const newAppointment = {
      ...appointment,
      id: crypto.randomUUID(), // Assurer un ID unique
      deleted: false,
      time: appointment.time,
      duration: appointment.duration || '30',
      status: appointment.status || 'En attente'
    };

    // Ajouter le rendez-vous
    addDataAppointment(newAppointment);
  }, [addDataAppointment, isTimeSlotAvailable]);

  const updateAppointment = useCallback(async (id: string, updates: any) => {
    const currentAppointment = appointments.find(a => a.id === id);
    if (!currentAppointment) return;

    // Mettre à jour le numéro du patient si le statut change
    if (updates.status && updates.status !== currentAppointment.status) {
      updates.numeroPatient = updatePatientNumber(currentAppointment.numeroPatient, updates.status);
    }

    // Si le montant est mis à jour, synchroniser amount et montant
    if ('amount' in updates || 'montant' in updates) {
      const newAmount = updates.amount || updates.montant || '0';
      updates.amount = newAmount;
      updates.montant = newAmount;
    }

    // Si le statut change
    if ('status' in updates) {
      if (updates.status !== 'Validé') {
        // Pour les statuts autres que "Validé", réinitialiser le montant seulement si pas de montant existant
        if (!currentAppointment.amount || currentAppointment.amount === '0' || currentAppointment.amount === '0,00') {
          updates.montant = '0';
          updates.amount = '0';
          updates.paymentMethod = '-';
          updates.paid = false;
        }
      }

      // Mettre à jour le statut du patient
      handleAppointmentStatusChange(
        {
          ...currentAppointment,
          ...updates,
          patientAppointments: appointments.filter(apt => apt.patientId === currentAppointment.patientId)
        },
        updates.status || '',
        patients
      );
    }

    // Mise à jour du rendez-vous
    await updateDataAppointment(id, {
      ...currentAppointment,
      ...updates,
      deleted: false,
      lastUpdated: new Date().toISOString()
    });
  }, [appointments, updateDataAppointment, patients]);

  const deleteAppointment = useCallback((id: string) => {
    deleteDataAppointment(id);
  }, [deleteDataAppointment]);

  const getAllAppointments = useCallback(() => {
    return dataAppointments
      .filter(apt => apt.time) // Filtrer uniquement les rendez-vous sans date
      .map(apt => ({
        ...apt,
        displayStatus: apt.status === 'Validé' ? PAYMENT_STATUSES.CONFIRMED : getPaymentStatus(apt.amount)
      }));
  }, [dataAppointments]);

  useEffect(() => {
    const updateTodayAppointments = () => {
      const today = new Date();
      const todaysApts = appointments.filter(apt => {
        const aptDate = parseISO(apt.time);
        return isSameDay(aptDate, today) && !apt.deleted;
      });
      setTodayAppointments(todaysApts);
    };

    updateTodayAppointments();
    const interval = setInterval(updateTodayAppointments, 60000); // Mise à jour toutes les minutes
    return () => clearInterval(interval);
  }, [appointments]);

  const contextValue = useMemo(() => ({
    appointments,
    addAppointment,
    updateAppointment,
    deleteAppointment,
    getAppointmentsByDate,
    getAppointmentById,
    isTimeSlotAvailable,
    todayAppointments,
    getAllAppointments
  }), [
    appointments,
    addAppointment,
    updateAppointment,
    deleteAppointment,
    getAppointmentsByDate,
    getAppointmentById,
    isTimeSlotAvailable,
    todayAppointments,
    getAllAppointments
  ]);

  return (
    <AppointmentContext.Provider value={contextValue}>
      {children}
    </AppointmentContext.Provider>
  );
};