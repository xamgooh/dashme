'use client'
import { Line } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip } from 'chart.js'
import { DailyMetric } from '@/lib/types'
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip)

export default function SparkLine({ data, color, height = 44 }: { data: DailyMetric[]; color: string; height?: number }) {
  return (
    <div style={{ position: 'relative', height }}>
      <Line
        data={{ labels: data.map(d => d.date), datasets: [{ data: data.map(d => d.clicks), borderColor: color, backgroundColor: color + '18', borderWidth: 1.5, pointRadius: 0, fill: true, tension: 0.4 }] }}
        options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { backgroundColor: '#1e293b', titleColor: '#f1f5f9', bodyColor: '#94a3b8', padding: 8, cornerRadius: 6, callbacks: { title: () => '', label: ctx => `${ctx.raw?.toLocaleString()} clicks` } } }, scales: { x: { display: false }, y: { display: false, min: Math.min(...data.map(d => d.clicks)) * 0.7 } }, interaction: { intersect: false, mode: 'index' } }}
      />
    </div>
  )
}
