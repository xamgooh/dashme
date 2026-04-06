import { db } from '@/lib/db'
export const dynamic = 'force-dynamic'

export async function GET() {
  const accounts = await db.account.findMany({
    orderBy: { createdAt: 'asc' },
    include: {
      sites: { orderBy: { createdAt: 'asc' } },
    },
  })
  return Response.json(accounts.map((a: any) => ({
    id:        a.id,
    email:     a.email,
    connected: a.connected,
    createdAt: a.createdAt.toISOString(),
    sites: a.sites.map((s: any) => ({
      id:          s.id,
      url:         s.url,
      displayName: s.displayName,
      active:      s.active,
      color:       s.color,
      lastSynced:  s.lastSynced?.toISOString() ?? null,
    })),
  })))
}
