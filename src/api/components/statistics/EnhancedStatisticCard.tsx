import React, { useEffect, useRef, useState } from 'react';
import { Download, ChevronDown, BarChart2, PieChart, LineChart, ArrowUpDown } from 'lucide-react';
import Chart from 'chart.js/auto';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { StatisticType, ChartData, StatisticsDataType } from '../../types/statistics';

interface EnhancedStatisticCardProps {
  title: string;
  description?: string;
  data: StatisticsDataType;
  type: StatisticType;
  compareWithPrevious?: boolean;
}

const chartColors = [
  '#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
  '#EC4899', '#6366F1', '#14B8A6', '#F97316', '#84CC16',
  '#06B6D4', '#6B7280'
];

const getChartType = (type: string): 'bar' | 'line' | 'pie' | 'doughnut' => {
  switch (type) {
    case 'peakHoursStats':
    case 'paymentStats':
    case 'averageAmountStats':
      return 'line';
    case 'genderStats':
    case 'appointmentStatusStats':
    case 'mutuelleStats':
    case 'paymentTypeStats':
      return 'doughnut';
    default:
      return 'bar';
  }
};

const formatValue = (value: number, type: string): string => {
  switch (type) {
    case 'paymentStats':
    case 'averageAmountStats':
      return `${value.toFixed(2)} €`;
    case 'consultationDurationStats':
      return `${value} min`;
    default:
      return value.toString();
  }
};

export default function EnhancedStatisticCard({
  title,
  description,
  data,
  type,
  compareWithPrevious = false
}: EnhancedStatisticCardProps) {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);
  const [showOptions, setShowOptions] = useState(false);
  const [chartType, setChartType] = useState(getChartType(type));
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const prepareChartData = () => {
    let chartData = { ...data };
    
    if (type === 'averageAmountStats') {
      chartData = data.byMonth;
    } else if (type === 'consultationDurationStats') {
      chartData = data.distribution;
    }

    // Trier les données
    const sortedEntries = Object.entries(chartData)
      .sort(([, a], [, b]) => 
        sortOrder === 'desc' ? (Number(b) - Number(a)) : (Number(a) - Number(b))
      );

    return {
      labels: sortedEntries.map(([label]) => label),
      values: sortedEntries.map(([, value]) => value)
    };
  };

  const exportToCSV = () => {
    const { labels, values } = prepareChartData();
    const csvContent = [
      ['Catégorie', 'Valeur'],
      ...labels.map((label, index) => [
        label,
        formatValue(values[index], type)
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${title}_${format(new Date(), 'dd-MM-yyyy')}.csv`;
    link.click();
  };

  useEffect(() => {
    if (!chartRef.current || !data) return;

    const ctx = chartRef.current.getContext('2d');
    if (!ctx) return;

    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const { labels, values } = prepareChartData();

    chartInstance.current = new Chart(ctx, {
      type: chartType,
      data: {
        labels,
        datasets: [{
          label: title,
          data: values,
          backgroundColor: chartColors,
          borderColor: chartType === 'line' ? chartColors[0] : chartColors,
          borderWidth: 1,
          fill: chartType === 'line' ? false : true,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: ['doughnut', 'pie'].includes(chartType),
            position: 'bottom'
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const value = context.raw as number;
                return ` ${formatValue(value, type)}`;
              }
            }
          }
        },
        scales: {
          y: {
            display: !['doughnut', 'pie'].includes(chartType),
            beginAtZero: true,
            ticks: {
              callback: (value) => formatValue(Number(value), type)
            }
          }
        }
      }
    });
  }, [data, chartType, sortOrder]);

  return (
    <div className="bg-white rounded-lg shadow p-4 h-[400px]">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <p className="text-sm text-gray-500">{description}</p>
        </div>
        
        <div className="relative">
          <button
            onClick={() => setShowOptions(!showOptions)}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <ChevronDown className="h-5 w-5 text-gray-500" />
          </button>

          {showOptions && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
              <div className="py-1">
                <button
                  onClick={() => setChartType('bar')}
                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full"
                >
                  <BarChart2 className="h-4 w-4 mr-2" />
                  Graphique en barres
                </button>
                <button
                  onClick={() => setChartType('line')}
                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full"
                >
                  <LineChart className="h-4 w-4 mr-2" />
                  Graphique en ligne
                </button>
                <button
                  onClick={() => setChartType('doughnut')}
                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full"
                >
                  <PieChart className="h-4 w-4 mr-2" />
                  Graphique circulaire
                </button>
                <button
                  onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full"
                >
                  <ArrowUpDown className="h-4 w-4 mr-2" />
                  {sortOrder === 'asc' ? 'Tri décroissant' : 'Tri croissant'}
                </button>
                <button
                  onClick={exportToCSV}
                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Exporter en CSV
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="h-[300px]">
        <canvas ref={chartRef} />
      </div>
    </div>
  );
}
