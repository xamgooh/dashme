'use client'

import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
} from 'chart.js'
import { DailyMetric } from '@/lib/types'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip)

function fmtN(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000) return Math.round(n / 1_000) + 'K'
  return String(n)
}

type Props = {
  data: DailyMetric[]
}

export default function MainChart({ data }: Props) {
  const labels = data.map((d) =>
    new Date(d.date).toLocaleDateString('sv-SE', { month: 'short', day: 'numeric' })
  )

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Clicks',
        data: data.map((d) => d.clicks),
        borderColor: '#818cf8',
        backgroundColor: 'rgba(129,140,248,0.08)',
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 4,
        fill: true,
        tension: 0.4,
        yAxisID: 'y',
      },
      {
        label: 'Impressions ÷100',
        data: data.map((d) => Math.round(d.impressions / 100)),
        borderColor: '#34d399',
        backgroundColor: 'rgba(52,211,153,0.06)',
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 4,
        fill: true,
        tension: 0.4,
        yAxisID: 'y',
      },
    ],
  }

  return (
    <Line
      data={chartData}
      options={{
        responsive: true,
        maintainAspectRatio: false,
        interaction: { intersect: false, mode: 'index' },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#1c1c26',
            titleColor: '#e8e8f4',
            bodyColor: '#7070a0',
            padding: 12,
            cornerRadius: 8,
            borderColor: 'rgba(255,255,255,0.1)',
            borderWidth: 1,
          },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: '#50507a', font: { size: 11 }, maxTicksLimit: 8, autoSkip: true },
          },
          y: {
            grid: { color: 'rgba(255,255,255,0.04)' },
            ticks: { color: '#50507a', font: { size: 11 }, callback: (v) => fmtN(Number(v)) },
          },
        },
      }}
    />
  )
}
