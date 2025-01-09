import React from 'react';
import { Users, MapPin, UserCircle, CreditCard, Calendar, Share2, Clock, Timer, Building2, Wallet, TrendingUp } from 'lucide-react';
import EnhancedStatisticCard from './EnhancedStatisticCard';
import { StatisticsData, StatisticType } from '../../types/statistics';

interface StatisticsGridProps {
  stats: StatisticsData;
}

const statisticsConfig = [
  {
    type: 'cityStats' as StatisticType,
    title: 'Répartition par ville',
    description: 'Distribution des patients par ville de résidence',
    icon: MapPin
  },
  {
    type: 'ageStats' as StatisticType,
    title: 'Répartition par âge',
    description: 'Distribution des patients par tranche d\'âge',
    icon: Users
  },
  {
    type: 'genderStats' as StatisticType,
    title: 'Répartition par genre',
    description: 'Distribution des patients par genre',
    icon: UserCircle
  },
  {
    type: 'paymentStats' as StatisticType,
    title: 'Paiements par période',
    description: 'Montant total des paiements par mois',
    icon: CreditCard
  },
  {
    type: 'appointmentStatusStats' as StatisticType,
    title: 'Statut des rendez-vous',
    description: 'Répartition des rendez-vous par statut',
    icon: Calendar
  },
  {
    type: 'appointmentSourceStats' as StatisticType,
    title: 'Source des rendez-vous',
    description: 'Origine des prises de rendez-vous',
    icon: Share2
  },
  {
    type: 'peakHoursStats' as StatisticType,
    title: 'Heures de pointe',
    description: 'Distribution des rendez-vous par heure',
    icon: Clock
  },
  {
    type: 'consultationDurationStats' as StatisticType,
    title: 'Durée des consultations',
    description: 'Répartition des durées de consultation',
    icon: Timer
  },
  {
    type: 'mutuelleStats' as StatisticType,
    title: 'Répartition par mutuelle',
    description: 'Distribution des patients par mutuelle',
    icon: Building2
  },
  {
    type: 'paymentTypeStats' as StatisticType,
    title: 'Types de paiement',
    description: 'Répartition des méthodes de paiement',
    icon: Wallet
  },
  {
    type: 'averageAmountStats' as StatisticType,
    title: 'Montant moyen',
    description: 'Évolution du montant moyen des consultations',
    icon: TrendingUp
  }
] as const;

export default function StatisticsGrid({ stats }: StatisticsGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
      {statisticsConfig.map((config) => (
        <EnhancedStatisticCard
          key={config.type}
          title={config.title}
          description={config.description}
          type={config.type}
          data={stats[config.type]}
          compareWithPrevious={true}
        />
      ))}
    </div>
  );
}
