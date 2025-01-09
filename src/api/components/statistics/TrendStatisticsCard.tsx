import React, { useEffect, useRef } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import Chart from 'chart.js/auto';
import { format, subMonths, eachMonthOfInterval } from 'date-fns';
import { fr } from 'date-fns/locale';

interface TrendStatisticsCardProps {
  title: string;
  currentValue: number;
  previousValue: number;
  data: number[];
  labels: string[];
  unit?: string;
  description: string;
}

export default function TrendStatisticsCard({
  title,
  currentValue,
  previousValue,
  data,
  labels,
  unit = '',
  description
}: TrendStatisticsCardProps) {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);

  const percentageChange = ((currentValue - previousValue) / previousValue) * 100;
  const trend = percentageChange > 0 ? 'up' : percentageChange < 0 ? 'down' : 'neutral';

  const getTrendColor = () => {
    switch (trend) {
      case 'up':
        return 'text-green-500';
      case 'down':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-5 h-5" />;
      case 'down':
        return <TrendingDown className="w-5 h-5" />;
      default:
        return <Minus className="w-5 h-5" />;
    }
  };

  useEffect(() => {
    if (!chartRef.current) return;

    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const ctx = chartRef.current.getContext('2d');
    if (!ctx) return;

    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, 'rgba(79, 70, 229, 0.1)');
    gradient.addColorStop(1, 'rgba(79, 70, 229, 0)');

    chartInstance.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: title,
          data,
          borderColor: '#4F46E5',
          backgroundColor: gradient,
          tension: 0.4,
          fill: true
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              label: (context) => `${context.parsed.y}${unit}`
            }
          }
        },
        scales: {
          x: {
            grid: {
              display: false
            }
          },
          y: {
            beginAtZero: true,
            grid: {
              color: '#E5E7EB'
            },
            ticks: {
              callback: (value) => `${value}${unit}`
            }
          }
        }
      }
    });
  }, [data, labels]);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <p className="text-sm text-gray-500">{description}</p>
        </div>
        <div className={`flex items-center ${getTrendColor()}`}>
          {getTrendIcon()}
          <span className="ml-1 font-medium">
            {Math.abs(percentageChange).toFixed(1)}%
          </span>
        </div>
      </div>

      <div className="mt-4">
        <div className="text-3xl font-bold text-gray-900">
          {currentValue}{unit}
        </div>
        <div className="text-sm text-gray-500 mt-1">
          vs {previousValue}{unit} période précédente
        </div>
      </div>

      <div className="h-48 mt-4">
        <canvas ref={chartRef} />
      </div>
    </div>
  );
}
