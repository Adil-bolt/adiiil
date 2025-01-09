import { zonedTimeToUtc, utcToZonedTime, format } from 'date-fns-tz';
import { format as formatDate, parse } from 'date-fns';
import { fr } from 'date-fns/locale';

// Convert local time to UTC/GMT for storage
export function localToGMT(date: string, time: string): string {
  const localDateTime = `${date}T${time}`;
  const utcDate = zonedTimeToUtc(localDateTime, 'UTC');
  return utcDate.toISOString();
}

// Convert UTC/GMT to local time for display
export function gmtToLocal(gmtDate: string, timezone: string = 'UTC'): {
  date: string;
  time: string;
} {
  const date = new Date(gmtDate);
  const localDate = utcToZonedTime(date, timezone);
  
  return {
    date: formatDate(localDate, 'yyyy-MM-dd'),
    time: formatDate(localDate, 'HH:mm')
  };
}

// Format date for display
export function formatDisplayDate(date: string, formatStr: string = 'dd MMMM yyyy'): string {
  return format(new Date(date), formatStr, { locale: fr });
}

// Format time for display
export function formatDisplayTime(time: string, formatStr: string = 'HH:mm'): string {
  return format(parse(time, 'HH:mm', new Date()), formatStr, { locale: fr });
}

// Get timezone offset in minutes
export function getTimezoneOffset(timezone: string = 'UTC'): number {
  const now = new Date();
  const tzDate = utcToZonedTime(now, timezone);
  return (tzDate.getTimezoneOffset() * -1);
}