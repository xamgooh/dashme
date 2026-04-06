import { db } from '@/lib/db'
export const dynamic = 'force-dynamic'

export async function GET() {
  const tags = await db.tag.findMany({
    orderBy: { name: 'asc' },
    include: { sites: { include: { site: { select: { id: true, displayName: true, url: true, color: true } } } } },
  })
  return Response.json(tags.map((t: any) => ({
    id: t.id, name: t.name, color: t.color,
    sites: t.sites.map((st: any) => ({ id: st.site.id, displayName: st.site.displayName, url: st.site.url, color: st.site.color })),
  })))
}

export async function POST(req: Request) {
  const { name, color } = await req.json()
  if (!name?.trim()) return Response.json({ error: 'Name required' }, { status: 400 })
  try {
    const tag = await db.tag.create({ data: { name: name.trim(), color: color ?? '#818cf8' } })
    return Response.json({ id: tag.id, name: tag.name, color: tag.color, sites: [] })
  } catch {
    return Response.json({ error: 'Tag already exists' }, { status: 409 })
  }
}
