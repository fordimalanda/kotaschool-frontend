'use client';

import React from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  type ChartData,
  type ChartOptions,
} from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import { PieChart, BarChart2 } from 'lucide-react';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
);

export function SectionDistributionChart({
  labels,
  values,
}: {
  labels: string[];
  values: number[];
}) {
  const chartData: ChartData<'doughnut'> = {
    labels: labels.length > 0 ? labels : ['Aucune donnée'],
    datasets: [
      {
        data: values.length > 0 ? values : [1],
        backgroundColor: [
          'rgba(79, 70, 229, 0.85)',
          'rgba(14, 165, 233, 0.85)',
          'rgba(16, 185, 129, 0.85)',
          'rgba(245, 158, 11, 0.85)',
          'rgba(139, 92, 246, 0.85)',
          'rgba(244, 63, 94, 0.85)',
        ],
        borderColor: '#ffffff',
        borderWidth: 2,
        hoverOffset: 6,
      },
    ],
  };

  const options: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '72%',
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          usePointStyle: true,
          pointStyle: 'circle',
          padding: 14,
          font: { size: 11, family: 'var(--font-sans), sans-serif' },
          color: '#475569',
        },
      },
      tooltip: {
        backgroundColor: '#0f172a',
        padding: 10,
        cornerRadius: 8,
        titleFont: { size: 12, family: 'var(--font-sans)' },
        bodyFont: { size: 12, family: 'var(--font-sans)' },
      },
    },
  };

  const total = values.reduce((a, b) => a + b, 0);

  return (
    <div className="flex h-full flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-soft-sm">
      <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-50 text-sky-600 border border-sky-200/60">
          <PieChart className="h-4 w-4" />
        </div>
        <div>
          <h4 className="text-sm font-semibold text-slate-900">
            Répartition des Éléments
          </h4>
          <p className="text-xs text-slate-500">Distribution relative</p>
        </div>
      </div>

      <div className="relative my-3 flex h-56 items-center justify-center">
        <Doughnut data={chartData} options={options} />
        <div className="pointer-events-none absolute flex flex-col items-center justify-center text-center">
          <span className="text-2xl font-bold tracking-tight text-slate-900">
            {total}
          </span>
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
            Total
          </span>
        </div>
      </div>
    </div>
  );
}

export function ActivityBarChart({
  labels,
  values,
  title = 'Activité des Affectations & Notes',
}: {
  labels: string[];
  values: number[];
  title?: string;
}) {
  const chartData: ChartData<'bar'> = {
    labels,
    datasets: [
      {
        label: 'Volume',
        data: values,
        backgroundColor: 'rgba(79, 70, 229, 0.85)',
        borderRadius: 8,
        borderSkipped: false,
        hoverBackgroundColor: 'rgba(67, 56, 202, 1)',
      },
    ],
  };

  const options: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#0f172a',
        padding: 10,
        cornerRadius: 8,
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          font: { size: 11 },
          color: '#64748b',
        },
      },
      y: {
        grid: { color: 'rgba(226, 232, 240, 0.6)' },
        ticks: {
          stepSize: 1,
          font: { size: 11 },
          color: '#64748b',
        },
      },
    },
  };

  return (
    <div className="flex h-full flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-soft-sm">
      <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-200/60">
          <BarChart2 className="h-4 w-4" />
        </div>
        <div>
          <h4 className="text-sm font-semibold text-slate-900">{title}</h4>
          <p className="text-xs text-slate-500">Aperçu quantitatif</p>
        </div>
      </div>

      <div className="my-3 h-56 w-full">
        <Bar data={chartData} options={options} />
      </div>
    </div>
  );
}
