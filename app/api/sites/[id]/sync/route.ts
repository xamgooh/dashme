import { NextRequest } from 'next/server'
import { syncSite } from '@/lib/gsc'
import { db } from '@/lib/db'
export const dynamic = 'force-dynamic'

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const site = await db.site.findUnique({ where: { id: params.id }, select: { active: true } })
    if (!site?.active) return Response.json({ skipped: true })
    await syncSite(params.id)
    return Response.json({ ok: true })
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}
