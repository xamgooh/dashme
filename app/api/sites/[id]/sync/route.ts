import { NextRequest } from 'next/server'
import { syncSite } from '@/lib/gsc'
export const dynamic = 'force-dynamic'
export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await syncSite(params.id)
    return Response.json({ ok: true })
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}
