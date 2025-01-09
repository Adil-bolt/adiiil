import { useState, useMemo } from 'react';
import { useAppointments } from '../contexts/AppointmentContext';
import { useData } from '../contexts/DataContext';
import { parseISO, isWithinInterval, format } from 'date-fns';
import { fr } from 'date-fns/locale';

export function usePayments() {
  const { appointments } = useAppointments();
  const { patients } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });

  const payments = useMemo(() => {
    return appointments
      .filter(apt => apt.status === 'Validé')
      .map(apt => {
        const patient = apt.patientId ? patients.find(p => p.id === apt.patientId) : null;
        return {
          id: apt.id,
          patientName: patient ? 
            `${patient.nom} ${patient.prenom}` : 
            apt.nom && apt.prenom ? 
              `${apt.nom} ${apt.prenom}` : 
              'Patient non spécifié',
          date: format(parseISO(apt.time), 'dd/MM/yyyy', { locale: fr }),
          amount: apt.amount || '0,00',
          paymentMethod: apt.paymentMethod || '-',
          mutuelle: patient?.mutuelle || { active: false, nom: '' },
          status: apt.status,
          paid: apt.paid
        };
      });
  }, [appointments, patients]);

  const filteredPayments = useMemo(() => {
    return payments.filter(payment => {
      const matchesSearch = payment.patientName.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (!dateRange.startDate || !dateRange.endDate) return matchesSearch;
      
      const paymentDate = parseISO(payment.date);
      const start = parseISO(dateRange.startDate);
      const end = parseISO(dateRange.endDate);
      
      return matchesSearch && isWithinInterval(paymentDate, { start, end });
    });
  }, [payments, searchTerm, dateRange]);

  const totalAmount = useMemo(() => {
    return filteredPayments.reduce((sum, payment) => {
      return sum + parseFloat(payment.amount.replace(',', '.'));
    }, 0);
  }, [filteredPayments]);

  const patientsWithMutuelle = useMemo(() => {
    return filteredPayments.filter(payment => payment.mutuelle?.active).length;
  }, [filteredPayments]);

  return {
    payments,
    searchTerm,
    setSearchTerm,
    dateRange,
    setDateRange,
    filteredPayments,
    totalAmount,
    patientsWithMutuelle
  };
}