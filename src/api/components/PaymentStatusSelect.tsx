import React from 'react';
import { usePayment } from '../contexts/PaymentContext';
import { PaymentData } from '../types/payment';
import { getStatusColor } from '../utils/paymentStatus';

interface PaymentStatusSelectProps {
  appointmentId: string;
  currentStatus: string;
  currentPaymentMethod: string;
  isEditing: boolean;
  onUpdate: (values: PaymentData) => void;
}

export default function PaymentStatusSelect({
  appointmentId,
  currentStatus,
  currentPaymentMethod,
  isEditing,
  onUpdate
}: PaymentStatusSelectProps) {
  const { updatePaymentStatus } = usePayment();

  if (!isEditing) {
    return (
      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
        getStatusColor(currentStatus)
      }`}>
        {currentStatus}
      </span>
    );
  }

  return (
    <div className="flex items-center space-x-2">
      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
        getStatusColor(currentStatus)
      }`}>
        {currentStatus}
      </span>
    </div>
  );
}