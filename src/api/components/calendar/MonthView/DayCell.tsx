import React from 'react';
import { isSameDay, format } from 'date-fns';
import { Appointment } from '../types';
import DayStatistics from './DayStatistics';
import { useDayCellStyles } from './useDayCellStyles';

interface DayCellProps {
  day: Date;
  currentDate: Date;
  appointments: Appointment[];
  onDateClick: (date: Date) => void;
}

export default function DayCell({
  day,
  currentDate,
  appointments,
  onDateClick
}: DayCellProps) {
  const { containerClassName } = useDayCellStyles(day, currentDate);
  const dayAppointments = appointments.filter(
    (apt) => isSameDay(new Date(apt.time), day)
  );

  return (
    <div
      className={containerClassName}
      onClick={() => onDateClick(day)}
    >
      <div className="font-medium text-sm mb-2">
        {format(day, 'd')}
      </div>
      {dayAppointments.length > 0 && (
        <DayStatistics appointments={dayAppointments} />
      )}
    </div>
  );
}