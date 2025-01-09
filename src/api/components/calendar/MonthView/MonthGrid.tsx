import React from 'react';
import { isSameMonth, isSameDay, format } from 'date-fns';
import { Appointment } from '../types';
import DayCell from './DayCell';

interface MonthGridProps {
  days: Date[];
  currentDate: Date;
  appointments: Appointment[];
  onDateClick: (date: Date) => void;
}

export default function MonthGrid({
  days,
  currentDate,
  appointments,
  onDateClick
}: MonthGridProps) {
  return (
    <>
      {days.map((day, idx) => (
        <DayCell
          key={idx}
          day={day}
          currentDate={currentDate}
          appointments={appointments}
          onDateClick={onDateClick}
        />
      ))}
    </>
  );
}