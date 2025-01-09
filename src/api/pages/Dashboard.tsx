import React, { useState, useMemo } from 'react';
import { CreditCard, Clock, Users, Calendar } from 'lucide-react';
import StatCard from '../components/dashboard/StatCard';
import ConsultationStats from '../components/dashboard/ConsultationStats';
import ConsultationTimeStats from '../components/dashboard/ConsultationTimeStats';
import ConsultationTable from '../components/dashboard/ConsultationTable';
import MiniCalendar from '../components/calendar/MiniCalendar';
import { useAuth } from '../contexts/AuthContext';
import { useAppointments } from '../contexts/AppointmentContext';
import { format, isSameDay, isSameMonth, parseISO, startOfDay, isAfter, endOfDay, isWithinInterval, subDays, subWeeks } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function Dashboard() {
  const { user } = useAuth();
  const { appointments } = useAppointments();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [dateRange, setDateRange] = useState({ 
    start: startOfDay(new Date()), 
    end: endOfDay(new Date()) 
  });

  // Filtrer les rendez-vous pour la plage de dates sélectionnée
  const filteredAppointments = useMemo(() => {
    return appointments
      .filter(apt => {
        const aptDate = parseISO(apt.time);
        return isWithinInterval(aptDate, {
          start: startOfDay(dateRange.start),
          end: endOfDay(dateRange.end)
        }) && !apt.isLunchBreak; // Exclure les pauses déjeuner
      })
      .map(apt => ({
        ...apt,
        status: apt.status || '–'
      }))
      .sort((a, b) => parseISO(a.time).getTime() - parseISO(b.time).getTime());
  }, [appointments, dateRange]);

  // Fonction utilitaire pour extraire le montant
  const extractMontant = (amount: string | undefined): number => {
    if (!amount) return 0;
    // Ne pas convertir "-Dhs" en nombre
    if (amount === '-' || amount === '- Dhs' || amount === '-Dhs') return -1;
    return parseFloat(amount.replace(',', '.').replace(' Dhs', '')) || 0;
  };

  // Calculs des statistiques
  const stats = useMemo(() => {
    // Total des consultations (sans les pauses déjeuner)
    const totalConsultations = filteredAppointments.filter(p => 
      !p.isLunchBreak
    ).length;

    // Nouveaux patients (Groupe 1)
    const nouveauxPatients = filteredAppointments.filter(p => 
      p.isNewPatient && !p.isLunchBreak
    ).length;
    
    // Anciens patients (Groupe 1)
    const anciensPatients = totalConsultations - nouveauxPatients;

    // Catégoriser les rendez-vous (Groupe 2)
    const appointments = filteredAppointments.filter(p => !p.isLunchBreak);
    let consultationsGratuites = 0;
    let consultationsValidees = 0;
    let consultationsReduction = 0;
    let consultationsEnAttente = 0;
    let consultationsAnnulees = 0;

    appointments.forEach(appointment => {
      let isCounted = false;
      
      // D'abord les validés avec montant
      if (appointment.status === 'Validé' && appointment.confirmation !== 'En attente') {
        const montant = extractMontant(appointment.amount);
        if (montant === 0) {
          consultationsGratuites++;
          isCounted = true;
        } else if (montant > 0 && montant < 400) {
          consultationsReduction++;
          isCounted = true;
        } else if (montant >= 400 || appointment.amount === '-' || appointment.amount === '- Dhs' || appointment.amount === '-Dhs') {
          consultationsValidees++;
          isCounted = true;
        }
      }
      // Ensuite les annulés
      else if (['Annulé', 'Absent', 'Reporté'].includes(appointment.status || '')) {
        consultationsAnnulees++;
        isCounted = true;
      }
      
      // Si le rendez-vous n'a pas été compté ailleurs, le compter comme en attente
      if (!isCounted) {
        consultationsEnAttente++;
      }
    });

    // Vérification des totaux
    const totalGroupe2 = consultationsGratuites + consultationsValidees + 
      consultationsReduction + consultationsAnnulees + consultationsEnAttente;

    // Calcul du revenu du jour
    const revenueJour = filteredAppointments
      .filter(p => !p.isLunchBreak && p.status === 'Validé' && p.amount && p.amount !== '-' && p.amount !== '- Dhs' && p.amount !== '-Dhs')
      .reduce((sum, p) => {
        const montant = extractMontant(p.amount);
        return sum + (montant > 0 ? montant : 0);
      }, 0);

    // Calcul du revenu d'hier
    const hier = subDays(selectedDate, 1);
    const revenueHier = appointments
      .filter(p => {
        const aptDate = parseISO(p.time);
        return isSameDay(aptDate, hier) && !p.isLunchBreak && p.status === 'Validé' && p.amount && p.amount !== '-' && p.amount !== '- Dhs' && p.amount !== '-Dhs';
      })
      .reduce((sum, p) => {
        const montant = extractMontant(p.amount);
        return sum + (montant > 0 ? montant : 0);
      }, 0);

    // Calcul du revenu d'hier
    const variation = revenueHier === 0 ? 100 : ((revenueJour - revenueHier) / revenueHier) * 100;

    // Calcul des statistiques de temps de consultation
    const durations = filteredAppointments.map(p => parseInt(p.duration || '30'));
    const averageTime = durations.length > 0 
      ? Math.round(durations.reduce((sum, d) => sum + d, 0) / durations.length)
      : 30;
    const shortestTime = durations.length > 0 
      ? Math.min(...durations)
      : 30;
    const longestTime = durations.length > 0 
      ? Math.max(...durations)
      : 30;

    // Calcul de la variation hebdomadaire du temps moyen
    const lastWeek = subWeeks(selectedDate, 1);
    const lastWeekAppointments = appointments.filter(p => {
      const aptDate = parseISO(p.time);
      return isWithinInterval(aptDate, {
        start: startOfDay(lastWeek),
        end: endOfDay(lastWeek)
      }) && !p.isCanceled && !p.isLunchBreak; // Exclure les pauses déjeuner
    });
    const lastWeekDurations = lastWeekAppointments.map(p => parseInt(p.duration || '30'));
    const lastWeekAverage = lastWeekDurations.length > 0
      ? lastWeekDurations.reduce((sum, d) => sum + d, 0) / lastWeekDurations.length
      : averageTime;
    const weeklyChange = lastWeekAverage === 0 
      ? 0 
      : Math.round(((averageTime - lastWeekAverage) / lastWeekAverage) * 100);

    return {
      consultations: {
        total: totalConsultations,
        nouveauxPatients,
        anciensPatients,
        gratuites: consultationsGratuites,
        validees: consultationsValidees,
        reductions: consultationsReduction,
        annulees: consultationsAnnulees,
        enAttente: consultationsEnAttente
      },
      revenue: {
        total: revenueJour.toFixed(2).replace('.', ','),
        variation
      },
      temps: {
        averageTime,
        shortestTime,
        longestTime,
        weeklyChange
      }
    };
  }, [filteredAppointments, appointments, selectedDate]);

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setDateRange({ 
      start: startOfDay(date), 
      end: endOfDay(date) 
    });
  };

  const handleRangeSelect = (range: { start: Date; end: Date } | null) => {
    if (range) {
      setDateRange({ 
        start: startOfDay(range.start), 
        end: endOfDay(range.end) 
      });
      setSelectedDate(range.start);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-4">
          <h2 className="text-2xl font-bold text-gray-900">Tableau de bord</h2>
          <span className="text-xl text-gray-600">
            {(isSameDay(dateRange.start, dateRange.end) 
              ? format(dateRange.start, 'd MMM yyyy', { locale: fr })
              : isSameMonth(dateRange.start, dateRange.end)
                ? `${format(dateRange.start, 'd')} – ${format(dateRange.end, 'd MMM yyyy', { locale: fr })}`
                : `${format(dateRange.start, 'd MMM', { locale: fr })} – ${format(dateRange.end, 'd MMM yyyy', { locale: fr })}`
            ).toLowerCase()}
          </span>
        </div>
      </div>

      {/* Grille responsive pour les 3 cartes principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 min-h-[300px]">
        {/* 1. Facturation */}
        <div className="w-full h-full">
          <StatCard
            icon={<CreditCard className="h-6 w-6 text-white" />}
            iconBgColor="bg-green-500"
            title="Facturation"
            mainValue={`${stats.revenue.total} Dhs`}
            subValue={`Dernier paiement: ${stats.revenue.total} Dhs`}
            trend={{
              value: `${Math.abs(stats.revenue.variation).toFixed(1)}%`,
              label: "vs. hier",
              isPositive: stats.revenue.variation >= 0
            }}
          />
        </div>

        {/* 2. Statistiques de Consultation */}
        <div className="w-full h-full">
          <StatCard
            icon={<Users className="h-6 w-6 text-white" />}
            iconBgColor="bg-purple-500"
            title="Statistiques de Consultation"
          >
            <ConsultationStats
              stats={{
                total: stats.consultations.total,
                nouveauxPatients: stats.consultations.nouveauxPatients,
                anciensPatients: stats.consultations.anciensPatients,
                gratuites: stats.consultations.gratuites,
                validees: stats.consultations.validees,
                reductions: stats.consultations.reductions,
                annulees: stats.consultations.annulees,
                enAttente: stats.consultations.enAttente
              }}
            />
          </StatCard>
        </div>

        {/* 3. Temps de consultation */}
        <div className="w-full h-full">
          <ConsultationTimeStats stats={stats.temps} />
        </div>
      </div>

      <div className="flex space-x-4">
        <div className="w-64 flex-shrink-0">
          <MiniCalendar
            currentDate={selectedDate}
            selectedDate={selectedDate}
            selectionRange={dateRange}
            onDateSelect={handleDateSelect}
            onRangeSelect={handleRangeSelect}
            appointments={appointments}
          />
        </div>
        
        <div className="flex-1">
          <ConsultationTable 
            visits={filteredAppointments}
            selectedDate={selectedDate}
            dateRange={dateRange}
            onDateSelect={handleDateSelect}
            onRangeSelect={handleRangeSelect}
          />
        </div>
      </div>
    </div>
  );
}