import React from 'react';
import { startOfMonth, endOfMonth, startOfWeek, eachDayOfInterval } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Appointment } from '../types';
import WeekHeader from './WeekHeader';
import MonthGrid from './MonthGrid';
import { useMonthViewLogic } from './useMonthViewLogic';

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
  const { days } = useMonthViewLogic(currentDate);

  return (
    <div className="grid grid-cols-7 gap-1">
      <WeekHeader />
      <MonthGrid 
        days={days}
        currentDate={currentDate}
        appointments={appointments}
        onDateClick={onDateClick}
      />
    </div>
  );
}