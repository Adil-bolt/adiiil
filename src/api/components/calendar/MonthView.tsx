import React from 'react';
import { format, startOfMonth, endOfMonth, startOfWeek, eachDayOfInterval, isSameMonth, isSameDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Appointment } from './types';
import DayStatistics from './components/DayStatistics';

interface MonthViewProps {
  currentDate: Date;
  appointments: Appointment[];
  onDateClick: (date: Date) => void;
}

export default function MonthView({
  currentDate,
  appointments,
  onDateClick
}: MonthViewProps) {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { locale: fr });
  const days = eachDayOfInterval({ start: startDate, end: monthEnd });

  return (
    <div className="grid grid-cols-7 gap-1">
      {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((day) => (
        <div key={day} className="p-2 text-center font-semibold text-gray-600">
          {day}
        </div>
      ))}
      {days.map((day, idx) => {
        const dayAppointments = appointments.filter(
          (apt) => isSameDay(new Date(apt.time), day)
        );

        return (
          <div
            key={idx}
            className={`min-h-[120px] p-2 ${
              isSameMonth(day, currentDate)
                ? 'bg-white'
                : 'bg-gray-50'
            } ${
              isSameDay(day, new Date())
                ? 'border-indigo-500 bg-indigo-50'
                : 'border-gray-200'
            } border cursor-pointer hover:bg-gray-50 transition-colors`}
            onClick={() => onDateClick(day)}
          >
            <div className="font-medium text-sm mb-2">
              {format(day, 'd')}
            </div>
            <DayStatistics appointments={dayAppointments} />
          </div>
        );
      })}
    </div>
  );
}