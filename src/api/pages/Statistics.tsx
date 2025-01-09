import React, { useState } from 'react';
import { useStatistics } from '../hooks/useStatistics';
import TrendStatisticsCard from '../components/statistics/TrendStatisticsCard';
import DateRangePicker from '../components/statistics/DateRangePicker';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface DateRange {
  startDate: string;
  endDate: string;
  year: string;
}

export default function Statistics() {
  const [selectedStats, setSelectedStats] = useState({
    cityStats: true,
    ageStats: true,
    genderStats: true,
    paymentStats: true,
    appointmentStats: true,
    sourceStats: true,
    peakHoursStats: true,
    durationStats: true,
    mutuelleStats: true,
    paymentTypeStats: true,
    averageAmountStats: true
  });

  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: '01/01',
    endDate: format(new Date(), 'dd/MM'),
    year: new Date().getFullYear().toString()
  });

  const stats = useStatistics(dateRange);

  const toggleAllStats = () => {
    const newValue = !Object.values(selectedStats).every(v => v);
    setSelectedStats(Object.keys(selectedStats).reduce((acc, key) => ({
      ...acc,
      [key]: newValue
    }), {}));
  };

  const toggleStat = (key: keyof typeof selectedStats) => {
    setSelectedStats(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const getSelectedStatsCount = () => {
    return Object.values(selectedStats).filter(Boolean).length;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-2xl">Statistiques</h1>
          <p className="text-sm text-gray-500">
            {getSelectedStatsCount()} statistiques sélectionnées
          </p>
        </div>
      </div>

      <div className="flex flex-col space-y-4">
        <div className="flex justify-between items-center">
          <DateRangePicker
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
          />
        </div>

        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={Object.values(selectedStats).every(v => v)}
              onChange={toggleAllStats}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Tout désélectionner</span>
          </label>

          {Object.entries(selectedStats).map(([key, value]) => (
            <label key={key} className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={value}
                onChange={() => toggleStat(key as keyof typeof selectedStats)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">
                {key === 'cityStats' && 'Par ville'}
                {key === 'ageStats' && 'Par âge'}
                {key === 'genderStats' && 'Par genre'}
                {key === 'paymentStats' && 'Paiements par période'}
                {key === 'appointmentStats' && 'Rendez-vous confirmés/annulés'}
                {key === 'sourceStats' && 'Source des rendez-vous'}
                {key === 'peakHoursStats' && 'Heures de pointe'}
                {key === 'durationStats' && 'Durée des consultations'}
                {key === 'mutuelleStats' && 'Par mutuelle'}
                {key === 'paymentTypeStats' && 'Par type de paiement'}
                {key === 'averageAmountStats' && 'Montant moyen'}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {selectedStats.cityStats && stats.cityStats && (
          <TrendStatisticsCard
            title="Répartition par ville"
            data={stats.cityStats}
            type="pie"
            comparison={{
              current: Object.values(stats.cityStats).reduce((a, b) => a + b, 0),
              previous: 0,
              label: "Total patients"
            }}
          />
        )}

        {selectedStats.ageStats && stats.ageStats && (
          <TrendStatisticsCard
            title="Répartition par âge"
            data={stats.ageStats}
            type="bar"
            comparison={{
              current: Object.values(stats.ageStats).reduce((a, b) => a + b, 0),
              previous: 0,
              label: "Total patients"
            }}
          />
        )}

        {selectedStats.genderStats && stats.genderStats && (
          <TrendStatisticsCard
            title="Répartition par genre"
            data={stats.genderStats}
            type="pie"
            comparison={{
              current: Object.values(stats.genderStats).reduce((a, b) => a + b, 0),
              previous: 0,
              label: "Total patients"
            }}
          />
        )}

        {selectedStats.paymentStats && stats.paymentStats && (
          <TrendStatisticsCard
            title="Paiements par période"
            data={Object.entries(stats.paymentStats).reduce((acc, [month, data]) => ({
              ...acc,
              [month]: data.total
            }), {})}
            type="line"
            comparison={{
              current: Object.values(stats.paymentStats).reduce((a, b) => a + b.total, 0),
              previous: 0,
              label: "Total revenus"
            }}
          />
        )}

        {selectedStats.appointmentStats && stats.appointmentStatusStats && (
          <TrendStatisticsCard
            title="État des rendez-vous"
            data={stats.appointmentStatusStats}
            type="pie"
            comparison={{
              current: Object.values(stats.appointmentStatusStats).reduce((a, b) => a + b, 0),
              previous: 0,
              label: "Total rendez-vous"
            }}
          />
        )}

        {selectedStats.sourceStats && stats.appointmentSourceStats && (
          <TrendStatisticsCard
            title="Source des rendez-vous"
            data={stats.appointmentSourceStats}
            type="bar"
            comparison={{
              current: Object.values(stats.appointmentSourceStats).reduce((a, b) => a + b, 0),
              previous: 0,
              label: "Total rendez-vous"
            }}
          />
        )}

        {selectedStats.peakHoursStats && stats.peakHoursStats && (
          <TrendStatisticsCard
            title="Heures de pointe"
            data={stats.peakHoursStats}
            type="line"
            comparison={{
              current: Object.values(stats.peakHoursStats).reduce((a, b) => a + b, 0),
              previous: 0,
              label: "Total rendez-vous"
            }}
          />
        )}

        {selectedStats.durationStats && stats.consultationDurationStats && (
          <TrendStatisticsCard
            title="Durée des consultations"
            data={stats.consultationDurationStats.distribution}
            type="bar"
            comparison={{
              current: stats.consultationDurationStats.average,
              previous: 0,
              label: "Durée moyenne (min)"
            }}
          />
        )}

        {selectedStats.mutuelleStats && stats.mutuelleStats && (
          <TrendStatisticsCard
            title="Répartition par mutuelle"
            data={stats.mutuelleStats}
            type="pie"
            comparison={{
              current: Object.values(stats.mutuelleStats).reduce((a, b) => a + b, 0),
              previous: 0,
              label: "Total patients"
            }}
          />
        )}

        {selectedStats.paymentTypeStats && stats.paymentTypeStats && (
          <TrendStatisticsCard
            title="Types de paiement"
            data={stats.paymentTypeStats}
            type="pie"
            comparison={{
              current: Object.values(stats.paymentTypeStats).reduce((a, b) => a + b, 0),
              previous: 0,
              label: "Total paiements"
            }}
          />
        )}

        {selectedStats.averageAmountStats && stats.averageAmountStats && (
          <TrendStatisticsCard
            title="Montant moyen par consultation"
            data={stats.averageAmountStats.byMonth}
            type="line"
            comparison={{
              current: stats.averageAmountStats.average,
              previous: 0,
              label: "Montant moyen (€)"
            }}
          />
        )}
      </div>
    </div>
  );
}
