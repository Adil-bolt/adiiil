import React, { useMemo } from 'react';
import { Appointment } from '../types';
import { APPOINTMENT_TYPES } from '../../../constants/appointmentTypes';

interface DayStatisticsProps {
  appointments: Appointment[];
}

export default function DayStatistics({ appointments }: DayStatisticsProps) {
  const stats = useMemo(() => {
    // Compter les rendez-vous par type
    const typeCounts = appointments.reduce((acc, apt) => {
      let type = 'SUIVI';
      
      if (apt.type === 'NOUVELLE CONSULTATION' || apt.isNewPatient) {
        type = 'NOUVELLE CONSULTATION';
      } else if (apt.isDelegue) {
        type = 'DELEGUE';
      } else if (apt.isGratuite) {
        type = 'GRATUIT';
      }
      
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total: appointments.length,
      typeCounts
    };
  }, [appointments]);

  if (stats.total === 0) return null;

  return (
    <div className="p-2 bg-white rounded-lg shadow-sm border border-gray-100">
      {/* Total en haut */}
      <div className="text-center mb-2">
        <span className="text-xl font-semibold text-gray-900">
          {stats.total}
        </span>
      </div>

      {/* Barres de progression */}
      <div className="space-y-1.5">
        {Object.entries(APPOINTMENT_TYPES).map(([type, config]) => {
          const count = stats.typeCounts[type] || 0;
          if (count === 0) return null;

          return (
            <div key={type} className="flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full ${config.color} rounded-full transition-all duration-300`}
                  style={{ width: `${(count / stats.total) * 100}%` }}
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
          Total: {stats.total}
        </span>
      </div>
    </div>
  );
}