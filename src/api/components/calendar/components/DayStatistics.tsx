import React from 'react';
import { Appointment } from '../types';
import { APPOINTMENT_TYPES } from '../types/appointmentTypes';

interface DayStatisticsProps {
  appointments: Appointment[];
}

export default function DayStatistics({ appointments }: DayStatisticsProps) {
  if (appointments.length === 0) return null;

  // Regrouper les rendez-vous par type
  const typeCount = appointments.reduce((acc, apt) => {
    const type = apt.type || 'DEFAULT';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const totalAppointments = appointments.length;

  return (
    <div className="p-2 bg-white rounded-lg shadow-sm border border-gray-100">
      {/* Total en haut */}
      <div className="text-center mb-2">
        <span className="text-xl font-semibold text-gray-900">
          {totalAppointments}
        </span>
      </div>

      {/* Barres statistiques */}
      <div className="space-y-1.5">
        {Object.entries(APPOINTMENT_TYPES).map(([type, config]) => {
          const count = typeCount[type] || 0;
          if (count === 0) return null;

          return (
            <div key={type} className="flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full ${config.barColor} rounded-full transition-all duration-300`}
                  style={{ width: `${(count / totalAppointments) * 100}%` }}
                />
              </div>
              <span className="text-xs font-medium text-gray-600 min-w-[1ch]">
                {count}
              </span>
            </div>
          );
        })}
      </div>

      {/* Total en bas */}
      <div className="text-center mt-2 pt-2 border-t border-gray-100">
        <span className="text-xs font-medium text-gray-600">
          Total: {totalAppointments}
        </span>
      </div>
    </div>
  );
}