import { useState, useCallback } from 'react';
import { localToGMT, gmtToLocal } from '../utils/dateUtils';
import { Appointment } from '../types/appointment';

export function useAppointments(timezone: string = 'UTC') {
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  const addAppointment = useCallback((appointment: Omit<Appointment, 'id' | 'time'> & { date: string; time: string }) => {
    const { date, time, ...rest } = appointment;
    
    // Convert to GMT for storage
    const gmtTime = localToGMT(date, time);
    
    const newAppointment: Appointment = {
      ...rest,
      id: crypto.randomUUID(),
      time: gmtTime
    };

    setAppointments(prev => [...prev, newAppointment]);
  }, []);

  const updateAppointment = useCallback((id: string, updates: Partial<Appointment> & { date?: string; time?: string }) => {
    setAppointments(prev => prev.map(apt => {
      if (apt.id !== id) return apt;

      // If date/time updates are provided, convert to GMT
      let updatedTime = apt.time;
      if (updates.date && updates.time) {
        updatedTime = localToGMT(updates.date, updates.time);
      }

      const { date, time, ...rest } = updates;
      return {
        ...apt,
        ...rest,
        time: updatedTime
      };
    }));
  }, []);

  // Convert GMT times to local for display
  const getLocalAppointments = useCallback(() => {
    return appointments.map(apt => {
      const { date, time } = gmtToLocal(apt.time, timezone);
      return {
        ...apt,
        localDate: date,
        localTime: time
      };
    });
  }, [appointments, timezone]);

  return {
    appointments: getLocalAppointments(),
    addAppointment,
    updateAppointment
  };
}