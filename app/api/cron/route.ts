import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { syncSite } from '@/lib/gsc'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret') ?? new URL(req.url).searchParams.get('secret')
  if (secret !== process.env.CRON_SECRET) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const sites = await db.site.findMany({
    where: { active: true, account: { connected: true } },
    select: { id: true, url: true },
  })

  const results: { url: string; ok: boolean; error?: string }[] = []

  for (const site of sites) {
    try {
      await syncSite(site.id)
      results.push({ url: site.url, ok: true })
    } catch (e: any) {
      results.push({ url: site.url, ok: false, error: e.message })
    }
  }

  console.log(`Cron sync: ${results.filter(r => r.ok).length}/${results.length} ok`)
  return Response.json({ synced: results.length, results })
}
