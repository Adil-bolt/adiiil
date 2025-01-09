import React from 'react';
import { UserPlus, History, Gift, Percent, XCircle, Clock, CheckCircle } from 'lucide-react';

interface ConsultationStatsProps {
  stats: {
    total: number;
    nouveauxPatients: number;
    anciensPatients: number;
    gratuites: number;
    reductions: number;
    annulees: number;
    enAttente: number;
    validees: number;
  };
}

export default function ConsultationStats({ stats }: ConsultationStatsProps) {
  const statItems = [
    {
      icon: UserPlus,
      label: 'Nouveaux patients',
      value: stats.nouveauxPatients,
      color: 'text-green-600',
      group: 1
    },
    {
      icon: History,
      label: 'Anciens patients',
      value: stats.anciensPatients,
      color: 'text-blue-600',
      group: 1
    },
    {
      icon: Gift,
      label: 'Gratuités',
      value: stats.gratuites,
      color: 'text-orange-600',
      group: 2
    },
    {
      icon: CheckCircle,
      label: 'Validés',
      value: stats.validees,
      color: 'text-green-600',
      group: 2
    },
    {
      icon: Percent,
      label: 'Réductions',
      value: stats.reductions,
      color: 'text-blue-600',
      group: 2
    },
    {
      icon: XCircle,
      label: 'Rendez-vous annulés',
      value: stats.annulees,
      color: 'text-red-600',
      group: 2
    },
    {
      icon: Clock,
      label: 'Rendez-vous en attente',
      value: stats.enAttente,
      color: 'text-yellow-600',
      group: 2
    }
  ];

  const group1Total = stats.nouveauxPatients + stats.anciensPatients;
  const group2Total = stats.gratuites + stats.validees + stats.reductions + stats.annulees + stats.enAttente;

  // Vérifier si les totaux correspondent
  const hasGroup1Mismatch = group1Total !== stats.total;
  const hasGroup2Mismatch = group2Total !== stats.total;

  return (
    <div className="space-y-3">
      <div className="text-xl font-semibold text-gray-900 mb-2">
        Total: {stats.total}
      </div>
      {hasGroup1Mismatch && (
        <div className="text-sm text-red-600 mb-2">
          ⚠️ Le total du groupe 1 ({group1Total}) ne correspond pas au total général ({stats.total})
        </div>
      )}
      {hasGroup2Mismatch && (
        <div className="text-sm text-red-600 mb-2">
          ⚠️ Le total du groupe 2 ({group2Total}) ne correspond pas au total général ({stats.total})
        </div>
      )}
      <div className="space-y-2">
        {statItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <React.Fragment key={index}>
              {index > 0 && item.group !== statItems[index - 1].group && (
                <div className="my-3 border-t border-gray-200" />
              )}
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Icon className={`h-5 w-5 ${item.color} mr-2`} />
                  <span className="text-sm text-gray-600">{item.label}</span>
                </div>
                <span className="text-sm font-medium text-gray-900">{item.value}</span>
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}