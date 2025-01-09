import { startOfMonth, endOfMonth, startOfWeek, eachDayOfInterval } from 'date-fns';
import { fr } from 'date-fns/locale';

export function useMonthViewLogic(currentDate: Date) {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { locale: fr });
  const days = eachDayOfInterval({ start: startDate, end: monthEnd });

  return { days };
}