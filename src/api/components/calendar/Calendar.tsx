import React, { useState, useMemo } from 'react';
import { format, differenceInDays, addMinutes } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Filter, Globe } from 'lucide-react';
import DayView from './DayView';
import MonthView from './MonthView';
import CustomRangeView from './CustomRangeView';
import { useAppointments } from '../../contexts/AppointmentContext';
import { useAppointmentColors } from '../../hooks/useAppointmentColors';
import { Appointment } from './types';
import './styles.css';

interface CalendarProps {
  view: 'day' | 'week' | 'month' | 'custom';
  onViewChange: (view: 'day' | 'week' | 'month' | 'custom') => void;
  onAppointmentAdd?: (appointment: { date: Date; time: string }) => void;
  onAppointmentUpdate?: (appointment: Appointment) => void;
  onAppointmentDelete?: (appointmentId: string) => void;
  dateRange: { start: Date; end: Date } | null;
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  onDateRangeChange: (startDate: string, endDate: string) => void;
}

const TIMEZONES = [
  { value: 'GMT', label: 'GMT+0' },
  { value: 'GMT+1', label: 'GMT+1' },
  { value: 'GMT+2', label: 'GMT+2' },
  { value: 'GMT+3', label: 'GMT+3' },
  { value: 'GMT+4', label: 'GMT+4' }
];

export default function Calendar({ 
  view, 
  onViewChange,
  onAppointmentAdd,
  onAppointmentUpdate,
  onAppointmentDelete,
  dateRange,
  selectedDate,
  onDateSelect,
  onDateRangeChange
}: CalendarProps) {
  const { appointments, patients } = useAppointments();
  const { typeColors } = useAppointmentColors();
  const [selectedTimezone, setSelectedTimezone] = useState('GMT');
  const [selectedAppointmentId, setSelectedAppointmentId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const getAppointmentTitle = (appointment: any) => {
    if (appointment.type === 'PAUSE_DEJEUNER' || appointment.isLunchBreak) {
      return 'Pause déjeuner';
    }
    if (appointment.type === 'CONSULTATION_CLINIQUE' || appointment.isClinicalConsultation) {
      return `Consultation Clinique${appointment.clinicName ? ` - ${appointment.clinicName}` : ''}`;
    }
    if (appointment.patientId) {
      return appointment.patient;
    }
    if (appointment.nom && appointment.prenom) {
      return `${appointment.nom} ${appointment.prenom}`;
    }
    return appointment.patient || appointment.title || 'PAUSE_DEJEUNER';
  };

  const getEventColor = (appointment: any) => {
    if (appointment.type === 'PAUSE_DEJEUNER' || appointment.isLunchBreak) {
      return '#6B7280'; // gray-500
    }
    if (appointment.type === 'CONSULTATION_CLINIQUE' || appointment.isClinicalConsultation) {
      return '#8B5CF6'; // violet-500
    }
    if (appointment.isCanceled) {
      return '#EF4444'; // red-500
    }
    if (appointment.isNewPatient) {
      return '#10B981'; // emerald-500
    }
    if (appointment.isDelegue) {
      return '#F59E0B'; // amber-500
    }
    if (appointment.isGratuite) {
      return '#6B7280'; // gray-500
    }
    return '#3B82F6'; // blue-500
  };

  // Filtrer les rendez-vous pour le calendrier
  const filteredData = useMemo(() => {
    // Ne pas afficher les rendez-vous des patients supprimés
    return appointments.filter(appointment => {
      if (!appointment.patientId) return true;
      const patient = patients.find(p => p.id === appointment.patientId);
      return !patient?.deletedFrom || patient.deletedFrom !== 'patients';
    });
  }, [appointments, patients]);

  const events = filteredData.map(apt => ({
    id: apt.id,
    title: getAppointmentTitle(apt),
    start: new Date(apt.time),
    end: addMinutes(new Date(apt.time), parseInt(apt.duration || '30')),
    extendedProps: {
      ...apt,
      patient: getAppointmentTitle(apt)
    },
    backgroundColor: getEventColor(apt),
    borderColor: getEventColor(apt),
    textColor: '#FFFFFF'
  }));

  const handleDeleteAppointment = async (appointmentId: string) => {
    try {
      const appointment = appointments.find(a => a.id === appointmentId);
      if (appointment && appointment.patientId) {
        // Supprimer le patient avec la source 'agenda'
        await deletePatient(appointment.patientId, 'agenda');
      }
      // Supprimer le rendez-vous
      await deleteAppointment(appointmentId);
      setShowDeleteModal(false);
      setSelectedAppointmentId(null);
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="border-b border-gray-200">
        <div className="p-4">
          <div className="flex flex-col space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                {dateRange && `${format(dateRange.start, 'd MMMM', { locale: fr })} - ${format(dateRange.end, 'd MMMM yyyy', { locale: fr })}`}
              </h2>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Globe className="h-5 w-5 text-gray-400" />
                  <select
                    value={selectedTimezone}
                    onChange={(e) => setSelectedTimezone(e.target.value)}
                    className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                  >
                    {TIMEZONES.map(tz => (
                      <option key={tz.value} value={tz.value}>
                        {tz.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 py-3 bg-gray-50 flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">Période :</span>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="date"
              value={dateRange?.start ? format(dateRange.start, 'yyyy-MM-dd') : ''}
              onChange={(e) => {
                const startDate = e.target.value;
                const endDate = dateRange?.end ? format(dateRange.end, 'yyyy-MM-dd') : startDate;
                onDateRangeChange(startDate, endDate);
              }}
              className="block w-full pl-3 pr-10 py-2 text-sm border border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 rounded-md shadow-sm"
            />
            <span className="text-sm text-gray-500">à</span>
            <input
              type="date"
              value={dateRange?.end ? format(dateRange.end, 'yyyy-MM-dd') : ''}
              onChange={(e) => {
                const endDate = e.target.value;
                const startDate = dateRange?.start ? format(dateRange.start, 'yyyy-MM-dd') : endDate;
                onDateRangeChange(startDate, endDate);
              }}
              className="block w-full pl-3 pr-10 py-2 text-sm border border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 rounded-md shadow-sm"
            />
          </div>
        </div>
      </div>

      <div className="p-4 overflow-x-auto">
        {(() => {
          if (!dateRange) return null;

          const daysDiff = differenceInDays(dateRange.end, dateRange.start) + 1;

          if (daysDiff === 1 || view === 'day') {
            return (
              <DayView
                date={selectedDate}
                appointments={filteredData}
                onTimeSlotClick={onAppointmentAdd}
                onAppointmentClick={onAppointmentUpdate}
                onAppointmentDelete={handleDeleteAppointment}
                timezone={selectedTimezone}
              />
            );
          }

          if (daysDiff >= 2 && daysDiff <= 7) {
            return (
              <CustomRangeView
                selectionRange={dateRange}
                appointments={filteredData}
                onTimeSlotClick={onAppointmentAdd}
                onAppointmentClick={onAppointmentUpdate}
                onAppointmentDelete={handleDeleteAppointment}
                timezone={selectedTimezone}
                days={Array.from({ length: daysDiff }, (_, i) => {
                  const date = new Date(dateRange.start);
                  date.setDate(date.getDate() + i);
                  return date;
                })}
              />
            );
          }

          return (
            <MonthView
              currentDate={selectedDate}
              appointments={filteredData}
              onDateClick={onDateSelect}
              onAppointmentClick={onAppointmentUpdate}
              onAppointmentDelete={handleDeleteAppointment}
              timezone={selectedTimezone}
            />
          );
        })()}
      </div>
    </div>
  );
}