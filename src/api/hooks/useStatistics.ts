import { useState, useEffect, useCallback } from 'react';
import { useData } from '../contexts/DataContext';
import { useAppointments } from '../contexts/AppointmentContext';
import { format, parse, parseISO, isWithinInterval, differenceInYears } from 'date-fns';
import { fr } from 'date-fns/locale';

interface DateRange {
  startDate: string;
  endDate: string;
  year: string;
}

export const useStatistics = (dateRange?: DateRange) => {
  const { patients } = useData();
  const { appointments } = useAppointments();
  const [stats, setStats] = useState<{ [key: string]: any }>({});

  const filterByDateRange = useCallback((dateStr: string) => {
    if (!dateRange?.startDate || !dateRange?.endDate || !dateRange?.year) return true;

    try {
      const itemDate = parseISO(dateStr);
      const startDate = parse(
        `${dateRange.startDate}/${dateRange.year}`,
        'dd/MM/yyyy',
        new Date()
      );
      const endDate = parse(
        `${dateRange.endDate}/${dateRange.year}`,
        'dd/MM/yyyy',
        new Date()
      );

      endDate.setHours(23, 59, 59, 999);
      return isWithinInterval(itemDate, { start: startDate, end: endDate });
    } catch (error) {
      console.error('Erreur lors du filtrage des dates:', error);
      return false;
    }
  }, [dateRange]);

  const calculateStats = useCallback(() => {
    if (!appointments.length && !patients.length) return;

    const filteredAppointments = appointments.filter(apt => filterByDateRange(apt.time));

    // Calcul des statistiques...
    const newStats = {
      cityStats: patients.reduce((acc: { [key: string]: number }, patient) => {
        const city = patient.ville?.trim() || 'Non spécifié';
        acc[city] = (acc[city] || 0) + 1;
        return acc;
      }, {}),

      ageStats: patients.reduce((acc: { [key: string]: number }, patient) => {
        if (patient.dateNaissance) {
          const age = differenceInYears(new Date(), parseISO(patient.dateNaissance));
          const ageGroup = `${Math.floor(age / 10) * 10}-${Math.floor(age / 10) * 10 + 9}`;
          acc[ageGroup] = (acc[ageGroup] || 0) + 1;
        }
        return acc;
      }, {}),

      genderStats: patients.reduce((acc: { [key: string]: number }, patient) => {
        const gender = patient.genre || 'Non spécifié';
        acc[gender] = (acc[gender] || 0) + 1;
        return acc;
      }, {}),

      paymentStats: filteredAppointments.reduce((acc: { [key: string]: { total: number, count: number } }, apt) => {
        if (apt.amount) {
          const month = format(parseISO(apt.time), 'MMMM yyyy', { locale: fr });
          const amount = parseFloat(apt.amount.replace(',', '.'));
          if (!acc[month]) acc[month] = { total: 0, count: 0 };
          acc[month].total += amount;
          acc[month].count += 1;
        }
        return acc;
      }, {}),

      appointmentStatusStats: filteredAppointments.reduce((acc: { [key: string]: number }, apt) => {
        const status = apt.status || 'Non spécifié';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {}),

      appointmentSourceStats: filteredAppointments.reduce((acc: { [key: string]: number }, apt) => {
        const source = apt.source || 'Non spécifié';
        acc[source] = (acc[source] || 0) + 1;
        return acc;
      }, {}),

      consultationDurationStats: {
        average: filteredAppointments.length ? 
          filteredAppointments.reduce((sum, apt) => sum + (apt.duration || 30), 0) / filteredAppointments.length : 
          0,
        distribution: filteredAppointments.reduce((acc: { [key: string]: number }, apt) => {
          const duration = apt.duration || 30;
          const range = `${Math.floor(duration / 15) * 15}-${Math.floor(duration / 15) * 15 + 14}min`;
          acc[range] = (acc[range] || 0) + 1;
          return acc;
        }, {})
      },

      mutuelleStats: filteredAppointments.reduce((acc: { [key: string]: number }, apt) => {
        const mutuelle = apt.mutuelle?.nom || 'Sans mutuelle';
        acc[mutuelle] = (acc[mutuelle] || 0) + 1;
        return acc;
      }, {}),

      paymentTypeStats: filteredAppointments.reduce((acc: { [key: string]: number }, apt) => {
        const method = apt.paymentMethod || 'Non spécifié';
        acc[method] = (acc[method] || 0) + 1;
        return acc;
      }, {})
    };

    setStats(newStats);
  }, [appointments, patients, filterByDateRange]);

  useEffect(() => {
    calculateStats();
  }, [calculateStats]);

  return stats;
};