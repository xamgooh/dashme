import { db } from '@/lib/db'
export const dynamic = 'force-dynamic'
interface M { date: Date; clicks: number; impressions: number; ctr: number; position: number }
interface P { pageUrl: string; clicks: number; impressions: number; ctr: number; position: number }
interface K { keyword: string; clicks: number; impressions: number; ctr: number; position: number }
interface C { country: string; clicks: number; impressions: number; ctr: number; position: number }
interface S { id: string; url: string; displayName: string|null; color: string; lastSynced: Date|null; metrics: M[]; pages: P[]; keywords: K[]; countries: C[] }
export async function GET() {
  const sites: S[] = await db.site.findMany({ orderBy: { createdAt: 'asc' }, include: { metrics: { orderBy: { date: 'asc' } }, pages: { orderBy: { clicks: 'desc' }, take: 10 }, keywords: { orderBy: { clicks: 'desc' }, take: 10 }, countries: { orderBy: { clicks: 'desc' } } } }) as S[]
  return Response.json(sites.map((site: S) => {
    const tc = site.metrics.reduce((s: number, m: M) => s+m.clicks, 0)
    const ti = site.metrics.reduce((s: number, m: M) => s+m.impressions, 0)
    const ac = site.metrics.length ? site.metrics.reduce((s: number, m: M) => s+m.ctr, 0)/site.metrics.length : 0
    const ap = site.metrics.length ? site.metrics.reduce((s: number, m: M) => s+m.position, 0)/site.metrics.length : 0
    const half = Math.floor(site.metrics.length/2)
    const prev = site.metrics.slice(0,half).reduce((s: number, m: M) => s+m.clicks, 0)
    const curr = site.metrics.slice(half).reduce((s: number, m: M) => s+m.clicks, 0)
    return { id: site.id, url: site.url, displayName: site.displayName, color: site.color, lastSynced: site.lastSynced?.toISOString() ?? null,
      totals: { clicks: tc, impressions: ti, ctr: Number(ac.toFixed(1)), position: Number(ap.toFixed(1)), trend: Number((prev > 0 ? ((curr-prev)/prev)*100 : 0).toFixed(1)) },
      metrics: site.metrics.map((m: M) => ({ date: m.date.toISOString().split('T')[0], clicks: m.clicks, impressions: m.impressions, ctr: Number(m.ctr.toFixed(1)), position: Number(m.position.toFixed(1)) })),
      pages: site.pages.map((p: P) => ({ pageUrl: p.pageUrl, clicks: p.clicks, impressions: p.impressions, ctr: Number(p.ctr.toFixed(1)), position: Number(p.position.toFixed(1)) })),
      keywords: site.keywords.map((k: K) => ({ keyword: k.keyword, clicks: k.clicks, impressions: k.impressions, ctr: Number(k.ctr.toFixed(1)), position: Number(k.position.toFixed(1)) })),
      countries: site.countries.map((c: C) => ({ country: c.country, clicks: c.clicks, impressions: c.impressions, ctr: Number(c.ctr.toFixed(1)), position: Number(c.position.toFixed(1)) })),
    }
  }))
}
