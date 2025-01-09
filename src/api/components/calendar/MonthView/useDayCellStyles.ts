import { isSameMonth, isSameDay, getDay } from 'date-fns';

export function useDayCellStyles(day: Date, currentDate: Date) {
  const baseClasses = "min-h-[120px] p-2 border cursor-pointer hover:bg-gray-50 transition-colors";
  
  // Vérifier si c'est un dimanche (0 = dimanche, 1 = lundi, etc.)
  const isSunday = getDay(day) === 0;
  
  const monthClasses = isSameMonth(day, currentDate)
    ? isSunday ? 'bg-gray-100' : 'bg-white'
    : isSunday ? 'bg-gray-200' : 'bg-gray-50';
    
  const todayClasses = isSameDay(day, new Date())
    ? 'border-indigo-500 bg-indigo-50'
    : 'border-gray-200';

  const sundayClasses = isSunday ? 'text-gray-500' : '';

  const containerClassName = `${baseClasses} ${monthClasses} ${todayClasses} ${sundayClasses}`;

  return { containerClassName };
}