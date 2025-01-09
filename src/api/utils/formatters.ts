import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { getPatientStatus, formatPatientNumber } from './patientStatusUtils';
import { Patient } from '../types/patient';
import { Appointment } from '../components/calendar/types';

export const formatters = {
  patientNumber: (number: string | undefined | null, patient?: Patient, appointments?: Appointment[]) => {
    if (!number) return '-';
    
    // Si le numéro commence par PS, retourner "-"
    if (number.startsWith('PS')) return '-';
    
    if (!patient || !appointments) return number;

    const status = getPatientStatus(patient, appointments);
    if (status === 'suppressed') return '-';
    return formatPatientNumber(number, status);
  },

  patientName: (nom: string | undefined | null, prenom: string | undefined | null) => {
    if (!nom && !prenom) return '-';
    const safeName = nom?.trim() || '';
    const safePrenom = prenom?.trim() || '';
    return `${safeName.toUpperCase()} ${safePrenom.charAt(0).toUpperCase()}${safePrenom.slice(1).toLowerCase()}`.trim();
  },

  phoneNumber: (phone: string | undefined | null) => {
    if (!phone) return '-';
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length !== 10) return phone;
    return cleaned.replace(/(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5');
  },

  city: (city: string | undefined | null) => {
    if (!city) return '-';
    return city.charAt(0).toUpperCase() + city.slice(1).toLowerCase();
  },

  cin: (cin: string | undefined | null) => {
    if (!cin) return '-';
    const cleaned = cin.replace(/[^a-zA-Z0-9]/g, '');
    return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  },

  birthDate: (date: string | undefined | null) => {
    if (!date) return '-';
    try {
      const parsedDate = new Date(date);
      return format(parsedDate, 'dd/MM/yyyy', { locale: fr });
    } catch {
      return date;
    }
  },

  amount: (amount: string | number | undefined | null) => {
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
  },

  dateTime: (dateTime: string | undefined | null) => {
    if (!dateTime) return '-';
    try {
      const date = new Date(dateTime);
      return format(date, 'dd/MM/yyyy HH:mm', { locale: fr });
    } catch {
      return dateTime;
    }
  },

  ficheNumber: (number: string | undefined | null): string => {
    if (!number) return '-';
    
    if (number.toUpperCase().startsWith('F')) {
      return number.toUpperCase();
    }
    
    const cleanedNumber = number.replace(/[^0-9-]/g, '');
    if (cleanedNumber.includes('-')) {
      return `F${cleanedNumber}`.toUpperCase();
    }
    
    return '-';
  }
};

export const validateFormatters = {
  phoneNumber: (phone: string | undefined | null) => {
    if (!phone) return false;
    return /^\d{10}$/.test(phone.replace(/\D/g, ''));
  },

  cin: (cin: string | undefined | null) => {
    if (!cin) return false;
    return /^[A-Z][A-Z0-9]+$/.test(cin);
  },

  patientNumber: (number: string | undefined | null) => {
    if (!number) return false;
    return /^P\d{4}$/.test(number) || /^PA\d{4}$/.test(number) || /^PS\d{4}$/.test(number);
  }
};