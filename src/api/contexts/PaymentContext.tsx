import React, { createContext, useContext } from 'react';
import { useAppointments } from './AppointmentContext';
import { PaymentData } from '../types/payment';
import { getPaymentStatus, PAYMENT_STATUSES } from '../utils/paymentStatus';

interface PaymentContextType {
  updatePaymentStatus: (appointmentId: string, data: PaymentData) => void;
}

const PaymentContext = createContext<PaymentContextType | null>(null);

export function PaymentProvider({ children }: { children: React.ReactNode }) {
  const { updateAppointment } = useAppointments();

  const updatePaymentStatus = (appointmentId: string, data: PaymentData) => {
    // Nettoyer le montant
    let amount = data.amount.replace(' Dhs', '').trim();
    
    // Si le statut change vers "Annulé", réinitialiser le montant
    if (data.status === 'Annulé') {
      amount = '0,00';
    }

    // Si le montant est vide ou invalide
    if (amount === '-' || amount === '') {
      amount = '0,00';
    }

    // Calculer le montant numérique
    const numAmount = parseFloat(amount.replace(',', '.'));
    
    // Déterminer le statut
    let status = data.status;
    if (numAmount > 0) {
      status = 'Validé';
    }

    // Mettre à jour l'appointment
    updateAppointment(appointmentId, {
      amount,
      montant: amount,
      status,
      paymentMethod: amount === '0,00' ? '-' : data.paymentMethod,
      paid: status === PAYMENT_STATUSES.PAID || status.startsWith(PAYMENT_STATUSES.PAID)
    });
  };

  return (
    <PaymentContext.Provider value={{ updatePaymentStatus }}>
      {children}
    </PaymentContext.Provider>
  );
}

export const usePayment = () => {
  const context = useContext(PaymentContext);
  if (!context) {
    throw new Error('usePayment must be used within a PaymentProvider');
  }
  return context;
};