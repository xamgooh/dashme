import { db } from '@/lib/db'
export const dynamic = 'force-dynamic'

type B = { clicks: number; impressions: number; ctr: number; position: number; count: number }

export async function GET() {
  // Only include metrics from active sites on connected accounts
  const metrics = await db.siteMetric.findMany({
    where: {
      site: {
        active: true,
        account: { connected: true },
      },
    },
    orderBy: { date: 'asc' },
  })

  const byDate: Record<string, B> = {}
  for (const m of metrics) {
    const d = m.date.toISOString().split('T')[0]
    if (!byDate[d]) byDate[d] = { clicks: 0, impressions: 0, ctr: 0, position: 0, count: 0 }
    byDate[d].clicks += m.clicks
    byDate[d].impressions += m.impressions
    byDate[d].ctr += m.ctr
    byDate[d].position += m.position
    byDate[d].count++
  }

  const daily = Object.entries(byDate)
    .sort(([a],[b]) => a.localeCompare(b))
    .map(([date, v]: [string, B]) => ({
      date,
      clicks: v.clicks,
      impressions: v.impressions,
      ctr: Number((v.ctr / v.count).toFixed(1)),
      position: Number((v.position / v.count).toFixed(1)),
    }))

  const tc = daily.reduce((s,d) => s+d.clicks, 0)
  const ti = daily.reduce((s,d) => s+d.impressions, 0)
  const ac = daily.length ? daily.reduce((s,d) => s+d.ctr, 0)/daily.length : 0
  const ap = daily.length ? daily.reduce((s,d) => s+d.position, 0)/daily.length : 0
  const half = Math.floor(daily.length/2)
  const prev = daily.slice(0,half).reduce((s,d) => s+d.clicks, 0)
  const curr = daily.slice(half).reduce((s,d) => s+d.clicks, 0)

  return Response.json({
    totals: {
      clicks: tc,
      impressions: ti,
      ctr: Number(ac.toFixed(1)),
      position: Number(ap.toFixed(1)),
      trend: Number((prev > 0 ? ((curr-prev)/prev)*100 : 0).toFixed(1)),
    },
    daily,
  })
}
