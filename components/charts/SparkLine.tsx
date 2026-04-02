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

type Props = {
  data: DailyMetric[]
  color: string
  height?: number
}

export default function SparkLine({ data, color, height = 80 }: Props) {
  const chartData = {
    labels: data.map((d) => d.date),
    datasets: [
      {
        data: data.map((d) => d.clicks),
        borderColor: color,
        backgroundColor: color + '18',
        borderWidth: 1.5,
        pointRadius: 0,
        fill: true,
        tension: 0.4,
      },
    ],
  }

  return (
    <div style={{ position: 'relative', height }}>
      <Line
        data={chartData}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: '#1c1c26',
              titleColor: '#e8e8f4',
              bodyColor: '#7070a0',
              padding: 8,
              cornerRadius: 6,
              borderColor: 'rgba(255,255,255,0.1)',
              borderWidth: 1,
              callbacks: {
                title: () => '',
                label: (ctx) => `${ctx.raw?.toLocaleString()} clicks`,
              },
            },
          },
          scales: {
            x: { display: false },
            y: {
              display: false,
              min: Math.min(...data.map((d) => d.clicks)) * 0.7,
            },
          },
          interaction: { intersect: false, mode: 'index' },
        }}
      />
    </div>
  )
}
