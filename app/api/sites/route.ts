import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

interface RawMetric  { date: Date; clicks: number; impressions: number; ctr: number; position: number }
interface RawPage    { pageUrl: string; clicks: number; impressions: number; ctr: number; position: number }
interface RawKeyword { keyword: string; clicks: number; impressions: number; ctr: number; position: number }
interface RawCountry { country: string; clicks: number; impressions: number; ctr: number; position: number }

interface RawSite {
  id: string
  url: string
  displayName: string | null
  color: string
  lastSynced: Date | null
  metrics:  RawMetric[]
  pages:    RawPage[]
  keywords: RawKeyword[]
  countries: RawCountry[]
}

export async function GET() {
  const sites: RawSite[] = await db.site.findMany({
    orderBy: { createdAt: 'asc' },
    include: {
      metrics:   { orderBy: { date: 'asc' } },
      pages:     { orderBy: { clicks: 'desc' }, take: 10 },
      keywords:  { orderBy: { clicks: 'desc' }, take: 10 },
      countries: { orderBy: { clicks: 'desc' } },
    },
  }) as RawSite[]

  const result = sites.map((site: RawSite) => {
    const totalClicks = site.metrics.reduce((s: number, m: RawMetric) => s + m.clicks, 0)
    const totalImpr   = site.metrics.reduce((s: number, m: RawMetric) => s + m.impressions, 0)
    const avgCtr = site.metrics.length
      ? site.metrics.reduce((s: number, m: RawMetric) => s + m.ctr, 0) / site.metrics.length
      : 0
    const avgPos = site.metrics.length
      ? site.metrics.reduce((s: number, m: RawMetric) => s + m.position, 0) / site.metrics.length
      : 0

    const half       = Math.floor(site.metrics.length / 2)
    const prevClicks = site.metrics.slice(0, half).reduce((s: number, m: RawMetric) => s + m.clicks, 0)
    const currClicks = site.metrics.slice(half).reduce((s: number, m: RawMetric) => s + m.clicks, 0)
    const trend      = prevClicks > 0 ? ((currClicks - prevClicks) / prevClicks) * 100 : 0

    return {
      id:          site.id,
      url:         site.url,
      displayName: site.displayName,
      color:       site.color,
      lastSynced:  site.lastSynced?.toISOString() ?? null,
      totals: {
        clicks:     totalClicks,
        impressions: totalImpr,
        ctr:        Number(avgCtr.toFixed(1)),
        position:   Number(avgPos.toFixed(1)),
        trend:      Number(trend.toFixed(1)),
      },
      metrics: site.metrics.map((m: RawMetric) => ({
        date:        m.date.toISOString().split('T')[0],
        clicks:      m.clicks,
        impressions: m.impressions,
        ctr:         Number(m.ctr.toFixed(1)),
        position:    Number(m.position.toFixed(1)),
      })),
      pages: site.pages.map((p: RawPage) => ({
        pageUrl:     p.pageUrl,
        clicks:      p.clicks,
        impressions: p.impressions,
        ctr:         Number(p.ctr.toFixed(1)),
        position:    Number(p.position.toFixed(1)),
      })),
      keywords: site.keywords.map((k: RawKeyword) => ({
        keyword:     k.keyword,
        clicks:      k.clicks,
        impressions: k.impressions,
        ctr:         Number(k.ctr.toFixed(1)),
        position:    Number(k.position.toFixed(1)),
      })),
      countries: site.countries.map((c: RawCountry) => ({
        country:     c.country,
        clicks:      c.clicks,
        impressions: c.impressions,
        ctr:         Number(c.ctr.toFixed(1)),
        position:    Number(c.position.toFixed(1)),
      })),
    }
  })

  return Response.json(result)
}
