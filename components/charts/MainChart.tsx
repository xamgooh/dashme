'use client'
import { Line } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip } from 'chart.js'
import { DailyMetric } from '@/lib/types'
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip)

function fmtN(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000) return Math.round(n / 1_000) + 'K'
  return String(n)
}

export default function MainChart({ data }: { data: DailyMetric[] }) {
  const labels = data.map(d => new Date(d.date).toLocaleDateString('sv-SE', { month: 'short', day: 'numeric' }))
  return (
    <Line
      data={{ labels, datasets: [
        { label: 'Clicks', data: data.map(d => d.clicks), borderColor: '#6366f1', backgroundColor: 'rgba(99,102,241,0.06)', borderWidth: 2, pointRadius: 0, pointHoverRadius: 4, fill: true, tension: 0.4, yAxisID: 'y' },
        { label: 'Impressions ÷100', data: data.map(d => Math.round(d.impressions / 100)), borderColor: '#10b981', backgroundColor: 'rgba(16,185,129,0.05)', borderWidth: 2, pointRadius: 0, pointHoverRadius: 4, fill: true, tension: 0.4, yAxisID: 'y' },
      ]}}
      options={{ responsive: true, maintainAspectRatio: false, interaction: { intersect: false, mode: 'index' }, plugins: { legend: { display: false }, tooltip: { backgroundColor: '#1e293b', titleColor: '#f1f5f9', bodyColor: '#94a3b8', padding: 12, cornerRadius: 8, borderColor: 'rgba(0,0,0,0.1)', borderWidth: 1 } }, scales: { x: { grid: { display: false }, ticks: { color: '#9ca3af', font: { size: 11 }, maxTicksLimit: 8, autoSkip: true } }, y: { grid: { color: 'rgba(0,0,0,0.05)' }, ticks: { color: '#9ca3af', font: { size: 11 }, callback: v => fmtN(Number(v)) } } } }}
    />
  )
}
