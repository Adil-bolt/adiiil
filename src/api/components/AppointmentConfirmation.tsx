import React, { useState } from 'react';
import { useAppointmentConfirmation } from '../hooks/useAppointmentConfirmation';

interface AppointmentConfirmationProps {
  patientId: string;
  appointmentDate: string;
  appointmentTime: string;
  onConfirmed?: () => void;
  onCancelled?: () => void;
  className?: string;
}

export const AppointmentConfirmation: React.FC<AppointmentConfirmationProps> = ({
  patientId,
  appointmentDate,
  appointmentTime,
  onConfirmed,
  onCancelled,
  className = ''
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { confirmAppointment, cancelAppointment } = useAppointmentConfirmation();

  const handleConfirm = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await confirmAppointment(patientId, appointmentDate, appointmentTime, true);
      onConfirmed?.();
    } catch (err) {
      setError('Erreur lors de la confirmation du rendez-vous');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await cancelAppointment(patientId, appointmentDate, appointmentTime);
      onCancelled?.();
    } catch (err) {
      setError('Erreur lors de l\'annulation du rendez-vous');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {error && (
        <div className="text-red-500 text-sm mb-2">
          {error}
        </div>
      )}
      
      <div className="flex gap-2">
        <button
          onClick={handleConfirm}
          disabled={isLoading}
          className={`px-4 py-2 rounded-md text-white font-medium ${
            isLoading
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-green-600 hover:bg-green-700 focus:ring-2 focus:ring-green-500'
          }`}
        >
          {isLoading ? 'En cours...' : 'Confirmer'}
        </button>
        
        <button
          onClick={handleCancel}
          disabled={isLoading}
          className={`px-4 py-2 rounded-md text-white font-medium ${
            isLoading
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-red-600 hover:bg-red-700 focus:ring-2 focus:ring-red-500'
          }`}
        >
          {isLoading ? 'En cours...' : 'Annuler'}
        </button>
      </div>
    </div>
  );
};
